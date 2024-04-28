import { DataSource, Repository } from "typeorm";
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Coffee } from "./entities/coffee.entity";
import { Event } from "../events/entities/event.entity";
import { Flavor } from "./entities/flavor.entity";
import { CreateCoffeeDto } from "./dto/create-coffee.dto";
import { UpdateCoffeeDto } from "./dto/update-coffee.dto";
import { PaginationQueryDto } from "../common/pagination-query.dto";

@Injectable()
export class CoffeesService {
  constructor(
    @InjectRepository(Coffee)
    private readonly coffeeRepository: Repository<Coffee>,
    @InjectRepository(Flavor)
    private readonly flavorRepository: Repository<Flavor>,

    private readonly dataSource: DataSource,
  ) {}

  findAll(paginationQuery: PaginationQueryDto): Promise<Coffee[]> {
    const { limit, offset } = paginationQuery;
    return this.coffeeRepository.find({
      relations: { flavors: true },
      order: { id: 'ASC' },
      skip: offset,
      take: limit,
    });
  }

  async findOne(id: number): Promise<Coffee> {
    const coffee: Coffee | undefined = await this.coffeeRepository.findOne({
      where: { id },
      relations: { flavors: true },
    });

    if (!coffee) {
      throw new NotFoundException(`Coffee id: ${id} was not found`);
    }

    return coffee;
  }

  async create(createCoffeeDto: CreateCoffeeDto): Promise<Coffee> {
    const flavors: Flavor[] = await Promise.all(
      createCoffeeDto.flavors.map(flavor => this.preloadCoffeeFlavorByName(flavor))
    );
    const coffee: Coffee = this.coffeeRepository.create({
      ...createCoffeeDto,
      flavors,
    });
    return this.coffeeRepository.save(coffee);
  }

  async update(id: number, updateCoffeeDto: UpdateCoffeeDto): Promise<Coffee> {
    const flavors: Flavor[] | undefined = updateCoffeeDto.flavors && (
      await Promise.all(updateCoffeeDto.flavors.map(flavor => this.preloadCoffeeFlavorByName(flavor)))
    );
    const existingCoffee: Coffee | undefined = await this.coffeeRepository.preload({ id, ...updateCoffeeDto, flavors });

    if (!existingCoffee) {
      throw new NotFoundException(`Coffee id: ${id} was not found`);
    }

    return this.coffeeRepository.save(existingCoffee);
  }

  async remove(id: number) {
    const coffee = await this.findOne(id);
    return this.coffeeRepository.remove(coffee);
  }

  async recommendCoffee(coffee: Coffee) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      coffee.recommendations++

      const recommendEvent = new Event();
      recommendEvent.name = 'recommend_coffee';
      recommendEvent.type = 'coffee';
      recommendEvent.payload = { coffeeId: coffee.id }

      await queryRunner.manager.save(coffee);
      await queryRunner.manager.save(recommendEvent);

      await queryRunner.commitTransaction();
    } catch(exception) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  private async preloadCoffeeFlavorByName(name: string): Promise<Flavor> {
    const flavor: Flavor | undefined = await this.flavorRepository.findOne({ where: { name } });

    if (flavor) {
      return flavor;
    }

    return this.flavorRepository.create({ name });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { Coffee } from "./entities/coffee.entity";

@Injectable()
export class CoffeesService {
  private coffees: Coffee[] = [
    {
      id: 1,
      name: 'Shipwreck Roast',
      brand: 'Buddy Brew',
      flavors: ['chocolate', 'vanilla'],
    }
  ];

  findAll(): Coffee[] {
    return this.coffees;
  }

  findOne(id: number): Coffee {
    const coffee: Coffee | undefined = this.coffees.find(coffee => coffee.id === id);

    if (!coffee) {
      throw new NotFoundException(`Coffee id: ${id} was not found`);
    }

    return coffee;
  }

  create(createCoffeeDto: any) {
    this.coffees.push(createCoffeeDto);
  }

  update(id: number, updateCoffeeDto: any) {
    const existingCoffee = this.findOne(id);

    if (existingCoffee) {
      // update the existing entity
    }
  }

  remove(id: number) {
    const coffeeIndex = this.coffees.findIndex(coffee => coffee.id === id);

    if (coffeeIndex >= 0) {
      this.coffees.splice(coffeeIndex, 1);
    }
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { CoffeesController } from "./coffees.controller";
import { CoffeesService } from "./coffees.service";
import { Coffee } from "./entities/coffee.entity";
import { Event } from "../events/entities/event.entity";
import { Flavor } from "./entities/flavor.entity";

@Module({
  controllers: [CoffeesController],
  imports: [
    TypeOrmModule.forFeature([Coffee, Flavor, Event]),
  ],
  providers: [CoffeesService],
})
export class CoffeesModule {}

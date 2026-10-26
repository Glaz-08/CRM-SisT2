import { Module } from '@nestjs/common';
import { HealthDbController } from './health-db.controller';

@Module({
  controllers: [HealthDbController],
})
export class HealthDbModule {}

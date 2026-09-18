import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { ClientesListener } from './clientes.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente])],
  controllers: [ClientesController],
  providers: [ClientesService, ClientesListener],
  exports: [ClientesService],
})
export class ClientesModule {}

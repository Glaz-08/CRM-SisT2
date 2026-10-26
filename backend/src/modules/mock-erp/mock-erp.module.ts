import { Module } from '@nestjs/common';
import { IntegracionModule } from '../integracion/integracion.module';
import { MockClientesController } from './mock-clientes.controller';
import { MockEmpleadosController } from './mock-empleados.controller';
import { MockEnabledGuard } from './mock-enabled.guard';
import { MockEventStoreService } from './mock-event-store.service';
import { MockEventsController } from './mock-events.controller';
import { MockFacturacionController } from './mock-facturacion.controller';
import { MockInventarioController } from './mock-inventario.controller';

/**
 * ERP simulado para demo: maestros y webhooks en memoria.
 * Todos los endpoints quedan protegidos por `ENABLE_MOCKS`.
 */
@Module({
  imports: [IntegracionModule],
  controllers: [
    MockClientesController,
    MockEmpleadosController,
    MockFacturacionController,
    MockInventarioController,
    MockEventsController,
  ],
  providers: [MockEnabledGuard, MockEventStoreService],
})
export class MockErpModule {}

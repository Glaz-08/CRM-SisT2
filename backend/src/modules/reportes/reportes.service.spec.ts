import { DataSource } from 'typeorm';
import { ReportesService } from './reportes.service';

describe('ReportesService', () => {
  it('arma el resumen con los cuatro conjuntos de métricas', async () => {
    const dataSource = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ estado: 'pendiente', total: 2 }])
        .mockResolvedValueOnce([{ promedioDias: 2.5, completados: 4 }])
        .mockResolvedValueOnce([{ idEmpleado: 1, abiertos: 2 }])
        .mockResolvedValueOnce([{ canal: 'whatsapp', total: 3 }]),
    };

    const service = new ReportesService(dataSource as unknown as DataSource);

    const result = await service.resumen();

    expect(result.seguimientosPorEstado).toEqual([
      { estado: 'pendiente', total: 2 },
    ]);
    expect(result.tiempoRespuestaPromedioDias).toBe(2.5);
    expect(result.seguimientosCompletados).toBe(4);
    expect(result.casosAbiertosPorEmpleado).toEqual([
      { idEmpleado: 1, abiertos: 2 },
    ]);
    expect(result.interaccionesPorCanal).toEqual([
      { canal: 'whatsapp', total: 3 },
    ]);
    expect(dataSource.query).toHaveBeenCalledTimes(4);
  });

  it('devuelve null cuando no hay seguimientos completados', async () => {
    const dataSource = {
      query: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ promedioDias: null, completados: 0 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    };

    const service = new ReportesService(dataSource as unknown as DataSource);

    const result = await service.resumen();

    expect(result.tiempoRespuestaPromedioDias).toBeNull();
    expect(result.seguimientosCompletados).toBe(0);
  });
});

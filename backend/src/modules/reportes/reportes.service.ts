import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface EstadoRow {
  estado: string;
  total: number;
}

export interface TiempoRespuestaRow {
  promedioDias: number | null;
  completados: number;
}

export interface CasoAbiertoRow {
  idEmpleado: number;
  abiertos: number;
}

export interface CanalRow {
  canal: string;
  total: number;
}

export interface ResumenReporte {
  generadoEn: string;
  seguimientosPorEstado: EstadoRow[];
  tiempoRespuestaPromedioDias: number | null;
  seguimientosCompletados: number;
  casosAbiertosPorEmpleado: CasoAbiertoRow[];
  interaccionesPorCanal: CanalRow[];
}

/**
 * Calcula métricas agregadas directamente en PostgreSQL.
 * El tiempo de respuesta es planificado (`fecha_programada - fecha`), no real.
 */
@Injectable()
export class ReportesService {
  constructor(private readonly dataSource: DataSource) {}

  /** Ejecuta las cuatro consultas de métricas en paralelo. */
  async resumen(): Promise<ResumenReporte> {
    const [porEstado, tiempoRespuesta, casosAbiertos, porCanal] =
      await Promise.all([
        this.dataSource.query<EstadoRow[]>(`
          SELECT estado, COUNT(*)::int AS total
          FROM crm.seguimiento_crm
          GROUP BY estado
          ORDER BY estado
        `),
        this.dataSource.query<TiempoRespuestaRow[]>(`
          SELECT
            ROUND(AVG(s.fecha_programada - i.fecha)::numeric, 2)::float AS "promedioDias",
            COUNT(*)::int AS "completados"
          FROM crm.seguimiento_crm s
          JOIN crm.interaccion_crm i
            ON i.id_interaccion = s.id_interaccion
          WHERE s.estado = 'completado'
        `),
        this.dataSource.query<CasoAbiertoRow[]>(`
          SELECT i.id_empleado AS "idEmpleado", COUNT(*)::int AS "abiertos"
          FROM crm.seguimiento_crm s
          JOIN crm.interaccion_crm i
            ON i.id_interaccion = s.id_interaccion
          WHERE s.estado IN ('pendiente', 'en_proceso')
          GROUP BY i.id_empleado
          ORDER BY "abiertos" DESC, i.id_empleado ASC
        `),
        this.dataSource.query<CanalRow[]>(`
          SELECT canal, COUNT(*)::int AS "total"
          FROM crm.interaccion_crm
          GROUP BY canal
          ORDER BY "total" DESC, canal ASC
        `),
      ]);

    const tiempo = tiempoRespuesta[0];

    return {
      generadoEn: new Date().toISOString(),
      seguimientosPorEstado: porEstado,
      tiempoRespuestaPromedioDias: tiempo?.promedioDias ?? null,
      seguimientosCompletados: tiempo?.completados ?? 0,
      casosAbiertosPorEmpleado: casosAbiertos,
      interaccionesPorCanal: porCanal,
    };
  }
}

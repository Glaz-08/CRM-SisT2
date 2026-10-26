import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface DriverError {
  code?: string;
}

/**
 * Traduce errores de PostgreSQL a respuestas HTTP claras.
 * Sin esto, una violación de CHECK/FK terminaría como 500.
 */
@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter {
  private readonly logger = new Logger(QueryFailedFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const code = (exception as QueryFailedError & { driverError?: DriverError })
      .driverError?.code;

    let status = HttpStatus.BAD_REQUEST;
    let message = 'La operación no cumple las reglas de la base de datos';

    switch (code) {
      case '23505':
        status = HttpStatus.CONFLICT;
        message = 'El registro ya existe';
        break;
      case '23503':
        message = 'La referencia indicada no existe';
        break;
      case '23514':
        message = 'Los datos no cumplen una restricción de la base de datos';
        break;
      case '22P02':
        message = 'Formato de dato inválido';
        break;
      default:
        break;
    }

    this.logger.warn(
      `QueryFailed ${code ?? 'sin código'}: ${exception.message}`,
    );

    response.status(status).json({
      statusCode: status,
      message,
      error: HttpStatus[status],
    });
  }
}

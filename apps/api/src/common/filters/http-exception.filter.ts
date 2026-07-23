import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtre global : normalise toutes les erreurs en réponse JSON cohérente
 * et évite de divulguer des stack traces au client en cas d'erreur 500.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Erreur interne du serveur.';
    let error = 'Internal Server Error';

    if (isHttp) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        message = (body.message as string | string[]) ?? exception.message;
        error = (body.error as string) ?? exception.name;
      }
    } else if (exception instanceof Error) {
      // Log complet côté serveur uniquement.
      this.logger.error(exception.message, exception.stack);
    }

    // Normalisation du libellé d'erreur par statut (ex: 429 -> Too Many Requests).
    const STATUS_LABELS: Record<number, string> = {
      400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
      404: 'Not Found', 409: 'Conflict', 413: 'Payload Too Large',
      422: 'Unprocessable Entity', 429: 'Too Many Requests',
    };
    if ((!error || error === 'Internal Server Error') && STATUS_LABELS[status]) {
      error = STATUS_LABELS[status];
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

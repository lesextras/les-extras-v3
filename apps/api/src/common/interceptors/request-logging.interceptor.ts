import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { catchError, throwError } from "rxjs";

type RequestLike = {
  method?: string;
  originalUrl?: string;
  url?: string;
  user?: { id?: string };
};

function getStatus(error: unknown): number {
  if (
    error &&
    typeof error === "object" &&
    "getStatus" in error &&
    typeof (error as { getStatus?: unknown }).getStatus === "function"
  ) {
    return (error as { getStatus: () => number }).getStatus();
  }

  return 500;
}

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("ApiRequest");

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestLike>();
    const startedAt = Date.now();

    return next.handle().pipe(
      catchError((error: unknown) => {
        const status = getStatus(error);
        if (status >= 500) {
          const method = request.method ?? "UNKNOWN";
          const path = request.originalUrl ?? request.url ?? "unknown-path";
          const userId = request.user?.id ?? "anonymous";
          const durationMs = Date.now() - startedAt;
          const stack = error instanceof Error ? error.stack : undefined;

          this.logger.error(
            `${method} ${path} ${status} ${durationMs}ms user=${userId}`,
            stack,
          );
        }

        return throwError(() => error);
      }),
    );
  }
}

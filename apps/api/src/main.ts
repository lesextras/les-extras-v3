import "./instrument";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { HttpAdapterHost } from "@nestjs/core";
import { SentryGlobalFilter } from "@sentry/nestjs/setup";
import helmet from "helmet";
import { join } from "path";
import { AppModule } from "./app.module";

const DEFAULT_CORS_ORIGINS = [
  "https://les-extras.com",
  "https://www.les-extras.com",
  "https://desk.les-extras.com",
  "https://api.les-extras.com",
];

function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) {
    return DEFAULT_CORS_ORIGINS;
  }

  const parsed = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : DEFAULT_CORS_ORIGINS;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const allowedOrigins = parseCorsOrigins();

  app.enableCors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
  });

  app.use(helmet());

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryGlobalFilter(httpAdapter));
  // Serve uploaded files (diplomas, etc.) at /uploads/* — in production replace with S3/CDN
  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads" });
  await app.listen(process.env.PORT ?? 3001, "0.0.0.0");
}

void bootstrap();

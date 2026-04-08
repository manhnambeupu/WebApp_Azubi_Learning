import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const imgSrcAllowlist = ["'self'", 'data:', 'blob:'];
  const minioPublicUrl = process.env.MINIO_PUBLIC_URL;
  if (minioPublicUrl) {
    try {
      imgSrcAllowlist.push(new URL(minioPublicUrl).origin);
    } catch {
      // MINIO_PUBLIC_URL may be relative (e.g. /minio) and is already covered by 'self'
    }
  }

  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: imgSrcAllowlist,
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : 'http://localhost:3000';

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Azubi Learning API')
      .setDescription(
        'API documentation for Azubi Webapp — Hệ thống đào tạo nghiệp vụ khách sạn',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refreshToken')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = Number(process.env.BACKEND_PORT ?? 3001);
  await app.listen(port);
}
void bootstrap();

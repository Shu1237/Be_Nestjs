 (global as any).crypto = require('crypto');
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpErrorInterceptor } from './common/interceptors/http-error.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // register interceptor
  app.useGlobalInterceptors(new HttpErrorInterceptor());
  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Movie Theater API')
    .setDescription('API documentation for movie theater project')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })

    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001, () =>
    console.log('Server is running on port http://localhost:3001/api'),
  );
}
bootstrap();

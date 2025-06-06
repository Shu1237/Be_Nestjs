import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

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

  await app.listen(3001, '0.0.0.0', () =>
    console.log(
      'Server is running on port 3001' +
        '\nSwagger UI is available at http://localhost:3001/api',
      '\nSwagger UI is available at http://ec2-16-176-182-83.ap-southeast-2.compute.amazonaws.com:3001/api',
    ),
  );
}

bootstrap();

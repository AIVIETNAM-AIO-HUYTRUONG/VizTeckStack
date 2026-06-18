import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('VizTeckStack API')
    .setDescription('Roadmap visualization REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api-docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`api-gateway: http://localhost:${port}`);
  console.log(`GraphQL:     http://localhost:${port}/graphql`);
  console.log(`Swagger:     http://localhost:${port}/api-docs`);
}
bootstrap();

import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = process.env.GRPC_PORT ?? '5001';
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'roadmap',
      protoPath: join(__dirname, '../../../packages/proto/roadmap.proto'),
      url: `0.0.0.0:${port}`,
    },
  });
  await app.listen();
  console.log(`svc-roadmap gRPC listening on :${port}`);
}
bootstrap();

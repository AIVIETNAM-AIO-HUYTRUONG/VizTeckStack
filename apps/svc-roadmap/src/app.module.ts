// apps/svc-roadmap/src/app.module.ts
import { Module } from '@nestjs/common';
import { RoadmapModule } from './roadmap/roadmap.module';

@Module({ imports: [RoadmapModule] })
export class AppModule {}

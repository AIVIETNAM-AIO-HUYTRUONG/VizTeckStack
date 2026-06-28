import { Module } from '@nestjs/common';
import { PrismaRoadmapRepository } from './prisma-roadmap.repository';

@Module({
  providers: [
    { provide: 'IRoadmapRepository', useClass: PrismaRoadmapRepository },
  ],
  exports: ['IRoadmapRepository'],
})
export class DatabaseModule {}

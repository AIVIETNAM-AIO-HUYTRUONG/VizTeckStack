import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository, CreateRoadmapData } from '../../../domain/repositories/roadmap.repository';
import type { Roadmap } from '../../../domain/entities/roadmap.entity';

@Injectable()
export class CreateRoadmapUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(data: CreateRoadmapData): Promise<Roadmap> { return this.repo.create(data); }
}

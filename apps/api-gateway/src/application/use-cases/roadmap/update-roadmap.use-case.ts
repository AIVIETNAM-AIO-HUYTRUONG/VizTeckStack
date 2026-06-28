import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository, UpdateRoadmapData } from '../../../domain/repositories/roadmap.repository';
import type { Roadmap } from '../../../domain/entities/roadmap.entity';

@Injectable()
export class UpdateRoadmapUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(id: string, data: UpdateRoadmapData): Promise<Roadmap> { return this.repo.update(id, data); }
}

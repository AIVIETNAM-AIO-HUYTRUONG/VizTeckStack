import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository, RoadmapDetail } from '../../../domain/repositories/roadmap.repository';

@Injectable()
export class GetRoadmapUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(slug: string): Promise<RoadmapDetail | null> { return this.repo.findBySlug(slug); }
}

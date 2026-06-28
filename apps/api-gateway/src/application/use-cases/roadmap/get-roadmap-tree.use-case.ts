import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository, RoadmapTree } from '../../../domain/repositories/roadmap.repository';

@Injectable()
export class GetRoadmapTreeUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(slug: string): Promise<RoadmapTree> { return this.repo.getRoadmapTree(slug); }
}

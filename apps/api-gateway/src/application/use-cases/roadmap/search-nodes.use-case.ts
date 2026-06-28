import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository, SearchParams, SearchResult } from '../../../domain/repositories/roadmap.repository';

@Injectable()
export class SearchNodesUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}

  async execute(params: SearchParams, isAdmin: boolean): Promise<SearchResult[]> {
    const results = await this.repo.searchNodes(params);
    if (isAdmin) return results;

    const roadmaps = await this.repo.findAll();
    const publicIds = new Set(roadmaps.filter(r => r.status === 'PUBLIC').map(r => r.id));
    return results.filter(r => publicIds.has(r.roadmapId));
  }
}

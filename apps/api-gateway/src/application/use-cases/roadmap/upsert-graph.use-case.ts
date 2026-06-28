import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository, NodeInputData, EdgeInputData, RoadmapDetail } from '../../../domain/repositories/roadmap.repository';

@Injectable()
export class UpsertGraphUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(roadmapId: string, nodes: NodeInputData[], edges: EdgeInputData[]): Promise<RoadmapDetail> {
    return this.repo.upsertGraph(roadmapId, nodes, edges);
  }
}

import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository, NodeDetail } from '../../../domain/repositories/roadmap.repository';

@Injectable()
export class GetNodeUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(id: string): Promise<NodeDetail | null> { return this.repo.findNodeById(id); }
}

import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository } from '../../../domain/repositories/roadmap.repository';
import type { Node } from '../../../domain/entities/node.entity';

@Injectable()
export class UpdateNodeCoverUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(id: string, coverImage: string): Promise<Node> {
    return this.repo.updateNodeField(id, { coverImage: coverImage || null });
  }
}

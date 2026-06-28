import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository } from '../../../domain/repositories/roadmap.repository';
import type { Node } from '../../../domain/entities/node.entity';

@Injectable()
export class UpdateNodeContentUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(id: string, content: string): Promise<Node> {
    return this.repo.updateNodeField(id, { content: content ? JSON.parse(content) : null });
  }
}

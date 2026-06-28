import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository } from '../../../domain/repositories/roadmap.repository';

@Injectable()
export class DeleteRoadmapUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(id: string): Promise<void> { return this.repo.delete(id); }
}

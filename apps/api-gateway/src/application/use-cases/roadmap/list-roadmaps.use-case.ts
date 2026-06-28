import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository } from '../../../domain/repositories/roadmap.repository';
import type { Roadmap } from '../../../domain/entities/roadmap.entity';

@Injectable()
export class ListRoadmapsUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(): Promise<Roadmap[]> { return this.repo.findAll(); }
}

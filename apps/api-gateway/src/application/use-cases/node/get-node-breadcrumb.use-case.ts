import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository, BreadcrumbItem } from '../../../domain/repositories/roadmap.repository';

@Injectable()
export class GetNodeBreadcrumbUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(id: string): Promise<BreadcrumbItem[]> { return this.repo.getNodeBreadcrumb(id); }
}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { RoadmapResolver } from './roadmap.resolver';
import { NodeResolver } from './node.resolver';
import { RoadmapRestController } from './roadmap.rest.controller';
import { ListRoadmapsUseCase } from '../application/use-cases/roadmap/list-roadmaps.use-case';
import { GetRoadmapUseCase } from '../application/use-cases/roadmap/get-roadmap.use-case';
import { CreateRoadmapUseCase } from '../application/use-cases/roadmap/create-roadmap.use-case';
import { UpdateRoadmapUseCase } from '../application/use-cases/roadmap/update-roadmap.use-case';
import { DeleteRoadmapUseCase } from '../application/use-cases/roadmap/delete-roadmap.use-case';
import { UpsertGraphUseCase } from '../application/use-cases/roadmap/upsert-graph.use-case';
import { GetRoadmapTreeUseCase } from '../application/use-cases/roadmap/get-roadmap-tree.use-case';
import { SearchNodesUseCase } from '../application/use-cases/roadmap/search-nodes.use-case';
import { GetNodeUseCase } from '../application/use-cases/node/get-node.use-case';
import { GetNodeBreadcrumbUseCase } from '../application/use-cases/node/get-node-breadcrumb.use-case';
import { UpdateNodeContentUseCase } from '../application/use-cases/node/update-node-content.use-case';
import { UpdateNodeTitleUseCase } from '../application/use-cases/node/update-node-title.use-case';
import { UpdateNodeCoverUseCase } from '../application/use-cases/node/update-node-cover.use-case';
import { UpdateNodeIconUseCase } from '../application/use-cases/node/update-node-icon.use-case';

const useCases = [
  ListRoadmapsUseCase, GetRoadmapUseCase, CreateRoadmapUseCase,
  UpdateRoadmapUseCase, DeleteRoadmapUseCase, UpsertGraphUseCase,
  GetRoadmapTreeUseCase, SearchNodesUseCase,
  GetNodeUseCase, GetNodeBreadcrumbUseCase,
  UpdateNodeContentUseCase, UpdateNodeTitleUseCase,
  UpdateNodeCoverUseCase, UpdateNodeIconUseCase,
];

@Module({
  imports: [DatabaseModule],
  providers: [...useCases, RoadmapResolver, NodeResolver],
  controllers: [RoadmapRestController],
})
export class RoadmapModule {}

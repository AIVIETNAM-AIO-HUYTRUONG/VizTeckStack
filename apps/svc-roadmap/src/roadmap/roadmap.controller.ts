// apps/svc-roadmap/src/roadmap/roadmap.controller.ts
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RoadmapService } from './roadmap.service';
import { Empty, SlugRequest, IdRequest, CreateRoadmapRequest, UpdateRoadmapRequest, UpsertGraphRequest, UpdateNodeContentRequest, UpdateNodeTitleRequest, UpdateNodeCoverRequest, UpdateNodeIconRequest, RoadmapTreeRequest } from '@vizteck/proto';

@Controller()
export class RoadmapController {
  constructor(private readonly svc: RoadmapService) {}

  @GrpcMethod('RoadmapService', 'GetRoadmaps')
  getRoadmaps(data: Empty) { return this.svc.getRoadmaps(data); }

  @GrpcMethod('RoadmapService', 'GetRoadmap')
  getRoadmap(data: SlugRequest) { return this.svc.getRoadmap(data); }

  @GrpcMethod('RoadmapService', 'GetNode')
  getNode(data: IdRequest) { return this.svc.getNode(data); }

  @GrpcMethod('RoadmapService', 'CreateRoadmap')
  createRoadmap(data: CreateRoadmapRequest) { return this.svc.createRoadmap(data); }

  @GrpcMethod('RoadmapService', 'UpdateRoadmap')
  updateRoadmap(data: UpdateRoadmapRequest) { return this.svc.updateRoadmap(data); }

  @GrpcMethod('RoadmapService', 'DeleteRoadmap')
  deleteRoadmap(data: IdRequest) { return this.svc.deleteRoadmap(data); }

  @GrpcMethod('RoadmapService', 'UpsertGraph')
  upsertGraph(data: UpsertGraphRequest) { return this.svc.upsertGraph(data); }

  @GrpcMethod('RoadmapService', 'UpdateNodeContent')
  updateNodeContent(data: UpdateNodeContentRequest) { return this.svc.updateNodeContent(data); }

  @GrpcMethod('RoadmapService', 'UpdateNodeTitle')
  updateNodeTitle(data: UpdateNodeTitleRequest) { return this.svc.updateNodeTitle(data); }

  @GrpcMethod('RoadmapService', 'UpdateNodeCover')
  updateNodeCover(data: UpdateNodeCoverRequest) { return this.svc.updateNodeCover(data); }

  @GrpcMethod('RoadmapService', 'UpdateNodeIcon')
  updateNodeIcon(data: UpdateNodeIconRequest) { return this.svc.updateNodeIcon(data); }

  @GrpcMethod('RoadmapService', 'GetNodeBreadcrumb')
  getNodeBreadcrumb(data: IdRequest) { return this.svc.getNodeBreadcrumb(data); }

  @GrpcMethod('RoadmapService', 'GetRoadmapTree')
  getRoadmapTree(data: RoadmapTreeRequest) { return this.svc.getRoadmapTree(data); }
}

import { Module } from '@nestjs/common';
import { RoadmapGrpcClient } from './roadmap.grpc-client';
import { RoadmapResolver } from './roadmap.resolver';
import { NodeResolver } from './node.resolver';
import { RoadmapRestController } from './roadmap.rest.controller';

@Module({
  providers: [RoadmapGrpcClient, RoadmapResolver, NodeResolver],
  controllers: [RoadmapRestController],
})
export class RoadmapModule {}

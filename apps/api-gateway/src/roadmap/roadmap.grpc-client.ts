import { Injectable, OnModuleInit } from "@nestjs/common";
import { Client, ClientGrpc, Transport } from "@nestjs/microservices";
import { join } from "path";
import { firstValueFrom, Observable } from "rxjs";

interface GrpcRoadmapService {
  getRoadmaps(data: object): Observable<any>;
  getRoadmap(data: { slug: string }): Observable<any>;
  getNode(data: { id: string }): Observable<any>;
  createRoadmap(data: object): Observable<any>;
  updateRoadmap(data: object): Observable<any>;
  deleteRoadmap(data: { id: string }): Observable<any>;
  upsertGraph(data: object): Observable<any>;
  updateNodeContent(data: { id: string; content: string }): Observable<any>;
  updateNodeTitle(data: { id: string; title: string }): Observable<any>;
  updateNodeCover(data: { id: string; coverImage: string }): Observable<any>;
  updateNodeIcon(data: { id: string; icon: string }): Observable<any>;
  getNodeBreadcrumb(data: { id: string }): Observable<any>;
}

@Injectable()
export class RoadmapGrpcClient implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: "roadmap",
      protoPath: join(__dirname, "../../../../packages/proto/roadmap.proto"),
      url: process.env.ROADMAP_SERVICE_URL ?? "localhost:5001",
    },
  })
  private client!: ClientGrpc;

  private svc!: GrpcRoadmapService;

  onModuleInit() {
    this.svc = this.client.getService<GrpcRoadmapService>("RoadmapService");
  }

  getRoadmaps() {
    return firstValueFrom(this.svc.getRoadmaps({}));
  }
  getRoadmap(slug: string) {
    return firstValueFrom(this.svc.getRoadmap({ slug }));
  }
  getNode(id: string) {
    return firstValueFrom(this.svc.getNode({ id }));
  }
  createRoadmap(data: object) {
    return firstValueFrom(this.svc.createRoadmap(data));
  }
  updateRoadmap(data: object) {
    return firstValueFrom(this.svc.updateRoadmap(data));
  }
  deleteRoadmap(id: string) {
    return firstValueFrom(this.svc.deleteRoadmap({ id }));
  }
  upsertGraph(data: object) {
    return firstValueFrom(this.svc.upsertGraph(data));
  }
  updateNodeContent(id: string, content: string) {
    return firstValueFrom(this.svc.updateNodeContent({ id, content }));
  }
  updateNodeTitle(id: string, title: string) {
    return firstValueFrom(this.svc.updateNodeTitle({ id, title }));
  }
  updateNodeCover(id: string, coverImage: string) {
    return firstValueFrom(this.svc.updateNodeCover({ id, coverImage }));
  }
  updateNodeIcon(id: string, icon: string) {
    return firstValueFrom(this.svc.updateNodeIcon({ id, icon }));
  }
  getNodeBreadcrumb(id: string) {
    return firstValueFrom(this.svc.getNodeBreadcrumb({ id }));
  }
}

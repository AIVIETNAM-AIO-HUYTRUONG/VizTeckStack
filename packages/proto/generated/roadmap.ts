// Auto-generated stub — replace with actual protoc output when protoc is available
import type { Observable } from 'rxjs';

export enum NodeType {
  ROADMAP = 0,
  LESSON = 1,
}

export interface Empty {}
export interface BoolResponse { success: boolean }
export interface IdRequest { id: string }
export interface SlugRequest { slug: string }
export interface RoadmapItem { id: string; slug: string; title: string; description: string; coverImage: string }
export interface NodeItem { id: string; roadmapId: string; type: NodeType; title: string; positionX: number; positionY: number; targetRoadmapId: string; content: string }
export interface EdgeItem { id: string; sourceId: string; targetId: string; label: string }
export interface RoadmapList { roadmaps: RoadmapItem[] }
export interface RoadmapDetail { roadmap?: RoadmapItem; nodes: NodeItem[]; edges: EdgeItem[] }
export interface NodeDetail { node?: NodeItem; targetRoadmap?: RoadmapItem }
export interface CreateRoadmapRequest { slug: string; title: string; description: string; coverImage: string }
export interface UpdateRoadmapRequest { id: string; title: string; description: string; coverImage: string }
export interface NodeInput { id: string; type: NodeType; title: string; positionX: number; positionY: number; targetRoadmapId: string; content: string }
export interface EdgeInput { sourceId: string; targetId: string; label: string }
export interface UpsertGraphRequest { roadmapId: string; nodes: NodeInput[]; edges: EdgeInput[] }

export interface RoadmapServiceClient {
  getRoadmaps(data: Empty): Observable<RoadmapList>;
  getRoadmap(data: SlugRequest): Observable<RoadmapDetail>;
  getNode(data: IdRequest): Observable<NodeDetail>;
  createRoadmap(data: CreateRoadmapRequest): Observable<RoadmapItem>;
  updateRoadmap(data: UpdateRoadmapRequest): Observable<RoadmapItem>;
  deleteRoadmap(data: IdRequest): Observable<BoolResponse>;
  upsertGraph(data: UpsertGraphRequest): Observable<RoadmapDetail>;
}

export interface RoadmapServiceController {
  getRoadmaps(data: Empty): Promise<RoadmapList> | Observable<RoadmapList> | RoadmapList;
  getRoadmap(data: SlugRequest): Promise<RoadmapDetail> | Observable<RoadmapDetail> | RoadmapDetail;
  getNode(data: IdRequest): Promise<NodeDetail> | Observable<NodeDetail> | NodeDetail;
  createRoadmap(data: CreateRoadmapRequest): Promise<RoadmapItem> | Observable<RoadmapItem> | RoadmapItem;
  updateRoadmap(data: UpdateRoadmapRequest): Promise<RoadmapItem> | Observable<RoadmapItem> | RoadmapItem;
  deleteRoadmap(data: IdRequest): Promise<BoolResponse> | Observable<BoolResponse> | BoolResponse;
  upsertGraph(data: UpsertGraphRequest): Promise<RoadmapDetail> | Observable<RoadmapDetail> | RoadmapDetail;
}

export const RoadmapServiceControllerMethods = () => (target: any) => target;
export const GrpcMethod = (...args: any[]) => (...decoratorArgs: any[]) => {};

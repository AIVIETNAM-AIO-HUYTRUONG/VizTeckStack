export type RoadmapStatus = 'DRAFT' | 'PUBLIC' | 'PRIVATE';

export interface Roadmap {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: RoadmapStatus;
  createdAt: Date;
}

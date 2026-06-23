import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ObjectType,
  Field,
  ID,
  Float,
  registerEnumType,
  InputType,
} from "@nestjs/graphql";

export enum NodeTypeEnum {
  ROADMAP = "ROADMAP",
  LESSON = "LESSON",
}
registerEnumType(NodeTypeEnum, { name: "NodeType" });

@ObjectType()
export class RoadmapDto {
  @Field(() => ID) @ApiProperty({ example: "clx1234abcd" }) id!: string;
  @Field() @ApiProperty({ example: "frontend" }) slug!: string;
  @Field() @ApiProperty({ example: "Frontend Developer" }) title!: string;
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: "Learn modern frontend development" })
  description?: string;
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: "https://example.com/cover.png" })
  coverImage?: string;
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: "DRAFT", enum: ["DRAFT", "PUBLIC", "PRIVATE"] })
  status?: string;
}

@ObjectType()
export class NodeDto {
  @Field(() => ID) @ApiProperty({ example: "node_001" }) id!: string;
  @Field() @ApiProperty({ example: "clx1234abcd" }) roadmapId!: string;
  @Field(() => NodeTypeEnum)
  @ApiProperty({ enum: NodeTypeEnum, example: NodeTypeEnum.LESSON })
  type!: NodeTypeEnum;
  @Field() @ApiProperty({ example: "HTML & CSS Basics" }) title!: string;
  @Field(() => Float, { nullable: true }) @ApiPropertyOptional({ example: 100 }) positionX?: number;
  @Field(() => Float, { nullable: true }) @ApiPropertyOptional({ example: 200 }) positionY?: number;
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: null })
  targetRoadmapId?: string;
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: null })
  content?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.jpg' })
  coverImage?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ example: '⚡' })
  icon?: string;
}

@ObjectType()
export class EdgeDto {
  @Field(() => ID) @ApiProperty({ example: "edge_001" }) id!: string;
  @Field() @ApiProperty({ example: "node_001" }) sourceId!: string;
  @Field() @ApiProperty({ example: "node_002" }) targetId!: string;
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: "next" })
  label?: string;
}

@ObjectType()
export class RoadmapDetailDto {
  @Field(() => RoadmapDto, { nullable: true }) roadmap?: RoadmapDto;
  @Field(() => [NodeDto]) nodes!: NodeDto[];
  @Field(() => [EdgeDto]) edges!: EdgeDto[];
}

@InputType()
export class CreateRoadmapInput {
  @Field() @ApiProperty({ example: "backend" }) slug!: string;
  @Field() @ApiProperty({ example: "Backend Developer" }) title!: string;
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: "Learn backend development with Node.js" })
  description?: string;
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: "https://example.com/backend.png" })
  coverImage?: string;
}

@InputType()
export class UpdateRoadmapInput {
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: "Backend Developer 2025" })
  title?: string;
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: "Updated description" })
  description?: string;
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: "https://example.com/new-cover.png" })
  coverImage?: string;
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: "PUBLIC", enum: ["DRAFT", "PUBLIC", "PRIVATE"] })
  status?: string;
}

@InputType()
export class NodeInput {
  @Field() @ApiProperty({ example: "node_001" }) id!: string;
  @Field(() => NodeTypeEnum)
  @ApiProperty({ enum: NodeTypeEnum, example: NodeTypeEnum.LESSON })
  type!: NodeTypeEnum;
  @Field() @ApiProperty({ example: "REST APIs" }) title!: string;
  @Field(() => Float, { nullable: true }) @ApiPropertyOptional({ example: 100 }) positionX?: number;
  @Field(() => Float, { nullable: true }) @ApiPropertyOptional({ example: 200 }) positionY?: number;
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: null })
  targetRoadmapId?: string;
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: null })
  content?: string;
}

@InputType()
export class EdgeInput {
  @Field() @ApiProperty({ example: "node_001" }) sourceId!: string;
  @Field() @ApiProperty({ example: "node_002" }) targetId!: string;
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: "next" })
  label?: string;
}

@InputType()
export class UpdateNodeContentInput {
  @Field()
  @ApiProperty({ example: '[{"type":"paragraph","content":[]}]', description: 'BlockNote JSON string' })
  content!: string;
}

@InputType()
export class UpdateNodeTitleInput {
  @Field()
  @ApiProperty({ example: 'HTML & CSS Basics' })
  title!: string;
}

@ObjectType()
export class BreadcrumbItemDto {
  @Field() @ApiProperty({ example: 'Frontend Roadmap' }) title!: string;
  @Field({ nullable: true }) @ApiPropertyOptional({ example: 'frontend' }) slug?: string;
  @Field({ nullable: true }) @ApiPropertyOptional({ example: 'clx...' }) nodeId?: string;
}

@InputType()
export class UpdateNodeCoverInput {
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.jpg', description: 'null removes the cover' })
  coverImage?: string;
}

@InputType()
export class UpdateNodeIconInput {
  @Field({ nullable: true })
  @ApiPropertyOptional({ example: '⚡', description: 'null removes the icon' })
  icon?: string;
}

@ObjectType()
export class RoadmapTreeNodeDto {
  @Field(() => ID) @ApiProperty({ example: 'node_001' }) id!: string;
  @Field() @ApiProperty({ example: 'Box Model' }) title!: string;
  @Field() @ApiProperty({ example: 'LESSON', enum: ['LESSON', 'ROADMAP'] }) type!: string;
  @Field({ nullable: true }) @ApiPropertyOptional({ example: 'html-css' }) slug?: string;
  @Field({ nullable: true }) @ApiPropertyOptional({ example: 'clx...' }) targetRoadmapId?: string;
  @Field({ nullable: true }) @ApiPropertyOptional({ example: 'frontend' }) roadmapSlug?: string;
  @Field({ nullable: true }) @ApiPropertyOptional({ example: 'clx...' }) roadmapId?: string;
  @Field(() => [RoadmapTreeNodeDto], { nullable: true })
  @ApiPropertyOptional({ type: () => [RoadmapTreeNodeDto] })
  children?: RoadmapTreeNodeDto[];
}

@ObjectType()
export class RoadmapTreeDto {
  @Field() @ApiProperty({ example: 'frontend' }) rootSlug!: string;
  @Field() @ApiProperty({ example: 'Frontend Roadmap' }) rootTitle!: string;
  @Field(() => [RoadmapTreeNodeDto]) @ApiProperty({ type: () => [RoadmapTreeNodeDto] }) nodes!: RoadmapTreeNodeDto[];
}

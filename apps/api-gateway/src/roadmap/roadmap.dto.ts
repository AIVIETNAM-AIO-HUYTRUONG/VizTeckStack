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

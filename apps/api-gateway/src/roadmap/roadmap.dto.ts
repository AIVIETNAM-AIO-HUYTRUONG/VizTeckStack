import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectType, Field, ID, Float, registerEnumType, InputType } from '@nestjs/graphql';

export enum NodeTypeEnum { ROADMAP = 'ROADMAP', LESSON = 'LESSON' }
registerEnumType(NodeTypeEnum, { name: 'NodeType' });

@ObjectType() export class RoadmapDto {
  @Field(() => ID) @ApiProperty() id!: string;
  @Field() @ApiProperty() slug!: string;
  @Field() @ApiProperty() title!: string;
  @Field({ nullable: true }) @ApiPropertyOptional() description?: string;
  @Field({ nullable: true }) @ApiPropertyOptional() coverImage?: string;
}

@ObjectType() export class NodeDto {
  @Field(() => ID) @ApiProperty() id!: string;
  @Field() @ApiProperty() roadmapId!: string;
  @Field(() => NodeTypeEnum) @ApiProperty({ enum: NodeTypeEnum }) type!: NodeTypeEnum;
  @Field() @ApiProperty() title!: string;
  @Field(() => Float) @ApiProperty() positionX!: number;
  @Field(() => Float) @ApiProperty() positionY!: number;
  @Field({ nullable: true }) @ApiPropertyOptional() targetRoadmapId?: string;
  @Field({ nullable: true }) @ApiPropertyOptional() content?: string;
}

@ObjectType() export class EdgeDto {
  @Field(() => ID) @ApiProperty() id!: string;
  @Field() @ApiProperty() sourceId!: string;
  @Field() @ApiProperty() targetId!: string;
  @Field({ nullable: true }) @ApiPropertyOptional() label?: string;
}

@ObjectType() export class RoadmapDetailDto {
  @Field(() => RoadmapDto, { nullable: true }) roadmap?: RoadmapDto;
  @Field(() => [NodeDto]) nodes!: NodeDto[];
  @Field(() => [EdgeDto]) edges!: EdgeDto[];
}

@InputType() export class CreateRoadmapInput {
  @Field() @ApiProperty() slug!: string;
  @Field() @ApiProperty() title!: string;
  @Field({ nullable: true }) @ApiPropertyOptional() description?: string;
  @Field({ nullable: true }) @ApiPropertyOptional() coverImage?: string;
}

@InputType() export class UpdateRoadmapInput {
  @Field({ nullable: true }) @ApiPropertyOptional() title?: string;
  @Field({ nullable: true }) @ApiPropertyOptional() description?: string;
  @Field({ nullable: true }) @ApiPropertyOptional() coverImage?: string;
}

@InputType() export class NodeInput {
  @Field() id!: string;
  @Field(() => NodeTypeEnum) type!: NodeTypeEnum;
  @Field() title!: string;
  @Field(() => Float) positionX!: number;
  @Field(() => Float) positionY!: number;
  @Field({ nullable: true }) targetRoadmapId?: string;
  @Field({ nullable: true }) content?: string;
}

@InputType() export class EdgeInput {
  @Field() sourceId!: string;
  @Field() targetId!: string;
  @Field({ nullable: true }) label?: string;
}

import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { UserRole } from '../auth/types';

@ObjectType()
export class UserType {
  @Field(() => ID) id!: string;
  @Field() email!: string;
  @Field() name!: string;
  @Field(() => UserRole) role!: UserRole;
  @Field() status!: string;
  @Field() createdAt!: string;
  @Field({ nullable: true }) lastSignInAt?: string;
}

@InputType()
export class CreateUserInput {
  @Field() email!: string;
  @Field() name!: string;
  @Field(() => UserRole) role!: UserRole;
}

@InputType()
export class UpdateUserInput {
  @Field(() => UserRole) role!: UserRole;
}

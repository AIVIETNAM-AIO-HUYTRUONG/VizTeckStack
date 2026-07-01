import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { UserRole } from './types';

registerEnumType(UserRole, { name: 'UserRole' });

@ObjectType()
export class AuthUserType {
  @Field(() => ID) id!: string;
  @Field() email!: string;
  @Field() name!: string;
  @Field(() => UserRole) role!: UserRole;
}

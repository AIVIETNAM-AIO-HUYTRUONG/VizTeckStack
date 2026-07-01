import { gql } from '@apollo/client';
import type { ApolloLike } from '../roadmap/types';
import type { ClerkUser, CreateUserDto, UpdateUserDto } from './types';

const USERS_QUERY = gql`
  query Users {
    users { id email name role status createdAt lastSignInAt }
  }
`;

const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) { id email name role status createdAt }
  }
`;

const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) { id email name role status createdAt }
  }
`;

const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) { deleteUser(id: $id) }
`;

const RESEND_INVITE_MUTATION = gql`
  mutation ResendInvite($id: ID!) { resendInvite(id: $id) }
`;

export async function listUsers(client: ApolloLike): Promise<ClerkUser[]> {
  const { data } = await client.query<{ users: ClerkUser[] }>({ query: USERS_QUERY });
  return data.users;
}

export async function createUser(client: ApolloLike, dto: CreateUserDto): Promise<ClerkUser> {
  const { data } = await client.mutate({ mutation: CREATE_USER_MUTATION, variables: { input: dto } });
  return data?.createUser;
}

export async function updateUser(client: ApolloLike, id: string, dto: UpdateUserDto): Promise<ClerkUser> {
  const { data } = await client.mutate({ mutation: UPDATE_USER_MUTATION, variables: { id, input: dto } });
  return data?.updateUser;
}

export async function deleteUser(client: ApolloLike, id: string): Promise<boolean> {
  const { data } = await client.mutate({ mutation: DELETE_USER_MUTATION, variables: { id } });
  return data?.deleteUser ?? false;
}

export async function resendInvite(client: ApolloLike, id: string): Promise<boolean> {
  const { data } = await client.mutate({ mutation: RESEND_INVITE_MUTATION, variables: { id } });
  return data?.resendInvite ?? false;
}

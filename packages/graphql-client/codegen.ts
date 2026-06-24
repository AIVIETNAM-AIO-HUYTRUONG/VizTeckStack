import type { CodegenConfig } from '@graphql-codegen/cli';
import { join } from 'path';

const config: CodegenConfig = {
  schema: join(__dirname, '../../apps/api-gateway/src/schema.gql'),
  documents: join(__dirname, 'src/queries/**/*.graphql'),
  generates: {
    [join(__dirname, 'src/generated/graphql.ts')]: {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        withResultType: true,
      },
    },
  },
};

export default config;

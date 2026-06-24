import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { join } from 'path';
import { RoadmapModule } from './roadmap/roadmap.module';
import { HealthController } from './health.controller';

const isDev = process.env.NODE_ENV !== 'production';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: false,
      introspection: true,
      plugins: [
        isDev
          ? ApolloServerPluginLandingPageLocalDefault({ embed: true, includeCookies: true })
          : ApolloServerPluginLandingPageDisabled(),
      ],
    }),
    RoadmapModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

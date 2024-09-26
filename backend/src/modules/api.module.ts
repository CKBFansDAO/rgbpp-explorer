import { join } from 'node:path';
import { ExecutionContext, Injectable, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext, GraphQLModule, Int } from '@nestjs/graphql';
import { DataLoaderInterceptor } from 'src/common/dataloader';
import { Env } from 'src/env';
import { CkbModule } from './ckb/ckb.module';
import { RgbppModule } from './rgbpp/rgbpp.module';
import { BitcoinModule } from './bitcoin/bitcoin.module';
import { SearchModule } from './search/search.module';
import { fieldPerformanceMiddleware } from 'src/middlewares/field-performance.middleware';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ComplexityPlugin } from './complexity.plugin';
import * as Sentry from '@sentry/nestjs';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import responseCachePlugin from '@apollo/server-plugin-response-cache';
import { AllExceptionsFilter } from 'src/filters/all-exceptions.filter';
import { DirectiveLocation, GraphQLBoolean, GraphQLDirective, GraphQLEnumType } from 'graphql';
import { LoggingPlugin } from './logging.plugin';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.request, res: ctx.reply };
  }
}

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<Env>) => ({
        throttlers: [
          {
            ttl: configService.get('RATE_LIMIT_WINDOW_MS')!,
            limit: configService.get('RATE_LIMIT_PER_MINUTE')!,
          },
        ],
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<Env>) => ({
        playground: configService.get('ENABLED_GRAPHQL_PLAYGROUND'),
        installSubscriptionHandlers: true,
        introspection: true,
        graphiql: true,
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        plugins: [
          ApolloServerPluginCacheControl({
            defaultMaxAge: 10,
            calculateHttpHeaders: true,
          }),
          responseCachePlugin(),
        ],
        buildSchemaOptions: {
          dateScalarMode: 'timestamp',
          fieldMiddleware: [fieldPerformanceMiddleware],
          directives: [
            new GraphQLDirective({
              name: 'cacheControl',
              args: {
                maxAge: { type: Int },
                scope: {
                  type: new GraphQLEnumType({
                    name: 'CacheControlScope',
                    values: {
                      PUBLIC: {},
                      PRIVATE: {},
                    },
                  }),
                },
                inheritMaxAge: { type: GraphQLBoolean },
              },
              locations: [
                DirectiveLocation.FIELD_DEFINITION,
                DirectiveLocation.OBJECT,
                DirectiveLocation.INTERFACE,
                DirectiveLocation.UNION,
                DirectiveLocation.QUERY,
              ],
            }),
          ],
        },
        context: (request: FastifyRequest, reply: FastifyReply) => {
          return {
            request,
            reply,
            span: Sentry.startInactiveSpan({
              op: 'gql',
              name: 'GraphQLTransaction',
            }),
          };
        },
      }),
    }),
    CkbModule,
    BitcoinModule,
    RgbppModule,
    SearchModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DataLoaderInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    ComplexityPlugin,
    LoggingPlugin,
  ],
})
export class ApiModule { }

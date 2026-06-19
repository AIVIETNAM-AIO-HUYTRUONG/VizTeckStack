import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'api-gateway',
      docs: '/api-docs',
      graphql: '/graphql',
    };
  }
}

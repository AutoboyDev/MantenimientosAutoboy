import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'Mantenimientos Autoboy API',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      message: 'Servidor activo y respondiendo correctamente 🚀',
    };
  }

  @Get('ping')
  getPing() {
    return { status: 'pong', time: Date.now() };
  }

  @Get('api/publico/health')
  getPublicHealth() {
    return this.getHealth();
  }
}


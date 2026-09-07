import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class KeepAliveService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KeepAliveService.name);
  private timer: NodeJS.Timeout | null = null;

  onModuleInit() {
    this.startSelfPing();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private startSelfPing() {
    // Render asigna RENDER_EXTERNAL_URL automáticamente en el entorno de producción
    const targetUrl =
      process.env.RENDER_EXTERNAL_URL ||
      process.env.BACKEND_URL ||
      process.env.API_URL ||
      process.env.APP_URL;

    if (!targetUrl) {
      this.logger.log(
        'ℹ️ [KeepAlive] No se detectó RENDER_EXTERNAL_URL o URL pública externa. El Auto-Ping se activará automáticamente al desplegar en Render.',
      );
      return;
    }

    const cleanBaseUrl = targetUrl.replace(/\/+$/, '');
    const pingEndpoint = `${cleanBaseUrl}/health`;

    this.logger.log(`🚀 [KeepAlive] Auto-Ping activado. Destino: ${pingEndpoint}`);

    // Primer ping de prueba a los 15 segundos del arranque
    setTimeout(() => {
      this.executePing(pingEndpoint);
    }, 15000);

    // Ping periódico cada 10 minutos (600,000 ms) para evitar que Render se suspenda (límite: 15 min)
    const INTERVAL_MS = 10 * 60 * 1000;
    this.timer = setInterval(() => {
      this.executePing(pingEndpoint);
    }, INTERVAL_MS);
  }

  private async executePing(url: string) {
    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'Autoboy-KeepAlive-Bot/1.0' },
      });
      const duration = Date.now() - startTime;

      if (response.ok) {
        this.logger.log(
          `💓 [KeepAlive] Auto-Ping exitoso a ${url} | Estado: ${response.status} (${duration}ms)`,
        );
      } else {
        this.logger.warn(
          `⚠️ [KeepAlive] Auto-Ping respondió con código ${response.status} a ${url}`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `❌ [KeepAlive] Error al ejecutar Auto-Ping a ${url}: ${error?.message || error}`,
      );
    }
  }
}

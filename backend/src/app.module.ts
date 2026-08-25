import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ConexionModule } from './config/conexion/conexion.module';
import { PublicoModule } from './modules/publico/publico.module';
import { PrivadoModule } from './modules/privado/privado.module';
import { Seguridad } from './middleware/seguridad/seguridad';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '../.env', isGlobal: true }),
    ConexionModule,
    PublicoModule,
    PrivadoModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(Seguridad).forRoutes('private');
  }
}

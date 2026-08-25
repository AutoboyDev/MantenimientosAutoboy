import { Global, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Usuario } from '../../models/usuario/usuario.entity';
import { Agencia } from '../../models/agencia/agencia.entity';
import { Inventario } from '../../models/inventario/inventario.entity';
import { Mantenimiento } from '../../models/mantenimiento/mantenimiento.entity';
import { AuditLog } from '../../models/audit-log/audit-log.entity';

@Global()
@Module({
  imports: [],
  exports: [DataSource],
  providers: [
    {
      provide: DataSource,
      useFactory: async () => {
        try {
          let host = process.env.HOST ? String(process.env.HOST) : undefined;
          let port = process.env.PORT ? Number(process.env.PORT) : undefined;
          let database = process.env.DATABASE ? String(process.env.DATABASE) : undefined;
          let username = process.env.USER_DB ? String(process.env.USER_DB) : undefined;
          let password = process.env.PASSWORD ? String(process.env.PASSWORD) : '';

          if (process.env.DATABASE_URL) {
            try {
              const parsedUrl = new URL(process.env.DATABASE_URL);
              host = parsedUrl.hostname;
              port = parsedUrl.port ? Number(parsedUrl.port) : 5432;
              database = parsedUrl.pathname.substring(1);
              username = decodeURIComponent(parsedUrl.username);
              password = decodeURIComponent(parsedUrl.password);
            } catch (e) {
              console.error("Error al parsear DATABASE_URL:", e);
            }
          }

          const isSSL = process.env.DB_SSL === 'true' || !!process.env.DATABASE_URL;
          const poolConexion = new DataSource({
            type: 'postgres',
            host,
            port,
            database,
            username,
            password,
            ssl: isSSL ? { rejectUnauthorized: false } : undefined,
            extra: isSSL ? {
              ssl: {
                rejectUnauthorized: false
              }
            } : undefined,
            logging: true,
            synchronize: false,
            namingStrategy: new SnakeNamingStrategy(),
            entities: [Usuario, Agencia, Inventario, Mantenimiento, AuditLog]
          });
          await poolConexion.initialize();
          console.log("Conexión establecida con base de datos: ", process.env.DATABASE_URL ? 'Supabase/Cloud' : String(process.env.DATABASE));
          return poolConexion;
        } catch (elError) {
          console.log("Fallo al hacer la conexión con la base de datos");
          throw elError;
        }
      }
    }
  ]
})
export class ConexionModule {}

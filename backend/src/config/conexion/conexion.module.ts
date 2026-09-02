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

          // Migración automática de columnas para teléfonos y vida útil (idempotente)
          try {
            await poolConexion.query(`
              ALTER TABLE inventario
              ADD COLUMN IF NOT EXISTS vida_util VARCHAR(50),
              ADD COLUMN IF NOT EXISTS fecha_compra VARCHAR(50),
              ADD COLUMN IF NOT EXISTS ubicacion VARCHAR(100),
              ADD COLUMN IF NOT EXISTS reubicacion VARCHAR(100),
              ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Activo',
              ADD COLUMN IF NOT EXISTS imei_1 VARCHAR(100),
              ADD COLUMN IF NOT EXISTS imei_2 VARCHAR(100),
              ADD COLUMN IF NOT EXISTS numero_linea VARCHAR(50),
              ADD COLUMN IF NOT EXISTS imei_simcard VARCHAR(100),
              ADD COLUMN IF NOT EXISTS correo VARCHAR(150),
              ADD COLUMN IF NOT EXISTS clave_correo VARCHAR(100),
              ADD COLUMN IF NOT EXISTS app_lock VARCHAR(100),
              ADD COLUMN IF NOT EXISTS cargador_marca VARCHAR(100),
              ADD COLUMN IF NOT EXISTS cargador_serial VARCHAR(100),
              ADD COLUMN IF NOT EXISTS cargador_fecha_compra VARCHAR(50),
              ADD COLUMN IF NOT EXISTS observaciones TEXT,
              ADD COLUMN IF NOT EXISTS cedula_usuario VARCHAR(50),
              ADD COLUMN IF NOT EXISTS quien_entrega VARCHAR(100),
              ADD COLUMN IF NOT EXISTS responsable_anterior VARCHAR(100),
              ADD COLUMN IF NOT EXISTS valor_estimado VARCHAR(50);
            `);
            console.log("Esquema de base de datos verificado y actualizado con soporte de telefonía y vida útil.");
          } catch (migErr) {
            console.warn("Aviso de migración de esquema:", migErr);
          }

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

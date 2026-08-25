import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS de manera restrictiva y segura
  const frontendUrl = process.env.VITE_API_URL;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];
  if (frontendUrl) {
    allowedOrigins.push(frontendUrl);
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some(o => origin.startsWith(o)) || 
        origin.endsWith('.vercel.app') || 
        origin.endsWith('.onrender.com');

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por política CORS de Mantenimientos Autoboy.'));
      }
    },
    credentials: true,
  });
  
  const port = process.env.HTTP_PORT ?? 3000;
  await app.listen(port);

  const isSupabase = !!process.env.DATABASE_URL;
  let dbHost = process.env.HOST || '127.0.0.1';
  let dbName = process.env.DATABASE || 'mantenimientos_db';

  if (process.env.DATABASE_URL) {
    try {
      const parsedUrl = new URL(process.env.DATABASE_URL);
      dbHost = parsedUrl.hostname;
      dbName = parsedUrl.pathname.substring(1);
    } catch (e) {
      // fallback
    }
  }

  console.log(`\n======================================================`);
  console.log(`🚀 Servidor API de Mantenimientos corriendo exitosamente!`);
  console.log(`🌐 URL del API: http://localhost:${port}`);
  console.log(`🗄️ Base de datos: ${isSupabase ? 'Supabase Cloud ⚡' : 'PostgreSQL Local 💻'}`);
  console.log(`⚙️ Host DB: ${dbHost}`);
  console.log(`📂 Nombre DB: ${dbName}`);
  console.log(`======================================================\n`);
}
bootstrap();

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

@Injectable()
export class Seguridad implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      return res.status(401).json({
        respuesta: 'Peticion Negada por el Sistema de Seguridad'
      });
    }
    
    try {
      const token = req.headers.authorization.split(' ')[1];
      const datosSesion = verify(token, String(process.env.SECRET_PASSWORD)) as any;
      
      // Adjuntar datos de sesión a la request para controladores y servicios
      req['user'] = datosSesion;
      
      // Estilo de la guía del Santo Tomás (para GET/DELETE)
      if (req.method !== 'PUT' && req.method !== 'POST') {
        req.body = datosSesion;
      } else {
        // Guardamos en un campo session para no pisar los datos del formulario (POST/PUT)
        req.body.session = datosSesion;
      }
      
      next();
    } catch (error) {
      return res.status(401).json({
        respuesta: 'Intento de Fraude'
      });
    }
  }
}

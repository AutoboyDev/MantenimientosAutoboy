import { sign } from 'jsonwebtoken';
import { Usuario } from '../../../models/usuario/usuario.entity';

export class GenerarToken {
  public static procesarRespuesta(respuesta: Usuario): string {
    let token = '';
    console.log('Respuesta de la consulta: ', respuesta);
    token = sign(
      {
        idUsuario: respuesta.id,
        nombreUsuario: respuesta.username,
        rol: respuesta.role
      },
      String(process.env.SECRET_PASSWORD),
      { expiresIn: '12h' }
    );
    return token;
  }
}

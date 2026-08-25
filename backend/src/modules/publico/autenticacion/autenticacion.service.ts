import { HttpException, Injectable } from '@nestjs/common';
import { compareSync, hashSync } from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { Usuario } from '../../../models/usuario/usuario.entity';
import { GenerarToken } from '../../../utilities/funciones/generar-token/generar-token';

@Injectable()
export class AutenticacionService {
  private usuarioRepo: Repository<Usuario>;

  constructor(private poolConexion: DataSource) {
    this.usuarioRepo = poolConexion.getRepository(Usuario);
  }

  public async inicioSesion(objUsuario: any): Promise<any> {
    const username = objUsuario.username || objUsuario.correoUsuario;
    const password = objUsuario.password || objUsuario.claveUsuario;

    if (!username || !password) {
      throw new HttpException('El usuario/correoUsuario y la clave son requeridos.', 400);
    }

    const existe = await this.usuarioRepo.findOneBy({ username });
    if (existe) {
      if (compareSync(password, existe.passwordHash)) {
        try {
          const token = GenerarToken.procesarRespuesta(existe);
          return new HttpException(
            {
              tokenApp: token,
              user: {
                username: existe.username,
                role: existe.role
              }
            },
            200
          );
        } catch (miError) {
          throw new HttpException('Fallo en la verificacion del usuario', 400);
        }
      } else {
        throw new HttpException('Usuario o contraseña incorrectos.', 401);
      }
    } else {
      throw new HttpException('Usuario o contraseña incorrectos.', 401);
    }
  }

  public async registroInicial(objUsuario: any): Promise<any> {
    const { username, password } = objUsuario;
    if (!username || !password) {
      throw new HttpException('El usuario y la contraseña son requeridos.', 400);
    }

    const totalUsuarios = await this.usuarioRepo.count();
    if (totalUsuarios > 0) {
      throw new HttpException('Acceso denegado. Ya existen usuarios registrados en el sistema.', 403);
    }

    const hash = hashSync(String(password), 10);
    const user = new Usuario();
    user.username = String(username).trim();
    user.passwordHash = hash;
    user.role = 'super_admin';

    const saved = await this.usuarioRepo.save(user);
    return new HttpException({
      respuesta: 'Usuario administrador inicial registrado exitosamente.',
      usuario: {
        id: saved.id,
        username: saved.username,
        role: saved.role
      }
    }, 201);
  }
}

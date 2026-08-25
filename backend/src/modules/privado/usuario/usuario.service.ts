import { HttpException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { hashSync } from 'bcryptjs';
import { Usuario } from '../../../models/usuario/usuario.entity';

@Injectable()
export class UsuarioService {
  private usuarioRepo: Repository<Usuario>;

  constructor(private poolConexion: DataSource) {
    this.usuarioRepo = poolConexion.getRepository(Usuario);
  }

  public async consultarUsuarios(): Promise<any> {
    return await this.usuarioRepo.find({
      select: ['id', 'username', 'role', 'createdAt']
    });
  }

  public async buscarUsuarioPorId(id: string): Promise<any> {
    const user = await this.usuarioRepo.findOne({
      where: { id },
      select: ['id', 'username', 'role', 'createdAt']
    });
    if (!user) {
      throw new HttpException('Usuario no encontrado.', 404);
    }
    return user;
  }

  public async nuevoUsuario(body: any, currentUserId: string): Promise<any> {
    const { username, password, role } = body;

    if (!username || !password || !role) {
      throw new HttpException('Nombre de usuario, Contraseña y Rol son campos requeridos.', 400);
    }

    if (role !== 'super_admin' && role !== 'editor') {
      throw new HttpException('Rol no válido. Debe ser super_admin o editor.', 400);
    }

    try {
      return await this.poolConexion.transaction(async (manager) => {
        await manager.query(`SELECT set_config('app.current_user_id', $1, true)`, [currentUserId]);

        const duplicado = await manager.findOneBy(Usuario, { username: String(username).trim() });
        if (duplicado) {
          throw new HttpException('El nombre de usuario ya está registrado.', 409);
        }

        const hash = hashSync(String(password), 10);

        const user = new Usuario();
        user.username = String(username).trim();
        user.passwordHash = hash;
        user.role = role;

        const savedUser = await manager.save(Usuario, user);

        return new HttpException({
          respuesta: 'Usuario creado exitosamente.',
          usuario: {
            id: savedUser.id,
            username: savedUser.username,
            role: savedUser.role
          }
        }, 201);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new HttpException('Error al crear el usuario en la base de datos.', 400);
    }
  }

  public async actualizarUsuario(id: string, body: any, currentUserId: string): Promise<any> {
    const { username, password, role } = body;

    try {
      return await this.poolConexion.transaction(async (manager) => {
        await manager.query(`SELECT set_config('app.current_user_id', $1, true)`, [currentUserId]);

        const user = await manager.findOneBy(Usuario, { id });
        if (!user) {
          throw new HttpException('Usuario no encontrado.', 404);
        }

        if (username) {
          const cleanUsername = String(username).trim();
          if (cleanUsername !== user.username) {
            const duplicado = await manager.findOneBy(Usuario, { username: cleanUsername });
            if (duplicado) {
              throw new HttpException('El nombre de usuario ya está registrado por otro usuario.', 409);
            }
            user.username = cleanUsername;
          }
        }

        if (password) {
          user.passwordHash = hashSync(String(password), 10);
        }

        if (role) {
          if (role !== 'super_admin' && role !== 'editor') {
            throw new HttpException('Rol no válido. Debe ser super_admin o editor.', 400);
          }
          user.role = role;
        }

        const updated = await manager.save(Usuario, user);

        return new HttpException({
          respuesta: 'Usuario actualizado correctamente.',
          usuario: {
            id: updated.id,
            username: updated.username,
            role: updated.role
          }
        }, 200);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new HttpException('Error al actualizar el usuario en la base de datos.', 400);
    }
  }

  public async eliminarUsuario(id: string, currentUserId: string): Promise<any> {
    if (id === currentUserId) {
      throw new HttpException('No puedes eliminar tu propio usuario de sesión.', 400);
    }

    try {
      return await this.poolConexion.transaction(async (manager) => {
        await manager.query(`SELECT set_config('app.current_user_id', $1, true)`, [currentUserId]);

        const user = await manager.findOneBy(Usuario, { id });
        if (!user) {
          throw new HttpException('Usuario no encontrado.', 404);
        }

        await manager.remove(Usuario, user);

        return new HttpException({
          respuesta: 'Usuario eliminado exitosamente.',
          codigo: id
        }, 200);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new HttpException('Error al eliminar el usuario de la base de datos.', 400);
    }
  }
}

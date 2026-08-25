import { HttpException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Agencia } from '../../../models/agencia/agencia.entity';

@Injectable()
export class AgenciaService {
  private agenciaRepo: Repository<Agencia>;

  constructor(private poolConexion: DataSource) {
    this.agenciaRepo = poolConexion.getRepository(Agencia);
  }

  public async consultarAgencias(): Promise<any> {
    return await this.agenciaRepo.find({ order: { nombre: 'ASC' } });
  }

  public async buscarAgenciaPorId(id: string): Promise<any> {
    const agencia = await this.agenciaRepo.findOneBy({ id });
    if (!agencia) {
      throw new HttpException('Agencia no encontrada.', 404);
    }
    return agencia;
  }

  public async nuevaAgencia(body: any, currentUserId: string): Promise<any> {
    const { nombre } = body;

    if (!nombre) {
      throw new HttpException('El nombre de la agencia es requerido.', 400);
    }

    try {
      return await this.poolConexion.transaction(async (manager) => {
        await manager.query(`SELECT set_config('app.current_user_id', $1, true)`, [currentUserId]);

        const cleanNombre = String(nombre).trim();

        const duplicado = await manager.findOneBy(Agencia, { nombre: cleanNombre });
        if (duplicado) {
          throw new HttpException('Una agencia con ese nombre ya está registrada.', 409);
        }

        const agencia = new Agencia();
        agencia.nombre = cleanNombre;

        const saved = await manager.save(Agencia, agencia);

        return new HttpException({
          respuesta: 'Agencia registrada exitosamente.',
          agencia: saved
        }, 201);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new HttpException('Error al guardar la agencia en la base de datos.', 400);
    }
  }

  public async actualizarAgencia(id: string, body: any, currentUserId: string): Promise<any> {
    const { nombre } = body;

    if (!nombre) {
      throw new HttpException('El nombre de la agencia es requerido.', 400);
    }

    try {
      return await this.poolConexion.transaction(async (manager) => {
        await manager.query(`SELECT set_config('app.current_user_id', $1, true)`, [currentUserId]);

        const agencia = await manager.findOneBy(Agencia, { id });
        if (!agencia) {
          throw new HttpException('Agencia no encontrada.', 404);
        }

        const cleanNombre = String(nombre).trim();
        if (cleanNombre !== agencia.nombre) {
          const duplicado = await manager.findOneBy(Agencia, { nombre: cleanNombre });
          if (duplicado) {
            throw new HttpException('Una agencia con ese nombre ya está registrada.', 409);
          }
          agencia.nombre = cleanNombre;
        }

        const updated = await manager.save(Agencia, agencia);

        return new HttpException({
          respuesta: 'Agencia actualizada correctamente.',
          agencia: updated
        }, 200);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new HttpException('Error al actualizar la agencia en la base de datos.', 400);
    }
  }

  public async eliminarAgencia(id: string, currentUserId: string): Promise<any> {
    try {
      return await this.poolConexion.transaction(async (manager) => {
        await manager.query(`SELECT set_config('app.current_user_id', $1, true)`, [currentUserId]);

        const agencia = await manager.findOneBy(Agencia, { id });
        if (!agencia) {
          throw new HttpException('Agencia no encontrada.', 404);
        }

        await manager.remove(Agencia, agencia);

        return new HttpException({
          respuesta: 'Agencia eliminada exitosamente.',
          codigo: id
        }, 200);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new HttpException('Error al eliminar la agencia de la base de datos. Puede tener equipos vinculados.', 400);
    }
  }
}

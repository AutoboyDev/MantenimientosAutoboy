import { HttpException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Mantenimiento } from '../../../models/mantenimiento/mantenimiento.entity';
import { Inventario } from '../../../models/inventario/inventario.entity';

@Injectable()
export class MantenimientoService {
  private mantenimientoRepo: Repository<Mantenimiento>;
  private inventarioRepo: Repository<Inventario>;

  constructor(private poolConexion: DataSource) {
    this.mantenimientoRepo = poolConexion.getRepository(Mantenimiento);
    this.inventarioRepo = poolConexion.getRepository(Inventario);
  }

  public async consultarMantenimientos(): Promise<any> {
    return await this.mantenimientoRepo.find({
      relations: ['equipo', 'equipo.agencia'],
      order: { fecha: 'DESC' }
    });
  }

  public async buscarMantenimientoPorId(id: string): Promise<any> {
    const log = await this.mantenimientoRepo.findOne({
      where: { id },
      relations: ['equipo', 'equipo.agencia']
    });
    if (!log) {
      throw new HttpException('Registro de mantenimiento no encontrado.', 404);
    }
    return log;
  }

  public async buscarMantenimientosPorEquipo(idEquipo: string): Promise<any> {
    return await this.mantenimientoRepo.find({
      where: { idEquipo },
      relations: ['equipo', 'equipo.agencia'],
      order: { fecha: 'DESC' }
    });
  }

  public async nuevoMantenimiento(body: any, currentUserId: string): Promise<any> {
    const {
      idEquipo,
      fecha,
      tipo,
      descripcion,
      realizadoPor,
      observaciones
    } = body;

    if (!idEquipo || !fecha || !tipo || !descripcion || !realizadoPor) {
      throw new HttpException('Los campos Equipo, Fecha, Tipo, Descripción y Realizado Por son requeridos.', 400);
    }

    if (tipo !== 'PREVENTIVO' && tipo !== 'CORRECTIVO') {
      throw new HttpException('El tipo de mantenimiento debe ser PREVENTIVO o CORRECTIVO.', 400);
    }

    // Verificar que el equipo exista
    const equipoExiste = await this.inventarioRepo.findOneBy({ id: idEquipo });
    if (!equipoExiste) {
      throw new HttpException('El equipo especificado no existe.', 400);
    }

    try {
      return await this.poolConexion.transaction(async (manager) => {
        await manager.query(`SELECT set_config('app.current_user_id', $1, true)`, [currentUserId]);

        const record = new Mantenimiento();
        record.idEquipo = idEquipo;
        record.fecha = fecha;
        record.tipo = tipo;
        record.descripcion = String(descripcion).trim();
        record.realizadoPor = String(realizadoPor).trim();
        record.observaciones = observaciones ? String(observaciones).trim() : undefined;

        const saved = await manager.save(Mantenimiento, record);

        return new HttpException({
          respuesta: 'Mantenimiento registrado exitosamente.',
          mantenimiento: saved
        }, 201);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new HttpException('Error al guardar el registro de mantenimiento en la base de datos.', 400);
    }
  }

  public async actualizarMantenimiento(id: string, body: any, currentUserId: string): Promise<any> {
    const {
      idEquipo,
      fecha,
      tipo,
      descripcion,
      realizadoPor,
      observaciones
    } = body;

    try {
      return await this.poolConexion.transaction(async (manager) => {
        await manager.query(`SELECT set_config('app.current_user_id', $1, true)`, [currentUserId]);

        const record = await manager.findOneBy(Mantenimiento, { id });
        if (!record) {
          throw new HttpException('Registro de mantenimiento no encontrado.', 404);
        }

        if (idEquipo) {
          const equipoExiste = await this.inventarioRepo.findOneBy({ id: idEquipo });
          if (!equipoExiste) {
            throw new HttpException('El equipo especificado no existe.', 400);
          }
          record.idEquipo = idEquipo;
        }

        if (fecha) record.fecha = fecha;
        
        if (tipo) {
          if (tipo !== 'PREVENTIVO' && tipo !== 'CORRECTIVO') {
            throw new HttpException('El tipo de mantenimiento debe ser PREVENTIVO o CORRECTIVO.', 400);
          }
          record.tipo = tipo;
        }

        if (descripcion) record.descripcion = String(descripcion).trim();
        if (realizadoPor) record.realizadoPor = String(realizadoPor).trim();
        if (observaciones !== undefined) record.observaciones = observaciones ? String(observaciones).trim() : undefined;

        const updated = await manager.save(Mantenimiento, record);

        return new HttpException({
          respuesta: 'Mantenimiento actualizado correctamente.',
          mantenimiento: updated
        }, 200);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new HttpException('Error al actualizar el mantenimiento en la base de datos.', 400);
    }
  }

  public async eliminarMantenimiento(id: string, currentUserId: string): Promise<any> {
    try {
      return await this.poolConexion.transaction(async (manager) => {
        await manager.query(`SELECT set_config('app.current_user_id', $1, true)`, [currentUserId]);

        const record = await manager.findOneBy(Mantenimiento, { id });
        if (!record) {
          throw new HttpException('Registro de mantenimiento no encontrado.', 404);
        }

        await manager.remove(Mantenimiento, record);

        return new HttpException({
          respuesta: 'Mantenimiento eliminado exitosamente.',
          codigo: id
        }, 200);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new HttpException('Error al eliminar el mantenimiento de la base de datos.', 400);
    }
  }
}

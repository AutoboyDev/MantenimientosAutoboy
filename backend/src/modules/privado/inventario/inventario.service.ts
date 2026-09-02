import { HttpException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Inventario } from '../../../models/inventario/inventario.entity';
import { Agencia } from '../../../models/agencia/agencia.entity';

@Injectable()
export class InventarioService {
  private inventarioRepo: Repository<Inventario>;
  private agenciaRepo: Repository<Agencia>;

  constructor(private poolConexion: DataSource) {
    this.inventarioRepo = poolConexion.getRepository(Inventario);
    this.agenciaRepo = poolConexion.getRepository(Agencia);
  }

  public async consultarInventario(): Promise<any> {
    return await this.inventarioRepo.find({
      relations: ['agencia'],
      order: { noInventario: 'ASC' }
    });
  }

  public async buscarInventarioPorId(id: string): Promise<any> {
    const equipo = await this.inventarioRepo.findOne({
      where: { id },
      relations: ['agencia']
    });
    if (!equipo) {
      throw new HttpException('Equipo no encontrado en el inventario.', 404);
    }
    return equipo;
  }

  public async buscarInventarioPorAgencia(idAgencia: string): Promise<any> {
    return await this.inventarioRepo.find({
      where: { idAgencia },
      relations: ['agencia'],
      order: { noInventario: 'ASC' }
    });
  }

  public async nuevoInventario(body: any, currentUserId: string): Promise<any> {
    const {
      idAgencia,
      noInventario,
      tipoEquipo,
      marca,
      referencia,
      modelo,
      vidaUtil,
      fechaCompra,
      ubicacion,
      reubicacion,
      estado,
      procesador,
      discoDuro,
      memoriaRam,
      uniDvd,
      serial,
      areaSucursal,
      cargo,
      usuarioSucursal,
      mouse,
      teclado,
      impresora,
      otros,
      imei1,
      imei2,
      numeroLinea,
      imeiSimcard,
      correo,
      claveCorreo,
      appLock,
      cargadorMarca,
      cargadorSerial,
      cargadorFechaCompra,
      observaciones,
      cedulaUsuario,
      quienEntrega,
      responsableAnterior,
      valorEstimado
    } = body;

    if (!idAgencia || !noInventario || !tipoEquipo || !marca || !referencia || !modelo) {
      throw new HttpException('Los campos Agencia, No. Inventario, Tipo Equipo, Marca, Referencia y Modelo son requeridos.', 400);
    }

    // Verificar que la agencia exista
    const agenciaExiste = await this.agenciaRepo.findOneBy({ id: idAgencia });
    if (!agenciaExiste) {
      throw new HttpException('La agencia especificada no existe.', 400);
    }

    try {
      return await this.poolConexion.transaction(async (manager) => {
        await manager.query(`SELECT set_config('app.current_user_id', $1, true)`, [currentUserId]);

        const equipo = new Inventario();
        equipo.idAgencia = idAgencia;
        equipo.noInventario = String(noInventario).trim();
        equipo.tipoEquipo = String(tipoEquipo).trim();
        equipo.marca = String(marca).trim();
        equipo.referencia = String(referencia).trim();
        equipo.modelo = String(modelo).trim();
        equipo.vidaUtil = vidaUtil ? String(vidaUtil).trim() : undefined;
        equipo.fechaCompra = fechaCompra ? String(fechaCompra).trim() : undefined;
        equipo.ubicacion = ubicacion ? String(ubicacion).trim() : undefined;
        equipo.reubicacion = reubicacion ? String(reubicacion).trim() : undefined;
        equipo.estado = estado ? String(estado).trim() : 'Activo';

        equipo.procesador = procesador ? String(procesador).trim() : undefined;
        equipo.discoDuro = discoDuro ? String(discoDuro).trim() : undefined;
        equipo.memoriaRam = memoriaRam ? String(memoriaRam).trim() : undefined;
        equipo.uniDvd = uniDvd ? String(uniDvd).trim() : undefined;
        equipo.serial = serial ? String(serial).trim() : undefined;
        equipo.areaSucursal = areaSucursal ? String(areaSucursal).trim() : undefined;
        equipo.cargo = cargo ? String(cargo).trim() : undefined;
        equipo.usuarioSucursal = usuarioSucursal ? String(usuarioSucursal).trim() : undefined;
        equipo.mouse = mouse ? String(mouse).trim() : undefined;
        equipo.teclado = teclado ? String(teclado).trim() : undefined;
        equipo.impresora = impresora ? String(impresora).trim() : undefined;
        equipo.otros = otros ? String(otros).trim() : undefined;

        // Telefonía
        equipo.imei1 = imei1 ? String(imei1).trim() : undefined;
        equipo.imei2 = imei2 ? String(imei2).trim() : undefined;
        equipo.numeroLinea = numeroLinea ? String(numeroLinea).trim() : undefined;
        equipo.imeiSimcard = imeiSimcard ? String(imeiSimcard).trim() : undefined;
        equipo.correo = correo ? String(correo).trim() : undefined;
        equipo.claveCorreo = claveCorreo ? String(claveCorreo).trim() : undefined;
        equipo.appLock = appLock ? String(appLock).trim() : undefined;
        equipo.cargadorMarca = cargadorMarca ? String(cargadorMarca).trim() : undefined;
        equipo.cargadorSerial = cargadorSerial ? String(cargadorSerial).trim() : undefined;
        equipo.cargadorFechaCompra = cargadorFechaCompra ? String(cargadorFechaCompra).trim() : undefined;
        equipo.observaciones = observaciones ? String(observaciones).trim() : undefined;

        // Acta de entrega
        equipo.cedulaUsuario = cedulaUsuario ? String(cedulaUsuario).trim() : undefined;
        equipo.quienEntrega = quienEntrega ? String(quienEntrega).trim() : undefined;
        equipo.responsableAnterior = responsableAnterior ? String(responsableAnterior).trim() : undefined;
        equipo.valorEstimado = valorEstimado ? String(valorEstimado).trim() : undefined;

        const saved = await manager.save(Inventario, equipo);

        return new HttpException({
          respuesta: 'Equipo tecnológico registrado exitosamente.',
          equipo: saved
        }, 201);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new HttpException('Error al guardar el equipo tecnológico en el inventario.', 400);
    }
  }

  public async actualizarInventario(id: string, body: any, currentUserId: string): Promise<any> {
    const {
      idAgencia,
      noInventario,
      tipoEquipo,
      marca,
      referencia,
      modelo,
      vidaUtil,
      fechaCompra,
      ubicacion,
      reubicacion,
      estado,
      procesador,
      discoDuro,
      memoriaRam,
      uniDvd,
      serial,
      areaSucursal,
      cargo,
      usuarioSucursal,
      mouse,
      teclado,
      impresora,
      otros,
      imei1,
      imei2,
      numeroLinea,
      imeiSimcard,
      correo,
      claveCorreo,
      appLock,
      cargadorMarca,
      cargadorSerial,
      cargadorFechaCompra,
      observaciones,
      cedulaUsuario,
      quienEntrega,
      responsableAnterior,
      valorEstimado
    } = body;

    try {
      return await this.poolConexion.transaction(async (manager) => {
        await manager.query(`SELECT set_config('app.current_user_id', $1, true)`, [currentUserId]);

        const equipo = await manager.findOneBy(Inventario, { id });
        if (!equipo) {
          throw new HttpException('Equipo no encontrado en el inventario.', 404);
        }

        if (idAgencia) {
          const agenciaExiste = await this.agenciaRepo.findOneBy({ id: idAgencia });
          if (!agenciaExiste) {
            throw new HttpException('La agencia especificada no existe.', 400);
          }
          equipo.idAgencia = idAgencia;
        }

        if (noInventario) equipo.noInventario = String(noInventario).trim();
        if (tipoEquipo) equipo.tipoEquipo = String(tipoEquipo).trim();
        if (marca) equipo.marca = String(marca).trim();
        if (referencia) equipo.referencia = String(referencia).trim();
        if (modelo) equipo.modelo = String(modelo).trim();
        
        if (vidaUtil !== undefined) equipo.vidaUtil = vidaUtil ? String(vidaUtil).trim() : undefined;
        if (fechaCompra !== undefined) equipo.fechaCompra = fechaCompra ? String(fechaCompra).trim() : undefined;
        if (ubicacion !== undefined) equipo.ubicacion = ubicacion ? String(ubicacion).trim() : undefined;
        if (reubicacion !== undefined) equipo.reubicacion = reubicacion ? String(reubicacion).trim() : undefined;
        if (estado !== undefined) equipo.estado = estado ? String(estado).trim() : 'Activo';

        if (procesador !== undefined) equipo.procesador = procesador ? String(procesador).trim() : undefined;
        if (discoDuro !== undefined) equipo.discoDuro = discoDuro ? String(discoDuro).trim() : undefined;
        if (memoriaRam !== undefined) equipo.memoriaRam = memoriaRam ? String(memoriaRam).trim() : undefined;
        if (uniDvd !== undefined) equipo.uniDvd = uniDvd ? String(uniDvd).trim() : undefined;
        if (serial !== undefined) equipo.serial = serial ? String(serial).trim() : undefined;
        if (areaSucursal !== undefined) equipo.areaSucursal = areaSucursal ? String(areaSucursal).trim() : undefined;
        if (cargo !== undefined) equipo.cargo = cargo ? String(cargo).trim() : undefined;
        if (usuarioSucursal !== undefined) equipo.usuarioSucursal = usuarioSucursal ? String(usuarioSucursal).trim() : undefined;
        if (mouse !== undefined) equipo.mouse = mouse ? String(mouse).trim() : undefined;
        if (teclado !== undefined) equipo.teclado = teclado ? String(teclado).trim() : undefined;
        if (impresora !== undefined) equipo.impresora = impresora ? String(impresora).trim() : undefined;
        if (otros !== undefined) equipo.otros = otros ? String(otros).trim() : undefined;

        // Telefonía
        if (imei1 !== undefined) equipo.imei1 = imei1 ? String(imei1).trim() : undefined;
        if (imei2 !== undefined) equipo.imei2 = imei2 ? String(imei2).trim() : undefined;
        if (numeroLinea !== undefined) equipo.numeroLinea = numeroLinea ? String(numeroLinea).trim() : undefined;
        if (imeiSimcard !== undefined) equipo.imeiSimcard = imeiSimcard ? String(imeiSimcard).trim() : undefined;
        if (correo !== undefined) equipo.correo = correo ? String(correo).trim() : undefined;
        if (claveCorreo !== undefined) equipo.claveCorreo = claveCorreo ? String(claveCorreo).trim() : undefined;
        if (appLock !== undefined) equipo.appLock = appLock ? String(appLock).trim() : undefined;
        if (cargadorMarca !== undefined) equipo.cargadorMarca = cargadorMarca ? String(cargadorMarca).trim() : undefined;
        if (cargadorSerial !== undefined) equipo.cargadorSerial = cargadorSerial ? String(cargadorSerial).trim() : undefined;
        if (cargadorFechaCompra !== undefined) equipo.cargadorFechaCompra = cargadorFechaCompra ? String(cargadorFechaCompra).trim() : undefined;
        if (observaciones !== undefined) equipo.observaciones = observaciones ? String(observaciones).trim() : undefined;

        // Acta de entrega
        if (cedulaUsuario !== undefined) equipo.cedulaUsuario = cedulaUsuario ? String(cedulaUsuario).trim() : undefined;
        if (quienEntrega !== undefined) equipo.quienEntrega = quienEntrega ? String(quienEntrega).trim() : undefined;
        if (responsableAnterior !== undefined) equipo.responsableAnterior = responsableAnterior ? String(responsableAnterior).trim() : undefined;
        if (valorEstimado !== undefined) equipo.valorEstimado = valorEstimado ? String(valorEstimado).trim() : undefined;

        const updated = await manager.save(Inventario, equipo);

        return new HttpException({
          respuesta: 'Equipo tecnológico actualizado correctamente.',
          equipo: updated
        }, 200);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new HttpException('Error al actualizar el equipo en la base de datos.', 400);
    }
  }

  public async eliminarInventario(id: string, currentUserId: string): Promise<any> {
    try {
      return await this.poolConexion.transaction(async (manager) => {
        await manager.query(`SELECT set_config('app.current_user_id', $1, true)`, [currentUserId]);

        const equipo = await manager.findOneBy(Inventario, { id });
        if (!equipo) {
          throw new HttpException('Equipo no encontrado en el inventario.', 404);
        }

        await manager.remove(Inventario, equipo);

        return new HttpException({
          respuesta: 'Equipo tecnológico eliminado del inventario exitosamente.',
          codigo: id
        }, 200);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new HttpException('Error al eliminar el equipo del inventario en la base de datos. Puede tener mantenimientos vinculados.', 400);
    }
  }
}

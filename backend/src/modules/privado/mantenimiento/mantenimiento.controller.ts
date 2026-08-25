import { Controller, Delete, Get, HttpException, Param, Post, Put, Req } from '@nestjs/common';
import { MantenimientoService } from './mantenimiento.service';

@Controller('private/maintenance')
export class MantenimientoController {
  constructor(private readonly mantenimientoService: MantenimientoService) {}

  @Get('findAll')
  public obtenerMantenimientos() {
    return this.mantenimientoService.consultarMantenimientos();
  }

  @Get('findById/:id')
  public obtenerMantenimientoPorId(@Param('id') id: string) {
    return this.mantenimientoService.buscarMantenimientoPorId(id);
  }

  @Get('findByEquipment/:idEquipo')
  public obtenerMantenimientosPorEquipo(@Param('idEquipo') idEquipo: string) {
    return this.mantenimientoService.buscarMantenimientosPorEquipo(idEquipo);
  }

  @Post('newMaintenance')
  public crearMantenimiento(@Req() request: any) {
    const userSession = request.user;
    const payload = request.body;

    if (!userSession || !userSession.idUsuario) {
      throw new HttpException('Sesión de usuario no válida.', 401);
    }

    return this.mantenimientoService.nuevoMantenimiento(payload, userSession.idUsuario);
  }

  @Put('updateMaintenance/:id')
  public actualizarMantenimiento(@Param('id') id: string, @Req() request: any) {
    const userSession = request.user;
    const payload = request.body;

    if (!userSession || !userSession.idUsuario) {
      throw new HttpException('Sesión de usuario no válida.', 401);
    }

    return this.mantenimientoService.actualizarMantenimiento(id, payload, userSession.idUsuario);
  }

  @Delete('deleteMaintenance/:id')
  public eliminarMantenimiento(@Param('id') id: string, @Req() request: any) {
    const userSession = request.user;

    if (!userSession || !userSession.idUsuario) {
      throw new HttpException('Sesión de usuario no válida.', 401);
    }

    if (userSession.rol !== 'super_admin') {
      throw new HttpException('Acceso denegado. Solo el rol Super Admin puede eliminar registros de mantenimiento.', 403);
    }

    return this.mantenimientoService.eliminarMantenimiento(id, userSession.idUsuario);
  }
}

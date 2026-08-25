import { Controller, Delete, Get, HttpException, Param, Post, Put, Req } from '@nestjs/common';
import { InventarioService } from './inventario.service';

@Controller('private/inventory')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get('findAll')
  public obtenerInventario() {
    return this.inventarioService.consultarInventario();
  }

  @Get('findById/:id')
  public obtenerEquipoPorId(@Param('id') id: string) {
    return this.inventarioService.buscarInventarioPorId(id);
  }

  @Get('findByAgency/:idAgencia')
  public obtenerEquiposPorAgencia(@Param('idAgencia') idAgencia: string) {
    return this.inventarioService.buscarInventarioPorAgencia(idAgencia);
  }

  @Post('newEquipment')
  public crearEquipo(@Req() request: any) {
    const userSession = request.user;
    const payload = request.body;

    if (!userSession || !userSession.idUsuario) {
      throw new HttpException('Sesión de usuario no válida.', 401);
    }

    return this.inventarioService.nuevoInventario(payload, userSession.idUsuario);
  }

  @Put('updateEquipment/:id')
  public actualizarEquipo(@Param('id') id: string, @Req() request: any) {
    const userSession = request.user;
    const payload = request.body;

    if (!userSession || !userSession.idUsuario) {
      throw new HttpException('Sesión de usuario no válida.', 401);
    }

    return this.inventarioService.actualizarInventario(id, payload, userSession.idUsuario);
  }

  @Delete('deleteEquipment/:id')
  public eliminarEquipo(@Param('id') id: string, @Req() request: any) {
    const userSession = request.user;

    if (!userSession || !userSession.idUsuario) {
      throw new HttpException('Sesión de usuario no válida.', 401);
    }

    if (userSession.rol !== 'super_admin') {
      throw new HttpException('Acceso denegado. Solo el rol Super Admin puede eliminar equipos del inventario.', 403);
    }

    return this.inventarioService.eliminarInventario(id, userSession.idUsuario);
  }
}

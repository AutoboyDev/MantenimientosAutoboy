import { Controller, Get, HttpException, Req } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('private/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('findAll')
  public obtenerLogs(@Req() request: any) {
    const userSession = request.user;

    if (!userSession || !userSession.idUsuario) {
      throw new HttpException('Sesión de usuario no válida.', 401);
    }

    if (userSession.rol !== 'super_admin') {
      throw new HttpException('Acceso denegado. Solo el rol Super Admin puede visualizar la bitácora de auditoría.', 403);
    }

    return this.auditService.consultarLogs();
  }
}

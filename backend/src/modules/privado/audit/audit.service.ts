import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AuditLog } from '../../../models/audit-log/audit-log.entity';

@Injectable()
export class AuditService {
  private auditRepo: Repository<AuditLog>;

  constructor(private poolConexion: DataSource) {
    this.auditRepo = poolConexion.getRepository(AuditLog);
  }

  public async consultarLogs(): Promise<any> {
    return await this.auditRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }
}

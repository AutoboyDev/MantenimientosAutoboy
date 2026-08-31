import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  Wrench,
  Laptop,
  Building2,
  Users,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Eye,
  X,
  FileCode,
  UserCheck,
  CalendarClock,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  History
} from 'lucide-react';

export const AdminPanel: React.FC<{ onGoTo404?: () => void }> = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'INVENTORY' | 'MAINTENANCE' | 'AGENCIES' | 'USERS' | 'AUDIT'>('SCHEDULE');
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');
  
  // Filtros de Cronograma
  const [scheduleAgencyFilter, setScheduleAgencyFilter] = useState<string>('ALL');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<string>('ALL');
  const [scheduleSearch, setScheduleSearch] = useState<string>('');
  const [scheduleYear, setScheduleYear] = useState<number>(new Date().getFullYear());

  // Listas de datos
  const [agencies, setAgencies] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Estados de Carga
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Control de Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'AGENCY' | 'EQUIPMENT' | 'MAINTENANCE' | 'USER' | 'AUDIT_DETAIL' | 'EQUIPMENT_DETAIL' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState<any>(null);
  const [selectedEquipmentDetail, setSelectedEquipmentDetail] = useState<any>(null);

  // Form Data de Agencias
  const [agencyForm, setAgencyForm] = useState({ nombre: '' });

  // Form Data de Equipos
  const [equipForm, setEquipForm] = useState({
    idAgencia: '',
    noInventario: '',
    tipoEquipo: 'Computador',
    marca: '',
    referencia: '',
    modelo: '',
    procesador: '',
    discoDuro: '',
    memoriaRam: '',
    uniDvd: 'N/A',
    serial: '',
    areaSucursal: '',
    cargo: '',
    usuarioSucursal: '',
    mouse: '',
    teclado: '',
    impresora: '',
    otros: ''
  });

  // Form Data de Mantenimientos
  const [maintForm, setMaintForm] = useState({
    idEquipo: '',
    fecha: new Date().toISOString().substring(0, 10),
    tipo: 'PREVENTIVO' as 'PREVENTIVO' | 'CORRECTIVO',
    descripcion: '',
    realizadoPor: '',
    observaciones: ''
  });

  // Form Data de Usuarios
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'editor' as 'super_admin' | 'editor'
  });

  // Carga inicial
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('autoboy_mantenimientos_theme', nextTheme);
  };

  const fetchData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      if (activeTab === 'INVENTORY') {
        const eqData = await api.get('/inventory/findAll');
        setEquipments(eqData);
        const agData = await api.get('/agency/findAll');
        setAgencies(agData);
      } else if (activeTab === 'MAINTENANCE') {
        const mData = await api.get('/maintenance/findAll');
        setMaintenances(mData);
        const eqData = await api.get('/inventory/findAll');
        setEquipments(eqData);
      } else if (activeTab === 'SCHEDULE') {
        const [eqData, mData, agData] = await Promise.all([
          api.get('/inventory/findAll'),
          api.get('/maintenance/findAll'),
          api.get('/agency/findAll')
        ]);
        setEquipments(eqData);
        setMaintenances(mData);
        setAgencies(agData);
      } else if (activeTab === 'AGENCIES') {
        const agData = await api.get('/agency/findAll');
        setAgencies(agData);
      } else if (activeTab === 'USERS' && user?.rol === 'super_admin') {
        const uData = await api.get('/user/findAll');
        setUsers(uData);
      } else if (activeTab === 'AUDIT' && user?.rol === 'super_admin') {
        const auData = await api.get('/audit/findAll');
        setAuditLogs(auData);
      }
    } catch (err: any) {
      setActionError(err.message || 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD DE AGENCIAS ---
  const handleAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      if (editId) {
        await api.put(`/agency/updateAgency/${editId}`, agencyForm);
        showToast('Agencia actualizada correctamente.', 'success');
      } else {
        await api.post('/agency/newAgency', agencyForm);
        showToast('Agencia creada correctamente.', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
      showToast('Error al guardar la agencia.', 'error');
    }
  };

  const handleAgencyDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta agencia? Los equipos asociados podrían impedir la acción.')) return;
    try {
      await api.delete(`/agency/deleteAgency/${id}`);
      showToast('Agencia eliminada correctamente.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar la agencia.', 'error');
    }
  };

  // --- CRUD DE EQUIPOS ---
  const handleEquipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      if (editId) {
        await api.put(`/inventory/updateEquipment/${editId}`, equipForm);
        showToast('Equipo actualizado correctamente.', 'success');
      } else {
        await api.post('/inventory/newEquipment', equipForm);
        showToast('Equipo agregado al inventario.', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
      showToast('Error al guardar el equipo.', 'error');
    }
  };

  const handleEquipDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este equipo del inventario? Se eliminará su historial de mantenimiento.')) return;
    try {
      await api.delete(`/inventory/deleteEquipment/${id}`);
      showToast('Equipo eliminado del inventario.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar el equipo.', 'error');
    }
  };

  // --- CRUD DE MANTENIMIENTOS ---
  const handleMaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      if (editId) {
        await api.put(`/maintenance/updateMaintenance/${editId}`, maintForm);
        showToast('Registro de mantenimiento actualizado.', 'success');
      } else {
        await api.post('/maintenance/newMaintenance', maintForm);
        showToast('Registro de mantenimiento agregado.', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
      showToast('Error al guardar mantenimiento.', 'error');
    }
  };

  const handleMaintDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro de mantenimiento?')) return;
    try {
      await api.delete(`/maintenance/deleteMaintenance/${id}`);
      showToast('Registro de mantenimiento eliminado.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar mantenimiento.', 'error');
    }
  };

  // --- CRUD DE USUARIOS ---
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      if (editId) {
        await api.put(`/user/updateUser/${editId}`, userForm);
        showToast('Usuario actualizado correctamente.', 'success');
      } else {
        await api.post('/user/newUser', userForm);
        showToast('Usuario creado correctamente.', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message);
      showToast('Error al guardar el usuario.', 'error');
    }
  };

  const handleUserDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await api.delete(`/user/deleteUser/${id}`);
      showToast('Usuario eliminado.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar el usuario.', 'error');
    }
  };

  return (
    <div className="app-wrapper">
      {/* Navbar de Administración */}
      <nav className="nm-nav">
        <div className="nm-nav-logo heading-font">
          <Wrench className="gear-spin" size={24} />
          Autoboy <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>Admin</span>
        </div>
        <div className="nm-nav-links">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem', fontSize: '0.85rem' }}>
            <span className="nm-card-sunken" style={{ padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={14} style={{ color: 'var(--primary-light)' }} />
              {user?.username} ({user?.rol === 'super_admin' ? 'Super Admin' : 'Editor'})
            </span>
          </div>
          <button className="nm-btn" onClick={toggleTheme} aria-label="Cambiar Tema" style={{ padding: '0.6rem' }}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="nm-btn nm-btn-accent" onClick={logout}>
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </nav>

      {/* Main Admin Wrapper */}
      <div className="admin-container">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <button
            className={`nm-menu-item nm-menu-item-featured ${activeTab === 'SCHEDULE' ? 'active' : ''}`}
            onClick={() => setActiveTab('SCHEDULE')}
          >
            <CalendarClock size={20} />
            <span>Cronograma (6M)</span>
            <span className="featured-badge">Principal</span>
          </button>

          <button className={`nm-menu-item ${activeTab === 'INVENTORY' ? 'active' : ''}`} onClick={() => setActiveTab('INVENTORY')}>
            <Laptop size={18} />
            Inventario
          </button>
          <button className={`nm-menu-item ${activeTab === 'MAINTENANCE' ? 'active' : ''}`} onClick={() => setActiveTab('MAINTENANCE')}>
            <Calendar size={18} />
            Mantenimientos
          </button>
          <button className={`nm-menu-item ${activeTab === 'AGENCIES' ? 'active' : ''}`} onClick={() => setActiveTab('AGENCIES')}>
            <Building2 size={18} />
            Agencias
          </button>

          {user?.rol === 'super_admin' && (
            <>
              <button className={`nm-menu-item ${activeTab === 'USERS' ? 'active' : ''}`} onClick={() => setActiveTab('USERS')}>
                <Users size={18} />
                Usuarios
              </button>
              <button className={`nm-menu-item ${activeTab === 'AUDIT' ? 'active' : ''}`} onClick={() => setActiveTab('AUDIT')}>
                <ShieldCheck size={18} />
                Auditoría
              </button>
            </>
          )}
        </aside>

        {/* Content Area */}
        <main className="admin-main">
          {/* INVENTARIO TAB */}
          {activeTab === 'INVENTORY' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 className="heading-font" style={{ fontSize: '1.5rem' }}>Inventario de Equipos</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Listado y control de recursos tecnológicos registrados</p>
                </div>
                <button className="nm-btn nm-btn-primary" onClick={() => {
                  setEditId(null);
                  setEquipForm({
                    idAgencia: agencies[0]?.id || '',
                    noInventario: '',
                    tipoEquipo: 'Computador',
                    marca: '',
                    referencia: '',
                    modelo: '',
                    procesador: '',
                    discoDuro: '',
                    memoriaRam: '',
                    uniDvd: 'N/A',
                    serial: '',
                    areaSucursal: '',
                    cargo: '',
                    usuarioSucursal: '',
                    mouse: '',
                    teclado: '',
                    impresora: '',
                    otros: ''
                  });
                  setModalType('EQUIPMENT');
                  setModalOpen(true);
                }}>
                  <Plus size={16} /> Agregar Equipo
                </button>
              </div>

              {loading ? <p>Cargando inventario...</p> : (
                <div className="nm-table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>N° Inventario</th>
                        <th>Tipo / Marca</th>
                        <th>Modelo / Ref.</th>
                        <th>Agencia / Sucursal</th>
                        <th>Usuario</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipments.map(eq => (
                        <tr key={eq.id}>
                          <td><strong>{eq.noInventario}</strong></td>
                          <td>{eq.tipoEquipo} ({eq.marca})</td>
                          <td>{eq.modelo} - {eq.referencia}</td>
                          <td>{eq.agencia?.nombre || 'N/A'}</td>
                          <td>{eq.usuarioSucursal || 'N/A'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="nm-btn" style={{ padding: '0.4rem' }} title="Ver más detalles" onClick={() => {
                                setSelectedEquipmentDetail(eq);
                                setModalType('EQUIPMENT_DETAIL');
                                setModalOpen(true);
                              }}>
                                <Eye size={14} />
                              </button>
                              <button className="nm-btn" style={{ padding: '0.4rem' }} onClick={() => {
                                setEditId(eq.id);
                                setEquipForm({ ...eq });
                                setModalType('EQUIPMENT');
                                setModalOpen(true);
                              }}>
                                <Edit2 size={14} />
                              </button>
                              {user?.rol === 'super_admin' && (
                                <button className="nm-btn nm-btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleEquipDelete(eq.id)}>
                                  <Trash2 size={14} style={{ color: 'var(--error)' }} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {equipments.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay equipos registrados.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* MANTENIMIENTO TAB */}
          {activeTab === 'MAINTENANCE' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 className="heading-font" style={{ fontSize: '1.5rem' }}>Registro de Mantenimientos</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Control de hojas de mantenimiento correctivo y preventivo</p>
                </div>
                <button className="nm-btn nm-btn-primary" onClick={() => {
                  setEditId(null);
                  setMaintForm({
                    idEquipo: equipments[0]?.id || '',
                    fecha: new Date().toISOString().substring(0, 10),
                    tipo: 'PREVENTIVO',
                    descripcion: '',
                    realizadoPor: '',
                    observaciones: ''
                  });
                  setModalType('MAINTENANCE');
                  setModalOpen(true);
                }}>
                  <Plus size={16} /> Nuevo Registro
                </button>
              </div>

              {loading ? <p>Cargando mantenimientos...</p> : (
                <div className="nm-table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Equipo (N° Inv)</th>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th>Técnico</th>
                        <th>Observaciones</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenances.map(m => (
                        <tr key={m.id}>
                          <td><strong>{new Date(m.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</strong></td>
                          <td>{m.equipo?.tipoEquipo} ({m.equipo?.noInventario})</td>
                          <td>
                            <span style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: m.tipo === 'PREVENTIVO' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: m.tipo === 'PREVENTIVO' ? 'var(--success)' : 'var(--error)'
                            }}>
                              {m.tipo}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'normal', maxWidth: '250px' }}>{m.descripcion}</td>
                          <td>{m.realizadoPor}</td>
                          <td style={{ whiteSpace: 'normal', maxWidth: '200px', color: 'var(--text-muted)' }}>{m.observaciones || 'N/A'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="nm-btn" style={{ padding: '0.4rem' }} onClick={() => {
                                setEditId(m.id);
                                setMaintForm({
                                  idEquipo: m.idEquipo,
                                  fecha: new Date(m.fecha).toISOString().substring(0, 10),
                                  tipo: m.tipo,
                                  descripcion: m.descripcion,
                                  realizadoPor: m.realizadoPor,
                                  observaciones: m.observaciones || ''
                                });
                                setModalType('MAINTENANCE');
                                setModalOpen(true);
                              }}>
                                <Edit2 size={14} />
                              </button>
                              {user?.rol === 'super_admin' && (
                                <button className="nm-btn nm-btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleMaintDelete(m.id)}>
                                  <Trash2 size={14} style={{ color: 'var(--error)' }} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {maintenances.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay mantenimientos registrados.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CRONOGRAMA TAB (OPCION 1: TIMELINE SEMESTRAL GANTT) */}
          {activeTab === 'SCHEDULE' && (() => {
            const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            const currentDay = today.getDate();
            const todayPercent = scheduleYear === currentYear ? ((currentMonth + currentDay / 30) / 12) * 100 : null;

            // Calcular datos de cada equipo
            const computedSchedule = equipments.map((eq) => {
              const eqMaintenances = maintenances
                .filter((m) => m.idEquipo === eq.id)
                .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

              const lastMaint = eqMaintenances[0] || null;
              let lastDate: Date | null = null;
              let nextDate: Date | null = null;
              let status: 'AL_DIA' | 'PROXIMO' | 'VENCIDO' | 'SIN_REGISTRO' = 'SIN_REGISTRO';
              let daysDiff: number | null = null;

              if (lastMaint) {
                const parts = String(lastMaint.fecha).substring(0, 10).split('-');
                if (parts.length === 3) {
                  lastDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                } else {
                  lastDate = new Date(lastMaint.fecha);
                }

                nextDate = new Date(lastDate);
                nextDate.setMonth(nextDate.getMonth() + 6); // +6 meses

                const diffTime = nextDate.getTime() - today.getTime();
                daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (daysDiff < 0) {
                  status = 'VENCIDO';
                } else if (daysDiff <= 30) {
                  status = 'PROXIMO';
                } else {
                  status = 'AL_DIA';
                }
              }

              return {
                equipment: eq,
                lastMaint,
                lastDate,
                nextDate,
                status,
                daysDiff
              };
            });

            // Resumen de conteos
            const countAlDia = computedSchedule.filter((s) => s.status === 'AL_DIA').length;
            const countProximo = computedSchedule.filter((s) => s.status === 'PROXIMO').length;
            const countVencido = computedSchedule.filter((s) => s.status === 'VENCIDO').length;
            const countSinRegistro = computedSchedule.filter((s) => s.status === 'SIN_REGISTRO').length;

            // Filtros aplicados
            const filteredSchedule = computedSchedule.filter((item) => {
              if (scheduleAgencyFilter !== 'ALL' && item.equipment.idAgencia !== scheduleAgencyFilter) {
                return false;
              }
              if (scheduleStatusFilter !== 'ALL' && item.status !== scheduleStatusFilter) {
                return false;
              }
              if (scheduleSearch.trim()) {
                const q = scheduleSearch.toLowerCase();
                const matchInv = (item.equipment.noInventario || '').toLowerCase().includes(q);
                const matchUser = (item.equipment.usuarioSucursal || '').toLowerCase().includes(q);
                const matchModel = (item.equipment.modelo || '').toLowerCase().includes(q);
                const matchType = (item.equipment.tipoEquipo || '').toLowerCase().includes(q);
                if (!matchInv && !matchUser && !matchModel && !matchType) return false;
              }
              return true;
            });

            return (
              <div>
                {/* Encabezado y Resumen */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <h2 className="heading-font" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <CalendarClock size={26} style={{ color: 'var(--primary-light)' }} />
                      Cronograma Semestral de Mantenimientos
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Monitoreo del ciclo preventivo de 6 meses por equipo y asignación de usuario
                    </p>
                  </div>

                  {/* Selector de Año */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Año:</span>
                    <select
                      className="nm-select"
                      style={{ width: 'auto', padding: '0.4rem 1rem', fontWeight: 700 }}
                      value={scheduleYear}
                      onChange={(e) => setScheduleYear(parseInt(e.target.value, 10))}
                    >
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                      <option value={2027}>2027</option>
                      <option value={2028}>2028</option>
                    </select>
                  </div>
                </div>

                {/* Tarjetas de Métricas de Vencimiento */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <div className="nm-card-sunken" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.6rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{countAlDia}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Al Día (&gt;30d)</div>
                    </div>
                  </div>

                  <div className="nm-card-sunken" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.6rem', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{countProximo}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Próximos (≤30d)</div>
                    </div>
                  </div>

                  <div className="nm-card-sunken" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.6rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)' }}>
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{countVencido}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vencidos (+6m)</div>
                    </div>
                  </div>

                  <div className="nm-card-sunken" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.6rem', borderRadius: '50%', background: 'rgba(100, 116, 139, 0.15)', color: 'var(--text-muted)' }}>
                      <Wrench size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{countSinRegistro}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sin Historial</div>
                    </div>
                  </div>
                </div>

                {/* Barra de Filtros */}
                <div className="nm-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ flex: '1 1 200px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="nm-input"
                      placeholder="Buscar por inventario, usuario o modelo..."
                      style={{ paddingLeft: '2.4rem', fontSize: '0.85rem' }}
                      value={scheduleSearch}
                      onChange={(e) => setScheduleSearch(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Filter size={16} style={{ color: 'var(--text-muted)' }} />
                    <select
                      className="nm-select"
                      style={{ width: 'auto', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                      value={scheduleAgencyFilter}
                      onChange={(e) => setScheduleAgencyFilter(e.target.value)}
                    >
                      <option value="ALL">Todas las Sedes</option>
                      {agencies.map((a) => (
                        <option key={a.id} value={a.id}>{a.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      className="nm-select"
                      style={{ width: 'auto', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                      value={scheduleStatusFilter}
                      onChange={(e) => setScheduleStatusFilter(e.target.value)}
                    >
                      <option value="ALL">Todos los Estados</option>
                      <option value="VENCIDO">🔴 Solo Vencidos</option>
                      <option value="PROXIMO">🟡 Próximos (≤30 días)</option>
                      <option value="AL_DIA">🟢 Al Día</option>
                      <option value="SIN_REGISTRO">⚪ Sin Historial</option>
                    </select>
                  </div>
                </div>

                {/* Leyenda de la Línea de Tiempo */}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                    <span>Último Mantenimiento Realizado</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                    <span>Próximo Programado (+6 Meses)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                    <span>Mantenimiento Vencido</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '14px', height: '3px', background: '#3b82f6', display: 'inline-block' }}></span>
                    <span>Línea de Hoy</span>
                  </div>
                </div>

                {/* Vista Desktop: Timeline Gantt Horizontal */}
                <div className="timeline-desktop-view">
                  <div className="timeline-container">
                    {/* Encabezado Meses */}
                    <div className="timeline-header-grid">
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        Equipo &amp; Usuario Responsable
                      </div>
                      <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                        {MONTHS.map((m, idx) => (
                          <div key={m} style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: idx === currentMonth && scheduleYear === currentYear ? '#3b82f6' : 'var(--text-muted)' }}>
                            {m}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Filas de Equipos */}
                    {filteredSchedule.map((item) => {
                      const eq = item.equipment;

                      let lastPercent: number | null = null;
                      let nextPercent: number | null = null;

                      if (item.lastDate && item.lastDate.getFullYear() === scheduleYear) {
                        lastPercent = ((item.lastDate.getMonth() + item.lastDate.getDate() / 30) / 12) * 100;
                      }
                      if (item.nextDate && item.nextDate.getFullYear() === scheduleYear) {
                        nextPercent = ((item.nextDate.getMonth() + item.nextDate.getDate() / 30) / 12) * 100;
                      }

                      let spanLeft: number | null = null;
                      let spanWidth: number | null = null;

                      if (item.lastDate && item.nextDate) {
                        const startYear = item.lastDate.getFullYear();
                        const endYear = item.nextDate.getFullYear();

                        if (startYear === scheduleYear && endYear === scheduleYear) {
                          spanLeft = lastPercent;
                          spanWidth = nextPercent! - lastPercent!;
                        } else if (startYear === scheduleYear && endYear > scheduleYear) {
                          spanLeft = lastPercent;
                          spanWidth = 100 - lastPercent!;
                        } else if (startYear < scheduleYear && endYear === scheduleYear) {
                          spanLeft = 0;
                          spanWidth = nextPercent!;
                        } else if (startYear < scheduleYear && endYear > scheduleYear) {
                          spanLeft = 0;
                          spanWidth = 100;
                        }
                      }

                      return (
                        <div key={eq.id} className="timeline-row-grid">
                          {/* Lado Izquierdo: Ficha del Equipo */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderRight: '1px solid var(--glass-border-subtle)', paddingRight: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{eq.tipoEquipo} ({eq.noInventario})</span>
                              <span
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  backgroundColor:
                                    item.status === 'AL_DIA'
                                      ? 'rgba(16, 185, 129, 0.15)'
                                      : item.status === 'PROXIMO'
                                      ? 'rgba(245, 158, 11, 0.15)'
                                      : item.status === 'VENCIDO'
                                      ? 'rgba(239, 68, 68, 0.15)'
                                      : 'rgba(100, 116, 139, 0.15)',
                                  color:
                                    item.status === 'AL_DIA'
                                      ? 'var(--success)'
                                      : item.status === 'PROXIMO'
                                      ? '#f59e0b'
                                      : item.status === 'VENCIDO'
                                      ? 'var(--error)'
                                      : 'var(--text-muted)'
                                }}
                              >
                                {item.status === 'AL_DIA' && `Al Día (${item.daysDiff}d)`}
                                {item.status === 'PROXIMO' && `Próximo (${item.daysDiff}d)`}
                                {item.status === 'VENCIDO' && `Vencido (${Math.abs(item.daysDiff!)}d)`}
                                {item.status === 'SIN_REGISTRO' && 'Sin Historial'}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <strong>Sede:</strong> {eq.agencia?.nombre || 'N/A'} | <strong>Ref:</strong> {eq.marca} {eq.modelo}
                            </div>

                            <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-light)' }}>
                              <UserCheck size={14} />
                              <span>{eq.usuarioSucursal ? `${eq.usuarioSucursal} (${eq.areaSucursal || 'General'})` : 'Sin asignar'}</span>
                            </div>

                            {/* Acciones Rápidas */}
                            <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <button
                                className="nm-btn nm-btn-primary"
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                onClick={() => {
                                  setEditId(null);
                                  setMaintForm({
                                    idEquipo: eq.id,
                                    fecha: new Date().toISOString().substring(0, 10),
                                    tipo: 'PREVENTIVO',
                                    descripcion: 'Mantenimiento preventivo semestral programado',
                                    realizadoPor: '',
                                    observaciones: ''
                                  });
                                  setModalType('MAINTENANCE');
                                  setModalOpen(true);
                                }}
                              >
                                <Plus size={12} /> Registrar Mantenimiento
                              </button>
                              <button
                                className="nm-btn"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                title="Ver historial completo de mantenimientos"
                                onClick={() => {
                                  setSelectedEquipmentDetail(eq);
                                  setModalType('EQUIPMENT_DETAIL');
                                  setModalOpen(true);
                                }}
                              >
                                <History size={12} /> Historial ({maintenances.filter(m => m.idEquipo === eq.id).length})
                              </button>
                            </div>
                          </div>

                          {/* Lado Derecho: Línea de Tiempo (Track 12 Meses) */}
                          <div className="timeline-track">
                            {MONTHS.map((m, idx) => (
                              <div key={m + idx} className="timeline-month-column" />
                            ))}

                            {todayPercent !== null && (
                              <div className="timeline-today-marker" style={{ left: `${todayPercent}%` }} title={`Hoy: ${today.toLocaleDateString()}`} />
                            )}

                            {spanLeft !== null && spanWidth !== null && spanWidth > 0 && (
                              <div
                                className="timeline-span-bar"
                                style={{
                                  left: `${spanLeft}%`,
                                  width: `${Math.min(spanWidth, 100 - spanLeft)}%`
                                }}
                              />
                            )}

                            {/* Renderizar TODOS los mantenimientos realizados en el año seleccionado */}
                            {maintenances
                              .filter(m => m.idEquipo === eq.id && new Date(m.fecha).getFullYear() === scheduleYear)
                              .map(m => {
                                const pDate = new Date(m.fecha);
                                const pPercent = ((pDate.getMonth() + pDate.getDate() / 30) / 12) * 100;
                                return (
                                  <div
                                    key={m.id}
                                    className="timeline-event-marker"
                                    style={{
                                      left: `${pPercent}%`,
                                      background: '#10b981',
                                      color: '#ffffff'
                                    }}
                                    title={`Mantenimiento (${m.tipo}): ${pDate.toLocaleDateString()} - Técnico: ${m.realizadoPor}`}
                                  >
                                    <CheckCircle2 size={15} />
                                  </div>
                                );
                              })}

                            {nextPercent !== null && item.nextDate && (
                              <div
                                className="timeline-event-marker"
                                style={{
                                  left: `${nextPercent}%`,
                                  background: item.status === 'VENCIDO' ? '#ef4444' : item.status === 'PROXIMO' ? '#f59e0b' : '#14b8a6',
                                  color: '#ffffff',
                                  boxShadow: item.status === 'VENCIDO' ? '0 0 12px #ef4444' : '0 4px 12px rgba(0,0,0,0.2)'
                                }}
                                title={`Próximo Mantenimiento (+6 meses): ${item.nextDate.toLocaleDateString()}`}
                              >
                                {item.status === 'VENCIDO' ? <AlertTriangle size={14} /> : <Clock size={14} />}
                              </div>
                            )}

                            {item.status === 'SIN_REGISTRO' && (
                              <div style={{ position: 'absolute', width: '100%', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Sin mantenimientos registrados en este equipo
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vista Móvil (≤768px): Tarjetas Verticales sin Scroll Horizontal */}
                <div className="timeline-mobile-view">
                  {filteredSchedule.map((item) => {
                    const eq = item.equipment;
                    return (
                      <div key={'mob-' + eq.id} className="nm-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{eq.tipoEquipo} ({eq.noInventario})</h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{eq.marca} {eq.modelo} | {eq.agencia?.nombre || 'N/A'}</span>
                          </div>
                          <span
                            style={{
                              padding: '0.25rem 0.55rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor:
                                item.status === 'AL_DIA'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : item.status === 'PROXIMO'
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : item.status === 'VENCIDO'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(100, 116, 139, 0.15)',
                              color:
                                item.status === 'AL_DIA'
                                  ? 'var(--success)'
                                  : item.status === 'PROXIMO'
                                  ? '#f59e0b'
                                  : item.status === 'VENCIDO'
                                  ? 'var(--error)'
                                  : 'var(--text-muted)'
                            }}
                          >
                            {item.status === 'AL_DIA' && `Al Día (${item.daysDiff}d)`}
                            {item.status === 'PROXIMO' && `Próximo (${item.daysDiff}d)`}
                            {item.status === 'VENCIDO' && `Vencido (${Math.abs(item.daysDiff!)}d)`}
                            {item.status === 'SIN_REGISTRO' && 'Sin Historial'}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-light)' }}>
                          <UserCheck size={14} />
                          <span>{eq.usuarioSucursal ? `${eq.usuarioSucursal} (${eq.areaSucursal || 'General'})` : 'Sin asignar'}</span>
                        </div>

                        {/* Ciclo Semestral Móvil */}
                        <div className="nm-card-sunken" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                              <strong>Último Realizado:</strong>
                            </span>
                            <span>{item.lastDate ? item.lastDate.toLocaleDateString() : 'Sin registro'}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Clock size={14} style={{ color: item.status === 'VENCIDO' ? '#ef4444' : '#f59e0b' }} />
                              <strong>Próximo (+6 Meses):</strong>
                            </span>
                            <span style={{ fontWeight: 700, color: item.status === 'VENCIDO' ? 'var(--error)' : 'inherit' }}>
                              {item.nextDate ? item.nextDate.toLocaleDateString() : 'Pendiente'}
                            </span>
                          </div>
                        </div>

                        <button
                          className="nm-btn nm-btn-primary"
                          style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
                          onClick={() => {
                            setEditId(null);
                            setMaintForm({
                              idEquipo: eq.id,
                              fecha: new Date().toISOString().substring(0, 10),
                              tipo: 'PREVENTIVO',
                              descripcion: 'Mantenimiento preventivo semestral programado',
                              realizadoPor: '',
                              observaciones: ''
                            });
                            setModalType('MAINTENANCE');
                            setModalOpen(true);
                          }}
                        >
                          <Plus size={14} /> Registrar Mantenimiento
                        </button>
                      </div>
                    );
                  })}
                </div>

                {filteredSchedule.length === 0 && (
                  <div className="nm-card-sunken" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    <CalendarClock size={36} style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
                    <p>No se encontraron equipos que coincidan con los filtros seleccionados.</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* AGENCIAS TAB */}
          {activeTab === 'AGENCIES' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 className="heading-font" style={{ fontSize: '1.5rem' }}>Agencias </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Administración de oficinas y agencias de la operadora</p>
                </div>
                <button className="nm-btn nm-btn-primary" onClick={() => {
                  setEditId(null);
                  setAgencyForm({ nombre: '' });
                  setModalType('AGENCY');
                  setModalOpen(true);
                }}>
                  <Plus size={16} /> Nueva Agencia
                </button>
              </div>

              {loading ? <p>Cargando agencias...</p> : (
                <div className="nm-table-container" style={{ maxWidth: '600px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre de la Agencia</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agencies.map(a => (
                        <tr key={a.id}>
                          <td><strong>{a.nombre}</strong></td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="nm-btn" style={{ padding: '0.4rem' }} onClick={() => {
                                setEditId(a.id);
                                setAgencyForm({ nombre: a.nombre });
                                setModalType('AGENCY');
                                setModalOpen(true);
                              }}>
                                <Edit2 size={14} />
                              </button>
                              {user?.rol === 'super_admin' && (
                                <button className="nm-btn nm-btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleAgencyDelete(a.id)}>
                                  <Trash2 size={14} style={{ color: 'var(--error)' }} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {agencies.length === 0 && (
                        <tr>
                          <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay agencias creadas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* USUARIOS TAB */}
          {activeTab === 'USERS' && user?.rol === 'super_admin' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 className="heading-font" style={{ fontSize: '1.5rem' }}>Gestión de Usuarios</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Usuarios autorizados para editar y administrar inventarios</p>
                </div>
                <button className="nm-btn nm-btn-primary" onClick={() => {
                  setEditId(null);
                  setUserForm({ username: '', password: '', role: 'editor' });
                  setModalType('USER');
                  setModalOpen(true);
                }}>
                  <Plus size={16} /> Agregar Usuario
                </button>
              </div>

              {loading ? <p>Cargando usuarios...</p> : (
                <div className="nm-table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre de Usuario</th>
                        <th>Rol</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td><strong>{u.username}</strong></td>
                          <td>
                            <span style={{ fontWeight: 600, color: u.role === 'super_admin' ? 'var(--accent)' : 'var(--primary-light)' }}>
                              {u.role === 'super_admin' ? 'Super Admin' : 'Editor'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="nm-btn" style={{ padding: '0.4rem' }} onClick={() => {
                                setEditId(u.id);
                                setUserForm({ username: u.username, password: '', role: u.role });
                                setModalType('USER');
                                setModalOpen(true);
                              }}>
                                <Edit2 size={14} />
                              </button>
                              <button className="nm-btn nm-btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleUserDelete(u.id)}>
                                <Trash2 size={14} style={{ color: 'var(--error)' }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* AUDITORIA TAB */}
          {activeTab === 'AUDIT' && user?.rol === 'super_admin' && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h2 className="heading-font" style={{ fontSize: '1.5rem' }}>Bitácora de Cambios (Triggers)</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Historial transaccional auditado automáticamente en Supabase</p>
              </div>

              {loading ? <p>Cargando bitácora...</p> : (
                <div className="nm-table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tabla</th>
                        <th>Acción</th>
                        <th>Usuario</th>
                        <th>Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id}>
                          <td>{new Date(log.createdAt).toLocaleString('es-ES')}</td>
                          <td><strong>{log.tableName}</strong></td>
                          <td>
                            <span style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: log.action === 'INSERT' ? 'rgba(16, 185, 129, 0.15)' : log.action === 'UPDATE' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: log.action === 'INSERT' ? 'var(--success)' : log.action === 'UPDATE' ? 'var(--primary-light)' : 'var(--error)'
                            }}>
                              {log.action}
                            </span>
                          </td>
                          <td>{log.user ? log.user.username : 'Sistema/Supabase'}</td>
                          <td>
                            <button className="nm-btn" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} onClick={() => {
                              setSelectedAuditLog(log);
                              setModalType('AUDIT_DETAIL');
                              setModalOpen(true);
                            }}>
                              <Eye size={12} style={{ marginRight: '0.2rem' }} /> Ver Datos
                            </button>
                          </td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay registros de auditoría.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ==========================================
         MODALES NEUMÓRFICOS DE CREACIÓN/EDICIÓN
         ========================================== */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}>
          <div className="nm-card" style={{ width: '100%', maxWidth: modalType === 'EQUIPMENT' ? '700px' : '480px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(0,0,0,0.02)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              <h3 className="heading-font" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCode size={20} style={{ color: 'var(--primary-light)' }} />
                {editId ? 'Editar Registro' : 'Nuevo Registro'}
              </h3>
              <button className="nm-btn" style={{ padding: '0.4rem', borderRadius: '50%' }} onClick={() => setModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {actionError && (
              <div className="nm-card-sunken" style={{ padding: '0.75rem 1rem', color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)' }}>
                {actionError}
              </div>
            )}

            {/* FORMULARIO AGENCIAS */}
            {modalType === 'AGENCY' && (
              <form onSubmit={handleAgencySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nombre de la Agencia</label>
                  <input
                    type="text"
                    className="nm-input"
                    value={agencyForm.nombre}
                    onChange={(e) => setAgencyForm({ nombre: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="nm-btn nm-btn-primary" style={{ width: '100%' }}>Guardar Agencia</button>
              </form>
            )}

            {/* FORMULARIO EQUIPOS */}
            {modalType === 'EQUIPMENT' && (
              <form onSubmit={handleEquipSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Sede / Agencia</label>
                    <select
                      className="nm-select"
                      value={equipForm.idAgencia}
                      onChange={(e) => setEquipForm({ ...equipForm, idAgencia: e.target.value })}
                      required
                    >
                      <option value="">Selecciona una Agencia</option>
                      {agencies.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>N° Inventario</label>
                    <input
                      type="text"
                      className="nm-input"
                      value={equipForm.noInventario}
                      onChange={(e) => setEquipForm({ ...equipForm, noInventario: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tipo Equipo</label>
                    <input
                      type="text"
                      className="nm-input"
                      value={equipForm.tipoEquipo}
                      onChange={(e) => setEquipForm({ ...equipForm, tipoEquipo: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Marca</label>
                    <input
                      type="text"
                      className="nm-input"
                      value={equipForm.marca}
                      onChange={(e) => setEquipForm({ ...equipForm, marca: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Modelo</label>
                    <input
                      type="text"
                      className="nm-input"
                      value={equipForm.modelo}
                      onChange={(e) => setEquipForm({ ...equipForm, modelo: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Referencia</label>
                    <input
                      type="text"
                      className="nm-input"
                      value={equipForm.referencia}
                      onChange={(e) => setEquipForm({ ...equipForm, referencia: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Procesador</label>
                    <input
                      type="text"
                      className="nm-input"
                      value={equipForm.procesador}
                      onChange={(e) => setEquipForm({ ...equipForm, procesador: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Memoria RAM</label>
                    <input
                      type="text"
                      className="nm-input"
                      value={equipForm.memoriaRam}
                      onChange={(e) => setEquipForm({ ...equipForm, memoriaRam: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Disco Duro</label>
                    <input
                      type="text"
                      className="nm-input"
                      value={equipForm.discoDuro}
                      onChange={(e) => setEquipForm({ ...equipForm, discoDuro: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Serial</label>
                    <input
                      type="text"
                      className="nm-input"
                      value={equipForm.serial}
                      onChange={(e) => setEquipForm({ ...equipForm, serial: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Usuario Asignado</label>
                    <input
                      type="text"
                      className="nm-input"
                      value={equipForm.usuarioSucursal}
                      onChange={(e) => setEquipForm({ ...equipForm, usuarioSucursal: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Área</label>
                    <input
                      type="text"
                      className="nm-input"
                      value={equipForm.areaSucursal}
                      onChange={(e) => setEquipForm({ ...equipForm, areaSucursal: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Cargo</label>
                    <input
                      type="text"
                      className="nm-input"
                      value={equipForm.cargo}
                      onChange={(e) => setEquipForm({ ...equipForm, cargo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="nm-card-sunken" style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Periféricos y Otros</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                    <input type="text" placeholder="Teclado" className="nm-input" value={equipForm.teclado} onChange={(e) => setEquipForm({ ...equipForm, teclado: e.target.value })} />
                    <input type="text" placeholder="Mouse" className="nm-input" value={equipForm.mouse} onChange={(e) => setEquipForm({ ...equipForm, mouse: e.target.value })} />
                    <input type="text" placeholder="Impresora" className="nm-input" value={equipForm.impresora} onChange={(e) => setEquipForm({ ...equipForm, impresora: e.target.value })} />
                    <input type="text" placeholder="Otros" className="nm-input" value={equipForm.otros} onChange={(e) => setEquipForm({ ...equipForm, otros: e.target.value })} />
                  </div>
                </div>

                <button type="submit" className="nm-btn nm-btn-primary" style={{ width: '100%' }}>Guardar Equipo</button>
              </form>
            )}

            {/* FORMULARIO MANTENIMIENTOS */}
            {modalType === 'MAINTENANCE' && (
              <form onSubmit={handleMaintSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Equipo Asociado</label>
                  <select
                    className="nm-select"
                    value={maintForm.idEquipo}
                    onChange={(e) => setMaintForm({ ...maintForm, idEquipo: e.target.value })}
                    required
                  >
                    <option value="">Selecciona un Equipo</option>
                    {equipments.map(eq => <option key={eq.id} value={eq.id}>{eq.tipoEquipo} ({eq.noInventario}) - {eq.marca}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Fecha de Intervención</label>
                    <input
                      type="date"
                      className="nm-input"
                      value={maintForm.fecha}
                      onChange={(e) => setMaintForm({ ...maintForm, fecha: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tipo Mantenimiento</label>
                    <select
                      className="nm-select"
                      value={maintForm.tipo}
                      onChange={(e) => setMaintForm({ ...maintForm, tipo: e.target.value as 'PREVENTIVO' | 'CORRECTIVO' })}
                      required
                    >
                      <option value="PREVENTIVO">PREVENTIVO</option>
                      <option value="CORRECTIVO">CORRECTIVO</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Descripción Técnica</label>
                  <textarea
                    className="nm-input"
                    rows={3}
                    style={{ resize: 'none', fontFamily: 'var(--font-body)' }}
                    value={maintForm.descripcion}
                    onChange={(e) => setMaintForm({ ...maintForm, descripcion: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Realizado Por (Técnico)</label>
                  <input
                    type="text"
                    className="nm-input"
                    value={maintForm.realizadoPor}
                    onChange={(e) => setMaintForm({ ...maintForm, realizadoPor: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Observaciones</label>
                  <textarea
                    className="nm-input"
                    rows={2}
                    style={{ resize: 'none', fontFamily: 'var(--font-body)' }}
                    value={maintForm.observaciones}
                    onChange={(e) => setMaintForm({ ...maintForm, observaciones: e.target.value })}
                  />
                </div>

                <button type="submit" className="nm-btn nm-btn-primary" style={{ width: '100%' }}>Guardar Mantenimiento</button>
              </form>
            )}

            {/* FORMULARIO USUARIOS */}
            {modalType === 'USER' && (
              <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nombre de Usuario</label>
                  <input
                    type="text"
                    className="nm-input"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Contraseña</label>
                  <input
                    type="password"
                    className="nm-input"
                    placeholder={editId ? '(Dejar vacío para no cambiar)' : 'Mínimo 6 caracteres'}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required={!editId}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Rol Administrativo</label>
                  <select
                    className="nm-select"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'super_admin' | 'editor' })}
                    required
                  >
                    <option value="editor">Editor</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <button type="submit" className="nm-btn nm-btn-primary" style={{ width: '100%' }}>Guardar Usuario</button>
              </form>
            )}

            {/* DETALLES DE AUDITORIA */}
            {modalType === 'AUDIT_DETAIL' && selectedAuditLog && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="nm-card-sunken" style={{ padding: '1rem', fontSize: '0.85rem' }}>
                  <p><strong>Operación:</strong> {selectedAuditLog.action} en {selectedAuditLog.tableName}</p>
                  <p><strong>ID Afectado:</strong> {selectedAuditLog.recordId}</p>
                  <p><strong>Fecha:</strong> {new Date(selectedAuditLog.createdAt).toLocaleString()}</p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Valores Anteriores (OLD):</h4>
                  <pre className="nm-card-sunken" style={{ padding: '1rem', fontSize: '0.8rem', overflowX: 'auto', maxHeight: '150px' }}>
                    {selectedAuditLog.oldValues ? JSON.stringify(selectedAuditLog.oldValues, null, 2) : 'Ninguno (INSERT)'}
                  </pre>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Valores Nuevos (NEW):</h4>
                  <pre className="nm-card-sunken" style={{ padding: '1rem', fontSize: '0.8', overflowX: 'auto', maxHeight: '150px' }}>
                    {selectedAuditLog.newValues ? JSON.stringify(selectedAuditLog.newValues, null, 2) : 'Ninguno (DELETE)'}
                  </pre>
                </div>
              </div>
            )}

            {/* DETALLES DE EQUIPO */}
            {modalType === 'EQUIPMENT_DETAIL' && selectedEquipmentDetail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="nm-card-sunken" style={{ padding: '1rem', fontSize: '0.85rem' }}>
                  <p style={{ marginBottom: '0.3rem' }}><strong>N° Inventario:</strong> {selectedEquipmentDetail.noInventario}</p>
                  <p style={{ marginBottom: '0.3rem' }}><strong>Sede / Agencia:</strong> {selectedEquipmentDetail.agencia?.nombre || 'N/A'}</p>
                  <p style={{ marginBottom: '0.3rem' }}><strong>Tipo de Equipo:</strong> {selectedEquipmentDetail.tipoEquipo}</p>
                  <p style={{ marginBottom: '0.3rem' }}><strong>Marca / Modelo:</strong> {selectedEquipmentDetail.marca} {selectedEquipmentDetail.modelo}</p>
                  <p><strong>Referencia:</strong> {selectedEquipmentDetail.referencia}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="nm-card-sunken" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                    <h5 style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--primary-light)' }}>Especificaciones</h5>
                    <p style={{ marginBottom: '0.25rem' }}><strong>Procesador:</strong> {selectedEquipmentDetail.procesador || 'N/A'}</p>
                    <p style={{ marginBottom: '0.25rem' }}><strong>Memoria RAM:</strong> {selectedEquipmentDetail.memoriaRam || 'N/A'}</p>
                    <p style={{ marginBottom: '0.25rem' }}><strong>Disco Duro:</strong> {selectedEquipmentDetail.discoDuro || 'N/A'}</p>
                    <p><strong>Serial:</strong> {selectedEquipmentDetail.serial || 'N/A'}</p>
                  </div>

                  <div className="nm-card-sunken" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                    <h5 style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--primary-light)' }}>Asignación</h5>
                    <p style={{ marginBottom: '0.25rem' }}><strong>Usuario:</strong> {selectedEquipmentDetail.usuarioSucursal || 'N/A'}</p>
                    <p style={{ marginBottom: '0.25rem' }}><strong>Área:</strong> {selectedEquipmentDetail.areaSucursal || 'N/A'}</p>
                    <p><strong>Cargo:</strong> {selectedEquipmentDetail.cargo || 'N/A'}</p>
                  </div>
                </div>

                <div className="nm-card-sunken" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                  <h5 style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--primary-light)' }}>Accesorios</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                    <p><strong>Teclado:</strong> {selectedEquipmentDetail.teclado || 'N/A'}</p>
                    <p><strong>Mouse:</strong> {selectedEquipmentDetail.mouse || 'N/A'}</p>
                    <p><strong>Impresora:</strong> {selectedEquipmentDetail.impresora || 'N/A'}</p>
                    <p><strong>Otros:</strong> {selectedEquipmentDetail.otros || 'N/A'}</p>
                  </div>
                </div>

                {/* Historial Completo de Mantenimientos Realizados */}
                <div className="nm-card-sunken" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                  <h5 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <History size={16} />
                    Historial Completo de Mantenimientos ({maintenances.filter(m => m.idEquipo === selectedEquipmentDetail.id).length})
                  </h5>
                  {maintenances.filter(m => m.idEquipo === selectedEquipmentDetail.id).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>No hay registros de mantenimientos previos para este equipo.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                      {maintenances
                        .filter(m => m.idEquipo === selectedEquipmentDetail.id)
                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                        .map(m => (
                          <div key={m.id} style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                                {new Date(m.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                                <span style={{
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '3px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  backgroundColor: m.tipo === 'PREVENTIVO' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: m.tipo === 'PREVENTIVO' ? 'var(--success)' : 'var(--error)'
                                }}>
                                  {m.tipo}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>{m.descripcion}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Técnico: <strong>{m.realizadoPor}</strong></div>
                              {m.observaciones && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.1rem' }}>Obs: {m.observaciones}</div>}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

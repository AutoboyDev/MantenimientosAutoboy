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
  History,
  Smartphone,
  Printer,
  FileText,
  FileSignature,
  ArrowLeft,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader
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

  // Datos Principales
  const [agencies, setAgencies] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Estados de Carga y Bloqueo de Doble Clic
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Estados de Paginación para cada tabla y cronograma
  const [pageInventory, setPageInventory] = useState(1);
  const [pageMaintenance, setPageMaintenance] = useState(1);
  const [pageSchedule, setPageSchedule] = useState(1);
  const [pageAgencies, setPageAgencies] = useState(1);
  const [pageUsers, setPageUsers] = useState(1);
  const [pageAudit, setPageAudit] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Control de Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'AGENCY' | 'EQUIPMENT' | 'MAINTENANCE' | 'USER' | 'AUDIT_DETAIL' | 'EQUIPMENT_DETAIL' | 'DOC_SELECT' | 'HOJA_DE_VIDA' | 'ACTA_DE_ENTREGA' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState<any>(null);
  const [selectedEquipmentDetail, setSelectedEquipmentDetail] = useState<any>(null);
  const [selectedEquipmentForHoja, setSelectedEquipmentForHoja] = useState<any>(null);

  // Datos para Acta de Entrega
  const [actaData, setActaData] = useState<{
    cedulaUsuario: string;
    quienEntrega: string;
    cargoQuienEntrega: string;
    responsableAnterior: string;
    valorEstimado: string;
    valoresAccesorios: Record<number, string>;
    fechaActa: string;
  }>({
    cedulaUsuario: '',
    quienEntrega: 'YEIMMY VIVIANA CAICEDO MUÑOZ',
    cargoQuienEntrega: 'Administrador de Sistemas',
    responsableAnterior: '',
    valorEstimado: '4.000.000',
    valoresAccesorios: {},
    fechaActa: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  });

  // Filtro de Categoría en Inventario
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<'ALL' | 'PC' | 'PHONE'>('ALL');
  const [equipCategory, setEquipCategory] = useState<'PC' | 'PHONE'>('PC');

  // Resetear páginas cuando cambian los filtros
  useEffect(() => {
    setPageInventory(1);
  }, [inventoryCategoryFilter]);

  useEffect(() => {
    setPageSchedule(1);
  }, [scheduleAgencyFilter, scheduleStatusFilter, scheduleSearch, scheduleYear]);

  // Helper para detectar si un equipo es teléfono
  const isPhone = (eq: any) => {
    const t = String(eq?.tipoEquipo || '').toLowerCase();
    return t.includes('celular') || t.includes('teléfono') || t.includes('telefono') || t.includes('móvil') || t.includes('movil') || t.includes('smartphone') || !!eq?.imei1 || !!eq?.numeroLinea;
  };

  // Helper para extraer accesorios dinámicos o convertir campos legacy
  const getEquipmentAccessories = (eq: any): Array<{ tipo: string; codigoActivo?: string; marca: string; modelo: string; serial: string }> => {
    if (Array.isArray(eq?.accesorios) && eq.accesorios.length > 0) {
      return eq.accesorios;
    }
    const list: Array<{ tipo: string; codigoActivo?: string; marca: string; modelo: string; serial: string }> = [];
    if (eq?.teclado) list.push({ tipo: 'Teclado', codigoActivo: '', marca: '', modelo: '', serial: eq.teclado });
    if (eq?.mouse) list.push({ tipo: 'Mouse', codigoActivo: '', marca: '', modelo: '', serial: eq.mouse });
    if (eq?.impresora) list.push({ tipo: 'Impresora', codigoActivo: '', marca: '', modelo: '', serial: eq.impresora });
    if (eq?.otros) list.push({ tipo: 'Otros', codigoActivo: '', marca: '', modelo: '', serial: eq.otros });
    if (eq?.cargadorMarca || eq?.cargadorSerial) {
      list.push({ tipo: 'Cargador', codigoActivo: '', marca: eq.cargadorMarca || '', modelo: '', serial: eq.cargadorSerial || '' });
    }
    return list;
  };

  // Componente Reutilizable de Paginación
  const PaginationBar: React.FC<{
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (limit: number) => void;
    label?: string;
  }> = ({ currentPage, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange, label = 'registros' }) => {
    if (totalItems === 0) return null;

    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        if (currentPage > 3) pages.push('...');
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
      }
      return pages;
    };

    return (
      <div className="nm-pagination no-print">
        <div className="nm-pagination-info">
          Mostrando <strong>{startItem}</strong> - <strong>{endItem}</strong> de <strong>{totalItems}</strong> {label}
        </div>

        <div className="nm-pagination-controls">
          {onItemsPerPageChange && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Por pág:</span>
              <select
                className="nm-pagination-select"
                value={itemsPerPage}
                onChange={(e) => {
                  onItemsPerPageChange(Number(e.target.value));
                  onPageChange(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          )}

          <button
            className="nm-page-btn"
            title="Primera página"
            disabled={currentPage === 1}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft size={14} />
          </button>

          <button
            className="nm-page-btn"
            title="Página anterior"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft size={14} />
          </button>

          {getPageNumbers().map((p, idx) => (
            typeof p === 'number' ? (
              <button
                key={idx}
                className={`nm-page-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            ) : (
              <span key={idx} style={{ padding: '0 0.2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {p}
              </span>
            )
          ))}

          <button
            className="nm-page-btn"
            title="Página siguiente"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight size={14} />
          </button>

          <button
            className="nm-page-btn"
            title="Última página"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  // Form Data de Agencias
  const [agencyForm, setAgencyForm] = useState({ nombre: '' });

  // Form Data de Equipos (Computador + Telefonía + Vida Útil + Accesorios Dinámicos)
  const [equipForm, setEquipForm] = useState({
    idAgencia: '',
    noInventario: '',
    tipoEquipo: 'Computador',
    marca: '',
    referencia: '',
    modelo: '',
    vidaUtil: '3 años',
    fechaCompra: '',
    ubicacion: '',
    reubicacion: 'N/A',
    estado: 'Activo',
    // Hardware PC
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
    otros: '',
    // Telefonía Celular
    imei1: '',
    imei2: '',
    numeroLinea: '',
    imeiSimcard: '',
    correo: '',
    claveCorreo: '',
    appLock: 'N/A',
    cargadorMarca: '',
    cargadorSerial: '',
    cargadorFechaCompra: '',
    observaciones: '',
    // Accesorios Dinámicos
    accesorios: [
      { id: 1, tipo: 'Teclado', codigoActivo: '', marca: '', modelo: '', serial: '' },
      { id: 2, tipo: 'Mouse', codigoActivo: '', marca: '', modelo: '', serial: '' }
    ] as Array<{ id: number | string; tipo: string; codigoActivo?: string; marca: string; modelo: string; serial: string; }>
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
        const [eqData, agData, mData, auData] = await Promise.all([
          api.get('/inventory/findAll'),
          api.get('/agency/findAll'),
          api.get('/maintenance/findAll'),
          api.get('/audit/findAll').catch(() => [])
        ]);
        setEquipments(eqData);
        setAgencies(agData);
        setMaintenances(mData);
        setAuditLogs(auData || []);
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
    if (isSubmitting) return;
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
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
    if (isSubmitting) return;
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
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
    if (isSubmitting) return;
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
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
    if (isSubmitting) return;
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
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
      <nav className="nm-nav no-print">
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
            <span>Cronograma</span>
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
          {activeTab === 'INVENTORY' && (() => {
            const filteredEquips = equipments.filter(eq => {
              if (inventoryCategoryFilter === 'PC') return !isPhone(eq);
              if (inventoryCategoryFilter === 'PHONE') return isPhone(eq);
              return true;
            });

            const paginatedEquips = filteredEquips.slice(
              (pageInventory - 1) * itemsPerPage,
              pageInventory * itemsPerPage
            );

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 className="heading-font" style={{ fontSize: '1.5rem' }}>Inventario de Recursos Tecnológicos</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Control de computadores, portátiles y teléfonos celulares registrados</p>
                  </div>
                  <button className="nm-btn nm-btn-primary" onClick={() => {
                    setEditId(null);
                    setEquipCategory('PC');
                    setEquipForm({
                      idAgencia: agencies[0]?.id || '',
                      noInventario: '',
                      tipoEquipo: 'Computador',
                      marca: '',
                      referencia: '',
                      modelo: '',
                      vidaUtil: '3 años',
                      fechaCompra: '',
                      ubicacion: '',
                      reubicacion: 'N/A',
                      estado: 'Activo',
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
                      otros: '',
                      imei1: '',
                      imei2: '',
                      numeroLinea: '',
                      imeiSimcard: '',
                      correo: '',
                      claveCorreo: '',
                      appLock: 'N/A',
                      cargadorMarca: '',
                      cargadorSerial: '',
                      cargadorFechaCompra: '',
                      observaciones: '',
                      accesorios: [
                        { id: 1, tipo: 'Teclado', codigoActivo: '', marca: '', modelo: '', serial: '' },
                        { id: 2, tipo: 'Mouse', codigoActivo: '', marca: '', modelo: '', serial: '' }
                      ]
                    });
                    setModalType('EQUIPMENT');
                    setModalOpen(true);
                  }}>
                    <Plus size={16} /> Agregar Equipo
                  </button>
                </div>

                {/* Filtro Inteligente de Categorías */}
                <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div className="category-pills">
                    <button
                      className={`category-pill ${inventoryCategoryFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setInventoryCategoryFilter('ALL')}
                    >
                      <Layers size={14} /> Todos ({equipments.length})
                    </button>
                    <button
                      className={`category-pill ${inventoryCategoryFilter === 'PC' ? 'active' : ''}`}
                      onClick={() => setInventoryCategoryFilter('PC')}
                    >
                      <Laptop size={14} /> Computadores ({equipments.filter(e => !isPhone(e)).length})
                    </button>
                    <button
                      className={`category-pill ${inventoryCategoryFilter === 'PHONE' ? 'active' : ''}`}
                      onClick={() => setInventoryCategoryFilter('PHONE')}
                    >
                      <Smartphone size={14} /> Teléfonos ({equipments.filter(e => isPhone(e)).length})
                    </button>
                  </div>
                </div>

                {loading ? <p>Cargando inventario...</p> : (
                  <>
                    <div className="nm-table-container">
                      <table>
                        <thead>
                          {inventoryCategoryFilter === 'PHONE' ? (
                            <tr>
                              <th>N° Inv</th>
                              <th>Sede / Agencia</th>
                              <th>Marca / Modelo</th>
                              <th>N° Línea</th>
                              <th>IMEI 1</th>
                              <th>Correo Asignado</th>
                              <th>Responsable</th>
                              <th>Vida Útil</th>
                              <th>Estado</th>
                              <th>Acciones</th>
                            </tr>
                          ) : inventoryCategoryFilter === 'PC' ? (
                            <tr>
                              <th>N° Inv</th>
                              <th>Sede / Agencia</th>
                              <th>Tipo</th>
                              <th>Marca / Modelo</th>
                              <th>Procesador / RAM</th>
                              <th>Disco Duro</th>
                              <th>Responsable</th>
                              <th>Vida Útil</th>
                              <th>Estado</th>
                              <th>Acciones</th>
                            </tr>
                          ) : (
                            <tr>
                              <th>N° Inv</th>
                              <th>Sede / Agencia</th>
                              <th>Tipo</th>
                              <th>Marca / Modelo</th>
                              <th>Serial / IMEI</th>
                              <th>Responsable</th>
                              <th>Vida Útil</th>
                              <th>Estado</th>
                              <th>Acciones</th>
                            </tr>
                          )}
                        </thead>
                        <tbody>
                          {paginatedEquips.map(eq => {
                            const phone = isPhone(eq);
                            return (
                              <tr key={eq.id}>
                                <td><strong>{eq.noInventario}</strong></td>
                                <td>{eq.agencia?.nombre || 'N/A'}</td>
                                
                                {inventoryCategoryFilter === 'PHONE' ? (
                                  <>
                                    <td><strong>{eq.marca}</strong> {eq.modelo}</td>
                                    <td>{eq.numeroLinea ? <strong>{eq.numeroLinea}</strong> : <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{eq.imei1 || '-'}</td>
                                    <td style={{ fontSize: '0.8rem' }}>{eq.correo || '-'}</td>
                                  </>
                                ) : inventoryCategoryFilter === 'PC' ? (
                                  <>
                                    <td>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Laptop size={13} style={{ color: 'var(--primary-light)' }} />
                                        {eq.tipoEquipo}
                                      </span>
                                    </td>
                                    <td><strong>{eq.marca}</strong> {eq.modelo}</td>
                                    <td style={{ fontSize: '0.8rem' }}>{eq.procesador || '-'} / {eq.memoriaRam || '-'}</td>
                                    <td style={{ fontSize: '0.8rem' }}>{eq.discoDuro || '-'}</td>
                                  </>
                                ) : (
                                  <>
                                    <td>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        {phone ? <Smartphone size={13} style={{ color: '#10b981' }} /> : <Laptop size={13} style={{ color: 'var(--primary-light)' }} />}
                                        {eq.tipoEquipo}
                                      </span>
                                    </td>
                                    <td><strong>{eq.marca}</strong> {eq.modelo}</td>
                                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{phone ? (eq.imei1 || eq.numeroLinea || '-') : (eq.serial || '-')}</td>
                                  </>
                                )}

                                <td>{eq.usuarioSucursal || 'Sin asignar'}</td>
                                <td><span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{eq.vidaUtil || '3 años'}</span></td>
                                <td>
                                  <span style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    backgroundColor: eq.estado === 'Inactivo' || eq.estado === 'Dado de baja' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: eq.estado === 'Inactivo' || eq.estado === 'Dado de baja' ? 'var(--error)' : 'var(--success)'
                                  }}>
                                    {eq.estado || 'Activo'}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    <button
                                      className="nm-btn"
                                      style={{ padding: '0.4rem', color: '#3b82f6' }}
                                      title="Generar Documentos Oficiales (Hoja de Vida / Acta de Entrega)"
                                      onClick={() => {
                                        setSelectedEquipmentForHoja(eq);
                                        setSelectedEquipmentDetail(eq);
                                        const accs = getEquipmentAccessories(eq);
                                        const initialValoresAcc: Record<number, string> = {};
                                        accs.forEach((acc, idx) => {
                                          initialValoresAcc[idx] = (acc as any).valor || '';
                                        });
                                        setActaData({
                                          cedulaUsuario: eq.cedulaUsuario || '',
                                          quienEntrega: eq.quienEntrega || user?.username || 'YEIMMY VIVIANA CAICEDO MUÑOZ',
                                          cargoQuienEntrega: 'Administrador de Sistemas',
                                          responsableAnterior: eq.responsableAnterior || eq.usuarioSucursal || '',
                                          valorEstimado: eq.valorEstimado || '4.000.000',
                                          valoresAccesorios: initialValoresAcc,
                                          fechaActa: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
                                        });
                                        setModalType('DOC_SELECT');
                                        setModalOpen(true);
                                      }}
                                    >
                                      <FileText size={14} />
                                    </button>
                                    <button
                                      className="nm-btn"
                                      style={{ padding: '0.4rem' }}
                                      title="Ver detalles técnicos"
                                      onClick={() => {
                                        setSelectedEquipmentDetail(eq);
                                        setModalType('EQUIPMENT_DETAIL');
                                        setModalOpen(true);
                                      }}
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <button
                                      className="nm-btn"
                                      style={{ padding: '0.4rem' }}
                                      title="Editar"
                                      onClick={() => {
                                        setEditId(eq.id);
                                        setEquipCategory(isPhone(eq) ? 'PHONE' : 'PC');
                                        setEquipForm({
                                          idAgencia: eq.idAgencia || agencies[0]?.id || '',
                                          noInventario: eq.noInventario || '',
                                          tipoEquipo: eq.tipoEquipo || 'Computador',
                                          marca: eq.marca || '',
                                          referencia: eq.referencia || '',
                                          modelo: eq.modelo || '',
                                          vidaUtil: eq.vidaUtil || '3 años',
                                          fechaCompra: eq.fechaCompra || '',
                                          ubicacion: eq.ubicacion || '',
                                          reubicacion: eq.reubicacion || 'N/A',
                                          estado: eq.estado || 'Activo',
                                          procesador: eq.procesador || '',
                                          discoDuro: eq.discoDuro || '',
                                          memoriaRam: eq.memoriaRam || '',
                                          uniDvd: eq.uniDvd || 'N/A',
                                          serial: eq.serial || '',
                                          areaSucursal: eq.areaSucursal || '',
                                          cargo: eq.cargo || '',
                                          usuarioSucursal: eq.usuarioSucursal || '',
                                          mouse: eq.mouse || '',
                                          teclado: eq.teclado || '',
                                          impresora: eq.impresora || '',
                                          otros: eq.otros || '',
                                          imei1: eq.imei1 || '',
                                          imei2: eq.imei2 || '',
                                          numeroLinea: eq.numeroLinea || '',
                                          imeiSimcard: eq.imeiSimcard || '',
                                          correo: eq.correo || '',
                                          claveCorreo: eq.claveCorreo || '',
                                          appLock: eq.appLock || 'N/A',
                                          cargadorMarca: eq.cargadorMarca || '',
                                          cargadorSerial: eq.cargadorSerial || '',
                                          cargadorFechaCompra: eq.cargadorFechaCompra || '',
                                          observaciones: eq.observaciones || '',
                                          accesorios: (() => {
                                            const accs = getEquipmentAccessories(eq);
                                            return accs.length > 0
                                              ? accs.map((a, i) => ({ id: i + 1, tipo: a.tipo || '', codigoActivo: a.codigoActivo || '', marca: a.marca || '', modelo: a.modelo || '', serial: a.serial || '' }))
                                              : [{ id: 1, tipo: isPhone(eq) ? 'Cargador' : 'Teclado', codigoActivo: '', marca: '', modelo: '', serial: '' }];
                                          })()
                                        });
                                        setModalType('EQUIPMENT');
                                        setModalOpen(true);
                                      }}
                                    >
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
                            );
                          })}
                          {filteredEquips.length === 0 && (
                            <tr>
                              <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay equipos registrados en esta categoría.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <PaginationBar
                      currentPage={pageInventory}
                      totalItems={filteredEquips.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setPageInventory}
                      onItemsPerPageChange={setItemsPerPage}
                      label="equipos"
                    />
                  </>
                )}
              </div>
            );
          })()}

          {/* MANTENIMIENTO TAB */}
          {activeTab === 'MAINTENANCE' && (() => {
            const paginatedMaintenances = maintenances.slice(
              (pageMaintenance - 1) * itemsPerPage,
              pageMaintenance * itemsPerPage
            );

            return (
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
                  <>
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
                          {paginatedMaintenances.map(m => (
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
                    <PaginationBar
                      currentPage={pageMaintenance}
                      totalItems={maintenances.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setPageMaintenance}
                      onItemsPerPageChange={setItemsPerPage}
                      label="mantenimientos"
                    />
                  </>
                )}
              </div>
            );
          })()}

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

            const paginatedSchedule = filteredSchedule.slice((pageSchedule - 1) * itemsPerPage, pageSchedule * itemsPerPage);

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
                      onChange={(e) => {
                        setScheduleSearch(e.target.value);
                        setPageSchedule(1);
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Filter size={16} style={{ color: 'var(--text-muted)' }} />
                    <select
                      className="nm-select"
                      style={{ width: 'auto', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                      value={scheduleAgencyFilter}
                      onChange={(e) => {
                        setScheduleAgencyFilter(e.target.value);
                        setPageSchedule(1);
                      }}
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
                      onChange={(e) => {
                        setScheduleStatusFilter(e.target.value);
                        setPageSchedule(1);
                      }}
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
                    {paginatedSchedule.map((item) => {
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
                  {paginatedSchedule.map((item) => {
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

                <PaginationBar
                  currentPage={pageSchedule}
                  totalItems={filteredSchedule.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(p) => setPageSchedule(p)}
                  onItemsPerPageChange={(limit) => {
                    setItemsPerPage(limit);
                    setPageSchedule(1);
                  }}
                  label="equipos en cronograma"
                />
              </div>
            );
          })()}

          {/* AGENCIAS TAB */}
          {activeTab === 'AGENCIES' && (() => {
            const paginatedAgencies = agencies.slice((pageAgencies - 1) * itemsPerPage, pageAgencies * itemsPerPage);
            return (
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
                  <>
                    <div className="nm-table-container" style={{ maxWidth: '600px' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Nombre de la Agencia</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedAgencies.map(a => (
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

                    <PaginationBar
                      currentPage={pageAgencies}
                      totalItems={agencies.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={(p) => setPageAgencies(p)}
                      onItemsPerPageChange={(limit) => {
                        setItemsPerPage(limit);
                        setPageAgencies(1);
                      }}
                      label="agencias"
                    />
                  </>
                )}
              </div>
            );
          })()}

          {/* USUARIOS TAB */}
          {activeTab === 'USERS' && user?.rol === 'super_admin' && (() => {
            const paginatedUsers = users.slice((pageUsers - 1) * itemsPerPage, pageUsers * itemsPerPage);
            return (
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
                  <>
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
                          {paginatedUsers.map(u => (
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

                    <PaginationBar
                      currentPage={pageUsers}
                      totalItems={users.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={(p) => setPageUsers(p)}
                      onItemsPerPageChange={(limit) => {
                        setItemsPerPage(limit);
                        setPageUsers(1);
                      }}
                      label="usuarios"
                    />
                  </>
                )}
              </div>
            );
          })()}

          {/* AUDITORIA TAB */}
          {activeTab === 'AUDIT' && user?.rol === 'super_admin' && (() => {
            const paginatedAudit = auditLogs.slice((pageAudit - 1) * itemsPerPage, pageAudit * itemsPerPage);
            return (
              <div>
                <div style={{ marginBottom: '2rem' }}>
                  <h2 className="heading-font" style={{ fontSize: '1.5rem' }}>Bitácora de Cambios (Triggers)</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Historial transaccional auditado automáticamente en Supabase</p>
                </div>

                {loading ? <p>Cargando bitácora...</p> : (
                  <>
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
                          {paginatedAudit.map(log => (
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

                    <PaginationBar
                      currentPage={pageAudit}
                      totalItems={auditLogs.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={(p) => setPageAudit(p)}
                      onItemsPerPageChange={(limit) => {
                        setItemsPerPage(limit);
                        setPageAudit(1);
                      }}
                      label="registros"
                    />
                  </>
                )}
              </div>
            );
          })()}
        </main>
      </div>

      {/* ==========================================
         MODALES NEUMÓRFICOS DE CREACIÓN/EDICIÓN
         ========================================== */}
      {modalOpen && (
        <div className={`nm-modal-backdrop ${modalType === 'HOJA_DE_VIDA' || modalType === 'ACTA_DE_ENTREGA' ? 'modal-hoja-vida-overlay' : ''}`} style={{
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
          <div className={`nm-card ${modalType === 'HOJA_DE_VIDA' || modalType === 'ACTA_DE_ENTREGA' ? 'modal-hoja-vida-card' : ''}`} style={{ width: '100%', maxWidth: modalType === 'HOJA_DE_VIDA' || modalType === 'ACTA_DE_ENTREGA' ? '920px' : modalType === 'DOC_SELECT' ? '680px' : modalType === 'EQUIPMENT' ? '760px' : '520px', maxHeight: '90vh', overflowY: 'auto', padding: modalType === 'HOJA_DE_VIDA' || modalType === 'ACTA_DE_ENTREGA' ? '1.5rem' : '2rem' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(0,0,0,0.02)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 className="heading-font" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {modalType === 'HOJA_DE_VIDA' ? <FileText size={20} style={{ color: '#3b82f6' }} /> : modalType === 'ACTA_DE_ENTREGA' ? <FileSignature size={20} style={{ color: '#2563eb' }} /> : modalType === 'DOC_SELECT' ? <FileText size={20} style={{ color: 'var(--primary-light)' }} /> : <FileCode size={20} style={{ color: 'var(--primary-light)' }} />}
                {modalType === 'HOJA_DE_VIDA' ? 'Hoja de Vida de Equipo Tecnológico (AUT-FOR-231)' : modalType === 'ACTA_DE_ENTREGA' ? 'Acta de Entrega y Recibo de Equipos (AUT-FOR-15)' : modalType === 'DOC_SELECT' ? 'Documentos Oficiales del Equipo' : editId ? 'Editar Registro' : 'Nuevo Registro'}
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

            {/* SELECTOR DE DOCUMENTOS */}
            {modalType === 'DOC_SELECT' && selectedEquipmentForHoja && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="nm-card-sunken" style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <strong>Equipo:</strong> {selectedEquipmentForHoja.tipoEquipo} ({selectedEquipmentForHoja.noInventario}) - {selectedEquipmentForHoja.marca} {selectedEquipmentForHoja.modelo}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    <strong>Responsable:</strong> {selectedEquipmentForHoja.usuarioSucursal || 'Sin asignar'}
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Selecciona el formato institucional que deseas generar, visualizar o imprimir para este equipo:
                </p>

                <div className="doc-selector-grid">
                  <div
                    className="doc-choice-card"
                    onClick={() => setModalType('HOJA_DE_VIDA')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Hoja de Vida</h4>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6' }}>AUT-FOR-231 | Versión 2</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      Especificaciones técnicas, hardware, identificadores de red/telefonía, accesorios, historial de mantenimientos y bitácora de auditoría.
                    </p>
                    <button className="nm-btn nm-btn-primary" style={{ marginTop: 'auto', width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}>
                      <FileText size={14} /> Abrir Hoja de Vida
                    </button>
                  </div>

                  <div
                    className="doc-choice-card"
                    onClick={() => setModalType('ACTA_DE_ENTREGA')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(37, 99, 235, 0.15)', color: '#2563eb' }}>
                        <FileSignature size={24} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Acta de Entrega</h4>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>AUT-FOR-15</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      Acta formal de entrega y recibo de equipos/herramientas, con declaración de responsabilidad del colaborador, detalle valorizado y firmas.
                    </p>
                    <button className="nm-btn nm-btn-primary" style={{ marginTop: 'auto', width: '100%', fontSize: '0.8rem', padding: '0.5rem', backgroundColor: '#2563eb', borderColor: '#2563eb' }}>
                      <FileSignature size={14} /> Abrir Acta de Entrega
                    </button>
                  </div>
                </div>
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
                <button type="submit" className="nm-btn nm-btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader className="gear-spin" size={16} /> Guardando...</> : (editId ? 'Actualizar Agencia' : 'Guardar Agencia')}
                </button>
              </form>
            )}

            {/* FORMULARIO EQUIPOS (COMPUTADOR / TELEFONO) */}
            {modalType === 'EQUIPMENT' && (
              <form onSubmit={handleEquipSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Selector de Categoría */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Tipo de Dispositivo a Registrar</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className={`nm-btn ${equipCategory === 'PC' ? 'nm-btn-primary' : ''}`}
                      style={{ padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
                      onClick={() => {
                        setEquipCategory('PC');
                        if (equipForm.tipoEquipo === 'Celular' || equipForm.tipoEquipo === 'Smartphone') {
                          setEquipForm({ ...equipForm, tipoEquipo: 'Computador' });
                        }
                      }}
                    >
                      <Laptop size={18} /> Computador / Portátil
                    </button>
                    <button
                      type="button"
                      className={`nm-btn ${equipCategory === 'PHONE' ? 'nm-btn-primary' : ''}`}
                      style={{ padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
                      onClick={() => {
                        setEquipCategory('PHONE');
                        if (equipForm.tipoEquipo === 'Computador' || equipForm.tipoEquipo === 'Todo en Uno') {
                          setEquipForm({ ...equipForm, tipoEquipo: 'Celular' });
                        }
                      }}
                    >
                      <Smartphone size={18} /> Teléfono Celular
                    </button>
                  </div>
                </div>

                {/* Datos Generales Base */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Sede / Agencia *</label>
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
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>N° Inventario *</label>
                    <input
                      type="text"
                      className="nm-input"
                      value={equipForm.noInventario}
                      onChange={(e) => setEquipForm({ ...equipForm, noInventario: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Tipo de Equipo *</label>
                    <input
                      type="text"
                      className="nm-input"
                      placeholder={equipCategory === 'PHONE' ? 'Ej: Celular, Smartphone' : 'Ej: Computador, Portátil'}
                      value={equipForm.tipoEquipo}
                      onChange={(e) => setEquipForm({ ...equipForm, tipoEquipo: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Marca *</label>
                    <input
                      type="text"
                      className="nm-input"
                      placeholder={equipCategory === 'PHONE' ? 'Ej: SAMSUNG, Xiaomi, Apple' : 'Ej: HP, Lenovo, Dell'}
                      value={equipForm.marca}
                      onChange={(e) => setEquipForm({ ...equipForm, marca: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Modelo *</label>
                    <input
                      type="text"
                      className="nm-input"
                      placeholder={equipCategory === 'PHONE' ? 'Ej: Galaxy A32 (SM-A325M/DS)' : 'Ej: ProDesk 400 G6'}
                      value={equipForm.modelo}
                      onChange={(e) => setEquipForm({ ...equipForm, modelo: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Referencia *</label>
                    <input
                      type="text"
                      className="nm-input"
                      placeholder="Referencia o N/A"
                      value={equipForm.referencia}
                      onChange={(e) => setEquipForm({ ...equipForm, referencia: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Vida Útil, Fecha Compra, Ubicación, Estado */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Vida Útil</label>
                    <input
                      type="text"
                      className="nm-input"
                      placeholder="Ej: 3 años, 5 años"
                      value={equipForm.vidaUtil}
                      onChange={(e) => setEquipForm({ ...equipForm, vidaUtil: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Fecha de Compra</label>
                    <input
                      type="date"
                      className="nm-input"
                      value={equipForm.fechaCompra}
                      onChange={(e) => setEquipForm({ ...equipForm, fechaCompra: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Estado</label>
                    <select
                      className="nm-select"
                      value={equipForm.estado}
                      onChange={(e) => setEquipForm({ ...equipForm, estado: e.target.value })}
                    >
                      <option value="Activo">🟢 Activo</option>
                      <option value="En Mantenimiento">🟡 En Mantenimiento</option>
                      <option value="Inactivo">⚪ Inactivo</option>
                      <option value="Dado de baja">🔴 Dado de baja</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Ubicación</label>
                    <input
                      type="text"
                      className="nm-input"
                      placeholder="Ej: Gestión documental"
                      value={equipForm.ubicacion}
                      onChange={(e) => setEquipForm({ ...equipForm, ubicacion: e.target.value })}
                    />
                  </div>
                </div>

                {/* Asignación de Usuario */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Responsable (Usuario)</label>
                    <input
                      type="text"
                      className="nm-input"
                      placeholder="Nombre del responsable"
                      value={equipForm.usuarioSucursal}
                      onChange={(e) => setEquipForm({ ...equipForm, usuarioSucursal: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Área / Sucursal</label>
                    <input
                      type="text"
                      className="nm-input"
                      placeholder="Ej: Administrativo Bogotá"
                      value={equipForm.areaSucursal}
                      onChange={(e) => setEquipForm({ ...equipForm, areaSucursal: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Cargo</label>
                    <input
                      type="text"
                      className="nm-input"
                      placeholder="Cargo del usuario"
                      value={equipForm.cargo}
                      onChange={(e) => setEquipForm({ ...equipForm, cargo: e.target.value })}
                    />
                  </div>
                </div>

                {/* SECCIÓN ESPECÍFICA: SI ES COMPUTADOR */}
                {equipCategory === 'PC' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Procesador</label>
                        <input
                          type="text"
                          className="nm-input"
                          placeholder="Ej: Intel Core i5 / AMD Ryzen 5"
                          value={equipForm.procesador}
                          onChange={(e) => setEquipForm({ ...equipForm, procesador: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Memoria RAM</label>
                        <input
                          type="text"
                          className="nm-input"
                          placeholder="Ej: 8 GB / 16 GB"
                          value={equipForm.memoriaRam}
                          onChange={(e) => setEquipForm({ ...equipForm, memoriaRam: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Disco Duro / Almacenamiento</label>
                        <input
                          type="text"
                          className="nm-input"
                          placeholder="Ej: 512 GB SSD / 1 TB HDD"
                          value={equipForm.discoDuro}
                          onChange={(e) => setEquipForm({ ...equipForm, discoDuro: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Serial</label>
                        <input
                          type="text"
                          className="nm-input"
                          placeholder="Serial del equipo"
                          value={equipForm.serial}
                          onChange={(e) => setEquipForm({ ...equipForm, serial: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* SECCIÓN ESPECÍFICA: SI ES TELÉFONO CELULAR */}
                {equipCategory === 'PHONE' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Procesador</label>
                        <input
                          type="text"
                          className="nm-input"
                          placeholder="Ej: Mediatek Helio G35 / Snapdragon"
                          value={equipForm.procesador}
                          onChange={(e) => setEquipForm({ ...equipForm, procesador: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Memoria RAM</label>
                        <input
                          type="text"
                          className="nm-input"
                          placeholder="Ej: 4 GB"
                          value={equipForm.memoriaRam}
                          onChange={(e) => setEquipForm({ ...equipForm, memoriaRam: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Almacenamiento Interno</label>
                        <input
                          type="text"
                          className="nm-input"
                          placeholder="Ej: 64 GB / 128 GB"
                          value={equipForm.discoDuro}
                          onChange={(e) => setEquipForm({ ...equipForm, discoDuro: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Serial</label>
                        <input
                          type="text"
                          className="nm-input"
                          placeholder="Ej: RF8T204GLCZ"
                          value={equipForm.serial}
                          onChange={(e) => setEquipForm({ ...equipForm, serial: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="nm-card-sunken" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Smartphone size={16} /> Identificadores y Línea Móvil
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>IMEI 1</label>
                          <input type="text" placeholder="Ej: 350579459368766" className="nm-input" value={equipForm.imei1} onChange={(e) => setEquipForm({ ...equipForm, imei1: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>IMEI 2</label>
                          <input type="text" placeholder="Ej: 350738169368769" className="nm-input" value={equipForm.imei2} onChange={(e) => setEquipForm({ ...equipForm, imei2: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Número de Línea</label>
                          <input type="text" placeholder="Ej: 3124659304" className="nm-input" value={equipForm.numeroLinea} onChange={(e) => setEquipForm({ ...equipForm, numeroLinea: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>IMEI SimCard</label>
                          <input type="text" placeholder="IMEI de SimCard" className="nm-input" value={equipForm.imeiSimcard} onChange={(e) => setEquipForm({ ...equipForm, imeiSimcard: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Correo Asignado</label>
                          <input type="text" placeholder="Ej: gestiondoc.autoboysa@gmail.com" className="nm-input" value={equipForm.correo} onChange={(e) => setEquipForm({ ...equipForm, correo: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>App Lock / Seguridad</label>
                          <input type="text" placeholder="N/A o código" className="nm-input" value={equipForm.appLock} onChange={(e) => setEquipForm({ ...equipForm, appLock: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* SECCIÓN DINÁMICA DE ACCESORIOS Y PERIFÉRICOS (PC Y TELÉFONO) */}
                <div className="nm-card-sunken" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Layers size={16} /> Accesorios y Periféricos ({equipForm.accesorios?.length || 0})
                    </span>
                    <button
                      type="button"
                      className="nm-btn nm-btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => {
                        const nextId = Date.now();
                        setEquipForm({
                          ...equipForm,
                          accesorios: [
                            ...(equipForm.accesorios || []),
                            { id: nextId, tipo: '', codigoActivo: '', marca: '', modelo: '', serial: '' }
                          ]
                        });
                      }}
                    >
                      <Plus size={14} /> Agregar Accesorio
                    </button>
                  </div>

                  <datalist id="tipos-accesorios">
                    <option value="Cargador" />
                    <option value="Teclado" />
                    <option value="Mouse" />
                    <option value="Monitor" />
                    <option value="Diadema / Audífonos" />
                    <option value="Funda / Estuche" />
                    <option value="Impresora" />
                    <option value="Lápiz Óptico" />
                    <option value="Adaptador de Corriente" />
                    <option value="Base Refrigerante" />
                    <option value="Otro" />
                  </datalist>

                  {(!equipForm.accesorios || equipForm.accesorios.length === 0) ? (
                    <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      No hay accesorios agregados. Haz clic en "+ Agregar Accesorio" para registrar teclados, mouse, cargadores, etc.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {equipForm.accesorios.map((acc, index) => (
                        <div
                          key={acc.id || index}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(100px, 1.1fr) minmax(90px, 0.9fr) minmax(90px, 0.9fr) minmax(90px, 0.9fr) minmax(90px, 0.9fr) auto',
                            gap: '0.45rem',
                            alignItems: 'center',
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border-subtle)'
                          }}
                        >
                          <div>
                            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Tipo Accesorio *</label>
                            <input
                              type="text"
                              list="tipos-accesorios"
                              placeholder="Ej: Teclado, Cargador"
                              className="nm-input"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                              value={acc.tipo}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEquipForm({
                                  ...equipForm,
                                  accesorios: equipForm.accesorios.map(a => a.id === acc.id ? { ...a, tipo: val } : a)
                                });
                              }}
                              required
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Cód. Activo</label>
                            <input
                              type="text"
                              placeholder="Ej: ACT-001, N/A"
                              className="nm-input"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                              value={acc.codigoActivo || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEquipForm({
                                  ...equipForm,
                                  accesorios: equipForm.accesorios.map(a => a.id === acc.id ? { ...a, codigoActivo: val } : a)
                                });
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Marca</label>
                            <input
                              type="text"
                              placeholder="Ej: Logitech, Samsung"
                              className="nm-input"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                              value={acc.marca}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEquipForm({
                                  ...equipForm,
                                  accesorios: equipForm.accesorios.map(a => a.id === acc.id ? { ...a, marca: val } : a)
                                });
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Modelo</label>
                            <input
                              type="text"
                              placeholder="Ej: K120, 25W Type-C"
                              className="nm-input"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                              value={acc.modelo}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEquipForm({
                                  ...equipForm,
                                  accesorios: equipForm.accesorios.map(a => a.id === acc.id ? { ...a, modelo: val } : a)
                                });
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Serial</label>
                            <input
                              type="text"
                              placeholder="Serial o N/A"
                              className="nm-input"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                              value={acc.serial}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEquipForm({
                                  ...equipForm,
                                  accesorios: equipForm.accesorios.map(a => a.id === acc.id ? { ...a, serial: val } : a)
                                });
                              }}
                            />
                          </div>

                          <div style={{ alignSelf: 'flex-end', paddingBottom: '2px' }}>
                            <button
                              type="button"
                              className="nm-btn nm-btn-danger"
                              style={{ padding: '0.45rem', borderRadius: 'var(--radius-sm)' }}
                              title="Eliminar Accesorio"
                              onClick={() => {
                                setEquipForm({
                                  ...equipForm,
                                  accesorios: equipForm.accesorios.filter(a => a.id !== acc.id)
                                });
                              }}
                            >
                              <Trash2 size={14} style={{ color: 'var(--error)' }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Observaciones Generales</label>
                  <textarea
                    className="nm-input"
                    rows={2}
                    placeholder="Observaciones adicionales sobre el equipo..."
                    style={{ resize: 'none', fontFamily: 'var(--font-body)' }}
                    value={equipForm.observaciones}
                    onChange={(e) => setEquipForm({ ...equipForm, observaciones: e.target.value })}
                  />
                </div>

                <button type="submit" className="nm-btn nm-btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader className="gear-spin" size={16} /> Guardando...</> : (editId ? 'Actualizar Equipo' : 'Guardar Equipo')}
                </button>
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
                    {equipments.map(eq => <option key={eq.id} value={eq.id}>{eq.tipoEquipo} ({eq.noInventario}) - {eq.marca} {eq.modelo}</option>)}
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

                <button type="submit" className="nm-btn nm-btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader className="gear-spin" size={16} /> Guardando...</> : (editId ? 'Actualizar Mantenimiento' : 'Guardar Mantenimiento')}
                </button>
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

                <button type="submit" className="nm-btn nm-btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader className="gear-spin" size={16} /> Guardando...</> : (editId ? 'Actualizar Usuario' : 'Guardar Usuario')}
                </button>
              </form>
            )}

            {/* HOJA DE VIDA OFICIAL (AUT-FOR-231) */}
            {modalType === 'HOJA_DE_VIDA' && selectedEquipmentForHoja && (() => {
              const eq = selectedEquipmentForHoja;
              const phone = isPhone(eq);
              const eqMaints = maintenances.filter(m => m.idEquipo === eq.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
              const eqAudit = auditLogs.filter(a => a.recordId === eq.id || a.tableName === 'inventario' && a.newValues?.id === eq.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              return (
                <div className="hoja-vida-wrapper">
                  <div className="hoja-vida-toolbar no-print">
                    <button className="nm-btn" onClick={() => setModalType('DOC_SELECT')}>
                      <ArrowLeft size={16} /> Volver a Documentos
                    </button>
                    <button className="nm-btn nm-btn-primary" onClick={() => window.print()}>
                      <Printer size={16} /> Imprimir / Exportar a PDF
                    </button>
                    <button className="nm-btn" onClick={() => setModalOpen(false)}>
                      <X size={16} /> Cerrar
                    </button>
                  </div>

                  <div className="hoja-vida-doc" id="hoja-de-vida-document">
                    {/* Header Institucional */}
                    <div className="hoja-header">
                      <div className="hoja-logo">
                        AUTOBOY
                      </div>
                      <div className="hoja-title-box">
                        <h3>SISTEMA INTEGRADO DE GESTION</h3>
                        <h4>HOJA DE VIDA - EQUIPOS TECNOLOGICOS</h4>
                        <div className="hoja-code">Codigo: AUT-FOR-231 | Version: 2</div>
                      </div>
                      <div className="hoja-badge-box">
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{eq.marca}</div>
                        <span className="hoja-status-badge">{eq.estado || 'Activo'}</span>
                      </div>
                    </div>

                    {/* 1. INFORMACION GENERAL */}
                    <div className="hoja-section-title">INFORMACION GENERAL</div>
                    <table className="hoja-table">
                      <tbody>
                        <tr>
                          <th>Area / Sucursal</th>
                          <td>{eq.areaSucursal || eq.agencia?.nombre || '-'}</td>
                          <th>Responsable</th>
                          <td>{eq.usuarioSucursal || 'Sin asignar'}</td>
                        </tr>
                        <tr>
                          <th>Ubicacion</th>
                          <td>{eq.ubicacion || eq.agencia?.nombre || '-'}</td>
                          <th>Reubicacion</th>
                          <td>{eq.reubicacion || 'N/A'}</td>
                        </tr>
                        <tr>
                          <th>Tipo de Equipo</th>
                          <td>{eq.tipoEquipo}</td>
                          <th>Fecha de Compra</th>
                          <td>{eq.fechaCompra || '-'}</td>
                        </tr>
                        <tr>
                          <th>Vida Util</th>
                          <td><strong>{eq.vidaUtil || '3 años'}</strong></td>
                          <th>Cod. Inventario</th>
                          <td><strong>{eq.noInventario}</strong></td>
                        </tr>
                      </tbody>
                    </table>

                    {/* 2. ESPECIFICACIONES TECNICAS */}
                    <div className="hoja-section-title">ESPECIFICACIONES TECNICAS</div>
                    <table className="hoja-table">
                      <tbody>
                        <tr>
                          <th>Marca</th>
                          <td>{eq.marca}</td>
                          <th>Modelo</th>
                          <td>{eq.modelo}</td>
                        </tr>
                        <tr>
                          <th>Procesador</th>
                          <td>{eq.procesador || '-'}</td>
                          <th>Memoria RAM</th>
                          <td>{eq.memoriaRam || '-'}</td>
                        </tr>
                        <tr>
                          <th>Almacenamiento</th>
                          <td>{eq.discoDuro || '-'}</td>
                          <th>Serial</th>
                          <td>{eq.serial || '-'}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* 3. IDENTIFICADORES Y LINEA (Solo teléfonos o si tiene datos móviles) */}
                    {phone && (
                      <>
                        <div className="hoja-section-title">IDENTIFICADORES Y LINEA</div>
                        <table className="hoja-table">
                          <tbody>
                            <tr>
                              <th>IMEI 1</th>
                              <td>{eq.imei1 || '-'}</td>
                              <th>IMEI 2</th>
                              <td>{eq.imei2 || '-'}</td>
                            </tr>
                            <tr>
                              <th>Numero Linea</th>
                              <td>{eq.numeroLinea || '-'}</td>
                              <th>IMEI SimCard</th>
                              <td>{eq.imeiSimcard || '-'}</td>
                            </tr>
                            <tr>
                              <th>Correo</th>
                              <td>{eq.correo || '-'}</td>
                              <th>Contrasena</th>
                              <td>{eq.claveCorreo ? '••••••••' : '-'}</td>
                            </tr>
                            <tr>
                              <th>App Lock</th>
                              <td>{eq.appLock || 'N/A'}</td>
                              <th>Estado</th>
                              <td>{eq.estado || 'Activo'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </>
                    )}

                    {/* 4. PERIFÉRICOS / ACCESORIOS */}
                    <div className="hoja-section-title">ACCESORIOS Y PERIFERICOS</div>
                    {(() => {
                      const accList = getEquipmentAccessories(eq);
                      if (accList.length === 0) {
                        return (
                          <div style={{ padding: '0.6rem', border: '1px solid #cbd5e1', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                            Sin accesorios o perifericos registrados.
                          </div>
                        );
                      }
                      return (
                        <table className="hoja-table hoja-table-grid">
                          <thead>
                            <tr>
                              <th style={{ width: '22%' }}>TIPO DE ACCESORIO</th>
                              <th style={{ width: '18%' }}>COD. ACTIVO</th>
                              <th style={{ width: '20%' }}>MARCA</th>
                              <th style={{ width: '20%' }}>MODELO</th>
                              <th style={{ width: '20%' }}>SERIAL / CODIGO</th>
                            </tr>
                          </thead>
                          <tbody>
                            {accList.map((acc, idx) => (
                              <tr key={idx}>
                                <td><strong>{acc.tipo || 'Accesorio'}</strong></td>
                                <td>{acc.codigoActivo || '-'}</td>
                                <td>{acc.marca || '-'}</td>
                                <td>{acc.modelo || '-'}</td>
                                <td>{acc.serial || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}

                    {/* 5. REGISTRO DE MANTENIMIENTOS */}
                    <div className="hoja-section-title">REGISTRO DE MANTENIMIENTOS</div>
                    {eqMaints.length === 0 ? (
                      <div style={{ padding: '0.6rem', border: '1px solid #cbd5e1', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                        Sin registros de mantenimiento.
                      </div>
                    ) : (
                      <table className="hoja-table hoja-table-grid">
                        <thead>
                          <tr>
                            <th>FECHA</th>
                            <th>TIPO</th>
                            <th>DESCRIPCION</th>
                            <th>REALIZADO POR</th>
                            <th>OBSERVACIONES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eqMaints.map(m => (
                            <tr key={m.id}>
                              <td>{new Date(m.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</td>
                              <td><strong>{m.tipo}</strong></td>
                              <td style={{ textAlign: 'left' }}>{m.descripcion}</td>
                              <td>{m.realizadoPor}</td>
                              <td style={{ textAlign: 'left' }}>{m.observaciones || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* 6. OBSERVACIONES */}
                    <div className="hoja-section-title">OBSERVACIONES</div>
                    <div style={{ padding: '0.6rem', border: '1px solid #cbd5e1', fontSize: '0.75rem', color: eq.observaciones ? '#1e293b' : '#64748b', fontStyle: eq.observaciones ? 'normal' : 'italic', marginBottom: '0.5rem' }}>
                      {eq.observaciones || 'Sin observaciones.'}
                    </div>

                    {/* 7. CONTROL DE CAMBIOS */}
                    <div className="hoja-section-title">HISTORIAL DE CAMBIOS (CONTROL DE CAMBIO)</div>
                    {eqAudit.length === 0 ? (
                      <div style={{ padding: '0.6rem', border: '1px solid #cbd5e1', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                        Sin modificaciones registradas en bitácora.
                      </div>
                    ) : (
                      <table className="hoja-table hoja-table-grid">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Acción</th>
                            <th>Estado Equipo</th>
                            <th>Motivo / Detalle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eqAudit.slice(0, 5).map(a => (
                            <tr key={a.id}>
                              <td>{new Date(a.createdAt).toLocaleString()}</td>
                              <td>{a.action}</td>
                              <td>{eq.estado || 'Buen estado'}</td>
                              <td style={{ textAlign: 'left' }}>Actualización de información de equipo</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Footer */}
                    <div className="hoja-footer">
                      <span>Documento generado automaticamente por el Sistema de Inventario - Autoboy</span>
                      <span>Confidencial - Uso interno</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ACTA DE ENTREGA OFICIAL (AUT-FOR-15) */}
            {modalType === 'ACTA_DE_ENTREGA' && selectedEquipmentForHoja && (() => {
              const eq = selectedEquipmentForHoja;

              const parseMoney = (val: string | undefined | null) => {
                if (!val) return 0;
                const clean = String(val).replace(/[^0-9]/g, '');
                return clean ? parseInt(clean, 10) : 0;
              };

              const formatMoney = (val: number) => {
                return new Intl.NumberFormat('es-CO').format(val);
              };

              const accessories = getEquipmentAccessories(eq);
              const totalActa = parseMoney(actaData.valorEstimado) + accessories.reduce((sum, _, idx) => {
                return sum + parseMoney(actaData.valoresAccesorios[idx]);
              }, 0);

              return (
                <div className="acta-entrega-wrapper">
                  {/* Toolbar de Personalización Rápida & Impresión */}
                  <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.85rem 1rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="nm-btn" onClick={() => setModalType('DOC_SELECT')}>
                          <ArrowLeft size={16} /> Volver a Documentos
                        </button>
                        <button className="nm-btn nm-btn-primary" onClick={() => window.print()} style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}>
                          <Printer size={16} /> Imprimir / Exportar a PDF
                        </button>
                      </div>
                      <button className="nm-btn" onClick={() => setModalOpen(false)}>
                        <X size={16} /> Cerrar
                      </button>
                    </div>

                    {/* Ajustes rápidos del acta */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem', paddingTop: '0.4rem', borderTop: '1px solid var(--glass-border-subtle)' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>C.C. Quien Recibe:</label>
                        <input
                          type="text"
                          className="nm-input"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          placeholder="Ej: 111111"
                          value={actaData.cedulaUsuario}
                          onChange={(e) => setActaData({ ...actaData, cedulaUsuario: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>Quien Entrega (Encargado):</label>
                        <input
                          type="text"
                          className="nm-input"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          value={actaData.quienEntrega}
                          onChange={(e) => setActaData({ ...actaData, quienEntrega: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>Responsable Anterior:</label>
                        <input
                          type="text"
                          className="nm-input"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          placeholder="Ej: YEIMMY VIVIANA..."
                          value={actaData.responsableAnterior}
                          onChange={(e) => setActaData({ ...actaData, responsableAnterior: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>Fecha del Acta:</label>
                        <input
                          type="text"
                          className="nm-input"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          value={actaData.fechaActa}
                          onChange={(e) => setActaData({ ...actaData, fechaActa: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Valores de cada ítem y accesorio */}
                    <div style={{ marginTop: '0.2rem', paddingTop: '0.6rem', borderTop: '1px solid var(--glass-border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                          Valores Individuales de Elementos a Entregar:
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                          Total Calculado: $ {formatMoney(totalActa)}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Valor {eq.tipoEquipo} ($):
                          </label>
                          <input
                            type="text"
                            className="nm-input"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            placeholder="Ej: 4.000.000"
                            value={actaData.valorEstimado}
                            onChange={(e) => setActaData({ ...actaData, valorEstimado: e.target.value })}
                          />
                        </div>
                        {accessories.map((acc, idx) => (
                          <div key={idx}>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              Valor {acc.tipo || `Accesorio ${idx + 1}`} {acc.marca ? `(${acc.marca})` : ''} ($):
                            </label>
                            <input
                              type="text"
                              className="nm-input"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                              placeholder="Ej: 50.000"
                              value={actaData.valoresAccesorios[idx] || ''}
                              onChange={(e) => setActaData({
                                ...actaData,
                                valoresAccesorios: {
                                  ...actaData.valoresAccesorios,
                                  [idx]: e.target.value
                                }
                              })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Documento Imprimible Acta de Entrega */}
                  <div className="acta-entrega-doc" id="acta-entrega-document">
                    {/* Header Banner */}
                    <div className="acta-header-banner">
                      <div className="acta-logo-text">
                        AUTOBOY
                      </div>
                      <div className="acta-title-text">
                        <h3>ACTA DE ENTREGA Y RECIBO DE EQUIPOS / HERRAMIENTAS</h3>
                        <div>Codigo: AUT-FOR-15</div>
                        <div>Fecha: {actaData.fechaActa}</div>
                      </div>
                    </div>

                    {/* Texto de Declaración y Compromiso */}
                    <div className="acta-declaracion">
                      Yo: <strong>{eq.usuarioSucursal || 'El colaborador'}</strong> identificado con C.C. <strong>{actaData.cedulaUsuario || '_____________'}</strong> declaro haber recibido los equipos y/o herramientas lo cual me compromete a cuidarlos y utilizarlos correctamente de acuerdo a las actividades que se me sean asignadas, tambien a devolverlos cuando tenga que dejar el servicio por algun motivo o por el desgaste de uso y/o con firma me responsabilizo por la perdida o danos de los equipos o herramientas bajo mi cargo.
                    </div>

                    {/* DATOS DEL COLABORADOR Y EQUIPO */}
                    <div className="acta-section-title">DATOS DEL COLABORADOR Y EQUIPO</div>
                    <table className="acta-table">
                      <tbody>
                        <tr>
                          <th>Nombre quien recibe</th>
                          <td><strong>{eq.usuarioSucursal || 'Sin asignar'}</strong></td>
                          <th style={{ width: '15%' }}>C.C.</th>
                          <td>{actaData.cedulaUsuario || '111111'}</td>
                        </tr>
                        <tr>
                          <th>Nombre quien entrega (encargado)</th>
                          <td colSpan={3}><strong>{actaData.quienEntrega}</strong></td>
                        </tr>
                        <tr>
                          <th>Area / Sucursal</th>
                          <td>{eq.areaSucursal || eq.agencia?.nombre || '-'}</td>
                          <th style={{ width: '15%' }}>Responsable anterior</th>
                          <td>{actaData.responsableAnterior || eq.usuarioSucursal || '-'}</td>
                        </tr>
                        <tr>
                          <th>Marca</th>
                          <td>{eq.marca}</td>
                          <th style={{ width: '15%' }}>Modelo</th>
                          <td>{eq.modelo}</td>
                        </tr>
                        <tr>
                          <th>Serial</th>
                          <td>{eq.serial || eq.imei1 || '-'}</td>
                          <th style={{ width: '15%' }}>Codigo Inventario</th>
                          <td><strong>{eq.noInventario}</strong></td>
                        </tr>
                      </tbody>
                    </table>

                    {/* DETALLE DE ELEMENTOS ENTREGADOS */}
                    <div className="acta-section-title">DETALLE DE ELEMENTOS ENTREGADOS</div>
                    <table className="acta-table acta-table-grid">
                      <thead>
                        <tr>
                          <th style={{ width: '55%' }}>Descripcion</th>
                          <th style={{ width: '10%', textAlign: 'center' }}>Cantidad</th>
                          <th style={{ width: '17%', textAlign: 'right' }}>Valor unitario</th>
                          <th style={{ width: '18%', textAlign: 'right' }}>Valor total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>{eq.tipoEquipo}:</strong> {eq.marca} {eq.modelo} - Serial: {eq.serial || eq.imei1 || eq.noInventario}</td>
                          <td style={{ textAlign: 'center' }}>1</td>
                          <td style={{ textAlign: 'right' }}>$ {actaData.valorEstimado || '0'}</td>
                          <td style={{ textAlign: 'right' }}><strong>$ {actaData.valorEstimado || '0'}</strong></td>
                        </tr>
                        {accessories.map((acc, idx) => {
                          const valAcc = actaData.valoresAccesorios[idx] || '-';
                          return (
                            <tr key={idx}>
                              <td>
                                <strong>Accesorio ({acc.tipo}):</strong> {acc.codigoActivo ? <span>Cód. Activo: <strong>{acc.codigoActivo}</strong> | </span> : ''}Marca: {acc.marca || 'N/A'} | Modelo: {acc.modelo || 'N/A'} | Serial: {acc.serial || 'N/A'}
                              </td>
                              <td style={{ textAlign: 'center' }}>1</td>
                              <td style={{ textAlign: 'right' }}>{valAcc === '-' ? '$ -' : `$ ${valAcc}`}</td>
                              <td style={{ textAlign: 'right' }}>{valAcc === '-' ? '$ -' : <strong>$ {valAcc}</strong>}</td>
                            </tr>
                          );
                        })}
                        <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                          <td colSpan={3} style={{ textAlign: 'right', textTransform: 'uppercase', fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                            <strong>TOTAL GENERAL ESTIMADO:</strong>
                          </td>
                          <td style={{ textAlign: 'right', color: '#1d4ed8', fontSize: '0.85rem' }}>
                            <strong>$ {formatMoney(totalActa)}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* FIRMAS */}
                    <div className="acta-section-title">FIRMAS</div>
                    <div className="acta-firmas-container">
                      <div className="acta-firma-col">
                        <div className="acta-firma-title">Quien entrega</div>
                        <div style={{ marginTop: '2.5rem', lineHeight: '1.4' }}>
                          <div>Firma: ______________________________</div>
                          <div style={{ marginTop: '0.4rem' }}>Nombre: <strong>{actaData.quienEntrega}</strong></div>
                          <div style={{ marginTop: '0.2rem' }}>C.C.: _____________________________</div>
                        </div>
                      </div>

                      <div className="acta-firma-col">
                        <div className="acta-firma-title">Quien recibe</div>
                        <div style={{ marginTop: '2.5rem', lineHeight: '1.4' }}>
                          <div>Firma: ______________________________</div>
                          <div style={{ marginTop: '0.4rem' }}>Nombre: <strong>{eq.usuarioSucursal || 'Sin asignar'}</strong></div>
                          <div style={{ marginTop: '0.2rem' }}>C.C.: <strong>{actaData.cedulaUsuario || '111111'}</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="acta-footer">
                      Acta de entrega y recibo de equipos/herramientas - Sistema de Inventario Autoboy
                    </div>
                  </div>
                </div>
              );
            })()}

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
            {modalType === 'EQUIPMENT_DETAIL' && selectedEquipmentDetail && (() => {
              const eq = selectedEquipmentDetail;
              const phone = isPhone(eq);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {phone ? <Smartphone size={18} style={{ color: '#10b981' }} /> : <Laptop size={18} style={{ color: 'var(--primary-light)' }} />}
                      {eq.tipoEquipo} ({eq.noInventario})
                    </h4>
                    <button
                      className="nm-btn nm-btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => {
                        setSelectedEquipmentForHoja(eq);
                        const accs = getEquipmentAccessories(eq);
                        const initialValoresAcc: Record<number, string> = {};
                        accs.forEach((acc, idx) => {
                          initialValoresAcc[idx] = (acc as any).valor || '';
                        });
                        setActaData({
                          cedulaUsuario: eq.cedulaUsuario || '',
                          quienEntrega: eq.quienEntrega || user?.username || 'YEIMMY VIVIANA CAICEDO MUÑOZ',
                          cargoQuienEntrega: 'Administrador de Sistemas',
                          responsableAnterior: eq.responsableAnterior || eq.usuarioSucursal || '',
                          valorEstimado: eq.valorEstimado || '4.000.000',
                          valoresAccesorios: initialValoresAcc,
                          fechaActa: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
                        });
                        setModalType('DOC_SELECT');
                      }}
                    >
                      <FileText size={14} /> Documentos Oficiales (PDF)
                    </button>
                  </div>

                  <div className="nm-card-sunken" style={{ padding: '1rem', fontSize: '0.85rem' }}>
                    <p style={{ marginBottom: '0.3rem' }}><strong>N° Inventario:</strong> {eq.noInventario}</p>
                    <p style={{ marginBottom: '0.3rem' }}><strong>Sede / Agencia:</strong> {eq.agencia?.nombre || 'N/A'}</p>
                    <p style={{ marginBottom: '0.3rem' }}><strong>Marca / Modelo:</strong> {eq.marca} {eq.modelo}</p>
                    <p style={{ marginBottom: '0.3rem' }}><strong>Referencia:</strong> {eq.referencia || 'N/A'}</p>
                    <p style={{ marginBottom: '0.3rem' }}><strong>Vida Útil:</strong> {eq.vidaUtil || '3 años'} | <strong>Fecha Compra:</strong> {eq.fechaCompra || 'N/A'}</p>
                    <p><strong>Estado:</strong> {eq.estado || 'Activo'} | <strong>Ubicación:</strong> {eq.ubicacion || 'N/A'}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="nm-card-sunken" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                      <h5 style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--primary-light)' }}>Especificaciones</h5>
                      <p style={{ marginBottom: '0.25rem' }}><strong>Procesador:</strong> {eq.procesador || 'N/A'}</p>
                      <p style={{ marginBottom: '0.25rem' }}><strong>Memoria RAM:</strong> {eq.memoriaRam || 'N/A'}</p>
                      <p style={{ marginBottom: '0.25rem' }}><strong>Almacenamiento:</strong> {eq.discoDuro || 'N/A'}</p>
                      <p><strong>Serial:</strong> {eq.serial || 'N/A'}</p>
                    </div>

                    <div className="nm-card-sunken" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                      <h5 style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--primary-light)' }}>Asignación</h5>
                      <p style={{ marginBottom: '0.25rem' }}><strong>Usuario:</strong> {eq.usuarioSucursal || 'N/A'}</p>
                      <p style={{ marginBottom: '0.25rem' }}><strong>Área:</strong> {eq.areaSucursal || 'N/A'}</p>
                      <p><strong>Cargo:</strong> {eq.cargo || 'N/A'}</p>
                    </div>
                  </div>

                  {phone && (
                    <div className="nm-card-sunken" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                      <h5 style={{ fontWeight: 600, marginBottom: '0.4rem', color: '#10b981' }}>Datos de Telefonía</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.4rem' }}>
                        <p><strong>Línea:</strong> {eq.numeroLinea || 'N/A'}</p>
                        <p><strong>IMEI 1:</strong> {eq.imei1 || 'N/A'}</p>
                        <p><strong>IMEI 2:</strong> {eq.imei2 || 'N/A'}</p>
                        <p><strong>Correo:</strong> {eq.correo || 'N/A'}</p>
                        <p><strong>App Lock:</strong> {eq.appLock || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  {/* Accesorios Dinámicos */}
                  <div className="nm-card-sunken" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                    <h5 style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Layers size={15} /> Accesorios y Periféricos ({getEquipmentAccessories(eq).length})
                    </h5>
                    {getEquipmentAccessories(eq).length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>Sin accesorios registrados.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                        {getEquipmentAccessories(eq).map((acc, idx) => (
                          <div key={idx} style={{ padding: '0.4rem 0.6rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border-subtle)' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{acc.tipo}</span>
                              {acc.codigoActivo && <span style={{ fontSize: '0.72rem', color: 'var(--primary-light)', fontWeight: 600 }}>Cód: {acc.codigoActivo}</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Marca: <strong>{acc.marca || 'N/A'}</strong> | Mod: <strong>{acc.modelo || 'N/A'}</strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Serial: <strong>{acc.serial || 'N/A'}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Historial Completo de Mantenimientos Realizados */}
                  <div className="nm-card-sunken" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                    <h5 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <History size={16} />
                      Historial Completo de Mantenimientos ({maintenances.filter(m => m.idEquipo === eq.id).length})
                    </h5>
                    {maintenances.filter(m => m.idEquipo === eq.id).length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>No hay registros de mantenimientos previos para este equipo.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                        {maintenances
                          .filter(m => m.idEquipo === eq.id)
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
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { api } from '../services/api';
import { Search, Wrench, Laptop, Calendar, Sun, Moon, LogIn, Cpu, HardDrive, ShieldAlert, MonitorDot } from 'lucide-react';

interface QueryPortalProps {
  onGoToLogin: () => void;
  onGoTo404: () => void;
}

export const QueryPortal: React.FC<QueryPortalProps> = ({ onGoToLogin, onGoTo404 }) => {
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('autoboy_mantenimientos_theme', nextTheme);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Por favor, ingresa un número de serial o inventario.');
      setResult(null);
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await api.queryPublic(query);
      setResult(data);
    } catch (err: any) {
      if (err.message.includes('404')) {
        // Redirigir a 404 personalizada si no se encuentra
        onGoTo404();
      } else {
        setError(err.message || 'Ocurrió un error al consultar el equipo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      {/* Navbar Flotante */}
      <nav className="nm-nav">
        <a href="#" className="nm-nav-logo heading-font">
          <Wrench className="gear-spin" size={24} />
          Autoboy <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>Mantenimientos</span>
        </a>
        <div className="nm-nav-links">
          <button className="nm-btn" onClick={toggleTheme} aria-label="Cambiar Tema" style={{ padding: '0.6rem' }}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="nm-btn nm-btn-primary" onClick={onGoToLogin}>
            <LogIn size={16} />
            Ingresar
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '1.5rem' }}>
          <h1 className="heading-font" style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: 'var(--primary-light)' }}>
            Consulta de Equipos Tecnológicos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto' }}>
            Busca cualquier recurso tecnológico de Autoboy ingresando su número de serial o código de inventario.
          </p>
        </div>

        {/* Buscador Neumórfico */}
        <form onSubmit={handleSearch} className="nm-card" style={{ display: 'flex', gap: '1rem', padding: '1rem', marginBottom: '3.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="nm-input"
              style={{ paddingLeft: '2.75rem' }}
              placeholder="Ej: NXH1RAL0069170C11F3400 o AUT-CONTA-01"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="nm-btn nm-btn-primary" disabled={loading}>
            Buscar
          </button>
        </form>

        {error && (
          <div className="nm-card-sunken" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', marginBottom: '2rem' }}>
            <ShieldAlert size={24} style={{ color: 'var(--error)', flexShrink: 0 }} />
            <span style={{ color: 'var(--error)', fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        {/* Resultados de la Búsqueda */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Detalles del Equipo */}
            <div className="nm-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid rgba(0,0,0,0.02)', paddingBottom: '1rem' }}>
                <Laptop size={32} style={{ color: 'var(--primary-light)' }} />
                <div>
                  <h2 className="heading-font" style={{ fontSize: '1.4rem' }}>{result.equipo.tipoEquipo} {result.equipo.marca}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Inventario: <strong>{result.equipo.noInventario}</strong> | Sede: <strong>{result.equipo.agencia?.nombre || 'N/A'}</strong>
                  </p>
                </div>
              </div>

              {/* Grid de Especificaciones */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div className="nm-card-sunken" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    <Cpu size={16} />
                    <span>Hardware Principal</span>
                  </div>
                  <p style={{ fontSize: '0.85rem' }}><strong>Modelo:</strong> {result.equipo.modelo || 'N/A'}</p>
                  <p style={{ fontSize: '0.85rem' }}><strong>Referencia:</strong> {result.equipo.referencia || 'N/A'}</p>
                  <p style={{ fontSize: '0.85rem' }}><strong>Serial:</strong> {result.equipo.serial || 'N/A'}</p>
                </div>

                <div className="nm-card-sunken" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    <HardDrive size={16} />
                    <span>Componentes</span>
                  </div>
                  <p style={{ fontSize: '0.85rem' }}><strong>Procesador:</strong> {result.equipo.procesador || 'N/A'}</p>
                  <p style={{ fontSize: '0.85rem' }}><strong>RAM:</strong> {result.equipo.memoriaRam || 'N/A'}</p>
                  <p style={{ fontSize: '0.85rem' }}><strong>Disco:</strong> {result.equipo.discoDuro || 'N/A'}</p>
                </div>

                <div className="nm-card-sunken" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    <MonitorDot size={16} />
                    <span>Periféricos & Área</span>
                  </div>
                  <p style={{ fontSize: '0.85rem' }}><strong>Usuario:</strong> {result.equipo.usuarioSucursal || 'N/A'}</p>
                  <p style={{ fontSize: '0.85rem' }}><strong>Área:</strong> {result.equipo.areaSucursal || 'N/A'}</p>
                  <p style={{ fontSize: '0.85rem' }}><strong>Cargo:</strong> {result.equipo.cargo || 'N/A'}</p>
                </div>
              </div>

              {/* Equipos adicionales / Accesorios */}
              <div className="nm-card-sunken" style={{ padding: '1.25rem', marginTop: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
                <h4 className="heading-font" style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--primary-light)' }}>Accesorios Asociados</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div><strong>Teclado:</strong> {result.equipo.teclado || 'N/A'}</div>
                  <div><strong>Mouse:</strong> {result.equipo.mouse || 'N/A'}</div>
                  <div><strong>Impresora:</strong> {result.equipo.impresora || 'N/A'}</div>
                  <div><strong>Otros:</strong> {result.equipo.otros || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Historial de Mantenimientos */}
            <div className="nm-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Calendar size={24} style={{ color: 'var(--primary-light)' }} />
                <h3 className="heading-font" style={{ fontSize: '1.25rem' }}>Historial de Intervenciones Técnicas</h3>
              </div>

              {result.mantenimientos && result.mantenimientos.length > 0 ? (
                <div className="nm-table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th>Técnico</th>
                        <th>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.mantenimientos.map((m: any) => (
                        <tr key={m.id}>
                          <td><strong>{new Date(m.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</strong></td>
                          <td>
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: m.tipo === 'PREVENTIVO' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: m.tipo === 'PREVENTIVO' ? 'var(--success)' : 'var(--error)'
                            }}>
                              {m.tipo}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'normal', minWidth: '220px' }}>{m.descripcion}</td>
                          <td>{m.realizadoPor}</td>
                          <td style={{ whiteSpace: 'normal', minWidth: '180px', color: 'var(--text-muted)' }}>{m.observaciones || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="nm-card-sunken" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <Wrench size={32} style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
                  <p>Este equipo no registra mantenimientos preventivos o correctivos todavía.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '2px solid rgba(0,0,0,0.01)', marginTop: '4rem' }}>
        &copy; {new Date().getFullYear()} Autoboy S.A. Todos los derechos reservados. Portal de Gestión y Mantenimiento Tecnológico.
      </footer>
    </div>
  );
};

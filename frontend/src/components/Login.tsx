import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Wrench, ShieldAlert, Loader } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor, ingresa tu usuario y clave.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      showToast('¡Sesión iniciada correctamente!', 'success');
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas o error de red.');
      showToast('Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="nm-card" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', boxShadow: 'var(--shadow-sunken)', marginBottom: '1.25rem' }}>
            <Wrench size={32} style={{ color: 'var(--primary-light)' }} />
          </div>
          <h2 className="heading-font" style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>Acceso Administrativo</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ingresa tus credenciales para gestionar el inventario</p>
        </div>

        {error && (
          <div className="nm-card-sunken" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
            <ShieldAlert size={20} style={{ color: 'var(--error)', flexShrink: 0 }} />
            <span style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nombre de Usuario</label>
            <input
              type="text"
              className="nm-input"
              placeholder="Ej: admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Contraseña de Acceso</label>
            <input
              type="password"
              className="nm-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="nm-btn nm-btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? <Loader className="gear-spin" size={18} /> : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

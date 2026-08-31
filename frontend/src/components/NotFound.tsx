import React from 'react';
import { Wrench, Home } from 'lucide-react';

interface NotFoundProps {
  onGoToQuery: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onGoToQuery }) => {
  return (
    <div className="nm-card floating-effect" style={{ maxWidth: '480px', margin: '4rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
      <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--surface)', boxShadow: 'var(--shadow-raised)', marginBottom: '2rem' }}>
        <Wrench className="gear-spin" size={40} style={{ color: 'var(--accent)' }} />
      </div>
      
      <h1 className="heading-font" style={{ fontSize: '4rem', color: 'var(--primary-light)', marginBottom: '0.5rem' }}>404</h1>
      <h3 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Mantenimiento no Programado</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
        La ruta o recurso tecnológico que intentas auditar no se encuentra en el inventario de Autoboy. Revisa que el enlace sea correcto o regresa al portal.
      </p>

      <button className="nm-btn nm-btn-primary" onClick={onGoToQuery} style={{ width: '100%' }}>
        <Home size={18} />
        Volver al Portal Público
      </button>
    </div>
  );
};

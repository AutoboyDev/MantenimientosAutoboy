import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

interface User {
  idUsuario: string;
  username: string;
  rol: 'super_admin' | 'editor';
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const INACTIVITY_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 horas en milisegundos
const ACTIVITY_STORAGE_KEY = 'autoboy_last_activity';
const TOKEN_STORAGE_KEY = 'autoboy_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<User | null>(null);
  const lastRecordedActivityRef = useRef<number>(Date.now());

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(ACTIVITY_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Helper para verificar inactividad
  const checkInactivity = useCallback(() => {
    const savedActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (savedActivity) {
      const lastActivityTime = parseInt(savedActivity, 10);
      if (!isNaN(lastActivityTime) && Date.now() - lastActivityTime > INACTIVITY_TIMEOUT_MS) {
        console.warn('Sesión cerrada por inactividad (12 horas sin interacción).');
        logout();
        return true;
      }
    }
    return false;
  }, [logout]);

  // Actualizar marca de tiempo de actividad con limitación (throttle cada 15 segundos)
  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastRecordedActivityRef.current > 15000) {
      lastRecordedActivityRef.current = now;
      localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now));
    }
  }, []);

  // Efecto para verificar token y expiración JWT
  useEffect(() => {
    if (token) {
      // 1. Verificar si ya pasaron 12 horas de inactividad
      if (checkInactivity()) {
        return;
      }

      try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));

        // 2. Verificar expiración nativa del JWT si existe
        if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
          console.warn('El token JWT ha expirado.');
          logout();
          return;
        }

        setUser({
          idUsuario: decodedPayload.idUsuario || decodedPayload.sub,
          username: decodedPayload.nombreUsuario || decodedPayload.username,
          rol: decodedPayload.rol
        });
      } catch (e) {
        console.error('Error al decodificar token JWT:', e);
        logout();
      }
    } else {
      setUser(null);
    }
  }, [token, checkInactivity, logout]);

  // Efecto para escuchar eventos de interacción del usuario y temporizador
  useEffect(() => {
    if (!token) return;

    // Registrar actividad inicial si no existe
    if (!localStorage.getItem(ACTIVITY_STORAGE_KEY)) {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, String(Date.now()));
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const handleUserInteraction = () => {
      recordActivity();
    };

    events.forEach((evt) => {
      window.addEventListener(evt, handleUserInteraction, { passive: true });
    });

    // Revisar inactividad periódicamente cada minuto y al enfocar la pestaña
    const intervalId = setInterval(() => {
      checkInactivity();
    }, 60000);

    const handleFocus = () => {
      checkInactivity();
    };
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('autoboy_unauthorized', handleUnauthorized);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserInteraction);
      });
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('autoboy_unauthorized', handleUnauthorized);
    };
  }, [token, recordActivity, checkInactivity, logout]);

  const login = async (username: string, password: string) => {
    const data = await api.login(username, password);
    const jwtToken = data.tokenApp;
    if (jwtToken) {
      const now = Date.now();
      localStorage.setItem(TOKEN_STORAGE_KEY, jwtToken);
      localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now));
      lastRecordedActivityRef.current = now;
      setToken(jwtToken);
    } else {
      throw new Error('Token no devuelto por el servidor');
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

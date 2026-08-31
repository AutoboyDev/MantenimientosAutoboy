const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getHeaders = (isPrivate: boolean = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (isPrivate) {
    const token = localStorage.getItem('autoboy_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

const handleResponse = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem('autoboy_token');
    localStorage.removeItem('autoboy_last_activity');
    window.dispatchEvent(new Event('autoboy_unauthorized'));
    throw new Error(data.message || data.response?.respuesta || 'Sesión expirada. Redirigiendo al inicio de sesión...');
  }
  if (!res.ok) {
    throw new Error(data.message || data.response?.respuesta || 'Error de red en el servidor');
  }
  return data.response || data;
};

export const api = {
  // --- AUTENTICACIÓN Y CONFIGURACIÓN ---
  async login(username: string, password: string) {
    const res = await fetch(`${API_URL}/auth/signIn`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  async setupAdmin(username: string, password: string) {
    const res = await fetch(`${API_URL}/auth/setupAdmin`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  async queryPublic(buscar: string) {
    const res = await fetch(`${API_URL}/auth/query/${encodeURIComponent(buscar)}`, {
      method: 'GET',
      headers: getHeaders(false)
    });
    return handleResponse(res);
  },

  // --- CLIENTE CRUD GENERAL PRIVADO ---
  async get(path: string) {
    const res = await fetch(`${API_URL}/private${path}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    return handleResponse(res);
  },

  async post(path: string, body: any) {
    const res = await fetch(`${API_URL}/private${path}`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },

  async put(path: string, body: any) {
    const res = await fetch(`${API_URL}/private${path}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },

  async delete(path: string) {
    const res = await fetch(`${API_URL}/private${path}`, {
      method: 'DELETE',
      headers: getHeaders(true)
    });
    return handleResponse(res);
  }
};

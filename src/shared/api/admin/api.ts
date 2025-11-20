const API_BASE_URL = '/api/admin';

export interface MoyskladSettings {
  id?: number;
  storeId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Store {
  id: string;
  name: string;
  meta?: {
    href: string;
    type: string;
  };
}

export interface User {
  id: number;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export const adminApi = {
  async getUsers(): Promise<User[]> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get users');
    }

    return response.json();
  },

  async getMoyskladSettings(): Promise<MoyskladSettings> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/moysklad-settings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Moysklad settings');
    }

    return response.json();
  },

  async saveMoyskladSettings(accessToken: string, storeId: string | null): Promise<MoyskladSettings> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/moysklad-settings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken, storeId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save Moysklad settings');
    }

    return response.json();
  },

  async getStores(): Promise<Store[]> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/moysklad-stores`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get stores');
    }

    return response.json();
  },

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/moysklad-test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Connection test failed');
    }

    return response.json();
  },

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  },
};


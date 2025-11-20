const API_BASE_URL = '/api/auth';

export interface User {
  id: number;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export const authApi = {
  async getMe(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(`${API_BASE_URL}/me`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = new Error(`Failed to get user: ${response.statusText}`) as any;
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data.user;
  },

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const error = new Error(`Failed to refresh token: ${response.statusText}`) as any;
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    this.setToken(data.accessToken);
    return data;
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });
    this.clearTokens();
  },

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },

  setToken(token: string): void {
    localStorage.setItem('accessToken', token);
  },

  setRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  },

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getTelegramAuthUrl(): string {
    return `${API_BASE_URL}/telegram`;
  },
};


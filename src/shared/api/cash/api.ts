const API_BASE_URL = '/api/cash';

export interface CashEntry {
  id: string;
  timestamp: number;
  initialAmount: number;
  bills: { [key: number]: number };
  coinsRubles: { [key: number]: number };
  coinsKopecks: { [key: number]: number };
  totalAmount: number;
}

export interface CalculateCashRequest {
  initialAmount: number;
  bills: { [key: number]: number };
  coinsRubles: { [key: number]: number };
  coinsKopecks: { [key: number]: number };
}

export interface CalculateCashResponse {
  totalAmount: number;
}

export const cashApi = {
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  async calculate(data: CalculateCashRequest): Promise<CalculateCashResponse> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/calculate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to calculate cash');
    }

    return response.json();
  },

  async saveEntry(data: CalculateCashRequest): Promise<CashEntry> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/entries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save entry');
    }

    return response.json();
  },

  async getHistory(limit = 50, offset = 0): Promise<CashEntry[]> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/history?limit=${limit}&offset=${offset}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get history');
    }

    return response.json();
  },

  async deleteEntry(id: string): Promise<void> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/entries/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete entry');
    }
  },
};


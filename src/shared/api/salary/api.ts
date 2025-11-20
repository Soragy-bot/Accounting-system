const API_BASE_URL = '/api/salary';

export interface SalaryCalculation {
  id: string;
  timestamp: number;
  dailyRate: number;
  workDays: string[];
  salesPercentage: number;
  salesByDay: { [date: string]: number };
  targetProductsCount: { [date: string]: number };
  totalSalary: number;
}

export interface SalaryBreakdown {
  rateSalary: number;
  salesBonus: number;
  targetBonus: number;
  totalSalary: number;
  workDaysCount: number;
}

export interface CalculateSalaryRequest {
  dailyRate: number;
  workDays: string[];
  salesPercentage: number;
  salesByDay: { [date: string]: number };
  targetProductsCount: { [date: string]: number };
}

export interface CalculateSalaryResponse {
  totalSalary: number;
  breakdown: SalaryBreakdown;
}

export interface MoyskladDataResponse {
  [date: string]: {
    sales: number;
    targetProducts: number;
  } | {
    error: string;
  };
}

export const salaryApi = {
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  async calculate(data: CalculateSalaryRequest): Promise<CalculateSalaryResponse> {
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
      throw new Error('Failed to calculate salary');
    }

    return response.json();
  },

  async getMoyskladData(dates: string[]): Promise<MoyskladDataResponse> {
    const token = this.getToken();
    const queryParams = dates.map(date => `dates=${encodeURIComponent(date)}`).join('&');
    const response = await fetch(`${API_BASE_URL}/moysklad-data?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Moysklad data');
    }

    return response.json();
  },

  async saveCalculation(data: CalculateSalaryRequest): Promise<SalaryCalculation> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/calculations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save calculation');
    }

    return response.json();
  },

  async getHistory(limit = 50, offset = 0): Promise<SalaryCalculation[]> {
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

  async deleteCalculation(id: string): Promise<void> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/calculations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete calculation');
    }
  },
};


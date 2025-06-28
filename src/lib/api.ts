const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:8000/api';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'USER';
  company?: {
    id: number;
    name: string;
    description: string;
  };
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'USER';
  company_name?: string;
  company_description?: string;
}

class ApiClient {
  private static instance: ApiClient;
  private token: string | null = localStorage.getItem('token');

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  public clearToken(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'An error occurred');
    }

    return data;
  }

  // Auth methods
  public async login(email: string, password: string): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>('/auth/token/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access);
    return data;
  }

  public async register(userData: RegisterData): Promise<User> {
    const data = await this.request<User>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return data;
  }

  public async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile/');
  }

  public async refreshToken(refresh: string): Promise<{ access: string }> {
    return this.request<{ access: string }>('/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    });
  }
}

export const api = ApiClient.getInstance();

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginRequest, Site, AlertsResponse, MessageResponse, TwoFactorResponse, TwoFactorVerifyRequest, LoginResponse } from '../types';

const API_BASE_URL = 'https://studio.railstream.net/api';
const TOKEN_KEY = 'railstream_auth_token';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        if (!this.token) {
          this.token = await AsyncStorage.getItem(TOKEN_KEY);
        }
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem(TOKEN_KEY);
  }

  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<TwoFactorResponse> {
    const response = await this.client.post<TwoFactorResponse>('/auth/login', credentials);
    // If no 2FA required, set token immediately
    if (response.data.access_token && !response.data.requires_2fa) {
      await this.setToken(response.data.access_token);
    }
    return response.data;
  }

  async verify2FA(data: TwoFactorVerifyRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/verify-2fa', data);
    if (response.data.accessToken || response.data.access_token) {
      const token = response.data.accessToken || response.data.access_token;
      if (token) {
        await this.setToken(token);
      }
    }
    return response.data;
  }

  async logout(): Promise<void> {
    await this.clearToken();
  }

  // Sites endpoints
  async getSites(): Promise<Site[]> {
    const response = await this.client.get<Site[]>('/sites');
    return response.data;
  }

  async getSite(id: string): Promise<Site> {
    const response = await this.client.get<Site>(`/sites/${id}`);
    return response.data;
  }

  async restartSitePC(siteId: string): Promise<MessageResponse> {
    const response = await this.client.post<MessageResponse>(`/sites/${siteId}/restart-pc`);
    return response.data;
  }

  // Alerts endpoints
  async getAlerts(siteId?: string): Promise<AlertsResponse> {
    const params = siteId ? { site_id: siteId } : {};
    const response = await this.client.get<AlertsResponse>('/alerts', { params });
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;

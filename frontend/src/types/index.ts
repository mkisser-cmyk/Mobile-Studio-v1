// User types
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TwoFactorResponse {
  requires_2fa: boolean;
  temp_token?: string;
  access_token?: string | null;
  user?: User | null;
}

export interface TwoFactorVerifyRequest {
  temp_token: string;
  totp_code: string;
}

export interface LoginResponse {
  accessToken?: string;
  access_token?: string;
  user: User;
}

// Site types
export interface SiteHealth {
  status?: string;
  streamStatus?: string;
  lastHeartbeat?: string;
  uptimeSeconds?: number;
  videoBitrate?: number;
  sourceBitrate?: number;
  cpuUsage?: number;
  gpuUsage?: number;
  previewImage?: string;
}

export interface CameraConfig {
  rtspUrl?: string;
}

export interface Site {
  id: string;
  name: string;
  location?: string;
  status?: string;
  health?: SiteHealth;
  camera?: CameraConfig;
}

// Alert types
export interface Alert {
  id: string;
  siteId: string;
  siteName: string;
  alertType: string;
  severity: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface AlertsResponse {
  alerts: Alert[];
  total: number;
}

export interface MessageResponse {
  message: string;
}

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

// Site types - using snake_case to match API
export interface AudioLevel {
  peak: number;
  rms: number;
}

export interface SiteHealth {
  status?: string;
  stream_status?: string;
  last_heartbeat?: string;
  uptime_seconds?: number;
  video_bitrate?: number;
  source_bitrate?: number;
  audio_bitrate?: number;
  cpu_usage?: number;
  gpu_usage?: number;
  gpu_temp?: number;
  dropped_frames?: number;
  preview_image?: string;
  audio_levels?: Record<string, AudioLevel>;
}

export interface CameraConfig {
  rtsp_url?: string;
}

export interface Site {
  id: string;
  name: string;
  location?: string;
  status?: string;
  agent_version?: string;
  health?: SiteHealth;
  camera?: CameraConfig;
}

// Alert types (if alerts endpoint exists)
export interface Alert {
  id: string;
  site_id: string;
  site_name: string;
  alert_type: string;
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

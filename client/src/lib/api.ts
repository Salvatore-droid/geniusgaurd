// src/lib/api.ts
const API_BASE_URL = 'http://localhost:8000/api';

// ==================== User Types ====================

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_joined: string;
  last_login: string | null;
  is_active: boolean;
  is_staff: boolean;
}

// ==================== Scan Types ====================

export interface Vulnerability {
  id: number;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss_score: number;
  cve_id: string;
  cwe_id: string;
  remediation: string;
  proof_of_concept: string;
  affected_component: string;
  affected_version: string;
  status: 'open' | 'in_progress' | 'fixed' | 'false_positive' | 'accepted';
  discovered_at: string;
  updated_at: string;
  due_date: string | null;
  scan: number;
  metadata?: {
    ai_confidence?: number;
    ai_analyzed?: boolean;
    [key: string]: any;
  };
  evidence?: string;
}

export interface ScanResult {
  id: number;
  target: string;
  type: 'quick' | 'deep';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  start_time: string;
  end_time: string | null;
  created_by: number;
  created_by_email: string;
  vulnerabilities: Vulnerability[];
  task_id?: string;
  error_message?: string;
  metadata?: {
    ai_enhanced?: boolean;
    ai_model?: string;
    ai_confidence?: number;
    tools_used?: string[];
    total_tools_run?: number;
    severity_breakdown?: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
    [key: string]: any;
  };
}

export interface ScanStartResponse {
  scan: ScanResult;
  task_id: string;
  message: string;
  ai_enabled?: boolean;
}

// ==================== Dashboard Types ====================

export interface DashboardStats {
  total_scans: number;
  active_scans: number;
  completed_scans: number;
  failed_scans: number;
  total_vulnerabilities: number;
  critical_vulnerabilities: number;
  high_vulnerabilities: number;
  medium_vulnerabilities: number;
  low_vulnerabilities: number;
  info_vulnerabilities: number;
  secure_targets: number;
  scanned_targets: number;
  ai_enhanced_scans?: number;
  ai_confidence_avg?: number;
}

export interface VulnerabilityTrend {
  month: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  ai_discovered?: number;
  total?: number;
}

// ==================== Settings Types ====================

export interface ApiKey {
  id: number;
  name: string;
  key: string;
  created_at: string;
  last_used: string | null;
  expires_at: string | null;
  permissions: string[];
}

export interface NotificationSetting {
  id: number;
  type: 'email' | 'push' | 'slack' | 'webhook';
  enabled: boolean;
  events: {
    scan_complete: boolean;
    scan_failed: boolean;
    critical_finding: boolean;
    high_finding: boolean;
    report_generated: boolean;
    schedule_run: boolean;
  };
  config?: Record<string, any>;
}

export interface ScanDefault {
  id: number;
  scan_type: 'quick' | 'deep';
  timeout: number;
  max_retries: number;
  concurrent_scans: number;
  auto_report: boolean;
  report_format: 'pdf' | 'html' | 'json';
  notification_on_complete: boolean;
  notification_on_failure: boolean;
  excluded_paths: string[];
  custom_headers: Record<string, string>;
  cookies: Record<string, string>;
}

export interface TeamMember {
  id: number;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joined_at: string;
  last_active: string | null;
  permissions: string[];
}

export interface SecuritySetting {
  two_factor_enabled: boolean;
  session_timeout: number;
  ip_whitelist: string[];
  allowed_origins: string[];
  password_expiry_days: number;
  login_notifications: boolean;
}

export interface BillingInfo {
  plan: 'free' | 'pro' | 'enterprise';
  scans_used: number;
  scans_limit: number;
  next_billing: string | null;
  payment_method: string | null;
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    url: string;
  }>;
}

export interface Webhook {
  id: number;
  url: string;
  events: string[];
  secret: string;
  created_at: string;
  last_triggered: string | null;
  last_response: number | null;
  enabled: boolean;
}

// ==================== Threat Intelligence Types ====================

export interface ThreatStat {
  total_threats: number;
  severity_breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  assets_scanned: number;
  unique_issues: number;
  timeline: Array<{
    date: string;
    count: number;
    target?: string;
  }>;
  active_threats: Array<{
    name: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    count: number;
    cve_id?: string;
  }>;
  category_counts: Record<string, number>;
  recent_threats: Array<{
    id: number;
    name: string;
    severity: string;
    discovered_at: string;
    target: string;
  }>;
}

// ==================== Notification Types ====================

export interface Notification {
  id: number;
  type: 'scan_complete' | 'scan_failed' | 'critical_finding' | 'high_finding' | 'schedule_run' | 'report_generated' | 'info';
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  scan_id?: number;
  report_id?: number;
}

export interface UnreadNotificationsResponse {
  count: number;
  notifications: Notification[];
}

// ==================== Schedule Types ====================

export interface Schedule {
  id: number;
  target: string;
  scan_type: 'quick' | 'deep';
  cron_expression: string;
  is_active: boolean;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
  name: string;
  notification_email?: string;
}

// Add to the types section

export interface ReportStats {
  total_scans: number;
  quick_scans: number;
  deep_scans: number;
  total_vulnerabilities: number;
  avg_duration_seconds: number;
  security_score: number;
  trend_data: Array<{
    date: string;
    resolved: number;
    pending: number;
  }>;
  severity_breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

// ==================== API Service Class ====================

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  getToken() {
    return this.token;
  }

  getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Token ${this.token}`;
    }

    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken();
        window.location.href = '/signin';
      }
      
      let errorMessage = 'Request failed';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || error.detail || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // ==================== Auth Endpoints ====================

  async getCsrfToken() {
    return this.request<{ csrfToken: string }>('/auth/csrf/');
  }

  async signup(userData: any) {
    const data = await this.request<{ user: User; token: string }>('/auth/signup/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async login(credentials: { email: string; password: string }) {
    const data = await this.request<{ user: User; token: string }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout/', {
        method: 'POST',
      });
    } finally {
      this.removeToken();
    }
  }

  async getUser() {
    return this.request<User>('/auth/user/');
  }

  async updateProfile(data: Partial<User>) {
    return this.request<User>('/settings/profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { current_password: string; new_password: string }) {
    return this.request('/settings/change-password/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount() {
    return this.request('/auth/delete-account/', {
      method: 'DELETE',
    });
  }

  // ==================== Dashboard Endpoints ====================

  async getDashboardStats() {
    return this.request<DashboardStats>('/dashboard/stats/');
  }

  async getRecentScans() {
    return this.request<ScanResult[]>('/dashboard/recent-scans/');
  }

  async getVulnerabilityTrends() {
    return this.request<VulnerabilityTrend[]>('/dashboard/vulnerability-trends/');
  }

  // ==================== Scan Endpoints ====================

  async startQuickScan(target: string) {
    return this.request<ScanStartResponse>('/scans/quick/', {
      method: 'POST',
      body: JSON.stringify({ target }),
    });
  }

  async startDeepScan(target: string) {
    return this.request<ScanStartResponse>('/scans/deep/', {
      method: 'POST',
      body: JSON.stringify({ target }),
    });
  }

  async getScans() {
    return this.request<ScanResult[]>('/scans/');
  }

  async getScan(id: number) {
    return this.request<ScanResult>(`/scans/${id}/`);
  }

  async getScanStatus(id: number) {
    return this.request<ScanResult>(`/scans/${id}/status/`);
  }

  async getScanVulnerabilities(id: number) {
    return this.request<Vulnerability[]>(`/scans/${id}/vulnerabilities/`);
  }

  async deleteScan(id: number) {
    return this.request(`/scans/${id}/`, { method: 'DELETE' });
  }

  // ==================== Vulnerability Endpoints ====================

  async getVulnerabilities(params?: { severity?: string; scan_id?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.scan_id) queryParams.append('scan_id', params.scan_id.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/vulnerabilities/?${queryString}` : '/vulnerabilities/';
    return this.request<Vulnerability[]>(endpoint);
  }

  async getVulnerability(id: number) {
    return this.request<Vulnerability>(`/vulnerabilities/${id}/`);
  }

  async updateVulnerabilityStatus(id: number, status: string) {
    return this.request<Vulnerability>(`/vulnerabilities/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ==================== Scheduled Scans Endpoints ====================

  async getScheduledScans() {
    return this.request<Schedule[]>('/scheduled-scans/');
  }

  async createScheduledScan(data: {
    target: string;
    scan_type: 'quick' | 'deep';
    cron_expression: string;
    name: string;
    is_active?: boolean;
  }) {
    return this.request<Schedule>('/scheduled-scans/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateScheduledScan(id: number, data: Partial<Schedule>) {
    return this.request<Schedule>(`/scheduled-scans/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteScheduledScan(id: number) {
    return this.request(`/scheduled-scans/${id}/`, { method: 'DELETE' });
  }

  // ==================== Notification Endpoints ====================

  async getNotifications(params?: { is_read?: boolean; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.is_read !== undefined) queryParams.append('is_read', String(params.is_read));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/notifications/?${queryString}` : '/notifications/';
    return this.request<Notification[]>(endpoint);
  }

  async getUnreadNotifications() {
    return this.request<UnreadNotificationsResponse>('/notifications/unread/');
  }

  async markNotificationRead(id: number) {
    return this.request(`/notifications/${id}/read/`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all/', { method: 'POST' });
  }

  async deleteNotification(id: number) {
    return this.request(`/notifications/${id}/delete/`, { method: 'DELETE' });
  }

  async deleteAllNotifications() {
    return this.request('/notifications/delete-all/', { method: 'DELETE' });
  }

  // ==================== Threat Intelligence Endpoints ====================

  async getThreatIntelligenceStats() {
    return this.request<ThreatStat>('/threat-intelligence/stats/');
  }

  async getThreatIntelligenceList(params?: { type?: string; severity?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.severity) queryParams.append('severity', params.severity);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/threat-intelligence/?${queryString}` : '/threat-intelligence/';
    return this.request<any[]>(endpoint);
  }

  // ==================== Settings Endpoints ====================

  // Profile
  async getProfile() {
    return this.request<User>('/settings/profile/');
  }

  // API Keys
  async getApiKeys() {
    return this.request<ApiKey[]>('/settings/api-keys/');
  }

  async createApiKey(data: { name: string; permissions: string[] }) {
    return this.request<ApiKey>('/settings/api-keys/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteApiKey(id: number) {
    return this.request(`/settings/api-keys/${id}/`, { method: 'DELETE' });
  }

  // Notification Settings
  async getNotificationSettings() {
    return this.request<NotificationSetting>('/settings/notifications/');
  }

  async updateNotificationSettings(data: Partial<NotificationSetting>) {
    return this.request<NotificationSetting>('/settings/notifications/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Scan Defaults
  async getScanDefaults() {
    return this.request<ScanDefault>('/settings/scan-defaults/');
  }

  async updateScanDefaults(data: Partial<ScanDefault>) {
    return this.request<ScanDefault>('/settings/scan-defaults/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Team Management
  async getTeamMembers() {
    return this.request<TeamMember[]>('/settings/team/');
  }

  async inviteTeamMember(data: { email: string; role: string }) {
    return this.request('/settings/team/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeTeamMember(id: number) {
    return this.request(`/settings/team/${id}/`, { method: 'DELETE' });
  }

  // Security Settings
  async getSecuritySettings() {
    return this.request<SecuritySetting>('/settings/security/');
  }

  async updateSecuritySettings(data: Partial<SecuritySetting>) {
    return this.request<SecuritySetting>('/settings/security/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleTwoFactor() {
    return this.request<SecuritySetting>('/settings/security/two-factor/toggle/', {
      method: 'POST',
    });
  }

  // Billing
  async getBillingInfo() {
    return this.request<BillingInfo>('/settings/billing/');
  }

  // Webhooks
  async getWebhooks() {
    return this.request<Webhook[]>('/settings/webhooks/');
  }

  async createWebhook(data: { url: string; events: string[] }) {
    return this.request<Webhook>('/settings/webhooks/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(id: number) {
    return this.request(`/settings/webhooks/${id}/`, { method: 'DELETE' });
  }

  async testWebhook(id: number) {
    return this.request(`/settings/webhooks/${id}/test/`, { method: 'POST' });
  }

  // Data Export
  async exportData() {
    return this.request('/settings/export-data/', {
      method: 'GET',
      headers: {
        ...this.getHeaders(),
        'Accept': 'application/json',
      },
    });
  }

  // ==================== AI Endpoints ====================

  async analyzeVulnerability(vulnerabilityId: number) {
    return this.request('/ai/analyze-vulnerability/', {
      method: 'POST',
      body: JSON.stringify({ vulnerability_id: vulnerabilityId }),
    });
  }

  async generateAIReport(scanId: number) {
    return this.request(`/ai/generate-report/${scanId}/`);
  }

  async chatWithAI(data: { question: string; scan_id?: number }) {
    return this.request('/ai/chat/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== Utility Methods ====================

  isAuthenticated() {
    return !!this.token;
  }

  async get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Add to api.ts

  // ==================== Reports Endpoints ====================

  async getReportStats() {
    return this.request<ReportStats>('/reports/stats/');
  }

  async generateReport(scanId: number, format: 'pdf' | 'html' | 'json') {
    return this.request<{ download_url: string }>('/reports/generate/', {
      method: 'POST',
      body: JSON.stringify({
        scan_id: scanId,
        report_type: format
      }),
    });
  }

  async downloadReport(reportId: number) {
    return this.request<Blob>(`/reports/${reportId}/download/`, {
      headers: {
        ...this.getHeaders(),
        'Accept': 'application/octet-stream',
      },
      responseType: 'blob',
    });
  }

  async generatePDFReport(reportData: any): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/reports/generate-pdf/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    if (!response.ok) {
      throw new Error('PDF generation failed');
    }

    return response.blob();
  }
}

export const api = new ApiService();
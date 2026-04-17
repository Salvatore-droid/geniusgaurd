import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Key, 
  Bell, 
  Shield, 
  Users, 
  Save, 
  Copy, 
  Eye, 
  EyeOff,
  Check,
  X,
  RefreshCw,
  Globe,
  Mail,
  Sliders,
  AlertTriangle,
  Download,
  Trash2,
  LogOut,
  Moon,
  Sun,
  Palette,
  Zap,
  Lock,
  Award,
  Github,
  Twitter,
  Link,
  BookOpen,
  ExternalLink,
  Plus,
  AlertCircle,
  Info,
  Clock,
  Calendar,
  Search,
  Slack
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

// ==================== Types ====================

interface UserProfile {
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

interface ApiKey {
  id: number;
  name: string;
  key: string;
  prefix: string;
  created_at: string;
  last_used: string | null;
  expires_at: string | null;
  permissions: string | string[];
  key_preview?: string;
}

interface NotificationSetting {
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

interface ScanDefault {
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

interface TeamMember {
  id: number;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joined_at: string;
  last_active: string | null;
  permissions: string[];
}

interface SecuritySetting {
  two_factor_enabled: boolean;
  session_timeout: number;
  ip_whitelist: string[];
  allowed_origins: string[];
  password_expiry_days: number;
  login_notifications: boolean;
}

interface BillingInfo {
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

interface Webhook {
  id: number;
  url: string;
  events: string[];
  secret: string;
  created_at: string;
  last_triggered: string | null;
  last_response: number | null;
  enabled: boolean;
}

// ==================== Components ====================

function SkeletonField() {
  return <div className="h-10 w-full bg-muted/30 rounded-lg animate-pulse" />;
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('success', 'Copied!', `${label} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleCopy}>
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </Button>
  );
}

// ==================== Main Component ====================

export default function Settings() {
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('profile');
  
  // Loading states
  const [loading, setLoading] = useState({
    profile: true,
    apiKeys: true,
    notifications: true,
    scanDefaults: true,
    team: true,
    security: true,
    billing: true,
    webhooks: true
  });
  
  // Data states
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [notifications, setNotifications] = useState<NotificationSetting[]>([]);
  const [scanDefaults, setScanDefaults] = useState<ScanDefault | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [security, setSecurity] = useState<SecuritySetting | null>(null);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [newApiKey, setNewApiKey] = useState({
    name: '',
    permissions: 'read' as 'read' | 'read_write' | 'admin'
  });
  
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: ['scan_complete', 'critical_finding']
  });
  
  const [scanDefaultsForm, setScanDefaultsForm] = useState<ScanDefault | null>(null);
  
  const [showApiKey, setShowApiKey] = useState<Record<number, boolean>>({});
  const [generatingApiKey, setGeneratingApiKey] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [deletingKeyId, setDeletingKeyId] = useState<number | null>(null);
  
  // ==================== Data Fetching ====================
  
  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    try {
      await Promise.all([
        fetchProfile(),
        fetchApiKeys(),
        fetchNotifications(),
        fetchScanDefaults(),
        fetchTeam(),
        fetchSecurity(),
        fetchBilling(),
        fetchWebhooks()
      ]);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      addToast('error', 'Failed to load settings', 'Please refresh the page');
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await api.get<UserProfile>('/auth/user/');
      setProfile(data);
      setProfileForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        username: data.username || ''
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const fetchApiKeys = async () => {
    try {
      const data = await api.get<ApiKey[]>('/settings/api-keys/');
      setApiKeys(data);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(prev => ({ ...prev, apiKeys: false }));
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.get<NotificationSetting[]>('/settings/notifications/');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  const fetchScanDefaults = async () => {
    try {
      const data = await api.get<ScanDefault>('/settings/scan-defaults/');
      setScanDefaults(data);
      setScanDefaultsForm(data);
    } catch (error) {
      console.error('Failed to fetch scan defaults:', error);
    } finally {
      setLoading(prev => ({ ...prev, scanDefaults: false }));
    }
  };

  const fetchTeam = async () => {
    try {
      const data = await api.get<TeamMember[]>('/settings/team/');
      setTeam(data);
    } catch (error) {
      console.error('Failed to fetch team:', error);
    } finally {
      setLoading(prev => ({ ...prev, team: false }));
    }
  };

  const fetchSecurity = async () => {
    try {
      const data = await api.get<SecuritySetting>('/settings/security/');
      setSecurity(data);
    } catch (error) {
      console.error('Failed to fetch security settings:', error);
    } finally {
      setLoading(prev => ({ ...prev, security: false }));
    }
  };

  const fetchBilling = async () => {
    try {
      const data = await api.get<BillingInfo>('/settings/billing/');
      setBilling(data);
    } catch (error) {
      console.error('Failed to fetch billing:', error);
    } finally {
      setLoading(prev => ({ ...prev, billing: false }));
    }
  };

  const fetchWebhooks = async () => {
    try {
      const data = await api.get<Webhook[]>('/settings/webhooks/');
      setWebhooks(data);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(prev => ({ ...prev, webhooks: false }));
    }
  };

  // ==================== Action Handlers ====================

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await api.put<UserProfile>('/auth/user/', profileForm);
      setProfile(updated);
      addToast('success', 'Profile Updated', 'Your profile has been updated successfully');
    } catch (error) {
      addToast('error', 'Update Failed', 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      addToast('error', 'Password Mismatch', 'New passwords do not match');
      return;
    }

    if (passwordForm.new.length < 8) {
      addToast('error', 'Password Too Short', 'Password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password/', {
        current_password: passwordForm.current,
        new_password: passwordForm.new
      });
      addToast('success', 'Password Changed', 'Your password has been updated');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (error) {
      addToast('error', 'Change Failed', 'Could not change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleGenerateApiKey = async () => {
    if (!newApiKey.name) {
      addToast('error', 'Name Required', 'Please provide a name for this API key');
      return;
    }

    setGeneratingApiKey(true);
    setNewlyGeneratedKey(null);
    
    try {
      const newKey = await api.post<ApiKey & { key: string }>('/settings/api-keys/', {
        name: newApiKey.name,
        permissions: newApiKey.permissions
      });
      
      setApiKeys(prev => [...prev, newKey]);
      setNewlyGeneratedKey(newKey.key);
      setNewApiKey({ name: '', permissions: 'read' });
      
      addToast('success', 'API Key Generated', 'Copy your key now - it won\'t be shown again');
    } catch (error) {
      addToast('error', 'Generation Failed', 'Could not generate API key');
    } finally {
      setGeneratingApiKey(false);
    }
  };

  const handleDeleteApiKey = async (id: number) => {
    if (deletingKeyId === id) {
      try {
        await api.delete(`/settings/api-keys/${id}/`);
        setApiKeys(prev => prev.filter(key => key.id !== id));
        addToast('success', 'API Key Deleted', 'The API key has been revoked');
        setDeletingKeyId(null);
      } catch (error) {
        addToast('error', 'Delete Failed', 'Could not delete API key');
      }
    } else {
      setDeletingKeyId(id);
      setTimeout(() => setDeletingKeyId(null), 3000);
    }
  };

  const handleRegenerateApiKey = async (id: number) => {
    try {
      const newKey = await api.post<ApiKey & { key: string }>(`/settings/api-keys/${id}/regenerate/`);
      setApiKeys(prev => prev.map(key => key.id === id ? newKey : key));
      setNewlyGeneratedKey(newKey.key);
      addToast('success', 'API Key Regenerated', 'New key generated - copy it now');
    } catch (error) {
      addToast('error', 'Regeneration Failed', 'Could not regenerate API key');
    }
  };

  const handleToggleNotification = async (id: number | undefined, event: string, currentValue: boolean) => {
    if (!id) return;
    
    try {
      const updated = await api.put<NotificationSetting>(`/settings/notifications/${id}/`, {
        events: { [event]: !currentValue }
      });
      setNotifications(prev => prev.map(n => n.id === id ? updated : n));
      addToast('success', 'Updated', 'Notification preference saved');
    } catch (error) {
      addToast('error', 'Update Failed', 'Could not update notification setting');
    }
  };

  const handleSaveScanDefaults = async () => {
    if (!scanDefaultsForm) return;
    try {
      const updated = await api.put<ScanDefault>('/settings/scan-defaults/', scanDefaultsForm);
      setScanDefaults(updated);
      addToast('success', 'Defaults Saved', 'Scan defaults have been updated');
    } catch (error) {
      addToast('error', 'Save Failed', 'Could not save scan defaults');
    }
  };

  const handleInviteTeamMember = async () => {
    if (!inviteEmail) return;
    try {
      await api.post('/settings/team/invite/', {
        email: inviteEmail,
        role: inviteRole
      });
      setInviteEmail('');
      addToast('success', 'Invitation Sent', `Invitation sent to ${inviteEmail}`);
      fetchTeam();
    } catch (error) {
      addToast('error', 'Invite Failed', 'Could not send invitation');
    }
  };

  const handleRemoveTeamMember = async (id: number) => {
    try {
      await api.delete(`/settings/team/${id}/`);
      setTeam(prev => prev.filter(member => member.id !== id));
      addToast('success', 'Member Removed', 'Team member has been removed');
    } catch (error) {
      addToast('error', 'Remove Failed', 'Could not remove team member');
    }
  };

  const handleToggleTwoFactor = async () => {
    try {
      const updated = await api.post<SecuritySetting>('/settings/security/two-factor/toggle/');
      setSecurity(updated);
      addToast('success', '2FA Updated', `Two-factor authentication ${updated.two_factor_enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      addToast('error', 'Update Failed', 'Could not update two-factor authentication');
    }
  };

  const handleCreateWebhook = async () => {
    try {
      const webhook = await api.post<Webhook>('/settings/webhooks/', newWebhook);
      setWebhooks(prev => [...prev, webhook]);
      setNewWebhook({ url: '', events: ['scan_complete', 'critical_finding'] });
      addToast('success', 'Webhook Created', 'Webhook has been added');
    } catch (error) {
      addToast('error', 'Create Failed', 'Could not create webhook');
    }
  };

  const handleDeleteWebhook = async (id: number) => {
    try {
      await api.delete(`/settings/webhooks/${id}/`);
      setWebhooks(prev => prev.filter(w => w.id !== id));
      addToast('success', 'Webhook Deleted', 'Webhook has been removed');
    } catch (error) {
      addToast('error', 'Delete Failed', 'Could not delete webhook');
    }
  };

  const handleTestWebhook = async (id: number) => {
    try {
      await api.post(`/settings/webhooks/${id}/test/`);
      addToast('success', 'Test Sent', 'Test webhook has been triggered');
    } catch (error) {
      addToast('error', 'Test Failed', 'Could not trigger webhook');
    }
  };

  const handleExportData = async () => {
    try {
      const response = await api.get('/settings/export-data/', { 
        headers: { 'Accept': 'application/json' }
      });
      
      const dataStr = JSON.stringify(response, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `geniusguard-data-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      addToast('success', 'Export Complete', 'Your data has been exported');
    } catch (error) {
      addToast('error', 'Export Failed', 'Could not export data');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('⚠️ WARNING: This action cannot be undone. All your data will be permanently deleted.')) return;
    if (!window.confirm('Type "DELETE" to confirm')) return;
    
    try {
      await api.delete('/auth/delete-account/');
      await logout();
      navigate('/signin');
      addToast('success', 'Account Deleted', 'Your account has been deleted');
    } catch (error) {
      addToast('error', 'Delete Failed', 'Could not delete account');
    }
  };

  // ==================== Render ====================

  return (
    <DashboardLayout currentPage="Settings">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sliders size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account, team, and application preferences</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 h-auto p-1 gap-1">
            <TabsTrigger value="profile" className="text-xs gap-1.5 py-2">
              <User size={14} /> Profile
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs gap-1.5 py-2">
              <Key size={14} /> API
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs gap-1.5 py-2">
              <Bell size={14} /> Notifications
            </TabsTrigger>
            <TabsTrigger value="scans" className="text-xs gap-1.5 py-2">
              <Zap size={14} /> Scans
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs gap-1.5 py-2">
              <Users size={14} /> Team
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs gap-1.5 py-2">
              <Shield size={14} /> Security
            </TabsTrigger>
            <TabsTrigger value="billing" className="text-xs gap-1.5 py-2">
              <Award size={14} /> Billing
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs gap-1.5 py-2">
              <Sliders size={14} /> Advanced
            </TabsTrigger>
          </TabsList>

          {/* ==================== Profile Tab ==================== */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <Card className="p-6 bg-card/50 border-border card-glow">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <User size={16} className="text-primary" />
                Profile Information
              </h3>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">First Name</label>
                    {loading.profile ? (
                      <SkeletonField />
                    ) : (
                      <Input
                        value={profileForm.first_name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                        className="bg-muted/20 border-border"
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Last Name</label>
                    {loading.profile ? (
                      <SkeletonField />
                    ) : (
                      <Input
                        value={profileForm.last_name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                        className="bg-muted/20 border-border"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Email Address</label>
                  {loading.profile ? (
                    <SkeletonField />
                  ) : (
                    <Input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-muted/20 border-border"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Username</label>
                  {loading.profile ? (
                    <SkeletonField />
                  ) : (
                    <Input
                      value={profileForm.username}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                      className="bg-muted/20 border-border"
                    />
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={savingProfile || loading.profile}
                    className="gap-2"
                  >
                    <Save size={14} />
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card/50 border-border card-glow">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lock size={16} className="text-primary" />
                Change Password
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Current Password</label>
                  <Input
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                    className="bg-muted/20 border-border"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">New Password</label>
                  <Input
                    type="password"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                    className="bg-muted/20 border-border"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Confirm New Password</label>
                  <Input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                    className="bg-muted/20 border-border"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={changingPassword || !passwordForm.current || !passwordForm.new}
                    className="gap-2"
                  >
                    <Lock size={14} />
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card/50 border-border card-glow border-destructive/20">
              <h3 className="font-semibold text-destructive mb-4 flex items-center gap-2">
                <AlertTriangle size={16} />
                Danger Zone
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/10">
                  <div>
                    <p className="text-sm font-medium text-foreground">Export Your Data</p>
                    <p className="text-xs text-muted-foreground mt-1">Download all your scans, vulnerabilities, and settings</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportData} className="gap-2">
                    <Download size={14} /> Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/10">
                  <div>
                    <p className="text-sm font-medium text-foreground">Delete Account</p>
                    <p className="text-xs text-muted-foreground mt-1">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDeleteAccount} className="gap-2">
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ==================== API Keys Tab ==================== */}
          <TabsContent value="api" className="space-y-4 mt-4">
            <Card className="p-6 bg-card/50 border-border card-glow">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Key size={16} className="text-primary" />
                API Keys
              </h3>

              {/* Newly generated key display */}
              {newlyGeneratedKey && (
                <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-2">Your new API key</p>
                      <div className="flex items-center gap-2 bg-background/50 p-2 rounded border border-border">
                        <code className="text-xs font-mono break-all flex-1">{newlyGeneratedKey}</code>
                        <CopyButton text={newlyGeneratedKey} label="API key" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        ⚠️ This key will only be shown once. Copy it now and store it securely.
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0" 
                      onClick={() => setNewlyGeneratedKey(null)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Create new API key */}
              <div className="mb-6 p-4 bg-muted/10 rounded-lg border border-border/30">
                <h4 className="text-sm font-medium text-foreground mb-3">Generate New API Key</h4>
                <div className="flex gap-3 flex-wrap">
                  <Input
                    placeholder="Key name (e.g., Firefox Extension)"
                    value={newApiKey.name}
                    onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-muted/20 border-border flex-1 min-w-[200px]"
                  />
                  <select
                    value={newApiKey.permissions}
                    onChange={(e) => setNewApiKey(prev => ({ ...prev, permissions: e.target.value as any }))}
                    className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm"
                  >
                    <option value="read">Read Only</option>
                    <option value="read_write">Read & Write</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button 
                    onClick={handleGenerateApiKey} 
                    disabled={generatingApiKey || !newApiKey.name}
                    className="gap-2"
                  >
                    <Key size={14} />
                    {generatingApiKey ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              </div>

              {/* API Keys list */}
              {loading.apiKeys ? (
                <div className="space-y-3">
                  <SkeletonField />
                  <SkeletonField />
                  <SkeletonField />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Key size={32} className="mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No API keys yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Generate your first key for extension access</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map(key => {
                    const isDeleting = deletingKeyId === key.id;
                    const permissionsDisplay = Array.isArray(key.permissions) 
                      ? key.permissions.join(', ') 
                      : key.permissions;
                    
                    return (
                      <div key={key.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-border/30">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{key.name}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                              {permissionsDisplay}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-muted/30 px-2 py-1 rounded font-mono">
                              {showApiKey[key.id] ? key.key : (key.key_preview || '••••••••••••••••')}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setShowApiKey(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                            >
                              {showApiKey[key.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                            </Button>
                            <CopyButton text={key.key} />
                          </div>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            Created: {new Date(key.created_at).toLocaleDateString()}
                            {key.last_used && ` • Last used: ${new Date(key.last_used).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleRegenerateApiKey(key.id)}
                            title="Regenerate key"
                          >
                            <RefreshCw size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 transition-colors ${
                              isDeleting ? 'text-destructive bg-destructive/10 animate-pulse' : 'hover:text-destructive'
                            }`}
                            onClick={() => handleDeleteApiKey(key.id)}
                            title={isDeleting ? 'Click again to confirm' : 'Delete key'}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="p-6 bg-card/50 border-border card-glow">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe size={16} className="text-primary" />
                API Documentation
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use our REST API to integrate GeniusGuard with your CI/CD pipeline, monitoring tools, and custom applications.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open('/api/docs', '_blank')}>
                  <BookOpen size={14} /> API Reference
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open('https://docs.geniusguard.com/api', '_blank')}>
                  <ExternalLink size={14} /> Documentation
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ==================== Notifications Tab ==================== */}
          <TabsContent value="notifications" className="space-y-4 mt-4">
            <Card className="p-6 bg-card/50 border-border card-glow">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bell size={16} className="text-primary" />
                Notification Preferences
              </h3>

              {loading.notifications ? (
                <div className="space-y-4">
                  <SkeletonField />
                  <SkeletonField />
                  <SkeletonField />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell size={32} className="mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No notification settings found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <Mail size={14} className="text-primary" /> Email
                    </h4>
                    <div className="space-y-2">
                      {[
                        { id: 'scan_complete', label: 'Scan Complete' },
                        { id: 'scan_failed', label: 'Scan Failed' },
                        { id: 'critical_finding', label: 'Critical Finding' },
                        { id: 'high_finding', label: 'High Finding' },
                        { id: 'report_generated', label: 'Report Generated' },
                        { id: 'schedule_run', label: 'Scheduled Scan Run' }
                      ].map(event => {
                        const currentSetting = notifications[0];
                        const isEnabled = currentSetting?.events?.[event.id as keyof typeof currentSetting.events] || false;
                        
                        return (
                          <div key={event.id} className="flex items-center justify-between py-2">
                            <span className="text-sm text-foreground">{event.label}</span>
                            <button
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                isEnabled ? 'bg-primary' : 'bg-muted'
                              }`}
                              onClick={() => handleToggleNotification(currentSetting?.id, event.id, isEnabled)}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ==================== Scans Tab ==================== */}
          <TabsContent value="scans" className="space-y-4 mt-4">
            <Card className="p-6 bg-card/50 border-border card-glow">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap size={16} className="text-primary" />
                Scan Defaults
              </h3>

              {loading.scanDefaults ? (
                <div className="space-y-4">
                  <SkeletonField />
                  <SkeletonField />
                  <SkeletonField />
                </div>
              ) : scanDefaultsForm && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Default Scan Type</label>
                      <select
                        value={scanDefaultsForm.scan_type}
                        onChange={(e) => setScanDefaultsForm(prev => ({ ...prev!, scan_type: e.target.value as 'quick' | 'deep' }))}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground text-sm"
                      >
                        <option value="quick">Quick Scan</option>
                        <option value="deep">Deep Scan</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Scan Timeout (seconds)</label>
                      <Input
                        type="number"
                        value={scanDefaultsForm.timeout}
                        onChange={(e) => setScanDefaultsForm(prev => ({ ...prev!, timeout: parseInt(e.target.value) }))}
                        className="bg-muted/20 border-border"
                        min="60"
                        max="3600"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Max Retries</label>
                      <Input
                        type="number"
                        value={scanDefaultsForm.max_retries}
                        onChange={(e) => setScanDefaultsForm(prev => ({ ...prev!, max_retries: parseInt(e.target.value) }))}
                        className="bg-muted/20 border-border"
                        min="0"
                        max="5"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Concurrent Scans</label>
                      <Input
                        type="number"
                        value={scanDefaultsForm.concurrent_scans}
                        onChange={(e) => setScanDefaultsForm(prev => ({ ...prev!, concurrent_scans: parseInt(e.target.value) }))}
                        className="bg-muted/20 border-border"
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Auto-generate report after scan</span>
                      <button
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          scanDefaultsForm.auto_report ? 'bg-primary' : 'bg-muted'
                        }`}
                        onClick={() => setScanDefaultsForm(prev => ({ ...prev!, auto_report: !prev!.auto_report }))}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            scanDefaultsForm.auto_report ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {scanDefaultsForm.auto_report && (
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Report Format</label>
                        <select
                          value={scanDefaultsForm.report_format}
                          onChange={(e) => setScanDefaultsForm(prev => ({ ...prev!, report_format: e.target.value as 'pdf' | 'html' | 'json' }))}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground text-sm"
                        >
                          <option value="pdf">PDF</option>
                          <option value="html">HTML</option>
                          <option value="json">JSON</option>
                        </select>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Notify on scan completion</span>
                      <button
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          scanDefaultsForm.notification_on_complete ? 'bg-primary' : 'bg-muted'
                        }`}
                        onClick={() => setScanDefaultsForm(prev => ({ ...prev!, notification_on_complete: !prev!.notification_on_complete }))}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            scanDefaultsForm.notification_on_complete ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Notify on scan failure</span>
                      <button
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          scanDefaultsForm.notification_on_failure ? 'bg-primary' : 'bg-muted'
                        }`}
                        onClick={() => setScanDefaultsForm(prev => ({ ...prev!, notification_on_failure: !prev!.notification_on_failure }))}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            scanDefaultsForm.notification_on_failure ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveScanDefaults} className="gap-2">
                      <Save size={14} /> Save Defaults
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ==================== Team Tab ==================== */}
          <TabsContent value="team" className="space-y-4 mt-4">
            <Card className="p-6 bg-card/50 border-border card-glow">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Team Members
              </h3>

              {/* Invite form */}
              <div className="mb-6 p-4 bg-muted/10 rounded-lg border border-border/30">
                <h4 className="text-sm font-medium text-foreground mb-3">Invite Team Member</h4>
                <div className="flex gap-3">
                  <Input
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-muted/20 border-border flex-1"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Button onClick={handleInviteTeamMember} disabled={!inviteEmail} className="gap-2">
                    <Mail size={14} /> Invite
                  </Button>
                </div>
              </div>

              {loading.team ? (
                <div className="space-y-3">
                  <SkeletonField />
                  <SkeletonField />
                  <SkeletonField />
                </div>
              ) : team.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={32} className="mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No team members yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Invite your first team member to collaborate</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {team.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-foreground">
                            {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || member.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{member.name || member.email}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              member.role === 'owner' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              member.role === 'admin' ? 'bg-primary/10 text-primary border border-primary/20' :
                              member.role === 'member' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              'bg-muted/30 text-muted-foreground border border-border'
                            }`}>
                              {member.role}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              member.status === 'active' ? 'bg-green-500/10 text-green-400' :
                              member.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>
                              {member.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                          {member.last_active && (
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              Last active: {new Date(member.last_active).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveTeamMember(member.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ==================== Security Tab ==================== */}
          <TabsContent value="security" className="space-y-4 mt-4">
            <Card className="p-6 bg-card/50 border-border card-glow">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield size={16} className="text-primary" />
                Security Settings
              </h3>

              {loading.security ? (
                <div className="space-y-4">
                  <SkeletonField />
                  <SkeletonField />
                  <SkeletonField />
                </div>
              ) : security && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Button 
                      variant={security.two_factor_enabled ? "outline" : "default"} 
                      size="sm"
                      onClick={handleToggleTwoFactor}
                    >
                      {security.two_factor_enabled ? 'Disable' : 'Enable'} 2FA
                    </Button>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Session Timeout (minutes)</label>
                    <Input
                      type="number"
                      value={security.session_timeout}
                      onChange={(e) => setSecurity(prev => ({ ...prev!, session_timeout: parseInt(e.target.value) }))}
                      className="bg-muted/20 border-border w-48"
                      min="5"
                      max="1440"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Password Expiry (days)</label>
                    <Input
                      type="number"
                      value={security.password_expiry_days}
                      onChange={(e) => setSecurity(prev => ({ ...prev!, password_expiry_days: parseInt(e.target.value) }))}
                      className="bg-muted/20 border-border w-48"
                      min="0"
                      max="365"
                    />
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Set to 0 for never expire</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Login Notifications</p>
                      <p className="text-xs text-muted-foreground">Get email when someone logs into your account</p>
                    </div>
                    <button
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        security.login_notifications ? 'bg-primary' : 'bg-muted'
                      }`}
                      onClick={() => setSecurity(prev => ({ ...prev!, login_notifications: !prev!.login_notifications }))}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          security.login_notifications ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">IP Whitelist</label>
                    <div className="space-y-2">
                      {security.ip_whitelist.map((ip, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input value={ip} readOnly className="bg-muted/20 border-border flex-1" />
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <X size={14} />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="gap-2">
                        <Plus size={14} /> Add IP
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6 bg-card/50 border-border card-glow">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe size={16} className="text-primary" />
                Session Management
              </h3>

              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                addToast('success', 'Sessions Terminated', 'All other sessions have been logged out');
              }}>
                <LogOut size={14} /> Sign Out All Other Devices
              </Button>
            </Card>
          </TabsContent>

          {/* ==================== Billing Tab ==================== */}
          <TabsContent value="billing" className="space-y-4 mt-4">
            <Card className="p-6 bg-card/50 border-border card-glow">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award size={16} className="text-primary" />
                Current Plan
              </h3>

              {loading.billing ? (
                <SkeletonField />
              ) : billing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <p className="text-2xl font-bold text-foreground capitalize">{billing.plan}</p>
                    </div>
                    <Button variant="outline" size="sm">Upgrade</Button>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Scan Usage</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(billing.scans_used / billing.scans_limit) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-foreground">
                        {billing.scans_used} / {billing.scans_limit}
                      </span>
                    </div>
                  </div>

                  {billing.next_billing && (
                    <div>
                      <p className="text-sm text-muted-foreground">Next Billing Date</p>
                      <p className="text-sm text-foreground">{new Date(billing.next_billing).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-6 bg-card/50 border-border card-glow">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Download size={16} className="text-primary" />
                Invoices
              </h3>

              {billing?.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices yet</p>
              ) : (
                <div className="space-y-2">
                  {billing?.invoices.map(invoice => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                      <div>
                        <p className="text-sm text-foreground">Invoice #{invoice.id}</p>
                        <p className="text-xs text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-500/10 text-green-400' :
                          invoice.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {invoice.status}
                        </span>
                        <span className="text-sm text-foreground">${invoice.amount}</span>
                        <Button variant="ghost" size="sm" onClick={() => window.open(invoice.url)}>
                          <Download size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ==================== Advanced Tab ==================== */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <Card className="p-6 bg-card/50 border-border card-glow">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Palette size={16} className="text-primary" />
                Appearance
              </h3>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
                </div>
                <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-card/50 border-border card-glow">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Link size={16} className="text-primary" />
                Webhooks
              </h3>

              {/* Create webhook */}
              <div className="mb-6 p-4 bg-muted/10 rounded-lg border border-border/30">
                <h4 className="text-sm font-medium text-foreground mb-3">Add Webhook</h4>
                <div className="space-y-3">
                  <Input
                    placeholder="https://api.example.com/webhook"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                    className="bg-muted/20 border-border"
                  />
                  <select
                    multiple
                    value={newWebhook.events}
                    onChange={(e) => setNewWebhook(prev => ({ 
                      ...prev, 
                      events: Array.from(e.target.selectedOptions, option => option.value)
                    }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-foreground text-sm h-24"
                  >
                    <option value="scan_complete">Scan Complete</option>
                    <option value="scan_failed">Scan Failed</option>
                    <option value="critical_finding">Critical Finding</option>
                    <option value="high_finding">High Finding</option>
                    <option value="report_generated">Report Generated</option>
                    <option value="schedule_run">Scheduled Scan Run</option>
                  </select>
                  <Button onClick={handleCreateWebhook} disabled={!newWebhook.url} className="w-full">
                    <Plus size={14} /> Add Webhook
                  </Button>
                </div>
              </div>

              {/* Webhooks list */}
              {loading.webhooks ? (
                <SkeletonField />
              ) : webhooks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No webhooks configured</p>
              ) : (
                <div className="space-y-3">
                  {webhooks.map(webhook => (
                    <div key={webhook.id} className="p-3 bg-muted/10 rounded-lg border border-border/30">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-xs bg-muted/30 px-2 py-1 rounded">{webhook.url}</code>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleTestWebhook(webhook.id)}>
                            <RefreshCw size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteWebhook(webhook.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          webhook.enabled ? 'bg-green-500/10 text-green-400' : 'bg-muted/30 text-muted-foreground'
                        }`}>
                          {webhook.enabled ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Events: {webhook.events.join(', ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6 bg-card/50 border-border card-glow">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <RefreshCw size={16} className="text-primary" />
                Data Management
              </h3>

              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={handleExportData}>
                  <Download size={14} /> Export All Data
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
                  <Trash2 size={14} /> Clear Scan History
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Brain, Shield, Globe, Lock, Zap, AlertTriangle, CheckCircle,
  XCircle, ExternalLink, Clock, Code, Users, Server,
  History, Copy, Check, Loader2, AlertCircle, Key, ShieldCheck,
  ShieldAlert, RefreshCw, Plus, Trash2, Terminal, Play, Eye,
  EyeOff, ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';

// ==================== Types ====================

interface DeepScanSession {
  id: number;
  name: string;
  target: string;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  metadata: Record<string, any>;
  findings_count?: number;
  critical_count?: number;
  high_count?: number;
  medium_count?: number;
  low_count?: number;
}

interface AuthorizedTarget {
  id: number;
  domain: string;
  full_target: string;
  verification_method: 'file' | 'meta_tag' | 'dns_txt';
  verification_token: string;
  status: 'pending' | 'verified' | 'failed' | 'revoked' | 'expired';
  is_valid: boolean;
  verified_at: string | null;
  expires_at: string | null;
  last_checked_at: string | null;
  verification_attempts: number;
  last_verification_error: string;
  dns_txt_record: string;
  file_path: string;
  file_content: string;
  meta_tag: string;
}

interface ScanFormData {
  target: string;
  useCredentials: boolean;
  login_url: string;
  username_field: string;
  username: string;
  password: string;
}

// ==================== Authorization Panel ====================

function AuthorizationPanel({ onVerified }: { onVerified?: () => void }) {
  const { addToast } = useToast();
  const [targets, setTargets]     = useState<AuthorizedTarget[]>([]);
  const [loading, setLoading]     = useState(true);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [copiedId, setCopiedId]   = useState<string | null>(null);
  const [newUrl, setNewUrl]       = useState('');
  const [newMethod, setNewMethod] = useState<'file' | 'meta_tag' | 'dns_txt'>('file');
  const [adding, setAdding]       = useState(false);

  const loadTargets = async () => {
    setLoading(true);
    try {
      const data = await api.get<AuthorizedTarget[]>('/authorized-targets/');
      setTargets(data);
    } catch {
      addToast('error', 'Error', 'Failed to load authorized targets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTargets(); }, []);

  const handleAdd = async () => {
    if (!newUrl.trim()) { addToast('error', 'Required', 'Enter a target URL'); return; }
    setAdding(true);
    try {
      await api.post('/authorized-targets/', {
        target_url: newUrl.trim(),
        verification_method: newMethod,
        authorization_notes: 'I own or have written authorization to test this domain.',
      });
      addToast('success', 'Registered', 'Follow the instructions below to verify.');
      setNewUrl('');
      setShowAdd(false);
      await loadTargets();
    } catch (e: any) {
      addToast('error', 'Failed', e?.message || 'Could not register domain');
    } finally {
      setAdding(false);
    }
  };

  const handleVerify = async (target: AuthorizedTarget) => {
    setVerifying(target.id);
    try {
      const result = await api.post<{ verified: boolean; message: string }>(
        `/authorized-targets/${target.id}/verify/`, {}
      );
      if (result.verified) {
        addToast('success', 'Verified!', `${target.domain} is now authorized for scanning.`);
        onVerified?.();
      } else {
        addToast('error', 'Not verified yet', result.message);
      }
      await loadTargets();
    } catch (e: any) {
      addToast('error', 'Failed', e?.message || 'Verification failed');
    } finally {
      setVerifying(null);
    }
  };

  const handleRevoke = async (target: AuthorizedTarget) => {
    if (!confirm(`Revoke authorization for ${target.domain}?`)) return;
    try {
      await api.delete(`/authorized-targets/${target.id}/revoke/`);
      addToast('info', 'Revoked', `${target.domain} removed.`);
      await loadTargets();
    } catch {
      addToast('error', 'Error', 'Could not revoke');
    }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getInstructions = (target: AuthorizedTarget) => {
    if (target.verification_method === 'file') {
      return {
        badge: 'Easiest for Render / Vercel / Netlify',
        badgeColor: 'bg-green-500/10 text-green-400 border-green-500/20',
        steps: [
          {
            label: '1. Create a file in your project',
            detail: "Add this file inside your project's public or static folder:",
            code: `public/.well-known/geniusguard-verification.txt`,
          },
          {
            label: '2. Paste this exact text inside the file',
            detail: 'The file must contain only this — no extra spaces or newlines:',
            code: target.file_content,
          },
          {
            label: '3. Deploy your site',
            detail: 'Push to your repo. Render/Vercel/Netlify will redeploy in about 1–2 minutes.',
            code: null,
          },
          {
            label: '4. Click Verify Now below',
            detail: `We will check https://${target.domain}/.well-known/geniusguard-verification.txt for the token.`,
            code: null,
          },
        ],
      };
    }

    if (target.verification_method === 'meta_tag') {
      return {
        badge: 'Good for any HTML site',
        badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        steps: [
          {
            label: '1. Open your homepage HTML',
            detail: 'Find the <head> section of your main index.html or layout file.',
            code: null,
          },
          {
            label: '2. Paste this tag inside <head>',
            detail: 'Copy the entire tag and paste it anywhere inside <head>:',
            code: target.meta_tag,
          },
          {
            label: '3. Deploy your site',
            detail: 'Push to your repo and wait for the deployment to complete.',
            code: null,
          },
          {
            label: '4. Click Verify Now below',
            detail: 'We will check your homepage for the meta tag.',
            code: null,
          },
        ],
      };
    }

    return {
      badge: 'For custom domains with DNS access',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      steps: [
        {
          label: '1. Log into your DNS provider',
          detail: 'Go to Cloudflare, GoDaddy, Namecheap, or wherever your domain DNS is managed.',
          code: null,
        },
        {
          label: '2. Add a TXT record with these exact values',
          detail: null,
          code: `Name:  @\nValue: ${target.dns_txt_record}`,
        },
        {
          label: '3. Wait for DNS propagation',
          detail: 'DNS changes typically take 1–10 minutes, sometimes up to an hour.',
          code: null,
        },
        {
          label: '4. Click Verify Now below',
          detail: 'We will do a DNS lookup to confirm the record exists.',
          code: null,
        },
      ],
    };
  };

  const statusConfig = (s: AuthorizedTarget['status']) => ({
    verified: { icon: ShieldCheck, color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',   label: 'Verified' },
    pending:  { icon: Clock,       color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Pending'  },
    failed:   { icon: ShieldAlert, color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',       label: 'Failed'   },
    revoked:  { icon: XCircle,     color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/20',     label: 'Revoked'  },
    expired:  { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'Expired'  },
  })[s];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <ShieldCheck size={18} className="text-green-400" /> Authorized Domains
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Prove you own the target domain before scanning. Pick the method that fits your setup.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-2">
          <Plus size={14} /> Add Domain
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="p-5 bg-primary/5 border-primary/20 space-y-4">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Globe size={16} className="text-primary" /> Register a Domain
          </h4>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Target URL</Label>
            <Input
              placeholder="https://myapp.onrender.com"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
            />
          </div>

          {/* Method picker cards */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Verification Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'file',     icon: FileText, label: 'Upload File',  desc: 'Add 1 file to your project', recommended: true  },
                { value: 'meta_tag', icon: Code,     label: 'Meta Tag',     desc: 'Paste a tag in <head>',      recommended: false },
                { value: 'dns_txt',  icon: Globe,    label: 'DNS Record',   desc: 'Add a DNS TXT record',       recommended: false },
              ].map(opt => {
                const Icon     = opt.icon;
                const selected = newMethod === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setNewMethod(opt.value as any)}
                    className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-muted/10 hover:border-border/60'
                    }`}
                  >
                    {opt.recommended && (
                      <span className="absolute -top-2 left-2 text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                        Easiest
                      </span>
                    )}
                    <Icon size={16} className={selected ? 'text-primary' : 'text-muted-foreground'} />
                    <p className={`text-xs font-medium mt-1.5 ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">{opt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-muted-foreground">
            <span className="font-semibold text-blue-400">Note:</span> By registering this domain you confirm
            you own it or have written authorization to perform security testing on it.
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={adding} size="sm" className="gap-2">
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {adding ? 'Registering...' : 'Register & Get Instructions'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Targets list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-24 bg-muted/20 rounded-lg animate-pulse" />)}
        </div>
      ) : targets.length === 0 ? (
        <Card className="p-8 text-center bg-card/50 border-dashed border-border">
          <ShieldAlert size={32} className="text-muted-foreground/40 mx-auto mb-3" />
          <h4 className="font-semibold text-foreground mb-1">No Authorized Domains</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Add your domain and follow the simple steps to start scanning.
          </p>
          <Button onClick={() => setShowAdd(true)} variant="outline" size="sm" className="gap-2">
            <Plus size={14} /> Add Domain
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {targets.map(target => {
            const cfg  = statusConfig(target.status);
            const Icon = cfg.icon;
            const inst = getInstructions(target);
            const isV  = verifying === target.id;

            return (
              <Card key={target.id} className="p-5 bg-card/50 border-border">
                {/* Header row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${cfg.bg}`}>
                      <Icon size={16} className={cfg.color} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{target.domain}</h4>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${inst.badgeColor}`}>
                          {inst.badge}
                        </span>
                        {target.verified_at && (
                          <span className="text-[10px] text-muted-foreground">
                            Verified {new Date(target.verified_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!target.is_valid && target.status !== 'revoked' && (
                      <Button size="sm" onClick={() => handleVerify(target)} disabled={isV} className="gap-2 text-xs">
                        {isV
                          ? <><Loader2 size={12} className="animate-spin" /> Checking...</>
                          : <><RefreshCw size={12} /> Verify Now</>
                        }
                      </Button>
                    )}
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => handleRevoke(target)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>

                {/* Step-by-step instructions while not verified */}
                {!target.is_valid && target.status !== 'revoked' && (
                  <div className="mt-3 space-y-3">
                    {inst.steps.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex-shrink-0 flex items-center justify-center text-[11px] font-bold mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{step.label}</p>
                          {step.detail && (
                            <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                          )}
                          {step.code && (
                            <div className="mt-2 flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border/40">
                              <code className="text-xs font-mono text-foreground flex-1 break-all whitespace-pre-wrap">
                                {step.code}
                              </code>
                              <Button
                                variant="ghost" size="sm"
                                className="h-6 px-2 flex-shrink-0 mt-0.5"
                                onClick={() => copy(step.code!, `step-${target.id}-${i}`)}
                              >
                                {copiedId === `step-${target.id}-${i}`
                                  ? <Check size={11} className="text-green-400" />
                                  : <Copy size={11} />
                                }
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {target.last_verification_error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                        <p className="font-medium mb-1">Last attempt failed:</p>
                        <p>{target.last_verification_error}</p>
                      </div>
                    )}

                    <Button
                      onClick={() => handleVerify(target)}
                      disabled={isV}
                      className="w-full gap-2 mt-1"
                    >
                      {isV
                        ? <><Loader2 size={14} className="animate-spin" /> Checking your site...</>
                        : <><RefreshCw size={14} /> Verify Now</>
                      }
                    </Button>
                  </div>
                )}

                {target.is_valid && (
                  <p className="text-xs text-green-400 flex items-center gap-1 mt-2">
                    <CheckCircle size={12} /> Domain verified — ready to scan
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== Scan Form ====================

function ScanForm({ authorizedTargets, onScanStarted }: {
  authorizedTargets: AuthorizedTarget[];
  onScanStarted?: () => void;
}) {
  const { addToast }  = useToast();
  const [, navigate]  = useLocation();

  const [form, setForm] = useState<ScanFormData>({
    target: '',
    useCredentials: false,
    login_url: '',
    username_field: 'email',
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword]   = useState(false);
  const [scanning, setScanning]           = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const verifiedTargets = authorizedTargets.filter(t => t.is_valid);

  const handleScan = async () => {
    if (!form.target) {
      addToast('error', 'Required', 'Select a target domain');
      return;
    }
    setScanning(true);
    try {
      const payload: any = { target: form.target };

      if (form.useCredentials && form.username && form.password) {
        payload.credentials = {
          login_url:      form.login_url || form.target + '/login/',
          username_field: form.username_field,
          username:       form.username,
          password:       form.password,
        };
      }

      const result = await api.post<{ scan: { id: number } }>('/scans/deep/', payload);
      addToast('success', 'Deep Scan Started', 'Playwright is crawling your application.');
      onScanStarted?.();
      navigate(`/scan/${result.scan.id}`);
    } catch (e: any) {
      const msg = e?.detail || e?.error || e?.message || 'Failed to start scan';
      if (msg.includes('not authorized') || msg.includes('verify_domain')) {
        addToast('error', 'Domain Not Authorized', 'Verify domain ownership in the Authorize tab first.');
      } else {
        addToast('error', 'Scan Failed', msg);
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Target selector */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-2 block">Target Domain</Label>
        {verifiedTargets.length > 0 ? (
          <Select value={form.target} onValueChange={v => setForm(f => ({ ...f, target: v }))}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select a verified domain..." />
            </SelectTrigger>
            <SelectContent>
              {verifiedTargets.map(t => (
                <SelectItem key={t.id} value={t.full_target}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={12} className="text-green-400" />
                    {t.domain}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-400 flex items-center gap-2">
            <ShieldAlert size={16} />
            No verified domains yet — go to the Authorize tab and verify a domain first.
          </div>
        )}
      </div>

      {/* Authenticated scan toggle */}
      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border/30">
        <div>
          <p className="text-sm font-medium text-foreground">Authenticated Scan</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log in as a real user to test IDOR, business logic, and auth vulnerabilities
          </p>
        </div>
        <Switch
          checked={form.useCredentials}
          onCheckedChange={v => setForm(f => ({ ...f, useCredentials: v }))}
        />
      </div>

      {/* Credentials section */}
      {form.useCredentials && (
        <Card className="p-4 bg-card/50 border-border space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Key size={14} className="text-primary" /> Login Credentials
          </h4>
          <p className="text-xs text-muted-foreground -mt-2">
            Use a dedicated test account. Credentials are only used during the scan and never stored.
          </p>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Login Page URL</Label>
            <Input
              placeholder={`${form.target || 'https://yourdomain.com'}/login/`}
              value={form.login_url}
              onChange={e => setForm(f => ({ ...f, login_url: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Username Field</Label>
              <Select
                value={form.username_field}
                onValueChange={v => setForm(f => ({ ...f, username_field: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="username">Username</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                {form.username_field === 'email' ? 'Email Address' : 'Username'}
              </Label>
              <Input
                type={form.username_field === 'email' ? 'email' : 'text'}
                placeholder={form.username_field === 'email' ? 'tester@yourdomain.com' : 'testuser'}
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Test account password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="pr-10"
              />
              <Button
                variant="ghost" size="sm"
                className="absolute right-1 top-1 h-7 w-7 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
            </div>
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-muted-foreground">
            <span className="font-semibold text-blue-400">Tip:</span> Use a dedicated test account with
            realistic data but no real personal information. The scanner will browse as this user to
            test authenticated flows.
          </div>
        </Card>
      )}

      {/* What gets tested — collapsible */}
      <div
        className="p-3 bg-muted/20 rounded-lg border border-border/30 cursor-pointer"
        onClick={() => setShowChecklist(!showChecklist)}
      >
        <div className="flex items-center justify-between text-sm font-medium text-foreground">
          <span className="flex items-center gap-2">
            <Shield size={14} className="text-primary" /> What this scan tests
          </span>
          {showChecklist ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {showChecklist && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { label: 'Security headers & TLS',    auth: false },
              { label: 'CORS misconfiguration',     auth: false },
              { label: 'Sensitive file exposure',   auth: false },
              { label: 'XSS (reflected & DOM)',     auth: false },
              { label: 'CSRF protection',           auth: false },
              { label: 'Rate limiting on login',    auth: false },
              { label: 'Business logic flaws',      auth: true  },
              { label: 'IDOR / object access',      auth: true  },
              { label: 'Auth token storage',        auth: true  },
              { label: 'Role/privilege escalation', auth: true  },
              { label: 'Session management',        auth: true  },
              { label: 'Account enumeration',       auth: true  },
            ].map((item, i) => {
              const active = !item.auth || form.useCredentials;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-xs ${
                    active ? 'text-muted-foreground' : 'text-muted-foreground/40'
                  }`}
                >
                  <CheckCircle size={11} className={active ? 'text-green-400' : 'text-muted-foreground/30'} />
                  {item.label}
                  {item.auth && !form.useCredentials && (
                    <span className="text-[10px] text-primary">(needs auth)</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Launch button */}
      <Button
        className="w-full gap-2"
        size="lg"
        onClick={handleScan}
        disabled={scanning || !form.target || verifiedTargets.length === 0}
      >
        {scanning
          ? <><Loader2 size={16} className="animate-spin" /> Launching Scanner...</>
          : <><Play size={16} /> Start Deep Scan</>
        }
      </Button>

      {scanning && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm space-y-1">
          <p className="font-medium text-blue-400">Scanner is running...</p>
          <p className="text-xs text-muted-foreground">
            Playwright is crawling your application, testing forms, intercepting API calls,
            and running AI triage on all findings. This usually takes 2–8 minutes.
          </p>
        </div>
      )}
    </div>
  );
}

// ==================== Main Component ====================

export default function DeepScan() {
  const [, navigate]  = useLocation();
  const { addToast }  = useToast();

  const [activeTab, setActiveTab]                   = useState<'scan' | 'authorize' | 'sessions'>('scan');
  const [sessions, setSessions]                     = useState<DeepScanSession[]>([]);
  const [authorizedTargets, setAuthorizedTargets]   = useState<AuthorizedTarget[]>([]);
  const [loadingSessions, setLoadingSessions]       = useState(false);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await api.get<DeepScanSession[]>('/scan/list/');
      setSessions(data.filter(s => s.metadata?.scan_type === 'playwright_deep'));
    } catch {
      addToast('error', 'Error', 'Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadAuthorizedTargets = async () => {
    try {
      const data = await api.get<AuthorizedTarget[]>('/authorized-targets/');
      setAuthorizedTargets(data);
    } catch { /* silent */ }
  };

  useEffect(() => { loadAuthorizedTargets(); }, []);
  useEffect(() => { if (activeTab === 'sessions') loadSessions(); }, [activeTab]);

  const verifiedCount = authorizedTargets.filter(t => t.is_valid).length;

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return d; }
  };

  const statusIcon = (s: DeepScanSession['status']) => ({
    pending:   <Clock size={14} className="text-yellow-400" />,
    running:   <Loader2 size={14} className="text-blue-400 animate-spin" />,
    completed: <CheckCircle size={14} className="text-green-400" />,
    failed:    <XCircle size={14} className="text-red-400" />,
  })[s];

  return (
    <DashboardLayout currentPage="Deep Scan">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-primary/20 flex items-center justify-center">
            <Brain size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Deep Scan</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered headless browser scanning — no extension needed
            </p>
          </div>
          {verifiedCount > 0 && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <ShieldCheck size={12} className="text-green-400" />
              <span className="text-xs font-medium text-green-400">
                {verifiedCount} domain{verifiedCount > 1 ? 's' : ''} authorized
              </span>
            </div>
          )}
        </div>

        {/* How it works strip */}
        <Card className="p-4 bg-card/50 border-border">
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { icon: ShieldCheck, label: 'Verify domain ownership',  color: 'text-green-400',  bg: 'bg-green-500/10'  },
              { icon: Play,        label: 'Start a deep scan',         color: 'text-primary',    bg: 'bg-primary/10'    },
              { icon: Globe,       label: 'Playwright crawls your app',color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
              { icon: Brain,       label: 'AI triages all findings',   color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.icon size={18} className={item.color} />
                </div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 h-11">
            <TabsTrigger value="scan" className="text-xs gap-1.5">
              <Play size={14} /> New Scan
            </TabsTrigger>
            <TabsTrigger value="authorize" className="text-xs gap-1.5">
              <ShieldCheck size={14} /> Authorize
              {verifiedCount === 0 && <span className="w-2 h-2 bg-yellow-400 rounded-full" />}
            </TabsTrigger>
            <TabsTrigger value="sessions" className="text-xs gap-1.5">
              <History size={14} /> Past Scans
            </TabsTrigger>
          </TabsList>

          {/* New Scan */}
          <TabsContent value="scan" className="mt-4">
            <Card className="p-6 bg-card/50 border-border">
              {verifiedCount === 0 ? (
                <div className="text-center py-6">
                  <ShieldAlert size={40} className="text-yellow-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Authorize a Domain First</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    Before scanning, verify you own or have permission to test the target.
                    The file upload method takes about 2 minutes on Render.
                  </p>
                  <Button onClick={() => setActiveTab('authorize')} className="gap-2">
                    <ShieldCheck size={14} /> Go to Authorize Tab
                  </Button>
                </div>
              ) : (
                <ScanForm
                  authorizedTargets={authorizedTargets}
                  onScanStarted={() => setActiveTab('sessions')}
                />
              )}
            </Card>
          </TabsContent>

          {/* Authorize */}
          <TabsContent value="authorize" className="mt-4">
            <Card className="p-6 bg-card/50 border-border">
              <AuthorizationPanel onVerified={loadAuthorizedTargets} />
            </Card>
          </TabsContent>

          {/* Past Scans */}
          <TabsContent value="sessions" className="mt-4 space-y-4">
            <Card className="p-6 bg-card/50 border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                  <History size={18} className="text-primary" /> Deep Scan History
                </h3>
                <Button size="sm" onClick={loadSessions} disabled={loadingSessions} className="gap-2">
                  {loadingSessions
                    ? <Loader2 size={14} className="animate-spin" />
                    : <RefreshCw size={14} />
                  }
                  Refresh
                </Button>
              </div>

              {loadingSessions ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-muted/20 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-10">
                  <History size={28} className="text-muted-foreground/30 mx-auto mb-3" />
                  <h4 className="font-semibold text-foreground mb-1">No scans yet</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start your first deep scan from the New Scan tab.
                  </p>
                  <Button onClick={() => setActiveTab('scan')} variant="outline" size="sm" className="gap-2">
                    <Play size={14} /> Start a Scan
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => (
                    <Card
                      key={s.id}
                      className="p-4 bg-muted/10 border-border/30 hover:border-primary/30 transition-all cursor-pointer"
                      onClick={() => navigate(`/scans/${s.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {statusIcon(s.status)}
                            <span className="font-medium text-sm text-foreground">{s.target}</span>
                            {s.metadata?.authenticated && (
                              <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                                Authenticated
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatDate(s.start_time)}</span>
                            {s.metadata?.pages_crawled && (
                              <span>• {s.metadata.pages_crawled} pages crawled</span>
                            )}
                            {s.metadata?.vulnerabilities_found !== undefined && (
                              <span>• {s.metadata.vulnerabilities_found} findings</span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1 flex-shrink-0">
                          View <ExternalLink size={12} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
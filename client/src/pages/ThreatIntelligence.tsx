import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, Shield, Zap, Search, Activity, Layers, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useLocation } from 'wouter';
import { useToast } from '@/components/Toast';

interface ThreatStat {
  total_threats: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
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
  severity_breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  recent_threats: Array<{
    id: number;
    name: string;
    severity: string;
    discovered_at: string;
    target: string;
  }>;
}

function SkeletonCard() {
  return (
    <Card className="p-5 bg-card/50 border-border animate-pulse">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-4 w-24 bg-muted rounded mb-2" />
          <div className="h-8 w-14 bg-muted rounded" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-muted" />
      </div>
    </Card>
  );
}

const severityConfig: Record<string, { dot: string; badge: string; bg: string }> = {
  critical: { 
    dot: 'bg-red-500', 
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    bg: 'bg-red-500/5'
  },
  high: { 
    dot: 'bg-orange-500', 
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    bg: 'bg-orange-500/5'
  },
  medium: { 
    dot: 'bg-yellow-500', 
    badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    bg: 'bg-yellow-500/5'
  },
  low: { 
    dot: 'bg-blue-500', 
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    bg: 'bg-blue-500/5'
  },
  info: { 
    dot: 'bg-purple-500', 
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    bg: 'bg-purple-500/5'
  },
};

export default function ThreatIntelligence() {
  const { addToast } = useToast();
  const [threatStats, setThreatStats] = useState<ThreatStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, navigate] = useLocation();

  const fetchThreatData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      // Fetch threat intelligence data from your backend
      // You'll need to create this endpoint
      const data = await api.request<ThreatStat>('/threat-intelligence/stats/');
      setThreatStats(data);
    } catch (error) {
      console.error("Failed to fetch threat data:", error);
      addToast('error', 'Failed to load threat data', 'Could not retrieve threat intelligence');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchThreatData();
    const interval = setInterval(() => fetchThreatData(true), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Calculate stats from the data
  const criticalCount = threatStats?.severity_breakdown?.critical ?? 0;
  const highCount = threatStats?.severity_breakdown?.high ?? 0;
  const mediumCount = threatStats?.severity_breakdown?.medium ?? 0;
  const lowCount = threatStats?.severity_breakdown?.low ?? 0;
  const infoCount = threatStats?.severity_breakdown?.info ?? 0;
  
  const hasData = (threatStats?.total_threats ?? 0) > 0;

  const kpiCards = [
    { 
      label: 'Total Threats', 
      value: threatStats?.total_threats ?? 0, 
      icon: AlertTriangle, 
      iconBg: 'bg-red-500/15', 
      iconColor: 'text-red-400',
      detail: `${criticalCount} critical, ${highCount} high`
    },
    { 
      label: 'Critical / High', 
      value: criticalCount + highCount, 
      icon: TrendingUp, 
      iconBg: 'bg-orange-500/15', 
      iconColor: 'text-orange-400',
      detail: `${((criticalCount + highCount) / (threatStats?.total_threats || 1) * 100).toFixed(1)}% of total`
    },
    { 
      label: 'Assets Scanned', 
      value: threatStats?.assets_scanned ?? 0, 
      icon: Shield, 
      iconBg: 'bg-green-500/15', 
      iconColor: 'text-green-400',
      detail: 'Unique targets'
    },
    { 
      label: 'Unique Issues', 
      value: threatStats?.unique_issues ?? 0, 
      icon: Zap, 
      iconBg: 'bg-amber-500/15', 
      iconColor: 'text-amber-400',
      detail: 'Distinct vulnerability types'
    },
  ];

  // Prepare timeline data for chart
  const timelineData = threatStats?.timeline?.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  })) || [];

  return (
    <DashboardLayout currentPage="Threat Intelligence">
      <div className="space-y-6 max-w-6xl">
        {/* Header with refresh indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
              <Activity size={20} className="text-red-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Threat Intelligence</h2>
              <p className="text-sm text-muted-foreground">Real-time threat monitoring from your scan results</p>
            </div>
          </div>
          {refreshing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              <span>Refreshing...</span>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {loading ? (
            [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
          ) : (
            kpiCards.map(kpi => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label} className="p-4 bg-card/50 border-border card-glow hover:border-primary/20 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">{kpi.label}</p>
                      <p className="text-2xl font-bold text-foreground tabular-nums">{kpi.value}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{kpi.detail}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                      <Icon size={18} className={kpi.iconColor} />
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Severity Breakdown */}
        {!loading && hasData && (
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(severityConfig).map(([severity, config]) => {
              const count = threatStats?.severity_breakdown?.[severity as keyof typeof threatStats.severity_breakdown] ?? 0;
              return (
                <Card key={severity} className={`p-3 text-center border ${config.bg}`}>
                  <div className={`w-2 h-2 rounded-full ${config.dot} mx-auto mb-1`} />
                  <p className="text-lg font-bold tabular-nums text-foreground">{count}</p>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${config.badge.split(' ')[1]}`}>
                    {severity}
                  </p>
                </Card>
              );
            })}
          </div>
        )}

        {/* No data welcome */}
        {!loading && !hasData && (
          <Card className="p-10 bg-gradient-to-br from-red-500/5 via-card/50 to-orange-500/5 border-primary/10 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Activity size={32} className="text-red-400/60" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">No Threat Data Yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Run security scans to populate threat intelligence data with real findings.
              </p>
              <div className="flex gap-3 justify-center">
                <Button size="sm" onClick={() => navigate('/quick-scan')} className="gap-1.5">
                  <Zap size={14} /> Quick Scan
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/deep-scan')} className="gap-1.5">
                  <Search size={14} /> Deep Scan
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Findings Per Scan Chart */}
        <Card className="p-5 bg-card/50 backdrop-blur-sm border-border card-glow">
          <h3 className="font-display font-bold text-base text-foreground mb-4">Threat Activity Timeline</h3>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 20, 40, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    padding: '10px',
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '4px' }}
                  formatter={(value: number) => [value, 'Findings']}
                  labelFormatter={(label: string, payload: any[]) => {
                    const target = payload?.[0]?.payload?.target;
                    return target ? `${label} — ${target}` : label;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#threatGradient)" 
                  name="Findings"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[260px] text-center">
              <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mb-3">
                <Activity size={24} className="text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Run scans to see threat activity</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Data appears after your first completed scan</p>
            </div>
          )}
        </Card>

        {/* Active Threats */}
        <Card className="p-5 bg-card/50 backdrop-blur-sm border-border card-glow">
          <h3 className="font-display font-bold text-base text-foreground mb-4">Detected Vulnerability Types</h3>
          {(threatStats?.active_threats?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {threatStats!.active_threats.slice(0, 10).map((threat, idx) => {
                const cfg = severityConfig[threat.severity] || severityConfig.info;
                return (
                  <div key={idx} className="p-3 rounded-xl border border-border/30 hover:border-border/60 transition-colors bg-muted/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      <div>
                        <h4 className="font-medium text-sm text-foreground">{threat.name}</h4>
                        <p className="text-[11px] text-muted-foreground">
                          {threat.category} • {threat.count} occurrence{threat.count !== 1 ? 's' : ''}
                          {threat.cve_id && ` • ${threat.cve_id}`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${cfg.badge}`}>
                      {threat.severity}
                    </span>
                  </div>
                );
              })}
              {(threatStats!.active_threats.length > 10) && (
                <p className="text-xs text-center text-muted-foreground/60 mt-2">
                  +{threatStats!.active_threats.length - 10} more vulnerability types
                </p>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Shield size={28} className="mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No threats detected yet</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Run scans to see vulnerability analysis</p>
            </div>
          )}
        </Card>

        {/* Recent Threats */}
        {(threatStats?.recent_threats?.length ?? 0) > 0 && (
          <Card className="p-5 bg-card/50 backdrop-blur-sm border-border card-glow">
            <h3 className="font-display font-bold text-base text-foreground mb-4">Recent Discoveries</h3>
            <div className="space-y-2">
              {threatStats!.recent_threats.slice(0, 5).map((threat) => {
                const cfg = severityConfig[threat.severity] || severityConfig.info;
                return (
                  <div 
                    key={threat.id} 
                    className="p-3 rounded-xl border border-border/30 hover:border-border/60 transition-colors bg-muted/10 cursor-pointer"
                    onClick={() => navigate(`/scan/${threat.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-foreground">{threat.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${cfg.badge}`}>
                            {threat.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {threat.target} • {new Date(threat.discovered_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Category Breakdown */}
        {threatStats && Object.keys(threatStats.category_counts).length > 0 && (
          <Card className="p-5 bg-card/50 backdrop-blur-sm border-border card-glow">
            <div className="flex items-center gap-2 mb-4">
              <Layers size={16} className="text-primary" />
              <h3 className="font-display font-bold text-base text-foreground">Findings by Category</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(threatStats.category_counts)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div key={category} className="p-3 rounded-xl border border-border/30 bg-muted/10 flex items-center justify-between">
                    <span className="text-sm text-foreground font-medium">{category}</span>
                    <span className="text-primary font-bold text-base tabular-nums">{count}</span>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
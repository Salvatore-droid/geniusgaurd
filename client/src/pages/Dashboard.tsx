import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle, Clock, Zap, Search, Shield, ExternalLink, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter'; // Change this from useNavigate
import { api, type Stats, type ScanResult, type VulnerabilityTrend } from '@/lib/api';
import { useToast } from '@/components/Toast';

const riskColors = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#10b981',
  info: '#8b5cf6',
};

const defaultRiskDistribution = [
  { name: 'Critical', value: 0, color: riskColors.critical },
  { name: 'High', value: 0, color: riskColors.high },
  { name: 'Medium', value: 0, color: riskColors.medium },
  { name: 'Low', value: 0, color: riskColors.low },
  { name: 'Info', value: 0, color: riskColors.info },
];

function SkeletonCard() {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-28 bg-muted rounded mb-3" />
          <div className="h-8 w-16 bg-muted rounded mb-3" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-muted" />
      </div>
    </Card>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-4 py-3 px-4 animate-pulse">
          <div className="h-4 w-40 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-14 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [vulnerabilityTrends, setVulnerabilityTrends] = useState<VulnerabilityTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setLocation] = useLocation(); // Change this from useNavigate
  const { addToast } = useToast();

  const fetchDashboardData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const [statsData, scansData, trendsData] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentScans(),
        api.getVulnerabilityTrends(),
      ]);
      
      setStats(statsData);
      setRecentScans(scansData);
      setVulnerabilityTrends(trendsData);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      addToast(error.message || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(() => fetchDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate risk distribution from stats
  const riskDistribution = stats ? [
    { name: 'Critical', value: stats.critical_vulnerabilities, color: riskColors.critical },
    { name: 'High', value: stats.high_vulnerabilities, color: riskColors.high },
    { name: 'Medium', value: stats.medium_vulnerabilities, color: riskColors.medium },
    { name: 'Low', value: stats.low_vulnerabilities, color: riskColors.low },
    { name: 'Info', value: stats.info_vulnerabilities, color: riskColors.info },
  ] : defaultRiskDistribution;

  const hasChartData = vulnerabilityTrends.length > 0;
  const hasRiskData = riskDistribution.some(d => d.value > 0);
  const hasAnyData = stats && stats.total_scans > 0;

  const kpiCards = [
    {
      label: 'Critical Vulnerabilities',
      value: stats?.critical_vulnerabilities ?? 0,
      detail: stats?.critical_vulnerabilities && stats.critical_vulnerabilities > 0 ? 'Needs immediate attention' : 'No critical issues',
      icon: AlertTriangle,
      iconBg: 'bg-red-500/15',
      iconColor: 'text-red-500',
      detailColor: stats?.critical_vulnerabilities && stats.critical_vulnerabilities > 0 ? 'text-red-400' : 'text-green-400',
      detailIcon: stats?.critical_vulnerabilities && stats.critical_vulnerabilities > 0 ? ArrowUpRight : CheckCircle,
    },
    {
      label: 'Total Scans',
      value: stats?.total_scans ?? 0,
      detail: `${stats?.active_scans ?? 0} active, ${stats?.completed_scans ?? 0} completed`,
      icon: Search,
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-500',
      detailColor: 'text-blue-400',
      detailIcon: Clock,
    },
    {
      label: 'Secure Targets',
      value: stats?.secure_targets ?? 0,
      detail: `Out of ${stats?.scanned_targets ?? 0} total`,
      icon: Shield,
      iconBg: 'bg-green-500/15',
      iconColor: 'text-green-500',
      detailColor: 'text-green-400',
      detailIcon: CheckCircle,
    },
    {
      label: 'Total Findings',
      value: stats?.total_vulnerabilities ?? 0,
      detail: `${stats?.completed_scans ?? 0} scans completed`,
      icon: Zap,
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-500',
      detailColor: 'text-amber-400',
      detailIcon: Zap,
    },
  ];

  const statusConfig: Record<string, { dot: string; text: string; label: string }> = {
    completed: { dot: 'bg-green-500', text: 'text-green-400', label: 'Completed' },
    running: { dot: 'bg-blue-500 animate-pulse', text: 'text-blue-400', label: 'Running' },
    pending: { dot: 'bg-yellow-500', text: 'text-yellow-400', label: 'Pending' },
    failed: { dot: 'bg-red-500', text: 'text-red-400', label: 'Failed' },
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNavigate = (path: string) => {
    setLocation(path);
  };

  return (
    <DashboardLayout currentPage="Dashboard">
      {/* Header with refresh indicator */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        {refreshing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            <span>Refreshing...</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {loading ? (
          [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
        ) : (
          kpiCards.map(kpi => {
            const Icon = kpi.icon;
            const DetailIcon = kpi.detailIcon;
            return (
              <Card key={kpi.label} className="p-5 bg-card/50 backdrop-blur-sm border-border card-glow hover:border-primary/30 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs lg:text-sm text-muted-foreground mb-1.5 truncate">{kpi.label}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-foreground tabular-nums">{kpi.value}</p>
                    <div className={`flex items-center gap-1 mt-2 text-xs ${kpi.detailColor}`}>
                      <DetailIcon size={12} />
                      <span className="truncate">{kpi.detail}</span>
                    </div>
                  </div>
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${kpi.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={kpi.iconColor} />
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Welcome / Quick actions when no data */}
      {!loading && !hasAnyData && (
        <Card className="p-8 mb-8 bg-gradient-to-br from-primary/5 via-card/50 to-accent/5 border-primary/20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">Welcome to GeniusGuard</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Start by scanning a website to discover security vulnerabilities, misconfigurations, and potential threats.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => handleNavigate('/quick-scan')} className="gap-2">
                <Zap size={16} /> Quick Scan
              </Button>
              <Button variant="outline" onClick={() => handleNavigate('/deep-scan')} className="gap-2">
                <Search size={16} /> Deep Scan
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Vulnerability Trend */}
        <Card className="lg:col-span-2 p-5 lg:p-6 bg-card/50 backdrop-blur-sm border-border card-glow">
          <h3 className="font-display font-bold text-base lg:text-lg text-foreground mb-4 lg:mb-6">Vulnerability Trend (Last 6 Months)</h3>
          {loading ? (
            <div className="h-[280px] flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-muted-foreground/30" />
            </div>
          ) : hasChartData ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={vulnerabilityTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 20, 40, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    padding: '12px',
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '4px' }}
                />
                <Bar dataKey="critical" stackId="a" fill={riskColors.critical} radius={[4, 4, 0, 0]} />
                <Bar dataKey="high" stackId="a" fill={riskColors.high} />
                <Bar dataKey="medium" stackId="a" fill={riskColors.medium} />
                <Bar dataKey="low" stackId="a" fill={riskColors.low} />
                <Bar dataKey="info" stackId="a" fill={riskColors.info} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[280px] text-center">
              <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mb-3">
                <BarChart size={24} className="text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Run scans to see vulnerability trends</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Data will appear here after your first scan</p>
            </div>
          )}
        </Card>

        {/* Risk Distribution */}
        <Card className="p-5 lg:p-6 bg-card/50 backdrop-blur-sm border-border card-glow">
          <h3 className="font-display font-bold text-base lg:text-lg text-foreground mb-4 lg:mb-6">Risk Distribution</h3>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-muted-foreground/30" />
            </div>
          ) : hasRiskData ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 20, 40, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center mb-2">
                <Shield size={20} className="text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground">No risk data yet</p>
            </div>
          )}
          <div className="mt-3 space-y-1.5">
            {riskDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm py-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground text-xs">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground text-sm tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Scans */}
      <Card className="p-5 lg:p-6 bg-card/50 backdrop-blur-sm border-border card-glow">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-base lg:text-lg text-foreground">Recent Scans</h3>
          <Button variant="outline" size="sm" onClick={() => handleNavigate('/scans')} className="gap-1.5 text-xs">
            View All <ExternalLink size={12} />
          </Button>
        </div>
        <div className="overflow-x-auto -mx-5 lg:-mx-6 px-5 lg:px-6">
          {loading ? (
            <SkeletonTable />
          ) : recentScans.length === 0 ? (
            <div className="py-12 text-center">
              <Search size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No scans yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Start a scan to see results here</p>
              <Button size="sm" variant="outline" onClick={() => handleNavigate('/quick-scan')} className="gap-1.5">
                <Zap size={14} /> Start Quick Scan
              </Button>
            </div>
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Findings</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan) => {
                  const status = statusConfig[scan.status] || statusConfig.pending;
                  return (
                    <tr
                      key={scan.id}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer group"
                      onClick={() => handleNavigate(`/scan/${scan.id}`)}
                    >
                      <td className="py-3 px-3 text-sm text-foreground font-medium group-hover:text-primary transition-colors">
                        <span className="truncate max-w-[200px] inline-block">{scan.target}</span>
                      </td>
                      <td className="py-3 px-3 text-sm">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                          scan.type === 'deep'
                            ? 'bg-purple-500/15 text-purple-400'
                            : 'bg-blue-500/15 text-blue-400'
                        }`}>
                          {scan.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${status.dot}`} />
                          <span className={`${status.text} text-xs font-medium`}>
                            {status.label}
                            {scan.status === 'running' && ` (${scan.progress}%)`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm">
                        {scan.vulnerabilities && scan.vulnerabilities.length > 0 ? (
                          <span className="text-red-400 font-semibold text-xs">
                            {scan.vulnerabilities.length} found
                          </span>
                        ) : scan.status === 'completed' ? (
                          <span className="text-green-400 text-xs">None</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground">
                        {formatTime(scan.start_time)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}
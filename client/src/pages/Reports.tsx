import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, BarChart3, Shield, Clock, AlertTriangle, CheckCircle, FileText, Zap, Search, Loader2, FileDown } from 'lucide-react';
import { api, type ScanResult, type ReportStats } from '@/lib/api';
import { useToast } from '@/components/Toast';

// ==================== Types ====================

interface ExportData {
  exported_at: string;
  stats: ReportStats;
  scans: Array<{
    id: number;
    target: string;
    type: string;
    status: string;
    start_time: string;
    end_time: string | null;
    vulnerabilities: Array<{
      name: string;
      severity: string;
      cvss_score: number;
      cve_id?: string;
      description?: string;
      remediation?: string;
    }>;
  }>;
}

// ==================== Components ====================

function SkeletonCard() {
  return (
    <Card className="p-4 bg-card/50 border-border animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-20 bg-muted rounded mb-2" />
          <div className="h-7 w-14 bg-muted rounded mb-1" />
          <div className="h-3 w-28 bg-muted rounded" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-muted" />
      </div>
    </Card>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-4 py-3 px-4 animate-pulse">
          <div className="h-4 w-36 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-14 bg-muted rounded" />
          <div className="h-4 w-10 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

// ==================== Main Component ====================

export default function Reports() {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'json' | 'csv' | 'pdf' | null>(null);
  const [, navigate] = useLocation();
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [scansData, statsData] = await Promise.all([
        api.getScans(),
        api.getReportStats().catch(() => null)
      ]);
      
      setScans(scansData);
      
      if (statsData) {
        setReportStats(statsData);
      } else {
        // Local calculation as fallback
        const completedScans = scansData.filter(s => s.status === 'completed');
        const totalVulns = completedScans.reduce((sum, s) => sum + (s.vulnerabilities?.length || 0), 0);
        
        let totalDuration = 0;
        let durationCount = 0;
        completedScans.forEach(scan => {
          if (scan.end_time && scan.start_time) {
            const duration = (new Date(scan.end_time).getTime() - new Date(scan.start_time).getTime()) / 1000;
            totalDuration += duration;
            durationCount++;
          }
        });
        
        const criticalCount = completedScans.reduce((sum, s) => 
          sum + (s.vulnerabilities?.filter(v => v.severity === 'critical').length || 0), 0);
        const highCount = completedScans.reduce((sum, s) => 
          sum + (s.vulnerabilities?.filter(v => v.severity === 'high').length || 0), 0);
        
        let securityScore = 100;
        securityScore -= criticalCount * 10;
        securityScore -= highCount * 5;
        securityScore = Math.max(0, Math.min(100, securityScore));
        
        const trendData = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayVulns = completedScans.flatMap(s => s.vulnerabilities || [])
            .filter(v => v.discovered_at?.startsWith(dateStr));
          
          trendData.push({
            date: dateStr.slice(5),
            resolved: 0,
            pending: dayVulns.length
          });
        }
        
        setReportStats({
          total_scans: scansData.length,
          quick_scans: scansData.filter(s => s.type === 'quick').length,
          deep_scans: scansData.filter(s => s.type === 'deep').length,
          total_vulnerabilities: totalVulns,
          avg_duration_seconds: durationCount > 0 ? totalDuration / durationCount : 0,
          security_score: securityScore,
          trend_data: trendData,
          severity_breakdown: {
            critical: criticalCount,
            high: highCount,
            medium: completedScans.reduce((sum, s) => sum + (s.vulnerabilities?.filter(v => v.severity === 'medium').length || 0), 0),
            low: completedScans.reduce((sum, s) => sum + (s.vulnerabilities?.filter(v => v.severity === 'low').length || 0), 0),
            info: completedScans.reduce((sum, s) => sum + (s.vulnerabilities?.filter(v => v.severity === 'info').length || 0), 0),
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      addToast('error', 'Failed to load reports', 'Could not retrieve report data');
    } finally {
      setLoading(false);
    }
  };

  const completedScans = scans.filter(s => s.status === 'completed');

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 0) return '0s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    if (completedScans.length === 0) {
      addToast('error', 'No Data', 'No completed scans to export');
      return;
    }

    setExporting(format);
    
    try {
      if (format === 'pdf') {
        // Use backend PDF generation
        await handlePDFExport();
      } else {
        // Client-side JSON/CSV export
        await handleClientExport(format);
      }
    } catch (error) {
      console.error('Export failed:', error);
      addToast('error', 'Export Failed', 'Could not generate report');
    } finally {
      setExporting(null);
    }
  };

  const handleClientExport = async (format: 'json' | 'csv') => {
    let blob: Blob;
    let filename: string;
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      const exportData: ExportData = {
        exported_at: new Date().toISOString(),
        stats: reportStats || {
          total_scans: scans.length,
          quick_scans: scans.filter(s => s.type === 'quick').length,
          deep_scans: scans.filter(s => s.type === 'deep').length,
          total_vulnerabilities: completedScans.reduce((sum, s) => sum + (s.vulnerabilities?.length || 0), 0),
          avg_duration_seconds: 0,
          security_score: 100,
          trend_data: [],
          severity_breakdown: {
            critical: 0, high: 0, medium: 0, low: 0, info: 0
          }
        },
        scans: completedScans.map(scan => ({
          id: scan.id,
          target: scan.target,
          type: scan.type,
          status: scan.status,
          start_time: scan.start_time,
          end_time: scan.end_time,
          vulnerabilities: (scan.vulnerabilities || []).map(v => ({
            name: v.name,
            severity: v.severity,
            cvss_score: v.cvss_score,
            cve_id: v.cve_id,
            description: v.description,
            remediation: v.remediation
          }))
        })),
      };
      blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      filename = `geniusguard-report-${dateStr}.json`;
    } else {
      const headers = ['ID', 'Target', 'Type', 'Status', 'Start Time', 'End Time', 'Total Vulns', 'Critical', 'High', 'Medium', 'Low', 'Info'];
      const rows = completedScans.map(scan => [
        scan.id,
        scan.target,
        scan.type,
        scan.status,
        new Date(scan.start_time).toLocaleString(),
        scan.end_time ? new Date(scan.end_time).toLocaleString() : '',
        scan.vulnerabilities?.length || 0,
        scan.vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
        scan.vulnerabilities?.filter(v => v.severity === 'high').length || 0,
        scan.vulnerabilities?.filter(v => v.severity === 'medium').length || 0,
        scan.vulnerabilities?.filter(v => v.severity === 'low').length || 0,
        scan.vulnerabilities?.filter(v => v.severity === 'info').length || 0,
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      blob = new Blob([csvContent], { type: 'text/csv' });
      filename = `geniusguard-report-${dateStr}.csv`;
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addToast('success', 'Export Complete', `Report saved as ${format.toUpperCase()}`);
  };

  const handlePDFExport = async () => {
    try {
      // Create a comprehensive report object
      const reportData = {
        title: `Security Scan Report - ${new Date().toLocaleDateString()}`,
        generated_at: new Date().toISOString(),
        summary: {
          total_scans: reportStats?.total_scans || scans.length,
          completed_scans: completedScans.length,
          total_vulnerabilities: reportStats?.total_vulnerabilities || completedScans.reduce((sum, s) => sum + (s.vulnerabilities?.length || 0), 0),
          security_score: reportStats?.security_score || 100,
          avg_duration: formatDuration(reportStats?.avg_duration_seconds || 0)
        },
        severity_breakdown: reportStats?.severity_breakdown || {
          critical: completedScans.reduce((sum, s) => sum + (s.vulnerabilities?.filter(v => v.severity === 'critical').length || 0), 0),
          high: completedScans.reduce((sum, s) => sum + (s.vulnerabilities?.filter(v => v.severity === 'high').length || 0), 0),
          medium: completedScans.reduce((sum, s) => sum + (s.vulnerabilities?.filter(v => v.severity === 'medium').length || 0), 0),
          low: completedScans.reduce((sum, s) => sum + (s.vulnerabilities?.filter(v => v.severity === 'low').length || 0), 0),
          info: completedScans.reduce((sum, s) => sum + (s.vulnerabilities?.filter(v => v.severity === 'info').length || 0), 0)
        },
        scans: completedScans.map(scan => ({
          id: scan.id,
          target: scan.target,
          type: scan.type,
          date: new Date(scan.start_time).toLocaleDateString(),
          duration: scan.end_time ? formatDuration((new Date(scan.end_time).getTime() - new Date(scan.start_time).getTime()) / 1000) : 'N/A',
          vulnerabilities: (scan.vulnerabilities || []).map(v => ({
            name: v.name,
            severity: v.severity,
            cvss: v.cvss_score,
            cve: v.cve_id,
            description: v.description,
            remediation: v.remediation
          }))
        }))
      };

      // Send to backend for PDF generation
      const response = await api.generatePDFReport(reportData);
      
      // Download the PDF
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `geniusguard-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      addToast('success', 'PDF Export Complete', 'Professional PDF report generated');
    } catch (error) {
      console.error('PDF export failed:', error);
      throw error;
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const kpiCards = [
    {
      label: 'Total Scans',
      value: reportStats?.total_scans ?? scans.length,
      sub: `${reportStats?.quick_scans ?? scans.filter(s => s.type === 'quick').length} quick, ${reportStats?.deep_scans ?? scans.filter(s => s.type === 'deep').length} deep`,
      icon: BarChart3,
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Vulnerabilities',
      value: reportStats?.total_vulnerabilities ?? completedScans.reduce((sum, s) => sum + (s.vulnerabilities?.length || 0), 0),
      sub: 'Across all scans',
      icon: AlertTriangle,
      iconBg: 'bg-red-500/15',
      iconColor: 'text-red-400',
    },
    {
      label: 'Avg Duration',
      value: formatDuration(reportStats?.avg_duration_seconds ?? 0),
      sub: 'Per completed scan',
      icon: Clock,
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
      noTabular: true,
    },
    {
      label: 'Security Score',
      value: reportStats?.security_score ?? 100,
      sub: 'Based on findings',
      icon: Shield,
      iconBg: 'bg-green-500/15',
      iconColor: 'text-green-400',
      valueColor: scoreColor(reportStats?.security_score ?? 100),
      suffix: '/100',
    },
  ];

  const trendData = reportStats?.trend_data || [];

  return (
    <DashboardLayout currentPage="Reports">
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <BarChart3 size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Reports & Analytics</h2>
              <p className="text-sm text-muted-foreground">Security reports based on your real scan data</p>
            </div>
          </div>
          {completedScans.length > 0 && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 text-xs h-9" 
                onClick={() => handleExport('json')}
                disabled={exporting !== null}
              >
                {exporting === 'json' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                JSON
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 text-xs h-9" 
                onClick={() => handleExport('csv')}
                disabled={exporting !== null}
              >
                {exporting === 'csv' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                CSV
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90" 
                onClick={() => handleExport('pdf')}
                disabled={exporting !== null}
              >
                {exporting === 'pdf' ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                PDF Report
              </Button>
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
                      <p className={`text-2xl font-bold ${kpi.valueColor || 'text-foreground'} ${kpi.noTabular ? '' : 'tabular-nums'}`}>
                        {kpi.value}{kpi.suffix && <span className="text-sm font-medium text-muted-foreground ml-1">{kpi.suffix}</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{kpi.sub}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className={kpi.iconColor} />
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Severity Breakdown */}
        {!loading && reportStats && Object.values(reportStats.severity_breakdown).some(v => v > 0) && (
          <Card className="p-5 bg-card/50 backdrop-blur-sm border-border card-glow">
            <h3 className="font-display font-bold text-base text-foreground mb-4">Severity Breakdown</h3>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(reportStats.severity_breakdown).map(([severity, count]) => {
                const colors = {
                  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
                  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                  info: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                };
                return (
                  <Card key={severity} className={`p-3 text-center border ${colors[severity as keyof typeof colors]}`}>
                    <p className="text-lg font-bold text-foreground">{count}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider">{severity}</p>
                  </Card>
                );
              })}
            </div>
          </Card>
        )}

        {/* No data state */}
        {!loading && completedScans.length === 0 && (
          <Card className="p-10 bg-gradient-to-br from-blue-500/5 via-card/50 to-primary/5 border-primary/10 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-blue-400/60" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">No Reports Yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Complete security scans to generate reports and analytics.
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

        {/* Vulnerability Trend Chart */}
        {completedScans.length > 0 && (
          <Card className="p-5 bg-card/50 backdrop-blur-sm border-border card-glow">
            <h3 className="font-display font-bold text-base text-foreground mb-4">Vulnerability Trend</h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 20, 40, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    }}
                  />
                  <Bar dataKey="resolved" stackId="a" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-center">
                <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mb-3">
                  <BarChart3 size={24} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">Insufficient data for trend analysis</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Run more scans to see trends</p>
              </div>
            )}
          </Card>
        )}

        {/* Scan Reports Table */}
        <Card className="p-5 bg-card/50 backdrop-blur-sm border-border card-glow">
          <h3 className="font-display font-bold text-base text-foreground mb-4">Scan Reports</h3>
          <div className="overflow-x-auto -mx-5 px-5 lg:px-6">
            {loading ? (
              <SkeletonTable />
            ) : completedScans.length === 0 ? (
              <div className="py-10 text-center">
                <FileText size={28} className="mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No completed scans yet</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Run a scan to see reports here</p>
              </div>
            ) : (
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Findings</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {completedScans.map(scan => {
                    const criticalCount = scan.vulnerabilities?.filter(v => v.severity === 'critical').length || 0;
                    const highCount = scan.vulnerabilities?.filter(v => v.severity === 'high').length || 0;
                    
                    return (
                      <tr
                        key={scan.id}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/scan/${scan.id}`)}
                      >
                        <td className="py-3 px-3 text-sm text-foreground font-medium group-hover:text-primary transition-colors">
                          <span className="truncate max-w-[200px] inline-block" title={scan.target}>
                            {scan.target}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs text-muted-foreground">
                          {new Date(scan.start_time).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td className="py-3 px-3 text-sm">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            scan.type === 'deep' 
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {scan.type}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {scan.vulnerabilities && scan.vulnerabilities.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-400 font-semibold">
                                {scan.vulnerabilities.length} total
                              </span>
                              {criticalCount > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded-full">
                                  {criticalCount} critical
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-green-400">None</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle size={12} className="text-green-400" />
                            <span className="text-xs text-green-400 font-medium">Completed</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/scan/${scan.id}`);
                            }}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Export Section */}
        {completedScans.length > 0 && (
          <Card className="p-5 bg-card/50 backdrop-blur-sm border-border card-glow">
            <h3 className="font-display font-bold text-base text-foreground mb-3">Export Options</h3>
            <div className="grid sm:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                className="h-11 gap-2 text-sm" 
                onClick={() => handleExport('json')}
                disabled={exporting !== null}
              >
                {exporting === 'json' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                JSON
              </Button>
              <Button 
                variant="outline" 
                className="h-11 gap-2 text-sm" 
                onClick={() => handleExport('csv')}
                disabled={exporting !== null}
              >
                {exporting === 'csv' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                CSV
              </Button>
              <Button 
                variant="default" 
                className="h-11 gap-2 text-sm col-span-2 bg-primary hover:bg-primary/90" 
                onClick={() => handleExport('pdf')}
                disabled={exporting !== null}
              >
                {exporting === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                Generate Professional PDF Report
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3">
              PDF reports include executive summary, severity breakdown, detailed findings, and remediation recommendations.
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Trash2, Download, Clock, Search, Zap, AlertTriangle, ShieldCheck, XCircle, Loader2 } from 'lucide-react';
import { api, type ScanResult } from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function Scans() {
  const [, navigate] = useLocation();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'quick' | 'deep'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScans = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const data = await api.getScans();
      setScans(data);
    } catch (error) {
      console.error("Failed to fetch scans", error);
      addToast('error', 'Failed to load scans', 'Could not retrieve scan history');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScans();
    const interval = setInterval(() => fetchScans(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (scanId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId === scanId) {
      // Second click = confirm delete
      try {
        await api.deleteScan(scanId);
        setScans(prev => prev.filter(s => s.id !== scanId));
        addToast('success', 'Scan Deleted', 'The scan has been removed successfully');
      } catch (error) {
        console.error('Delete failed:', error);
        addToast('error', 'Delete Failed', 'Could not delete this scan');
      }
      setDeletingId(null);
    } else {
      // First click = arm for deletion
      setDeletingId(scanId);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleViewScan = (scanId: number) => {
    navigate(`/scan/${scanId}`);
  };

  const handleViewReport = (scanId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/scan/${scanId}`);
  };

  const getFilteredScans = () => {
    let filtered = scans;
    if (activeTab !== 'all') {
      filtered = scans.filter(s => s.type === activeTab);
    }
    return filtered.sort((a, b) => {
      if (sortBy === 'name') return a.target.localeCompare(b.target);
      return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
    });
  };

  const getFindingsCount = (scan: ScanResult) => ({
    critical: scan.vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
    high: scan.vulnerabilities?.filter(v => v.severity === 'high').length || 0,
    medium: scan.vulnerabilities?.filter(v => v.severity === 'medium').length || 0,
    low: scan.vulnerabilities?.filter(v => v.severity === 'low').length || 0,
    info: scan.vulnerabilities?.filter(v => v.severity === 'info').length || 0,
    total: scan.vulnerabilities?.length || 0,
  });

  const getDuration = (scan: ScanResult) => {
    if (!scan.end_time) return 'In progress...';
    const seconds = Math.floor((new Date(scan.end_time).getTime() - new Date(scan.start_time).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const statusConfig: Record<string, { classes: string; label: string; icon: typeof ShieldCheck }> = {
    completed: { classes: 'bg-green-500/15 text-green-400 border-green-500/20', label: 'Completed', icon: ShieldCheck },
    running: { classes: 'bg-blue-500/15 text-blue-400 border-blue-500/20 animate-pulse', label: 'Running', icon: Clock },
    pending: { classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20', label: 'Pending', icon: Clock },
    failed: { classes: 'bg-red-500/15 text-red-400 border-red-500/20', label: 'Failed', icon: XCircle },
  };

  const ScanCard = ({ scan }: { scan: ScanResult }) => {
    const findings = getFindingsCount(scan);
    const sc = statusConfig[scan.status] || statusConfig.pending;
    const StatusIcon = sc.icon;
    const isConfirmingDelete = deletingId === scan.id;
    
    const aiConfidence = scan.metadata?.ai_confidence || 
                        (scan.vulnerabilities?.[0]?.metadata?.ai_confidence);

    return (
      <Card
        className="p-5 bg-card/50 backdrop-blur-sm border-border card-glow hover:border-primary/30 transition-all duration-300 cursor-pointer group"
        onClick={() => handleViewScan(scan.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="font-semibold text-foreground truncate max-w-[220px] group-hover:text-primary transition-colors" title={scan.target}>
                {scan.target}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                scan.type === 'deep' 
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                {scan.type}
              </span>
              {scan.metadata?.ai_enhanced && (
                <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20 flex items-center gap-1">
                  <Zap size={10} /> AI
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${sc.classes}`}>
                <StatusIcon size={11} />
                {sc.label}
                {scan.status === 'running' && ` ${scan.progress}%`}
              </span>
              {aiConfidence && (
                <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">
                  AI: {Math.round(aiConfidence * 100)}% confident
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {new Date(scan.start_time).toLocaleString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })} • {getDuration(scan)}
            </p>
          </div>
          <div className="flex gap-1 ml-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              title="View details" 
              onClick={() => handleViewScan(scan.id)}
            >
              <Eye size={15} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 transition-colors ${
                isConfirmingDelete ? 'text-destructive bg-destructive/10 animate-pulse' : 'hover:text-destructive'
              }`}
              title={isConfirmingDelete ? 'Click again to confirm' : 'Delete scan'}
              onClick={(e) => handleDelete(scan.id, e)}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </div>

        {/* Severity breakdown */}
        {findings.total > 0 ? (
          <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/20 border border-border/30">
            {findings.critical > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-400 font-semibold">{findings.critical}</span>
                <span className="text-muted-foreground">Critical</span>
              </div>
            )}
            {findings.high > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-orange-400 font-semibold">{findings.high}</span>
                <span className="text-muted-foreground">High</span>
              </div>
            )}
            {findings.medium > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-yellow-400 font-semibold">{findings.medium}</span>
                <span className="text-muted-foreground">Med</span>
              </div>
            )}
            {findings.low > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-blue-400 font-semibold">{findings.low}</span>
                <span className="text-muted-foreground">Low</span>
              </div>
            )}
            {findings.info > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-purple-400 font-semibold">{findings.info}</span>
                <span className="text-muted-foreground">Info</span>
              </div>
            )}
          </div>
        ) : scan.status === 'completed' ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
            <ShieldCheck size={14} className="text-green-400" />
            <span className="text-xs text-green-400 font-medium">No vulnerabilities found</span>
          </div>
        ) : scan.status === 'failed' ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
            <XCircle size={14} className="text-red-400" />
            <span className="text-xs text-red-400 font-medium">
              {scan.error_message || 'Scan failed'}
            </span>
          </div>
        ) : null}

        {/* View Report CTA */}
        {scan.status === 'completed' && (
          <Button 
            className="w-full mt-3 gap-2 text-xs h-9" 
            variant="outline" 
            onClick={(e) => handleViewReport(scan.id, e)}
          >
            <Download size={14} /> View Full Report
          </Button>
        )}
        
        {/* Running progress */}
        {scan.status === 'running' && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Scanning...</span>
              <span>{scan.progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div 
                className="h-full rounded-full bg-primary progress-active transition-all duration-500" 
                style={{ width: `${scan.progress}%` }} 
              />
            </div>
          </div>
        )}

        {/* Pending state */}
        {scan.status === 'pending' && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin" />
            <span>Waiting to start...</span>
          </div>
        )}
      </Card>
    );
  };

  const filteredScans = getFilteredScans();
  const quickCount = scans.filter(s => s.type === 'quick').length;
  const deepCount = scans.filter(s => s.type === 'deep').length;
  const criticalCount = scans.reduce(
    (sum, s) => sum + (s.vulnerabilities?.filter(v => v.severity === 'critical').length || 0), 
    0
  );
  const aiEnhancedCount = scans.filter(s => s.metadata?.ai_enhanced).length;

  return (
    <DashboardLayout currentPage="Scans">
      <div className="max-w-6xl">
        {/* Header with refresh indicator */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-1">Scan History</h2>
            <p className="text-sm text-muted-foreground">View and manage all your security scans in one place.</p>
          </div>
          {refreshing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              <span>Refreshing...</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-9">
                <TabsTrigger value="all" className="text-xs gap-1.5">
                  All <span className="opacity-60">({scans.length})</span>
                </TabsTrigger>
                <TabsTrigger value="quick" className="text-xs gap-1.5">
                  Quick <span className="opacity-60">({quickCount})</span>
                </TabsTrigger>
                <TabsTrigger value="deep" className="text-xs gap-1.5">
                  Deep <span className="opacity-60">({deepCount})</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs h-9"
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <Card className="p-4 bg-card/50 border-border">
            <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">Total</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{scans.length}</p>
          </Card>
          <Card className="p-4 bg-card/50 border-border">
            <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">Quick</p>
            <p className="text-2xl font-bold text-blue-400 tabular-nums">{quickCount}</p>
          </Card>
          <Card className="p-4 bg-card/50 border-border">
            <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">Deep</p>
            <p className="text-2xl font-bold text-purple-400 tabular-nums">{deepCount}</p>
          </Card>
          <Card className="p-4 bg-card/50 border-border">
            <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">Critical</p>
            <p className={`text-2xl font-bold tabular-nums ${criticalCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {criticalCount}
            </p>
          </Card>
          <Card className="p-4 bg-card/50 border-border">
            <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">AI Enhanced</p>
            <p className="text-2xl font-bold text-primary tabular-nums">{aiEnhancedCount}</p>
          </Card>
        </div>

        {/* Scans Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-5 bg-card/50 border-border animate-pulse">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="h-5 w-40 bg-muted rounded" />
                    <div className="h-5 w-16 bg-muted rounded" />
                  </div>
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                  <div className="h-12 w-full bg-muted rounded-lg" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredScans.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredScans.map(scan => (
              <ScanCard key={scan.id} scan={scan} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-muted-foreground/40" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No scans found</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Start by running a Quick Scan or Deep Scan to discover security vulnerabilities.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/quick-scan')} className="gap-1.5">
                <Zap size={14} /> Quick Scan
              </Button>
              <Button onClick={() => navigate('/deep-scan')} className="gap-1.5">
                <Search size={14} /> Deep Scan
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
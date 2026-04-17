import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowLeft, Download, Shield, AlertTriangle, CheckCircle, XCircle,
  Clock, ExternalLink, Copy, Check, ChevronDown, ChevronUp,
  FileText, Calendar, Target, Loader2, Brain, Globe, Network, Eye, EyeOff
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';

interface Vulnerability {
  id: number;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss_score: number;
  cve_id: string;
  cwe_id: string;
  remediation: string;
  evidence: string;
  url: string;
  discovered_at: string;
  metadata?: {
    ai_confidence?: number;
    ai_reviewed?: boolean;
  };
}

interface Scan {
  id: number;
  target: string;
  type: 'quick' | 'deep';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  start_time: string;
  end_time: string | null;
  metadata: {
    ai_enhanced?: boolean;
    authenticated?: boolean;
    pages_crawled?: number;
    requests_made?: number;
    vulnerabilities_found?: number;
    [key: string]: any;
  };
  vulnerabilities: Vulnerability[];
}

const severityConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Critical' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', label: 'High' },
  medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Medium' },
  low: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Low' },
  info: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'Info' },
};

export default function ScanDetail() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const scanId = parseInt(params.id);
  const { addToast } = useToast();
  
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFinding, setExpandedFinding] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchScanDetails = async () => {
    try {
      const data = await api.get(`/scans/${scanId}/`);
      setScan(data);
    } catch (error) {
      addToast('error', 'Failed to load scan', 'Could not retrieve scan details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNaN(scanId)) {
      fetchScanDetails();
      
      const interval = setInterval(() => {
        if (scan?.status === 'running') {
          fetchScanDetails();
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [scanId, scan?.status]);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast('success', 'Copied!', 'Content copied to clipboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = () => {
    switch (scan?.status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-400', label: 'Completed' };
      case 'running':
        return { icon: Loader2, color: 'text-blue-400', label: 'Running', animate: true };
      case 'failed':
        return { icon: XCircle, color: 'text-red-400', label: 'Failed' };
      default:
        return { icon: Clock, color: 'text-yellow-400', label: 'Pending' };
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="Scan Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!scan) {
    return (
      <DashboardLayout currentPage="Scan Details">
        <Card className="p-8 text-center">
          <XCircle size={40} className="text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-1">Scan Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">The requested scan could not be found.</p>
          <Button onClick={() => navigate('/scans')} variant="outline" size="sm">Back to Scans</Button>
        </Card>
      </DashboardLayout>
    );
  }

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const severityCounts = {
    critical: scan.vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
    high: scan.vulnerabilities?.filter(v => v.severity === 'high').length || 0,
    medium: scan.vulnerabilities?.filter(v => v.severity === 'medium').length || 0,
    low: scan.vulnerabilities?.filter(v => v.severity === 'low').length || 0,
    info: scan.vulnerabilities?.filter(v => v.severity === 'info').length || 0,
  };
  const totalVulns = scan.vulnerabilities?.length || 0;

  return (
    <DashboardLayout currentPage="Scan Details">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/scans')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} /> Back to Scans
          </Button>
          {scan.status === 'completed' && (
            <Button variant="outline" size="sm" className="gap-2">
              <Download size={14} /> Export Report
            </Button>
          )}
        </div>

        {/* Scan Info Card */}
        <Card className="p-5 bg-card/50 border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="text-lg font-semibold text-foreground">{scan.target}</h1>
                <div className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${
                  scan.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  scan.status === 'running' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  scan.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}>
                  <StatusIcon size={10} className={statusConfig.animate ? 'animate-spin' : ''} />
                  <span>{statusConfig.label}</span>
                </div>
                {scan.metadata?.authenticated && (
                  <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                    Authenticated
                  </span>
                )}
                {scan.metadata?.ai_enhanced && (
                  <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20">
                    AI Enhanced
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {formatDate(scan.start_time)}
                </span>
                <span>•</span>
                <span className="capitalize">{scan.type} Scan</span>
                {scan.metadata?.pages_crawled && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Globe size={11} /> {scan.metadata.pages_crawled} pages</span>
                  </>
                )}
              </div>
            </div>
            {scan.status === 'running' && (
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">{scan.progress}%</div>
                <div className="w-24 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${scan.progress}%` }} />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Stats Row - Clean & Minimal */}
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(severityCounts).map(([severity, count]) => {
            const cfg = severityConfig[severity];
            return (
              <Card key={severity} className={`p-3 text-center bg-card/30 border-border/50 hover:border-${severity}-500/30 transition-all`}>
                <p className={`text-xl font-bold ${cfg.text}`}>{count}</p>
                <p className={`text-[10px] font-medium uppercase tracking-wider ${cfg.text}`}>{severity}</p>
              </Card>
            );
          })}
        </div>

        {/* Findings Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle size={14} className="text-yellow-400" />
              Findings ({totalVulns})
            </h2>
          </div>

          {totalVulns === 0 ? (
            <Card className="p-8 text-center bg-card/30 border-dashed">
              <Shield size={32} className="text-green-400/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No vulnerabilities found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">This scan didn't detect any security issues.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {scan.vulnerabilities.map((vuln) => {
                const cfg = severityConfig[vuln.severity];
                const isExpanded = expandedFinding === vuln.id;
                const isCopied = copiedId === vuln.id;

                return (
                  <Card key={vuln.id} className="bg-card/30 border-border/30 overflow-hidden">
                    <div 
                      className="p-4 cursor-pointer hover:bg-muted/5 transition-colors"
                      onClick={() => setExpandedFinding(isExpanded ? null : vuln.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                          <AlertTriangle size={14} className={cfg.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-medium text-foreground">{vuln.name}</h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                                  {cfg.label}
                                </span>
                                {vuln.cvss_score > 0 && (
                                  <span className="text-[9px] text-muted-foreground">CVSS: {vuln.cvss_score}</span>
                                )}
                                {vuln.cve_id && (
                                  <span className="text-[9px] text-blue-400">{vuln.cve_id}</span>
                                )}
                                {vuln.metadata?.ai_confidence && (
                                  <span className="text-[9px] text-primary">AI: {Math.round(vuln.metadata.ai_confidence * 100)}%</span>
                                )}
                              </div>
                            </div>
                            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                          {!isExpanded && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{vuln.description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border/30 p-4 space-y-3 bg-muted/5">
                        <div>
                          <h4 className="text-xs font-semibold text-foreground mb-1">Description</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{vuln.description}</p>
                        </div>

                        {vuln.evidence && (
                          <div>
                            <h4 className="text-xs font-semibold text-foreground mb-1">Evidence</h4>
                            <div className="bg-muted/30 rounded p-2 border border-border/30 relative group">
                              <code className="text-[10px] font-mono text-muted-foreground break-all block pr-8">
                                {vuln.evidence}
                              </code>
                              <button
                                className="absolute top-2 right-2 p-1 rounded hover:bg-muted/50 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(vuln.evidence, vuln.id);
                                }}
                              >
                                {isCopied ? <Check size={10} className="text-green-400" /> : <Copy size={10} className="text-muted-foreground" />}
                              </button>
                            </div>
                          </div>
                        )}

                        {vuln.remediation && (
                          <div>
                            <h4 className="text-xs font-semibold text-foreground mb-1">Remediation</h4>
                            <p className="text-xs text-green-400">{vuln.remediation}</p>
                          </div>
                        )}

                        {vuln.url && (
                          <div>
                            <h4 className="text-xs font-semibold text-foreground mb-1">Location</h4>
                            <a href={vuln.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                              {vuln.url} <ExternalLink size={10} />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button onClick={() => navigate('/deep-scan')} size="sm" className="gap-2">
            <Target size={14} /> New Scan
          </Button>
          <Button onClick={() => navigate('/scans')} variant="outline" size="sm" className="gap-2">
            <FileText size={14} /> All Scans
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
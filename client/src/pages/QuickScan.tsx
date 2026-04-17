// src/pages/QuickScan.tsx
import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import ScanNameModal from '@/components/ScanNameModal';
import { Input } from '@/components/ui/input';
import { Play, AlertTriangle, Zap, Download, Shield, CheckCircle, XCircle, ExternalLink, Globe, Loader2 } from 'lucide-react';
import { api, type ScanResult } from '@/lib/api';
import { useToast } from '@/components/Toast';

const scanPhases = [
  { min: 0, max: 5, label: 'Initializing scan...' },
  { min: 5, max: 15, label: 'Running technology detection (WhatWeb)...' },
  { min: 15, max: 25, label: 'Scanning ports (Nmap)...' },
  { min: 25, max: 40, label: 'Running vulnerability scans (Nuclei)...' },
  { min: 40, max: 50, label: 'Enumerating directories...' },
  { min: 50, max: 60, label: 'Checking web server (Nikto)...' },
  { min: 60, max: 70, label: 'Analyzing with OWASP ZAP...' },
  { min: 70, max: 80, label: 'Testing for SQL injection...' },
  { min: 80, max: 90, label: 'Checking WordPress (if applicable)...' },
  { min: 90, max: 95, label: 'Processing results...' },
  { min: 95, max: 100, label: 'Finalizing report...' },
];

function getPhaseLabel(progress: number): string {
  const phase = scanPhases.find(p => progress >= p.min && progress < p.max);
  return phase?.label || 'Scanning...';
}

export default function QuickScan() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const [, navigate] = useLocation();
  const { addToast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  const handleScan = async () => {
    if (!url) return;
    
    setError(null);
    setScanning(true);
    setScanComplete(false);
    setCurrentScan(null);

    try {
      // Start the scan using the correct endpoint
      const response = await api.startQuickScan(url);
      
      // Set the initial scan data
      setCurrentScan(response.scan);
      
      addToast('info', 'Scan Started', response.message);

      // Start polling for status
      pollInterval.current = setInterval(async () => {
        try {
          const statusResponse = await api.getScanStatus(response.scan.id);
          setCurrentScan(statusResponse);

          if (statusResponse.status === 'completed' || statusResponse.status === 'failed') {
            if (pollInterval.current) clearInterval(pollInterval.current);
            setScanning(false);
            setScanComplete(true);
            
            if (statusResponse.status === 'completed') {
              const vulnCount = statusResponse.vulnerabilities?.length || 0;
              
              // Get severity breakdown from metadata if available
              const severityBreakdown = statusResponse.metadata?.severity_breakdown;
              const toolsUsed = statusResponse.metadata?.total_tools_run || 0;
              
              const message = vulnCount > 0 
                ? `Found ${vulnCount} vulnerabilities using ${toolsUsed} security tools` 
                : 'No vulnerabilities found!';
              
              addToast(
                vulnCount > 0 ? 'warning' : 'success',
                'Scan Complete',
                message
              );
            } else {
              addToast('error', 'Scan Failed', statusResponse.metadata?.error || 'Could not complete the scan');
            }
          }
        } catch (err: any) {
          console.error('Polling error:', err);
          if (pollInterval.current) clearInterval(pollInterval.current);
          setScanning(false);
          addToast('error', 'Connection Error', err.message || 'Lost connection to the server');
        }
      }, 2000); // Poll every 2 seconds
      
    } catch (err: any) {
      console.error('Failed to start scan:', err);
      setScanning(false);
      setError(err.message || 'Could not initiate the scan');
      addToast('error', 'Failed to Start', err.message || 'Could not initiate the scan');
    }
  };

  const handleSaveWithName = (scanName: string) => {
    if (!currentScan) return;
    setShowNameModal(false);
    setScanComplete(false);
    setUrl('');
    setCurrentScan(null);
    addToast('success', 'Scan Saved', `"${scanName}" saved successfully`);
    // Navigate to scans list
    navigate('/scans');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url && !scanning) {
      handleScan();
    }
  };

  const severityConfig: Record<string, { bg: string; text: string; dot: string }> = {
    critical: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
    high: { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-500' },
    medium: { bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-500' },
    low: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
    info: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-500' },
  };

  // Get severity counts
  const getSeverityCounts = () => {
    if (!currentScan?.vulnerabilities) return {};
    return currentScan.vulnerabilities.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const severityCounts = getSeverityCounts();

  return (
    <DashboardLayout currentPage="Quick Scan">
      <div className="max-w-3xl mx-auto">
        {/* Scan Input Section */}
        <Card className="p-6 lg:p-8 bg-card/50 backdrop-blur-sm border-border card-glow mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Zap size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Quick Scan</h2>
              <p className="text-sm text-muted-foreground">
                Comprehensive security scan using Nuclei, Nmap, Nikto, ZAP, and more
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="url"
                placeholder="Enter website URL (e.g. https://example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={scanning}
                className="bg-muted/30 border-border pl-10 h-11"
              />
            </div>
            <Button
              onClick={handleScan}
              disabled={!url || scanning}
              className="gap-2 px-6 h-11"
            >
              {scanning ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Start Scan
                </>
              )}
            </Button>
          </div>

          {/* Tools Used Info */}
          {currentScan?.metadata?.total_tools_run && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
              <span>Running {currentScan.metadata.total_tools_run} security tools:</span>
              <span className="flex gap-1">
                {Object.keys(currentScan.metadata.tool_results || {}).map(tool => (
                  <span key={tool} className="px-1.5 py-0.5 bg-primary/10 rounded text-primary text-[10px]">
                    {tool}
                  </span>
                ))}
              </span>
            </div>
          )}

          {/* Progress Section */}
          {scanning && currentScan && (
            <div className="animate-fade-in mt-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">{getPhaseLabel(currentScan.progress)}</span>
                <span className="text-primary font-bold tabular-nums">{currentScan.progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 progress-active transition-all duration-700 ease-out"
                  style={{ width: `${currentScan.progress}%` }}
                />
              </div>
              <div className="flex gap-1 mt-3">
                {scanPhases.map((phase, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      currentScan.progress >= phase.max ? 'bg-primary/60' : 
                      currentScan.progress >= phase.min ? 'bg-primary/30' : 'bg-muted/20'
                    }`}
                    title={phase.label}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Results Section */}
        {scanComplete && currentScan && (
          <div className="space-y-4 animate-fade-in">
            {/* Status Banner */}
            <Card className={`p-4 border ${
              currentScan.status === 'completed' && currentScan.vulnerabilities.length === 0
                ? 'bg-green-500/5 border-green-500/20'
                : currentScan.status === 'failed'
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-orange-500/5 border-orange-500/20'
            }`}>
              <div className="flex items-center gap-3">
                {currentScan.status === 'completed' && currentScan.vulnerabilities.length === 0 ? (
                  <CheckCircle size={24} className="text-green-400" />
                ) : currentScan.status === 'failed' ? (
                  <XCircle size={24} className="text-red-400" />
                ) : (
                  <AlertTriangle size={24} className="text-orange-400" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {currentScan.status === 'failed'
                      ? 'Scan Failed'
                      : currentScan.vulnerabilities.length === 0
                        ? 'All Clear!'
                        : `Found ${currentScan.vulnerabilities.length} Issue${currentScan.vulnerabilities.length > 1 ? 's' : ''}`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentScan.status === 'failed'
                      ? currentScan.metadata?.error || 'The target could not be reached or an error occurred'
                      : currentScan.vulnerabilities.length === 0
                        ? 'No vulnerabilities were detected. Your site looks secure!'
                        : 'Review the findings below for details and remediation steps'
                    }
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => navigate(`/scan/${currentScan.id}`)}
                >
                  Full Report <ExternalLink size={12} />
                </Button>
              </div>
            </Card>

            {/* Severity Summary */}
            {currentScan.vulnerabilities.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {['critical', 'high', 'medium', 'low', 'info'].map(sev => {
                  const count = severityCounts[sev] || 0;
                  const cfg = severityConfig[sev];
                  return (
                    <Card key={sev} className={`p-3 text-center border ${cfg.bg}`}>
                      <p className="text-lg font-bold tabular-nums text-foreground">{count}</p>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.text}`}>{sev}</p>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Findings List */}
            <Card className="p-5 bg-card/50 backdrop-blur-sm border-border card-glow">
              <h3 className="font-display font-bold text-base text-foreground mb-4">Findings</h3>
              <div className="space-y-2">
                {currentScan.vulnerabilities.length === 0 ? (
                  <div className="py-6 text-center">
                    <Shield size={32} className="mx-auto mb-2 text-green-400/50" />
                    <p className="text-sm text-muted-foreground">No vulnerabilities found. Great job!</p>
                  </div>
                ) : (
                  currentScan.vulnerabilities.map((v) => {
                    const cfg = severityConfig[v.severity] || severityConfig.info;
                    return (
                      <div key={v.id} className="p-3 rounded-lg border border-border/30 hover:border-border/60 transition-colors bg-muted/10">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${cfg.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-medium text-sm text-foreground">{v.name}</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${cfg.bg} ${cfg.text}`}>
                                {v.severity}
                              </span>
                              {v.cve_id && (
                                <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                                  {v.cve_id}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{v.description}</p>
                            {v.remediation && (
                              <p className="text-xs text-green-400 mt-1">
                                <span className="font-semibold">Fix:</span> {v.remediation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={() => setShowNameModal(true)} className="flex-1 gap-2 h-10">
                <Download size={16} /> Save Scan
              </Button>
              <Button variant="outline" onClick={() => navigate(`/scan/${currentScan.id}`)} className="flex-1 gap-2 h-10">
                <ExternalLink size={16} /> View Full Report
              </Button>
            </div>
          </div>
        )}

        {/* Empty state hint */}
        {!scanning && !scanComplete && !error && (
          <div className="text-center mt-8 text-muted-foreground/60">
            <p className="text-xs">
              🔍 Quick Scan runs multiple security tools including Nuclei, Nmap, Nikto, OWASP ZAP, and more.
              <br />
              It checks for vulnerabilities, misconfigurations, exposed directories, and security issues.
            </p>
          </div>
        )}
      </div>

      <ScanNameModal
        isOpen={showNameModal}
        scanType="quick"
        targetUrl={url}
        onConfirm={handleSaveWithName}
        onCancel={() => setShowNameModal(false)}
      />
    </DashboardLayout>
  );
}
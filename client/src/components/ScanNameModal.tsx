import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

interface ScanNameModalProps {
  isOpen: boolean;
  scanType: 'quick' | 'deep';
  targetUrl?: string;
  onConfirm: (scanName: string) => void;
  onCancel: () => void;
}

export default function ScanNameModal({
  isOpen,
  scanType,
  targetUrl,
  onConfirm,
  onCancel,
}: ScanNameModalProps) {
  const [scanName, setScanName] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!scanName.trim()) {
      setError('Scan name is required');
      return;
    }

    if (scanName.trim().length < 3) {
      setError('Scan name must be at least 3 characters');
      return;
    }

    if (scanName.trim().length > 100) {
      setError('Scan name must be less than 100 characters');
      return;
    }

    onConfirm(scanName.trim());
    setScanName('');
    setError('');
  };

  const handleClose = () => {
    setScanName('');
    setError('');
    onCancel();
  };

  const generateDefaultName = () => {
    const timestamp = new Date().toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const typePrefix = scanType === 'quick' ? 'QS' : 'DS';
    return `${typePrefix} - ${timestamp}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Name Your {scanType === 'quick' ? 'Quick' : 'Deep'} Scan</DialogTitle>
          <DialogDescription>
            Give your scan a descriptive name so you can easily identify it in your dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {targetUrl && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Target URL:</p>
              <p className="text-sm font-mono text-foreground truncate">{targetUrl}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Scan Name</label>
            <Input
              placeholder={generateDefaultName()}
              value={scanName}
              onChange={(e) => {
                setScanName(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
              className="bg-background border-border"
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 Tips for naming:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Include the domain or feature being scanned</li>
              <li>Add the date or purpose of the scan</li>
              <li>Example: "Login Page - Feb 13" or "API Endpoint - Security Audit"</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              Save Scan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

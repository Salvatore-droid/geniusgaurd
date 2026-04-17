import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import axios from "axios";
import https from "https";
import {
  insertScan, updateScan, getScan, getAllScans, getRecentScans,
  deleteScan, insertVulnerabilities, getVulnerabilitiesByScan,
  getScanWithVulnerabilities, getAllScansWithVulnerabilities,
  getCompletedScansWithVulnerabilities, getStats,
  insertNotification,
} from "./db/index";

const router = Router();

// --- Data Models ---

enum ScanType {
  QUICK = "quick",
  DEEP = "deep",
}

enum ScanStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

interface Vulnerability {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  name: string;
  description: string;
  category?: string;
  remediation?: string;
}

// In-memory progress tracking for active scans (not persisted)
const scanProgress: Map<string, number> = new Map();

// --- Real Scanning Engine ---

async function checkSecurityHeaders(url: string, headers: Record<string, string>): Promise<Vulnerability[]> {
  const vulns: Vulnerability[] = [];

  if (!headers['strict-transport-security'] && url.startsWith('https')) {
    vulns.push({
      id: nanoid(),
      severity: 'high',
      name: 'Missing HSTS Header',
      description: 'HTTP Strict Transport Security (HSTS) header is missing. This leaves the site vulnerable to SSL stripping attacks.',
      category: 'Security Headers',
    });
  }

  if (!headers['content-security-policy']) {
    vulns.push({
      id: nanoid(),
      severity: 'medium',
      name: 'Missing Content Security Policy',
      description: 'Content Security Policy (CSP) header is missing. This increases the risk of XSS attacks.',
      category: 'Security Headers',
    });
  }

  if (!headers['x-frame-options']) {
    vulns.push({
      id: nanoid(),
      severity: 'medium',
      name: 'Missing X-Frame-Options',
      description: 'X-Frame-Options header is missing. This may make the site vulnerable to Clickjacking attacks.',
      category: 'Security Headers',
    });
  }

  if (!headers['x-content-type-options']) {
    vulns.push({
      id: nanoid(),
      severity: 'low',
      name: 'Missing X-Content-Type-Options',
      description: 'X-Content-Type-Options: nosniff header is missing. Browsers may incorrectly sniff MIME types.',
      category: 'Security Headers',
    });
  }

  if (!headers['referrer-policy']) {
    vulns.push({
      id: nanoid(),
      severity: 'low',
      name: 'Missing Referrer-Policy',
      description: 'Referrer-Policy header is missing. User navigation paths may be leaked to third-party sites.',
      category: 'Security Headers',
    });
  }

  if (!headers['permissions-policy'] && !headers['feature-policy']) {
    vulns.push({
      id: nanoid(),
      severity: 'low',
      name: 'Missing Permissions-Policy',
      description: 'Permissions-Policy (or Feature-Policy) header is missing. Browser features like camera, microphone, geolocation are not restricted.',
      category: 'Security Headers',
    });
  }

  return vulns;
}

function checkServerLeakage(headers: Record<string, string>): Vulnerability[] {
  const vulns: Vulnerability[] = [];

  if (headers['server']) {
    vulns.push({
      id: nanoid(),
      severity: 'info',
      name: 'Server Information Leakage',
      description: `Server header is present: "${headers['server']}". This reveals information about the server technology.`,
      category: 'Information Disclosure',
    });
  }

  if (headers['x-powered-by']) {
    vulns.push({
      id: nanoid(),
      severity: 'info',
      name: 'Technology Information Leakage',
      description: `X-Powered-By header is present: "${headers['x-powered-by']}". This reveals the technology stack.`,
      category: 'Information Disclosure',
    });
  }

  if (headers['x-aspnet-version']) {
    vulns.push({
      id: nanoid(),
      severity: 'info',
      name: 'ASP.NET Version Leakage',
      description: `X-AspNet-Version header is present: "${headers['x-aspnet-version']}". This reveals the ASP.NET framework version.`,
      category: 'Information Disclosure',
    });
  }

  return vulns;
}

function checkCORSPolicy(headers: Record<string, string>): Vulnerability[] {
  const vulns: Vulnerability[] = [];
  const allowOrigin = headers['access-control-allow-origin'];

  if (allowOrigin === '*') {
    vulns.push({
      id: nanoid(),
      severity: 'medium',
      name: 'Permissive CORS Policy',
      description: 'Access-Control-Allow-Origin is set to "*", allowing any origin to access resources. This may expose sensitive data to unauthorized domains.',
      category: 'CORS',
    });
  }

  const allowCredentials = headers['access-control-allow-credentials'];
  if (allowCredentials === 'true' && allowOrigin && allowOrigin !== '*') {
    vulns.push({
      id: nanoid(),
      severity: 'info',
      name: 'CORS with Credentials',
      description: `CORS allows credentials from origin: "${allowOrigin}". Verify this origin is trusted.`,
      category: 'CORS',
    });
  }

  return vulns;
}

function checkCookieSecurity(headers: Record<string, string>): Vulnerability[] {
  const vulns: Vulnerability[] = [];
  const setCookieHeaders = headers['set-cookie'];
  if (!setCookieHeaders) return vulns;

  const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];

  for (const cookie of cookies) {
    const cookieName = cookie.split('=')[0]?.trim() || 'unknown';
    const lowerCookie = cookie.toLowerCase();

    if (!lowerCookie.includes('httponly')) {
      vulns.push({
        id: nanoid(),
        severity: 'medium',
        name: `Cookie Missing HttpOnly: ${cookieName}`,
        description: `The cookie "${cookieName}" is set without the HttpOnly flag, making it accessible to JavaScript and vulnerable to XSS cookie theft.`,
        category: 'Cookie Security',
      });
    }

    if (!lowerCookie.includes('secure')) {
      vulns.push({
        id: nanoid(),
        severity: 'medium',
        name: `Cookie Missing Secure Flag: ${cookieName}`,
        description: `The cookie "${cookieName}" is set without the Secure flag. It may be transmitted over unencrypted HTTP connections.`,
        category: 'Cookie Security',
      });
    }

    if (!lowerCookie.includes('samesite')) {
      vulns.push({
        id: nanoid(),
        severity: 'low',
        name: `Cookie Missing SameSite: ${cookieName}`,
        description: `The cookie "${cookieName}" doesn't have a SameSite attribute. It may be sent in cross-site requests, increasing CSRF risk.`,
        category: 'Cookie Security',
      });
    }
  }

  return vulns;
}

async function checkSSLCertificate(url: string): Promise<Vulnerability[]> {
  const vulns: Vulnerability[] = [];

  if (!url.startsWith('https')) {
    vulns.push({
      id: nanoid(),
      severity: 'high',
      name: 'No HTTPS',
      description: 'The target does not use HTTPS. All communication is sent in plaintext and can be intercepted.',
      category: 'SSL/TLS',
    });
    return vulns;
  }

  // Try connecting with HTTPS to check basic SSL
  try {
    await axios.get(url, { timeout: 5000, maxRedirects: 0, validateStatus: () => true });
    // If we get here, SSL is working
  } catch (err: any) {
    if (err.code === 'CERT_HAS_EXPIRED') {
      vulns.push({
        id: nanoid(),
        severity: 'critical',
        name: 'Expired SSL Certificate',
        description: 'The SSL/TLS certificate has expired. Browsers will show security warnings to users.',
        category: 'SSL/TLS',
      });
    } else if (err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || err.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
      vulns.push({
        id: nanoid(),
        severity: 'high',
        name: 'Self-Signed or Untrusted SSL Certificate',
        description: 'The SSL/TLS certificate is self-signed or from an untrusted authority.',
        category: 'SSL/TLS',
      });
    } else if (err.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
      vulns.push({
        id: nanoid(),
        severity: 'high',
        name: 'SSL Certificate Hostname Mismatch',
        description: 'The SSL/TLS certificate does not match the requested hostname.',
        category: 'SSL/TLS',
      });
    }
  }

  return vulns;
}

async function checkRobotsTxt(baseUrl: string): Promise<Vulnerability[]> {
  const vulns: Vulnerability[] = [];

  try {
    const robotsRes = await axios.get(`${baseUrl}/robots.txt`, {
      timeout: 5000,
      validateStatus: () => true,
    });

    if (robotsRes.status === 200 && typeof robotsRes.data === 'string') {
      const robotsContent = robotsRes.data.toLowerCase();

      // Check for sensitive paths in Disallow directives
      const sensitivePatterns = ['/admin', '/backup', '/config', '/database', '/api', '/private', '/secret', '/wp-admin', '/phpmyadmin', '/.env', '/.git'];
      const foundPaths: string[] = [];

      for (const pattern of sensitivePatterns) {
        if (robotsContent.includes(pattern)) {
          foundPaths.push(pattern);
        }
      }

      if (foundPaths.length > 0) {
        vulns.push({
          id: nanoid(),
          severity: 'info',
          name: 'Sensitive Paths in robots.txt',
          description: `robots.txt reveals potentially sensitive paths: ${foundPaths.join(', ')}. While this prevents crawling, it also informs attackers of these paths.`,
          category: 'Information Disclosure',
        });
      }

      if (robotsContent.includes('disallow: /') && !robotsContent.includes('disallow: / ')) {
        // This is fine - blocking entire site
      } else if (!robotsContent.includes('disallow')) {
        vulns.push({
          id: nanoid(),
          severity: 'info',
          name: 'Permissive robots.txt',
          description: 'robots.txt has no Disallow directives. All paths are crawlable by search engines.',
          category: 'Configuration',
        });
      }
    }
  } catch {
    // robots.txt not accessible, which is okay
  }

  return vulns;
}

async function checkMixedContent(url: string, html: string): Promise<Vulnerability[]> {
  const vulns: Vulnerability[] = [];

  if (!url.startsWith('https')) return vulns;

  // Check for HTTP resources in HTML
  const httpResourcePattern = /(?:src|href|action)=["']http:\/\//gi;
  const matches = html.match(httpResourcePattern);

  if (matches && matches.length > 0) {
    vulns.push({
      id: nanoid(),
      severity: 'medium',
      name: 'Mixed Content Detected',
      description: `Found ${matches.length} resource(s) loaded over insecure HTTP on an HTTPS page. This can allow man-in-the-middle attacks.`,
      category: 'Mixed Content',
    });
  }

  return vulns;
}

function checkHTTPRedirect(responseStatus: number, responseHeaders: Record<string, string>, url: string): Vulnerability[] {
  const vulns: Vulnerability[] = [];

  // Check if HTTP redirects to HTTPS
  if (url.startsWith('http://') && [301, 302, 307, 308].includes(responseStatus)) {
    const location = responseHeaders['location'];
    if (location && location.startsWith('https://')) {
      // Good - HTTP redirects to HTTPS
    }
  }

  // Check for redirect to HTTP (bad)
  if (url.startsWith('https://') && [301, 302, 307, 308].includes(responseStatus)) {
    const location = responseHeaders['location'];
    if (location && location.startsWith('http://') && !location.startsWith('https://')) {
      vulns.push({
        id: nanoid(),
        severity: 'high',
        name: 'HTTPS to HTTP Redirect',
        description: `The HTTPS page redirects to an insecure HTTP URL: ${location}. This exposes users to downgrade attacks.`,
        category: 'SSL/TLS',
      });
    }
  }

  return vulns;
}

// --- Helper: update progress in memory and DB ---
function setProgress(scanId: string, progress: number) {
  scanProgress.set(scanId, progress);
  updateScan(scanId, { progress });
}

// --- Quick Scan: Security Headers Only ---
async function performQuickScan(scanId: string, target: string) {
  updateScan(scanId, { status: 'running' });
  setProgress(scanId, 10);

  try {
    let url = target;
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    setProgress(scanId, 30);

    const response = await axios.get(url, {
      validateStatus: () => true,
      timeout: 10000,
    });

    setProgress(scanId, 60);

    const headers = response.headers as Record<string, string>;
    const vulns: Vulnerability[] = [];

    vulns.push(...await checkSecurityHeaders(url, headers));
    vulns.push(...checkServerLeakage(headers));

    setProgress(scanId, 90);

    // Save vulnerabilities to DB
    const endTime = new Date().toISOString();
    insertVulnerabilities(vulns.map(v => ({ ...v, scanId })));
    updateScan(scanId, { status: 'completed', progress: 100, endTime });
    scanProgress.delete(scanId);

    // Create notification
    const critCount = vulns.filter(v => v.severity === 'critical').length;
    insertNotification({
      scanId,
      type: critCount > 0 ? 'critical_finding' : 'scan_complete',
      title: `Quick Scan Complete: ${target}`,
      message: `Found ${vulns.length} finding(s)${critCount > 0 ? ` including ${critCount} critical` : ''}.`,
    });

  } catch (error: any) {
    console.error(`Quick scan failed for ${target}:`, error.message);
    const failVuln: Vulnerability = {
      id: nanoid(),
      severity: 'critical',
      name: 'Scan Failed',
      description: `Could not connect to target: ${error.message}`,
      category: 'Connection',
    };
    insertVulnerabilities([{ ...failVuln, scanId }]);
    updateScan(scanId, { status: 'failed', progress: 0, endTime: new Date().toISOString() });
    scanProgress.delete(scanId);
  }
}

// --- Deep Scan: Full Security Audit ---
async function performDeepScan(scanId: string, target: string) {
  updateScan(scanId, { status: 'running' });
  setProgress(scanId, 5);

  try {
    let url = target;
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    const allVulns: Vulnerability[] = [];

    // Phase 1: SSL/TLS Check
    setProgress(scanId, 10);
    allVulns.push(...await checkSSLCertificate(url));

    // Phase 2: Main Request + Headers
    setProgress(scanId, 20);
    let response;
    try {
      response = await axios.get(url, {
        validateStatus: () => true,
        timeout: 15000,
        maxRedirects: 5,
      });
    } catch (err: any) {
      response = await axios.get(url, {
        validateStatus: () => true,
        timeout: 15000,
        maxRedirects: 5,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });
    }

    const headers = response.headers as Record<string, string>;
    const html = typeof response.data === 'string' ? response.data : '';

    // Phase 3: Security Headers
    setProgress(scanId, 35);
    allVulns.push(...await checkSecurityHeaders(url, headers));

    // Phase 4: Server Information Leakage
    setProgress(scanId, 45);
    allVulns.push(...checkServerLeakage(headers));

    // Phase 5: CORS Policy
    setProgress(scanId, 50);
    allVulns.push(...checkCORSPolicy(headers));

    // Phase 6: Cookie Security
    setProgress(scanId, 60);
    allVulns.push(...checkCookieSecurity(headers));

    // Phase 7: Redirect Checks
    setProgress(scanId, 65);
    allVulns.push(...checkHTTPRedirect(response.status, headers, url));

    // Phase 8: Mixed Content
    setProgress(scanId, 72);
    allVulns.push(...await checkMixedContent(url, html));

    // Phase 9: Robots.txt Analysis
    setProgress(scanId, 80);
    const baseUrl = new URL(url).origin;
    allVulns.push(...await checkRobotsTxt(baseUrl));

    // Phase 10: HTTP to HTTPS Redirect Check
    setProgress(scanId, 90);
    if (url.startsWith('https://')) {
      try {
        const httpUrl = url.replace('https://', 'http://');
        const httpRes = await axios.get(httpUrl, {
          timeout: 5000,
          maxRedirects: 0,
          validateStatus: () => true,
        });
        if (httpRes.status >= 200 && httpRes.status < 300) {
          allVulns.push({
            id: nanoid(),
            severity: 'medium',
            name: 'HTTP Version Available',
            description: 'The site is accessible via plain HTTP without redirecting to HTTPS.',
            category: 'SSL/TLS',
          });
        }
      } catch {
        // HTTP not accessible — that's fine
      }
    }

    // Finalize — save all vulns to DB
    setProgress(scanId, 95);
    const endTime = new Date().toISOString();
    insertVulnerabilities(allVulns.map(v => ({ ...v, scanId })));
    updateScan(scanId, { status: 'completed', progress: 100, endTime });
    scanProgress.delete(scanId);

    // Create notification
    const critCount = allVulns.filter(v => v.severity === 'critical').length;
    insertNotification({
      scanId,
      type: critCount > 0 ? 'critical_finding' : 'scan_complete',
      title: `Deep Scan Complete: ${target}`,
      message: `Found ${allVulns.length} finding(s) across ${new Set(allVulns.map(v => v.category).filter(Boolean)).size} categories${critCount > 0 ? ` — ${critCount} critical` : ''}.`,
    });

  } catch (error: any) {
    console.error(`Deep scan failed for ${target}:`, error.message);
    const failVuln: Vulnerability = {
      id: nanoid(),
      severity: 'critical',
      name: 'Scan Failed',
      description: `Could not complete deep scan: ${error.message}`,
      category: 'Connection',
    };
    insertVulnerabilities([{ ...failVuln, scanId }]);
    updateScan(scanId, { status: 'failed', progress: 0, endTime: new Date().toISOString() });
    scanProgress.delete(scanId);
  }
}

// --- Export scan function for scheduler ---
export { performQuickScan, performDeepScan };

// --- Routes ---

// GET /api/stats
router.get("/stats", (req, res) => {
  res.json(getStats());
});

// GET /api/recent-scans
router.get("/recent-scans", (req, res) => {
  const recent = getRecentScans(5);
  const result = recent.map(s => ({
    ...s,
    vulnerabilities: getVulnerabilitiesByScan(s.id),
  }));
  res.json(result);
});

// GET /api/scans
router.get("/scans", (req, res) => {
  res.json(getAllScansWithVulnerabilities());
});

// GET /api/scan/:id
router.get("/scan/:id", (req, res) => {
  const scan = getScanWithVulnerabilities(req.params.id);
  if (!scan) {
    return res.status(404).json({ error: "Scan not found" });
  }
  // Overlay real-time progress for running scans
  if (scanProgress.has(scan.id)) {
    (scan as any).progress = scanProgress.get(scan.id);
  }
  res.json(scan);
});

// POST /api/scan
const startScanSchema = z.object({
  target: z.string().min(1),
  type: z.nativeEnum(ScanType),
});

router.post("/scan", (req, res) => {
  const result = startScanSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  const { target, type } = result.data;
  const id = nanoid();
  const startTime = new Date().toISOString();

  // Insert into DB
  insertScan({ id, target, type, startTime });

  // Start scan asynchronously
  if (type === ScanType.QUICK) {
    performQuickScan(id, target);
  } else {
    performDeepScan(id, target);
  }

  // Return the scan record
  const scan = getScanWithVulnerabilities(id);
  res.json(scan);
});

// DELETE /api/scan/:id
router.delete("/scan/:id", (req, res) => {
  const scan = getScan(req.params.id);
  if (!scan) {
    return res.status(404).json({ error: "Scan not found" });
  }
  deleteScan(scan.id);
  res.json({ success: true, deleted: scan });
});

// GET /api/vulnerability-stats
router.get("/vulnerability-stats", (req, res) => {
  const completedScans = getCompletedScansWithVulnerabilities();

  const severityCounts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const categoryMap: Record<string, number> = {};

  for (const scan of completedScans) {
    for (const v of scan.vulnerabilities) {
      severityCounts[v.severity]++;
      const cat = v.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    }
  }

  const riskDistribution = [
    { name: 'Critical', value: severityCounts.critical, color: '#ef4444' },
    { name: 'High', value: severityCounts.high, color: '#f59e0b' },
    { name: 'Medium', value: severityCounts.medium, color: '#3b82f6' },
    { name: 'Low', value: severityCounts.low, color: '#10b981' },
    { name: 'Info', value: severityCounts.info, color: '#8b5cf6' },
  ];

  const scansByDate: Record<string, { critical: number; high: number; medium: number; low: number }> = {};
  for (const scan of completedScans) {
    const date = new Date(scan.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!scansByDate[date]) scansByDate[date] = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const v of scan.vulnerabilities) {
      if (v.severity in scansByDate[date]) (scansByDate[date] as any)[v.severity]++;
    }
  }

  const vulnerabilityTrend = Object.entries(scansByDate).map(([date, counts]) => ({ month: date, ...counts }));
  const topVulnTypes = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

  res.json({
    severityCounts,
    riskDistribution,
    vulnerabilityTrend,
    topVulnTypes,
    totalVulnerabilities: completedScans.reduce((sum, s) => sum + s.vulnerabilities.length, 0),
    totalCompletedScans: completedScans.length,
  });
});

// GET /api/threat-stats
router.get("/threat-stats", (req, res) => {
  const completedScans = getCompletedScansWithVulnerabilities();

  const threatMap: Record<string, { name: string; severity: string; count: number; category: string }> = {};
  const severityBreakdown: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const categoryCounts: Record<string, number> = {};

  for (const scan of completedScans) {
    for (const v of scan.vulnerabilities) {
      if (!threatMap[v.name]) threatMap[v.name] = { name: v.name, severity: v.severity, count: 0, category: v.category || 'Other' };
      threatMap[v.name].count++;
      severityBreakdown[v.severity]++;
      const cat = v.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }

  const activeThreats = Object.values(threatMap).sort((a, b) => b.count - a.count);
  const recentCompleted = completedScans.slice(0, 10);
  const timeline = recentCompleted.map(scan => ({
    time: new Date(scan.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    threats: scan.vulnerabilities.length,
    target: scan.target,
  }));

  res.json({
    totalThreats: Object.values(severityBreakdown).reduce((a, b) => a + b, 0),
    activeThreats,
    severityBreakdown,
    timeline,
    categoryCounts,
    assetsScanned: new Set(completedScans.map(s => s.target)).size,
  });
});

// GET /api/report-stats
router.get("/report-stats", (req, res) => {
  const allScans = getAllScansWithVulnerabilities();
  const completedScans = allScans.filter(s => s.status === "completed");
  const totalVulns = completedScans.reduce((sum, s) => sum + s.vulnerabilities.length, 0);

  let totalDuration = 0, durationCount = 0;
  for (const scan of completedScans) {
    if (scan.endTime) {
      totalDuration += new Date(scan.endTime).getTime() - new Date(scan.startTime).getTime();
      durationCount++;
    }
  }
  const avgDurationSec = durationCount > 0 ? Math.round(totalDuration / durationCount / 1000) : 0;

  const weightedScore = completedScans.reduce((sum, scan) => {
    const criticals = scan.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highs = scan.vulnerabilities.filter(v => v.severity === 'high').length;
    const mediums = scan.vulnerabilities.filter(v => v.severity === 'medium').length;
    return sum + criticals * 10 + highs * 5 + mediums * 2;
  }, 0);
  const maxPenalty = completedScans.length * 50;
  const securityScore = completedScans.length > 0
    ? Math.max(0, Math.round(100 - (weightedScore / maxPenalty) * 100))
    : 100;

  const weekData: Record<string, { vulnerabilities: number; resolved: number }> = {};
  for (const scan of completedScans) {
    const date = new Date(scan.startTime);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weekData[key]) weekData[key] = { vulnerabilities: 0, resolved: 0 };
    weekData[key].vulnerabilities += scan.vulnerabilities.length;
    weekData[key].resolved += scan.vulnerabilities.length;
  }

  res.json({
    totalScans: allScans.length,
    totalVulnerabilities: totalVulns,
    avgDurationSec,
    securityScore,
    trendData: Object.entries(weekData).map(([date, data]) => ({ date, ...data, pending: 0 })),
    quickScans: allScans.filter(s => s.type === 'quick').length,
    deepScans: allScans.filter(s => s.type === 'deep').length,
  });
});

// --- Notification Routes ---
import { getAllNotifications, getUnreadNotifications, markNotificationRead, markAllNotificationsRead } from "./db/index";

router.get("/notifications", (req, res) => {
  res.json(getAllNotifications());
});

router.get("/notifications/unread", (req, res) => {
  res.json(getUnreadNotifications());
});

router.post("/notifications/:id/read", (req, res) => {
  markNotificationRead(req.params.id);
  res.json({ success: true });
});

router.post("/notifications/read-all", (req, res) => {
  markAllNotificationsRead();
  res.json({ success: true });
});

// --- Schedule Routes ---
import { insertSchedule, getSchedule, getAllSchedules, updateSchedule as updateScheduleDb, deleteSchedule, getEnabledSchedules } from "./db/index";

const scheduleSchema = z.object({
  target: z.string().min(1),
  scanType: z.nativeEnum(ScanType),
  cronExpression: z.string().min(1),
  name: z.string().optional(),
});

router.get("/schedules", (req, res) => {
  res.json(getAllSchedules());
});

router.post("/schedules", (req, res) => {
  const result = scheduleSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error });

  const id = nanoid();
  insertSchedule({ id, ...result.data });
  const schedule = getSchedule(id);
  res.json(schedule);
});

router.put("/schedules/:id", (req, res) => {
  const schedule = getSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ error: "Schedule not found" });

  const updates = req.body;
  updateScheduleDb(req.params.id, updates);
  res.json(getSchedule(req.params.id));
});

router.delete("/schedules/:id", (req, res) => {
  const schedule = getSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ error: "Schedule not found" });
  deleteSchedule(req.params.id);
  res.json({ success: true });
});

export default router;

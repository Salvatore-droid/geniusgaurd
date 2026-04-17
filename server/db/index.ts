import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, desc, sql, count, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import * as schema from "./schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.resolve(__dirname, "..", "..", "data");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "geniusguard.db");
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// --- Auto-create tables ---
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    target TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('quick', 'deep')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed')),
    progress INTEGER NOT NULL DEFAULT 0,
    start_time TEXT NOT NULL,
    end_time TEXT,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS vulnerabilities (
    id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low', 'info')),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    remediation TEXT
  );

  CREATE TABLE IF NOT EXISTS scheduled_scans (
    id TEXT PRIMARY KEY,
    target TEXT NOT NULL,
    scan_type TEXT NOT NULL CHECK(scan_type IN ('quick', 'deep')),
    cron_expression TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    last_run TEXT,
    next_run TEXT,
    created_at TEXT NOT NULL,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    scan_id TEXT REFERENCES scans(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('scan_complete', 'scheduled_scan', 'critical_finding')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_vulns_scan_id ON vulnerabilities(scan_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
  CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
`);

// --- Helper Functions ---

export function insertScan(data: {
    id: string;
    target: string;
    type: "quick" | "deep";
    status?: string;
    startTime: string;
}) {
    return db.insert(schema.scans).values({
        id: data.id,
        target: data.target,
        type: data.type,
        status: (data.status || "pending") as any,
        progress: 0,
        startTime: data.startTime,
    }).run();
}

export function updateScan(id: string, data: Partial<{
    status: string;
    progress: number;
    endTime: string;
    name: string;
}>) {
    const updates: any = {};
    if (data.status !== undefined) updates.status = data.status;
    if (data.progress !== undefined) updates.progress = data.progress;
    if (data.endTime !== undefined) updates.endTime = data.endTime;
    if (data.name !== undefined) updates.name = data.name;

    return db.update(schema.scans).set(updates).where(eq(schema.scans.id, id)).run();
}

export function getScan(id: string) {
    return db.select().from(schema.scans).where(eq(schema.scans.id, id)).get();
}

export function getAllScans() {
    return db.select().from(schema.scans).orderBy(desc(schema.scans.startTime)).all();
}

export function getRecentScans(limit = 5) {
    return db.select().from(schema.scans).orderBy(desc(schema.scans.startTime)).limit(limit).all();
}

export function deleteScan(id: string) {
    return db.delete(schema.scans).where(eq(schema.scans.id, id)).run();
}

export function insertVulnerabilities(vulns: {
    id: string;
    scanId: string;
    severity: string;
    name: string;
    description: string;
    category?: string;
    remediation?: string;
}[]) {
    if (vulns.length === 0) return;
    return db.insert(schema.vulnerabilities).values(vulns as any).run();
}

export function getVulnerabilitiesByScan(scanId: string) {
    return db.select().from(schema.vulnerabilities).where(eq(schema.vulnerabilities.scanId, scanId)).all();
}

export function getScanWithVulnerabilities(id: string) {
    const scan = getScan(id);
    if (!scan) return null;
    const vulns = getVulnerabilitiesByScan(id);
    return { ...scan, vulnerabilities: vulns };
}

export function getCompletedScansWithVulnerabilities() {
    const completedScans = db.select().from(schema.scans)
        .where(eq(schema.scans.status, "completed"))
        .orderBy(desc(schema.scans.startTime))
        .all();

    return completedScans.map(scan => ({
        ...scan,
        vulnerabilities: getVulnerabilitiesByScan(scan.id),
    }));
}

export function getAllScansWithVulnerabilities() {
    const allScans = getAllScans();
    return allScans.map(scan => ({
        ...scan,
        vulnerabilities: getVulnerabilitiesByScan(scan.id),
    }));
}

// --- Stats Helpers ---

export function getStats() {
    const allScans = getAllScans();
    const completedScans = allScans.filter(s => s.status === "completed");
    const activeScans = allScans.filter(s => s.status === "running" || s.status === "pending");

    // Count critical vulns across all completed scans
    const criticalVulnsResult = db.select({ count: count() })
        .from(schema.vulnerabilities)
        .innerJoin(schema.scans, eq(schema.vulnerabilities.scanId, schema.scans.id))
        .where(and(
            eq(schema.scans.status, "completed"),
            eq(schema.vulnerabilities.severity, "critical")
        ))
        .get();

    // Count secure targets (completed scans with 0 critical/high vulns)
    let secureTargets = 0;
    for (const scan of completedScans) {
        const highSevVulns = db.select({ count: count() })
            .from(schema.vulnerabilities)
            .where(and(
                eq(schema.vulnerabilities.scanId, scan.id),
                sql`${schema.vulnerabilities.severity} IN ('critical', 'high')`
            ))
            .get();
        if ((highSevVulns?.count ?? 0) === 0) secureTargets++;
    }

    return {
        totalScans: allScans.length,
        criticalVulns: criticalVulnsResult?.count ?? 0,
        activeScans: activeScans.length,
        secureTargets,
    };
}

// --- Notification Helpers ---

export function insertNotification(data: {
    scanId?: string;
    type: "scan_complete" | "scheduled_scan" | "critical_finding";
    title: string;
    message: string;
}) {
    return db.insert(schema.notifications).values({
        id: nanoid(),
        scanId: data.scanId,
        type: data.type,
        title: data.title,
        message: data.message,
        read: false,
        createdAt: new Date().toISOString(),
    }).run();
}

export function getUnreadNotifications() {
    return db.select().from(schema.notifications)
        .where(eq(schema.notifications.read, false))
        .orderBy(desc(schema.notifications.createdAt))
        .limit(20)
        .all();
}

export function getAllNotifications(limit = 50) {
    return db.select().from(schema.notifications)
        .orderBy(desc(schema.notifications.createdAt))
        .limit(limit)
        .all();
}

export function markNotificationRead(id: string) {
    return db.update(schema.notifications)
        .set({ read: true })
        .where(eq(schema.notifications.id, id))
        .run();
}

export function markAllNotificationsRead() {
    return db.update(schema.notifications)
        .set({ read: true })
        .where(eq(schema.notifications.read, false))
        .run();
}

// --- Schedule Helpers ---

export function insertSchedule(data: {
    id: string;
    target: string;
    scanType: "quick" | "deep";
    cronExpression: string;
    name?: string;
}) {
    return db.insert(schema.scheduledScans).values({
        ...data,
        enabled: true,
        createdAt: new Date().toISOString(),
    }).run();
}

export function getSchedule(id: string) {
    return db.select().from(schema.scheduledScans).where(eq(schema.scheduledScans.id, id)).get();
}

export function getAllSchedules() {
    return db.select().from(schema.scheduledScans).orderBy(desc(schema.scheduledScans.createdAt)).all();
}

export function updateSchedule(id: string, data: Partial<{
    enabled: boolean;
    cronExpression: string;
    lastRun: string;
    nextRun: string;
    name: string;
    target: string;
    scanType: string;
}>) {
    return db.update(schema.scheduledScans).set(data as any).where(eq(schema.scheduledScans.id, id)).run();
}

export function deleteSchedule(id: string) {
    return db.delete(schema.scheduledScans).where(eq(schema.scheduledScans.id, id)).run();
}

export function getEnabledSchedules() {
    return db.select().from(schema.scheduledScans)
        .where(eq(schema.scheduledScans.enabled, true))
        .all();
}

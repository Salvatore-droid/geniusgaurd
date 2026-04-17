import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// --- Scans Table ---
export const scans = sqliteTable("scans", {
    id: text("id").primaryKey(),
    target: text("target").notNull(),
    type: text("type", { enum: ["quick", "deep"] }).notNull(),
    status: text("status", { enum: ["pending", "running", "completed", "failed"] }).notNull().default("pending"),
    progress: integer("progress").notNull().default(0),
    startTime: text("start_time").notNull(),
    endTime: text("end_time"),
    name: text("name"),
});

// --- Vulnerabilities Table ---
export const vulnerabilities = sqliteTable("vulnerabilities", {
    id: text("id").primaryKey(),
    scanId: text("scan_id").notNull().references(() => scans.id, { onDelete: "cascade" }),
    severity: text("severity", { enum: ["critical", "high", "medium", "low", "info"] }).notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    category: text("category"),
    remediation: text("remediation"),
});

// --- Scheduled Scans Table ---
export const scheduledScans = sqliteTable("scheduled_scans", {
    id: text("id").primaryKey(),
    target: text("target").notNull(),
    scanType: text("scan_type", { enum: ["quick", "deep"] }).notNull(),
    cronExpression: text("cron_expression").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    lastRun: text("last_run"),
    nextRun: text("next_run"),
    createdAt: text("created_at").notNull(),
    name: text("name"),
});

// --- Notifications Table ---
export const notifications = sqliteTable("notifications", {
    id: text("id").primaryKey(),
    scanId: text("scan_id").references(() => scans.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["scan_complete", "scheduled_scan", "critical_finding"] }).notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    read: integer("read", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
});

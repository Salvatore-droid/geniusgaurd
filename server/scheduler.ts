import cron, { type ScheduledTask } from "node-cron";
import { nanoid } from "nanoid";
import {
    getEnabledSchedules, updateSchedule, insertScan,
    insertNotification
} from "./db/index";
import { performQuickScan, performDeepScan } from "./routes";

interface ScheduleJob {
    id: string;
    task: ScheduledTask;
}

const activeJobs: Map<string, ScheduleJob> = new Map();

function getNextRun(cronExpression: string): string | null {
    try {
        // Simple next-run calculation
        const interval = cron.validate(cronExpression);
        if (!interval) return null;
        return new Date(Date.now() + 60000).toISOString(); // approximate
    } catch {
        return null;
    }
}

function runScheduledScan(scheduleId: string, target: string, scanType: "quick" | "deep") {
    const scanId = nanoid();
    const startTime = new Date().toISOString();

    insertScan({ id: scanId, target, type: scanType, startTime });
    updateSchedule(scheduleId, { lastRun: startTime });

    console.log(`[Scheduler] Running ${scanType} scan for ${target} (schedule: ${scheduleId})`);

    if (scanType === "quick") {
        performQuickScan(scanId, target);
    } else {
        performDeepScan(scanId, target);
    }

    insertNotification({
        scanId,
        type: "scheduled_scan",
        title: `Scheduled ${scanType} scan started`,
        message: `Automated ${scanType} scan started for ${target}`,
    });
}

export function addScheduleJob(id: string, cronExpression: string, target: string, scanType: "quick" | "deep") {
    // Remove existing job if any
    removeScheduleJob(id);

    if (!cron.validate(cronExpression)) {
        console.error(`[Scheduler] Invalid cron expression: ${cronExpression}`);
        return false;
    }

    const task = cron.schedule(cronExpression, () => {
        runScheduledScan(id, target, scanType);
    });

    activeJobs.set(id, { id, task });
    console.log(`[Scheduler] Job registered: ${id} (${cronExpression}) -> ${scanType} scan: ${target}`);
    return true;
}

export function removeScheduleJob(id: string) {
    const job = activeJobs.get(id);
    if (job) {
        job.task.stop();
        activeJobs.delete(id);
        console.log(`[Scheduler] Job removed: ${id}`);
    }
}

export function startScheduler() {
    console.log("[Scheduler] Starting scheduler...");
    const schedules = getEnabledSchedules();
    console.log(`[Scheduler] Found ${schedules.length} active schedule(s)`);

    for (const schedule of schedules) {
        addScheduleJob(
            schedule.id,
            schedule.cronExpression,
            schedule.target,
            schedule.scanType as "quick" | "deep"
        );
    }
}

export function getActiveJobCount() {
    return activeJobs.size;
}

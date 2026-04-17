import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
    Calendar, Plus, Trash2, Play, Pause, Clock,
    Globe, Shield, RefreshCw, X, Zap, Search, Bell
} from "lucide-react";

interface Schedule {
    id: string;
    target: string;
    scanType: "quick" | "deep";
    cronExpression: string;
    enabled: boolean;
    lastRun: string | null;
    nextRun: string | null;
    createdAt: string;
    name: string | null;
}

const presetSchedules = [
    { label: "Every hour", value: "0 * * * *", desc: "Continuous monitoring" },
    { label: "Every 6 hours", value: "0 */6 * * *", desc: "Regular checks" },
    { label: "Daily at midnight", value: "0 0 * * *", desc: "Overnight scanning" },
    { label: "Daily at 9 AM", value: "0 9 * * *", desc: "Morning report" },
    { label: "Weekly Monday", value: "0 9 * * 1", desc: "Weekly review" },
    { label: "Monthly 1st", value: "0 9 1 * *", desc: "Monthly audit" },
];

export default function ScheduledScans() {
    const { addToast } = useToast();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        target: "",
        scanType: "quick" as "quick" | "deep",
        cronExpression: "0 0 * * *",
        name: "",
    });

    const fetchSchedules = async () => {
        try {
            const res = await api.get("/schedules");
            setSchedules(res.data);
        } catch {
            console.error("Failed to fetch schedules");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSchedules(); }, []);

    const handleCreate = async () => {
        if (!formData.target) return;
        try {
            await api.post("/schedules", formData);
            setShowModal(false);
            setFormData({ target: "", scanType: "quick", cronExpression: "0 0 * * *", name: "" });
            fetchSchedules();
            addToast("success", "Schedule Created", `Automated ${formData.scanType} scan scheduled for ${formData.target}`);
        } catch {
            addToast("error", "Failed", "Could not create schedule");
        }
    };

    const handleToggle = async (id: string, enabled: boolean) => {
        try {
            await api.put(`/schedules/${id}`, { enabled: !enabled });
            fetchSchedules();
            addToast("info", enabled ? "Schedule Paused" : "Schedule Resumed");
        } catch {
            addToast("error", "Failed", "Could not update schedule");
        }
    };

    const handleDelete = async (id: string) => {
        if (deletingId === id) {
            try {
                await api.delete(`/schedules/${id}`);
                setSchedules(prev => prev.filter(s => s.id !== id));
                addToast("success", "Schedule Deleted");
            } catch {
                addToast("error", "Failed", "Could not delete schedule");
            }
            setDeletingId(null);
        } else {
            setDeletingId(id);
            setTimeout(() => setDeletingId(null), 3000);
        }
    };

    const getCronLabel = (expr: string) => presetSchedules.find(p => p.value === expr)?.label || expr;

    return (
        <DashboardLayout currentPage="Scheduled Scans">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                            <Calendar size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Scheduled Scans</h1>
                            <p className="text-sm text-muted-foreground">Automate recurring security scans on your targets.</p>
                        </div>
                    </div>
                    <Button onClick={() => setShowModal(true)} className="gap-2 h-9 text-sm">
                        <Plus size={16} /> New Schedule
                    </Button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {[1, 2].map(i => (
                            <Card key={i} className="p-5 bg-card/50 border-border">
                                <div className="space-y-3">
                                    <div className="flex gap-2"><div className="skeleton h-5 w-40" /><div className="skeleton h-5 w-16" /></div>
                                    <div className="skeleton h-4 w-32" />
                                    <div className="skeleton h-16 w-full" />
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : schedules.length === 0 ? (
                    <Card className="p-10 bg-card/50 border-border text-center card-glow">
                        <div className="max-w-sm mx-auto">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                                <Calendar size={32} className="text-blue-400/60" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">No Scheduled Scans</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Set up automated scanning to continuously monitor your targets for security issues.
                            </p>

                            {/* Educational feature list */}
                            <div className="text-left space-y-2 mb-6 p-4 rounded-xl bg-muted/20 border border-border/30">
                                <div className="flex items-start gap-2.5 text-xs">
                                    <Bell size={14} className="text-primary mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">Get <strong className="text-foreground">notified</strong> when new vulnerabilities are found</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs">
                                    <Clock size={14} className="text-primary mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">Choose from <strong className="text-foreground">hourly to monthly</strong> scanning frequencies</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs">
                                    <Shield size={14} className="text-primary mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">Run <strong className="text-foreground">quick or deep</strong> scans automatically</span>
                                </div>
                            </div>

                            <Button onClick={() => setShowModal(true)} className="gap-2">
                                <Plus size={16} /> Create First Schedule
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {schedules.map(schedule => {
                            const isConfirmingDelete = deletingId === schedule.id;
                            return (
                                <Card key={schedule.id} className="p-5 bg-card/50 border-border card-glow hover:border-primary/20 transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="font-semibold text-foreground truncate">
                                                    {schedule.name || schedule.target}
                                                </h3>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${schedule.enabled
                                                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                        : "bg-muted/50 text-muted-foreground border-border"
                                                    }`}>
                                                    {schedule.enabled ? "Active" : "Paused"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Globe size={12} /> <span className="truncate">{schedule.target}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 ml-2 flex-shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => handleToggle(schedule.id, schedule.enabled)}
                                                title={schedule.enabled ? "Pause" : "Resume"}
                                            >
                                                {schedule.enabled ? <Pause size={14} /> : <Play size={14} />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-8 w-8 p-0 transition-colors ${isConfirmingDelete ? 'text-destructive bg-destructive/10' : 'hover:text-destructive'}`}
                                                onClick={() => handleDelete(schedule.id)}
                                                title={isConfirmingDelete ? "Click again to confirm" : "Delete"}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <div className="bg-muted/20 rounded-lg p-2.5 border border-border/30">
                                            <span className="text-muted-foreground/70 block mb-0.5">Type</span>
                                            <div className="font-medium text-foreground flex items-center gap-1.5">
                                                {schedule.scanType === 'quick' ? <Zap size={12} className="text-blue-400" /> : <Search size={12} className="text-purple-400" />}
                                                {schedule.scanType.charAt(0).toUpperCase() + schedule.scanType.slice(1)} Scan
                                            </div>
                                        </div>
                                        <div className="bg-muted/20 rounded-lg p-2.5 border border-border/30">
                                            <span className="text-muted-foreground/70 block mb-0.5">Frequency</span>
                                            <div className="font-medium text-foreground flex items-center gap-1.5">
                                                <Clock size={12} className="text-primary" />
                                                {getCronLabel(schedule.cronExpression)}
                                            </div>
                                        </div>
                                    </div>

                                    {schedule.lastRun && (
                                        <p className="text-[11px] text-muted-foreground/60 mt-2.5">
                                            Last run: {new Date(schedule.lastRun).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Create Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                        <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                                        <Calendar size={16} className="text-primary" />
                                    </div>
                                    <h2 className="text-lg font-bold text-foreground">New Scheduled Scan</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-muted/30 transition">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name (optional)</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="My website monitor"
                                        className="w-full px-3 py-2.5 rounded-xl bg-muted/20 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target URL <span className="text-destructive">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.target}
                                        onChange={e => setFormData(prev => ({ ...prev, target: e.target.value }))}
                                        placeholder="https://example.com"
                                        className="w-full px-3 py-2.5 rounded-xl bg-muted/20 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Scan Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(["quick", "deep"] as const).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setFormData(prev => ({ ...prev, scanType: type }))}
                                                className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 justify-center ${formData.scanType === type
                                                        ? "bg-primary/15 border-primary/30 text-primary"
                                                        : "bg-muted/10 border-border text-muted-foreground hover:border-border/80"
                                                    }`}
                                            >
                                                {type === 'quick' ? <Zap size={14} /> : <Search size={14} />}
                                                {type.charAt(0).toUpperCase() + type.slice(1)} Scan
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Frequency</label>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {presetSchedules.map(preset => (
                                            <button
                                                key={preset.value}
                                                onClick={() => setFormData(prev => ({ ...prev, cronExpression: preset.value }))}
                                                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${formData.cronExpression === preset.value
                                                        ? "bg-primary/15 border-primary/30 text-primary"
                                                        : "bg-muted/10 border-border text-muted-foreground hover:border-border/80"
                                                    }`}
                                            >
                                                <div>{preset.label}</div>
                                                <div className="text-[10px] opacity-60 mt-0.5">{preset.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button onClick={handleCreate} className="w-full h-10 mt-2 gap-2" disabled={!formData.target}>
                                    <Calendar size={14} /> Create Schedule
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

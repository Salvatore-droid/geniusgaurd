// src/components/DashboardLayout.tsx
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  Menu, X, Bell, Settings, LogOut, ChevronRight, Moon, Sun, Check,
  LayoutDashboard, Zap, Search, ClipboardList, Calendar, Shield, BarChart3, Cog, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext'; // Add this import
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast'; // Add this import

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'scan_complete' | 'critical_finding' | 'scan_failed' | 'info';
  scanId?: number;
  createdAt: string;
  read: boolean;
}

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'overview' },
  { label: 'Quick Scan', href: '/quick-scan', icon: Zap, group: 'scanning' },
  { label: 'Deep Scan', href: '/deep-scan', icon: Search, group: 'scanning' },
  { label: 'Scans', href: '/scans', icon: ClipboardList, group: 'scanning' },
  { label: 'Scheduled Scans', href: '/scheduled-scans', icon: Calendar, group: 'scanning' },
  { label: 'Threat Intelligence', href: '/threat-intelligence', icon: Shield, group: 'analytics' },
  { label: 'Reports', href: '/reports', icon: BarChart3, group: 'analytics' },
  { label: 'Settings', href: '/settings', icon: Cog, group: 'system' }, // Changed from '#' to '/settings'
];

const groupLabels: Record<string, string> = {
  overview: 'Overview',
  scanning: 'Scanning',
  analytics: 'Analytics',
  system: 'System',
};

export default function DashboardLayout({ children, currentPage = 'Dashboard' }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth(); // Add auth context
  const { showToast } = useToast(); // Add toast for notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!api.isAuthenticated()) return;
      
      setLoadingNotifications(true);
      try {
        // You'll need to create this endpoint in your backend
        const data = await api.request<Notification[]>('/notifications/unread/');
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle click outside notifications
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'success');
      navigate('/signin');
    } catch (error) {
      showToast('Failed to logout', 'error');
    }
  };

  // Mark all notifications as read
  const markAllRead = async () => {
    try {
      await api.request('/notifications/read-all/', { method: 'POST' });
      setNotifications([]);
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      showToast('Failed to mark notifications as read', 'error');
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await api.request(`/notifications/${notificationId}/read/`, { method: 'POST' });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.full_name) {
      return user.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.full_name) return user.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  // Group nav items
  const groups = Object.entries(
    navigationItems.reduce((acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    }, {} as Record<string, typeof navigationItems>)
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-card/80 backdrop-blur-xl border-r border-border/50 transition-all duration-300 ease-in-out lg:relative lg:z-0',
          sidebarOpen ? 'w-64 translate-x-0' : 'w-[72px] -translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border/50 flex-shrink-0">
          <a href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
              <span className="text-sm font-extrabold text-primary-foreground tracking-tight">GG</span>
            </div>
            <span className={cn(
              "font-display font-bold text-lg text-foreground whitespace-nowrap transition-all duration-300",
              sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'
            )}>
              GeniusGuard
            </span>
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 scrollbar-thin scrollbar-thumb-muted/30 scrollbar-track-transparent">
          {groups.map(([group, items]) => (
            <div key={group} className="mb-2">
              {sidebarOpen && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 py-2">
                  {groupLabels[group]}
                </p>
              )}
              {items.map((item) => {
                const isActive = location === item.href; // Use location instead of currentPage
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    title={!sidebarOpen ? item.label : undefined}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 mb-0.5 relative cursor-pointer',
                      isActive
                        ? 'bg-primary/15 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.href);
                    }}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary" />
                    )}
                    <Icon size={20} className={cn(
                      'flex-shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )} />
                    <span className={cn(
                      "font-medium text-sm whitespace-nowrap transition-all duration-300",
                      sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                    )}>
                      {item.label}
                    </span>
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-border/50 p-3 flex-shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-xs font-bold text-primary-foreground">
                  {getUserInitials()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {user?.email || 'User'}
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 h-9" 
              title="Settings"
              onClick={() => navigate('/settings')}
            >
              <Settings size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 h-9" 
              title="Sign out"
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="h-14 border-b border-border/50 bg-card/30 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 flex-shrink-0 relative z-20">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8 p-0"
            >
              <Menu size={18} />
            </Button>
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              <a 
                href="/dashboard" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/dashboard');
                }}
              >
                Home
              </a>
              {currentPage !== 'Dashboard' && (
                <>
                  <ChevronRight size={14} className="text-muted-foreground/50" />
                  <span className="text-foreground font-medium">{currentPage}</span>
                </>
              )}
            </div>
            <span className="sm:hidden text-sm font-semibold text-foreground">{currentPage}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 p-0"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1 animate-pulse">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
                {loadingNotifications && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-ping" />
                )}
              </Button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-[60] overflow-hidden animate-fade-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <span className="text-sm font-semibold">Notifications</span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={markAllRead} 
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors"
                      >
                        <Check size={12} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-muted/30">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell size={24} className="mx-auto mb-2 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">All caught up!</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((n, i) => (
                        <div
                          key={n.id}
                          className="relative group"
                        >
                          <a
                            href={n.scanId ? `/scan/${n.scanId}` : '#'}
                            className="block px-4 py-3 hover:bg-muted/30 border-b border-border/30 transition-colors"
                            onClick={(e) => {
                              if (n.scanId) {
                                e.preventDefault();
                                navigate(`/scan/${n.scanId}`);
                                setShowNotifications(false);
                                markAsRead(n.id, e);
                              }
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                                n.type === 'critical_finding' ? 'bg-destructive' :
                                n.type === 'scan_complete' ? 'bg-green-500' :
                                n.type === 'scan_failed' ? 'bg-orange-500' :
                                'bg-primary'
                              )} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{n.title}</div>
                                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</div>
                                <div className="text-[10px] text-muted-foreground/60 mt-1">
                                  {new Date(n.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <button
                                onClick={(e) => markAsRead(n.id, e)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                                title="Mark as read"
                              >
                                <Check size={12} className="text-muted-foreground" />
                              </button>
                            </div>
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User avatar */}
            <button
              onClick={() => navigate('/settings')}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center hover:shadow-md hover:shadow-primary/20 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <span className="text-xs font-bold text-primary-foreground">
                {getUserInitials()}
              </span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-background/95">
          <div className="p-4 lg:p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { Bell, XCircle, CheckCircle2, Wifi, WifiOff, AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteAllRead,
} from '../services/notificationService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const TYPE_CONFIG = {
    FEED_FAILED:         { icon: XCircle,       color: 'text-destructive' },
    FEED_COMPLETE:       { icon: CheckCircle2,  color: 'text-success' },
    DEVICE_OFFLINE:      { icon: WifiOff,       color: 'text-destructive' },
    DEVICE_ONLINE:       { icon: Wifi,          color: 'text-success' },
    LOW_FOOD:            { icon: AlertTriangle, color: 'text-yellow-500' },
    LOW_WATER:           { icon: AlertTriangle, color: 'text-yellow-500' },
    CALIBRATION_NEEDED:  { icon: AlertTriangle, color: 'text-yellow-500' },
};

const formatTime = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const NotificationBell = () => {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const panelRef = useRef(null);
    const channelRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        loadNotifications();

        const channel = supabase
            .channel(`notifications-bell-${user.id}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    setNotifications(prev => [payload.new, ...prev].slice(0, 50));
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        channelRef.current = channel;

        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [user]);

    const loadNotifications = async () => {
        const [{ data }, { count }] = await Promise.all([
            getNotifications(50),
            getUnreadCount(),
        ]);
        setNotifications(data || []);
        setUnreadCount(count || 0);
    };

    const handleOpen = () => setOpen(prev => !prev);

    const handleMarkRead = async (id) => {
        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const handleClearRead = async () => {
        await deleteAllRead();
        setNotifications(prev => prev.filter(n => !n.read));
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={handleOpen}
                className="relative h-9 w-9 flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted transition-colors"
            >
                <Bell className="h-4 w-4 text-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h3 className="text-sm font-bold tracking-tight">Notifications</h3>
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-[10px] font-semibold text-primary hover:underline"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={handleClearRead}
                                className="text-[10px] font-semibold text-muted-foreground hover:text-destructive"
                            >
                                Clear read
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-border">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                No notifications
                            </div>
                        ) : notifications.map((n) => {
                            const cfg = TYPE_CONFIG[n.type] || { icon: Bell, color: 'text-muted-foreground' };
                            const Icon = cfg.icon;
                            return (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "flex items-start gap-3 px-4 py-3 transition-colors",
                                        !n.read && "bg-primary/5"
                                    )}
                                >
                                    <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", cfg.color)} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-foreground">{n.title}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                                        <p className="text-[10px] text-muted-foreground/60 mt-1">{formatTime(n.created_at)}</p>
                                    </div>
                                    {!n.read && (
                                        <button
                                            onClick={() => handleMarkRead(n.id)}
                                            className="shrink-0 text-muted-foreground hover:text-primary"
                                            title="Mark as read"
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;

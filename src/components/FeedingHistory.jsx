import { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, XCircle, Loader2, Info, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '../lib/supabase';

const FeedingHistory = ({ feeders }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('today');
    const subscriptionRef = useRef(null);

    useEffect(() => {
        if (feeders && feeders.length > 0) {
            loadHistory();
            setupRealtime();
        } else {
            setLoading(false);
        }
        return () => {
            subscriptionRef.current?.unsubscribe();
        };
    }, [feeders, filter]);

    const setupRealtime = () => {
        subscriptionRef.current?.unsubscribe();
        const deviceIds = feeders.map(f => f.id);
        if (deviceIds.length === 0) return;

        subscriptionRef.current = supabase
            .channel('feeding-history-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'feeding_events',
            }, () => {
                loadHistory();
            })
            .subscribe();
    };

    const loadHistory = async () => {
        setLoading(true);
        try {
            const now = new Date();
            let startDate = null;

            if (filter === 'today') {
                startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString();
            } else if (filter === 'month') {
                startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();
            }

            const deviceIds = feeders.map(f => f.id);
            if (deviceIds.length === 0) { setEvents([]); return; }

            let query = supabase
                .from('feeding_events')
                .select('*, pet_profiles(id, name, photo_url)')
                .in('device_id', deviceIds)
                .order('timestamp', { ascending: false })
                .limit(filter === 'all' ? 50 : 20);

            if (startDate) query = query.gte('timestamp', startDate);

            const { data, error } = await query;
            if (error) throw error;

            const mapped = (data || []).map(event => {
                const feeder = feeders.find(f => f.id === event.device_id);
                return {
                    ...event,
                    feederName: feeder?.device_name || feeder?.name || 'Feeder',
                };
            });

            setEvents(mapped);
        } catch (err) {
            console.error('Failed to load feeding history:', err);
            setError('Could not load activity');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;

        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm font-medium text-muted-foreground">Analysing activity logs...</span>
            </div>
        );
    }

    return (
        <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-bold tracking-tight">Recent Activity</CardTitle>
                    <CardDescription>Feeding events from your connected devices</CardDescription>
                </div>
                <div className="flex bg-muted p-1 rounded-md border border-border">
                    {['today', 'month', 'all'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all",
                                filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                {error ? (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-destructive text-sm font-medium">
                        <Info className="h-4 w-4" />
                        {error}
                    </div>
                ) : events.length > 0 ? (
                    <div className="space-y-4">
                        {events.map((event) => (
                            <div key={event.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border",
                                        event.status === 'SUCCESS' ? "bg-success/10 border-success/20 text-success" :
                                        event.status === 'PENDING' ? "bg-primary/10 border-primary/20 text-primary" :
                                        event.status === 'IN_PROGRESS' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
                                        "bg-destructive/10 border-destructive/20 text-destructive"
                                    )}>
                                        {event.status === 'SUCCESS' ? <CheckCircle2 className="h-4 w-4" /> :
                                         event.status === 'PENDING' ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                         event.status === 'IN_PROGRESS' ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                         event.status === 'FAILED' ? <XCircle className="h-4 w-4" /> :
                                         <AlertTriangle className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground leading-none">
                                            {event.actual_grams || event.target_grams}g <span className="text-muted-foreground font-normal">Fed</span>
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            {event.feederName} • {event.pet_profiles?.name || 'Manual'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground flex items-center justify-end gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(event.timestamp)}
                                    </p>
                                    <p className={cn(
                                        "text-[9px] font-black uppercase tracking-widest mt-1",
                                        event.status === 'SUCCESS' ? "text-success" :
                                        event.status === 'PENDING' ? "text-primary" :
                                        event.status === 'IN_PROGRESS' ? "text-yellow-500" :
                                        "text-destructive"
                                    )}>
                                        {event.status === 'IN_PROGRESS' ? 'In Progress' : event.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed border-border rounded-lg bg-muted/20">
                        <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">No recent activity detected</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default FeedingHistory;

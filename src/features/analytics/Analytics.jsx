import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getFeedingHistory } from '../dashboard/feedingService';
import Sidebar from '../../shared/components/Sidebar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../shared/components/ui/card';
import Button from '../../shared/components/Button';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Loader2, RefreshCw, Activity, Wheat, Calendar, CheckCircle2, Clock, AlertCircle, Menu } from 'lucide-react';
import { cn } from '../../shared/lib/utils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

ChartJS.defaults.font.family = "'Inter', system-ui, sans-serif";
ChartJS.defaults.color = 'rgba(24, 24, 27, 0.4)';

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Analytics = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [viewMode, setViewMode] = useState('month');

    //use call back is used to memoize the fetchData function, so that it is not recreated on every render. This is important because we pass fetchData as a dependency to useEffect, and we don't want the effect to run on every render due to a new function reference.
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getFeedingHistory(1000);
            setHistory(data || []);
        } catch (err) {
            console.error('History fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            const date = new Date(item.created_at || item.timestamp);
            const isSameYear = date.getFullYear() === selectedYear;
            if (viewMode === 'year') return isSameYear;
            return isSameYear && date.getMonth() === selectedMonth;
        });
    }, [history, selectedYear, selectedMonth, viewMode]);

    const yearlyChartData = useMemo(() => {
        const counts = Array(12).fill(0);
        history.forEach(item => {
            const date = new Date(item.created_at || item.timestamp);
            if (date.getFullYear() === selectedYear) {
                counts[date.getMonth()] += Number(item.payload?.grams || item.actual_grams || 50);
            }
        });
        return {
            labels: MONTHS,
            datasets: [{
                label: 'Grams',
                data: counts,
                backgroundColor: '#6366f1',
                borderRadius: 4,
            }]
        };
    }, [history, selectedYear]);

    const monthlyChartData = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const counts = Array(daysInMonth).fill(0);
        history.forEach(item => {
            const date = new Date(item.created_at || item.timestamp);
            if (date.getFullYear() === selectedYear && date.getMonth() === selectedMonth) {
                counts[date.getDate() - 1] += Number(item.payload?.grams || item.actual_grams || 50);
            }
        });
        return {
            labels: [...Array(daysInMonth)].map((_, i) => (i + 1).toString()),
            datasets: [{
                label: 'Grams',
                data: counts,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0,
            }]
        };
    }, [history, selectedYear, selectedMonth]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' } },
            x: { grid: { display: false } }
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex font-inter">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 lg:ml-64 min-w-0 transition-all p-6 md:p-10 space-y-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Feeding Analytics</h1>
                            <p className="text-sm text-muted-foreground mt-1">Review your pet's feeding patterns and history</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-muted p-1 rounded-xl w-fit">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent border-none text-sm font-bold px-3 py-1.5 outline-none text-foreground"
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <div className="w-px h-4 bg-border mx-1" />
                        <button
                            onClick={() => setViewMode('year')}
                            className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                                viewMode === 'year' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            By Year
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                                viewMode === 'month' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            By Month
                        </button>
                        {viewMode === 'month' && (
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="bg-transparent border-none text-sm font-bold px-3 py-1.5 outline-none text-foreground"
                            >
                                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="shadow-sm">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                                <Activity className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Fed</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {filteredHistory.reduce((a, b) => a + Number(b.payload?.grams || b.actual_grams || 50), 0)}g
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                <Wheat className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Feed Events</p>
                                <p className="text-2xl font-bold text-foreground">{filteredHistory.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                                <Calendar className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current View</p>
                                <p className="text-xl font-bold text-foreground truncate">
                                    {viewMode === 'year' ? selectedYear : `${MONTHS[selectedMonth]} ${selectedYear}`}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Chart */}
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold">Feeding Patterns</CardTitle>
                            <CardDescription>Visualizing grams dispensed over time</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={fetchData}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {viewMode === 'year'
                            ? <Bar data={yearlyChartData} options={chartOptions} />
                            : <Line data={monthlyChartData} options={chartOptions} />
                        }
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold">Recent Activity</h3>
                    {filteredHistory.length === 0 ? (
                        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
                            <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-sm font-bold text-muted-foreground">No feeding records for this selection</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredHistory.slice(0, 20).map((item, i) => {
                                const isSuccess = item.status === 'EXECUTED' || item.status === 'SUCCESS';
                                const ts = new Date(item.created_at || item.timestamp);
                                return (
                                    <div key={item.id || i} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center shrink-0">
                                                <CheckCircle2 className={cn("h-5 w-5", isSuccess ? "text-emerald-500" : "text-muted-foreground/30")} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-bold text-foreground">
                                                        {item.payload?.grams || item.actual_grams || 50}g Fed
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                                                        • {item.pet_profiles?.name || 'Assigned Pet'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-medium">
                                                    Device {item.device_id?.substring(0, 4)?.toUpperCase() || '—'} • {ts.toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                                                <Clock className="h-3 w-3" />
                                                {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                                                isSuccess ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                                            )}>
                                                {item.status || 'SUCCESS'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
};

export default Analytics;

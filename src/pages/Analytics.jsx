import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFeedingHistory } from '../services/feedingService';
import Sidebar from '../components/Sidebar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Loader2, RefreshCw, Activity, Wheat, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '@/lib/utils';
import Button from '../components/Button';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

ChartJS.defaults.font.family = "'Inter', system-ui, sans-serif";
ChartJS.defaults.color = 'rgba(24, 24, 27, 0.4)';

const Analytics = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Filters
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [viewMode, setViewMode] = useState('month');

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

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            const date = new Date(item.created_at || item.timestamp);
            const isSameYear = date.getFullYear() === selectedYear;
            if (viewMode === 'year') return isSameYear;
            return isSameYear && date.getMonth() === selectedMonth;
        });
    }, [history, selectedYear, selectedMonth, viewMode]);

    // Data for Yearly Bar Chart
    const yearlyChartData = useMemo(() => {
        const counts = Array(12).fill(0);
        history.forEach(item => {
            const date = new Date(item.created_at || item.timestamp);
            if (date.getFullYear() === selectedYear) {
                counts[date.getMonth()] += Number(item.payload?.grams || item.actual_grams || 50);
            }
        });
        return {
            labels: months,
            datasets: [{
                label: 'Grams',
                data: counts,
                backgroundColor: '#6366f1',
                borderRadius: 4
            }]
        };
    }, [history, selectedYear]);

    // Data for Monthly Line Chart
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
                pointRadius: 0
            }]
        };
    }, [history, selectedYear, selectedMonth]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white flex font-inter">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            <main className="flex-1 lg:ml-64 p-6 md:p-12 space-y-12">
                
                {/* Simplified Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Feeding Analytics</h1>
                        <p className="text-sm text-zinc-500 mt-1">Review your pet's feeding patterns and history</p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl w-fit">
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent border-none text-sm font-bold px-3 py-1.5 outline-none"
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <div className="w-px h-4 bg-zinc-200 mx-1" />
                        <button 
                            onClick={() => setViewMode('year')}
                            className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", viewMode === 'year' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700")}
                        >By Year</button>
                        <button 
                            onClick={() => setViewMode('month')}
                            className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", viewMode === 'month' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700")}
                        >By Month</button>
                        {viewMode === 'month' && (
                            <select 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="bg-transparent border-none text-sm font-bold px-3 py-1.5 outline-none"
                            >
                                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm ring-1 ring-zinc-100">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Activity className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Fed</p>
                                <p className="text-2xl font-bold text-zinc-900">{filteredHistory.reduce((a,b)=>a+(b.payload?.grams||b.actual_grams||50),0)}g</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm ring-1 ring-zinc-100">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
                                <Wheat className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Feed Events</p>
                                <p className="text-2xl font-bold text-zinc-900">{filteredHistory.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm ring-1 ring-zinc-100">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Current View</p>
                                <p className="text-xl font-bold text-zinc-900 truncate">
                                    {viewMode === 'year' ? selectedYear : `${months[selectedMonth]} ${selectedYear}`}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Graph */}
                <Card className="border-none shadow-sm ring-1 ring-zinc-100">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold">Feeding Patterns</CardTitle>
                            <CardDescription>Visualizing grams dispensed over time</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {viewMode === 'year' ? (
                            <Bar 
                                data={yearlyChartData} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' } }, x: { grid: { display: false } } }
                                }} 
                            />
                        ) : (
                            <Line 
                                data={monthlyChartData} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' } }, x: { grid: { display: false } } }
                                }} 
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Feeding History List (Matching User's Provided UI) */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold px-1">Recent Activity</h3>
                    <div className="space-y-4">
                        {filteredHistory.slice(0, 10).map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full border border-zinc-100 flex items-center justify-center text-zinc-400">
                                        <CheckCircle2 className={cn("h-5 w-5", item.status === 'EXECUTED' || item.status === 'SUCCESS' ? "text-emerald-500" : "text-zinc-300")} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-bold text-zinc-900">{item.payload?.grams || item.actual_grams || 50}g Fed</span>
                                            <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
                                                • {item.pet_profiles?.name || 'Assigned Pet'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 font-medium">
                                            Device Unit {item.device_id?.substring(0,4)} • {new Date(item.created_at || item.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold">
                                        <Clock className="h-3 w-3" />
                                        {new Date(item.created_at || item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                                        item.status === 'EXECUTED' || item.status === 'SUCCESS' ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                                    )}>
                                        {item.status || 'SUCCESS'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredHistory.length === 0 && (
                        <div className="text-center py-20 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                            <AlertCircle className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                            <p className="text-sm font-bold text-zinc-400">No feeding records for this selection</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Analytics;

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFeedingHistory } from '../services/feedingService';
import { injectMockData } from '../lib/mockData';
import Sidebar from '../components/Sidebar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import Button from '../components/Button';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { TrendingUp, Activity, Users, ArrowUpRight, ArrowDownRight, Loader2, RefreshCw, BarChart3, Menu } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

const Analytics = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const { data } = await getFeedingHistory();
            setHistory(data || []);
        } catch (err) {
            console.error('Failed to load analytics data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSeedData = async () => {
        setSeeding(true);
        const result = await injectMockData();
        if (result.success) {
            await fetchData();
        }
        setSeeding(false);
    };

    // --- Data Aggregation ---
    const dailyDataRaw = history.reduce((acc, curr) => {
        const dateStr = curr.timestamp || curr.created_at;
        if (!dateStr) return acc;
        const date = new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });
        const grams = curr.actual_grams !== undefined ? curr.actual_grams : (curr.amount || 0);
        acc[date] = (acc[date] || 0) + Number(grams);
        return acc;
    }, {});

    const days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString(undefined, { weekday: 'short' });
    });

    const lineChartData = {
        labels: days,
        datasets: [
            {
                label: 'Consumption (g)',
                data: days.map(day => dailyDataRaw[day] || 0),
                fill: true,
                backgroundColor: 'rgba(9, 9, 11, 0.05)',
                borderColor: '#09090b',
                tension: 0.3,
                pointBackgroundColor: '#09090b',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
            },
        ],
    };

    const petDataRaw = history.reduce((acc, curr) => {
        const petName = curr.pet_profiles?.name || 'Manual';
        const grams = curr.actual_grams !== undefined ? curr.actual_grams : (curr.amount || 0);
        acc[petName] = (acc[petName] || 0) + Number(grams);
        return acc;
    }, {});

    const doughnutChartData = {
        labels: Object.keys(petDataRaw),
        datasets: [
            {
                data: Object.values(petDataRaw),
                backgroundColor: [
                    '#09090b',
                    '#27272a',
                    '#52525b',
                    '#a1a1aa',
                    '#e4e4e7',
                ],
                borderWidth: 2,
                borderColor: '#ffffff',
            },
        ],
    };

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#ffffff',
                titleColor: '#09090b',
                bodyColor: '#71717a',
                borderColor: '#e4e4e7',
                borderWidth: 1,
                padding: 12,
                boxPadding: 4,
                cornerRadius: 8,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f4f4f5', drawBorder: false },
                ticks: { color: '#a1a1aa', font: { size: 10, weight: '600' } }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#a1a1aa', font: { size: 10, weight: '600' } }
            }
        }
    };

    const doughnutOptions = {
        ...commonOptions,
        scales: {},
        plugins: {
            ...commonOptions.plugins,
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 11, weight: '500' },
                    color: '#71717a'
                }
            }
        }
    };

    const weeklyTotal = Object.values(dailyDataRaw).reduce((a, b) => a + b, 0);

    return (
        <div className="min-h-screen bg-background flex font-inter">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 lg:ml-64 min-w-0 transition-all">
                <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
                    <div className="flex justify-between items-center max-w-7xl mx-auto">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground">
                                <Menu className="h-5 w-5" />
                            </button>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Analytics</h1>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSeedData}
                            disabled={seeding || loading}
                            loading={seeding}
                        >
                            <RefreshCw className="h-3.5 w-3.5 mr-2" />
                            Sync Data
                        </Button>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto p-6 space-y-8">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between pb-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Weekly Total</p>
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-2xl font-bold">{weeklyTotal.toLocaleString()}g</div>
                                <p className="text-[10px] text-success font-bold flex items-center mt-1">
                                    <ArrowUpRight className="h-3 w-3 mr-0.5" /> +12.5% from last month
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between pb-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daily Average</p>
                                    <Activity className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-2xl font-bold">{Math.round(weeklyTotal / 7)}g</div>
                                <p className="text-[10px] text-destructive font-bold flex items-center mt-1">
                                    <ArrowDownRight className="h-3 w-3 mr-0.5" /> -2.1% from yesterday
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between pb-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pet Coverage</p>
                                    <Users className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-2xl font-bold">{Object.keys(petDataRaw).length} Profiles</div>
                                <p className="text-[10px] text-muted-foreground font-medium mt-1">
                                    Across all connected devices
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    {history.length === 0 && !loading ? (
                        <Card className="border-dashed py-20 bg-muted/20">
                            <CardContent className="flex flex-col items-center text-center">
                                <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-bold">No data points recovered</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mt-2">
                                    Feeding metrics will automatically populate once your feeders begin dispensing.
                                </p>
                                <Button variant="outline" className="mt-6" onClick={handleSeedData}>
                                    Generate Sample Data
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold">Consumption Trends</CardTitle>
                                    <CardDescription>Daily food weight dispensed over the last week</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <Line data={lineChartData} options={commonOptions} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-bold">Portion Distribution</CardTitle>
                                    <CardDescription>Total grams split by pet member</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px] flex flex-col justify-center">
                                    <Doughnut data={doughnutChartData} options={doughnutOptions} />
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Analytics;

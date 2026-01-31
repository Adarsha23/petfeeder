import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFeedingHistory } from '../services/feedingService';
import { injectMockData } from '../lib/mockData';
import Sidebar from '../components/Sidebar';
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
import { TrendingUp, Activity, Users, ArrowUpRight, ArrowDownRight, Loader2, RefreshCw } from 'lucide-react';

// Register ChartJS components
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
        } else {
            console.error(result.error);
            alert("Failed to inject data");
        }
        setSeeding(false);
    };

    // --- Data Aggregation Logic ---

    // 1. Daily Consumption (Last 7 Days)
    const dailyDataRaw = history.reduce((acc, curr) => {
        const dateStr = curr.timestamp || curr.created_at;
        if (!dateStr) return acc;

        const date = new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });
        // FIXED: ensuring we use actual_grams (database column) or fallback to amount if legacy
        const grams = curr.actual_grams !== undefined ? curr.actual_grams : (curr.amount || 0);
        acc[date] = (acc[date] || 0) + Number(grams);
        return acc;
    }, {});

    // Ensure we have labels for the last 7 days even if empty
    const days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString(undefined, { weekday: 'short' });
    });

    const lineChartData = {
        labels: days,
        datasets: [
            {
                label: 'Food Dispensed (g)',
                data: days.map(day => dailyDataRaw[day] || 0),
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.1)', // Blue-500 with opacity
                borderColor: 'rgb(59, 130, 246)', // Blue-500
                tension: 0.4,
                pointBackgroundColor: 'white',
                pointBorderColor: 'rgb(59, 130, 246)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    // 2. Pet Consumption Share
    const petDataRaw = history.reduce((acc, curr) => {
        const petName = curr.pet_profiles?.name || 'Unknown';
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
                    'rgba(147, 51, 234, 0.8)', // Purple
                    'rgba(59, 130, 246, 0.8)', // Blue
                    'rgba(16, 185, 129, 0.8)', // Emerald
                    'rgba(245, 158, 11, 0.8)', // Amber
                    'rgba(239, 68, 68, 0.8)',  // Red
                ],
                borderWidth: 0,
                hoverOffset: 4,
            },
        ],
    };

    // Chart Configuration Options
    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1f2937',
                bodyColor: '#1f2937',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: (context) => `${context.parsed.y}g`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#f3f4f6',
                    drawBorder: false,
                },
                ticks: {
                    color: '#9ca3af',
                    font: { size: 11 }
                }
            },
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    color: '#9ca3af',
                    font: { size: 11 }
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    pointStyle: 'circle',
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 12 },
                    color: '#4b5563'
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 lg:ml-72 min-w-0 transition-all duration-300">
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
                    {/* Header */}
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Analytics & Insights</h1>
                            <p className="text-gray-500 mt-1">Deep dive into your pets' feeding habits and health trends.</p>
                        </div>
                        <button
                            onClick={handleSeedData}
                            disabled={seeding || loading}
                            className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                                ${seeding ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {seeding ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                    Injecting Data...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                                    Inject Mock Data
                                </>
                            )}
                        </button>
                    </header>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Weekly Total</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                        {Object.values(dailyDataRaw).reduce((a, b) => a + b, 0).toLocaleString()}g
                                    </h3>
                                </div>
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="flex items-center text-xs text-green-600 font-medium">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                12% from last week
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Daily Average</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                        {Math.round((Object.values(dailyDataRaw).reduce((a, b) => a + b, 0) / 7) || 0)}g
                                    </h3>
                                </div>
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Activity className="h-5 w-5 text-purple-600" />
                                </div>
                            </div>
                            <div className="flex items-center text-xs text-red-500 font-medium">
                                <ArrowDownRight className="h-3 w-3 mr-1" />
                                2% from yesterday
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Active Pets</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                        {Object.keys(petDataRaw).length}
                                    </h3>
                                </div>
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Users className="h-5 w-5 text-orange-600" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Across all connected feeders
                            </p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    {history.length === 0 && !loading ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
                            <TrendingUp className="mx-auto h-12 w-12 text-gray-300" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No Analytics Data</h3>
                            <p className="mt-1 text-sm text-gray-500">Inject mock data to see the graphs in action!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Line Chart */}
                            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">Feeding Trends</h3>
                                    <p className="text-sm text-gray-500">Daily food consumption over the last 7 days</p>
                                </div>
                                <div className="h-[300px] w-full">
                                    <Line data={lineChartData} options={lineOptions} />
                                </div>
                            </div>

                            {/* Doughnut Chart */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">Portion Share</h3>
                                    <p className="text-sm text-gray-500">Distribution by pet profile</p>
                                </div>
                                <div className="h-[300px] w-full flex justify-center">
                                    <Doughnut data={doughnutChartData} options={doughnutOptions} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Analytics;

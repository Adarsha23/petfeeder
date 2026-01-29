import { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Calendar, ArrowLeft, Download, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getAnalyticsData } from '../services/analyticsService';
import Button from '../components/Button';

const Analytics = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        consumptionData: [],
        petBreakdownData: [],
        totalGrams: 0,
        totalFeedings: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const result = await getAnalyticsData();
        if (!result.error) {
            setData(result);
        }
        setLoading(false);
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <main className="flex-1 lg:ml-72 p-4 sm:p-6 lg:p-10 transition-all duration-300">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Back to Dashboard</span>
                            </button>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Analytics & Insights</h1>
                            <p className="text-gray-500 mt-1">Understanding your pets' feeding habits and nutrition trends.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" icon={Download}>Export CSV</Button>
                            <Button variant="primary" icon={Filter}>Last 30 Days</Button>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Food Dispensed</p>
                            <p className="text-3xl font-bold text-gray-900">{(data.totalGrams / 1000).toFixed(2)} <span className="text-lg font-medium text-gray-400">kg</span></p>
                            <div className="mt-2 flex items-center gap-1 text-green-600 text-sm">
                                <TrendingUp className="h-4 w-4" />
                                <span>+12% from last month</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Feeding Events</p>
                            <p className="text-3xl font-bold text-gray-900">{data.totalFeedings} <span className="text-lg font-medium text-gray-400">Times</span></p>
                            <div className="mt-2 flex items-center gap-1 text-blue-600 text-sm">
                                <Calendar className="h-4 w-4" />
                                <span>Avg. 4.2 times/day</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-sm font-medium text-gray-500 mb-1">Top Consumer</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {data.petBreakdownData.sort((a, b) => b.grams - a.grams)[0]?.name || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-400 mt-2">Accounts for {Math.round((data.petBreakdownData.sort((a, b) => b.grams - a.grams)[0]?.grams / data.totalGrams) * 100 || 0)}% of total food</p>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Line Chart: Daily Consumption */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-xl">
                                        <TrendingUp className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Daily Consumption</h3>
                                </div>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.consumptionData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            unit="g"
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="grams"
                                            stroke="#3B82F6"
                                            strokeWidth={4}
                                            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bar Chart: Pet Breakdown */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-50 rounded-xl">
                                        <PieIcon className="h-5 w-5 text-green-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Food Share per Pet</h3>
                                </div>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.petBreakdownData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            unit="g"
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#F9FAFB' }}
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="grams" radius={[10, 10, 0, 0]}>
                                            {data.petBreakdownData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Analytics;

import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, Loader2, Info } from 'lucide-react';
import { getFeedingEvents } from '../services/feedingService';

const FeedingHistory = ({ feeders }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (feeders && feeders.length > 0) {
            loadHistory();
        } else {
            setLoading(false);
        }
    }, [feeders]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            // Get history for all feeders (simpler for now than individual selection)
            const allEvents = [];
            for (const feeder of feeders) {
                const { data, error: fetchError } = await getFeedingEvents(feeder.id, 5);
                if (fetchError) throw new Error(fetchError);
                if (data) {
                    allEvents.push(...data.map(event => ({ ...event, feederName: feeder.device_name || feeder.name })));
                }
            }

            // Sort all combined events by timestamp descending
            allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setEvents(allEvents.slice(0, 10)); // Top 10 across all feeders
        } catch (err) {
            console.error('Failed to load feeding history:', err);
            setError('Could not load recent activity');
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

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin mr-2" />
                <span className="text-gray-500">Loading activity...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {events.length > 0 ? (
                <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feeder</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portion</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {events.map((event) => (
                                    <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{event.feederName}</div>
                                            <div className="text-xs text-gray-500">{event.pet_profiles?.name || 'Manual'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {event.actual_grams || event.target_grams}g
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(event.timestamp)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${event.status === 'SUCCESS'
                                                    ? 'bg-green-100 text-green-700'
                                                    : event.status === 'PENDING'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                {event.status === 'SUCCESS' ? (
                                                    <CheckCircle2 className="h-3 w-3" />
                                                ) : event.status === 'PENDING' ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <XCircle className="h-3 w-3" />
                                                )}
                                                {event.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No feeding activity yet</p>
                </div>
            )}
        </div>
    );
};

export default FeedingHistory;

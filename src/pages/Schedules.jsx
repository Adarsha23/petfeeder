import { useState, useEffect } from 'react';
import {
    Plus,
    Clock,
    Calendar,
    Trash2,
    Edit2,
    Loader2,
    AlertCircle,
    Power,
    Dog,
    Menu,
    ChevronDown,
    Layout
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import ScheduleModal from '../components/ScheduleModal';
import { getSchedules, toggleSchedule, deleteSchedule } from '../services/scheduleService';
import { getPetProfiles } from '../services/petProfileService';
import { getUserDevices } from '../services/deviceService';

const Schedules = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [pets, setPets] = useState([]);
    const [devices, setDevices] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [schedulesRes, petsRes, devicesRes] = await Promise.all([
                getSchedules(),
                getPetProfiles(),
                getUserDevices()
            ]);

            if (schedulesRes.error) throw new Error(schedulesRes.error);
            if (petsRes.error) throw new Error(petsRes.error);
            if (devicesRes.error) throw new Error(devicesRes.error);

            setSchedules(schedulesRes.data);
            setPets(petsRes.data);
            setDevices(devicesRes.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            const { error } = await toggleSchedule(id, !currentStatus);
            if (error) throw new Error(error);

            setSchedules(schedules.map(s =>
                s.id === id ? { ...s, is_active: !currentStatus } : s
            ));
        } catch (err) {
            alert(err.message || 'Failed to update schedule status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this schedule?')) return;

        try {
            const { error } = await deleteSchedule(id);
            if (error) throw new Error(error);

            setSchedules(schedules.filter(s => s.id !== id));
        } catch (err) {
            alert(err.message || 'Failed to delete schedule');
        }
    };

    const getDaysString = (days) => {
        if (!days || days.length === 0) return 'No days selected';
        if (days.length === 7) return 'Every Day';

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map(d => dayNames[d]).join(', ');
    };

    const handleModalClose = (success) => {
        setShowModal(false);
        setEditingSchedule(null);
        if (success) loadData();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="flex-1 lg:ml-72 min-w-0 transition-all duration-300">
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2 hover:bg-white rounded-xl text-gray-400"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Feeding Schedules</h1>
                                <p className="text-gray-500 mt-1">Manage recurring meal plans for your pets.</p>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => {
                                setEditingSchedule(null);
                                setShowModal(true);
                            }}
                            className="shadow-xl shadow-blue-100 px-8 py-4"
                        >
                            New Schedule
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Loading your routines...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-red-900">Error loading schedules</h3>
                            <p className="text-red-700">{error}</p>
                            <Button
                                variant="secondary"
                                className="mt-4"
                                onClick={loadData}
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
                            {schedules.map((schedule) => (
                                <div
                                    key={schedule.id}
                                    className={`bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative group ${!schedule.is_active ? 'opacity-75 grayscale-[0.5]' : ''}`}
                                >
                                    {/* Action Buttons */}
                                    <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={() => {
                                                setEditingSchedule(schedule);
                                                setShowModal(true);
                                            }}
                                            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all hover:scale-110"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(schedule.id)}
                                            className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all hover:scale-110"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-8">
                                        <div className="flex items-start gap-6 mb-8">
                                            <div className="bg-blue-600 p-5 rounded-[2rem] text-white shadow-lg shadow-blue-100">
                                                <Layout className="h-8 w-8" />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-16">
                                                <h3 className="text-2xl font-black text-gray-900 truncate uppercase tracking-tight">
                                                    {schedule.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-lg">
                                                        For {schedule.pet?.name || 'Assigned Pet'}
                                                    </span>
                                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg">
                                                        {schedule.device?.device_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Multiple Times Grid */}
                                        <div className="space-y-3 mb-8">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Feeding Plan</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {schedule.feeding_times?.map((ft, idx) => (
                                                    <div key={idx} className="bg-gray-50/50 p-4 rounded-3xl flex items-center justify-between group/time hover:bg-blue-50/30 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                                                            <span className="text-sm font-black text-gray-900">{ft.time}</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 group-hover/time:text-blue-500 transition-colors">{ft.portion_grams}g</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Status & Days Footer */}
                                        <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">RECURRENCE</label>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                                    <span className="text-sm font-bold">{getDaysString(schedule.days_of_week)}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">STATUS</label>
                                                <button
                                                    onClick={() => handleToggle(schedule.id, schedule.is_active)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all ${schedule.is_active
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:scale-105'
                                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    <Power className="h-4 w-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {schedule.is_active ? 'Active' : 'Paused'}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add New Placeholder */}
                            <button
                                onClick={() => {
                                    setEditingSchedule(null);
                                    setShowModal(true);
                                }}
                                className="border-4 border-dashed border-gray-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-gray-400 hover:border-blue-200 hover:bg-blue-50/30 hover:text-blue-500 transition-all group min-h-[300px]"
                            >
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                    <Plus className="h-10 w-10" />
                                </div>
                                <span className="text-xl font-black uppercase tracking-tight">Create New Plan</span>
                                <p className="text-sm font-medium text-gray-400 mt-2">Add a custom feeding routine</p>
                            </button>
                        </div>
                    )}

                    {!loading && schedules.length === 0 && (
                        <div className="bg-white rounded-[3rem] border border-gray-100 p-20 text-center shadow-sm">
                            <div className="w-32 h-32 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 rotate-3">
                                <Layout className="h-16 w-16 text-blue-500" />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">NO ACTIVE ROUTINES</h2>
                            <p className="text-gray-500 mb-12 max-w-sm mx-auto leading-relaxed text-lg font-medium">
                                Your smart feeder works best with a routine. Create your first feeding plan today!
                            </p>
                            <Button
                                variant="primary"
                                icon={Plus}
                                onClick={() => setShowModal(true)}
                                className="px-12 py-5 shadow-2xl shadow-blue-100 rounded-[1.5rem]"
                            >
                                Create First Plan
                            </Button>
                        </div>
                    )}
                </div>
            </main>

            <ScheduleModal
                isOpen={showModal}
                onClose={handleModalClose}
                existingSchedule={editingSchedule}
                pets={pets}
                devices={devices}
            />
        </div>
    );
};

export default Schedules;

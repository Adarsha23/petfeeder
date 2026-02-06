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
    Menu,
    Layout,
    Timer
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import ScheduleModal from '../components/ScheduleModal';
import { getSchedules, toggleSchedule, deleteSchedule } from '../services/scheduleService';
import { getPetProfiles } from '../services/petProfileService';
import { getUserDevices } from '../services/deviceService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { cn } from '@/lib/utils';

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
        if (days.length === 7) return 'Daily';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map(d => dayNames[d]).join(', ');
    };

    const handleModalClose = (success) => {
        setShowModal(false);
        setEditingSchedule(null);
        if (success) loadData();
    };

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
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Feeding Routines</h1>
                        </div>
                        <Button
                            variant="default"
                            size="sm"
                            icon={Plus}
                            onClick={() => {
                                setEditingSchedule(null);
                                setShowModal(true);
                            }}
                        >
                            Create Plan
                        </Button>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            <p className="text-sm font-medium text-muted-foreground">Retrieving meal plans...</p>
                        </div>
                    ) : error ? (
                        <Card className="border-destructive/20 bg-destructive/5 py-12">
                            <CardContent className="flex flex-col items-center text-center">
                                <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                                <h3 className="text-lg font-bold">Failed to load schedules</h3>
                                <p className="text-sm text-muted-foreground mt-2">{error}</p>
                                <Button variant="outline" className="mt-6" onClick={loadData}>Retry Connection</Button>
                            </CardContent>
                        </Card>
                    ) : schedules.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {schedules.map((schedule) => (
                                <Card key={schedule.id} className={cn(
                                    "border-border group transition-all",
                                    !schedule.is_active && "opacity-60 bg-muted/30"
                                )}>
                                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingSchedule(schedule); setShowModal(true); }}>
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(schedule.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary p-2.5 rounded-lg text-primary-foreground">
                                                <Timer className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold tracking-tight uppercase leading-none">{schedule.name}</CardTitle>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded">
                                                        {schedule.pet?.name || 'Manual'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                                                        {schedule.device?.device_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            {schedule.feeding_times?.map((ft, idx) => (
                                                <div key={idx} className="bg-muted/50 p-2.5 rounded-md border border-border/50 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm font-bold text-foreground">{ft.time}</span>
                                                    </div>
                                                    <span className="text-xs font-medium text-muted-foreground">{ft.portion_grams}g</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>

                                    <CardFooter className="border-t border-border pt-4 mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                {getDaysString(schedule.days_of_week)}
                                            </span>
                                        </div>
                                        <Button
                                            variant={schedule.is_active ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleToggle(schedule.id, schedule.is_active)}
                                            className="h-8 gap-2"
                                        >
                                            <Power className="h-3.5 w-3.5" />
                                            <span className="uppercase tracking-widest text-[10px] font-black">{schedule.is_active ? 'Active' : 'Paused'}</span>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}

                            <button
                                onClick={() => { setEditingSchedule(null); setShowModal(true); }}
                                className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/30 hover:border-primary/50 transition-all group"
                            >
                                <Plus className="h-10 w-10 mb-4 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold uppercase tracking-tight">Add New Routine</span>
                            </button>
                        </div>
                    ) : (
                        <Card className="border-2 border-dashed bg-muted/20 py-24">
                            <CardContent className="flex flex-col items-center text-center">
                                <Layout className="h-16 w-16 text-muted-foreground/30 mb-6" />
                                <h2 className="text-2xl font-bold tracking-tight">No meal plans found</h2>
                                <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-8">
                                    Feeding automation starts with a schedule. Create your first recurring plan to keep your pets happy.
                                </p>
                                <Button size="lg" icon={Plus} onClick={() => setShowModal(true)}>
                                    Kickstart Automation
                                </Button>
                            </CardContent>
                        </Card>
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

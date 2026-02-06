import { useState, useEffect } from 'react';
import { X, Clock, Calendar, Dog, Info, Plus, Trash2, Layout, Timer, CheckCircle2 } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { createSchedule, updateSchedule } from '../services/scheduleService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { cn } from '@/lib/utils';

const ScheduleModal = ({ isOpen, onClose, existingSchedule = null, pets = [], devices = [] }) => {
    const [formData, setFormData] = useState({
        name: '',
        deviceId: '',
        feedingTimes: [{ time: '08:00', portionGrams: '50' }],
        daysOfWeek: [1, 2, 3, 4, 5]
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const selectedDevice = devices.find(d => d.id === formData.deviceId);
    const selectedPet = selectedDevice?.pet_id
        ? pets.find(p => p.id === selectedDevice.pet_id) || selectedDevice.pet
        : null;

    const dayNames = [
        { id: 1, label: 'Mon' }, { id: 2, label: 'Tue' }, { id: 3, label: 'Wed' },
        { id: 4, label: 'Thu' }, { id: 5, label: 'Fri' }, { id: 6, label: 'Sat' }, { id: 0, label: 'Sun' }
    ];

    useEffect(() => {
        if (isOpen) {
            if (existingSchedule) {
                setFormData({
                    name: existingSchedule.name || '',
                    deviceId: existingSchedule.device_id || '',
                    feedingTimes: existingSchedule.feeding_times || [{ time: '08:00', portionGrams: '50' }],
                    daysOfWeek: existingSchedule.days_of_week || []
                });
            } else {
                setFormData({
                    name: '',
                    deviceId: devices[0]?.id || '',
                    feedingTimes: [{ time: '08:00', portionGrams: '50' }],
                    daysOfWeek: [1, 2, 3, 4, 5]
                });
            }
        }
    }, [existingSchedule, devices, isOpen]);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.deviceId) newErrors.deviceId = 'Select a device';
        if (!selectedDevice?.pet_id) newErrors.deviceId = 'No pet assigned to this device';

        const timeErrors = [];
        formData.feedingTimes.forEach((ft, index) => {
            if (!ft.time) timeErrors[index] = { ...timeErrors[index], time: 'Required' };
            if (!ft.portionGrams || parseInt(ft.portionGrams) <= 0) {
                timeErrors[index] = { ...timeErrors[index], portion: 'Min 1g' };
            }
        });
        if (timeErrors.length > 0) newErrors.feedingTimes = timeErrors;
        if (formData.daysOfWeek.length === 0) newErrors.days = 'Select at least one day';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                petId: selectedDevice.pet_id,
                deviceId: formData.deviceId,
                feedingTimes: formData.feedingTimes.map(ft => ({
                    time: ft.time,
                    portion_grams: parseInt(ft.portionGrams)
                })),
                daysOfWeek: formData.daysOfWeek
            };

            if (existingSchedule) {
                await updateSchedule(existingSchedule.id, { ...payload, isActive: existingSchedule.is_active });
            } else {
                await createSchedule(payload);
            }
            onClose(true);
        } catch (err) {
            alert(err.message || 'Failed to save schedule');
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (dayId) => {
        setFormData(prev => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(dayId)
                ? prev.daysOfWeek.filter(d => d !== dayId)
                : [...prev.daysOfWeek, dayId].sort()
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200">
                <CardHeader className="border-b border-border bg-muted/30 px-6 py-4 flex flex-row items-center justify-between shrink-0">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">
                            {existingSchedule ? 'Edit Routine' : 'New Feeding Plan'}
                        </CardTitle>
                        <CardDescription className="text-xs uppercase font-bold tracking-widest leading-none mt-1">
                            {existingSchedule ? 'Modifying meal schedule' : 'Automate your pet meal times'}
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onClose(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <div className="space-y-4">
                        <Input
                            label="Routine Name"
                            placeholder="e.g. Morning Diet"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            error={errors.name}
                            icon={Timer}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Feeder</label>
                                <select
                                    value={formData.deviceId}
                                    onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {devices.map(device => (
                                        <option key={device.id} value={device.id}>{device.device_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Target Pet</label>
                                <div className="h-10 px-3 flex items-center gap-2 rounded-md bg-muted/30 border border-border">
                                    <Dog className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-bold truncate">
                                        {selectedPet?.name || 'Manual'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Multi-Time Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" /> Meals & Portions
                            </label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1.5"
                                onClick={() => setFormData(prev => ({ ...prev, feedingTimes: [...prev.feedingTimes, { time: '12:00', portionGrams: '50' }] }))}
                            >
                                <Plus className="h-3 w-3" /> Add Meal
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {formData.feedingTimes.map((ft, index) => (
                                <div key={index} className="flex gap-2 items-end p-3 rounded-lg border border-border bg-muted/20 animate-in slide-in-from-left-2 duration-200">
                                    <div className="flex-1">
                                        <Input
                                            type="time"
                                            value={ft.time}
                                            onChange={(e) => {
                                                const newTimes = [...formData.feedingTimes];
                                                newTimes[index].time = e.target.value;
                                                setFormData({ ...formData, feedingTimes: newTimes });
                                            }}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            type="number"
                                            value={ft.portionGrams}
                                            onChange={(e) => {
                                                const newTimes = [...formData.feedingTimes];
                                                newTimes[index].portionGrams = e.target.value;
                                                setFormData({ ...formData, feedingTimes: newTimes });
                                            }}
                                            placeholder="Grams"
                                            className="h-9"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                                        disabled={formData.feedingTimes.length <= 1}
                                        onClick={() => setFormData(prev => ({ ...prev, feedingTimes: prev.feedingTimes.filter((_, i) => i !== index) }))}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Days Selection */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" /> Recurrence Settings
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {dayNames.map((day) => (
                                <button
                                    key={day.id}
                                    type="button"
                                    onClick={() => toggleDay(day.id)}
                                    className={cn(
                                        "h-10 flex-1 min-w-[50px] rounded-md text-xs font-bold transition-all border",
                                        formData.daysOfWeek.includes(day.id)
                                            ? "bg-primary border-primary text-primary-foreground shadow-sm"
                                            : "bg-background border-border text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg flex items-start gap-3 border border-border">
                        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            <span className="font-bold text-foreground">Cloud Sync Active:</span> Your feeder will automatically execute these instructions even if your internet connection drops periodically.
                        </p>
                    </div>
                </form>

                <CardFooter className="border-t border-border bg-muted/30 px-6 py-4 flex gap-3 shrink-0">
                    <Button variant="outline" className="flex-1" onClick={() => onClose(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1" loading={loading} onClick={handleSubmit}>
                        {existingSchedule ? 'Update Routine' : 'Enable Automation'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ScheduleModal;

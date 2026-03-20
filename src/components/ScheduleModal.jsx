import { useState, useEffect } from 'react';
import { X, Clock, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { createSchedule, updateSchedule } from '../services/scheduleService';
import Button from './Button';
import { cn } from '@/lib/utils';

const ScheduleModal = ({ isOpen, onClose, existingSchedule, devices }) => {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        name: '',
        deviceId: '',
        petId: '',
        feedingTimes: [
            { time: '08:00', portionGrams: '50' }
        ],
        daysOfWeek: [true, true, true, true, true, true, true], // Sun-Sat
    });

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    useEffect(() => {
        if (existingSchedule) {
            // Map DB snake_case to frontend camelCase
            // Important: database uses 'portion_grams' in the JSONB payload or specific fields.
            const mappedTimes = existingSchedule.feeding_times?.map(t => ({
                time: t.time || '08:00',
                portionGrams: String(t.portion_grams || t.portionGrams || 50)
            })) || [{ time: '08:00', portionGrams: '50' }];

            setFormData({
                name: existingSchedule.name || '',
                deviceId: existingSchedule.device_id || '',
                petId: existingSchedule.pet_id || '',
                feedingTimes: mappedTimes,
                daysOfWeek: existingSchedule.days_of_week || [true, true, true, true, true, true, true],
            });
        } else {
            setFormData({
                name: '',
                deviceId: devices?.[0]?.id || '',
                petId: devices?.[0]?.pet_id || '',
                feedingTimes: [{ time: '08:00', portionGrams: '50' }],
                daysOfWeek: [true, true, true, true, true, true, true],
            });
        }
        setErrors({}); // Reset errors when modal opens/changes
    }, [existingSchedule, devices, isOpen]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Required';
        if (!formData.deviceId) newErrors.deviceId = 'No device linked';
        
        // Find if the device exists or if we have an existing pet association
        const selectedDevice = devices?.find(d => d.id === formData.deviceId);
        const petId = selectedDevice?.pet_id || existingSchedule?.pet_id;
        
        if (!petId) newErrors.petId = 'No pet assigned to this device';
        
        if (formData.feedingTimes.length === 0) newErrors.times = 'At least one feeding required';
        
        const hasActiveDay = formData.daysOfWeek.some(day => day);
        if (!hasActiveDay) newErrors.days = 'Select at least one day';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const selectedDevice = devices?.find(d => d.id === formData.deviceId);
            const petId = selectedDevice?.pet_id || existingSchedule?.pet_id || null;

            const payload = {
                name: formData.name,
                deviceId: formData.deviceId,
                petId: petId,
                feedingTimes: formData.feedingTimes.map(t => ({
                    time: t.time,
                    portion_grams: parseInt(t.portionGrams) || 50
                })),
                daysOfWeek: formData.daysOfWeek,
                isActive: true
            };

            if (existingSchedule) {
                await updateSchedule(existingSchedule.id, payload);
            } else {
                await createSchedule(payload);
            }
            onClose(true);
        } catch (err) {
            console.error('Save schedule error:', err);
            setErrors({ submit: err.message });
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (index) => {
        const newDays = [...formData.daysOfWeek];
        newDays[index] = !newDays[index];
        setFormData({ ...formData, daysOfWeek: newDays });
    };

    const addTime = () => {
        setFormData({
            ...formData,
            feedingTimes: [...formData.feedingTimes, { time: '12:00', portionGrams: '50' }]
        });
    };

    const removeTime = (index) => {
        setFormData({
            ...formData,
            feedingTimes: formData.feedingTimes.filter((_, i) => i !== index)
        });
    };

    const updateTime = (index, field, value) => {
        const newTimes = [...formData.feedingTimes];
        newTimes[index] = { ...newTimes[index], [field]: value };
        setFormData({ ...formData, feedingTimes: newTimes });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-background border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold tracking-tight">
                            {existingSchedule ? 'Edit Routine' : 'Create Automation'}
                        </h2>
                    </div>
                    <button onClick={() => onClose()} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* Routine Name */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Label Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Morning Munchies"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={cn(
                                "w-full h-11 px-4 text-sm border-2 rounded-xl bg-transparent outline-none transition-all",
                                errors.name ? "border-red-500 bg-red-50/50" : "border-border hover:border-zinc-300 focus:border-primary"
                            )}
                        />
                        {errors.name && <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 ml-1 uppercase">{errors.name}</p>}
                    </div>

                    {/* Device Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Hardware Unit</label>
                        <select
                            value={formData.deviceId}
                            onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                            className={cn(
                                "w-full h-11 px-4 text-sm border-2 rounded-xl bg-transparent outline-none transition-all appearance-none cursor-pointer",
                                errors.deviceId ? "border-red-500 bg-red-50/50" : "border-border hover:border-zinc-300 focus:border-primary"
                            )}
                        >
                            <option value="">Select a Feeder</option>
                            {devices?.map(d => (
                                <option key={d.id} value={d.id}>{d.device_name || d.serial_number}</option>
                            ))}
                        </select>
                        {errors.deviceId && <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 ml-1 uppercase tracking-wider">{errors.deviceId}</p>}
                        {errors.petId && !errors.deviceId && <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 mt-1">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                            <p className="text-[10px] text-amber-700 font-bold uppercase">{errors.petId}</p>
                        </div>}
                    </div>

                    {/* Schedule (Days) */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Recurring Days</label>
                        <div className="flex justify-between gap-1">
                            {dayLabels.map((day, i) => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDay(i)}
                                    className={cn(
                                        "w-full h-10 text-[10px] font-black rounded-lg border transition-all",
                                        formData.daysOfWeek[i]
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                                            : "border-border text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                        {errors.days && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.days}</p>}
                    </div>

                    {/* Feeding Slots */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Feeding Events</label>
                            <button
                                type="button"
                                onClick={addTime}
                                className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1"
                            >
                                <Plus className="h-3 w-3" /> Add Slot
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            {formData.feedingTimes.map((item, index) => (
                                <div key={index} className="flex gap-2 items-end animate-in slide-in-from-top-1 duration-200">
                                    <div className="flex-1 grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-xl border border-border">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Time</p>
                                            <input
                                                type="time"
                                                value={item.time}
                                                onChange={(e) => updateTime(index, 'time', e.target.value)}
                                                className="w-full h-8 text-xs font-bold bg-transparent border-b border-border focus:border-primary outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Grams</p>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    value={item.portionGrams}
                                                    onChange={(e) => updateTime(index, 'portionGrams', e.target.value)}
                                                    className="w-full h-8 text-xs font-bold bg-transparent border-b border-border focus:border-primary outline-none"
                                                />
                                                <span className="text-[10px] font-bold text-muted-foreground">g</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeTime(index)}
                                        disabled={formData.feedingTimes.length === 1}
                                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-30 transition-all mb-1 border border-red-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {errors.submit && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <p className="text-xs text-red-600 font-bold">{errors.submit}</p>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 h-11 text-[11px] font-black uppercase tracking-wider"
                            onClick={() => onClose()}
                            type="button"
                        >
                            Discard
                        </Button>
                        <Button
                            variant="default"
                            className="flex-1 h-11 text-[11px] font-black uppercase tracking-wider shadow-lg shadow-primary/20"
                            loading={loading}
                            type="submit"
                        >
                            {existingSchedule ? 'Save Changes' : 'Enable Bot'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleModal;

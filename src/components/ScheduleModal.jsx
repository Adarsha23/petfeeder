import { useState, useEffect } from 'react';
import { X, Clock, Calendar, Dog, Info, Plus, Trash2, Layout } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { createSchedule, updateSchedule } from '../services/scheduleService';

const ScheduleModal = ({ isOpen, onClose, existingSchedule = null, pets = [], devices = [] }) => {
    const [formData, setFormData] = useState({
        name: '',
        deviceId: '',
        feedingTimes: [{ time: '08:00', portionGrams: '50' }],
        daysOfWeek: [1, 2, 3, 4, 5] // Default to weekdays
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Find the current selected device object to derive pet info
    const selectedDevice = devices.find(d => d.id === formData.deviceId);
    const selectedPet = selectedDevice?.pet_id
        ? pets.find(p => p.id === selectedDevice.pet_id) || selectedDevice.pet
        : null;

    const dayNames = [
        { id: 0, label: 'S', full: 'Sunday' },
        { id: 1, label: 'M', full: 'Monday' },
        { id: 2, label: 'T', full: 'Tuesday' },
        { id: 3, label: 'W', full: 'Wednesday' },
        { id: 4, label: 'T', full: 'Thursday' },
        { id: 5, label: 'F', full: 'Friday' },
        { id: 6, label: 'S', full: 'Saturday' }
    ];

    useEffect(() => {
        if (existingSchedule) {
            setFormData({
                name: existingSchedule.name || '',
                deviceId: existingSchedule.device_id || '',
                feedingTimes: existingSchedule.feeding_times || [{ time: '08:00', portionGrams: '50' }],
                daysOfWeek: existingSchedule.days_of_week || []
            });
        } else {
            setFormData(prev => ({
                ...prev,
                name: '',
                deviceId: devices.length > 0 ? devices[0].id : '',
                feedingTimes: [{ time: '08:00', portionGrams: '50' }],
                daysOfWeek: [1, 2, 3, 4, 5]
            }));
        }
    }, [existingSchedule, devices, isOpen]);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Please provide a schedule name';
        if (!formData.deviceId) newErrors.deviceId = 'Please select a device';
        if (!selectedDevice?.pet_id) newErrors.deviceId = 'This device has no pet assigned';

        const timeErrors = [];
        formData.feedingTimes.forEach((ft, index) => {
            if (!ft.time) timeErrors[index] = { ...timeErrors[index], time: 'Time required' };
            if (!ft.portionGrams || parseInt(ft.portionGrams) <= 0) {
                timeErrors[index] = { ...timeErrors[index], portion: 'Must be > 0' };
            }
        });
        if (timeErrors.length > 0) newErrors.feedingTimes = timeErrors;

        if (formData.daysOfWeek.length === 0) {
            newErrors.days = 'Select at least one day';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const addFeedingTime = () => {
        setFormData(prev => ({
            ...prev,
            feedingTimes: [...prev.feedingTimes, { time: '12:00', portionGrams: '50' }]
        }));
    };

    const removeFeedingTime = (index) => {
        if (formData.feedingTimes.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            feedingTimes: prev.feedingTimes.filter((_, i) => i !== index)
        }));
    };

    const updateFeedingTime = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            feedingTimes: prev.feedingTimes.map((ft, i) =>
                i === index ? { ...ft, [field]: value } : ft
            )
        }));
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">
                            {existingSchedule ? 'Edit Schedule' : 'New Schedule'}
                        </h2>
                        <p className="text-sm text-gray-500 font-medium tracking-tight uppercase tracking-widest text-[10px]">Customize your feeding routine</p>
                    </div>
                    <button
                        onClick={() => onClose(false)}
                        className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-gray-900 transition-all shadow-sm"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Schedule Basic Info */}
                    <div className="space-y-6">
                        <Input
                            label="SCHEDULE NAME"
                            placeholder="e.g. Weight Loss Diet, Regular Daily"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            error={errors.name}
                            icon={Layout}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 text-[10px]">Select Feeder</label>
                                <select
                                    value={formData.deviceId}
                                    onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-600 transition-all appearance-none cursor-pointer"
                                >
                                    {devices.map(device => (
                                        <option key={device.id} value={device.id}>{device.device_name}</option>
                                    ))}
                                </select>
                                {errors.deviceId && <p className="text-xs text-red-500 mt-1 ml-1">{errors.deviceId}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 text-[10px]">Assigned Pet</label>
                                <div className="w-full bg-blue-50/50 border border-blue-100/50 rounded-2xl px-4 py-3.5 flex items-center gap-2">
                                    <Dog className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-bold text-blue-700">
                                        {selectedPet?.name || 'No pet assigned'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Feeding Times */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest text-[10px]">FEEDING TIMES & PORTIONS</label>
                            <button
                                type="button"
                                onClick={addFeedingTime}
                                className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl uppercase hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                            >
                                <Plus className="h-3 w-3" /> Add Time
                            </button>
                        </div>

                        <div className="space-y-3">
                            {formData.feedingTimes.map((ft, index) => (
                                <div key={index} className="flex gap-3 items-end p-4 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] animate-in slide-in-from-left-2 duration-200">
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Time</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="time"
                                                value={ft.time}
                                                onChange={(e) => updateFeedingTime(index, 'time', e.target.value)}
                                                className={`w-full bg-white border-2 ${errors.feedingTimes?.[index]?.time ? 'border-red-500' : 'border-white'} rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold focus:border-blue-500 transition-all outline-none`}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Portion (G)</label>
                                        <input
                                            type="number"
                                            value={ft.portionGrams}
                                            onChange={(e) => updateFeedingTime(index, 'portionGrams', e.target.value)}
                                            placeholder="50"
                                            className={`w-full bg-white border-2 ${errors.feedingTimes?.[index]?.portion ? 'border-red-500' : 'border-white'} rounded-xl px-4 py-2.5 text-sm font-bold focus:border-blue-500 transition-all outline-none`}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFeedingTime(index)}
                                        disabled={formData.feedingTimes.length <= 1}
                                        className="mb-1 p-2.5 text-gray-300 hover:text-red-500 disabled:opacity-0 transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Day Selection */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest text-[10px]">SCHEDULE DAYS</label>
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase">
                                {formData.daysOfWeek.length === 7 ? 'Daily' : `${formData.daysOfWeek.length} days / week`}
                            </span>
                        </div>
                        <div className="flex justify-between gap-1.5">
                            {dayNames.map((day) => (
                                <button
                                    key={day.id}
                                    type="button"
                                    onClick={() => toggleDay(day.id)}
                                    className={`w-12 h-12 rounded-2xl text-xs font-black transition-all duration-200 border-2 ${formData.daysOfWeek.includes(day.id)
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                                            : 'bg-white border-transparent text-gray-400 hover:border-gray-100 hover:text-gray-600'
                                        }`}
                                    title={day.full}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                        {errors.days && <p className="text-xs text-red-500 mt-1 ml-1">{errors.days}</p>}
                    </div>

                    {/* Notes Box */}
                    <div className="bg-orange-50/50 rounded-[1.5rem] p-4 flex gap-3 border border-orange-100/50">
                        <Info className="h-5 w-5 text-orange-500 shrink-0" />
                        <p className="text-[10px] text-orange-800 leading-relaxed font-bold uppercase tracking-tight">
                            Important: Schedules are synced to your feeder. If multiple schedules overlap, the device handles them sequentially to prevent jams.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex gap-3 shrink-0">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => onClose(false)}
                            className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            loading={loading}
                            className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100"
                        >
                            {existingSchedule ? 'Update Plan' : 'Create Schedule'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleModal;

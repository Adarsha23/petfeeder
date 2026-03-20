import { useState, useEffect } from 'react';
import { Droplets, Wheat, Activity, WifiOff, Scale } from 'lucide-react';
import { getDeviceSensorData } from '../services/deviceService';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';

const SensorGauges = ({ feeders }) => {
    const [sensorData, setSensorData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (feeders && feeders.length > 0) {
            loadSensorData();
            const interval = setInterval(loadSensorData, 30000); 
            return () => clearInterval(interval);
        }
    }, [feeders]);

    const loadSensorData = async () => {
        try {
            const allData = {};
            for (const feeder of feeders) {
                const [foodRes, waterRes, weightRes] = await Promise.all([
                    getDeviceSensorData(feeder.id, 'FOOD_LEVEL', 1),
                    getDeviceSensorData(feeder.id, 'WATER_LEVEL', 1),
                    getDeviceSensorData(feeder.id, 'TRAY_WEIGHT', 1)
                ]);

                allData[feeder.id] = {
                    feederName: feeder.device_name || feeder.serial_number || 'Feeder Node',
                    food: foodRes.data?.[0]?.value ?? null,
                    water: waterRes.data?.[0]?.value ?? null,
                    weight: weightRes.data?.[0]?.value ?? 0,
                    lastUpdated: foodRes.data?.[0]?.timestamp || null,
                    id: feeder.id
                };
            }
            setSensorData(allData);
        } catch (err) {
            console.error('Telemetry fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="w-full h-32 bg-zinc-50 rounded-2xl animate-pulse" />
    );

    const entries = Object.entries(sensorData);
    if (entries.length === 0) return (
        <div className="w-full py-12 flex flex-col items-center justify-center bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">
            <WifiOff className="h-8 w-8 text-zinc-300 mb-2" />
            <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest text-center">No sensor data available</p>
        </div>
    );

    return (
        <div className="w-full space-y-4">
            {entries.map(([id, data]) => (
                <Card key={id} className="border-none shadow-sm ring-1 ring-zinc-200 bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center shadow-lg">
                                    <Activity className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900 leading-none">{data.feederName}</h3>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1.5 tabular-nums">ID: {data.id.substring(0,8)}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 leading-none">Tray Load</p>
                                    <p className="text-xl font-black text-zinc-900 italic tracking-tighter">{Math.round(data.weight)}g</p>
                                </div>
                                <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full flex items-center gap-2 border border-emerald-100">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Active Link</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Food Level */}
                            <MinimalGauge 
                                label="Food Level" 
                                value={data.food} 
                                icon={Wheat} 
                            />

                            {/* Water Level */}
                            <MinimalGauge 
                                label="Water Level" 
                                value={data.water} 
                                icon={Droplets} 
                            />
                        </div>

                        {data.lastUpdated && (
                            <div className="mt-8 pt-6 border-t border-zinc-50 flex items-center justify-between text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                                <span>Hardware Sync: Complete</span>
                                <span>Measured {new Date(data.lastUpdated).toLocaleTimeString()}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

const MinimalGauge = ({ label, value, icon: Icon }) => {
    const isOffline = value === null || value === undefined;
    const v = isOffline ? 0 : Math.round(value);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-zinc-400" />
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">{label}</span>
                </div>
                <span className={cn("text-lg font-bold tabular-nums italic tracking-tighter", isOffline ? "text-zinc-200" : "text-zinc-900")}>
                    {isOffline ? '??' : `${v}%`}
                </span>
            </div>

            <div className="relative h-2 bg-zinc-50 rounded-full overflow-hidden ring-1 ring-zinc-100">
                <div 
                    className="h-full bg-zinc-900 transition-all duration-1000 ease-out"
                    style={{ width: `${v}%` }}
                />
            </div>
        </div>
    );
};

export default SensorGauges;

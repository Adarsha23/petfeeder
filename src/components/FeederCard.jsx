import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Settings, QrCode, PawPrint, Wheat, Droplets, Fingerprint, Scale } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Fixed missing import
import { getDeviceSensorData } from '../services/deviceService';
import { queueCalibrateCommand } from '../services/commandService';
import Button from './Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { cn } from '@/lib/utils';

const FeederCard = ({ feeder, onManage, onFeedNow }) => {
    const isOnline = feeder.status?.toLowerCase() === 'online';
    const [foodLevel, setFoodLevel] = useState(null);
    const [waterLevel, setWaterLevel] = useState(null);

    useEffect(() => {
        loadSensors();
        const interval = setInterval(loadSensors, 30000);
        return () => clearInterval(interval);
    }, [feeder.id]);

    const loadSensors = async () => {
        try {
            const [foodRes, waterRes] = await Promise.all([
                getDeviceSensorData(feeder.id, 'FOOD_LEVEL', 1),
                getDeviceSensorData(feeder.id, 'WATER_LEVEL', 1),
            ]);
            setFoodLevel(foodRes.data?.[0]?.value ?? null);
            setWaterLevel(waterRes.data?.[0]?.value ?? null);
        } catch (e) {
            // Sensor data not available yet
        }
    };

    const getLevelColor = (val) => {
        if (val === null) return 'bg-muted';
        const v = Number(val);
        if (v >= 70) return 'bg-emerald-500';
        if (v >= 30) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const [calibrating, setCalibrating] = useState(false);
    const [dispensing, setDispensing] = useState(false);

    const handleTare = async () => {
        setCalibrating(true);
        try {
            await queueCalibrateCommand(feeder.id);
            alert('Scale zeroing command sent to hardware.');
        } catch (e) {
            alert('Failed to send tare command: ' + e.message);
        } finally {
            setCalibrating(false);
        }
    };

    const handleWater = async () => {
        setDispensing(true);
        try {
            const { data, error } = await supabase
                .from('command_queue')
                .insert([{
                    device_id: feeder.id,
                    user_id: (await supabase.auth.getUser()).data.user.id,
                    command_type: 'WATER_FEED',
                    payload: { duration: 3000 },
                    status: 'PENDING',
                    priority: 1
                }]);
            if (error) throw error;
            alert('Water dispensing command queued.');
        } catch (e) {
            alert('Failed to queue water: ' + e.message);
        } finally {
            setDispensing(false);
        }
    };

    return (
        <Card className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-bold tracking-tight">
                        {feeder.device_name || feeder.name || 'Unnamed Feeder'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                        <PawPrint className="h-3.5 w-3.5" />
                        Assignee: {feeder.pet?.name || 'None'}
                    </CardDescription>
                </div>
                <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    isOnline ? "bg-success/10 text-success border border-success/20" : "bg-muted text-muted-foreground border border-border"
                )}>
                    {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {isOnline ? 'Online' : 'Offline'}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1.5 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-black uppercase tracking-widest">
                        <Fingerprint className="h-3 w-3" />
                        Database Reference
                    </div>
                    <p className="text-[10px] font-mono font-bold text-zinc-900 select-all cursor-copy hover:text-indigo-600 transition-colors">
                        {feeder.id}
                    </p>
                    <div className="pt-1.5 mt-1.5 border-t border-zinc-100 flex items-center justify-between">
                        <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-tighter">MAC: {feeder.serial_number}</span>
                        <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-tighter">Node: v1.0.4</span>
                    </div>
                </div>

                {/* Inline Sensor Levels */}
                {(foodLevel !== null || waterLevel !== null) && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <Wheat className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Food</span>
                                <span className="text-[10px] font-black ml-auto">{foodLevel !== null ? `${Math.round(foodLevel)}%` : '--'}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all duration-500", getLevelColor(foodLevel))} style={{ width: `${foodLevel ?? 0}%` }} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <Droplets className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Water</span>
                                <span className="text-[10px] font-black ml-auto">{waterLevel !== null ? `${Math.round(waterLevel)}%` : '--'}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all duration-500", getLevelColor(waterLevel))} style={{ width: `${waterLevel ?? 0}%` }} />
                            </div>
                        </div>
                    </div>
                )}

                {!isOnline && (
                    <div className="p-2 rounded bg-orange-500/5 border border-orange-500/10">
                        <p className="text-[10px] text-orange-600 font-medium leading-tight">
                            Note: Device is offline. Commands will be queued for the next heartbeat.
                        </p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex gap-2 pt-0">
                <Button
                    variant="default"
                    size="sm"
                    className="flex-1 text-xs h-9"
                    onClick={() => onFeedNow && onFeedNow(feeder)}
                >
                    Feed
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-9 text-indigo-600 border-indigo-100 hover:bg-indigo-50"
                    onClick={handleWater}
                    disabled={dispensing}
                    loading={dispensing}
                >
                    Water
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleTare}
                    disabled={calibrating}
                    loading={calibrating}
                >
                    <Scale className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => onManage && onManage(feeder)}
                >
                    <Settings className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
};

export default FeederCard;

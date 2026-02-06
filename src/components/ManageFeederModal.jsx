import { useState, useEffect } from 'react';
import { X, Settings, Trash2, Save, Loader2, AlertTriangle, Dog, Cpu, Wifi, WifiOff } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { updateDevice, deleteDevice } from '../services/deviceService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { cn } from '@/lib/utils';

const ManageFeederModal = ({ isOpen, onClose, feeder, petProfiles = [], onUpdate, onRefresh }) => {
    const [name, setName] = useState('');
    const [petId, setPetId] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (feeder) {
            setName(feeder.device_name || feeder.name || '');
            setPetId(feeder.pet_id || '');
        }
    }, [feeder]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const { error: updateError } = await updateDevice(feeder.id, {
                device_name: name.trim(),
                pet_id: petId
            });
            if (updateError) throw new Error(updateError);
            onUpdate(true);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        setError(null);
        try {
            const { error: deleteError } = await deleteDevice(feeder.id);
            if (deleteError) throw new Error(deleteError);
            onUpdate(true);
            onClose();
        } catch (err) {
            setError(err.message);
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (!isOpen) return null;

    const isOnline = feeder.status?.toLowerCase() === 'online';

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <CardHeader className="border-b border-border bg-muted/30 px-6 py-4 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                            Feeder Settings
                        </CardTitle>
                        <CardDescription className="text-xs uppercase font-bold tracking-widest mt-1">
                            Configuration & hardware control
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-[11px] font-bold text-center">
                            {error}
                        </div>
                    )}

                    {!showDeleteConfirm ? (
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-4">
                                <Input
                                    label="Custom Nickname"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Master Feeder 1"
                                    icon={Cpu}
                                    required
                                />

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Pet Assignment</label>
                                    <select
                                        value={petId}
                                        onChange={(e) => setPetId(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        required
                                    >
                                        <option value="" disabled>Select a pet member</option>
                                        {petProfiles.map(pet => (
                                            <option key={pet.id} value={pet.id}>{pet.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Simulation / Debug */}
                            <div className="p-4 border border-border rounded-xl bg-muted/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Network Status</h4>
                                    <div className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1",
                                        isOnline ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                                    )}>
                                        {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-[10px] font-bold h-8"
                                        disabled={toggling}
                                        onClick={async () => {
                                            setToggling(true);
                                            await updateDevice(feeder.id, { status: 'ONLINE' });
                                            await onRefresh();
                                            setToggling(false);
                                        }}
                                    >
                                        Sync Online
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-[10px] font-bold h-8"
                                        disabled={toggling}
                                        onClick={async () => {
                                            setToggling(true);
                                            await updateDevice(feeder.id, { status: 'OFFLINE' });
                                            await onRefresh();
                                            setToggling(false);
                                        }}
                                    >
                                        Drop Offline
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border flex flex-col gap-2">
                                <Button type="submit" loading={loading} className="w-full">
                                    <Save className="h-4 w-4 mr-2" />
                                    Update Configuration
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Disconnect Device
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center py-4 space-y-4">
                            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle className="h-8 w-8 text-destructive" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Remove Feeder?</h3>
                                <p className="text-xs text-muted-foreground mt-1 px-6">
                                    This will unpair the device from your account. You will need the pairing code to re-link it.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Keep Linked</Button>
                                <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-white" onClick={handleDelete} loading={deleting}>Yes, Remove</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ManageFeederModal;

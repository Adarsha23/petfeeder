import { useState } from 'react';
import { X, Wifi, QrCode, ShieldCheck, Info, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { registerDevice } from '../services/deviceService';
import Input from './Input';
import Button from './Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { cn } from '@/lib/utils';

const AddFeederModal = ({ isOpen, onClose, petProfiles = [] }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        serialNumber: '',
        pairingCode: '',
        name: '',
        petId: petProfiles[0]?.id || ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.serialNumber.trim() || !formData.pairingCode.trim()) {
            setError('Serial Number and Pairing Code are required');
            return;
        }

        if (!formData.petId) {
            setError('Please assign a pet to this feeder');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await registerDevice(
                formData.serialNumber.trim(),
                formData.pairingCode.trim(),
                formData.name.trim() || null,
                formData.petId
            );
            if (error) throw new Error(error);
            setFormData({ serialNumber: '', pairingCode: '', name: '', petId: petProfiles[0]?.id || '' });
            onClose(true);
        } catch (err) {
            setError(err.message || 'Failed to register feeder');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <CardHeader className="border-b border-border bg-muted/30 px-6 py-4 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                            Connect Feeder
                        </CardTitle>
                        <CardDescription className="text-xs uppercase font-bold tracking-widest mt-1">
                            Link hardware to your account
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onClose(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3.5 space-y-2">
                        <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-primary" />
                            <p className="text-xs font-bold uppercase tracking-tight">Setup Instructions</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Check the sticker on the device base for your <span className="text-foreground font-semibold">Serial ID</span> and <span className="text-foreground font-semibold">Security PIN</span>.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 text-destructive text-xs font-bold rounded-md border border-destructive/20 text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <Input
                            label="Serial Number"
                            name="serialNumber"
                            value={formData.serialNumber}
                            onChange={handleChange}
                            placeholder="e.g. SPF-002"
                            icon={QrCode}
                            required
                        />

                        <Input
                            label="Pairing PIN"
                            name="pairingCode"
                            value={formData.pairingCode}
                            onChange={handleChange}
                            placeholder="e.g. 5678"
                            type="password"
                            required
                        />

                        <Input
                            label="Device Nickname (Optional)"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Kitchen Main"
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Assign Pet</label>
                            {petProfiles.length > 0 ? (
                                <select
                                    name="petId"
                                    value={formData.petId}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                >
                                    {petProfiles.map(pet => (
                                        <option key={pet.id} value={pet.id}>{pet.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="p-3 bg-muted rounded-md text-[11px] text-muted-foreground font-medium italic">
                                    No pet profiles detected. Create one in the "Pets" section first.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            className="w-full h-11"
                            loading={loading}
                        >
                            <Wifi className="h-4 w-4 mr-2" />
                            Authorize & Link
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default AddFeederModal;

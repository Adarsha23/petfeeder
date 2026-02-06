import { useState, useEffect } from 'react';
import { X, Coffee, Check, AlertCircle, Loader2, PawPrint, Zap } from 'lucide-react';
import Button from './Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { cn } from '@/lib/utils';

const PORTION_OPTIONS = [
    { value: 50, label: 'Small', weight: '50g' },
    { value: 100, label: 'Med', weight: '100g' },
    { value: 150, label: 'Large', weight: '150g' },
    { value: 200, label: 'XL', weight: '200g' },
];

const FeedNowModal = ({ isOpen, onClose, feeder, petProfiles = [], onFeed }) => {
    const [selectedPetId, setSelectedPetId] = useState(null);
    const [selectedPortion, setSelectedPortion] = useState(100);
    const [customPortion, setCustomPortion] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (feeder?.pet_id) {
            setSelectedPetId(feeder.pet_id);
        } else if (petProfiles.length > 0) {
            setSelectedPetId(petProfiles[0].id);
        }
    }, [feeder, petProfiles]);

    const handleFeed = async () => {
        const portion = useCustom ? parseInt(customPortion, 10) : selectedPortion;
        if (!portion || portion <= 0 || portion > 500) {
            setResult({ success: false, message: 'Invalid range (1-500g)' });
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            await onFeed(feeder.id, portion, selectedPetId);
            setResult({ success: true, message: `Dispatched ${portion}g successfully` });
            setTimeout(handleClose, 2000);
        } catch (error) {
            setResult({ success: false, message: error.message || 'Dispense failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setResult(null);
        setLoading(false);
        setSelectedPortion(100);
        setCustomPortion('');
        setUseCustom(false);
        onClose();
    };

    if (!isOpen) return null;

    const currentPet = petProfiles.find(p => p.id === selectedPetId);

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <CardHeader className="border-b border-border bg-muted/30 px-6 py-4 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                            Quick Feed
                        </CardTitle>
                        <CardDescription className="text-xs uppercase font-bold tracking-widest mt-1">
                            Instant manual override
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <div className="p-6 space-y-6">
                    {/* Pet Focus */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">TARGET PET</label>
                        <div className="flex flex-wrap gap-2">
                            {petProfiles.map(pet => (
                                <button
                                    key={pet.id}
                                    onClick={() => setSelectedPetId(pet.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                                        selectedPetId === pet.id
                                            ? "bg-primary border-primary text-primary-foreground shadow-sm"
                                            : "bg-background border-border text-foreground hover:bg-muted"
                                    )}
                                >
                                    <div className="h-5 w-5 rounded-full overflow-hidden bg-muted border border-white/20">
                                        {pet.photo_url ? (
                                            <img src={pet.photo_url} className="h-full w-full object-cover" />
                                        ) : <PawPrint className="h-full w-full p-1 text-muted-foreground" />}
                                    </div>
                                    <span className="text-xs font-bold truncate max-w-[80px]">{pet.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Portions */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">PORTION SIZE</label>
                        <div className="grid grid-cols-2 gap-2">
                            {PORTION_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => { setSelectedPortion(opt.value); setUseCustom(false); }}
                                    className={cn(
                                        "p-3 rounded-lg border text-left transition-all",
                                        !useCustom && selectedPortion === opt.value
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "bg-background border-border text-foreground hover:bg-muted"
                                    )}
                                >
                                    <p className="text-xs font-black uppercase tracking-tight">{opt.label}</p>
                                    <p className="text-[10px] opacity-80">{opt.weight}</p>
                                </button>
                            ))}
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                            <Button
                                variant={useCustom ? "default" : "outline"}
                                className="h-8 text-[10px] font-black uppercase px-3"
                                onClick={() => setUseCustom(!useCustom)}
                            >
                                Custom
                            </Button>
                            {useCustom && (
                                <div className="flex-1 flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
                                    <input
                                        type="number"
                                        value={customPortion}
                                        onChange={(e) => setCustomPortion(e.target.value)}
                                        className="h-8 flex-1 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="Grams (1-500)"
                                    />
                                    <span className="text-[10px] font-bold text-muted-foreground">g</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {result && (
                        <div className={cn(
                            "p-3 rounded-md text-[11px] font-bold border flex items-center gap-2",
                            result.success ? "bg-success/10 border-success/20 text-success" : "bg-destructive/10 border-destructive/20 text-destructive"
                        )}>
                            {result.success ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            {result.message}
                        </div>
                    )}

                    <Button
                        className="w-full h-12 gap-2"
                        onClick={handleFeed}
                        loading={loading}
                        disabled={loading || (result && result.success)}
                    >
                        {result?.success ? 'Dispatched' : (
                            <>
                                <Zap className="h-4 w-4" />
                                Dispense {useCustom ? (customPortion || '?') : selectedPortion}g
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default FeedNowModal;

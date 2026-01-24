import { useState, useEffect } from 'react';
import { X, Coffee, Check, AlertCircle, Loader2, PawPrint } from 'lucide-react';
import Button from './Button';

const PORTION_OPTIONS = [
    { value: 50, label: 'Small', description: '50g' },
    { value: 100, label: 'Medium', description: '100g' },
    { value: 150, label: 'Large', description: '150g' },
    { value: 200, label: 'Extra Large', description: '200g' },
];

const FeedNowModal = ({ isOpen, onClose, feeder, petProfiles = [], onFeed }) => {
    const [selectedPetId, setSelectedPetId] = useState(null);
    const [selectedPortion, setSelectedPortion] = useState(100);
    const [customPortion, setCustomPortion] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // { success: boolean, message: string }

    // Auto-select the pet assigned to this feeder
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
            setResult({ success: false, message: 'Please enter a valid portion (1-500g)' });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            await onFeed(feeder.id, portion, selectedPetId);
            setResult({ success: true, message: `Successfully dispensed ${portion}g!` });

            // Auto-close after success
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (error) {
            setResult({ success: false, message: error.message || 'Failed to dispense food' });
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
        setSelectedPetId(petProfiles[0]?.id || null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Coffee className="h-5 w-5" />
                        Feed Now
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="text-blue-100 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Pet Selection */}
                    {petProfiles.length > 0 && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Who are we feeding?
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {petProfiles.map((pet) => (
                                    <button
                                        key={pet.id}
                                        onClick={() => setSelectedPetId(pet.id)}
                                        disabled={loading}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${selectedPetId === pet.id
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-100 hover:border-gray-200 text-gray-600'
                                            } disabled:opacity-50`}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden border border-white">
                                            {pet.photo_url ? (
                                                <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <PawPrint className="w-full h-full p-1 text-gray-400" />
                                            )}
                                        </div>
                                        <span className="text-sm font-bold">{pet.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Feeder Info */}
                    <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Active Feeder</p>
                        <p className="font-bold text-gray-900">{feeder?.device_name || feeder?.name || 'Smart Feeder'}</p>
                    </div>

                    {/* Portion Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Portion Size
                        </label>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {PORTION_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setSelectedPortion(option.value);
                                        setUseCustom(false);
                                    }}
                                    disabled={loading}
                                    className={`p-4 rounded-lg border-2 transition-all ${!useCustom && selectedPortion === option.value
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                        } disabled:opacity-50`}
                                >
                                    <p className="font-semibold">{option.label}</p>
                                    <p className="text-sm opacity-75">{option.description}</p>
                                </button>
                            ))}
                        </div>

                        {/* Custom Portion */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setUseCustom(!useCustom)}
                                disabled={loading}
                                className={`px-3 py-2 rounded border text-sm transition-all ${useCustom
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                    } disabled:opacity-50`}
                            >
                                Custom
                            </button>
                            {useCustom && (
                                <div className="flex-1 flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={customPortion}
                                        onChange={(e) => setCustomPortion(e.target.value)}
                                        placeholder="Enter grams"
                                        min="1"
                                        max="500"
                                        disabled={loading}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                    />
                                    <span className="text-gray-500">g</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Result Message */}
                    {result && (
                        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${result.success
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {result.success ? (
                                <Check className="h-5 w-5 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            )}
                            <p className="text-sm">{result.message}</p>
                        </div>
                    )}

                    {/* Action Button */}
                    <Button
                        onClick={handleFeed}
                        variant="primary"
                        loading={loading}
                        disabled={loading || (result && result.success)}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Dispensing...
                            </>
                        ) : result?.success ? (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Done!
                            </>
                        ) : (
                            `Dispense ${useCustom ? customPortion || '?' : selectedPortion}g`
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FeedNowModal;

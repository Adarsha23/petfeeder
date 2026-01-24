import { useState, useEffect } from 'react';
import { X, Settings, Trash2, Save, Loader2, AlertTriangle } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { updateDevice, deleteDevice } from '../services/deviceService';

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

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gray-100 px-6 py-4 flex justify-between items-center border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="h-5 w-5 text-gray-500" />
                        Feeder Settings
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {!showDeleteConfirm ? (
                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Feeder Name
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter feeder name (e.g., Living Room)"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assigned Pet
                                </label>
                                <select
                                    value={petId}
                                    onChange={(e) => setPetId(e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    required
                                >
                                    <option value="" disabled>Select a pet</option>
                                    {petProfiles.map(pet => (
                                        <option key={pet.id} value={pet.id}>{pet.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Simulator Section */}
                            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-bold text-orange-800 flex items-center gap-1">
                                        <AlertTriangle className="h-4 w-4" />
                                        Simulator Mode
                                    </h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${feeder.status?.toLowerCase() === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                        Current: {feeder.status || 'OFFLINE'}
                                    </span>
                                </div>
                                <p className="text-xs text-orange-700 mb-4 font-medium italic">
                                    Manually toggle device status for testing UI states.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        disabled={toggling}
                                        onClick={async () => {
                                            setToggling(true);
                                            await updateDevice(feeder.id, { status: 'ONLINE' });
                                            await onRefresh();
                                            setToggling(false);
                                        }}
                                        className={`py-2 text-xs font-bold rounded-lg border transition-all disabled:opacity-50 ${feeder.status?.toLowerCase() === 'online'
                                            ? 'bg-green-600 text-white border-green-600'
                                            : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
                                            }`}
                                    >
                                        {toggling ? 'Updating...' : 'Force ONLINE'}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={toggling}
                                        onClick={async () => {
                                            setToggling(true);
                                            await updateDevice(feeder.id, { status: 'OFFLINE' });
                                            await onRefresh();
                                            setToggling(false);
                                        }}
                                        className={`py-2 text-xs font-bold rounded-lg border transition-all disabled:opacity-50 ${feeder.status !== 'ONLINE'
                                            ? 'bg-gray-700 text-white border-gray-700'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {toggling ? 'Updating...' : 'Force OFFLINE'}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                    loading={loading}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-red-100"
                                >
                                    <Trash2 className="h-4 w-4 inline mr-2" />
                                    Disconnect Feeder
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Feeder?</h3>
                            <p className="text-gray-600 mb-6 text-sm">
                                This will disconnect the device from your account. You will need the Pairing Code to add it again.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    onClick={handleDelete}
                                    loading={deleting}
                                >
                                    Yes, Disconnect
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageFeederModal;

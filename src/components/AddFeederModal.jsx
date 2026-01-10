import { useState } from 'react';
import { X, Wifi, QrCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { registerDevice } from '../services/deviceService';
import Input from './Input';
import Button from './Button';

const AddFeederModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        serialNumber: '',
        pairingCode: '',
        name: ''
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

        setLoading(true);
        try {
            const { data, error } = await registerDevice(
                formData.serialNumber.trim(),
                formData.pairingCode.trim(),
                formData.name.trim() || null
            );

            if (error) throw new Error(error);

            // Reset form
            setFormData({ serialNumber: '', pairingCode: '', name: '' });
            onClose(true); // Success
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Wifi className="h-5 w-5" />
                        Connect Feeder
                    </h2>
                    <button
                        onClick={() => onClose(false)}
                        className="text-blue-100 hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                        <p className="font-medium mb-1">Where to find details?</p>
                        <p>Check the sticker on the bottom of your Smart Feeder for the Serial Number (ID) and Pairing Code.</p>

                        <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="font-medium text-xs uppercase tracking-wider text-blue-600 mb-1">Demo Mode Credentials:</p>
                            <ul className="space-y-1 text-xs font-mono">
                                <li>ID: <span className="font-bold">SPF-001</span> | Code: <span className="font-bold">1234</span> (Offline)</li>
                                <li>ID: <span className="font-bold">SPF-002</span> | Code: <span className="font-bold">5678</span> (Online)</li>
                            </ul>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Serial Number (ID)"
                        name="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleChange}
                        placeholder="e.g., SPF-2025-001"
                        icon={QrCode}
                        autoFocus
                    />

                    <Input
                        label="Pairing Code (PIN)"
                        name="pairingCode"
                        value={formData.pairingCode}
                        onChange={handleChange}
                        placeholder="e.g., 8821"
                        type="password" // Masked for security
                    />

                    <Input
                        label="Feeder Name (Optional)"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Living Room"
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                            className="w-full"
                        >
                            Connect Device
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddFeederModal;

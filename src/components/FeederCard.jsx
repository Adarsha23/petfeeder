import { Wifi, WifiOff, Settings, Battery, Clock, PawPrint, QrCode } from 'lucide-react';
import Button from './Button';

const FeederCard = ({ feeder, onManage, onFeedNow }) => {
    const isOnline = feeder.status?.toLowerCase() === 'online';

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h4 className="font-bold text-gray-900 text-lg">{feeder.device_name || feeder.name || 'Unnamed Feeder'}</h4>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <PawPrint className="h-3 w-3" />
                        <span>For: {feeder.pet?.name || 'Unassigned'}</span>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {isOnline ? 'Online' : 'Offline'}
                </div>
            </div>

            {/* Stats / Info */}
            <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <QrCode className="h-4 w-4 text-gray-400" />
                    <span>ID: {feeder.serial_number?.slice(-8)}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
                {!isOnline && (
                    <p className="text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 italic">
                        Feeder is offline. Command will be queued and executed once it reconnects.
                    </p>
                )}
                <div className="flex gap-3">
                    <Button
                        variant="primary"
                        className="flex-1 text-sm py-2"
                        onClick={() => onFeedNow && onFeedNow(feeder)}
                    >
                        Feed Now
                    </Button>
                    <button
                        onClick={() => onManage(feeder)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                    >
                        <Settings className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeederCard;

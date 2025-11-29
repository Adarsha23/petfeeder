import { Wifi, WifiOff, Settings, Battery, Clock } from 'lucide-react';
import Button from './Button';

const FeederCard = ({ feeder, onManage }) => {
    const isOnline = feeder.status === 'online';

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h4 className="font-bold text-gray-900 text-lg">{feeder.name}</h4>
                    <p className="text-sm text-gray-500">{feeder.model}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {isOnline ? 'Online' : 'Offline'}
                </div>
            </div>

            {/* Stats / Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Last fed: 2h ago</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Battery className="h-4 w-4 text-green-500" />
                    <span>Battery: 85%</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <Button
                    variant="primary"
                    className="flex-1 text-sm py-2"
                    disabled={!isOnline}
                >
                    Feed Now
                </Button>
                <button
                    onClick={() => onManage(feeder)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    <Settings className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

export default FeederCard;

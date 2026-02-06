import { Wifi, WifiOff, Settings, QrCode, PawPrint } from 'lucide-react';
import Button from './Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { cn } from '@/lib/utils';

const FeederCard = ({ feeder, onManage, onFeedNow }) => {
    const isOnline = feeder.status?.toLowerCase() === 'online';

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
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border/50 text-xs text-muted-foreground">
                    <QrCode className="h-3.5 w-3.5" />
                    <span className="font-mono">MAC: {feeder.serial_number?.match(/.{1,2}/g)?.join(':') || feeder.serial_number || 'N/A'}</span>
                </div>

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
                    Quick Feed
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

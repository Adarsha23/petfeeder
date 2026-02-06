import { Edit2, Calendar, Weight, PawPrint } from 'lucide-react';
import Button from './Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { cn } from '@/lib/utils';

const PetProfileCard = ({ petProfile, onEdit }) => {
    const getDefaultAvatar = (species) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(species)}&background=f4f4f5&color=71717a&size=200`;
    };

    return (
        <Card className="overflow-hidden border-border group">
            <div className="h-20 bg-muted/50 border-b border-border transition-colors group-hover:bg-muted/80"></div>

            <CardContent className="px-6 pb-6 -mt-10 space-y-4">
                <div className="flex items-end justify-between">
                    <div className="relative">
                        <img
                            src={petProfile.photo_url || petProfile.photo || getDefaultAvatar(petProfile.species || petProfile.name)}
                            alt={petProfile.name}
                            className="w-20 h-20 rounded-full border-4 border-background shadow-sm object-cover bg-background"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        className="h-8 gap-1.5"
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                    </Button>
                </div>

                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold tracking-tight">{petProfile.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-sm">
                        <PawPrint className="h-3.5 w-3.5" />
                        {petProfile.breed || petProfile.species}
                    </CardDescription>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-y border-border/50">
                    <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Age</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {petProfile.age > 0 ? `${petProfile.age} ${petProfile.age === 1 ? 'yr' : 'yrs'}` : 'N/A'}
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Weight</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Weight className="h-3.5 w-3.5 text-muted-foreground" />
                            {petProfile.weight > 0 ? `${petProfile.weight} kg` : 'N/A'}
                        </div>
                    </div>
                </div>

                {petProfile.dietaryRequirements && (
                    <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Daily Target</p>
                        <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/40 border border-border/50">
                            <div className="text-xs">
                                <span className="text-muted-foreground">Portion: </span>
                                <span className="font-semibold text-foreground">{petProfile.dietaryRequirements.portionSize || 0}g</span>
                            </div>
                            <div className="text-xs">
                                <span className="text-muted-foreground">Frequency: </span>
                                <span className="font-semibold text-foreground">{petProfile.dietaryRequirements.feedingFrequency || 0}x</span>
                            </div>
                        </div>
                        {petProfile.dietaryRequirements.restrictions && (
                            <div className="px-2 py-1.5 rounded bg-destructive/10 border border-destructive/20">
                                <p className="text-[10px] leading-tight text-destructive font-medium">
                                    ⚠️ {petProfile.dietaryRequirements.restrictions}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PetProfileCard;

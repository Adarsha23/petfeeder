import { Edit2, Calendar, Weight, PawPrint } from 'lucide-react';
import Button from './Button';

const PetProfileCard = ({ petProfile, onEdit }) => {
    const getDefaultAvatar = (species) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(species)}&background=random&size=200`;
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
            {/* Header with gradient */}
            <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-500"></div>

            {/* Content */}
            <div className="px-6 pb-6 -mt-12">
                {/* Pet Photo */}
                <div className="flex items-end justify-between mb-4">
                    <img
                        src={petProfile.photo_url || petProfile.photo || getDefaultAvatar(petProfile.species || petProfile.name)}
                        alt={petProfile.name}
                        className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    >
                        <Edit2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Edit</span>
                    </button>
                </div>

                {/* Pet Info */}
                <div className="space-y-3">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">{petProfile.name}</h3>
                        <p className="text-gray-600">{petProfile.breed || petProfile.species}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-3">
                        {petProfile.age > 0 && (
                            <div className="flex items-center gap-2 text-gray-700">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">
                                    {petProfile.age} {petProfile.age === 1 ? 'year' : 'years'} old
                                </span>
                            </div>
                        )}

                        {petProfile.weight > 0 && (
                            <div className="flex items-center gap-2 text-gray-700">
                                <Weight className="h-4 w-4 text-purple-600" />
                                <span className="text-sm">{petProfile.weight} kg</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-700">
                            <PawPrint className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{petProfile.species}</span>
                        </div>
                    </div>

                    {/* Dietary Info (if exists) */}
                    {(petProfile.dietaryRequirements?.portionSize ||
                        petProfile.dietaryRequirements?.feedingFrequency ||
                        petProfile.dietaryRequirements?.restrictions ||
                        petProfile.dietaryRequirements?.notes) && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Dietary Info</h4>
                                <div className="space-y-2 text-sm text-gray-600">
                                    {petProfile.dietaryRequirements.portionSize && (
                                        <p className="flex justify-between">
                                            <span>Portion:</span>
                                            <span className="font-bold text-gray-900">{petProfile.dietaryRequirements.portionSize}g</span>
                                        </p>
                                    )}
                                    {petProfile.dietaryRequirements.feedingFrequency && (
                                        <p className="flex justify-between">
                                            <span>Frequency:</span>
                                            <span className="font-bold text-gray-900">{petProfile.dietaryRequirements.feedingFrequency}x / day</span>
                                        </p>
                                    )}
                                    {petProfile.dietaryRequirements.restrictions && (
                                        <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 mt-2">
                                            <p className="text-orange-700 font-medium">⚠️ {petProfile.dietaryRequirements.restrictions}</p>
                                        </div>
                                    )}
                                    {petProfile.dietaryRequirements.notes && (
                                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 italic">
                                            <p>"{petProfile.dietaryRequirements.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
};

export default PetProfileCard;

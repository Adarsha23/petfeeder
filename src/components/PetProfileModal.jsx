import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createPetProfile, updatePetProfile, deletePetProfile, uploadPetPhoto } from '../services/petProfileService';
import Input from './Input';
import Button from './Button';
import ImageUpload from './ImageUpload';

const PetProfileModal = ({ isOpen, onClose, existingProfile = null }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        species: 'Dog',
        breed: '',
        age: '',
        weight: '',
        photo: null,
        dietaryRequirements: {
            portionSize: '',
            feedingFrequency: '',
            restrictions: '',
            notes: ''
        }
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDietary, setShowDietary] = useState(false);

    // Load existing profile data
    useEffect(() => {
        if (existingProfile) {
            setFormData({
                name: existingProfile.name || '',
                species: existingProfile.species || 'Dog',
                breed: existingProfile.breed || '',
                age: existingProfile.age?.toString() || '',
                weight: existingProfile.weight?.toString() || '',
                photo: existingProfile.photo || null,
                dietaryRequirements: {
                    portionSize: existingProfile.dietaryRequirements?.portionSize?.toString() || '',
                    feedingFrequency: existingProfile.dietaryRequirements?.feedingFrequency?.toString() || '',
                    restrictions: existingProfile.dietaryRequirements?.restrictions || '',
                    notes: existingProfile.dietaryRequirements?.notes || ''
                }
            });
            // Show dietary section if any dietary data exists
            if (existingProfile.dietaryRequirements?.portionSize ||
                existingProfile.dietaryRequirements?.feedingFrequency ||
                existingProfile.dietaryRequirements?.restrictions ||
                existingProfile.dietaryRequirements?.notes) {
                setShowDietary(true);
            }
        }
    }, [existingProfile]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Pet name is required';
        }

        if (formData.age && (isNaN(formData.age) || parseFloat(formData.age) < 0)) {
            newErrors.age = 'Age must be a positive number';
        }

        if (formData.weight && (isNaN(formData.weight) || parseFloat(formData.weight) <= 0)) {
            newErrors.weight = 'Weight must be a positive number';
        }

        if (formData.dietaryRequirements.portionSize &&
            (isNaN(formData.dietaryRequirements.portionSize) || parseFloat(formData.dietaryRequirements.portionSize) <= 0)) {
            newErrors.portionSize = 'Portion size must be a positive number';
        }

        if (formData.dietaryRequirements.feedingFrequency &&
            (isNaN(formData.dietaryRequirements.feedingFrequency) || parseFloat(formData.dietaryRequirements.feedingFrequency) <= 0)) {
            newErrors.feedingFrequency = 'Feeding frequency must be a positive number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            let photoUrl = formData.photo;

            // If photo is a File object, upload it first
            if (formData.photo instanceof File) {
                const { url, error: uploadError } = await uploadPetPhoto(formData.photo);
                if (uploadError) throw new Error(uploadError);
                photoUrl = url;
            }

            const petData = {
                name: formData.name.trim(),
                species: formData.species,
                breed: formData.breed.trim(),
                age: formData.age ? parseFloat(formData.age) : 0,
                weight: formData.weight ? parseFloat(formData.weight) : 0,
                photo: photoUrl,
                dietaryRequirements: {
                    portionSize: formData.dietaryRequirements.portionSize ? parseFloat(formData.dietaryRequirements.portionSize) : null,
                    feedingFrequency: formData.dietaryRequirements.feedingFrequency ? parseFloat(formData.dietaryRequirements.feedingFrequency) : null,
                    restrictions: formData.dietaryRequirements.restrictions.trim(),
                    notes: formData.dietaryRequirements.notes.trim()
                }
            };

            if (existingProfile) {
                await updatePetProfile(existingProfile.id, petData);
            } else {
                await createPetProfile(petData);
            }

            onClose(true); // Pass true to indicate success
        } catch (err) {
            alert(err.message || 'Failed to save pet profile');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const { error } = await deletePetProfile(existingProfile.id);
            if (error) throw new Error(error);
            onClose(true);
        } catch (err) {
            alert(err.message || 'Failed to delete pet profile');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith('dietary_')) {
            const fieldName = name.replace('dietary_', '');
            setFormData(prev => ({
                ...prev,
                dietaryRequirements: {
                    ...prev.dietaryRequirements,
                    [fieldName]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handlePhotoChange = (photo) => {
        setFormData(prev => ({ ...prev, photo }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {existingProfile ? 'Edit Pet Profile' : 'Add Pet Profile'}
                    </h2>
                    <button
                        onClick={() => onClose(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Photo Upload */}
                    <ImageUpload
                        value={formData.photo}
                        onChange={handlePhotoChange}
                    />

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Pet Name *"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Fluffy"
                            error={errors.name}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Species *
                            </label>
                            <select
                                name="species"
                                value={formData.species}
                                onChange={handleChange}
                                className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                                <option value="Dog">Dog</option>
                                <option value="Cat">Cat</option>
                            </select>
                        </div>
                    </div>

                    <Input
                        label="Breed (Optional)"
                        type="text"
                        name="breed"
                        value={formData.breed}
                        onChange={handleChange}
                        placeholder="Golden Retriever"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Age (years)"
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            placeholder="3"
                            error={errors.age}
                            step="0.1"
                            min="0"
                        />

                        <Input
                            label="Weight (kg)"
                            type="number"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            placeholder="25.5"
                            error={errors.weight}
                            step="0.1"
                            min="0"
                        />
                    </div>

                    {/* Dietary Requirements (Collapsible) */}
                    <div className="border border-gray-200 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setShowDietary(!showDietary)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-lg"
                        >
                            <span className="font-medium text-gray-900">
                                Dietary Requirements (Optional)
                            </span>
                            {showDietary ? (
                                <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                        </button>

                        {showDietary && (
                            <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Portion Size (grams)"
                                        type="number"
                                        name="dietary_portionSize"
                                        value={formData.dietaryRequirements.portionSize}
                                        onChange={handleChange}
                                        placeholder="150"
                                        error={errors.portionSize}
                                        step="1"
                                        min="0"
                                    />

                                    <Input
                                        label="Feeding Frequency (times/day)"
                                        type="number"
                                        name="dietary_feedingFrequency"
                                        value={formData.dietaryRequirements.feedingFrequency}
                                        onChange={handleChange}
                                        placeholder="2"
                                        error={errors.feedingFrequency}
                                        step="1"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Dietary Restrictions
                                    </label>
                                    <textarea
                                        name="dietary_restrictions"
                                        value={formData.dietaryRequirements.restrictions}
                                        onChange={handleChange}
                                        placeholder="e.g., No chicken, grain-free"
                                        rows="2"
                                        className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Notes
                                    </label>
                                    <textarea
                                        name="dietary_notes"
                                        value={formData.dietaryRequirements.notes}
                                        onChange={handleChange}
                                        placeholder="e.g., Prefers wet food in morning"
                                        rows="2"
                                        className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => onClose(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={loading}
                                className="flex-1"
                            >
                                {existingProfile ? 'Save Changes' : 'Create Profile'}
                            </Button>
                        </div>

                        {existingProfile && !showDeleteConfirm && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full py-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                            >
                                <Trash2 className="h-4 w-4 inline mr-2" />
                                Delete Pet Profile
                            </button>
                        )}

                        {showDeleteConfirm && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 mb-2">Delete {formData.name}?</h4>
                                <p className="text-sm text-gray-600 mb-6">
                                    This action cannot be undone. All feeding history for this pet will be lost.
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={deleting}
                                    >
                                        Keep Pet
                                    </Button>
                                    <Button
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                        onClick={handleDelete}
                                        loading={deleting}
                                    >
                                        Yes, Delete
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PetProfileModal;

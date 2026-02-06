import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Trash2, AlertTriangle, Dog, Cat, Info, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createPetProfile, updatePetProfile, deletePetProfile, uploadPetPhoto } from '../services/petProfileService';
import Input from './Input';
import Button from './Button';
import ImageUpload from './ImageUpload';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { cn } from '@/lib/utils';

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
        if (!formData.name.trim()) newErrors.name = 'Pet name is required';
        if (formData.age && (isNaN(formData.age) || parseFloat(formData.age) < 0)) newErrors.age = 'Age must be positive';
        if (formData.weight && (isNaN(formData.weight) || parseFloat(formData.weight) <= 0)) newErrors.weight = 'Weight must be positive';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            let photoUrl = formData.photo;
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
            onClose(true);
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
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <Card className="max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200">
                <CardHeader className="border-b border-border bg-muted/30 px-6 py-4 flex flex-row items-center justify-between shrink-0">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">
                            {existingProfile ? 'Update Profile' : 'New Pet Member'}
                        </CardTitle>
                        <CardDescription className="text-xs uppercase font-bold tracking-widest leading-none mt-1">
                            {existingProfile ? `Modifying ${existingProfile.name}'s info` : 'Add your furry friend'}
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onClose(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Photo */}
                    <div className="flex justify-center pb-2">
                        <div className="relative group">
                            <ImageUpload
                                value={formData.photo}
                                onChange={(p) => setFormData(prev => ({ ...prev, photo: p }))}
                            />
                            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg border-2 border-background">
                                <Camera className="h-3.5 w-3.5" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Pet Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Luna"
                            error={errors.name}
                            required
                        />
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Species</label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formData.species === 'Dog' ? 'default' : 'outline'}
                                    className="flex-1 gap-2"
                                    onClick={() => setFormData(prev => ({ ...prev, species: 'Dog' }))}
                                >
                                    <Dog className="h-4 w-4" /> Dog
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.species === 'Cat' ? 'default' : 'outline'}
                                    className="flex-1 gap-2"
                                    onClick={() => setFormData(prev => ({ ...prev, species: 'Cat' }))}
                                >
                                    <Cat className="h-4 w-4" /> Cat
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Input
                        label="Breed / Description"
                        name="breed"
                        value={formData.breed}
                        onChange={handleChange}
                        placeholder="e.g. Golden Retriever"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Age (Years)"
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            placeholder="3"
                            step="0.1"
                        />
                        <Input
                            label="Weight (kg)"
                            type="number"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            placeholder="25.5"
                            step="0.1"
                        />
                    </div>

                    {/* Dietary Section */}
                    <div className="space-y-4 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowDietary(!showDietary)}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/80 transition-colors border border-border"
                        >
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" />
                                <span className="text-sm font-bold uppercase tracking-tight">Dietary Requirements</span>
                            </div>
                            {showDietary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        {showDietary && (
                            <div className="space-y-4 p-4 border border-border rounded-lg bg-background animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Portion (g)"
                                        type="number"
                                        name="dietary_portionSize"
                                        value={formData.dietaryRequirements.portionSize}
                                        onChange={handleChange}
                                        placeholder="150"
                                    />
                                    <Input
                                        label="Meals / Day"
                                        type="number"
                                        name="dietary_feedingFrequency"
                                        value={formData.dietaryRequirements.feedingFrequency}
                                        onChange={handleChange}
                                        placeholder="2"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium leading-none">Restrictions</label>
                                    <textarea
                                        name="dietary_restrictions"
                                        value={formData.dietaryRequirements.restrictions}
                                        onChange={handleChange}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="e.g. No chicken, grain-free"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {existingProfile && !showDeleteConfirm && (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" /> Discard Profile
                        </Button>
                    )}

                    {showDeleteConfirm && (
                        <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-xl text-center space-y-4 animate-in fade-in zoom-in-95">
                            <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
                            <div>
                                <h4 className="font-bold text-foreground">Remove {formData.name}?</h4>
                                <p className="text-xs text-muted-foreground mt-1 px-4">This will permanently delete this profile and all associated feeding logs.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Keep Profile</Button>
                                <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-white" onClick={handleDelete} loading={deleting}>Confirm Delete</Button>
                            </div>
                        </div>
                    )}
                </form>

                <CardFooter className="border-t border-border bg-muted/30 px-6 py-4 flex gap-3 shrink-0">
                    <Button variant="outline" className="flex-1" onClick={() => onClose(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1" loading={loading} onClick={handleSubmit}>
                        {existingProfile ? 'Save Changes' : 'Create Profile'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default PetProfileModal;

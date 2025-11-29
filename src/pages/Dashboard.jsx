import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, PawPrint, Settings, Bell, Plus, Wifi } from 'lucide-react';
import { getPetProfile } from '../utils/petProfileService';
import { getUserFeeders } from '../utils/feederService';
import Button from '../components/Button';
import PetProfileModal from '../components/PetProfileModal';
import PetProfileCard from '../components/PetProfileCard';
import AddFeederModal from '../components/AddFeederModal';
import FeederCard from '../components/FeederCard';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Pet Profile State
    const [petProfile, setPetProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [showPetModal, setShowPetModal] = useState(false);

    // Feeder State
    const [feeders, setFeeders] = useState([]);
    const [loadingFeeders, setLoadingFeeders] = useState(true);
    const [showFeederModal, setShowFeederModal] = useState(false);

    // Load data on mount
    useEffect(() => {
        if (user) {
            loadPetProfile();
            loadFeeders();
        }
    }, [user]);

    const loadPetProfile = async () => {
        setLoadingProfile(true);
        try {
            const profile = await getPetProfile(user.id);
            setPetProfile(profile);
        } catch (err) {
            console.error('Failed to load pet profile:', err);
        } finally {
            setLoadingProfile(false);
        }
    };

    const loadFeeders = async () => {
        setLoadingFeeders(true);
        try {
            const userFeeders = await getUserFeeders(user.id);
            setFeeders(userFeeders);
        } catch (err) {
            console.error('Failed to load feeders:', err);
        } finally {
            setLoadingFeeders(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handlePetModalClose = (success) => {
        setShowPetModal(false);
        if (success) loadPetProfile();
    };

    const handleFeederModalClose = (success) => {
        setShowFeederModal(false);
        if (success) loadFeeders();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-2">
                            <PawPrint className="h-8 w-8 text-blue-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Smart Pet Feeder</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                                <Bell className="h-5 w-5" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                                <Settings className="h-5 w-5" />
                            </button>
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                                <img
                                    src={user?.avatar}
                                    alt={user?.name}
                                    className="h-10 w-10 rounded-full border-2 border-blue-600"
                                />
                                <div className="hidden sm:block">
                                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                icon={LogOut}
                                className="hidden sm:inline-flex"
                            >
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Welcome back, {user?.name?.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-gray-600 mt-2">
                        Manage your pet profile and monitor feeding activity.
                    </p>
                </div>

                {/* Pet Profile Section */}
                <div className="mb-8">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Pet Profile</h3>
                    </div>

                    {loadingProfile ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Loading pet profile...</p>
                        </div>
                    ) : petProfile ? (
                        <PetProfileCard
                            petProfile={petProfile}
                            onEdit={() => setShowPetModal(true)}
                        />
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PawPrint className="h-10 w-10 text-gray-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                No pet profile yet
                            </h4>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Create a profile for your pet to get started with personalized feeding management.
                            </p>
                            <Button
                                variant="primary"
                                icon={Plus}
                                onClick={() => setShowPetModal(true)}
                            >
                                Add Pet Profile
                            </Button>
                        </div>
                    )}
                </div>

                {/* Feeders Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900">My Feeders</h3>
                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => setShowFeederModal(true)}
                        >
                            Add Feeder
                        </Button>
                    </div>

                    {loadingFeeders ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Loading feeders...</p>
                        </div>
                    ) : feeders.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {feeders.map((feeder) => (
                                <FeederCard
                                    key={feeder.id}
                                    feeder={feeder}
                                    onManage={(f) => console.log('Manage', f)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wifi className="h-10 w-10 text-gray-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                No feeders yet
                            </h4>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Add your first feeder to start managing your pet's feeding schedule.
                            </p>
                            <Button
                                variant="primary"
                                icon={Plus}
                                onClick={() => setShowFeederModal(true)}
                            >
                                Add Your First Feeder
                            </Button>
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Multi-User Control</h4>
                    <p className="text-blue-800 text-sm">
                        Once you add a feeder, you can invite family members to help manage it.
                        All feeding actions will show who performed them, keeping everyone informed.
                    </p>
                </div>
            </main>

            {/* Modals */}
            <PetProfileModal
                isOpen={showPetModal}
                onClose={handlePetModalClose}
                existingProfile={petProfile}
            />

            <AddFeederModal
                isOpen={showFeederModal}
                onClose={handleFeederModalClose}
            />
        </div>
    );
};

export default Dashboard;

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, PawPrint, Settings, Bell, Plus, Wifi, Menu } from 'lucide-react';
import { getPetProfiles } from '../services/petProfileService';
import { getUserDevices } from '../services/deviceService';
import { queueFeedCommand } from '../services/commandService';
import Button from '../components/Button';
import PetProfileModal from '../components/PetProfileModal';
import PetProfileCard from '../components/PetProfileCard';
import AddFeederModal from '../components/AddFeederModal';
import FeederCard from '../components/FeederCard';
import FeedNowModal from '../components/FeedNowModal';
import FeedingHistory from '../components/FeedingHistory';
import ManageFeederModal from '../components/ManageFeederModal';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Pet Profile State
    const [petProfiles, setPetProfiles] = useState([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [showPetModal, setShowPetModal] = useState(false);
    const [editingPet, setEditingPet] = useState(null);

    // Feeder State
    const [feeders, setFeeders] = useState([]);
    const [loadingFeeders, setLoadingFeeders] = useState(true);
    const [showFeederModal, setShowFeederModal] = useState(false);

    // Feed Now State
    const [showFeedModal, setShowFeedModal] = useState(false);
    const [selectedFeeder, setSelectedFeeder] = useState(null);

    // Manage Feeder State
    const [showManageModal, setShowManageModal] = useState(false);
    const [feederToManage, setFeederToManage] = useState(null);

    // Sidebar/Mobile Navigation
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Load data on mount
    useEffect(() => {
        if (user) {
            loadPetProfile();
            loadFeeders();
        }
    }, [user]);

    const refreshDashboard = () => {
        loadPetProfile();
        loadFeeders();
    };

    const loadPetProfile = async () => {
        // Only show loading if we don't have any profiles yet
        if (petProfiles.length === 0) setLoadingProfile(true);
        try {
            const { data, error } = await getPetProfiles();
            if (error) throw new Error(error);
            setPetProfiles(data || []);
        } catch (err) {
            console.error('Failed to load pet profile:', err);
        } finally {
            setLoadingProfile(false);
        }
    };

    const loadFeeders = async () => {
        // Only show loading if we don't have any feeders yet
        if (feeders.length === 0) setLoadingFeeders(true);
        try {
            const { data, error } = await getUserDevices();
            if (error) throw new Error(error);
            setFeeders(data || []);
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
        setEditingPet(null);
        if (success) loadPetProfile();
    };

    const handleEditPet = (pet) => {
        setEditingPet(pet);
        setShowPetModal(true);
    };

    const handleFeederModalClose = (success) => {
        setShowFeederModal(false);
        if (success) loadFeeders();
    };

    const handleFeedNow = (feeder) => {
        setSelectedFeeder(feeder);
        setShowFeedModal(true);
    };

    const handleManageFeeder = (feeder) => {
        setFeederToManage(feeder);
        setShowManageModal(true);
    };

    const handleFeederUpdate = (success) => {
        setShowManageModal(false);
        if (success) loadFeeders();
    };

    const handleFeederRefresh = async () => {
        await loadFeeders();
        // Re-select the same feeder with updated data
        if (feederToManage) {
            const { data } = await getUserDevices();
            const updated = data?.find(f => f.id === feederToManage.id);
            if (updated) setFeederToManage(updated);
        }
    };

    const handleFeed = async (feederId, portionSize, petId) => {
        const { data, error } = await queueFeedCommand(feederId, portionSize, petId);
        if (error) throw new Error(error);

        // Refresh data to show pending status
        setTimeout(loadFeeders, 500);
        return data;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Navigation Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-72 min-w-0 transition-all duration-300">
                {/* Mobile Header */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 lg:hidden px-4 py-4">
                    <div className="flex justify-between items-center text-gray-900">
                        <div className="flex items-center gap-2">
                            <PawPrint className="h-6 w-6 text-blue-600" />
                            <h1 className="text-lg font-bold">PetFeeder</h1>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -mr-2 text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-10">
                    {/* Page Header (Desktop) */}
                    <div className="hidden lg:flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Overview</h1>
                            <p className="text-gray-500 mt-1">Hello, {user?.name?.split(' ')[0] || 'User'}! Here is what's happening today.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-3 text-gray-400 hover:text-blue-600 rounded-2xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all duration-200">
                                <Bell className="h-5 w-5" />
                            </button>
                            <button className="p-3 text-gray-400 hover:text-blue-600 rounded-2xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all duration-200">
                                <Settings className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="xl:grid xl:grid-cols-3 xl:gap-10 items-start">
                        {/* Main Stream Column */}
                        <div className="xl:col-span-2 space-y-10">
                            {/* Pet Profile */}
                            <div>
                                <div className="flex justify-between items-end mb-6">
                                    {petProfiles.length > 0 && (
                                        <button
                                            onClick={() => {
                                                setEditingPet(null);
                                                setShowPetModal(true);
                                            }}
                                            className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg"
                                        >
                                            Add Profile
                                        </button>
                                    )}
                                </div>

                                {loadingProfile ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-64 bg-white rounded-3xl border border-gray-100"></div>
                                        ))}
                                    </div>
                                ) : petProfiles.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {petProfiles.map((profile) => (
                                            <PetProfileCard
                                                key={profile.id}
                                                petProfile={profile}
                                                onEdit={() => handleEditPet(profile)}
                                            />
                                        ))}
                                        {/* Add Another Pet Button */}
                                        <button
                                            onClick={() => {
                                                setEditingPet(null);
                                                setShowPetModal(true);
                                            }}
                                            className="h-full flex flex-col items-center justify-center bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-3xl p-8 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                                        >
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                                <Plus className="h-6 w-6 text-blue-500" />
                                            </div>
                                            <p className="font-bold text-gray-900">Add Another Pet</p>
                                            <p className="text-xs text-gray-500 mt-1">Manage multiple pet profiles</p>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-100 p-12 text-center group hover:border-blue-200 transition-all duration-300">
                                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                                            <PawPrint className="h-10 w-10 text-blue-400" />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900 mb-2">Build your first pet profile</h4>
                                        <p className="text-gray-500 mb-10 max-w-sm mx-auto leading-relaxed">
                                            Personalize your feeding experience by adding your pet's details and dietary needs.
                                        </p>
                                        <Button
                                            variant="primary"
                                            icon={Plus}
                                            onClick={() => setShowPetModal(true)}
                                            className="shadow-xl shadow-blue-100"
                                        >
                                            Create Profile
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Feeders Grid */}
                            <div className="bg-white rounded-[2.5rem] shadow-sm shadow-gray-200/40 border border-gray-100 p-8 lg:p-10">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-xl font-bold text-gray-900">Connected Feeders</h3>
                                    <Button
                                        variant="primary"
                                        icon={Plus}
                                        onClick={() => setShowFeederModal(true)}
                                        className="text-sm py-2.5 px-5 shadow-lg shadow-blue-100"
                                    >
                                        Add Feeder
                                    </Button>
                                </div>

                                {loadingFeeders ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-pulse">
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-56 bg-gray-50 rounded-[2rem] border border-gray-100"></div>
                                        ))}
                                    </div>
                                ) : feeders.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        {feeders.map((feeder) => (
                                            <FeederCard
                                                key={feeder.id}
                                                feeder={feeder}
                                                onManage={handleManageFeeder}
                                                onFeedNow={handleFeedNow}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Wifi className="h-12 w-12 text-gray-200" />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900 mb-3">No active feeders</h4>
                                        <p className="text-gray-500 mb-10 max-w-xs mx-auto">
                                            Connect your smart pet feeder to start automated feeding.
                                        </p>
                                        <Button
                                            variant="primary"
                                            icon={Plus}
                                            onClick={() => setShowFeederModal(true)}
                                            className="shadow-xl shadow-blue-100"
                                        >
                                            Connect Device
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity Column */}
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-6 px-1">Feeding Activity</h3>
                                <FeedingHistory feeders={feeders} />
                            </div>

                            {/* Reliable Feeding Card */}
                            <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-200/50 relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                                    <Wifi className="h-48 w-48" />
                                </div>
                                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 w-fit mb-6">
                                    <Wifi className="h-6 w-6 text-white" />
                                </div>
                                <h4 className="text-2xl font-black mb-4 tracking-tight leading-tight">Reliable Offline Feeding 📶</h4>
                                <p className="text-blue-50/90 leading-relaxed font-medium mb-8">
                                    Even if your internet goes down, your scheduled feedings are stored locally on the device to ensure your pet never misses a meal.
                                </p>
                                <button className="px-6 py-3 bg-white text-blue-600 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg">
                                    Device Status
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <PetProfileModal
                isOpen={showPetModal}
                onClose={handlePetModalClose}
                existingProfile={editingPet}
            />

            <AddFeederModal
                isOpen={showFeederModal}
                onClose={handleFeederModalClose}
                petProfiles={petProfiles}
            />

            <FeedNowModal
                isOpen={showFeedModal}
                onClose={() => setShowFeedModal(false)}
                feeder={selectedFeeder}
                petProfiles={petProfiles}
                onFeed={handleFeed}
            />

            <ManageFeederModal
                isOpen={showManageModal}
                onClose={() => setShowManageModal(false)}
                feeder={feederToManage}
                petProfiles={petProfiles}
                onUpdate={handleFeederUpdate}
                onRefresh={handleFeederRefresh}
            />
        </div>
    );
};

export default Dashboard;

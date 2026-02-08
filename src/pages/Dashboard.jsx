import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, PawPrint, Settings, Bell, Plus, Wifi, Menu, Activity, ShieldCheck, Zap } from 'lucide-react';
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { cn } from '@/lib/utils';

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

    const loadPetProfile = async () => {
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
        if (feederToManage) {
            const { data } = await getUserDevices();
            const updated = data?.find(f => f.id === feederToManage.id);
            if (updated) setFeederToManage(updated);
        }
    };

    const handleFeed = async (feederId, portionSize, petId) => {
        const { data, error } = await queueFeedCommand(feederId, portionSize, petId);
        if (error) throw new Error(error);
        setTimeout(loadFeeders, 500);
        return data;
    };

    const activeFeedersCount = feeders.filter(f => f.status?.toLowerCase() === 'online').length;

    return (
        <div className="min-h-screen bg-background flex font-inter">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="flex-1 lg:ml-64 min-w-0 transition-all">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
                    <div className="flex justify-between items-center max-w-7xl mx-auto">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard</h1>
                                <p className="text-xs text-muted-foreground hidden sm:block">Welcome back, {user?.name?.split(' ')[0] || 'User'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-9 w-9">
                                <Bell className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                icon={Plus}
                                onClick={() => setShowPetModal(true)}
                                className="hidden sm:flex"
                            >
                                Add Pet
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto p-6 space-y-8">
                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="border-border bg-card">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Pets</p>
                                    <PawPrint className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-2xl font-bold">{petProfiles.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Manage your furry family members
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-border bg-card">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Active Feeders</p>
                                    <Wifi className="h-4 w-4 text-success" />
                                </div>
                                <div className="text-2xl font-bold">{activeFeedersCount} / {feeders.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Devices currently heartbeating
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Main Stream */}
                        <div className="xl:col-span-2 space-y-8">
                            {/* Pet Profiles Section */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold tracking-tight">Your Pets</h3>
                                    <Button variant="ghost" size="sm" onClick={() => setShowPetModal(true)} className="text-xs">
                                        Manage
                                    </Button>
                                </div>
                                {loadingProfile ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-48 bg-muted rounded-xl border border-border"></div>
                                        ))}
                                    </div>
                                ) : petProfiles.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {petProfiles.map((profile) => (
                                            <PetProfileCard
                                                key={profile.id}
                                                petProfile={profile}
                                                onEdit={() => handleEditPet(profile)}
                                            />
                                        ))}
                                        <button
                                            onClick={() => {
                                                setEditingPet(null);
                                                setShowPetModal(true);
                                            }}
                                            className="group flex flex-col items-center justify-center bg-muted/30 border-2 border-dashed border-border rounded-xl p-8 hover:bg-muted/50 hover:border-primary/50 transition-all"
                                        >
                                            <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                                <Plus className="h-5 w-5 text-primary" />
                                            </div>
                                            <p className="text-sm font-bold">Add Pet</p>
                                        </button>
                                    </div>
                                ) : (
                                    <Card className="border-2 border-dashed bg-muted/20 p-12 text-center">
                                        <PawPrint className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                                        <h4 className="text-lg font-bold">Build your fleet</h4>
                                        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                                            Start by adding your first pet profile to unlock automated feeding logic.
                                        </p>
                                        <Button icon={Plus} onClick={() => setShowPetModal(true)}>
                                            Create Profile
                                        </Button>
                                    </Card>
                                )}
                            </section>

                            {/* Feeders Section */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold tracking-tight">Connected Devices</h3>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => setShowFeederModal(true)}
                                        className="text-xs h-8 px-4 font-bold uppercase tracking-wider"
                                    >
                                        Add Feeder
                                    </Button>
                                </div>
                                {loadingFeeders ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-52 bg-muted rounded-xl border border-border"></div>
                                        ))}
                                    </div>
                                ) : feeders.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                    <Card className="p-12 text-center border-2 border-dashed bg-muted/20">
                                        <Wifi className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                                        <h4 className="text-lg font-bold">Link a feeder</h4>
                                        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                                            Connect your smart feeder to your home Wi-Fi and link it to your account.
                                        </p>
                                        <Button icon={Plus} onClick={() => setShowFeederModal(true)}>
                                            Pair Device
                                        </Button>
                                    </Card>
                                )}
                            </section>
                        </div>

                        {/* Activity Feed */}
                        <aside className="space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-lg font-bold tracking-tight">Live Feed</h3>
                                <Activity className="h-4 w-4 text-primary animate-pulse" />
                            </div>
                            <FeedingHistory feeders={feeders} />
                        </aside>
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

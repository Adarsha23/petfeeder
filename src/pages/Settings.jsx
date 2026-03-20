import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import Button from '../components/Button';
import { Menu, User, Mail, Shield, Bell, Smartphone, LogOut, Save, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Settings = () => {
    const { user, logout, refreshUser } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update Supabase Auth user metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { full_name: displayName }
            });
            if (updateError) throw updateError;
            
            // Re-fetch the user to update AuthContext and current session
            await refreshUser();
            
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to update profile:', err);
            alert('Failed to update profile: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex font-inter">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 lg:ml-64 min-w-0 transition-all">
                <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
                    <div className="flex justify-between items-center max-w-3xl mx-auto text-inter">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground">
                                <Menu className="h-5 w-5" />
                            </button>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Account</h1>
                        </div>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleSave}
                            loading={saving}
                            disabled={saving}
                            className="shadow-sm"
                        >
                            {saved ? <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                            {saved ? 'Saved!' : 'Save Changes'}
                        </Button>
                    </div>
                </header>

                <div className="max-w-3xl mx-auto p-6 space-y-6">
                    {/* Profile */}
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-bold">Profile</CardTitle>
                            <CardDescription>Your account information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-5">
                                <div className="h-20 w-20 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center">
                                    <User className="h-9 w-9 text-primary/40" />
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-foreground tracking-tight leading-none uppercase">{user?.user_metadata?.full_name || 'Anonymous User'}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
                                        <Mail className="h-3.5 w-3.5" />
                                        {user?.email || 'No email attached'}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Full Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full h-10 px-3 py-2 text-sm border border-border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Email Address</label>
                                    <input
                                        type="email"
                                        defaultValue={user?.email || ''}
                                        disabled
                                        className="w-full h-10 px-3 py-2 text-sm border border-border rounded-md bg-muted/30 text-muted-foreground cursor-not-allowed italic font-medium"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Bell className="h-4 w-4 text-primary" /> Notification Center
                            </CardTitle>
                            <CardDescription>Configure your feeding alerts and device heartbeats</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            {[
                                { label: 'Feed Complete', desc: 'Notify when a scheduled or manual feed executes successfully.' },
                                { label: 'Low Food Alert', desc: 'Alert when hopper capacity drops below 15%.' },
                                { label: 'Low Water Alert', desc: 'Alert when the water bowl reaches replacement level.' },
                                { label: 'Device Offline', desc: 'Notify if a feeder loses its heartbeats for over 5 minutes.' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-3.5 border-b border-border/50 last:border-0">
                                    <div>
                                        <p className="text-sm font-bold tracking-tight text-foreground">{item.label}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                                    </div>
                                    <button
                                        className="w-10 h-5 rounded-full bg-primary relative transition-all"
                                    >
                                        <div className="w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] left-[23px] shadow-sm" />
                                    </button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="border-destructive/20 bg-destructive/[0.02] shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-bold text-destructive">Account Management</CardTitle>
                            <CardDescription>Danger zone actions are irreversible</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <p className="text-sm font-bold text-foreground">Sign Out</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Disconnect your current session on this device</p>
                                </div>
                                <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10 bg-transparent" onClick={logout}>
                                    <LogOut className="h-3.5 w-3.5 mr-2" /> DISCONNECT
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default Settings;

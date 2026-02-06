import { Link } from 'react-router-dom';
import { PawPrint, Scale, Wifi, Users, Bell, Clock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import Button from '../components/Button';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '@/lib/utils';

const Home = () => {
    return (
        <div className="min-h-screen bg-background text-foreground font-inter selection:bg-primary/10">
            {/* Header */}
            <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary p-1.5 rounded-lg">
                                <PawPrint className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight">
                                Smart Pet Feeder
                            </h1>
                        </div>
                        <nav className="flex items-center gap-4">
                            <Link to="/login">
                                <Button variant="ghost" size="sm" className="font-semibold">
                                    Login
                                </Button>
                            </Link>
                            <Link to="/signup">
                                <Button variant="default" size="sm" className="font-semibold px-5">
                                    Get Started
                                </Button>
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-6">
                            <Zap className="h-3 w-3 text-primary animate-pulse" />
                            Next-Gen Pet Care Integration
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-foreground mb-6 leading-[1.1]">
                            Feed Your Pet with<br />
                            <span className="text-muted-foreground">Precision & Care</span>
                        </h2>
                        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                            A premium, IoT-enabled ecosystem for modern pet parents.
                            Precise portion control, real-time analytics, and bulletproof reliability.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link to="/signup" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:px-10 h-12 text-base font-bold uppercase tracking-wide gap-2">
                                    Create Account
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link to="/login" className="w-full sm:w-auto">
                                <Button variant="outline" size="lg" className="w-full sm:px-10 h-12 text-base font-bold uppercase tracking-wide">
                                    Sign In
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-5 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-[120px]" />
                </div>
            </section>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                <div className="flex flex-col items-center text-center space-y-4 mb-16">
                    <h3 className="text-3xl font-black tracking-tighter uppercase sm:text-4xl">
                        Advanced Features
                    </h3>
                    <p className="text-muted-foreground max-w-lg">
                        Engineered for accuracy and peace of mind. Every detail optimized for your pet's health.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={Scale}
                        title="Precise Portions"
                        description="Closed-loop weight-based dispensing ensures accurate feeding every time, not just timed guesses."
                    />
                    <FeatureCard
                        icon={Wifi}
                        title="Remote Control"
                        description="Monitor and control feeding from anywhere. Works offline and syncs when reconnected."
                    />
                    <FeatureCard
                        icon={Users}
                        title="Multi-Caregiver"
                        description="Share access with family members. Everyone can help, and you'll know who fed your pet."
                    />
                    <FeatureCard
                        icon={Bell}
                        title="Smart Alerts"
                        description="Get mission-critical alerts for feeding completion, low food levels, and connectivity."
                    />
                    <FeatureCard
                        icon={Clock}
                        title="Analytics"
                        description="Track feeding patterns over time with detailed logs and comprehensive analytics dashboard."
                    />
                    <FeatureCard
                        icon={ShieldCheck}
                        title="Failsafe Design"
                        description="Hardware-level verification ensures your pet is fed even during server maintenance or WiFi drops."
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-background border-t border-border mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-2">
                            <PawPrint className="h-6 w-6 text-primary" />
                            <span className="text-lg font-bold tracking-tight">Smart Pet Feeder</span>
                        </div>
                        <div className="flex flex-col items-center md:items-end">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                FYP | Herald College Kathmandu
                            </p>
                            <p className="text-sm text-foreground/80 font-medium">
                                Adarsha Prasai (2408599)
                            </p>
                        </div>
                    </div>
                    <div className="mt-12 pt-8 border-t border-border/50 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                            © 2025 Smart Pet Feeder. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, description }) => {
    return (
        <Card className="hover:border-primary/50 transition-all duration-300 group">
            <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <Icon className="h-6 w-6 transition-transform group-hover:scale-110" />
                </div>
                <h4 className="text-lg font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">{title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </CardContent>
        </Card>
    );
};

export default Home;

import { Link } from 'react-router-dom';
import { PawPrint, Scale, Wifi, Users, Bell, Clock } from 'lucide-react';

const Home = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-2">
                            <PawPrint className="h-8 w-8 text-blue-600" />
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Smart Pet Feeder
                            </h1>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                to="/login"
                                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all shadow-md hover:shadow-lg"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-5xl font-bold text-gray-900 mb-6">
                        Feed Your Pet with
                        <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Precision & Care
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                        IoT-enabled smart feeding system with precise portion control, remote monitoring,
                        and comprehensive analytics. Perfect for busy pet parents.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            to="/signup"
                            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
                        >
                            Create Account
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 font-semibold text-lg transition-all shadow-lg border-2 border-blue-600"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
                    Everything You Need for Smart Pet Care
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={Scale}
                        title="Precise Portions"
                        description="Closed-loop weight-based dispensing ensures accurate feeding every time, not just timed guesses."
                        gradient="from-blue-500 to-cyan-500"
                    />
                    <FeatureCard
                        icon={Wifi}
                        title="Remote Control"
                        description="Monitor and control feeding from anywhere. Works offline and syncs when reconnected."
                        gradient="from-purple-500 to-pink-500"
                    />
                    <FeatureCard
                        icon={Users}
                        title="Multi-Caregiver"
                        description="Share access with family members. Everyone can help, and you'll know who fed your pet."
                        gradient="from-orange-500 to-red-500"
                    />
                    <FeatureCard
                        icon={Bell}
                        title="Smart Notifications"
                        description="Get alerts for feeding completion, low food, low water, and connection issues."
                        gradient="from-green-500 to-teal-500"
                    />
                    <FeatureCard
                        icon={Clock}
                        title="Feeding History"
                        description="Track feeding patterns over time with detailed logs and analytics dashboard."
                        gradient="from-indigo-500 to-purple-500"
                    />
                    <FeatureCard
                        icon={PawPrint}
                        title="Pet Profiles"
                        description="Manage pet information, dietary requirements, and feeding preferences in one place."
                        gradient="from-pink-500 to-rose-500"
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-600">
                        FYP Project - Herald College Kathmandu | Adarsha Prasai (2408599)
                    </p>
                    <p className="text-center text-gray-500 text-sm mt-2">
                        © 2025 Smart Pet Feeder. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, description, gradient }) => {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">{title}</h4>
            <p className="text-gray-600">{description}</p>
        </div>
    );
};

export default Home;

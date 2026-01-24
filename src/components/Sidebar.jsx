import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    BarChart3,
    Heart,
    Wifi,
    Settings,
    LogOut,
    PawPrint
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: BarChart3, label: 'Analytics', path: '/analytics' },
        { icon: Heart, label: 'Pet Health', path: '/health' },
        { icon: Wifi, label: 'Devices', path: '/devices' },
        { icon: Settings, label: 'Account', path: '/settings' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-gray-100 z-50 transition-transform duration-300 lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Brand */}
                    <div className="p-8 pb-4">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                                <PawPrint className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                PetFeeder
                            </h1>
                        </div>

                        {/* User Profile Summary */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl mb-8">
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=random`}
                                alt="Avatar"
                                className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
                            />
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                    {user?.email?.split('@')[0] || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">Pet Owner</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100/50'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                                `}
                            >
                                <item.icon className={`h-5 w-5 transition-colors ${isOpen ? 'animate-in fade-in slide-in-from-left-4 duration-300' : ''}`} />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Bottom Actions */}
                    <div className="p-4 border-t border-gray-50 space-y-2">
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                        >
                            <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

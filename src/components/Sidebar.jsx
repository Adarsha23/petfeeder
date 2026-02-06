import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    BarChart3,
    Settings,
    LogOut,
    PawPrint,
    Clock,
    TrendingUp,
    X,
    Menu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Clock, label: 'Schedules', path: '/schedules' },
        { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
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
                fixed top-0 left-0 bottom-0 w-64 bg-card border-r border-border z-50 transition-transform duration-300 lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Brand */}
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-8 px-2">
                            <div className="bg-primary p-2 rounded-lg">
                                <PawPrint className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <h1 className="text-lg font-bold tracking-tight text-foreground">
                                SmartFeeder AI
                            </h1>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all group
                                    ${isActive
                                        ? 'bg-muted text-foreground'
                                        : 'text-muted-foreground hover:bg-transparent hover:text-foreground'}
                                `}
                            >
                                <item.icon className="h-4 w-4 transition-colors" />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Bottom Actions */}
                    <div className="p-4 border-t border-border space-y-2">
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-all group"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

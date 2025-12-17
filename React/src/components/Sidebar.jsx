import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { userRole, signOut } = useAuth();

    const isActive = (path) => {
        // Special case: highlight "SQL Playground" when on related pages
        if (path === '/sql-playground') {
            const sqlPlaygroundPages = [
                '/dataset-upload',
                '/create-assessment',
                '/reports',
                '/assessments-list',
                '/users-cohorts',
                '/available-datasets',
                '/sql-playground/create-assessment'
            ];
            const params = new URLSearchParams(location.search);
            const from = params.get('from');

            // Check if it's a direct sub-route or has the query param
            if (location.pathname.startsWith('/sql-playground')) {
                return true;
            }
            if (sqlPlaygroundPages.includes(location.pathname)) {
                // For shared pages like reports, check the 'from' param if needed, or if it's strongly owned
                if (location.pathname === '/users-cohorts' || location.pathname === '/available-datasets' || location.pathname === '/sql-playground/create-assessment') return true;
                if (from === 'sql-playground') return true;
            }
        }

        // Special case: highlight "Assessments" when on related pages
        if (path === '/assessments') {
            const assessmentsPages = ['/dataset-upload', '/create-assessment', '/reports', '/assessments-list', '/assessment/take/', '/assessment/results/'];
            const params = new URLSearchParams(location.search);
            const from = params.get('from');
            // Check for nested assessment routes
            if (location.pathname.startsWith('/assessments') || location.pathname.startsWith('/assessment/')) {
                return true;
            }

            if (assessmentsPages.includes(location.pathname) && from === 'assessments') {
                return true;
            }
        }

        return location.pathname === path;
    };

    // All users can see these
    const baseNavItems = [
        { path: '/dashboard', label: 'Dashboard', icon: 'grid_view' },
        { path: '/virtual-machine', label: 'Virtual Machine', icon: 'computer' },
        { path: '/cloud-console', label: 'Cloud Console', icon: 'vpn_key' },
        { path: '/cloud-labs', label: 'Cloud Labs', icon: 'cloud' },
    ];

    // Admin and Trainer can see these
    const adminTrainerItems = [
        { path: '/sql-playground', label: 'SQL Playground', icon: 'database' },
        { path: '/assessments', label: 'Assessments', icon: 'code' },
    ];

    // Candidate can see limited items
    const candidateItems = [
        { path: '/sql-playground', label: 'SQL Playground', icon: 'database' },
        { path: '/assessments', label: 'Assessments', icon: 'code' },
    ];

    // Determine which items to show based on role
    let navItems = [...baseNavItems];
    if (userRole === 'admin' || userRole === 'trainer') {
        navItems = [...navItems, ...adminTrainerItems];
    } else if (userRole === 'candidate') {
        navItems = [...navItems, ...candidateItems];
    }

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-10 hidden lg:flex">
            <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-left border-r-4 transition-all ${isActive(item.path)
                            ? 'bg-red-50 text-red-500 border-red-500'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                            }`}
                    >
                        <span className="material-symbols-outlined text-base">{item.icon}</span>
                        <span className="font-medium text-sm">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-3 border-t border-gray-200 flex-shrink-0">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-sm"
                >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;

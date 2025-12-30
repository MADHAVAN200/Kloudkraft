import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Header() {
    const { theme, toggleTheme } = useTheme();
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    return (
        <header className="bg-white dark:bg-brand-card dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-sm border-b border-gray-200 z-20 h-16 flex-shrink-0 transition-colors duration-300">
            <div className="flex items-center justify-between h-full px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-red-500">Kloudkraft</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        <span className="material-symbols-outlined">
                            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold hover:ring-2 hover:ring-offset-2 hover:ring-blue-500 transition-all focus:outline-none"
                        >
                            K
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-brand-card rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 origin-top-right transform transition-all animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">admin@kloudkraft.com</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-2 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;

import React from 'react';

function Header() {
    return (
        <header className="bg-white text-gray-900 shadow-sm border-b border-gray-200 z-20 h-16 flex-shrink-0">
            <div className="flex items-center justify-between h-full px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-red-500">Kloudkraft</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    K
                </div>
            </div>
        </header>
    );
}

export default Header;

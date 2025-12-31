import React from 'react';

function VirtualMachine() {
    return (
        <div className="w-full mt-2 ml-2 transition-colors duration-300">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Virtual Machine</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Manage and access your virtual machines.</p>
            </div>

            <div className="bg-white dark:bg-white/5 dark:backdrop-blur-lg dark:border-white/10 rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:scale-[1.01] hover:shadow-xl transition-all duration-300 ease-in-out">
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-6xl mb-4">computer</span>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Virtual Machine Management</h2>
                <p className="text-gray-600 dark:text-gray-400">Virtual machine functionality will be available soon.</p>
            </div>
        </div>
    );
}

export default VirtualMachine;

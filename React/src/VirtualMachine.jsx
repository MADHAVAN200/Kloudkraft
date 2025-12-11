import React from 'react';

function VirtualMachine() {
    return (
        <div className="max-w-6xl mt-2 ml-2">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Virtual Machine</h1>
                <p className="text-gray-600 text-sm">Manage and access your virtual machines.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">computer</span>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Virtual Machine Management</h2>
                <p className="text-gray-600">Virtual machine functionality will be available soon.</p>
            </div>
        </div>
    );
}

export default VirtualMachine;

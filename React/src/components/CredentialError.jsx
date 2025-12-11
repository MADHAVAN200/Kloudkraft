import React from 'react';

function CredentialError({ credentialName, onBack }) {
    return (
        <div className="max-w-4xl mt-2 ml-2">
            {/* Error Message Card */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-lg">
                <p className="text-red-600 font-medium">
                    You don't have access to {credentialName}
                </p>
            </div>

            {/* Error Toast at Bottom */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-red-600">error</span>
                <span className="text-sm font-medium text-gray-900">
                    Error fetching {credentialName} Credentials: You don't have access to {credentialName}
                </span>
                <button
                    onClick={onBack}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </div>
        </div>
    );
}

export default CredentialError;

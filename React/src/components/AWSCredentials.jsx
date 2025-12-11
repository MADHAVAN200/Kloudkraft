import React, { useState } from 'react';

function AWSCredentials({ onBack }) {
    const [copied, setCopied] = useState(false);

    const credentials = {
        username: 'dev-team-user3',
        password: '', // Hidden for security
        accessKey: '', // Hidden for security
        secretKey: '', // Hidden for security
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mt-2 ml-2">
            {/* Credentials Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-lg">
                <a
                    href="#"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-6 inline-block"
                >
                    Sign In AWS Console
                </a>

                <div className="space-y-4">
                    {/* Username */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <span className="text-sm text-gray-700">
                                <span className="font-medium">Username:</span> {credentials.username}
                            </span>
                        </div>
                        <button
                            onClick={() => handleCopy(credentials.username)}
                            className="ml-4 p-2 hover:bg-gray-100 rounded transition-colors"
                        >
                            <span className="material-symbols-outlined text-gray-600 text-lg">content_copy</span>
                        </button>
                    </div>

                    {/* Password */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <span className="text-sm text-gray-700">
                                <span className="font-medium">Password:</span> {credentials.password}
                            </span>
                        </div>
                        <button
                            onClick={() => handleCopy(credentials.password)}
                            className="ml-4 p-2 hover:bg-gray-100 rounded transition-colors"
                        >
                            <span className="material-symbols-outlined text-gray-600 text-lg">content_copy</span>
                        </button>
                    </div>

                    {/* Access Key */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <span className="text-sm text-gray-700">
                                <span className="font-medium">Access Key:</span> {credentials.accessKey}
                            </span>
                        </div>
                        <button
                            onClick={() => handleCopy(credentials.accessKey)}
                            className="ml-4 p-2 hover:bg-gray-100 rounded transition-colors"
                        >
                            <span className="material-symbols-outlined text-gray-600 text-lg">content_copy</span>
                        </button>
                    </div>

                    {/* Secret Key */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <span className="text-sm text-gray-700">
                                <span className="font-medium">Secret Key:</span> {credentials.secretKey}
                            </span>
                        </div>
                        <button
                            onClick={() => handleCopy(credentials.secretKey)}
                            className="ml-4 p-2 hover:bg-gray-100 rounded transition-colors"
                        >
                            <span className="material-symbols-outlined text-gray-600 text-lg">content_copy</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {copied && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600">check_circle</span>
                    <span className="text-sm font-medium text-gray-900">Successfully fetched AWS credentials</span>
                    <button
                        onClick={() => setCopied(false)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default AWSCredentials;

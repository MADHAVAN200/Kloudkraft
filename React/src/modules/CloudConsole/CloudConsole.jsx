import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AWSCredentials from '../../components/AWSCredentials.jsx';
import CredentialError from '../../components/CredentialError.jsx';

function CloudConsole() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCredential = searchParams.get('credential');

  const credentials = [
    {
      id: 1,
      name: 'AWS Credentials',
      icon: '☁️',
      color: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      type: 'aws',
      displayName: 'AWS',
    },
    {
      id: 2,
      name: 'AZURE Credentials',
      icon: '🔷',
      color: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      type: 'azure',
      displayName: 'AZURE',
    },
    {
      id: 3,
      name: 'GCP Credentials',
      icon: '☁️',
      color: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400',
      type: 'gcp',
      displayName: 'GCP',
    },
    {
      id: 4,
      name: 'MS365 Credentials',
      icon: '📧',
      color: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      type: 'ms365',
      displayName: 'MS365',
    },
    {
      id: 5,
      name: 'GITCOPILOT Credentials',
      icon: '🤖',
      color: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      type: 'gitcopilot',
      displayName: 'GITCOPILOT',
    },
  ];

  const handleCredentialClick = (type) => {
    setSearchParams({ credential: type });
  };

  const handleBack = () => {
    navigate('/cloud-console');
  };

  // Show AWS credentials page if AWS is selected
  if (selectedCredential === 'aws') {
    return <AWSCredentials onBack={handleBack} />;
  }

  // Show error page for other credentials (no access)
  if (selectedCredential) {
    const credential = credentials.find(c => c.type === selectedCredential);
    return <CredentialError credentialName={credential?.displayName || selectedCredential.toUpperCase()} onBack={handleBack} />;
  }

  // Show main credentials grid
  return (
    <div className="w-full max-w-full mt-6 px-6 md:px-12 transition-colors duration-300">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cloud Console Credentials</h1>
      </div>

      {/* Credentials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {credentials.map((credential) => (
          <button
            key={credential.id}
            onClick={() => handleCredentialClick(credential.type)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center hover:scale-[1.05] hover:shadow-xl hover:border-red-500 dark:hover:border-red-500 transition-all duration-300 ease-in-out cursor-pointer group"
          >
            <div className={`${credential.color} rounded-2xl p-4 inline-block mb-4 transition-transform group-hover:scale-110 duration-300`}>
              <span className="text-4xl">{credential.icon}</span>
            </div>
            <h3 className={`font-semibold text-sm ${credential.textColor}`}>
              {credential.name}
            </h3>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CloudConsole;

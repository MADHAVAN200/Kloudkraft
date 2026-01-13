import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaAws, FaMicrosoft, FaGithub, FaGoogle } from 'react-icons/fa';
import { VscAzure } from 'react-icons/vsc';
import AWSCredentials from '../../components/AWSCredentials.jsx';
import CredentialError from '../../components/CredentialError.jsx';

function CloudConsole() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCredential = searchParams.get('credential');

  const credentials = [
    {
      id: 1,
      name: 'AWS',
      icon: FaAws,
      color: 'text-[#FF9900]',
      bgColor: 'hover:bg-[#FF9900]/10 hover:border-[#FF9900]/50',
      type: 'aws',
      displayName: 'Amazon Web Services',
    },
    {
      id: 2,
      name: 'Azure',
      icon: VscAzure,
      color: 'text-[#0089D6]',
      bgColor: 'hover:bg-[#0089D6]/10 hover:border-[#0089D6]/50',
      type: 'azure',
      displayName: 'Microsoft Azure',
    },
    {
      id: 3,
      name: 'GCP',
      icon: FaGoogle,
      color: 'text-[#4285F4]',
      bgColor: 'hover:bg-[#4285F4]/10 hover:border-[#4285F4]/50',
      type: 'gcp',
      displayName: 'Google Cloud Platform',
    },
    {
      id: 4,
      name: 'M365',
      icon: FaMicrosoft,
      color: 'text-[#EA4335]', // Using Microsoft generic or specific color
      bgColor: 'hover:bg-[#EA4335]/10 hover:border-[#EA4335]/50',
      type: 'ms365',
      displayName: 'Microsoft 365',
    },
    {
      id: 5,
      name: 'Copilot',
      icon: FaGithub,
      color: 'text-black dark:text-white',
      bgColor: 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-500',
      type: 'gitcopilot',
      displayName: 'GitHub Copilot',
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
    <div className="w-full h-full p-6 md:p-12 transition-colors duration-300">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Cloud Console</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage access and credentials for your cloud environments</p>
      </div>

      {/* Credentials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {credentials.map((credential) => {
          const Icon = credential.icon;
          return (
            <button
              key={credential.id}
              onClick={() => handleCredentialClick(credential.type)}
              className={`
                    relative group flex flex-col items-center justify-center p-8 h-48 rounded-2xl 
                    bg-white dark:bg-[#0F1014] 
                    border border-gray-200 dark:border-gray-800 
                    shadow-sm hover:shadow-xl 
                    transition-all duration-300 ease-out 
                    ${credential.bgColor}
                `}
            >
              <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${credential.color}`}>
                <Icon />
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                {credential.name}
              </h3>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CloudConsole;

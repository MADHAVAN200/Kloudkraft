import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function SQLPlayground() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdminOrTrainer = userRole === 'admin' || userRole === 'trainer';

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await fetch('https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin?type=databases');
        if (!response.ok) {
          throw new Error('Failed to fetch databases');
        }
        const data = await response.json();
        setDatabases(data.databases || []);
      } catch (err) {
        console.error('Error fetching databases:', err);
        setError('Failed to load databases');
      } finally {
        setLoading(false);
      }
    };

    if (isAdminOrTrainer) {
      fetchDatabases();
    }
  }, [isAdminOrTrainer]);

  return (
    <div className="max-w-6xl mt-2 ml-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Datasets Card - Admin & Trainer only */}
        {isAdminOrTrainer && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow h-72 flex flex-col">
            <div className="flex justify-center mb-5">
              <div className="bg-red-50 rounded-2xl p-4 inline-block">
                <span className="material-symbols-outlined text-red-500 text-4xl">database</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Dataset Upload</h3>
            <p className="text-gray-500 mb-6 text-sm min-h-[40px] flex items-center justify-center">Import relevant datasets for assessments.</p>
            <button
              onClick={() => navigate('/available-datasets')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm mt-auto"
            >
              Import
            </button>
          </div>
        )}

        {/* Assessment Creation Card - Admin & Trainer only */}
        {isAdminOrTrainer && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow h-72 flex flex-col">
            <div className="flex justify-center mb-5">
              <div className="bg-red-50 rounded-2xl p-4 inline-block">
                <span className="material-symbols-outlined text-red-500 text-4xl">description</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Assessment Creation</h3>
            <p className="text-gray-500 mb-6 text-sm min-h-[40px] flex items-center justify-center">Build and configure new assessments for users.</p>
            <button
              onClick={() => navigate('/sql-playground/create-assessment')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm mt-auto"
            >
              Start Builder
            </button>
          </div>
        )}

        {/* Users & Cohorts Card - Admin & Trainer only */}
        {isAdminOrTrainer && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow h-72 flex flex-col">
            <div className="flex justify-center mb-5">
              <div className="bg-red-50 rounded-2xl p-4 inline-block">
                <span className="material-symbols-outlined text-red-500 text-4xl">groups</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Users & Cohorts</h3>
            <p className="text-gray-500 mb-6 text-sm min-h-[40px] flex items-center justify-center">View details of all registered users and cohorts.</p>
            <button
              onClick={() => navigate('/users-cohorts')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm mt-auto"
            >
              View
            </button>
          </div>
        )}

        {/* Reports Card - All users */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow h-72 flex flex-col">
          <div className="flex justify-center mb-5">
            <div className="bg-red-50 rounded-2xl p-4 inline-block">
              <span className="material-symbols-outlined text-red-500 text-4xl">analytics</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Reports</h3>
          <p className="text-gray-500 mb-6 text-sm min-h-[40px] flex items-center justify-center">View and analyse assessment results and user performance.</p>
          <button
            onClick={() => navigate('/reports?from=sql-playground')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm mt-auto"
          >
            View
          </button>
        </div>

        {/* Assessments Card - All users */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow h-72 flex flex-col">
          <div className="flex justify-center mb-5">
            <div className="bg-red-50 rounded-2xl p-4 inline-block">
              <span className="material-symbols-outlined text-red-500 text-4xl">assignment</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Assessments</h3>
          <p className="text-gray-500 mb-6 text-sm min-h-[40px] flex items-center justify-center">View all assessments and manage existing tests.</p>
          <button
            disabled
            className="w-full bg-gray-50 text-gray-400 font-semibold py-2.5 px-5 rounded-lg cursor-not-allowed text-sm mt-auto"
          >
            View All
          </button>
        </div>


      </div>
    </div>
  );
}

export default SQLPlayground;

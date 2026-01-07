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

  const PlaygroundCard = ({ title, description, icon, onClick, disabled, colorClass, iconColorClass }) => (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`relative group bg-white dark:bg-white/5 dark:backdrop-blur-lg dark:border-white/10 rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between transition-all duration-300 ease-in-out ${!disabled ? 'hover:scale-[1.02] hover:shadow-xl hover:border-red-200 dark:hover:border-red-500/30 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 dark:bg-gray-800 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity"></div>

      <div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300 ${colorClass}`}>
          <span className={`material-symbols-outlined text-3xl ${iconColorClass}`}>{icon}</span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <span className={`text-sm font-semibold ${disabled ? 'text-gray-400 dark:text-gray-600' : 'text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-transform'}`}>
          {disabled ? 'Coming Soon' : 'Access Tool'}
        </span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${disabled ? 'bg-gray-100 dark:bg-gray-800' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white'}`}>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full mt-2 ml-2 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SQL Playground</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage datasets, build assessments, and analyze performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Available Datasets Card - Admin & Trainer only */}
        {isAdminOrTrainer && (
          <PlaygroundCard
            title="Datasets"
            description="Import and manage relevant datasets for your SQL assessments."
            icon="database"
            onClick={() => navigate('/available-datasets')}
            colorClass="bg-blue-50 dark:bg-blue-900/20"
            iconColorClass="text-blue-600 dark:text-blue-400"
          />
        )}

        {/* Assessment Creation Card - Admin & Trainer only */}
        {isAdminOrTrainer && (
          <PlaygroundCard
            title="Assessment Creation"
            description="Build, configure, and publish new SQL assessments for users."
            icon="description"
            onClick={() => navigate('/sql-playground/create-assessment')}
            colorClass="bg-purple-50 dark:bg-purple-900/20"
            iconColorClass="text-purple-600 dark:text-purple-400"
          />
        )}

        {/* Users & Cohorts Card - Admin & Trainer only */}
        {isAdminOrTrainer && (
          <PlaygroundCard
            title="Users & Cohorts"
            description="View registered users, manage cohorts, and track engagement."
            icon="groups"
            onClick={() => navigate('/users-cohorts')}
            colorClass="bg-orange-50 dark:bg-orange-900/20"
            iconColorClass="text-orange-600 dark:text-orange-400"
          />
        )}

        {/* Reports Card - All users */}
        <PlaygroundCard
          title="Reports"
          description="View detailed analytics on assessment results and performance."
          icon="analytics"
          onClick={() => navigate('/reports?from=sql-playground')}
          colorClass="bg-green-50 dark:bg-green-900/20"
          iconColorClass="text-green-600 dark:text-green-400"
        />

        {/* Assessments Card - All users */}
        <PlaygroundCard
          title="Assessments"
          description="Browse all assessments and manage existing test sets."
          icon="assignment"
          onClick={() => navigate('/sql-playground/assessments')}
          colorClass="bg-red-50 dark:bg-red-900/20"
          iconColorClass="text-red-600 dark:text-red-400"
        />
      </div>
    </div>
  );
}

export default SQLPlayground;

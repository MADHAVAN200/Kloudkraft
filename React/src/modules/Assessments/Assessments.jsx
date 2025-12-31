import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AssessmentsList from './AssessmentsList.jsx';

function Assessments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showAssessmentsList, setShowAssessmentsList] = useState(false);
  const { userRole } = useAuth();

  // Get the referrer from URL params (e.g., ?from=sql-playground)
  const referrer = searchParams.get('from');
  const isAdminOrTrainer = userRole === 'admin' || userRole === 'trainer';

  // If showing assessments list, render it (if internal state handles this, but usually routing handles full page lists)
  if (showAssessmentsList) {
    return <AssessmentsList onBack={() => setShowAssessmentsList(false)} />;
  }

  // Determine back navigation path
  const handleBack = () => {
    if (referrer === 'sql-playground') {
      navigate('/sql-playground');
    } else {
      navigate('/dashboard');
    }
  };

  // Reusing the exact card structure from SQLPlayground.jsx
  const AssessmentCard = ({ title, description, icon, onClick, disabled, colorClass, iconColorClass }) => (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`relative group bg-white dark:bg-brand-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between transition-all duration-300 ${!disabled ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
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
      {/* Header */}
      <div className="mb-8">
        {referrer && (
          <button
            onClick={handleBack}
            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4 group"
          >
            <span className="material-symbols-outlined mr-1 group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Back
          </button>
        )}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assessments</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage assessments, upload datasets, and view performance reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Datasets Card - Admin & Trainer only */}
        {isAdminOrTrainer && (
          <AssessmentCard
            title="Datasets"
            description="Manage and upload question set datasets."
            icon="database"
            onClick={() => navigate('/assessment-datasets')}
            colorClass="bg-blue-50 dark:bg-blue-900/20"
            iconColorClass="text-blue-600 dark:text-blue-400"
          />
        )}

        {/* Assessment Creation Card - Admin & Trainer only */}
        {isAdminOrTrainer && (
          <AssessmentCard
            title="Create Assessment"
            description="Design and configure new SQL assessments for your cohorts."
            icon="description" // matched icon from existing code
            onClick={() => navigate('/create-assessment?from=assessments')}
            colorClass="bg-purple-50 dark:bg-purple-900/20"
            iconColorClass="text-purple-600 dark:text-purple-400"
          />
        )}

        {/* Reports Card - All users */}
        <AssessmentCard
          title="Reports"
          description="Analyze assessment results and track user performance metrics."
          icon="analytics"
          onClick={() => navigate('/reports?from=assessments')}
          colorClass="bg-green-50 dark:bg-green-900/20"
          iconColorClass="text-green-600 dark:text-green-400"
        />

        {/* Assessments List Card - All users */}
        <AssessmentCard
          title="View Assessments"
          description="Browse all assessments and manage existing scheduled tests."
          icon="assignment"
          onClick={() => navigate('/assessments-list?from=assessments')}
          colorClass="bg-red-50 dark:bg-red-900/20"
          iconColorClass="text-red-600 dark:text-red-400"
        />
      </div>
    </div>
  );
}

export default Assessments;

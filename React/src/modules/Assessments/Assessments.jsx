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

  // If showing assessments list, render it
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

  return (
    <div className="max-w-6xl mt-2 ml-2">
      {/* Back Button - only show if there's a referrer */}
      {referrer && (
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="font-medium">Back</span>
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dataset Upload Card - Admin & Trainer only */}
        {isAdminOrTrainer && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-5">
              <div className="bg-red-50 rounded-2xl p-4 inline-block">
                <span className="material-symbols-outlined text-red-500 text-4xl">dashboard</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Dataset Upload</h3>
            <p className="text-gray-500 mb-6 text-sm">Import relevant datasets for assessments.</p>
            <button
              onClick={() => navigate('/dataset-upload?from=assessments')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
            >
              Import
            </button>
          </div>
        )}

        {/* Assessment Creation Card - Admin & Trainer only */}
        {isAdminOrTrainer && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-5">
              <div className="bg-red-50 rounded-2xl p-4 inline-block">
                <span className="material-symbols-outlined text-red-500 text-4xl">description</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Assessment Creation</h3>
            <p className="text-gray-500 mb-6 text-sm">Build and configure new assessments for users.</p>
            <button
              onClick={() => navigate('/create-assessment?from=assessments')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
            >
              Create
            </button>
          </div>
        )}

        {/* Reports Card - All users */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center hover:shadow-md transition-shadow">
          <div className="flex justify-center mb-5">
            <div className="bg-red-50 rounded-2xl p-4 inline-block">
              <span className="material-symbols-outlined text-red-500 text-4xl">analytics</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Reports</h3>
          <p className="text-gray-500 mb-6 text-sm">View and analyse assessment results and user performance.</p>
          <button
            onClick={() => navigate('/reports?from=assessments')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
          >
            View
          </button>
        </div>

        {/* Assessments Card - All users */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center hover:shadow-md transition-shadow">
          <div className="flex justify-center mb-5">
            <div className="bg-red-50 rounded-2xl p-4 inline-block">
              <span className="material-symbols-outlined text-red-500 text-4xl">assignment</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Assessments</h3>
          <p className="text-gray-500 mb-6 text-sm">View all assessments and manage existing tests.</p>
          <button
            onClick={() => navigate('/assessments-list?from=assessments')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
          >
            View All
          </button>
        </div>
      </div>
    </div>
  );
}

export default Assessments;

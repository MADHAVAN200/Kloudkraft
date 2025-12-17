import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

function CreateAssessment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const referrer = searchParams.get('from');
  const editId = searchParams.get('edit');
  const editData = location.state?.assessment;

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Step 1: Assessment Details
  const [assessmentName, setAssessmentName] = useState('');

  // Step 2: Dataset Selection
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [datasetError, setDatasetError] = useState('');

  // Step 3: Duration
  const [duration, setDuration] = useState('60'); // Default 60 minutes


  // Step 4: Question Count
  const [questionCount, setQuestionCount] = useState('10');
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [randomQuestions, setRandomQuestions] = useState(false);



  // Populate form if in edit mode
  useEffect(() => {
    if (editData) {
      setAssessmentName(editData.name || '');
      setSelectedDataset(editData.csv_s3_key || '');
      setDuration(editData.duration_minutes?.toString() || '60');
      setQuestionCount(editData.num_questions?.toString() || '');
    }
  }, [editData]);

  // Fetch Datasets from API (Step 2)
  useEffect(() => {
    if (currentStep === 2) {
      fetchDatasets();
    }
  }, [currentStep]);

  const fetchDatasets = async () => {
    setLoadingDatasets(true);
    setDatasetError('');
    try {
      // Use list_datasets API via proxy
      const payload = {
        action: "list_datasets"
      };

      const response = await fetch('/assessment-mgmt-api/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // Response comes directly, not wrapped in body (based on curl test)
      const responseBody = data;

      if (responseBody && responseBody.success && responseBody.datasets) {
        setDatasets(responseBody.datasets);
      } else {
        throw new Error('Failed to fetch datasets');
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      setDatasetError('Failed to load datasets');
    } finally {
      setLoadingDatasets(false);
    }
  };


  const fetchDatasetQuestions = async (datasetKey) => {
    // Placeholder - we might not need this if we don't know question count per DB
    // Or we assume a default or fetch it differently.
    // For now, setting a default max.
    setTotalQuestions(100);
  };



  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return assessmentName.trim() !== '';
      case 2:
        return selectedDataset !== '';
      case 3:
      case 3:
        return parseInt(duration) > 0;
      case 4:
        return questionCount > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const [submitting, setSubmitting] = useState(false); // Add submitting state if not present
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ... (previous useEffects)

  const handleCreateAssessment = async () => {
    // Construct payload strictly as requested
    const assessmentData = {
      name: assessmentName,
      assigned_cohorts: [], // Empty array as per requirement
      csv_s3_key: selectedDataset, // This is the s3_key
      num_questions: parseInt(questionCount),
      duration_minutes: parseInt(duration),
      random_questions: randomQuestions
    };

    const payload = editId ? {
      action: "update_assessment",
      assessment_id: editId,
      update: assessmentData
    } : {
      action: "create_assessment",
      assessment: assessmentData
    };

    console.log('Creating assessment with payload:', payload);

    try {
      const response = await fetch('/assessment-mgmt-api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('API Response:', data);

      let responseBody = data.body;
      if (typeof responseBody === 'string') {
        responseBody = JSON.parse(responseBody);
      } else {
        responseBody = data;
      }

      if (responseBody && responseBody.success) {
        // alert(editId ? 'Assessment updated successfully!' : 'Assessment created successfully!');
        setShowSuccessModal(true);
      } else {
        alert(`Failed to ${editId ? 'update' : 'create'} assessment: ${responseBody?.message || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Error creating assessment:', error);
      alert('An error occurred while creating the assessment.');
    }
  };

  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl font-bold">check</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-500 mb-8">
            Assessment has been {editId ? 'updated' : 'created'} successfully.
          </p>
          <button
            onClick={() => navigate('/assessments')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
          >
            Go to AssessmentsList
          </button>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Details</h2>
            <p className="text-gray-600 mb-6">Enter assessment name</p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assessment Name
              </label>
              <input
                type="text"
                placeholder="e.g., Python Basics Assessment"
                value={assessmentName}
                onChange={(e) => setAssessmentName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Dataset</h2>
            <p className="text-gray-600 mb-6">Choose the dataset (question set) for this assessment</p>

            {datasetError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {datasetError}
              </div>
            )}

            {loadingDatasets ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined animate-spin text-4xl text-red-500">progress_activity</span>
                <p className="mt-2 text-gray-600">Loading datasets...</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Available Datasets
                  </label>
                  <select
                    value={selectedDataset}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select a dataset...</option>
                    {datasets.map((ds) => (
                      <option key={ds.s3_key} value={ds.s3_key}>
                        {ds.filename || ds.s3_key}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDataset && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-600">description</span>
                      <div>
                        <p className="text-blue-900 font-semibold text-sm">Selected Dataset Key: {selectedDataset}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Set Duration</h2>
            <p className="text-gray-600 mb-6">Set the time limit for the assessment in minutes</p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                For example 60 for 1 hour, 30 for 30 minutes.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Set Question Count</h2>
            <p className="text-gray-600 mb-6">Configure how many questions each user will receive</p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Questions per User
              </label>
              <input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                min="1"
                max={totalQuestions}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                Note: Ensure the database has enough questions. (Default assumption: 100+)
              </p>
            </div>

            <div className="mb-6 flex items-center">
              <input
                id="random_questions"
                type="checkbox"
                checked={randomQuestions}
                onChange={(e) => setRandomQuestions(e.target.checked)}
                className="w-5 h-5 text-red-500 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="random_questions" className="ml-2 block text-sm text-gray-900">
                Randomize Questions
              </label>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-yellow-600">shuffle</span>
                <div>
                  <p className="text-yellow-900 font-semibold text-sm">Randomization</p>
                  <p className="text-yellow-800 text-sm mt-1">
                    {randomQuestions
                      ? `Each user will receive ${questionCount} randomly selected questions from the database.`
                      : "Questions will be presented in sequential order."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Review & Create Assessment</h2>
            <p className="text-gray-600 mb-6">Review all details before creating the assessment</p>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Assessment Details</h3>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-red-500 hover:text-red-600 text-sm font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-gray-600 font-medium">{assessmentName}</p>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Target Audience:</p>
                  <p className="text-sm font-medium text-gray-900">Open to all (Link sharing)</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Dataset</h3>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-red-500 hover:text-red-600 text-sm font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-gray-600">
                  {datasets.find(d => d.s3_key === selectedDataset)?.filename || selectedDataset}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Duration</h3>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-red-500 hover:text-red-600 text-sm font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1 text-gray-600">
                  <p>{duration} Minutes</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Questions</h3>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="text-red-500 hover:text-red-600 text-sm font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-gray-600">
                  {questionCount} randomized questions per user
                </p>
              </div>
            </div>

            <button
              onClick={handleCreateAssessment}
              className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check_circle</span>
              <span>Create Assessment</span>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 px-4">
      {/* Back Button */}
      {referrer && (
        <button
          onClick={() => navigate(referrer === 'sql-playground' ? '/sql-playground' : '/assessments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="font-medium">Back</span>
        </button>
      )}

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Details' },
            { num: 2, label: 'Dataset' },
            { num: 3, label: 'Duration' },
            { num: 4, label: 'Questions' },
            { num: 5, label: 'Review' },
          ].map((step, index) => (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-lg transition-all ${step.num <= currentStep
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                    }`}
                >
                  {step.num}
                </div>
                <span className="hidden sm:block text-xs md:text-sm text-gray-600 mt-2">{step.label}</span>
              </div>
              {index < 4 && (
                <div className="flex-1 h-0.5 md:h-1 mx-2 md:mx-4 mb-0 sm:mb-6 self-center">
                  <div
                    className={`h-full transition-all duration-300 ${step.num < currentStep ? 'bg-red-500' : 'bg-gray-200'
                      }`}
                  />
                </div>
              )
              }
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      {
        currentStep < 5 && (
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-colors ${currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Previous</span>
            </button>

            <button
              onClick={nextStep}
              disabled={!validateStep()}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-colors ${!validateStep()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
                }`}
            >
              <span>Next</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}
    </div>
  );
}

export default CreateAssessment;

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

  // Step 1: Assessment Details & Target Cohorts
  const [assessmentName, setAssessmentName] = useState('');
  const [selectedCohorts, setSelectedCohorts] = useState([]);
  const [cohortSearch, setCohortSearch] = useState('');

  // New States for API Data (Step 1)
  const [selectedEntityType, setSelectedEntityType] = useState('cohorts'); // Default to cohorts
  const [availableItems, setAvailableItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemError, setItemError] = useState('');

  // Step 2: Database Selection (Replaced Dataset Selection)
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [databaseError, setDatabaseError] = useState('');

  // Step 3: Timing
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('');

  // Step 4: Question Count
  const [questionCount, setQuestionCount] = useState('10');
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Fetch Users/Cohorts from API (Step 1)
  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      setItemError('');
      setAvailableItems([]);
      try {
        const response = await fetch(`https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin?type=${selectedEntityType}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();

        if (selectedEntityType === 'users') {
          setAvailableItems(result.users || []);
        } else {
          setAvailableItems(result.cohorts || []);
        }
      } catch (err) {
        console.error('Error fetching items:', err);
        setItemError('Failed to load data. Please try again.');
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [selectedEntityType]);

  // Populate form if in edit mode
  useEffect(() => {
    if (editData) {
      setAssessmentName(editData.name || '');
      setSelectedCohorts(editData.assigned_cohorts || []);
      setSelectedDatabase(editData.database_name || ''); // Updated field
      setDuration(editData.duration_minutes?.toString() || '');
      setQuestionCount(editData.num_questions?.toString() || '');
    }
  }, [editData]);

  // Fetch Databases from API (Step 2)
  useEffect(() => {
    if (currentStep === 2) {
      fetchDatabases();
    }
  }, [currentStep]);

  const fetchDatabases = async () => {
    setLoadingDatabases(true);
    setDatabaseError('');
    try {
      // Use new GET API for databases
      const response = await fetch('https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin?type=databases');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.databases) {
        setDatabases(data.databases);
      } else {
        throw new Error('Failed to fetch databases');
      }
    } catch (error) {
      console.error('Error fetching databases:', error);
      setDatabaseError('Failed to load databases');
    } finally {
      setLoadingDatabases(false);
    }
  };


  const fetchDatasetQuestions = async (datasetKey) => {
    // Placeholder - we might not need this if we don't know question count per DB
    // Or we assume a default or fetch it differently.
    // For now, setting a default max.
    setTotalQuestions(100);
  };

  const filteredCohorts = availableItems.filter(
    (item) =>
      item.toLowerCase().includes(cohortSearch.toLowerCase())
  );

  const toggleCohortSelection = (cohortId) => {
    setSelectedCohorts((prev) =>
      prev.includes(cohortId)
        ? prev.filter((id) => id !== cohortId)
        : [...prev, cohortId]
    );
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return assessmentName.trim() !== '' && selectedCohorts.length > 0;
      case 2:
        return selectedDatabase !== '';
      case 3:
        return startDate && startTime && endDate && endTime && duration;
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

  const handleCreateAssessment = async () => {
    const assessmentPayload = {
      name: assessmentName,
      assigned_cohorts: selectedCohorts,
      database_name: selectedDatabase, // Updated field
      num_questions: parseInt(questionCount),
      duration_minutes: parseInt(duration)
    };

    // Determine if we're creating or updating
    const isUpdate = !!editId;

    // Use direct format (no body wrapper)
    const payload = isUpdate ? {
      action: "update_assessment",
      assessment_id: editId,
      updates: assessmentPayload
    } : {
      action: "create_assessment",
      assessment: assessmentPayload
    };

    console.log(isUpdate ? 'Updating assessment with payload:' : 'Creating assessment with payload:', payload);

    try {
      const response = await fetch('https://u5vjutu2euwnn2uhiertnt6fte0vrbht.lambda-url.eu-central-1.on.aws/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (response.ok) {
        // Response comes directly, not wrapped in body
        if (data && data.success) {
          const message = isUpdate
            ? 'Assessment updated successfully!'
            : `Assessment created successfully! ID: ${data.assessment_id}`;
          alert(message);
          navigate('/assessments'); // Redirect to assessments list
        } else {
          alert(`Failed to ${isUpdate ? 'update' : 'create'} assessment: ` + (data?.message || 'Unknown error'));
        }
      } else {
        alert(`Failed to ${isUpdate ? 'update' : 'create'} assessment. Server returned ` + response.status);
      }

    } catch (error) {
      console.error(`Error ${isUpdate ? 'updating' : 'creating'} assessment:`, error);
      alert(`An error occurred while ${isUpdate ? 'updating' : 'creating'} the assessment.`);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Details</h2>
            <p className="text-gray-600 mb-6">Enter assessment name and select target users or cohorts</p>

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

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Target Type
              </label>
              <select
                value={selectedEntityType}
                onChange={(e) => {
                  setSelectedEntityType(e.target.value);
                  setSelectedCohorts([]); // Clear selection when switching type
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              >
                <option value="cohorts">Cohorts</option>
                <option value="users">Users</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select {selectedEntityType === 'users' ? 'Users' : 'Cohorts'}
              </label>
              <input
                type="text"
                placeholder={`Search ${selectedEntityType}...`}
                value={cohortSearch}
                onChange={(e) => setCohortSearch(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              />
            </div>

            {loadingItems ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined animate-spin text-3xl text-red-500">progress_activity</span>
              </div>
            ) : itemError ? (
              <div className="text-center py-8 text-red-500">
                <p>{itemError}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredCohorts.length > 0 ? (
                  filteredCohorts.map((item) => (
                    <div
                      key={item}
                      onClick={() => toggleCohortSelection(item)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedCohorts.includes(item)
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{item}</p>
                        </div>
                        {selectedCohorts.includes(item) && (
                          <span className="material-symbols-outlined text-red-500">check_circle</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No items found.
                  </div>
                )}
              </div>
            )}

            <p className="mt-4 text-sm text-gray-600">
              Selected: {selectedCohorts.length} {selectedEntityType}
            </p>
          </div >
        );

      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Database</h2>
            <p className="text-gray-600 mb-6">Choose the database for this assessment</p>

            {databaseError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {databaseError}
              </div>
            )}

            {loadingDatabases ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined animate-spin text-4xl text-red-500">progress_activity</span>
                <p className="mt-2 text-gray-600">Loading databases...</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Available Databases
                  </label>
                  <select
                    value={selectedDatabase}
                    onChange={(e) => setSelectedDatabase(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select a database...</option>
                    {databases.map((db) => (
                      <option key={db} value={db}>
                        {db}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDatabase && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-600">database</span>
                      <div>
                        <p className="text-blue-900 font-semibold text-sm">Selected Database: {selectedDatabase}</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Set Assessment Timing</h2>
            <p className="text-gray-600 mb-6">Configure when the assessment will be available</p>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Assessment Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 30"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
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

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-yellow-600">shuffle</span>
                <div>
                  <p className="text-yellow-900 font-semibold text-sm">Randomization</p>
                  <p className="text-yellow-800 text-sm mt-1">
                    Each user will receive {questionCount} randomly selected questions from the database.
                    Questions will be different for each user to ensure fairness.
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
                  <p className="text-sm text-gray-500 mb-1">Target {selectedEntityType === 'users' ? 'Users' : 'Cohorts'}:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCohorts.map((item) => {
                      return (
                        <span
                          key={item}
                          className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
                        >
                          {item}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Database</h3>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-red-500 hover:text-red-600 text-sm font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-gray-600">{selectedDatabase}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Timing</h3>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-red-500 hover:text-red-600 text-sm font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1 text-gray-600">
                  <p>Start: {startDate} at {startTime}</p>
                  <p>End: {endDate} at {endTime}</p>
                  <p>Duration: {duration} minutes</p>
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
    <div className="max-w-4xl mt-2 ml-2">
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
            { num: 3, label: 'Timing' },
            { num: 4, label: 'Questions' },
            { num: 5, label: 'Review' },
          ].map((step, index) => (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${step.num <= currentStep
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                    }`}
                >
                  {step.num}
                </div>
                <span className="text-sm text-gray-600 mt-2">{step.label}</span>
              </div>
              {index < 4 && (
                <div className="flex-1 h-1 mx-4 mb-6">
                  <div
                    className={`h-full ${step.num < currentStep ? 'bg-red-500' : 'bg-gray-200'
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

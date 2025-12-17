import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateSQLAssessment() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5;

    // Form State
    const [targetType, setTargetType] = useState('cohorts'); // 'cohorts' or 'users'
    const [targetList, setTargetList] = useState([]); // Available items to select
    const [selectedTargets, setSelectedTargets] = useState([]); // Selected items
    const [loadingTargets, setLoadingTargets] = useState(false);

    const [databases, setDatabases] = useState([]);
    const [selectedDatabase, setSelectedDatabase] = useState('');
    const [loadingDatabases, setLoadingDatabases] = useState(false);

    const [numQuestions, setNumQuestions] = useState(5);
    const [randomQuestions, setRandomQuestions] = useState(false);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch Targets (Users or Cohorts)
    useEffect(() => {
        fetchTargets();
    }, [targetType]);

    const fetchTargets = async () => {
        setLoadingTargets(true);
        setSelectedTargets([]); // unique selection per type
        try {
            const response = await fetch(`https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin?type=${targetType}`);
            const data = await response.json();
            if (targetType === 'users') {
                setTargetList(data.users || []);
            } else {
                setTargetList(data.cohorts || []);
            }
        } catch (error) {
            console.error('Error fetching targets:', error);
            alert('Failed to load list. Please try again.');
        } finally {
            setLoadingTargets(false);
        }
    };

    // Fetch Databases
    useEffect(() => {
        const fetchDatabases = async () => {
            setLoadingDatabases(true);
            try {
                const response = await fetch('https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin?type=databases');
                const data = await response.json();
                setDatabases(data.databases || []);
            } catch (error) {
                console.error('Error fetching databases:', error);
            } finally {
                setLoadingDatabases(false);
            }
        };
        fetchDatabases();
    }, []);

    const handleTargetToggle = (item) => {
        setSelectedTargets(prev =>
            prev.includes(item)
                ? prev.filter(i => i !== item)
                : [...prev, item]
        );
    };

    const validateStep = () => {
        switch (currentStep) {
            case 1:
                return selectedTargets.length > 0;
            case 2:
                return selectedDatabase !== '';
            case 3:
                return startDate && endDate && startTime && endTime;
            case 4:
                return parseInt(numQuestions) > 0;
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

    const handleSubmit = async () => {
        if (!validateStep()) {
            setErrorMessage('Please fill in all required fields.');
            setShowErrorModal(true);
            return;
        }

        setSubmitting(true);

        // Construct strict payload
        const payload = {
            type: targetType,
            selected: selectedTargets,
            dataset_name: selectedDatabase,
            random_questions: randomQuestions,
            number_of_questions: parseInt(numQuestions),
            start_date: startDate,
            end_date: endDate,
            start_time: startTime,
            end_time: endTime
        };

        console.log('Submitting SQL Assessment Payload:', payload);

        try {
            const response = await fetch('https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setShowSuccessModal(true);
            } else {
                const errText = await response.text();
                // Try to parse the error if it's JSON
                let displayMsg = 'Failed to create assessment.';
                try {
                    const errObj = JSON.parse(errText);
                    if (errObj.details) {
                        // Check if details is a string that needs parsing
                        if (typeof errObj.details === 'string') {
                            try {
                                const detailsObj = JSON.parse(errObj.details);
                                // Check for common DB error fields
                                if (detailsObj.M) {
                                    displayMsg = detailsObj.M;
                                } else if (detailsObj.message) {
                                    displayMsg = detailsObj.message;
                                } else if (detailsObj.error) {
                                    displayMsg = detailsObj.error;
                                } else {
                                    // Fallback to the stringified details if no specific field found
                                    displayMsg = errObj.details;
                                }
                            } catch (e) {
                                // If details is a string but not JSON
                                displayMsg = errObj.details;
                            }
                        } else {
                            // details is already an object
                            displayMsg = errObj.details.message || errObj.details.error || JSON.stringify(errObj.details);
                        }
                    } else if (errObj.message) {
                        displayMsg = errObj.message;
                    } else if (errObj.error) {
                        displayMsg = errObj.error;
                    }
                } catch (e) {
                    displayMsg = 'Error: ' + errText;
                }

                // Clean up the message slightly if it contains technical jargon 
                if (displayMsg.includes('duplicate key value')) {
                    const match = displayMsg.match(/Key \((.*?)\)=\((.*?)\) already exists/);
                    if (match) {
                        displayMsg = `User '${match[2]}' already has an assessment assigned.`;
                    } else {
                        displayMsg = "A duplicate entry exists for this user/assessment.";
                    }
                }

                setErrorMessage(displayMsg);
                setShowErrorModal(true);
            }
        } catch (error) {
            console.error('Submission error:', error);
            setErrorMessage('An error occurred. Please try again.');
            setShowErrorModal(true);
        } finally {
            setSubmitting(false);
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
                        SQL Assessment has been created successfully.
                    </p>
                    <button
                        onClick={() => navigate('/sql-playground')}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                    >
                        Go to SQL Playground
                    </button>
                </div>
            </div>
        );
    }

    if (showErrorModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200 text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-2xl font-bold">close</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-500 mb-8 break-words text-sm">
                        {errorMessage}
                    </p>
                    <button
                        onClick={() => setShowErrorModal(false)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                    >
                        Close
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Participants</h2>
                        <p className="text-gray-600 mb-6">Choose who will take this assessment</p>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To</label>
                            <div className="flex gap-4 mb-4">
                                <label className={`flex-1 cursor-pointer p-4 rounded-xl border-2 transition-all ${targetType === 'cohorts' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="targetType"
                                        value="cohorts"
                                        checked={targetType === 'cohorts'}
                                        onChange={() => setTargetType('cohorts')}
                                        className="hidden"
                                    />
                                    <div className="flex items-center justify-center gap-2 font-semibold">
                                        <span className="material-symbols-outlined">groups</span>
                                        Cohorts
                                    </div>
                                </label>
                                <label className={`flex-1 cursor-pointer p-4 rounded-xl border-2 transition-all ${targetType === 'users' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="targetType"
                                        value="users"
                                        checked={targetType === 'users'}
                                        onChange={() => setTargetType('users')}
                                        className="hidden"
                                    />
                                    <div className="flex items-center justify-center gap-2 font-semibold">
                                        <span className="material-symbols-outlined">person</span>
                                        Users
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Select {targetType === 'cohorts' ? 'Cohorts' : 'Users'}</label>
                            {loadingTargets ? (
                                <div className="text-center py-8">
                                    <span className="material-symbols-outlined animate-spin text-4xl text-red-500">progress_activity</span>
                                    <p className="mt-2 text-gray-600">Loading list...</p>
                                </div>
                            ) : targetList.length === 0 ? (
                                <div className="py-8 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
                                    No {targetType} found.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-100 rounded-lg">
                                    {targetList.map(item => (
                                        <div
                                            key={item}
                                            onClick={() => handleTargetToggle(item)}
                                            className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${selectedTargets.includes(item)
                                                ? 'border-red-500 bg-red-50 text-red-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <span className="text-sm font-medium">{item}</span>
                                            {selectedTargets.includes(item) && (
                                                <span className="material-symbols-outlined text-red-500 text-lg">check_circle</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-right text-xs text-gray-500 mt-2">Selected: {selectedTargets.length}</p>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Database</h2>
                        <p className="text-gray-600 mb-6">Choose the SQL database for this assessment</p>

                        {loadingDatabases ? (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined animate-spin text-4xl text-red-500">progress_activity</span>
                                <p className="mt-2 text-gray-600">Loading databases...</p>
                            </div>
                        ) : (
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
                                    {databases.map((db, idx) => (
                                        <option key={idx} value={db}>{db}</option>
                                    ))}
                                </select>
                            </div>
                        )}

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
                    </div>
                );

            case 3:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Schedule Assessment</h2>
                        <p className="text-gray-600 mb-6">Set the start and end time for availability</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Question Settings</h2>
                        <p className="text-gray-600 mb-6">Configure question count and randomization</p>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Number of Questions
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
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
                                            ? `Each user will receive ${numQuestions} randomly selected questions.`
                                            : "Questions will be presented sequentially."}
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
                                    <h3 className="font-semibold text-gray-900">Participants</h3>
                                    <button onClick={() => setCurrentStep(1)} className="text-red-500 hover:text-red-600 text-sm font-semibold">Edit</button>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-gray-500 text-sm">
                                        {targetType === 'cohorts' ? 'groups' : 'person'}
                                    </span>
                                    <span className="capitalize font-medium text-gray-900">{targetType}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTargets.map((t, i) => (
                                        <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium border border-gray-200">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900">Database</h3>
                                    <button onClick={() => setCurrentStep(2)} className="text-red-500 hover:text-red-600 text-sm font-semibold">Edit</button>
                                </div>
                                <p className="text-gray-600 font-medium flex items-center gap-2">
                                    <span className="material-symbols-outlined text-gray-400 text-sm">database</span>
                                    {selectedDatabase}
                                </p>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900">Schedule</h3>
                                    <button onClick={() => setCurrentStep(3)} className="text-red-500 hover:text-red-600 text-sm font-semibold">Edit</button>
                                </div>
                                <div className="text-gray-600 text-sm space-y-1">
                                    <p><span className="font-medium text-gray-900">Start:</span> {startDate} at {startTime}</p>
                                    <p><span className="font-medium text-gray-900">End:</span> {endDate} at {endTime}</p>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900">Questions</h3>
                                    <button onClick={() => setCurrentStep(4)} className="text-red-500 hover:text-red-600 text-sm font-semibold">Edit</button>
                                </div>
                                <p className="text-gray-600">
                                    {numQuestions} {randomQuestions ? 'randomized' : 'sequential'} questions
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">check_circle</span>
                                    <span>Create SQL Assessment</span>
                                </>
                            )}
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
            <button
                onClick={() => navigate('/sql-playground')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
                <span className="material-symbols-outlined">arrow_back</span>
                <span className="font-medium">Back</span>
            </button>

            {/* Progress Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {[
                        { num: 1, label: 'Participants' },
                        { num: 2, label: 'Database' },
                        { num: 3, label: 'Schedule' },
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

export default CreateSQLAssessment;

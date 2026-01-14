import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomDatePicker from '../../components/CustomDatePicker';
import CustomTimePicker from '../../components/CustomTimePicker';

function CreateSQLAssessment() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5;

    // Form State
    const [viewType, setViewType] = useState('cohorts'); // 'cohorts' or 'users' (controls which list is shown)
    const [cohortsList, setCohortsList] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [selectedCohorts, setSelectedCohorts] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
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

    // Fetch Targets (Users and Cohorts)
    useEffect(() => {
        const fetchAllTargets = async () => {
            setLoadingTargets(true);
            try {
                // Fetch Cohorts
                const cohortsResponse = await fetch(`https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin?type=cohorts`);
                const cohortsData = await cohortsResponse.json();
                setCohortsList(cohortsData.cohorts || []);

                // Fetch Users
                const usersResponse = await fetch(`https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin?type=users`);
                const usersData = await usersResponse.json();
                setUsersList(usersData.users || []);

            } catch (error) {
                console.error('Error fetching targets:', error);
                alert('Failed to load lists. Please try again.');
            } finally {
                setLoadingTargets(false);
            }
        };

        fetchAllTargets();
    }, []);

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

    const handleCohortToggle = (item) => {
        setSelectedCohorts(prev =>
            prev.includes(item)
                ? prev.filter(i => i !== item)
                : [...prev, item]
        );
    };

    const handleUserToggle = (item) => {
        setSelectedUsers(prev =>
            prev.includes(item)
                ? prev.filter(i => i !== item)
                : [...prev, item]
        );
    };

    const validateStep = () => {
        switch (currentStep) {
            case 1:
            case 1:
                return selectedCohorts.length > 0 || selectedUsers.length > 0;
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
        let errors = [];
        let successCount = 0;

        try {
            // Helper function to send request
            const sendRequest = async (type, selected) => {
                const payload = {
                    type: type,
                    selected: selected, // Backend expects array of strings
                    dataset_name: selectedDatabase,
                    random_questions: randomQuestions,
                    number_of_questions: parseInt(numQuestions),
                    start_date: startDate,
                    end_date: endDate,
                    start_time: startTime,
                    end_time: endTime
                };

                console.log(`Submitting SQL Assessment Payload (${type}):`, payload);

                const response = await fetch('https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    let displayMsg = `Failed to create for ${type}.`;
                    try {
                        const errObj = JSON.parse(errText);
                        // ... (keep existing error parsing logic mostly, simplified for brevity here or reuse)
                        displayMsg = errObj.message || errObj.error || errText;
                    } catch (e) {
                        displayMsg = errText;
                    }
                    throw new Error(displayMsg);
                }
            };

            // Send for Cohorts if any selected
            if (selectedCohorts.length > 0) {
                try {
                    await sendRequest('cohorts', selectedCohorts);
                    successCount++;
                } catch (err) {
                    errors.push(`Cohorts Error: ${err.message}`);
                }
            }

            // Send for Users if any selected
            if (selectedUsers.length > 0) {
                try {
                    await sendRequest('users', selectedUsers);
                    successCount++;
                } catch (err) {
                    errors.push(`Users Error: ${err.message}`);
                }
            }

            if (errors.length === 0 && successCount > 0) {
                setShowSuccessModal(true);
            } else if (errors.length > 0) {
                // If mixed access (some success, some fail) or total fail
                setErrorMessage(errors.join('\n'));
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
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200 text-center">
                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-2xl font-bold">check</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Success!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
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
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200 text-center">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-2xl font-bold">close</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Error</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 break-words text-sm">
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
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Select Participants</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Choose who will take this assessment</p>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Assign To</label>
                            <div className="flex gap-4 mb-4">
                                <label className={`flex-1 cursor-pointer p-4 rounded-xl border-2 transition-all ${viewType === 'cohorts'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="viewType"
                                        value="cohorts"
                                        checked={viewType === 'cohorts'}
                                        onChange={() => setViewType('cohorts')}
                                        className="hidden"
                                    />
                                    <div className="flex flex-col items-center justify-center gap-2 font-semibold">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined">groups</span>
                                            Cohorts
                                        </div>
                                        {selectedCohorts.length > 0 && (
                                            <span className="text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 py-0.5 px-2 rounded-full">
                                                {selectedCohorts.length} selected
                                            </span>
                                        )}
                                    </div>
                                </label>
                                <label className={`flex-1 cursor-pointer p-4 rounded-xl border-2 transition-all ${viewType === 'users'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="viewType"
                                        value="users"
                                        checked={viewType === 'users'}
                                        onChange={() => setViewType('users')}
                                        className="hidden"
                                    />
                                    <div className="flex flex-col items-center justify-center gap-2 font-semibold">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined">person</span>
                                            Users
                                        </div>
                                        {selectedUsers.length > 0 && (
                                            <span className="text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 py-0.5 px-2 rounded-full">
                                                {selectedUsers.length} selected
                                            </span>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select {viewType === 'cohorts' ? 'Cohorts' : 'Users'}</label>
                            {loadingTargets ? (
                                <div className="text-center py-8">
                                    <span className="material-symbols-outlined animate-spin text-4xl text-red-500">progress_activity</span>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading list...</p>
                                </div>
                            ) : (viewType === 'cohorts' ? cohortsList : usersList).length === 0 ? (
                                <div className="py-8 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                    No {viewType} found.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-100 dark:border-gray-700 rounded-lg">
                                    {(viewType === 'cohorts' ? cohortsList : usersList).map(item => {
                                        const isSelected = viewType === 'cohorts' ? selectedCohorts.includes(item) : selectedUsers.includes(item);
                                        const toggleHandler = viewType === 'cohorts' ? () => handleCohortToggle(item) : () => handleUserToggle(item);

                                        return (
                                            <div
                                                key={item}
                                                onClick={toggleHandler}
                                                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${isSelected
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                <span className="text-sm font-medium">{item}</span>
                                                {isSelected && (
                                                    <span className="material-symbols-outlined text-red-500 text-lg">check_circle</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {viewType === 'cohorts' ? `Cohorts Selected: ${selectedCohorts.length}` : `Users Selected: ${selectedUsers.length}`}
                            </p>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Select Database</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Choose the SQL database for this assessment</p>

                        {loadingDatabases ? (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined animate-spin text-4xl text-red-500">progress_activity</span>
                                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading databases...</p>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Available Databases
                                </label>
                                <select
                                    value={selectedDatabase}
                                    onChange={(e) => setSelectedDatabase(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="">Select a database...</option>
                                    {databases.map((db, idx) => (
                                        <option key={idx} value={db}>{db}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {selectedDatabase && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">database</span>
                                    <div>
                                        <p className="text-blue-900 dark:text-blue-200 font-semibold text-sm">Selected Database: {selectedDatabase}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 3:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Schedule Assessment</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Set the start and end time for availability</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div>
                                    <CustomDatePicker
                                        label="Start Date"
                                        value={startDate}
                                        onChange={setStartDate}
                                    />
                                </div>
                            </div>
                            <div>
                                <CustomTimePicker
                                    label="Start Time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div>
                                <div>
                                    <CustomDatePicker
                                        label="End Date"
                                        value={endDate}
                                        onChange={setEndDate}
                                    />
                                </div>
                            </div>
                            <div>
                                <CustomTimePicker
                                    label="End Time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Question Settings</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Configure question count and randomization</p>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Number of Questions
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div className="mb-6 flex items-center">
                            <input
                                id="random_questions"
                                type="checkbox"
                                checked={randomQuestions}
                                onChange={(e) => setRandomQuestions(e.target.checked)}
                                className="w-5 h-5 text-red-500 focus:ring-red-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                            />
                            <label htmlFor="random_questions" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Randomize Questions
                            </label>
                        </div>

                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">shuffle</span>
                                <div>
                                    <p className="text-yellow-900 dark:text-yellow-200 font-semibold text-sm">Randomization</p>
                                    <p className="text-yellow-800 dark:text-yellow-300 text-sm mt-1">
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
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Review & Create Assessment</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Review all details before creating the assessment</p>

                        <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Participants</h3>
                                    <button onClick={() => setCurrentStep(1)} className="text-red-500 hover:text-red-600 text-sm font-semibold">Edit</button>
                                </div>
                                {selectedCohorts.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-sm">groups</span>
                                            <span className="capitalize font-medium text-gray-900 dark:text-gray-200">Cohorts</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCohorts.map((t, i) => (
                                                <span key={i} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium border border-gray-200 dark:border-gray-600">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedUsers.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-sm">person</span>
                                            <span className="capitalize font-medium text-gray-900 dark:text-gray-200">Users</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUsers.map((t, i) => (
                                                <span key={i} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium border border-gray-200 dark:border-gray-600">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Database</h3>
                                    <button onClick={() => setCurrentStep(2)} className="text-red-500 hover:text-red-600 text-sm font-semibold">Edit</button>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
                                    <span className="material-symbols-outlined text-gray-400 text-sm">database</span>
                                    {selectedDatabase}
                                </p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Schedule</h3>
                                    <button onClick={() => setCurrentStep(3)} className="text-red-500 hover:text-red-600 text-sm font-semibold">Edit</button>
                                </div>
                                <div className="text-gray-600 dark:text-gray-400 text-sm space-y-1">
                                    <p><span className="font-medium text-gray-900 dark:text-gray-200">Start:</span> {startDate} at {startTime}</p>
                                    <p><span className="font-medium text-gray-900 dark:text-gray-200">End:</span> {endDate} at {endTime}</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Questions</h3>
                                    <button onClick={() => setCurrentStep(4)} className="text-red-500 hover:text-red-600 text-sm font-semibold">Edit</button>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">
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
        <div className="w-full max-w-full mt-6 px-6 md:px-12">
            {/* Back Button */}
            <button
                onClick={() => navigate('/sql-playground')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4 transition-colors"
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
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    {step.num}
                                </div>
                                <span className="hidden sm:block text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-2">{step.label}</span>
                            </div>
                            {index < 4 && (
                                <div className="flex-1 h-0.5 md:h-1 mx-2 md:mx-4 mb-0 sm:mb-6 self-center">
                                    <div
                                        className={`h-full transition-all duration-300 ${step.num < currentStep ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6">
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
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                            <span>Previous</span>
                        </button>

                        <button
                            onClick={nextStep}
                            disabled={!validateStep()}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-colors ${!validateStep()
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
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

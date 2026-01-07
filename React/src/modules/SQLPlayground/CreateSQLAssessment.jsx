import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';

function CreateSQLAssessment() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const referrer = searchParams.get('from');

    // State
    const [currentStep, setCurrentStep] = useState(1);
    const [assessmentName, setAssessmentName] = useState('');
    const [participants, setParticipants] = useState([]); // Placeholder for now
    const [selectedDataset, setSelectedDataset] = useState('');
    const [datasets, setDatasets] = useState([]);
    const [duration, setDuration] = useState('60');
    const [questionCount, setQuestionCount] = useState('10');
    const [randomQuestions, setRandomQuestions] = useState(false);
    const [loadingDatasets, setLoadingDatasets] = useState(false);
    const [datasetError, setDatasetError] = useState('');

    const totalSteps = 5;

    useEffect(() => {
        if (currentStep === 2) {
            fetchDatasets();
        }
    }, [currentStep]);

    const fetchDatasets = async () => {
        setLoadingDatasets(true);
        setDatasetError('');
        try {
            const response = await fetch('https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin?type=databases', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Failed to fetch databases');

            const data = await response.json();

            if (data && data.databases) {
                // Map array of strings to objects expected by select
                const mappedDatasets = data.databases.map(db => ({
                    s3_key: db,
                    filename: db
                }));
                setDatasets(mappedDatasets);
            } else {
                throw new Error('Failed to fetch databases');
            }
        } catch (error) {
            console.error('Error:', error);
            setDatasetError('Failed to load datasets');
        } finally {
            setLoadingDatasets(false);
        }
    };

    const handleCreate = async () => {
        // Implementation similar to CreateAssessment
        const assessmentData = {
            name: assessmentName,
            assigned_cohorts: [], // To be implemented
            csv_s3_key: selectedDataset,
            num_questions: parseInt(questionCount),
            duration_minutes: parseInt(duration),
            random_questions: randomQuestions
        };

        const payload = {
            action: "create_assessment",
            assessment: assessmentData
        };

        try {
            const response = await fetch('/assessment-mgmt-api/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            let success = data.success;
            if (data.body) {
                const body = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
                success = body.success;
            }

            if (success) {
                alert('Assessment created successfully!');
                navigate('/sql-playground');
            } else {
                alert('Failed to create assessment');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred');
        }
    };

    const validateStep = () => {
        switch (currentStep) {
            case 1: return assessmentName.trim() !== '';
            case 2: return selectedDataset !== '';
            case 3: return parseInt(duration) > 0;
            case 4: return parseInt(questionCount) > 0;
            default: return true;
        }
    };

    const nextStep = () => {
        if (validateStep()) setCurrentStep(Math.min(currentStep + 1, totalSteps));
    };

    const prevStep = () => {
        setCurrentStep(Math.max(currentStep - 1, 1));
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Assessment Details & Participants</h2>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Assessment Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                value={assessmentName}
                                onChange={(e) => setAssessmentName(e.target.value)}
                                placeholder="e.g. SQL Midterm"
                            />
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Participant management coming soon. For now, assessment will be public/link-accessible.</p>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Select Database</h2>
                        {loadingDatasets ? (
                            <div className="text-center py-8"><span className="material-symbols-outlined animate-spin text-red-500 text-3xl">progress_activity</span></div>
                        ) : (
                            <div className="space-y-4">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Available Databases</label>
                                <select
                                    value={selectedDataset}
                                    onChange={(e) => setSelectedDataset(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                >
                                    <option value="">Select a dataset...</option>
                                    {datasets.map(ds => (
                                        <option key={ds.s3_key} value={ds.s3_key}>{ds.filename || ds.s3_key}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                );
            case 3: // Schedule -> Duration for now
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Schedule & Duration</h2>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Duration (minutes)</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                            />
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Questions Configuration</h2>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Number of Questions</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg"
                                value={questionCount}
                                onChange={(e) => setQuestionCount(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={randomQuestions}
                                onChange={(e) => setRandomQuestions(e.target.checked)}
                                className="w-5 h-5 text-red-500 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                            />
                            <label className="ml-2 text-gray-700 dark:text-gray-300">Randomize Questions</label>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Review</h2>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg space-y-3 dark:text-gray-300">
                            <p><strong className="text-gray-900 dark:text-gray-100">Name:</strong> {assessmentName}</p>
                            <p><strong className="text-gray-900 dark:text-gray-100">Database:</strong> {selectedDataset}</p>
                            <p><strong className="text-gray-900 dark:text-gray-100">Duration:</strong> {duration} mins</p>
                            <p><strong className="text-gray-900 dark:text-gray-100">Questions:</strong> {questionCount} ({randomQuestions ? 'Randomized' : 'Sequential'})</p>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="w-full mt-6 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-lg hover:shadow-xl"
                        >
                            Create Assessment
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    const breadcrumbItems = [
        { label: 'SQL Playground', path: '/sql-playground' },
        { label: 'Create New Assessment' }
    ];

    return (
        <div className="w-full mt-2 ml-2 p-4 md:p-6 transition-colors duration-300">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Assessment</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Configure assessment details, participants, and timeline.</p>
            </div>

            {/* Stepper Visuals - Simplified */}
            <div className="mb-8 flex justify-between px-4">
                {[1, 2, 3, 4, 5].map(step => (
                    <div key={step} className={`flex flex-col items-center ${step <= currentStep ? 'text-red-600 dark:text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${step <= currentStep ? 'border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                            {step}
                        </div>
                        <span className="text-xs mt-1 font-medium">Step {step}</span>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-brand-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 mb-6">
                {renderStepContent()}
            </div>

            {currentStep < 5 && (
                <div className="flex justify-between">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className={`px-6 py-3 rounded-xl font-semibold border ${currentStep === 1
                            ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        Previous
                    </button>
                    <button
                        onClick={nextStep}
                        disabled={!validateStep()}
                        className={`px-8 py-3 rounded-xl font-semibold bg-red-600 text-white ${!validateStep() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
                    >
                        Next Step
                    </button>
                </div>
            )}
        </div>
    );
}

export default CreateSQLAssessment;

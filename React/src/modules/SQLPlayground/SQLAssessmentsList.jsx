import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Breadcrumbs from '../../components/Breadcrumbs';

function SQLAssessmentsList() {
    const navigate = useNavigate();
    const { userRole } = useAuth();

    // List State
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Taking State
    const [activeAssessment, setActiveAssessment] = useState(null);
    const [assessmentDetails, setAssessmentDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const isAdminOrTrainer = userRole === 'admin' || userRole === 'trainer';

    const handleEdit = (assessment) => {
        // Navigate to create assessment page with edit mode
        navigate(`/sql-playground/create-assessment?edit=${assessment.assessment_id}`, {
            state: { assessment }
        });
    };

    const deleteAssessment = async (assessmentId) => {
        try {
            const payload = {
                action: "delete_assessment",
                assessment_id: assessmentId
            };

            const response = await fetch('/assessment-mgmt-api/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // alert('Assessment deleted successfully'); // Optional, maybe just refresh
                setDeleteConfirm(null);
                fetchAssessments();
            } else {
                alert('Failed to delete assessment');
            }
        } catch (error) {
            console.error('Error deleting assessment:', error);
            alert('An error occurred while deleting the assessment');
        }
    };

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = { action: "list_assessments" };
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

            // Handle Lambda response structure (body might be stringified)
            let responseBody = data;
            if (data.body) {
                try {
                    responseBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
                } catch (e) {
                    console.error("Failed to parse response body", e);
                }
            }

            if (responseBody && responseBody.success) {
                // Show all assessments provided by the management API
                // Previously filtered out .csv, but created assessments have .csv keys
                const allAssessments = responseBody.assessments || [];
                // Filter for SQL assessments: These are created using the predefined datasets 
                // which are stored in the 'datasets/' folder in S3.
                // General assessments or others might use full s3:// paths or other prefixes.
                const validAssessments = allAssessments.filter(a =>
                    a.csv_s3_key && a.csv_s3_key.startsWith('datasets/')
                );
                setAssessments(validAssessments);
            } else {
                throw new Error(responseBody?.message || 'Failed to fetch assessments');
            }
        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartAssessment = async (assessment) => {
        setActiveAssessment(assessment);
        setLoadingDetails(true);
        setDetailsError(null);
        setAssessmentDetails(null);
        setCurrentQuestionIndex(0);

        try {
            // Use the INDEPENDENT SQL Assessment Details API
            const response = await fetch(`/sql-assessment-details-api?assessment_id=${assessment.assessment_id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Failed to load assessment details');

            const data = await response.json();

            // Handle Lambda response structure (body might be stringified)
            let details = data;
            if (data.body) {
                try {
                    details = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
                } catch (e) {
                    console.error("Failed to parse details body", e);
                }
            }

            if (!details || (!details.questions && !details.assessment_id)) {
                throw new Error('Invalid assessment details format');
            }

            setAssessmentDetails(details);
        } catch (err) {
            console.error(err);
            setDetailsError(err.message || 'Failed to fetch questions');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleBackToList = () => {
        setActiveAssessment(null);
        setAssessmentDetails(null);
    };

    const breadcrumbItems = [
        { label: 'SQL Playground', path: '/sql-playground' },
        { label: activeAssessment ? activeAssessment.name : 'Assessments' }
    ];

    // --- Render Taking View ---
    if (activeAssessment) {
        return (
            <div className="w-full mt-2 ml-2 p-4 md:p-6 transition-colors duration-300">
                <Breadcrumbs items={breadcrumbItems} />

                <button
                    onClick={handleBackToList}
                    className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to List
                </button>

                {loadingDetails ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined animate-spin text-4xl text-red-500 mb-4">progress_activity</span>
                        <p className="text-gray-500">Loading questions...</p>
                    </div>
                ) : detailsError ? (
                    <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800 text-center">
                        <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
                        <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-1">Error Loading Assessment</h3>
                        <p className="text-red-600 dark:text-red-400">{detailsError}</p>
                    </div>
                ) : assessmentDetails && assessmentDetails.questions ? (
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-6 flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{assessmentDetails.name}</h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    Question {currentQuestionIndex + 1} of {assessmentDetails.questions.length}
                                </p>
                            </div>
                            <div className="text-lg font-mono font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
                                {assessmentDetails.duration_minutes} mins
                            </div>
                        </div>

                        {/* Question Card */}
                        <div className="bg-white dark:bg-brand-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-8 leading-relaxed">
                                {assessmentDetails.questions[currentQuestionIndex].question}
                            </h2>

                            <div className="space-y-4">
                                {['a', 'b', 'c', 'd'].map((optKey) => {
                                    const optionText = assessmentDetails.questions[currentQuestionIndex][`option_${optKey}`];
                                    if (!optionText) return null;

                                    return (
                                        <div
                                            key={optKey}
                                            className="p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-all flex items-center gap-4 group"
                                        >
                                            <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-red-500 flex items-center justify-center font-bold text-gray-400 group-hover:text-red-500 uppercase">
                                                {optKey}
                                            </div>
                                            <span className="text-gray-700 dark:text-gray-200 font-medium">{optionText}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(assessmentDetails.questions.length - 1, prev + 1))}
                                disabled={currentQuestionIndex === assessmentDetails.questions.length - 1}
                                className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
                            >
                                Next Question
                            </button>
                        </div>

                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">No questions found.</div>
                )}
            </div>
        );
    }

    // --- Render List View ---
    return (
        <div className="w-full mt-2 ml-2 p-4 md:p-6 transition-colors duration-300">
            <Breadcrumbs items={breadcrumbItems} />

            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">SQL Assessments</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Manage and take available SQL assessments.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchAssessments}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                    >
                        <span className="material-symbols-outlined">refresh</span>
                        Refresh
                    </button>
                    {isAdminOrTrainer && (
                        <button
                            onClick={() => navigate('/sql-playground/create-assessment')}
                            className="flex items-center gap-2 bg-red-600 dark:bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium shadow-sm"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Create
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <span className="material-symbols-outlined animate-spin text-4xl text-red-500 mb-4">progress_activity</span>
                    <p className="text-gray-500">Loading assessments...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                    Error: {error}
                </div>
            ) : assessments.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-brand-card rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-gray-500">assignment</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No SQL Assessments Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Assessments created here will appear in this list.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.map((assessment) => (
                        <div key={assessment.assessment_id} className="bg-white dark:bg-brand-card rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col transition hover:shadow-md hover:border-red-100 dark:hover:border-red-900/30 group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xl group-hover:scale-110 transition-transform">
                                    {assessment.name.charAt(0).toUpperCase()}
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${assessment.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {assessment.status || 'Active'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 truncate" title={assessment.name}>{assessment.name}</h3>
                            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2 mb-6 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">database</span>
                                    Using DB: <span className="font-medium text-gray-700 dark:text-gray-300">{assessment.csv_s3_key || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">list</span>
                                    {assessment.num_questions} Questions
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">schedule</span>
                                    {assessment.duration_minutes} mins
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                {isAdminOrTrainer ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => handleStartAssessment(assessment)}
                                            className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition text-sm font-semibold shadow-sm"
                                            title="Start"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                                            <span className="hidden xl:inline">Start</span>
                                        </button>
                                        <button
                                            onClick={() => handleEdit(assessment)}
                                            className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition text-sm font-semibold shadow-sm"
                                            title="Edit"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                            <span className="hidden xl:inline">Edit</span>
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(assessment.assessment_id)}
                                            className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition text-sm font-semibold shadow-sm"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                            <span className="hidden xl:inline">Delete</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleStartAssessment(assessment)}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-red-100 dark:shadow-none"
                                    >
                                        <span>Start Assessment</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl transform scale-100 animate-in zoom-in-95 duration-200 border dark:border-gray-700">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">warning</span>
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-900 dark:text-gray-100 mb-2">Delete Assessment?</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
                            Are you sure you want to delete this assessment? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteAssessment(deleteConfirm)}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SQLAssessmentsList;

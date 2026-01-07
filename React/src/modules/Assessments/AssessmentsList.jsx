import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Breadcrumbs from '../../components/Breadcrumbs';

function AssessmentsList({ onBack }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { userRole } = useAuth();
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const isAdminOrTrainer = userRole === 'admin' || userRole === 'trainer';

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);

        if (!forceRefresh) {
            const cached = sessionStorage.getItem('cached_assessments');
            if (cached) {
                try {
                    setAssessments(JSON.parse(cached));
                    setLoading(false);
                    return;
                } catch (e) {
                    sessionStorage.removeItem('cached_assessments');
                }
            }
        }

        try {
            // Use direct format (no body wrapper)
            const payload = {
                action: "list_assessments"
            };

            const response = await fetch('/assessment-mgmt-api/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Parse response body
            const responseBody = data;

            if (responseBody && responseBody.success) {
                const fetchedAssessments = responseBody.assessments || [];
                setAssessments(fetchedAssessments);
                sessionStorage.setItem('cached_assessments', JSON.stringify(fetchedAssessments));
            } else {
                throw new Error(responseBody?.message || 'Failed to fetch assessments');
            }

        } catch (err) {
            console.error('Error fetching assessments:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteAssessment = async (assessmentId) => {
        try {
            // Use direct format (no body wrapper)
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
                alert('Assessment deleted successfully');
                setDeleteConfirm(null);
                fetchAssessments(true); // Refresh the list forcefully
            } else {
                alert('Failed to delete assessment');
            }
        } catch (error) {
            console.error('Error deleting assessment:', error);
            alert('An error occurred while deleting the assessment');
        }
    };

    const handleEdit = (assessment) => {
        // Navigate to create assessment page with edit mode
        navigate(`/create-assessment?edit=${assessment.assessment_id}`, {
            state: { assessment }
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const breadcrumbItems = [
        { label: 'Assessments', path: '/assessments' },
        { label: 'Assessments List' }
    ];

    return (
        <div className="w-full px-4 md:px-8 mt-6 transition-colors duration-300">
            <Breadcrumbs items={breadcrumbItems} />

            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assessments</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and monitor assessments</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => fetchAssessments(true)}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 transition-all font-medium"
                        disabled={loading}
                    >
                        <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        <span>Refresh</span>
                    </button>
                    {isAdminOrTrainer && (
                        <button
                            onClick={() => navigate('/create-assessment')}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-red-100 dark:shadow-none"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Create New Assessment
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <span className="material-symbols-outlined animate-spin text-4xl text-red-500 mb-4">progress_activity</span>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Loading assessments...</p>
                </div>
            ) : error ? (
                <div className="flex justify-center py-12">
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900/30 h-fit mx-auto">
                        <span className="material-symbols-outlined">error</span>
                        <p className="font-medium">{error}</p>
                    </div>
                </div>
            ) : assessments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-brand-card rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-gray-500">assignment</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Assessments Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm text-center mb-6">Create your first assessment to start evaluating candidates.</p>
                    {isAdminOrTrainer && (
                        <button
                            onClick={() => navigate('/create-assessment')}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold"
                        >
                            Create an assessment
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.map((assessment) => (
                        <div key={assessment.assessment_id} className="bg-white dark:bg-brand-card rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col transition hover:shadow-md hover:border-red-100 dark:hover:border-red-900/30 group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xl group-hover:scale-110 transition-transform">
                                    {assessment.name.charAt(0).toUpperCase()}
                                </div>
                                {assessment.random_questions && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[10px]">shuffle</span>
                                        Randomized
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 truncate" title={assessment.name}>{assessment.name}</h3>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mb-4 font-mono">ID: {assessment.assessment_id.substring(0, 8)}...</div>

                            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2 mb-6 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">database</span>
                                    Dataset: <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={assessment.csv_s3_key}>{assessment.csv_s3_key || 'N/A'}</span>
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
                                            onClick={() => navigate(`/assessment/take/${assessment.assessment_id}`)}
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
                                        onClick={() => navigate(`/assessment/take/${assessment.assessment_id}`)}
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
            {
                deleteConfirm && (
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
                )
            }
        </div >
    );
}

export default AssessmentsList;

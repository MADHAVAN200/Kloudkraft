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

    const fetchAssessments = async () => {
        setLoading(true);
        setError(null);
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
                setAssessments(responseBody.assessments || []);
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
                fetchAssessments(); // Refresh the list
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

            {/* Content */}
            <div className="bg-white dark:bg-brand-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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
                    <div className="flex flex-col items-center justify-center py-16">
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
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dataset</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Format</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {assessments.map((assessment) => (
                                    <tr key={assessment.assessment_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400 mr-4 font-bold">
                                                    {assessment.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100">{assessment.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        ID: {assessment.assessment_id.substring(0, 8)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-base text-gray-400 dark:text-gray-500">database</span>
                                                {assessment.csv_s3_key || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                                {assessment.num_questions} Questions
                                                {assessment.random_questions && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                                                        Randomized
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {assessment.duration_minutes} mins
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-gray-400 dark:text-gray-500">
                                                <button
                                                    onClick={() => navigate(`/take-assessment/${assessment.assessment_id}`)}
                                                    className="p-2 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                    title="Take Assessment"
                                                >
                                                    <span className="material-symbols-outlined">play_arrow</span>
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(assessment)}
                                                    className="p-2 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Edit Assessment"
                                                >
                                                    <span className="material-symbols-outlined">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(assessment.assessment_id)}
                                                    className="p-2 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete Assessment"
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

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

export default AssessmentsList;

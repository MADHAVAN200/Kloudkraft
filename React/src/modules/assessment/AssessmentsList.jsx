import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function AssessmentsList({ onBack }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { userRole } = useAuth();
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const isAdminOrTrainer = userRole === 'admin' || userRole === 'trainer';

    // Get the referrer from URL params
    const referrer = searchParams.get('from');

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        setLoading(true);
        setError(null);
        try {
            // Use direct format (no body wrapper)
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

    // Handle back navigation
    const handleBack = () => {
        if (referrer === 'sql-playground') {
            navigate('/sql-playground');
        } else if (referrer === 'assessments') {
            navigate('/assessments');
        } else if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const deleteAssessment = async (assessmentId) => {
        try {
            // Use direct format (no body wrapper)
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

    return (
        <div className="w-full px-4 md:px-8 mt-6">
            {/* Back Button */}
            {referrer && (
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span className="font-medium">Back</span>
                </button>
            )}

            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Assessments</h1>
                    <p className="text-gray-600 text-sm">Manage and view all created assessments.</p>
                </div>
                <button
                    onClick={fetchAssessments}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors self-end sm:self-auto"
                    title="Refresh"
                >
                    <span className="material-symbols-outlined">refresh</span>
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <span className="material-symbols-outlined animate-spin text-4xl text-red-500 mb-4">progress_activity</span>
                    <p className="text-gray-500">Loading assessments...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
                    <p className="text-red-700 font-medium mb-1">Failed to load assessments</p>
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                    <button
                        onClick={fetchAssessments}
                        className="text-red-700 hover:text-red-800 font-semibold text-sm underline"
                    >
                        Try Again
                    </button>
                </div>
            ) : assessments.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                    <span className="material-symbols-outlined text-gray-400 text-5xl mb-4">assignment_off</span>
                    <p className="text-gray-600 font-medium mb-2">No assessments found</p>
                    <p className="text-gray-500 text-sm">Create a new assessment to get started.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-fixed">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="w-[30%] px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Assessment Name
                                    </th>
                                    <th className="w-[15%] px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th className="w-[10%] px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Questions
                                    </th>
                                    <th className="w-[10%] px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="w-[20%] px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Created At
                                    </th>
                                    <th className="w-[15%] px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {assessments.map((assessment) => (
                                    <tr key={assessment.assessment_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4 text-sm font-medium text-gray-900 truncate" title={assessment.name}>
                                            {assessment.name}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 text-center whitespace-nowrap">
                                            {assessment.duration_minutes ? `${assessment.duration_minutes} mins` : 'N/A'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 text-center whitespace-nowrap">
                                            {assessment.num_questions || 0}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${assessment.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {assessment.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500 text-center whitespace-nowrap">
                                            {formatDate(assessment.created_at)}
                                        </td>
                                        <td className="px-4 py-4 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                {isAdminOrTrainer ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(assessment)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <span className="material-symbols-outlined text-base">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/assessment/take/${assessment.assessment_id}`)}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Take Assessment"
                                                        >
                                                            <span className="material-symbols-outlined text-base">play_arrow</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(assessment.assessment_id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <span className="material-symbols-outlined text-base">delete</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => navigate(`/assessment/take/${assessment.assessment_id}`)}
                                                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium text-xs transition-colors flex items-center gap-1.5"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                                                        <span>Start</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Assessment</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this assessment? This action cannot be undone.</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteAssessment(deleteConfirm)}
                                className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors"
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

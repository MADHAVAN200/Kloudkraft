import React, { useState } from 'react';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useAuth } from '../../contexts/AuthContext';

const API_ENDPOINT = '/reports-api/';

function AssessmentReports() {
    const [cohortId, setCohortId] = useState('Batch_Alpha');
    const [searchQuery, setSearchQuery] = useState('');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    const breadcrumbItems = [
        { label: 'Assessments', path: '/assessments' },
        { label: 'Reports' }
    ];

    const fetchReports = async () => {
        if (!cohortId) {
            setError("Please enter a Cohort ID");
            return;
        }

        setLoading(true);
        setError(null);
        setReportData(null);

        try {
            const response = await fetch(`${API_ENDPOINT}?cohort=${encodeURIComponent(cohortId)}`, {
                method: 'GET',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error ${response.status}: Failed to fetch reports`);
            }

            const data = await response.json();
            setReportData(data);

        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!cohortId) return;

        setDownloading(true);
        try {
            const response = await fetch(`${API_ENDPOINT}?cohort=${encodeURIComponent(cohortId)}&download=1`, {
                method: 'GET',
            });

            if (!response.ok) throw new Error("Failed to generate download link");

            const data = await response.json();

            if (data.excel_download_url) {
                window.location.href = data.excel_download_url;
            } else {
                throw new Error("Download URL not received");
            }
        } catch (err) {
            alert(`Download failed: ${err.message}`);
        } finally {
            setDownloading(false);
        }
    };

    // Filter members based on search query
    const filteredMembers = reportData?.members?.filter((member) =>
        (member.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (member.user_id?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ) || [];

    const { userRole } = useAuth(); // Get user role

    // DUMMY DATA FOR CANDIDATE VIEW
    const CANDIDATE_SCORES = [
        { name: 'Cloud Fundamentals', date: '2025-01-10', score: 85, status: 'Completed' },
        { name: 'DevOps Basics', date: '2025-01-12', score: 92, status: 'Completed' },
        { name: 'AWS Essentials', date: '2025-01-05', score: 78, status: 'Completed' },
        { name: 'Security Compliance', date: '2025-01-15', score: null, status: 'Pending' },
    ];

    if (userRole === 'candidate') {
        return (
            <div className="w-full mt-2 ml-2 transition-colors duration-300">
                <Breadcrumbs items={breadcrumbItems} />
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Assessment Scores</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        View your performance history.
                    </p>
                </div>

                <div className="bg-white dark:bg-brand-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Assessment Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Date Taken</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {CANDIDATE_SCORES.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{item.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">{item.score !== null ? `${item.score}%` : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full mt-2 ml-2 transition-colors duration-300">
            <Breadcrumbs items={breadcrumbItems} />

            {/* Header & Controls */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Student Reports</h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            View performance reports for your cohorts.
                        </p>
                    </div>
                </div>

                {/* Cohort Selector & Actions */}
                <div className="bg-white dark:bg-brand-card p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                            Cohort ID
                        </label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                group
                            </span>
                            <input
                                type="text"
                                value={cohortId}
                                onChange={(e) => setCohortId(e.target.value)}
                                placeholder="e.g. Batch_Alpha"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                // Standard fetch on Enter
                                onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
                            />
                        </div>
                    </div>
                    <button
                        onClick={fetchReports}
                        disabled={loading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <span className="material-symbols-outlined text-xl">refresh</span>
                        )}
                        <span>Fetch Reports</span>
                    </button>

                    {reportData && (
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {downloading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <span className="material-symbols-outlined text-xl">download</span>
                            )}
                            <span>Download CSV</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-3">
                    <span className="material-symbols-outlined">error</span>
                    <div>
                        <p className="font-semibold">Error Loading Reports</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* --- REPORT VIEW (Single Cohort) --- */}
            {reportData?.stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatsCard
                        title="Total Members"
                        value={reportData.stats.total_members}
                        icon="groups"
                        color="blue"
                    />
                    <StatsCard
                        title="Completed"
                        value={reportData.stats.completed}
                        icon="check_circle"
                        color="green"
                    />
                    <StatsCard
                        title="Average Score"
                        value={`${reportData.stats.average_score}%`}
                        icon="bar_chart"
                        color="purple"
                    />
                </div>
            )}

            {reportData && (
                <>
                    {/* Members Table */}
                    <div className="bg-white dark:bg-brand-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                            User Info
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                            Score
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                            Source File
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredMembers.length > 0 ? (
                                        filteredMembers.map((member, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {member.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {member.user_id}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.status === 'Completed'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {member.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    {member.score !== undefined && member.score !== null ? member.score : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                    {member.file_source}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">search_off</span>
                                                    <p>No members found matching "{searchQuery}"</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {!reportData && !loading && !error && (
                <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-brand-card rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <span className="material-symbols-outlined text-3xl">analytics</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">No Reports Loaded</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mt-1">
                        Enter a Cohort ID and click 'Fetch Reports' to view assessment performance data.
                    </p>
                </div>
            )}
        </div>
    );
}

// Stats Card Component
const StatsCard = ({ title, value, icon, color }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    };

    return (
        <div className="bg-white dark:bg-brand-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color] || colorClasses.blue}`}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            </div>
        </div>
    );
};

export default AssessmentReports;

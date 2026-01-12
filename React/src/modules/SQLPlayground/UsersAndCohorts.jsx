import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';

function UsersAndCohorts() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [cohorts, setCohorts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else {
            fetchCohorts();
        }
    }, [activeTab]);

    const fetchUsers = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);

        if (!forceRefresh) {
            const cached = sessionStorage.getItem('cached_users');
            if (cached) {
                try {
                    setUsers(JSON.parse(cached));
                    setLoading(false);
                    return;
                } catch (e) {
                    sessionStorage.removeItem('cached_users');
                }
            }
        }

        try {
            // Using the new SQL Admin API directly
            const response = await fetch('/sql-admin-api/SQLAdmin?type=users', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`API failed with status: ${response.status}`);
            }

            const data = await response.json();

            // Expected format: { count: 5, users: ["name1", "name2"] }
            if (data.users && Array.isArray(data.users)) {
                setUsers(data.users);
                sessionStorage.setItem('cached_users', JSON.stringify(data.users));
            } else {
                console.warn('API returned unexpected format:', data);
                setUsers([]);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users from the API.');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCohorts = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);

        if (!forceRefresh) {
            const cached = sessionStorage.getItem('cached_cohorts');
            if (cached) {
                try {
                    setCohorts(JSON.parse(cached));
                    setLoading(false);
                    return;
                } catch (e) {
                    sessionStorage.removeItem('cached_cohorts');
                }
            }
        }

        try {
            // Using the new SQL Admin API directly
            const response = await fetch('/sql-admin-api/SQLAdmin?type=cohorts', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`API failed with status: ${response.status}`);
            }

            const data = await response.json();

            // Expected format: { count: 3, cohorts: ["name1", "name2"] }
            if (data.cohorts && Array.isArray(data.cohorts)) {
                setCohorts(data.cohorts);
                sessionStorage.setItem('cached_cohorts', JSON.stringify(data.cohorts));
            } else {
                console.warn('API returned unexpected format:', data);
                setCohorts([]);
            }
        } catch (err) {
            console.error('Error fetching cohorts:', err);
            setError('Failed to load cohorts from the API.');
            setCohorts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        if (activeTab === 'users') {
            fetchUsers(true);
        } else {
            fetchCohorts(true);
        }
    };

    const breadcrumbItems = [
        { label: 'SQL Playground', path: '/sql-playground' },
        { label: 'Users & Cohorts' }
    ];

    return (
        <div className="w-full mt-2 ml-2 p-4 md:p-6 transition-colors duration-300">
            <Breadcrumbs items={breadcrumbItems} />

            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Users & Cohorts</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage user access and create cohorts for assessments.</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 transition-all font-medium"
                        disabled={loading}
                    >
                        <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-white/5 dark:backdrop-blur-lg dark:border-white/10 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-8 py-4 text-sm font-semibold transition-colors ${activeTab === 'users'
                            ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50 dark:bg-red-900/20 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab('cohorts')}
                        className={`px-8 py-4 text-sm font-semibold transition-colors ${activeTab === 'cohorts'
                            ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50 dark:bg-red-900/20 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        Cohorts
                    </button>
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined animate-spin text-4xl text-red-500 mb-4">progress_activity</span>
                            <p className="text-gray-500 dark:text-gray-400">Loading {activeTab}...</p>
                        </div>
                    ) : error ? (
                        <div className="flex justify-center py-12">
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900/30">
                                <span className="material-symbols-outlined">error</span>
                                <p className="font-medium">{error}</p>
                            </div>
                        </div>
                    ) : activeTab === 'users' ? (
                        <>
                            {users.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {users.map((username, idx) => (
                                        <div key={idx} className="bg-white dark:bg-white/5 dark:backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-xl p-4 hover:scale-[1.02] hover:shadow-xl hover:border-red-200 dark:hover:border-red-500/30 transition-all duration-300 ease-in-out flex items-center gap-4 group">
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm bg-gradient-to-br from-red-500 to-red-600">
                                                {username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={username}>
                                                    {username}
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">User</p>
                                            </div>
                                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="material-symbols-outlined">more_vert</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-gray-500">group_off</span>
                                    </div>
                                    <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">No Users Found</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">There are no users to display.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        // Cohorts Tab
                        <>
                            {cohorts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {cohorts.map((cohortName, index) => (
                                        <div key={index} className="bg-white dark:bg-white/5 dark:backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-xl p-6 hover:scale-[1.02] hover:shadow-xl hover:border-red-200 dark:hover:border-red-500/30 transition-all duration-300 ease-in-out flex items-center gap-4">
                                            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                                                <span className="material-symbols-outlined text-2xl">school</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100">{cohortName}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cohort</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-gray-500">school</span>
                                    </div>
                                    <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">No Cohorts Found</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Create a cohort to group students.</p>
                                    <button className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                                        Create Cohort
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UsersAndCohorts;

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Content() {
    const { userRole } = useAuth();
    const isAuthorized = userRole === 'admin' || userRole === 'trainer';

    // Static data for 10 Cohorts as requested
    const [cohorts] = useState([
        { id: 'cohort-123', name: 'Cohort Alpha', description: 'Full Stack Development', students: 25, start_date: '2025-01-10' },
        { id: 'cohort-2', name: 'Cohort Beta', description: 'Data Science Fundamentals', students: 30, start_date: '2025-01-15' },
        { id: 'cohort-3', name: 'Cohort Gamma', description: 'Cyber Security Essentials', students: 20, start_date: '2025-02-01' },
        { id: 'cohort-4', name: 'Cohort Delta', description: 'Cloud Computing Architecture', students: 28, start_date: '2025-02-10' },
        { id: 'cohort-5', name: 'Cohort Epsilon', description: 'AI & Machine Learning', students: 35, start_date: '2025-02-20' },
        { id: 'cohort-6', name: 'Cohort Zeta', description: 'DevOps Engineering', students: 22, start_date: '2025-03-01' },
        { id: 'cohort-7', name: 'Cohort Eta', description: 'Blockchain Technologies', students: 18, start_date: '2025-03-15' },
        { id: 'cohort-8', name: 'Cohort Theta', description: 'UI/UX Design Principles', students: 25, start_date: '2025-04-01' },
        { id: 'cohort-9', name: 'Cohort Iota', description: 'Mobile App Development', students: 24, start_date: '2025-04-10' },
        { id: 'cohort-10', name: 'Cohort Kappa', description: 'Software Testing & QA', students: 20, start_date: '2025-04-20' }
    ]);

    const navigate = useNavigate();

    return (
        <div className="w-full p-4 md:p-6 space-y-6 transition-colors duration-300">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-white/5 dark:backdrop-blur-lg dark:border-white/10 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 transition-colors duration-300">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cohorts</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and view all active training cohorts</p>
                </div>

                {isAuthorized && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium w-full md:w-auto justify-center">
                        <span className="material-symbols-outlined text-xl">add</span>
                        Create Cohort
                    </button>
                )}
            </div>

            {/* Cohorts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {cohorts.map((cohort) => (
                    <div
                        key={cohort.id}
                        onClick={() => navigate(`/cohort-content/${cohort.id}`)}
                        className="group bg-white dark:bg-white/5 dark:backdrop-blur-lg dark:border-white/10 rounded-xl border border-gray-200 hover:scale-[1.02] hover:shadow-xl hover:border-red-200 dark:hover:border-red-500/30 transition-all duration-300 ease-in-out overflow-hidden cursor-pointer"
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                                    <span className="material-symbols-outlined text-2xl">school</span>
                                </div>
                                <button className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                {cohort.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
                                {cohort.description}
                            </p>

                            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                        <span className="material-symbols-outlined text-lg">group</span>
                                        <span>Students</span>
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-gray-200">{cohort.students}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                        <span className="material-symbols-outlined text-lg">event</span>
                                        <span>Start Date</span>
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-gray-200">{cohort.start_date}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Content;

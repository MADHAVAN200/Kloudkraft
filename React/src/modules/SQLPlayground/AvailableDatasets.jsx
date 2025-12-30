import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';

function AvailableDatasets() {
    const navigate = useNavigate();
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDatasets();
    }, []);

    const fetchDatasets = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                action: "list_datasets"
            };

            const response = await fetch('/assessment-mgmt-api/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Handle response based on observed structure in other modules
            // Assuming data.datasets is the array we want
            if (data && data.success && data.datasets) {
                setDatasets(data.datasets);
            } else {
                // Determine error message
                const msg = data?.message || 'Failed to fetch datasets';
                throw new Error(msg);
            }
        } catch (error) {
            console.error('Error fetching datasets:', error);
            setError('Failed to load datasets. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const breadcrumbItems = [
        { label: 'SQL Playground', path: '/sql-playground' },
        { label: 'Available Datasets' }
    ];

    return (
        <div className="w-full mt-2 ml-2 p-4 md:p-6 transition-colors duration-300">
            <Breadcrumbs items={breadcrumbItems} />
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Available Datasets</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Explore the SQL databases available for your assessments.</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-brand-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                            <span className="material-symbols-outlined text-xl">database</span>
                        </div>
                        <span className="font-bold text-gray-700 dark:text-gray-200">Database List</span>
                    </div>
                    <span className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-bold px-3 py-1 rounded-full border border-red-100 dark:border-red-900/30">
                        {datasets.length} Databases
                    </span>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <span className="material-symbols-outlined animate-spin text-4xl text-red-500 mb-4">progress_activity</span>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Loading datasets...</p>
                        </div>
                    ) : error ? (
                        <div className="flex justify-center py-12">
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900/30">
                                <span className="material-symbols-outlined">error</span>
                                <p className="font-medium">{error}</p>
                            </div>
                        </div>
                    ) : datasets.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {datasets.map((dataset, index) => (
                                <div key={index} className="group flex items-center p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default hover:border-red-200 dark:hover:border-red-900/50">
                                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-xl mr-5 flex items-center justify-center group-hover:bg-red-50 dark:group-hover:bg-red-900/20 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors text-gray-400 dark:text-gray-500">
                                        <span className="material-symbols-outlined text-2xl">database</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base truncate mb-1" title={dataset.filename || dataset.s3_key}>
                                            {dataset.filename || dataset.s3_key}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">SQL Database</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">info</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-gray-500">inbox</span>
                            </div>
                            <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">No datasets found</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">There are currently no databases available.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AvailableDatasets;

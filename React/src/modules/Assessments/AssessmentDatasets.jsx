import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';

function AssessmentDatasets() {
    const navigate = useNavigate();
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDatasets();
    }, []);

    const fetchDatasets = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);

        if (!forceRefresh) {
            const cached = sessionStorage.getItem('cached_assessment_datasets');
            if (cached) {
                try {
                    setDatasets(JSON.parse(cached));
                    setLoading(false);
                    return;
                } catch (e) {
                    sessionStorage.removeItem('cached_assessment_datasets');
                }
            }
        }

        try {
            const payload = { action: "list_datasets" };
            // Using the specific Lambda URL provided
            const response = await fetch('https://u5vjutu2euwnn2uhiertnt6fte0vrbht.lambda-url.eu-central-1.on.aws/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Handle Lambda response structure
            let responseBody = data;
            if (data.body && typeof data.body === 'string') {
                try {
                    responseBody = JSON.parse(data.body);
                } catch (e) {
                    console.warn('Failed to parse data.body', e);
                }
            } else if (data.body) {
                // If body is already an object
                responseBody = data.body;
            }

            if (responseBody && responseBody.success && responseBody.datasets) {
                setDatasets(responseBody.datasets);
                sessionStorage.setItem('cached_assessment_datasets', JSON.stringify(responseBody.datasets));
            } else {
                throw new Error(responseBody?.message || 'Failed to fetch datasets');
            }
        } catch (error) {
            console.error('Error fetching datasets:', error);
            setError('Failed to load datasets. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const breadcrumbItems = [
        { label: 'Assessments', path: '/assessments' },
        { label: 'Available Datasets' }
    ];

    return (
        <div className="w-full mt-2 ml-2 p-4 md:p-6 transition-colors duration-300">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="mb-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Assessment Datasets</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage question set (CSV) datasets for your assessments.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => fetchDatasets(true)}
                            className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 transition-all font-medium"
                            disabled={loading}
                        >
                            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
                            <span>Refresh</span>
                        </button>
                        <button
                            onClick={() => navigate('/dataset-upload?from=assessments')}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-red-500/20 transition-all font-medium"
                        >
                            <span className="material-symbols-outlined">cloud_upload</span>
                            <span>Upload Dataset</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-white/5 dark:backdrop-blur-lg dark:border-white/10 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                            <span className="material-symbols-outlined text-xl">description</span>
                        </div>
                        <span className="font-bold text-gray-700 dark:text-gray-200">Question Sets</span>
                    </div>
                    <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
                        {datasets.length} Files
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
                                <div key={index} className="group flex items-center p-5 bg-white dark:bg-white/5 dark:backdrop-blur-lg dark:border-white/10 border border-gray-200 rounded-xl hover:scale-[1.02] hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-500/30 transition-all duration-300 ease-in-out cursor-default">
                                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-xl mr-5 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-gray-400 dark:text-gray-500">
                                        <span className="material-symbols-outlined text-2xl">csv</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base truncate mb-1" title={dataset.filename}>
                                            {dataset.filename || 'Unknown Filename'}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate" title={dataset.s3_key}>
                                            {dataset.s3_key}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-gray-500">folder_open</span>
                            </div>
                            <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">No datasets found</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Upload a CSV file to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AssessmentDatasets;

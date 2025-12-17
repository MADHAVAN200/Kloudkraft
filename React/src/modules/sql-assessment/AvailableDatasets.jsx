import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AvailableDatasets() {
    const navigate = useNavigate();
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDatasets = async () => {
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
                    throw new Error('Failed to fetch datasets');
                }
                const data = await response.json();

                const responseBody = data;

                if (responseBody && responseBody.success) {
                    setDatasets(responseBody.datasets || []);
                } else {
                    throw new Error('Failed to load datasets');
                }
            } catch (err) {
                console.error('Error fetching datasets:', err);
                setError('Failed to load datasets. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDatasets();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center mb-8">
                    <button
                        onClick={() => navigate('/sql-playground')}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
                    >
                        <span className="material-symbols-outlined mr-1">arrow_back</span>
                        Back
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Available Datasets</h1>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500">database</span>
                            <span className="font-semibold text-gray-700">Database List</span>
                        </div>
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Total: {datasets.length}
                        </span>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <span className="material-symbols-outlined animate-spin text-4xl text-red-500 mb-4">progress_activity</span>
                                <p className="text-gray-500">Loading datasets...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <div className="bg-red-50 text-red-700 p-4 rounded-lg inline-block">
                                    <p className="flex items-center gap-2">
                                        <span className="material-symbols-outlined">error</span>
                                        {error}
                                    </p>
                                </div>
                            </div>
                        ) : datasets.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {datasets.map((dataset, index) => (
                                    <div key={index} className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow hover:border-red-300 group">
                                        <div className="bg-red-50 p-3 rounded-lg mr-4 group-hover:bg-red-100 transition-colors">
                                            <span className="material-symbols-outlined text-red-500">description</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-sm truncate max-w-[200px]" title={dataset.filename}>{dataset.filename}</h3>
                                            <p className="text-xs text-gray-500">{(dataset.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">inbox</span>
                                <p>No datasets found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AvailableDatasets;

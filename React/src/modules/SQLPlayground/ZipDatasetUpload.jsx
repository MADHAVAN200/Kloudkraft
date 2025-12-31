import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';

function ZipDatasetUpload() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [fileName, setFileName] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState('');

    // Get the referrer from URL params
    const referrer = searchParams.get('from');

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setFileName(selectedFile.name);
            setUploadSuccess(false);
            setUploadError('');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadError('Please select a file to upload');
            return;
        }

        setUploading(true);
        setUploadError('');
        setUploadSuccess(false);

        try {
            // Ensure filename has .zip extension
            let finalFilename = fileName.trim();
            if (!finalFilename.toLowerCase().endsWith('.zip')) {
                throw new Error('Please upload a valid .zip file');
            }

            console.log('Uploading zip file:', finalFilename);

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/zip-upload-api/', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            console.log('Upload response:', result);

            if (!response.ok) {
                throw new Error(result.error || result.message || 'Upload failed');
            }

            if (result.message === "Upload successful") {
                setUploadSuccess(true);
                setFileName('');
                setFile(null);

                // Reset file input
                const fileInput = document.getElementById('file-upload');
                if (fileInput) fileInput.value = '';
            } else {
                throw new Error(result.error || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload error:', error);
            setUploadError(error.message || 'Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const breadcrumbItems = [
        { label: 'SQL Playground', path: '/sql-playground' },
        { label: 'Available Datasets', path: '/available-datasets' },
        { label: 'Upload Dataset' }
    ];

    return (
        <div className="w-full mt-2 ml-2 p-4 md:p-6 transition-colors duration-300">
            <Breadcrumbs items={breadcrumbItems} />

            {/* Header */}
            <div className="mb-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Upload Dataset</h1>
                    <p className="text-gray-600 dark:text-gray-400">Upload Zip archive containing your dataset files</p>
                </div>
            </div>

            {/* Success Message */}
            {uploadSuccess && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                    <div>
                        <p className="text-green-800 dark:text-green-200 font-semibold">Upload Successful!</p>
                        <p className="text-green-700 dark:text-green-300 text-sm">Your dataset has been imported successfully.</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {uploadError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
                    <div>
                        <p className="text-red-800 dark:text-red-200 font-semibold">Upload Failed</p>
                        <p className="text-red-700 dark:text-red-300 text-sm">{uploadError}</p>
                    </div>
                </div>
            )}

            {/* File Upload Area */}
            <div className="bg-white dark:bg-white/5 dark:backdrop-blur-lg dark:border-white/10 rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg p-12 text-center hover:border-red-400 dark:hover:border-red-400 transition-colors">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".zip"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />

                    {!fileName ? (
                        <>
                            <div className="flex justify-center mb-4">
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-full p-4">
                                    <span className="material-symbols-outlined text-red-500 text-5xl">folder_zip</span>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Upload Dataset (Zip)</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">Zip archives only</p>
                            <button
                                onClick={() => document.getElementById('file-upload').click()}
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors shadow-lg shadow-red-500/30"
                                disabled={uploading}
                            >
                                Browse Files
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-center mb-4">
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-full p-4">
                                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-5xl">description</span>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{fileName}</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">File selected and ready to upload</p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => {
                                        setFileName('');
                                        setFile(null);
                                        const fileInput = document.getElementById('file-upload');
                                        if (fileInput) fileInput.value = '';
                                    }}
                                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2.5 px-6 rounded-lg transition-colors"
                                    disabled={uploading}
                                >
                                    Remove
                                </button>
                                <button
                                    onClick={handleUpload}
                                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors flex items-center gap-2"
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">cloud_upload</span>
                                            <span>Upload</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* File Format Info */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mt-0.5">info</span>
                        <div>
                            <p className="text-blue-900 dark:text-blue-200 font-semibold text-sm mb-1">Zip File Requirements</p>
                            <p className="text-blue-800 dark:text-blue-300 text-sm">
                                Please upload a <strong>.zip</strong> archive containing your dataset files (CSVs) and any SQL initialization scripts.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ZipDatasetUpload;

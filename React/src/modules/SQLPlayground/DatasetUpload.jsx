import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';

function DatasetUpload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fileName, setFileName] = useState('');
  const [cohortName, setCohortName] = useState('');
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
      // Read the file content
      const fileContent = await readFileAsText(file);

      // Ensure filename has .csv extension
      let finalFilename = fileName.trim();
      if (!finalFilename.toLowerCase().endsWith('.csv')) {
        finalFilename += '.csv';
      }

      // Prepare the payload - direct format
      const payload = {
        action: "upload_dataset",
        filename: finalFilename,
        csv_content: fileContent
      };

      console.log('Uploading dataset with filename:', finalFilename);
      // Send to API via proxy
      const response = await fetch('/assessment-mgmt-api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        // Try to get more error details from response
        let errorMessage = `Upload failed: ${response.statusText}`;
        if (result.message) {
          errorMessage = result.message;
        }
        throw new Error(errorMessage);
      }

      // Parse response body
      const resultBody = result;

      // Check for success
      if (resultBody && resultBody.success) {
        setUploadSuccess(true);
        setFileName('');
        setFile(null);
        setCohortName('');

        // Reset file input
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';

        // Invalidate cache if it exists (for AssessmentDatasets page)
        sessionStorage.removeItem('cached_assessment_datasets');
      } else {
        throw new Error(resultBody?.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const breadcrumbItems = [
    ...(referrer === 'sql-playground' ? [
      { label: 'SQL Playground', path: '/sql-playground' }
    ] : []),
    ...(referrer === 'assessments' ? [
      { label: 'Assessments', path: '/assessments' },
      { label: 'Available Datasets', path: '/assessment-datasets' }
    ] : []),
    { label: 'Dataset Upload' }
  ];

  return (
    <div className="w-full mt-2 ml-2 p-4 md:p-6 transition-colors duration-300">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Upload Question Set</h1>
            <p className="text-gray-600 dark:text-gray-400">Upload CSV files containing assessment questions</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
          <div>
            <p className="text-green-800 dark:text-green-200 font-semibold">Upload Successful!</p>
            <p className="text-green-700 dark:text-green-300 text-sm">Your question set has been uploaded successfully.</p>
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
      <div className="bg-white dark:bg-brand-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-red-400 dark:hover:border-red-400 transition-colors">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            disabled={uploading}
          />

          {!fileName ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-full p-4">
                  <span className="material-symbols-outlined text-red-500 text-5xl">upload_file</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Upload Question Set</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">CSV or Excel files only</p>
              <button
                onClick={() => document.getElementById('file-upload').click()}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors"
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
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mt-0.5">info</span>
            <div>
              <p className="text-blue-900 dark:text-blue-200 font-semibold text-sm mb-1">File Format Requirements</p>
              <p className="text-blue-800 dark:text-blue-300 text-sm">
                Your CSV file should have columns: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded border dark:border-blue-800">question</code>,
                <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded mx-1 border dark:border-blue-800">option_a</code>,
                <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded border dark:border-blue-800">option_b</code>,
                <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded mx-1 border dark:border-blue-800">option_c</code>,
                <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded border dark:border-blue-800">option_d</code>,
                <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded mx-1 border dark:border-blue-800">correct_answer</code>
              </p>
              <p className="text-blue-700 dark:text-blue-400 text-xs mt-2">
                Example: question,option_a,option_b,option_c,option_d,correct_answer
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DatasetUpload;

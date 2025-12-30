import React, { useState, useEffect } from 'react';
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
  const [showDatasets, setShowDatasets] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [datasetsError, setDatasetsError] = useState('');

  // Get the referrer from URL params
  const referrer = searchParams.get('from');

  // Fetch datasets when view is toggled
  useEffect(() => {
    if (showDatasets) {
      fetchDatasets();
    }
  }, [showDatasets]);

  const fetchDatasets = async () => {
    setLoadingDatasets(true);
    setDatasetsError('');
    try {
      // Use direct format (no body wrapper)
      const payload = {
        action: "list_datasets"
      };

      console.log('Fetching datasets with payload:', payload);

      const response = await fetch('/assessment-mgmt-api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        // Try to extract error message from response
        let errorMsg = `HTTP error! status: ${response.status}`;
        if (data.error || data.message) {
          errorMsg = data.error || data.message;
        }
        throw new Error(errorMsg);
      }

      console.log('Datasets response:', data);

      // Parse response body
      const responseBody = data;

      console.log('Datasets response body:', responseBody);

      if (responseBody && responseBody.success) {
        setDatasets(responseBody.datasets || []);
      } else {
        throw new Error(responseBody?.message || 'Failed to fetch datasets');
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      setDatasetsError(error.message);
    } finally {
      setLoadingDatasets(false);
    }
  };

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
      console.log('CSV content preview:', fileContent.substring(0, 200));
      console.log('Payload:', payload);

      // Send to API via proxy
      const response = await fetch('/assessment-mgmt-api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const result = await response.json();
      console.log('Response body:', result);

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

        // Refresh list if visible
        if (showDatasets) {
          fetchDatasets();
        }
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
    ...(referrer === 'sql-playground' ? [{ label: 'SQL Playground', path: '/sql-playground' }] : []),
    ...(referrer === 'assessments' ? [{ label: 'Assessments', path: '/assessments' }] : []),
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
          <div className="flex gap-3">
            <button
              onClick={() => setShowDatasets(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${!showDatasets
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
            >
              <span className="material-symbols-outlined text-base">upload_file</span>
              <span>Import</span>
            </button>
            <button
              onClick={() => setShowDatasets(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${showDatasets
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
            >
              <span className="material-symbols-outlined text-base">visibility</span>
              <span>View Datasets</span>
            </button>
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

      {/* Conditional Content: Upload Form or Datasets List */}
      {!showDatasets ? (
        /* File Upload Area */
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
      ) : (
        /* Datasets List View */
        <div className="bg-white dark:bg-brand-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Uploaded Datasets</h2>

          {loadingDatasets ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-4xl text-blue-500 mb-4">progress_activity</span>
              <p className="text-gray-500 dark:text-gray-400">Loading datasets...</p>
            </div>
          ) : datasetsError ? (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-6 text-center">
              <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
              <p className="text-red-700 dark:text-red-300 font-medium mb-1">Failed to load datasets</p>
              <p className="text-red-600 dark:text-red-400 text-sm mb-4">{datasetsError}</p>
              <button
                onClick={fetchDatasets}
                className="text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 font-semibold text-sm underline"
              >
                Try Again
              </button>
            </div>
          ) : datasets.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
              <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-5xl mb-4">folder_off</span>
              <p className="text-gray-600 dark:text-gray-300 font-medium mb-2">No datasets found</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Upload a dataset to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      S3 Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Size
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {datasets.map((dataset, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {dataset.filename}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">{dataset.s3_key}</code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {(dataset.size / 1024).toFixed(2)} KB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DatasetUpload;

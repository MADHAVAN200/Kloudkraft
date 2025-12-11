import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
      // Use direct format like upload_dataset (no body wrapper)
      const payload = {
        action: "list_datasets"
      };

      console.log('Fetching datasets with payload:', payload);

      const response = await fetch('https://u5vjutu2euwnn2uhiertnt6fte0vrbht.lambda-url.eu-central-1.on.aws/', {
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

      // Response comes directly, not wrapped in body
      if (data && data.success) {
        setDatasets(data.datasets || []);
      } else {
        throw new Error(data?.message || 'Failed to fetch datasets');
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

      // Prepare the payload - send directly without body wrapper
      const payload = {
        action: "upload_dataset",
        filename: finalFilename,
        csv_content: fileContent
      };

      console.log('Uploading dataset with filename:', finalFilename);
      console.log('CSV content preview:', fileContent.substring(0, 200));
      console.log('Payload:', payload);

      // Send to API
      const response = await fetch('https://u5vjutu2euwnn2uhiertnt6fte0vrbht.lambda-url.eu-central-1.on.aws/', {
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

      // Check for success in the direct response
      if (result && result.success) {
        setUploadSuccess(true);
        setFileName('');
        setFile(null);
        setCohortName('');

        // Reset file input
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(result?.message || 'Upload failed');
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

  return (
    <div className="max-w-4xl mt-2 ml-2">
      {/* Back Button */}
      {referrer && (
        <button
          onClick={() => navigate(referrer === 'sql-playground' ? '/sql-playground' : '/assessments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="font-medium">Back</span>
        </button>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Question Set</h1>
            <p className="text-gray-600">Upload CSV files containing assessment questions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDatasets(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${!showDatasets
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
            >
              <span className="material-symbols-outlined text-base">upload_file</span>
              <span>Import</span>
            </button>
            <button
              onClick={() => setShowDatasets(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${showDatasets
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
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
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-green-600">check_circle</span>
          <div>
            <p className="text-green-800 font-semibold">Upload Successful!</p>
            <p className="text-green-700 text-sm">Your question set has been uploaded successfully.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-red-600">error</span>
          <div>
            <p className="text-red-800 font-semibold">Upload Failed</p>
            <p className="text-red-700 text-sm">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Conditional Content: Upload Form or Datasets List */}
      {!showDatasets ? (
        /* File Upload Area */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-red-400 transition-colors">
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
                  <div className="bg-red-50 rounded-full p-4">
                    <span className="material-symbols-outlined text-red-500 text-5xl">upload_file</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Question Set</h3>
                <p className="text-gray-600 mb-6">CSV or Excel files only</p>
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
                  <div className="bg-green-50 rounded-full p-4">
                    <span className="material-symbols-outlined text-green-600 text-5xl">description</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{fileName}</h3>
                <p className="text-gray-600 mb-6">File selected and ready to upload</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setFileName('');
                      setFile(null);
                      const fileInput = document.getElementById('file-upload');
                      if (fileInput) fileInput.value = '';
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-6 rounded-lg transition-colors"
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
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
              <div>
                <p className="text-blue-900 font-semibold text-sm mb-1">File Format Requirements</p>
                <p className="text-blue-800 text-sm">
                  Your CSV file should have columns: <code className="bg-blue-100 px-1 rounded">question</code>,
                  <code className="bg-blue-100 px-1 rounded mx-1">option_a</code>,
                  <code className="bg-blue-100 px-1 rounded">option_b</code>,
                  <code className="bg-blue-100 px-1 rounded mx-1">option_c</code>,
                  <code className="bg-blue-100 px-1 rounded">option_d</code>,
                  <code className="bg-blue-100 px-1 rounded mx-1">correct_answer</code>
                </p>
                <p className="text-blue-700 text-xs mt-2">
                  Example: question,option_a,option_b,option_c,option_d,correct_answer
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Datasets List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Uploaded Datasets</h2>

          {loadingDatasets ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-4xl text-blue-500 mb-4">progress_activity</span>
              <p className="text-gray-500">Loading datasets...</p>
            </div>
          ) : datasetsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
              <p className="text-red-700 font-medium mb-1">Failed to load datasets</p>
              <p className="text-red-600 text-sm mb-4">{datasetsError}</p>
              <button
                onClick={fetchDatasets}
                className="text-red-700 hover:text-red-800 font-semibold text-sm underline"
              >
                Try Again
              </button>
            </div>
          ) : datasets.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <span className="material-symbols-outlined text-gray-400 text-5xl mb-4">folder_off</span>
              <p className="text-gray-600 font-medium mb-2">No datasets found</p>
              <p className="text-gray-500 text-sm">Upload a dataset to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      S3 Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Size
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {datasets.map((dataset, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {dataset.filename}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{dataset.s3_key}</code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
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

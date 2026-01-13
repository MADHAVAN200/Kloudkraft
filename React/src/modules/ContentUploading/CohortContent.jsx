import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';

function CohortContent() {
    const { userRole } = useAuth();
    const { cohortId } = useParams();
    const navigate = useNavigate();

    // In a real app, we would fetch the cohort name using the ID
    const cohortName = `Cohort ${cohortId || 'Details'}`;

    const isAuthorized = userRole === 'admin' || userRole === 'trainer';

    const breadcrumbItems = userRole === 'candidate'
        ? [{ label: cohortName }]
        : [
            { label: 'Cohorts', path: '/content-uploading' },
            { label: cohortName }
        ];

    // State for content list
    const [contentList, setContentList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newContent, setNewContent] = useState({ title: '', type: 'file', url: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fetchContent = async () => {
        try {
            console.log('Fetching content for cohort:', cohortId);
            // FETCH: Removing /content suffix so backend logic parts[-1] gets the ID correctly
            // Backend Logic: parts[-1] ("cohort-123")
            const response = await fetch(`/content-fetch-api/cohorts/${cohortId}`, {
                cache: 'no-store' // Critical: Prevent browser from caching the list
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch content: ${response.status}`);
            }

            let data = await response.json();
            console.log('Fetch RAW response:', data);

            let files = [];
            if (data.files) {
                files = data.files;
            } else if (data.body) {
                try {
                    const parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
                    files = parsedBody.files || [];
                } catch (e) {
                    console.error('Error parsing body:', e);
                }
            }

            console.log('Processed Files List:', files);

            const formattedContent = files.map((file, index) => {
                const isPdf = file.name.endsWith('.pdf') || (file.s3Key && file.s3Key.endsWith('.pdf'));
                return {
                    id: index + 1,
                    title: file.name.replace(/\.json$/, ''), // Remove .json extension for cleaner display
                    type: file.s3Key.endsWith('.json') ? 'link' : 'file', // Correctly identify links using s3Key
                    isPdf: isPdf, // Flag for PDF files
                    date: new Date(file.lastModified).toLocaleDateString(),
                    author: 'Admin',
                    url: file.url
                };
            });

            setContentList(formattedContent);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching content:', error);
            setError('Failed to load content');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, [cohortId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewContent({ ...newContent, [name]: value });
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const readFileAsBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Get base64 content
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newContent.type === 'file' && !selectedFile) {
            alert('Please select a file to upload');
            return;
        }

        setUploading(true);

        try {
            let finalUrl = newContent.url;
            console.log('Starting content upload...');

            if (newContent.type === 'file') {
                // Validate file type based on backend allowed list
                const allowedTypes = [
                    'video/mp4', 'video/avi', 'video/quicktime', 'video/mpeg',
                    'text/csv', 'text/plain',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/pdf',
                    'image/png', 'image/x-png' // Added PNG support
                ];

                if (!allowedTypes.includes(selectedFile.type)) {
                    alert('Unsupported file type. Allowed: PDF, DOCX, CSV, TXT, MP4, AVI, MOV, MPEG, PNG');
                    setUploading(false);
                    return;
                }

                const base64Content = await readFileAsBase64(selectedFile);

                const payload = {
                    type: 'file',
                    filename: selectedFile.name,
                    fileData: base64Content
                };

                console.log('Sending FILE payload to Proxy:', `/content-upload-api/cohorts/${cohortId}`);
                // Use proxy to bypass CORS
                // UPLOAD: Removing /content suffix and fixing Content-Type
                const response = await fetch(`/content-upload-api/cohorts/${cohortId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                console.log('Upload Response Status:', response.status);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Upload failed with status:', response.status, 'Response:', errorText);
                    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log('Response JSON:', data);

                let responseBody = data;
                if (data.body && typeof data.body === 'string') {
                    try {
                        responseBody = JSON.parse(data.body);
                    } catch (e) {
                        console.error('Error parsing inner JSON body:', e);
                    }
                } else if (data.body) {
                    responseBody = data.body;
                }
                console.log('Parsed Response Body:', responseBody);

                if (responseBody.success) {
                    finalUrl = responseBody.s3Url;
                } else {
                    throw new Error(responseBody.message || 'Upload failed');
                }
            } else if (newContent.type === 'link') {
                const payload = {
                    type: 'url',
                    url: newContent.url,
                    filename: newContent.title
                };

                console.log('Sending URL payload to direct Lambda URL');
                // Use proxy to bypass CORS
                const response = await fetch(`/content-upload-api/cohorts/${cohortId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
                }
            }

            const newItem = {
                id: contentList.length + 1,
                ...newContent,
                url: finalUrl,
                date: new Date().toISOString().split('T')[0],
                author: 'Current User', // Placeholder
                isPdf: newContent.type === 'file' && selectedFile?.name.endsWith('.pdf')
            };
            setContentList([...contentList, newItem]);
            setIsModalOpen(false);
            setNewContent({ title: '', type: 'file', url: '' });
            setSelectedFile(null);
            alert('Content added successfully!');
            // Refresh the list from the server
            fetchContent();
        } catch (error) {
            console.error('Error adding content:', error);
            alert(`Failed to add content: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full mt-2 ml-2 p-4 md:p-6 transition-colors duration-300">
            <Breadcrumbs items={breadcrumbItems} />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-white/5 dark:backdrop-blur-lg dark:border-white/10 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 transition-colors duration-300 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{cohortName} Content</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage course materials for this cohort</p>
                </div>

                {isAuthorized && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium w-full md:w-auto justify-center"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        Add Content
                    </button>
                )}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {contentList.map((item) => (
                    <div key={item.id} className="group bg-white dark:bg-white/5 dark:backdrop-blur-lg dark:border-white/10 rounded-xl border border-gray-200 hover:scale-[1.02] hover:shadow-xl hover:border-red-200 dark:hover:border-red-500/30 transition-all duration-300 ease-in-out overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-lg ${item.type === 'file' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                    }`}>
                                    <span className="material-symbols-outlined text-2xl">
                                        {item.type === 'file' ? 'description' : 'link'}
                                    </span>
                                </div>
                                {isAuthorized && (
                                    <button className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </button>
                                )}
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                {item.title}
                            </h3>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-base">calendar_today</span>
                                    <span>{item.date}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-base">person</span>
                                    <span>{item.author}</span>
                                </div>
                            </div>

                            <a
                                href={item.url}
                                target={item.type === 'link' || item.isPdf ? '_blank' : '_self'}
                                rel={item.type === 'link' || item.isPdf ? 'noopener noreferrer' : ''}
                                className="inline-flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline"
                            >
                                {item.type === 'file' ? (item.isPdf ? 'Open PDF' : 'Download File') : 'Visit Link'}
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {/* Upload Modal (Same as before) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10 rounded-xl shadow-xl w-full max-w-md p-4 md:p-6 animate-in fade-in zoom-in duration-200 border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Content</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={newContent.title}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                                    placeholder="Enter content title"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                <select
                                    name="type"
                                    value={newContent.type}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                                >
                                    <option value="file">File Upload</option>
                                    <option value="link">External Link</option>
                                </select>
                            </div>

                            {newContent.type === 'file' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File</label>
                                    <input
                                        key="file-input"
                                        type="file"
                                        onChange={handleFileChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white dark:bg-white/5 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 dark:file:bg-red-900/20 dark:file:text-red-400"
                                        required
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link URL</label>
                                    <input
                                        key="url-input"
                                        type="text"
                                        name="url"
                                        value={newContent.url}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                                        placeholder="https://..."
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                            Uploading...
                                        </span>
                                    ) : 'Add Content'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CohortContent;

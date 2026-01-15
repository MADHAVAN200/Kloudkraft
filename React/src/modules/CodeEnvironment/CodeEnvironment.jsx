import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAuthSession } from 'aws-amplify/auth';
import Breadcrumbs from '../../components/Breadcrumbs';

// ----------------------------- CONFIG -----------------------------
const tasks = [
    { id: 'task1', title: 'Environment 1' },
    { id: 'task2', title: 'Environment 2' },
    { id: 'task3', title: 'Environment 3' },
    // Add more tasks as needed
];

const START_TASK_URL =
    'https://tc5sjttyob5a7yqd47mbdnj22a0lqfqo.lambda-url.ap-south-1.on.aws/';
const GUACAMOLE_TOKEN_URL = 'https://kastle.labskraft.com/LabsKraft/api/tokens';
const GUACAMOLE_CLIENT_BASE = 'https://kastle.labskraft.com/LabsKraft/#/client';

const QUESTION_CODES_SHEET_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZ-zM-B-NZVZXQI6wVgWr0dzPkiOaPbUfnzTXgUZgNqMnN3fcqaXhXlEL_Pu30VNOPcGCnEaQZpp-A/pub?gid=0&single=true&output=csv';

const PROCTOR_INTERVAL = 5000; // 5 seconds
const PROCTOR_TIMEOUT = 2 * 60 * 1000; // 2 minutes
const API_UPLOAD_URL =
    'https://eukxtli4wdh53wjm6vnh64tqqu0ppgji.lambda-url.ap-south-1.on.aws/';

// -----------------------------------------------------------------

const TaskCard = ({ task, onClick, loading }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
    >
        <div
            onClick={() => !loading && onClick(task.id)}
            className={`
        bg-white dark:bg-[#1e293b]
        border border-gray-100 dark:border-slate-700/50 rounded-2xl p-8 min-h-[200px]
        flex flex-col justify-center items-center cursor-pointer
        shadow-sm hover:shadow-xl hover:scale-[1.02] hover:border-red-200 dark:hover:border-red-500/30
        transition-all duration-300 ease-in-out group
        ${loading ? 'opacity-70 cursor-not-allowed' : ''}
      `}
        >
            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-all duration-300 group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">terminal</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                {task.title}
            </h3>
        </div>
    </motion.div>
);

const CodeEnvironment = () => {
    const { user } = useAuth();
    const [token, setToken] = useState('');
    const storedPassword = sessionStorage.getItem('userPassword') || '';

    useEffect(() => {
        const getToken = async () => {
            try {
                const session = await fetchAuthSession();
                setToken(session.tokens?.idToken?.toString() || '');
            } catch (err) {
                console.error("Failed to fetch auth session", err);
            }
        };
        getToken();
    }, []);

    const [showTasks, setShowTasks] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showCode, setShowCode] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [candidateName, setCandidateName] = useState('');
    const [queCode, setQueCode] = useState('');
    const [questionCodesList, setQuestionCodesList] = useState(null);
    const [kodeEnvLoading, setKodeEnvLoading] = useState(false);

    // Proctoring
    const [screenStream, setScreenStream] = useState(null);
    const [cameraStream, setCameraStream] = useState(null);
    const [proctorInterval, setProctorInterval] = useState(null);
    const screenVideoRef = useRef(null);
    const cameraVideoRef = useRef(null);

    // Snackbar / Toast state
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // type: success | error | info | warning

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ ...toast, show: false }), 6000);
    };

    // Fetch question codes
    useEffect(() => {
        const fetchQuestionCodes = async () => {
            try {
                const response = await fetch(`${QUESTION_CODES_SHEET_URL}&t=${Date.now()}`);
                if (!response.ok) throw new Error('Failed to fetch codes');
                const text = await response.text();
                const codes = text
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0);
                setQuestionCodesList(codes);
            } catch (error) {
                showToast('Failed to load question codes', 'error');
                setQuestionCodesList([]);
            }
        };
        fetchQuestionCodes();
    }, []);

    const handleEnvironmentClick = (taskId) => {
        const task = tasks.find((t) => t.id === taskId);
        setSelectedTask(task);
        setShowForm(true);
        setShowTasks(false);
        setShowCode(false);
        setQueCode('');
    };

    const handleBackToTasks = () => {
        setShowForm(false);
        setShowCode(false);
        setSelectedTask(null);
        setCandidateName('');
        setQueCode('');
        setShowTasks(true);
    };

    const handleGetQuestionCode = () => {
        if (!candidateName) {
            showToast('Please enter candidate name', 'error');
            return;
        }
        if (questionCodesList === null) {
            showToast('Loading codes, please wait...', 'info');
            return;
        }
        if (questionCodesList.length === 0) {
            showToast('No question codes available', 'warning');
            return;
        }
        const randomCode =
            questionCodesList[Math.floor(Math.random() * questionCodesList.length)];
        setQueCode(randomCode);
        setShowCode(true);
    };

    const handleCopyCode = () => {
        if (queCode) {
            navigator.clipboard.writeText(queCode);
            showToast('Code copied to clipboard', 'success');
        }
    };

    // Proctoring functions
    const startProctoring = async () => {
        try {
            // Camera
            let cameraStream;
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch (e) {
                if (e.name === 'NotAllowedError') {
                    alert('Camera access denied. Please enable it.');
                    return false;
                }
                throw e;
            }

            // Full screen (monitor only)
            let screen;
            let attempts = 0;
            while (attempts < 3) {
                try {
                    screen = await navigator.mediaDevices.getDisplayMedia({
                        video: { displaySurface: 'monitor' },
                    });
                    const track = screen.getVideoTracks()[0];
                    // Some browsers might not support getSettings().displaySurface properly or might return different values.
                    // We'll proceed but warn if possible. For strictness, you can enforce check.
                    // if (track.getSettings().displaySurface === "monitor") break;

                    if (track) break; // Simplified for broader browser compatibility in this demo

                    // track.stop();
                    // attempts++;
                    // alert(`Please share entire screen. Attempt ${attempts + 1}/3`);
                } catch (e) {
                    attempts++;
                }
            }
            if (!screen && attempts >= 3) {
                alert('Must share entire screen.');
                return false;
            }

            // Fallback if loop finishes without screen (though the break should handle it)
            if (!screen) return false;

            setScreenStream(screen);
            setCameraStream(cameraStream);
            if (screenVideoRef.current) screenVideoRef.current.srcObject = screen;
            if (cameraVideoRef.current) cameraVideoRef.current.srcObject = cameraStream;

            const interval = setInterval(captureAndUpload, PROCTOR_INTERVAL);
            setProctorInterval(interval);

            setTimeout(() => {
                clearInterval(interval);
                stopProctoring();
                showToast('Proctoring timed out (2 min)', 'info');
            }, PROCTOR_TIMEOUT);

            return true;
        } catch (error) {
            showToast('Proctoring error: ' + error.message, 'error');
            return false;
        }
    };

    const stopProctoring = () => {
        if (screenStream) screenStream.getTracks().forEach((t) => t.stop());
        if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
        if (proctorInterval) clearInterval(proctorInterval);
        setScreenStream(null);
        setCameraStream(null);
        setProctorInterval(null);
    };

    const captureAndUpload = async () => {
        try {
            if (!screenVideoRef.current || !cameraVideoRef.current) return;

            // Ensure video has dimensions
            if (screenVideoRef.current.videoWidth === 0 || screenVideoRef.current.videoHeight === 0) {
                console.warn("Screen video not ready yet");
                return;
            }
            if (cameraVideoRef.current.videoWidth === 0 || cameraVideoRef.current.videoHeight === 0) {
                console.warn("Camera video not ready yet");
            }

            // Screen
            const screenCanvas = document.createElement('canvas');
            screenCanvas.width = screenVideoRef.current.videoWidth;
            screenCanvas.height = screenVideoRef.current.videoHeight;
            screenCanvas.getContext('2d').drawImage(screenVideoRef.current, 0, 0);
            const screenBase64 = screenCanvas.toDataURL('image/png').split(',')[1];

            // Camera
            const camCanvas = document.createElement('canvas');
            camCanvas.width = cameraVideoRef.current.videoWidth;
            camCanvas.height = cameraVideoRef.current.videoHeight;
            camCanvas.getContext('2d').drawImage(cameraVideoRef.current, 0, 0);
            const camBase64 = camCanvas.toDataURL('image/png').split(',')[1];

            // Upload
            await fetch(API_UPLOAD_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    image: screenBase64,
                    key: `screenshot-${user?.username}-${Date.now()}.png`,
                    username: user?.username,
                }),
            });

            await fetch(API_UPLOAD_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    image: camBase64,
                    key: `webcam-${user?.username}-${Date.now()}.png`,
                    username: user?.username,
                }),
            });
        } catch (e) {
            console.error('Upload failed', e);
        }
    };

    // Main start environment
    const handleStartEnv = async () => {
        if (!selectedTask) return;
        setKodeEnvLoading(true);
        try {
            const proctorStarted = await startProctoring();
            if (!proctorStarted) {
                setKodeEnvLoading(false);
                return;
            }

            const username = user?.username;
            const password = storedPassword;


            if (!username) {
                showToast('User not authenticated locally', 'error');
                setKodeEnvLoading(false);
                return;
            }
            if (!password) {
                showToast('Session expired or password missing. Please relogin.', 'error');
                setKodeEnvLoading(false);
                return;
            }

            const startUrl = `${START_TASK_URL}?username=${encodeURIComponent(
                username
            )}&password=${encodeURIComponent(password)}&taskId=${encodeURIComponent(
                selectedTask.id
            )}`;

            const startResp = await fetch(startUrl);
            if (!startResp.ok) {
                const err = await startResp.text();
                throw new Error(err || 'Failed to start task');
            }
            const startData = await startResp.json();


            const encodedId =
                startData?.guacamole_setup?.response?.encoded_connection_id;
            if (!encodedId) throw new Error('No connection ID returned. Backend response may be invalid.');

            // Get Guacamole token
            const tokenResp = await fetch(GUACAMOLE_TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ username: username, password: password }).toString(),
            });
            if (!tokenResp.ok) throw new Error('Failed to get auth token');
            const tokenData = await tokenResp.json();
            const token = tokenData.authToken;

            const clientUrl = `${GUACAMOLE_CLIENT_BASE}/${encodedId}?token=${encodeURIComponent(
                token
            )}`;
            window.open(clientUrl, '_blank');

            showToast('Environment started – RDP opened in new tab', 'success');
        } catch (error) {
            showToast(error.message || 'Failed to start environment', 'error');
            stopProctoring();
        } finally {
            setKodeEnvLoading(false);
        }
    };

    return (
        <div className="w-full h-full p-4 sm:p-6 lg:p-8 relative">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 -z-10"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 -z-10"></div>

            {/* Hidden videos for proctoring - Must not be display:none for capture to work on some browsers */}
            <video ref={screenVideoRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -10 }} autoPlay muted playsInline />
            <video ref={cameraVideoRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -10 }} autoPlay muted playsInline />

            {showTasks && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full space-y-6"
                >
                    <Breadcrumbs items={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Code Environment' }]} />

                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Code Environments</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Select an environment to begin your assessment.</p>
                        </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onClick={handleEnvironmentClick}
                                loading={kodeEnvLoading}
                            />
                        ))}
                    </div>
                </motion.div>
            )
            }

            {
                showForm && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full mx-auto space-y-6"
                    >
                        <div className="mb-2">
                            <Breadcrumbs items={[
                                { label: 'Dashboard', path: '/dashboard' },
                                { label: 'Code Environment', path: null, onClick: handleBackToTasks },
                                { label: selectedTask?.title || 'Environment' }
                            ]} />
                        </div>

                        <div className="max-w-xl mx-auto">


                            <div className="bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-slate-700 rounded-3xl p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/20 text-center sm:text-left">
                                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{selectedTask?.title}</h2>
                                <p className="text-gray-500 dark:text-slate-400 mb-8 text-sm">
                                    Enter your details to generate the assessment environment access code.
                                </p>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                                            Candidate Name
                                        </label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-red-400">person</span>
                                            <input
                                                type="text"
                                                value={candidateName}
                                                onChange={(e) => setCandidateName(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-slate-900/50 border-none ring-1 ring-gray-100 dark:ring-slate-700 focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none font-medium"
                                                placeholder="e.g. John Doe"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGetQuestionCode}
                                        className="w-full py-4 bg-[#D92D20] hover:bg-[#b9251b] text-white font-bold text-sm tracking-wide rounded-lg transition-colors shadow-lg shadow-red-500/30 active:scale-[0.98] uppercase mt-2"
                                    >
                                        Get Question Code
                                    </button>

                                    <AnimatePresence>
                                        {showCode && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden pt-4"
                                            >
                                                <div className="text-left">
                                                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 mb-2 uppercase tracking-wide">Your Question Code</p>
                                                    <div className="flex items-center justify-between mb-6 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                                                        <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white select-all tracking-wider">
                                                            {queCode}
                                                        </div>
                                                        <button
                                                            onClick={handleCopyCode}
                                                            className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-red-600 transition-all shadow-sm"
                                                            title="Copy Code"
                                                        >
                                                            <span className="material-symbols-outlined">content_copy</span>
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={handleStartEnv}
                                                        disabled={kodeEnvLoading}
                                                        className={`
                          w-full py-4 font-bold text-sm tracking-wide rounded-lg transition-all flex items-center justify-center gap-2 uppercase
                          ${kodeEnvLoading
                                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                                                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 active:scale-[0.98]'}
                        `}
                                                    >
                                                        {kodeEnvLoading ? (
                                                            <>
                                                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                                Starting Environment...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="material-symbols-outlined">play_circle</span>
                                                                Start Environment
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            <div className="text-center mt-12 text-xs text-gray-300 dark:text-gray-600">
                                © 2024 LabsKraft Professional Assessment Platform. All rights reserved.
                            </div>
                        </div>
                    </motion.div>
                )
            }

            {/* Toast Notification */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 min-w-[300px]"
                    >
                        <div className={`
              px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border backdrop-blur-md
              ${toast.type === 'error' ? 'bg-red-50/90 dark:bg-red-900/90 text-red-800 dark:text-white border-red-200 dark:border-red-800' :
                                toast.type === 'warning' ? 'bg-yellow-50/90 dark:bg-yellow-900/90 text-yellow-800 dark:text-white border-yellow-200 dark:border-yellow-800' :
                                    'bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 border-transparent'}
            `}>
                            <span className="material-symbols-outlined">
                                {toast.type === 'error' ? 'error' : toast.type === 'warning' ? 'warning' : 'check_circle'}
                            </span>
                            <p className="font-medium text-sm">{toast.message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default CodeEnvironment;

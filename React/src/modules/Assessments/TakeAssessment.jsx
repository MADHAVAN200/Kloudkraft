import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProctoring } from '../../hooks/useProctoring';
import ProctoringWebcam from '../../components/ProctoringWebcam';

function TakeAssessment() {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Proctoring State
    const [assessmentStarted, setAssessmentStarted] = useState(false);
    const [cameraStatus, setCameraStatus] = useState({ status: 'ok', message: '' });
    const [isTerminated, setIsTerminated] = useState(false);
    const [terminationReason, setTerminationReason] = useState(null); // 'tab_switch', 'multiple_faces', or 'no_face'
    const [multipleFacesCount, setMultipleFacesCount] = useState(0);
    const [noFaceCount, setNoFaceCount] = useState(0);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    const {
        isFullScreen,
        enterFullScreen,
        exitFullScreen,
        tabSwitchCount,
        warnings
    } = useProctoring({
        enableTabSwitchDetection: assessmentStarted,
        enableFullScreen: assessmentStarted
    });

    // Monitor for tab switch violations
    useEffect(() => {
        if (!isTerminated) {
            // Tab Switch Violation
            if (tabSwitchCount >= 30) {
                setTerminationReason('tab_switch');
                setIsTerminated(true);
                exitFullScreen();
            }
        }
    }, [tabSwitchCount, isTerminated, exitFullScreen]);

    // Handle camera status changes for PROCTORING FEEDBACK only
    const handleCameraStatusChange = React.useCallback((newStatus) => {
        setCameraStatus(newStatus);
    }, []);

    // Dedicated effect for COUNTING violations
    // This ensures we count transitions cleanly without double-counting (Strict Mode)
    // or rapid-fire counting (due to unstable dependencies)
    useEffect(() => {
        if (!isTerminated && assessmentStarted) {
            if (cameraStatus.status === 'multiple') {
                setMultipleFacesCount(prev => prev + 1);
            } else if (cameraStatus.status === 'missing') {
                setNoFaceCount(prev => prev + 1);
            }
        }
    }, [cameraStatus.status, assessmentStarted, isTerminated]); // Dependencies must be complete to avoid stale closures

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [assessmentData, setAssessmentData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [markedForReview, setMarkedForReview] = useState(new Set());


    // Load session from localStorage on mount
    useEffect(() => {
        const savedSession = localStorage.getItem(`assessment_session_${assessmentId}`);
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                setSessionId(session.sessionId);
                setAnswers(session.answers || {});
                setMarkedForReview(new Set(session.markedForReview || []));
                setCurrentQuestionIndex(session.currentQuestionIndex || 0);
                validateAndLoadSession(session.sessionId);
            } catch (e) {
                console.error('Error loading saved session:', e);
                fetchQuestions();
            }
        } else {
            fetchQuestions();
        }
    }, [assessmentId]);

    // Save session to localStorage whenever it changes
    useEffect(() => {
        if (sessionId && questions.length > 0) {
            const sessionData = {
                sessionId,
                answers,
                markedForReview: Array.from(markedForReview),
                currentQuestionIndex,
                timestamp: Date.now()
            };
            localStorage.setItem(`assessment_session_${assessmentId}`, JSON.stringify(sessionData));
        }
    }, [sessionId, answers, markedForReview, currentQuestionIndex, assessmentId]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleSubmit(true); // Auto-submit when time expires
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeRemaining]);

    // Validate session periodically - DISABLED to prevent premature expiry
    // Session is validated on initial load and before submission
    // useEffect(() => {
    //     if (sessionId) {
    //         const interval = setInterval(() => {
    //             validateSession();
    //         }, 30000); // Every 30 seconds
    //         return () => clearInterval(interval);
    //     }
    // }, [sessionId]);

    const validateAndLoadSession = async (sid) => {
        try {
            const payload = {
                action: "validate_session",
                session_id: sid
            };

            const response = await fetch('/assessment-api/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            let responseBody = data.body;
            if (typeof responseBody === 'string') {
                responseBody = JSON.parse(responseBody);
            }

            if (response.ok && responseBody && responseBody.valid) {
                setTimeRemaining(responseBody.remaining_time || 0);
                // Fetch questions if not already loaded
                if (questions.length === 0) {
                    await fetchQuestionsWithSession(sid);
                } else {
                    setLoading(false);
                }
            } else {
                console.warn("Session validation failed or expired (410/404/Invalid).");
                setError('Session expired. Please start a new assessment.');
                localStorage.removeItem(`assessment_session_${assessmentId}`);
                setLoading(false);
            }
        } catch (err) {
            console.error('Error validating session:', err);
            // If validation crashes, try fetching fresh questions (new session)
            // But if it was a 410, maybe we should just clear and stop?
            // For now, let's allow fallback to fetchQuestions which handles its own loading state.
            fetchQuestions();
        }
    };

    const validateSession = async () => {
        if (!sessionId) return;

        try {
            const payload = {
                action: "validate_session",
                session_id: sessionId
            };

            const response = await fetch('/assessment-api/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            console.log('Validate session response:', data);

            // Handle both response formats
            let responseBody = data.body;
            if (typeof responseBody === 'string') {
                responseBody = JSON.parse(responseBody);
            } else if (!responseBody) {
                // Direct response without body wrapper
                responseBody = data;
            }

            console.log('Parsed validation response:', responseBody);

            // Only trigger expiry if explicitly invalid
            if (responseBody && responseBody.valid === false) {
                console.log('Session is invalid, triggering submission');
                alert('Session expired! Submitting your answers...');
                handleSubmit(true);
            } else if (responseBody && responseBody.valid === true) {
                console.log('Session is valid, remaining time:', responseBody.remaining_time);
                // Optionally update timer with server time
                if (responseBody.remaining_time) {
                    setTimeRemaining(responseBody.remaining_time);
                }
            }
        } catch (err) {
            console.error('Error validating session:', err);
            // Don't trigger submission on network errors
        }
    };

    const fetchQuestionsWithSession = async (sid) => {
        // This is called when resuming a session
        setLoading(false);
    };

    const fetchQuestions = async () => {
        setLoading(true);
        setError('');

        try {
            // Add timestamp to user_id to allow multiple attempts
            const baseUserId = user?.username || user?.attributes?.email || 'default-user';
            const userId = `${baseUserId}-${Date.now()}`;

            console.log('Fetching questions for assessment:', assessmentId);
            console.log('User ID (with timestamp for retakes):', userId);

            const payload = {
                action: "get_questions",
                assessment_id: assessmentId,
                user_id: userId
            };

            console.log('Payload object:', payload);

            const response = await fetch('/assessment-api/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', data);
            console.log('Response data type:', typeof data);
            console.log('Response data keys:', data ? Object.keys(data) : 'null');

            let responseBody = data.body;
            if (typeof responseBody === 'string') {
                console.log('Parsing stringified body...');
                responseBody = JSON.parse(responseBody);
            } else {
                console.log('Body is not a string, using data directly');
                responseBody = data;
            }

            console.log('Parsed response body:', responseBody);
            console.log('Response body keys:', responseBody ? Object.keys(responseBody) : 'null');

            if (responseBody && responseBody.questions) {
                console.log('Questions found:', responseBody.questions.length);
                setQuestions(responseBody.questions);
                setSessionId(responseBody.session_id);
                setAssessmentData({
                    name: responseBody.assessment_name || 'Assessment',
                    duration: responseBody.duration_minutes || 60
                });
                setTimeRemaining((responseBody.duration_minutes || 60) * 60); // Convert to seconds
            } else if (responseBody && responseBody.error && responseBody.error.includes('already submitted')) {
                // Handle already submitted error - allow retake by clearing session
                console.log('Assessment already submitted, clearing session to allow retake');
                localStorage.removeItem(`assessment_session_${assessmentId}`);
                throw new Error('You have already submitted this assessment. The page will reload to allow you to retake it.');
            } else {
                console.error('Response does not contain questions. Full response:', responseBody);
                throw new Error(responseBody?.error || responseBody?.message || 'Invalid response format - no questions found');
            }
        } catch (err) {
            console.error('Error fetching questions:', err);
            console.error('Error details:', err.message, err.stack);

            // If it's an "already submitted" error, show a friendly message and reload
            if (err.message && err.message.includes('already submitted')) {
                setError('You have already submitted this assessment. Click "Back to Assessments" to return.');
            } else {
                setError(err.message || 'Failed to load assessment');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (answer) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: answer
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleMarkForReview = () => {
        setMarkedForReview(prev => {
            const newSet = new Set(prev);
            if (newSet.has(currentQuestionIndex)) {
                newSet.delete(currentQuestionIndex);
            } else {
                newSet.add(currentQuestionIndex);
            }
            return newSet;
        });
    };

    const handleSubmit = async (autoSubmit = false) => {
        if (!autoSubmit) {
            const unanswered = questions.length - Object.keys(answers).length;
            if (unanswered > 0) {
                if (!window.confirm(`You have ${unanswered} unanswered questions. Are you sure you want to submit?`)) {
                    return;
                }
            }
        }

        setSubmitting(true);

        try {
            // Validate session before submitting
            console.log('Validating session before submission...');
            const validatePayload = {
                action: "validate_session",
                session_id: sessionId
            };

            const validateResponse = await fetch('/assessment-api/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validatePayload)
            });

            const validateData = await validateResponse.json();
            let validateBody = validateData.body;
            if (typeof validateBody === 'string') {
                validateBody = JSON.parse(validateBody);
            } else if (!validateBody) {
                validateBody = validateData;
            }

            console.log('Session validation result:', validateBody);

            if (validateBody && validateBody.valid === false) {
                alert('Your session has expired. Please start a new assessment.');
                setSubmitting(false);
                navigate('/assessments');
                return;
            }

            // Proceed with submission
            console.log('Session valid, submitting answers...');
            const payload = {
                action: "submit_answers",
                session_id: sessionId,
                answers: answers
            };

            const response = await fetch('/assessment-api/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('Submit response status:', response.status);

            const data = await response.json();
            console.log('Submit response data:', data);

            // Handle both response formats
            let responseBody = data.body;
            if (typeof responseBody === 'string') {
                responseBody = JSON.parse(responseBody);
            } else if (!responseBody) {
                // Direct response without body wrapper
                responseBody = data;
            }

            console.log('Parsed submit response:', responseBody);

            // Check for success or score (different APIs might return different fields)
            if (responseBody && (responseBody.success || responseBody.score !== undefined)) {
                console.log('Submission successful, score:', responseBody.score);
                // Clear session from localStorage
                localStorage.removeItem(`assessment_session_${assessmentId}`);
                exitFullScreen(); // Exit full screen on successful submission
                // Navigate to results page
                navigate(`/assessment/results/${sessionId}`, {
                    state: {
                        score: responseBody.score,
                        totalQuestions: questions.length,
                        assessmentName: assessmentData?.name
                    }
                });
            } else {
                console.error('Submission failed:', responseBody);
                throw new Error(responseBody?.error || responseBody?.message || 'Submission failed');
            }
        } catch (err) {
            console.error('Error submitting answers:', err);
            alert('Failed to submit assessment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getQuestionStatus = (index) => {
        if (answers[index]) return 'answered';
        if (markedForReview.has(index)) return 'review';
        return 'unanswered';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <span className="material-symbols-outlined animate-spin text-4xl text-red-500 mb-4">progress_activity</span>
                    <p className="text-gray-600">Loading assessment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <span className="material-symbols-outlined text-red-500 text-4xl mb-4">error</span>
                    <p className="text-red-700 font-medium mb-2">Error</p>
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/assessments')}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                        Back to Assessments
                    </button>
                </div>
            </div>
        );
    }

    if (isTerminated) {
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center p-4 z-[100]">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-red-600 text-5xl">gavel</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Terminated</h2>
                    <p className="text-gray-600 mb-6">
                        {terminationReason === 'multiple_faces'
                            ? "Multiple people were detected in your camera feed multiple times. This is a violation of the assessment integrity rules."
                            : terminationReason === 'no_face'
                                ? "Your face was not detected in the camera feed multiple times (4 violations). You must stay visible at all times."
                                : "You have violated the assessment rules by switching tabs or minimizing the browser multiple times."
                        }
                        As a result, your assessment session has been shut down.
                    </p>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-8">
                        <p className="text-sm text-red-800 font-medium">
                            Violation: {
                                terminationReason === 'multiple_faces' ? 'Multiple People Detected' :
                                    terminationReason === 'no_face' ? 'Face Not Detected' :
                                        'Tab Switching / Loss of Focus'
                            }
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                            Recorded {
                                terminationReason === 'multiple_faces' ? multipleFacesCount :
                                    terminationReason === 'no_face' ? noFaceCount :
                                        tabSwitchCount
                            } times.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem(`assessment_session_${assessmentId}`);
                            navigate('/assessments');
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-transform hover:scale-[1.02]"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Proctoring State - Checkboxes
    // Removed per user request

    if (!assessmentStarted && !loading && !error) {
        return (
            <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-red-600 text-3xl">security</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Proctored Assessment</h1>
                        <p className="text-gray-600">
                            This assessment is monitored. Please enable your camera and stay in full-screen mode.
                        </p>
                    </div>

                    {/* Pre-flight Camera Check */}
                    <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-4">
                        <p className="text-sm font-semibold mb-2 text-gray-700">System Check</p>
                        <ProctoringWebcam onStatusChange={handleCameraStatusChange} />
                        <div className={`mt-3 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2 ${cameraStatus.status === 'ok'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            <span className="material-symbols-outlined text-sm">
                                {cameraStatus.status === 'ok' ? 'check_circle' : 'cancel'}
                            </span>
                            {cameraStatus.status === 'ok' ? 'Camera Ready' : cameraStatus.message || 'Detecting face...'}
                        </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-left text-sm text-orange-800 space-y-2">
                        <p className="font-semibold flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">warning</span>
                            Rules:
                        </p>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                            <li>Face must be visible at all times</li>
                            <li>No switching tabs or minimizing</li>
                            <li>No additional people in view</li>
                            <li>Full-screen mode is required</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => {
                            enterFullScreen();
                            setAssessmentStarted(true);
                            setNoFaceCount(0);
                            setMultipleFacesCount(0);
                        }}
                        disabled={cameraStatus.status !== 'ok'}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:hover:scale-100"
                    >
                        {cameraStatus.status === 'ok' ? 'Start Assessment' : 'Waiting for Camera...'}
                    </button>
                    <button
                        onClick={() => navigate('/assessments')}
                        className="text-gray-500 hover:text-gray-700 font-medium text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];



    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col lg:flex-row overflow-hidden z-50">
            {/* Sidebar */}
            <div className={`w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col shrink-0 transition-all duration-300 ${showMobileSidebar ? 'h-auto max-h-[60vh]' : 'h-auto'
                } lg:h-full lg:max-h-full`}>

                {/* Webcam Feed - Top of Sidebar */}
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col items-center relative">
                    {/* Mobile Toggle Button */}
                    <button
                        onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                        className="lg:hidden absolute top-2 right-2 p-2 text-gray-500 hover:bg-gray-200 rounded-lg"
                    >
                        <span className="material-symbols-outlined">{showMobileSidebar ? 'expand_less' : 'expand_more'}</span>
                    </button>

                    <ProctoringWebcam onStatusChange={handleCameraStatusChange} />
                    {cameraStatus.status !== 'ok' && (
                        <div className="mt-2 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded flex items-center gap-1 animate-pulse">
                            <span className="material-symbols-outlined text-base">warning</span>
                            {cameraStatus.message}
                        </div>
                    )}
                    {/* Violation Counters - Always Visible */}
                    <div className="mt-2 text-xs text-gray-700 bg-gray-100 px-3 py-2 rounded w-full space-y-1 border border-gray-200">
                        <p className={`flex justify-between ${tabSwitchCount > 0 ? 'text-orange-600 font-bold' : ''}`}>
                            <span>Tab Violations:</span>
                            <span>{tabSwitchCount}</span>
                        </p>
                        <p className={`flex justify-between ${multipleFacesCount > 0 ? 'text-red-600 font-bold' : ''}`}>
                            <span>Multiple Faces:</span>
                            <span>{multipleFacesCount}</span>
                        </p>
                        <p className={`flex justify-between ${noFaceCount > 0 ? 'text-red-600 font-bold' : ''}`}>
                            <span>No Face Detected:</span>
                            <span>{noFaceCount}</span>
                        </p>
                    </div>
                </div>

                {/* Collapsible Content Area on Mobile */}
                <div className={`overflow-y-auto flex-1 p-6 ${showMobileSidebar ? 'block' : 'hidden lg:block'}`}>
                    <h3 className="font-bold text-gray-900 mb-4">Assessment Progress</h3>

                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-1">Total Questions</p>
                        <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {currentQuestionIndex + 1} of {questions.length} answered
                        </p>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Questions</p>
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((_, index) => {
                                const status = getQuestionStatus(index);
                                return (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setCurrentQuestionIndex(index);
                                            setShowMobileSidebar(false); // Auto-close on selection on mobile
                                        }}
                                        className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${index === currentQuestionIndex
                                            ? 'bg-red-500 text-white'
                                            : status === 'answered'
                                                ? 'bg-green-500 text-white'
                                                : status === 'review'
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={submitting}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit Assessment'}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center shrink-0">
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate max-w-[200px] md:max-w-none">{assessmentData?.name}</h1>
                        <p className="text-sm text-gray-500">Q {currentQuestionIndex + 1} / {questions.length}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg">
                        <span className="material-symbols-outlined text-gray-600 text-lg md:text-xl">schedule</span>
                        <span className="font-mono text-base md:text-lg font-semibold text-gray-900">{formatTime(timeRemaining)}</span>
                    </div>
                </div>

                {/* Question Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">
                                {currentQuestion?.question}
                            </h2>

                            {/* Debug logging */}
                            {console.log('Current question:', currentQuestion)}
                            {console.log('Question keys:', currentQuestion ? Object.keys(currentQuestion) : 'No question')}

                            <div className="space-y-3">
                                {currentQuestion?.shuffled_options?.map((optionText, index) => {
                                    const optionLetter = String.fromCharCode(65 + index); // A, B, C, D

                                    return (
                                        <label
                                            key={optionLetter}
                                            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${answers[currentQuestionIndex] === optionLetter
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${currentQuestionIndex}`}
                                                value={optionLetter}
                                                checked={answers[currentQuestionIndex] === optionLetter}
                                                onChange={() => handleAnswerSelect(optionLetter)}
                                                className="w-5 h-5 text-red-500 focus:ring-red-500"
                                            />
                                            <span className="ml-3 text-gray-900">
                                                <span className="font-semibold mr-2">{optionLetter}.</span>
                                                {optionText}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="bg-white border-t border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center bg-gray-50/50">
                    <button
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span>Previous</span>
                    </button>

                    <button
                        onClick={handleMarkForReview}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${markedForReview.has(currentQuestionIndex)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <span className="material-symbols-outlined">flag</span>
                        <span className="hidden sm:inline">{markedForReview.has(currentQuestionIndex) ? 'Marked' : 'Mark for Review'}</span>
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentQuestionIndex === questions.length - 1}
                        className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>Next</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
            </div >
        </div >
    );
}

export default TakeAssessment;

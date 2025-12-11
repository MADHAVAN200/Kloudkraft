import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

function TakeAssessment() {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

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
                body: JSON.stringify({
                    action: "validate_session",
                    session_id: sid
                })
            };

            const response = await fetch('/assessment-api/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload.body
            });

            const data = await response.json();
            let responseBody = data.body;
            if (typeof responseBody === 'string') {
                responseBody = JSON.parse(responseBody);
            }

            if (responseBody && responseBody.valid) {
                setTimeRemaining(responseBody.remaining_time || 0);
                // Fetch questions if not already loaded
                if (questions.length === 0) {
                    await fetchQuestionsWithSession(sid);
                }
            } else {
                setError('Session expired. Please start a new assessment.');
                localStorage.removeItem(`assessment_session_${assessmentId}`);
            }
        } catch (err) {
            console.error('Error validating session:', err);
            fetchQuestions();
        }
    };

    const validateSession = async () => {
        if (!sessionId) return;

        try {
            const payload = {
                body: JSON.stringify({
                    action: "validate_session",
                    session_id: sessionId
                })
            };

            const response = await fetch('/assessment-api/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload.body
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
                body: JSON.stringify({
                    action: "get_questions",
                    assessment_id: assessmentId,
                    user_id: userId
                })
            };

            console.log('Payload object:', payload);
            console.log('Payload.body (already stringified):', payload.body);

            const response = await fetch('/assessment-api/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: payload.body  // Send the already-stringified body directly
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
                body: JSON.stringify({
                    action: "validate_session",
                    session_id: sessionId
                })
            };

            const validateResponse = await fetch('/assessment-api/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: validatePayload.body
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
                body: JSON.stringify({
                    action: "submit_answers",
                    session_id: sessionId,
                    answers: answers
                })
            };

            const response = await fetch('/assessment-api/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload.body
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

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 flex overflow-hidden z-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 p-6 overflow-y-auto">
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
                                    onClick={() => setCurrentQuestionIndex(index)}
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
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                    {submitting ? 'Submitting...' : 'Submit Assessment'}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{assessmentData?.name}</h1>
                        <p className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                        <span className="material-symbols-outlined text-gray-600">schedule</span>
                        <span className="font-mono text-lg font-semibold text-gray-900">{formatTime(timeRemaining)}</span>
                    </div>
                </div>

                {/* Question Content */}
                <div className="flex-1 overflow-y-auto p-8">
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
                <div className="bg-white border-t border-gray-200 px-8 py-4 flex justify-between items-center">
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
                        <span>{markedForReview.has(currentQuestionIndex) ? 'Marked' : 'Mark for Review'}</span>
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
            </div>
        </div>
    );
}

export default TakeAssessment;

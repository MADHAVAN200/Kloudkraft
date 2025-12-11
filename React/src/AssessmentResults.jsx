import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

function AssessmentResults() {
    const { sessionId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [score, setScore] = useState(location.state?.score || null);
    const [totalQuestions, setTotalQuestions] = useState(location.state?.totalQuestions || 0);
    const [assessmentName, setAssessmentName] = useState(location.state?.assessmentName || 'Assessment');

    const percentage = totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(1) : 0;

    const getScoreColor = () => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = () => {
        if (percentage >= 80) return 'bg-green-50 border-green-200';
        if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <span className="material-symbols-outlined text-green-600 text-5xl">check_circle</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Completed!</h1>
                    <p className="text-gray-600">{assessmentName}</p>
                </div>

                {/* Score Card */}
                <div className={`bg-white rounded-xl shadow-lg border-2 ${getScoreBgColor()} p-8 mb-6`}>
                    <div className="text-center">
                        <p className="text-gray-600 mb-2">Your Score</p>
                        <div className={`text-6xl font-bold ${getScoreColor()} mb-2`}>
                            {percentage}%
                        </div>
                        <p className="text-gray-700 text-lg">
                            {score} out of {totalQuestions} questions correct
                        </p>
                    </div>
                </div>

                {/* Performance Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Summary</h2>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-3xl font-bold text-green-600">{score}</p>
                            <p className="text-sm text-gray-600 mt-1">Correct</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <p className="text-3xl font-bold text-red-600">{totalQuestions - score}</p>
                            <p className="text-sm text-gray-600 mt-1">Incorrect</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-3xl font-bold text-blue-600">{totalQuestions}</p>
                            <p className="text-sm text-gray-600 mt-1">Total</p>
                        </div>
                    </div>
                </div>

                {/* Performance Message */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-start gap-3">
                        <span className={`material-symbols-outlined ${getScoreColor()} text-3xl`}>
                            {percentage >= 80 ? 'emoji_events' : percentage >= 60 ? 'thumb_up' : 'info'}
                        </span>
                        <div>
                            <h3 className={`font-bold ${getScoreColor()} mb-1`}>
                                {percentage >= 80 ? 'Excellent Work!' : percentage >= 60 ? 'Good Job!' : 'Keep Practicing!'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                                {percentage >= 80
                                    ? 'You have demonstrated excellent understanding of the material.'
                                    : percentage >= 60
                                        ? 'You have a good grasp of the material. Review the topics you missed to improve further.'
                                        : 'Consider reviewing the material and practicing more to improve your understanding.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/assessments')}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
                    >
                        Back to Assessments
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>

                {/* Session Info */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Session ID: {sessionId}</p>
                    <p className="mt-1">Your results have been saved</p>
                </div>
            </div>
        </div>
    );
}

export default AssessmentResults;

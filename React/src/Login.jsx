import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { signIn } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { refreshAuth } = useAuth();

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { isSignedIn, nextStep } = await signIn({ username, password });

            if (isSignedIn) {
                await refreshAuth();
                navigate('/dashboard');
            } else {
                if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
                    setError('New password required. Please contact admin.');
                } else {
                    setError(`Sign in step: ${nextStep.signInStep}`);
                }
            }
        } catch (err) {
            console.error('Error signing in', err);
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#F8F9FA] dark:bg-brand-dark transition-colors duration-300">
            <div className="w-full max-w-[400px] bg-white dark:bg-brand-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-300">
                <div className="space-y-1 pb-6">
                    <h1 className="text-center text-2xl font-bold tracking-tight text-[#1A1A1A] dark:text-white">
                        Sign In
                    </h1>
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">Kloudkraft Admin Portal</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="username" className="block text-sm font-semibold text-[#1A1A1A] dark:text-gray-200">
                            Username
                        </label>
                        <input
                            id="username"
                            placeholder="Enter your username"
                            type="text"
                            className="w-full px-4 py-3 bg-[#F1F3F5] dark:bg-gray-800 border-none rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-semibold text-[#1A1A1A] dark:text-gray-200">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                placeholder="Enter your password"
                                type={showPassword ? 'text' : 'password'}
                                className="w-full px-4 py-3 bg-[#F1F3F5] dark:bg-gray-800 border-none rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-red-500 pr-12 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-[#D92D20] hover:bg-[#B9251B] text-white py-3 text-base font-semibold rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="flex items-center justify-between mt-4 text-sm font-medium">
                    <a href="#" className="text-[#D92D20] hover:underline dark:text-red-400">
                        Forgot Password?
                    </a>
                    <a href="#" className="text-[#D92D20] hover:underline dark:text-red-400">
                        Contact Admin
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Login;

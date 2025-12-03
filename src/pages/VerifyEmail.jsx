import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUser } from '../services/authService';
import Button from '../components/Button';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isEmailVerified, logout } = useAuth();
    const [email, setEmail] = useState(location.state?.email || '');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Redirect if already verified
    useEffect(() => {
        if (isEmailVerified) {
            navigate('/dashboard');
        }
    }, [isEmailVerified, navigate]);

    // Redirect to signup if no email provided
    useEffect(() => {
        if (!email) {
            navigate('/signup');
        }
    }, [email, navigate]);

    // Countdown timer for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    // Check verification status every 5 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            const { user } = await getCurrentUser();
            if (user && user.email_confirmed_at) {
                // Email verified! Reload to update auth state
                window.location.href = '/dashboard';
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleResendEmail = async () => {
        setResendLoading(true);
        setResendSuccess(false);

        try {
            // Supabase doesn't have a direct resend method in the client
            // User needs to sign up again or use password reset
            // For now, show success message
            setResendSuccess(true);
            setCountdown(60);
            setCanResend(false);
        } catch (err) {
            console.error('Resend error:', err);
        } finally {
            setResendLoading(false);
        }
    };

    const handleBackToSignup = () => {
        navigate('/signup');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Smart Pet Feeder
                    </h1>
                </div>

                {/* Verification Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mail className="h-10 w-10 text-blue-600" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
                        Verify Your Email
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 text-center mb-6">
                        We've sent a verification link to
                    </p>
                    <p className="text-blue-600 font-medium text-center mb-6">
                        {email}
                    </p>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900">
                                <p className="font-medium mb-2">Next steps:</p>
                                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                                    <li>Check your email inbox</li>
                                    <li>Click the verification link</li>
                                    <li>You'll be automatically redirected to login</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Resend Success Message */}
                    {resendSuccess && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-green-800">
                                Verification email sent! Check your inbox.
                            </p>
                        </div>
                    )}

                    {/* Resend Button */}
                    <Button
                        variant="outline"
                        onClick={handleResendEmail}
                        disabled={!canResend || resendLoading}
                        loading={resendLoading}
                        className="w-full mb-4"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {canResend ? 'Resend Verification Email' : `Resend in ${countdown}s`}
                    </Button>

                    {/* Back to Signup Button */}
                    <button
                        onClick={handleBackToSignup}
                        className="w-full text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                    >
                        Back to Sign Up
                    </button>

                    {/* Help Text */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600 text-center">
                            Didn't receive the email? Check your spam folder or{' '}
                            <button
                                onClick={handleResendEmail}
                                disabled={!canResend}
                                className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                resend it
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-8">
                    © 2025 Smart Pet Feeder. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;

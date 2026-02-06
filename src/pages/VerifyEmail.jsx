import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, CheckCircle2, RefreshCw, PawPrint } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUser } from '../services/authService';
import Button from '../components/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isEmailVerified } = useAuth();
    const [email, setEmail] = useState(location.state?.email || '');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (user && isEmailVerified) {
            navigate('/dashboard');
        }
    }, [user, isEmailVerified, navigate]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    useEffect(() => {
        const interval = setInterval(async () => {
            const { user } = await getCurrentUser();
            if (user && user.email_confirmed_at) {
                window.location.href = '/dashboard';
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleResendEmail = async () => {
        setResendLoading(true);
        setResendSuccess(false);
        try {
            setResendSuccess(true);
            setCountdown(60);
            setCanResend(false);
        } catch (err) {
            console.error('Resend error:', err);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[450px] space-y-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="bg-primary p-2.5 rounded-lg mb-2">
                        <PawPrint className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
                    <p className="text-sm text-muted-foreground">
                        We've sent a verification link to <span className="text-foreground font-medium">{email || 'your email'}</span>
                    </p>
                </div>

                <Card className="border-border">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Verify your account</CardTitle>
                        <CardDescription>
                            Please click the link in the email to verify your email address and activate your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span>Check your inbox for a verification email.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span>Click the link in the email to verify.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span>You'll be redirected here to log in.</span>
                                </li>
                            </ul>
                        </div>

                        {resendSuccess && (
                            <div className="p-3 bg-success/10 border border-success/20 rounded-md flex items-start gap-2.5">
                                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-success">Verification email sent! Check your inbox.</p>
                            </div>
                        )}

                        <Button
                            variant="default"
                            onClick={handleResendEmail}
                            disabled={!canResend || resendLoading}
                            loading={resendLoading}
                            className="w-full"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {canResend ? 'Resend Verification Email' : `Resend in ${countdown}s`}
                        </Button>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 border-t border-border pt-6 mt-2">
                        <Link
                            to="/signup"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Back to Sign Up
                        </Link>
                    </CardFooter>
                </Card>

                <p className="text-center text-xs text-muted-foreground leading-relaxed">
                    Didn't receive the email? Check your spam folder or junk mail.
                    If you still don't see it, try resending the verification email.
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;

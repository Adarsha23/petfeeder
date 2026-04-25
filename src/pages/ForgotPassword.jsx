import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2, PawPrint } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { resetPassword } from '../services/authService';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email) { setError('Email is required'); return; }
        if (!/\S+@\S+\.\S+/.test(email)) { setError('Email is invalid'); return; }

        setLoading(true);
        const { error: err } = await resetPassword(email);
        setLoading(false);

        if (err) {
            setError(err);
        } else {
            setSent(true);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[400px] space-y-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="bg-primary p-2.5 rounded-lg mb-2">
                        <PawPrint className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your email and we'll send you a reset link
                    </p>
                </div>

                <Card className="border-border">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl">Reset Password</CardTitle>
                        <CardDescription>
                            We'll email you a secure link to reset your password
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sent ? (
                            <div className="p-3 bg-success/10 border border-success/20 rounded-md flex items-start gap-2.5">
                                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-success">
                                    Check your email for a password reset link. It may take a minute to arrive.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2.5">
                                        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                                        <p className="text-xs font-medium text-destructive">{error}</p>
                                    </div>
                                )}
                                <Input
                                    label="Email"
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    icon={Mail}
                                    autoComplete="email"
                                />
                                <Button
                                    type="submit"
                                    variant="default"
                                    loading={loading}
                                    className="w-full"
                                >
                                    Send Reset Link
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="flex items-center justify-center text-sm text-muted-foreground border-t border-border pt-6 mt-2">
                        <Link to="/login" className="font-semibold text-primary hover:underline underline-offset-4">
                            Back to login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;

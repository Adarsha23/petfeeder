import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle, CheckCircle2, PawPrint } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (searchParams.get('verified') === 'true') {
            setSuccessMessage('Email verified successfully! Please log in.');
            window.history.replaceState({}, '', '/login');
        }
    }, [searchParams]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        if (!validateForm()) return;

        setLoading(true);
        try {
            await login({
                email: formData.email,
                password: formData.password,
                rememberMe: formData.rememberMe
            });
            navigate('/dashboard');
        } catch (err) {
            setServerError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[400px] space-y-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="bg-primary p-2.5 rounded-lg mb-2">
                        <PawPrint className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your credentials to access your smart feeder
                    </p>
                </div>

                <Card className="border-border">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl">Login</CardTitle>
                        <CardDescription>
                            Access your pet's feeding schedules and analytics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {successMessage && (
                            <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-md flex items-start gap-2.5">
                                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-success">{successMessage}</p>
                            </div>
                        )}

                        {serverError && (
                            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2.5">
                                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-destructive">{serverError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@example.com"
                                icon={Mail}
                                error={errors.email}
                                autoComplete="email"
                            />

                            <Input
                                label="Password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                icon={Lock}
                                error={errors.password}
                                autoComplete="current-password"
                            />

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                                    />
                                    <span className="text-sm text-muted-foreground">Remember me</span>
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-primary hover:underline underline-offset-4"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                variant="default"
                                loading={loading}
                                className="w-full"
                            >
                                Sign In
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground border-t border-border pt-6 mt-2">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-semibold text-primary hover:underline underline-offset-4">
                            Sign up
                        </Link>
                    </CardFooter>
                </Card>

                <p className="px-8 text-center text-sm text-muted-foreground">
                    By clicking continue, you agree to our{' '}
                    <Link to="/terms" className="underline underline-offset-4 hover:text-primary">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="underline underline-offset-4 hover:text-primary">Privacy Policy</Link>.
                </p>
            </div>
        </div>
    );
};

export default Login;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, PawPrint } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { cn } from '@/lib/utils';

const Signup = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, label: '', color: '' };
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        const levels = [
            { strength: 0, label: '', color: 'bg-muted' },
            { strength: 1, label: 'Weak', color: 'bg-destructive' },
            { strength: 2, label: 'Fair', color: 'bg-orange-500' },
            { strength: 3, label: 'Good', color: 'bg-yellow-500' },
            { strength: 4, label: 'Strong', color: 'bg-success' },
            { strength: 5, label: 'Very Strong', color: 'bg-success' }
        ];
        return levels[strength];
    };

    const passwordStrength = getPasswordStrength(formData.password);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Min 8 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!formData.agreeToTerms) newErrors.agreeToTerms = 'Terms acceptance required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        if (!validateForm()) return;

        setLoading(true);
        try {
            await signup({
                name: formData.name.trim(),
                email: formData.email,
                password: formData.password
            });
            navigate('/verify-email', { state: { email: formData.email } });
        } catch (err) {
            setServerError(err.message || 'Signup failed. Please try again.');
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
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12">
            <div className="w-full max-w-[450px] space-y-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="bg-primary p-2.5 rounded-lg mb-2">
                        <PawPrint className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
                    <p className="text-sm text-muted-foreground">
                        Join the future of precision pet feeding
                    </p>
                </div>

                <Card className="border-border">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl">Sign Up</CardTitle>
                        <CardDescription>
                            Enter your details below to create your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {serverError && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2.5">
                                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-destructive">{serverError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Full Name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                icon={User}
                                error={errors.name}
                            />

                            <Input
                                label="Email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@example.com"
                                icon={Mail}
                                error={errors.email}
                            />

                            <div className="space-y-2">
                                <Input
                                    label="Password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    icon={Lock}
                                    error={errors.password}
                                />
                                {formData.password && (
                                    <div className="space-y-1.5 px-0.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Strength: {passwordStrength.label}</span>
                                        </div>
                                        <div className="flex gap-1 h-1">
                                            {[1, 2, 3, 4, 5].map((level) => (
                                                <div
                                                    key={level}
                                                    className={cn(
                                                        "flex-1 rounded-full transition-colors",
                                                        level <= passwordStrength.strength ? passwordStrength.color : "bg-muted"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Input
                                label="Confirm Password"
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                icon={Lock}
                                error={errors.confirmPassword}
                            />

                            <div className="flex items-start gap-2 py-2">
                                <input
                                    type="checkbox"
                                    name="agreeToTerms"
                                    id="agreeToTerms"
                                    checked={formData.agreeToTerms}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring mt-0.5"
                                />
                                <label htmlFor="agreeToTerms" className="text-xs text-muted-foreground leading-normal">
                                    I agree to the <Link to="/terms" className="text-primary hover:underline font-medium">Terms of Service</Link> and <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>.
                                </label>
                            </div>
                            {errors.agreeToTerms && (
                                <p className="text-[10px] font-bold text-destructive uppercase tracking-tight">{errors.agreeToTerms}</p>
                            )}

                            <Button
                                type="submit"
                                variant="default"
                                loading={loading}
                                className="w-full mt-2"
                            >
                                Create Account
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground border-t border-border pt-6 mt-2">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-primary hover:underline underline-offset-4">
                            Sign in
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default Signup;

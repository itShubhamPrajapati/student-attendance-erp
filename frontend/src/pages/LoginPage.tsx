import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  QrCode,
  Lock,
  Mail,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../auth/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect to the user's role dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
        return;
      }

      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'TEACHER') {
        navigate('/teacher', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your institutional email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const authenticatedUser = await login(cleanEmail, password);
      if (authenticatedUser.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (authenticatedUser.role === 'TEACHER') {
        navigate('/teacher', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : '';
      if (rawMsg.toLowerCase().includes('invalid') || rawMsg.toLowerCase().includes('unauthorized') || rawMsg.includes('401')) {
        setErrorMessage('Email or password is incorrect. Please verify your credentials and try again.');
      } else if (rawMsg.toLowerCase().includes('fetch') || rawMsg.toLowerCase().includes('network')) {
        setErrorMessage('Unable to connect to the authentication server. Please check your network connection.');
      } else {
        setErrorMessage('Unable to sign in. Please verify your credentials or try again in a few moments.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectRole = (role: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'ADMIN') {
      setEmail('admin@example.com');
      setPassword('ChangeThisPassword123');
    } else if (role === 'TEACHER') {
      setEmail('teacher@example.com');
      setPassword('teacher123');
    } else {
      setEmail('student@example.com');
      setPassword('student123');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 px-4 py-6 sm:py-10">
      {/* Return Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium font-heading text-[#464554] dark:text-slate-400 hover:text-[#131b2e] dark:hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to System Overview</span>
      </Link>

      <Card variant="solid" className="shadow-2xl border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#111726]/95 rounded-3xl overflow-hidden">
        <CardHeader className="text-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="mx-auto mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-[#4648d4] text-white shadow-lg shadow-[#4648d4]/30">
            <QrCode className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold font-heading text-[#131b2e] dark:text-white">
            Welcome to Lumina
          </CardTitle>
          <CardDescription className="text-xs text-[#464554] dark:text-slate-400">
            Enter your institutional credentials to access your portal
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Role Segmented Control matching Stitch Mobile #20feea49 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold font-heading text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Portal Role
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-heading">Auto-fills demo</span>
            </div>
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl gap-1 border border-slate-200/60 dark:border-white/10">
              {(['STUDENT', 'TEACHER', 'ADMIN'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`flex-1 py-2 text-xs font-semibold font-heading rounded-lg capitalize transition-all cursor-pointer ${
                    selectedRole === role
                      ? 'bg-white dark:bg-slate-700 text-[#4648d4] dark:text-indigo-300 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {role.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Institutional Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold font-heading text-slate-700 dark:text-slate-300">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="user@lumina.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] transition"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide toggle */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold font-heading text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => handleSelectRole(selectedRole)}
                  className="text-[11px] font-semibold text-[#4648d4] dark:text-indigo-400 hover:underline"
                >
                  Reset Demo
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#4648d4] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-[#4648d4]"
              />
              <label htmlFor="rememberMe" className="text-xs text-slate-600 dark:text-slate-400 select-none">
                Remember this device for 30 days
              </label>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in" role="alert">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold block font-heading">Authentication Error</span>
                  <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-[#4648d4] hover:bg-[#383ab6] text-white shadow-md shadow-[#4648d4]/30 font-bold flex items-center justify-center gap-2 mt-2"
              isLoading={isSubmitting}
            >
              <span>Sign In Securely</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Quick Notice */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <KeyRound className="w-3.5 h-3.5 text-[#4648d4] dark:text-indigo-400" />
              <span>Selected Role: <strong className="font-semibold text-slate-800 dark:text-slate-200 uppercase">{selectedRole}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Security Banner */}
      <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 text-center font-heading">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#006c49] dark:text-emerald-400" />
          <span className="font-semibold text-slate-600 dark:text-slate-400">SSO &amp; JWT Enabled Higher Ed Platform</span>
        </div>
        <p className="text-[10px] text-slate-400 max-w-xs">
          By signing in, you agree to Lumina Academic's Terms of Service &amp; Campus Policy.
        </p>
      </div>
    </div>
  );
};

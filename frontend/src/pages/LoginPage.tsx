import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Lock, Mail, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [devMessage, setDevMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'student'>('student');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setDevMessage(null);

    // Simulate submission delay and display authentic Phase 1 status message without fake login
    setTimeout(() => {
      setIsSubmitting(false);
      setDevMessage(
        'Authentication and JWT session issuance will be activated in Phase 2. You can explore the placeholder dashboards directly from the navigation links.'
      );
    }, 600);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 px-4 py-8">
      {/* Return Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to System Overview</span>
      </Link>

      <Card className="shadow-soft-lg border-slate-200/90">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <QrCode className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold font-heading">Sign In to Attendance Portal</CardTitle>
          <CardDescription className="text-xs">
            College Field Project — Academic Attendance Management
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Role Preview Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Target Role Preview
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/60">
              {(['student', 'teacher', 'admin'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg capitalize transition ${
                    selectedRole === role
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="College Email Address"
              type="email"
              placeholder="e.g. roll_or_faculty@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              id="password"
              label="Password"
              isPassword
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span>Remember session</span>
              </label>
              <span className="text-slate-400 hover:underline cursor-not-allowed" title="Available in Phase 2">
                Forgot password?
              </span>
            </div>

            {/* Development Notice Alert */}
            {devMessage ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block">Phase 1 Development Mode</span>
                  <p className="text-[11px] leading-relaxed text-amber-800">{devMessage}</p>
                </div>
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
            >
              Sign In to Account
            </Button>
          </form>

          {/* Quick Direct Links to Role Dashboards for Demonstration */}
          <div className="pt-3 border-t border-slate-100 text-center space-y-2">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Quick Demonstration Shortcuts:
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Link to="/admin">
                <Badge variant="info" className="hover:bg-blue-100 transition cursor-pointer">
                  Go to /admin
                </Badge>
              </Link>
              <Link to="/teacher">
                <Badge variant="warning" className="hover:bg-amber-100 transition cursor-pointer">
                  Go to /teacher
                </Badge>
              </Link>
              <Link to="/student">
                <Badge variant="success" className="hover:bg-emerald-100 transition cursor-pointer">
                  Go to /student
                </Badge>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Banner */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
        <span>GORM & PostgreSQL Secure College Portal Architecture</span>
      </div>
    </div>
  );
};

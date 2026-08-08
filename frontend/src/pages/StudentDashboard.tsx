import React from 'react';
import { GraduationCap, QrCode, BarChart3, Clock, Sparkles, LogOut } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../auth/AuthContext';

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <PageHeader
        title={`Hello, ${user?.name || 'Student'}`}
        description="Student attendance portal. Monitor your attendance percentage across registered courses and scan classroom QR codes."
        badge={
          <Badge variant="success" withDot>
            Student Account
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="neutral" className="font-mono text-xs">
              {user?.email}
            </Badge>
            <Button variant="outline" size="sm" onClick={logout} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
              Sign Out
            </Button>
          </div>
        }
      />

      {/* Scope Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-3">
        <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0 mt-0.5">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <span className="font-bold block">Phase 2 Authentication Verified</span>
          <p className="text-emerald-800 leading-relaxed">
            Your Student account has successfully authenticated with JWT session tokens. Mobile camera QR scanning, attendance percentage calculation, and class check-in history will be activated in upcoming phases.
          </p>
        </div>
      </div>

      {/* Main Student Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Overall Attendance Percentage Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Attendance Percentage</CardTitle>
                  <CardDescription>Aggregate semester metric</CardDescription>
                </div>
              </div>
              <Badge variant="info">Target: 75%+</Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-3 space-y-4">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-indigo-50/60 to-slate-50 border border-indigo-100">
              <div className="text-4xl font-extrabold text-indigo-700 font-heading">
                -- %
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Overall Attendance Metric
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/60 text-indigo-800 text-[11px]">
                <Sparkles className="w-3 h-3" />
                <span>Computed automatically from attendance records in Phase 3</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>College Minimum Requirement</span>
                <span>75.0%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-600 h-2 rounded-full w-3/4 opacity-30" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Scan QR Code Action Card Placeholder */}
        <Card className="shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Scan Classroom QR</CardTitle>
                    <CardDescription>Camera check-in module</CardDescription>
                  </div>
                </div>
                <Badge variant="neutral">Mobile Ready</Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <EmptyState
                icon={<QrCode className="w-6 h-6" />}
                title="Camera QR Scanner"
                description="In Phase 3, this button will open your mobile device camera to scan the teacher's dynamic classroom QR code."
                badgeText="Phase 3 Feature"
                action={
                  <Button variant="outline" size="sm" disabled leftIcon={<QrCode className="w-3.5 h-3.5" />}>
                    Open Scanner (Preview)
                  </Button>
                }
                className="p-6"
              />
            </CardContent>
          </div>
        </Card>

        {/* 3. Recent Attendance History */}
        <Card className="shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Recent Attendance</CardTitle>
                    <CardDescription>Recent class logs</CardDescription>
                  </div>
                </div>
                <Badge variant="neutral">0 Entries</Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <EmptyState
                icon={<Clock className="w-6 h-6" />}
                title="No attendance records"
                description="Your past lecture attendance timestamps, course subject codes, and check-in verifications will appear here."
                badgeText="Phase 3 Feature"
                className="p-6"
              />
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

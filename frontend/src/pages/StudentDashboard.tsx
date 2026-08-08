import React from 'react';
import { QrCode, BarChart3, Clock, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';

export const StudentDashboard: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Student Attendance Portal"
        description="Monitor your personal attendance percentage across subjects and prepare to scan lecture QR codes."
        badge={
          <Badge variant="success" withDot>
            Student Profile
          </Badge>
        }
        actions={
          <Button
            size="sm"
            leftIcon={<QrCode className="w-4 h-4" />}
            disabled
            title="QR scanner camera will be activated in Phase 2"
          >
            Scan Class QR Code
          </Button>
        }
      />

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
                Overall Attendance (Placeholder)
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/60 text-indigo-800 text-[11px]">
                <Sparkles className="w-3 h-3" />
                <span>Computed automatically upon session check-ins</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>College Threshold Requirement</span>
                <span>75.0% Minimum</span>
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
                title="Camera QR Scanner Placeholder"
                description="In Phase 2, this button will open your mobile device camera to scan the teacher's dynamic classroom QR code."
                badgeText="Phase 2 Scope"
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
                description="Your past attendance timestamps, subject codes, and lecturer approvals will be listed here in Phase 2."
                badgeText="Phase 2 Scope"
                className="p-6"
              />
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

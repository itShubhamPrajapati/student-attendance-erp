import React from 'react';
import { School, Clock, QrCode, CheckSquare, Calendar, Users, LogOut } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../auth/AuthContext';

export const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <PageHeader
        title={`Welcome, ${user?.name || 'Faculty Member'}`}
        description="Faculty portal for classroom lectures, live QR attendance generation, and student check-in records."
        badge={
          <Badge variant="warning" withDot>
            Teacher Portal
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
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
        <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 mt-0.5">
          <School className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <span className="font-bold block">Phase 2 Authentication Verified</span>
          <p className="text-amber-800 leading-relaxed">
            Your Teacher account has successfully authenticated with JWT session tokens. Dynamic QR code generation, timetable periods, and real-time attendance marking will be activated in upcoming phases.
          </p>
        </div>
      </div>

      {/* Grid of 3 Main Teacher Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Today's Classes */}
        <Card className="shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Today's Classes</CardTitle>
                    <CardDescription>Scheduled lectures</CardDescription>
                  </div>
                </div>
                <Badge variant="neutral">0 Scheduled</Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <EmptyState
                icon={<Calendar className="w-5 h-5" />}
                title="No classes scheduled today"
                description="Timetable mapping and classroom batches will be enabled in upcoming phases."
                badgeText="Phase 3 Feature"
                className="p-6"
              />
            </CardContent>
          </div>
        </Card>

        {/* 2. Active Attendance Sessions */}
        <Card className="shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Active Attendance</CardTitle>
                    <CardDescription>Live QR code monitor</CardDescription>
                  </div>
                </div>
                <Badge variant="neutral">Inactive</Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <EmptyState
                icon={<QrCode className="w-5 h-5" />}
                title="No active QR session"
                description="Dynamic rotating QR code generation and projector display will be available in upcoming phases."
                badgeText="Phase 3 Feature"
                className="p-6"
              />
            </CardContent>
          </div>
        </Card>

        {/* 3. Attendance Records */}
        <Card className="shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Attendance Records</CardTitle>
                    <CardDescription>Historical logs & reports</CardDescription>
                  </div>
                </div>
                <Badge variant="neutral">0 Logs</Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <EmptyState
                icon={<Users className="w-5 h-5" />}
                title="No records found"
                description="Exportable attendance reports, percentage calculations, and session logs will be available in upcoming phases."
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

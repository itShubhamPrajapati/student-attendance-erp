import React from 'react';
import { Clock, QrCode, CheckSquare, Calendar, Users, Play } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';

export const TeacherDashboard: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Faculty & Teacher Workspace"
        description="Launch live QR attendance sessions for your assigned lecture periods and view real-time student check-ins."
        badge={
          <Badge variant="warning" withDot>
            Teacher Portal
          </Badge>
        }
        actions={
          <Button size="sm" leftIcon={<Play className="w-3.5 h-3.5" />} disabled title="Activated in Phase 2">
            Start Live Attendance Session
          </Button>
        }
      />

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
                description="Timetable and lecture batch mapping will be populated in Phase 2."
                badgeText="Phase 2 Feature"
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
                description="Dynamic QR token generation and live projection will be enabled in Phase 2."
                badgeText="Phase 2 Feature"
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
                description="Exportable attendance reports, percentage calculations, and session logs will be available in Phase 2."
                badgeText="Phase 2 Feature"
                className="p-6"
              />
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

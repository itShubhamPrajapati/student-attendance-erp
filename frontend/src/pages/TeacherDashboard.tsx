import React, { useState, useEffect, useCallback } from 'react';
import { School, BookOpen, Building2, QrCode, LogOut, RefreshCw, AlertCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TeacherAssignmentItem, TeacherProfile } from '../types';
import { apiGetTeacherProfile, apiGetTeacherAssignments } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeacherData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, assignmentsRes] = await Promise.all([
        apiGetTeacherProfile().catch(() => null),
        apiGetTeacherAssignments(),
      ]);
      if (profileRes?.profile) {
        setProfile(profileRes.profile);
      }
      setAssignments(assignmentsRes.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load teacher assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <PageHeader
        title={`Welcome back, ${user?.name || 'Faculty Member'}`}
        description="Faculty portal for academic course management, assigned classroom lecture batches, and attendance sessions."
        badge={
          <Badge variant="warning" withDot>
            Faculty Workspace
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTeacherData}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={logout} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
              Sign Out
            </Button>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTeacherData}>
            Retry
          </Button>
        </div>
      )}

      {/* Teacher Profile Summary Card */}
      <Card className="p-4 bg-gradient-to-r from-amber-50/50 via-white to-slate-50 border-amber-200/60 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                {profile?.name || user?.name}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Employee ID: <span className="font-semibold text-amber-700">{profile?.employee_id || 'Faculty Account'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Badge variant="neutral" className="text-xs">
              Department: {profile?.department || 'Academic Faculty'}
            </Badge>
            <Badge variant="success" withDot className="text-xs">
              Active Instructor
            </Badge>
          </div>
        </div>
      </Card>

      {/* Section: Assigned Subjects & Classes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              My Assigned Subjects & Classes
            </h3>
            <p className="text-xs text-slate-500">
              Active academic lecture allocations configured by the administration
            </p>
          </div>
          <Badge variant="info">
            {assignments.length} Course Allocations
          </Badge>
        </div>

        {loading ? (
          <div className="min-h-[25vh] flex flex-col items-center justify-center p-8">
            <LoadingSpinner size="lg" label="Loading your assigned courses..." />
          </div>
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="No classes assigned yet"
            description="You do not have any teaching allocations assigned by the administrator yet. Once the Admin assigns you to subjects and classes, they will appear here."
            badgeText="Assignments Pending"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((item) => (
              <Card key={item.assignment_id} hoverEffect className="p-5 flex flex-col justify-between border-slate-200/80 shadow-xs space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <Badge variant="info" className="font-mono text-[11px]">
                      {item.code}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-heading">{item.subject}</h4>
                    <p className="text-xs text-slate-500 font-medium">{item.department}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{item.class}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Semester {item.semester} &bull; Section {item.section} ({item.academic_year})
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Classroom Ready</span>
                  <Badge variant="neutral" className="text-[10px]">
                    Phase 4 Attendance
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Future Attendance Notice */}
      <Card className="p-5 bg-gradient-to-r from-indigo-50/60 via-white to-purple-50/40 border-indigo-100 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-900 font-heading">
                Attendance Tools Preview
              </span>
              <Badge variant="info" className="text-[10px]">Phase 4 Upcoming</Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Attendance management tools (dynamic rotating QR codes, lecture session timers, and real-time student check-in logs) will be activated in the next phase using these assigned subjects and classes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

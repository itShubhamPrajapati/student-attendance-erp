import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Building2, BookOpen, QrCode, LogOut, RefreshCw, AlertCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StudentProfile, Subject } from '../types';
import { apiGetStudentProfile, apiGetStudentSubjects } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, subjectsRes] = await Promise.all([
        apiGetStudentProfile(),
        apiGetStudentSubjects(),
      ]);
      setProfile(profileRes.student);
      setSubjects(subjectsRes.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load student profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <PageHeader
        title={`Hello, ${profile?.name || user?.name || 'Student'}`}
        description="Student academic portal. Access your enrolled class batch, course subjects curriculum, and upcoming attendance tools."
        badge={
          <Badge variant="success" withDot>
            Student Workspace
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStudentData}
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
          <Button variant="outline" size="sm" onClick={fetchStudentData}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="min-h-[35vh] flex flex-col items-center justify-center p-8">
          <LoadingSpinner size="lg" label="Loading your academic profile..." />
        </div>
      ) : (
        <>
          {/* Top Profile & Class Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Student Profile Details */}
            <Card className="p-5 shadow-xs bg-white border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">
                      {profile?.name || user?.name}
                    </h3>
                    <p className="text-xs text-slate-500">{profile?.email || user?.email}</p>
                  </div>
                </div>
                <Badge variant="success" withDot className="text-[10px]">
                  Enrolled
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Roll Number</span>
                  <p className="font-mono font-bold text-indigo-600 text-xs mt-0.5">
                    {profile?.roll_number || 'N/A'}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Department</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5 truncate">
                    {profile?.department || 'Computer Science'}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Semester & Section</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">
                    Sem {profile?.semester} &bull; Sec {profile?.section}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">System Role</span>
                  <p className="font-semibold text-emerald-700 text-xs mt-0.5">Student</p>
                </div>
              </div>
            </Card>

            {/* 2. Assigned Class Batch Card */}
            <Card className="p-5 shadow-xs bg-white border-slate-200/80 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-heading">
                        Assigned Class Batch
                      </h3>
                      <p className="text-xs text-slate-500">Academic grouping</p>
                    </div>
                  </div>
                  {profile?.class ? (
                    <Badge variant="info">Assigned</Badge>
                  ) : (
                    <Badge variant="neutral">Pending</Badge>
                  )}
                </div>

                {profile?.class ? (
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1.5">
                    <h4 className="text-base font-bold text-indigo-900 font-heading">
                      {profile.class.name}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Department: {profile.class.department}
                    </p>
                    <div className="flex items-center gap-3 text-xs font-mono text-indigo-700 pt-1">
                      <span>Semester {profile.class.semester}</span>
                      <span>&bull;</span>
                      <span>Section {profile.class.section}</span>
                      <span>&bull;</span>
                      <span>Year: {profile.class.academic_year}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-700">No class assigned yet</p>
                    <p className="text-[11px] text-slate-400">
                      The administrator has not yet assigned your account to a class batch.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Section: My Subjects Curriculum */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  My Subjects Curriculum
                </h3>
                <p className="text-xs text-slate-500">
                  Course subjects taught to your assigned academic class
                </p>
              </div>
              <Badge variant="info">
                {subjects.length} Subjects
              </Badge>
            </div>

            {subjects.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-8 h-8" />}
                title="No subjects assigned yet"
                description={
                  profile?.class
                    ? "Your class does not have any teaching allocations assigned yet. Once the Admin allocates teachers to your class, course subjects will appear here."
                    : "Assign your account to an academic class to view the semester curriculum subjects."
                }
                badgeText="Curriculum Awaiting Allocation"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject) => (
                  <Card key={subject.id} hoverEffect className="p-5 flex flex-col justify-between border-slate-200/80 shadow-xs space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <Badge variant="info" className="font-mono text-[11px]">
                          {subject.code}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-heading">{subject.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{subject.department}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>Semester {subject.semester}</span>
                      <span className="text-indigo-600 font-semibold text-[11px]">Enrolled</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Future QR Attendance Notice */}
          <Card className="p-5 bg-gradient-to-r from-emerald-50/60 via-white to-indigo-50/40 border-emerald-100 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-900 font-heading">
                    QR Attendance Scanner Preview
                  </span>
                  <Badge variant="success" className="text-[10px]">Phase 4 Upcoming</Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mobile camera QR code scanning, subject-wise attendance percentage calculation, and class check-in history will be activated in the upcoming phase using this academic structure.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

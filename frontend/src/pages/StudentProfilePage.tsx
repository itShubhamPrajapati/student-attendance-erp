import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Building2,
  Layers,
  Lock,
  Edit3,
  Check,
  X,
  ShieldCheck,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  Award,
  CheckCircle2,
  Palette,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { ThemeToggle } from '../components/ThemeToggle';
import { StudentProfile, StudentAttendanceSummary } from '../types';
import {
  apiGetStudentProfile,
  apiUpdateStudentProfile,
  apiGetStudentAttendanceSummary,
} from '../services/api';
import { apiErrorToUserMessage } from '../utils/apiError';
import { MIN_ATTENDANCE_THRESHOLD } from './StudentDashboard';

export const StudentProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [attendance, setAttendance] = useState<StudentAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, attendanceRes] = await Promise.all([
        apiGetStudentProfile(),
        apiGetStudentAttendanceSummary().catch(() => null),
      ]);

      const prof = profileRes.data || profileRes.student;
      setProfile(prof);
      setEditPhone(prof?.phone || '');
      setEditAddress(prof?.address || '');

      if (attendanceRes?.data) {
        setAttendance(attendanceRes.data);
      }
    } catch (err: unknown) {
      setError(apiErrorToUserMessage(err, 'Unable to retrieve student profile. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartEdit = () => {
    if (profile) {
      setEditPhone(profile.phone || '');
      setEditAddress(profile.address || '');
    }
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditPhone(profile.phone || '');
      setEditAddress(profile.address || '');
    }
    setSaveError(null);
    setIsEditing(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    const cleanPhone = editPhone.trim();
    const cleanAddress = editAddress.trim();

    if (cleanPhone.length > 20) {
      setSaveError('Phone number cannot exceed 20 characters.');
      return;
    }

    if (cleanAddress.length > 255) {
      setSaveError('Address cannot exceed 255 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiUpdateStudentProfile({
        phone: cleanPhone || null,
        address: cleanAddress || null,
      });

      const updated = res.data || res.student;
      setProfile(updated);
      setEditPhone(updated.phone || '');
      setEditAddress(updated.address || '');
      setIsEditing(false);
      setSaveSuccess(true);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err: unknown) {
      setSaveError(apiErrorToUserMessage(err, 'Unable to update profile. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to extract initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <LoadingState variant="kpi" cards={4} message="Retrieving student profile & academic records..." />
        <LoadingState variant="table" rows={6} columns={4} message="Loading account credentials and history..." />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <ErrorState
          variant="card"
          title="Student Profile Unavailable"
          error={error || 'Unable to load profile data.'}
          onRetry={fetchData}
          retryLabel="Retry Loading"
        />
        <div className="mt-4 text-center">
          <Link to="/student">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalSessions = attendance?.total_sessions ?? 0;
  const presentCount = attendance?.total_present ?? 0;
  const lateCount = attendance?.total_late ?? 0;
  const attendedCount = presentCount + lateCount;
  const absentCount = attendance?.total_absent ?? Math.max(0, totalSessions - attendedCount);
  const overallPercentage = attendance?.overall_percentage ?? 0;
  const isHealthy = overallPercentage >= MIN_ATTENDANCE_THRESHOLD;
  const isCritical = totalSessions > 0 && overallPercentage < 60;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Attendance Dashboard</span>
        </Link>
        <span className="text-[11px] text-slate-400 font-mono">
          Student ID: {profile.id.slice(0, 8)}...
        </span>
      </div>

      {/* Page Header */}
      <PageHeader
        title="Student Profile & Account Settings"
        description="Institutional academic registration, personal contact details, and account security credentials."
        badge={
          <Badge variant="success" withDot>
            Official Student Record
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            {!isEditing ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartEdit}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit Contact Details
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                leftIcon={<X className="w-3.5 h-3.5" />}
              >
                Cancel Editing
              </Button>
            )}
          </div>
        }
      />

      {/* Save Success Notice */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">Personal contact information updated successfully!</span>
          </div>
          <button
            onClick={() => setSaveSuccess(false)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 text-xs cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Save Error Notice */}
      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <X className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-semibold">{saveError}</span>
          </div>
          <button
            onClick={() => setSaveError(null)}
            className="text-rose-700 dark:text-rose-400 hover:text-rose-900 text-xs cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Hero Profile Card */}
      <Card className="p-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 dark:from-indigo-900 dark:via-slate-900 dark:to-indigo-950 text-white rounded-3xl shadow-lg border-indigo-500 dark:border-indigo-800">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar Initials Badge */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500 to-violet-400 text-white font-heading font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/20 shrink-0">
            {getInitials(profile.name)}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-white truncate">
                {profile.name}
              </h2>
              <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                Active Student
              </Badge>
            </div>

            <p className="text-xs text-indigo-200/90 font-medium">
              Roll Number: <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-lg">{profile.roll_number}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-indigo-200/80 pt-1">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                {profile.department}
              </span>
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                {profile.class?.name || `Semester ${profile.semester} • Section ${profile.section}`}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Personal & Academic Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Personal Information Form / View */}
          <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">Personal Information</h3>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {isEditing ? 'Editing Contact Details' : 'Contact Details'}
              </span>
            </div>

            {isEditing ? (
              /* EDIT MODE FORM */
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Name (Read-only) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                       Full Student Name (Institutional)
                    </label>
                    <Input value={profile.name} disabled className="bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed" />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Institutional record — non-editable</span>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      College Email Address (Auth ID)
                    </label>
                    <Input value={profile.email} disabled className="bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed" />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Authentication email — non-editable</span>
                  </div>

                  {/* Phone (Editable) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Primary Contact Number
                    </label>
                    <Input
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="text-xs"
                    />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Up to 20 characters</span>
                  </div>

                  {/* Address (Editable) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Residential City / Address
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Mumbai, Maharashtra"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="text-xs"
                    />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Up to 255 characters</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSaving}
                    loadingText="Saving Changes..."
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              /* VIEW MODE */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> Full Name
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white font-heading text-sm">{profile.name}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> Email Address
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{profile.email}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> Contact Phone
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {profile.phone ? (
                      <span className="font-mono">{profile.phone}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">Not specified</span>
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> City / Address
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {profile.address || <span className="text-slate-400 dark:text-slate-500 italic">Not specified</span>}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Section 2: Academic Information (Institutional Read-Only) */}
          <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">Academic Registration</h3>
              </div>
              <Badge variant="neutral" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Institution Controlled
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Department</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{profile.department}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Roll Number</span>
                <p className="font-mono font-bold text-indigo-700 dark:text-indigo-400">{profile.roll_number}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Class Batch</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{profile.class?.name || 'Class Assigned'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Semester</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Semester {profile.semester}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Section</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Section {profile.section}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Academic Year</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{profile.class?.academic_year || '2026–2027'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (1 Col): Attendance Summary, Account Security & Theme Settings */}
        <div className="space-y-6">
          {/* Section 3: Attendance Summary Overview */}
          <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">Attendance Standing</h3>
              </div>
              <Badge
                variant={isCritical ? 'error' : !isHealthy ? 'warning' : 'success'}
                withDot
                className="text-[10px]"
              >
                {isCritical ? 'Critical' : !isHealthy ? 'Below 75%' : 'Good Standing'}
              </Badge>
            </div>

            {/* Metric Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-slate-900 dark:to-indigo-950 text-white flex items-baseline justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider block">
                  Attended Rate
                </span>
                <span className="text-3xl font-extrabold font-heading font-mono text-white mt-1 block">
                  {overallPercentage}%
                </span>
              </div>
              <span className="text-xs text-indigo-300 font-mono">Target: {MIN_ATTENDANCE_THRESHOLD}%</span>
            </div>

            {/* Quick Count Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60">
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">On-Time</span>
                <span className="text-lg font-bold font-mono text-emerald-800 dark:text-emerald-300">{presentCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/60">
                <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 block">Late Check-in</span>
                <span className="text-lg font-bold font-mono text-amber-800 dark:text-amber-300">{lateCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Absent</span>
                <span className="text-lg font-bold font-mono text-slate-700 dark:text-slate-300">{absentCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60">
                <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-400 block">Total Sessions</span>
                <span className="text-lg font-bold font-mono text-indigo-900 dark:text-indigo-300">{totalSessions}</span>
              </div>
            </div>

            {/* Shortcut Links */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
              <Link to="/student" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-center text-xs" leftIcon={<Layers className="w-3.5 h-3.5" />}>
                  View Attendance Dashboard
                </Button>
              </Link>
              <Link to="/student/attendance/analytics" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-center text-xs" leftIcon={<TrendingUp className="w-3.5 h-3.5" />}>
                  View Analytics & Trends
                </Button>
              </Link>
            </div>
          </Card>

          {/* Section 4: Theme Preferences */}
          <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">Theme & Appearance</h3>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">UI Preference</span>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Customize your display theme across your student workspace. Preferences are persisted locally in your browser.
              </p>
              <div className="pt-1">
                <ThemeToggle variant="pill" className="w-full justify-center" />
              </div>
            </div>
          </Card>

          {/* Section 5: Account Credentials & Security */}
          <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">Account & Security</h3>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Bcrypt Secured</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Account Role</span>
                <Badge variant="info" className="text-[10px]">STUDENT</Badge>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Account Status</span>
                <Badge variant="success" withDot className="text-[10px]">Active</Badge>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Password</span>
                <span className="font-mono text-slate-400 dark:text-slate-500 tracking-widest text-sm">••••••••</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full justify-center text-xs"
                leftIcon={<Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              >
                Change Account Password
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 4000);
        }}
      />
    </div>
  );
};

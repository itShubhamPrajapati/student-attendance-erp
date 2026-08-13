import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  School,
  Mail,
  Phone,
  MapPin,
  Building2,
  BookOpen,
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
  Users,
  Search,
  Calendar,
  Palette,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { ThemeToggle } from '../components/ThemeToggle';
import { TeacherFullProfile } from '../types';
import {
  apiGetTeacherProfile,
  apiUpdateTeacherProfile,
  apiChangeTeacherPassword,
} from '../services/api';
import { apiErrorToUserMessage } from '../utils/apiError';

export const TeacherProfilePage: React.FC = () => {
  const [profileData, setProfileData] = useState<TeacherFullProfile | null>(null);
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
      const res = await apiGetTeacherProfile();
      setProfileData(res.data);
      setEditPhone(res.data.teacher.phone || '');
      setEditAddress(res.data.teacher.address || '');
    } catch (err: unknown) {
      setError(apiErrorToUserMessage(err, 'Unable to retrieve faculty profile. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartEdit = () => {
    if (profileData) {
      setEditPhone(profileData.teacher.phone || '');
      setEditAddress(profileData.teacher.address || '');
    }
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (profileData) {
      setEditPhone(profileData.teacher.phone || '');
      setEditAddress(profileData.teacher.address || '');
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
      const res = await apiUpdateTeacherProfile({
        phone: cleanPhone || null,
        address: cleanAddress || null,
      });

      setProfileData(res.data);
      setEditPhone(res.data.teacher.phone || '');
      setEditAddress(res.data.teacher.address || '');
      setIsEditing(false);
      setSaveSuccess(true);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err: unknown) {
      setSaveError(apiErrorToUserMessage(err, 'Unable to update faculty profile. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to extract initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'FC';
    const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <LoadingState variant="kpi" cards={4} message="Retrieving faculty profile & academic assignments..." />
        <LoadingState variant="table" rows={6} columns={4} message="Loading teaching telemetry and course curricula..." />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <ErrorState
          variant="card"
          title="Faculty Profile Unavailable"
          error={error || 'Unable to load teacher profile data.'}
          onRetry={fetchData}
          retryLabel="Retry Loading"
        />
        <div className="mt-4 text-center">
          <Link to="/teacher">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Teacher Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const teacher = profileData.teacher;
  const assignments = profileData.assignments || { subjects: [], classes: [] };
  const stats = profileData.teaching_summary || {
    sessions_conducted: 0,
    finalized_sessions: 0,
    open_sessions: 0,
    students_count: 0,
    classes_count: 0,
    subjects_count: 0,
    overall_attendance_percentage: 0,
    late_percentage: 0,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/teacher"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Classes & QR Sessions</span>
        </Link>
        <span className="text-[11px] text-slate-400 font-mono">
          Employee ID: {teacher.employee_id}
        </span>
      </div>

      {/* Page Header */}
      <PageHeader
        title="Faculty Profile & Account Settings"
        description="Institutional credentials, assigned subjects and classes, teaching overview, and account security."
        badge={
          <Badge variant="warning" withDot>
            Verified Faculty Member
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
                Edit Contact Info
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
            <span className="font-semibold">Faculty contact details updated successfully!</span>
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
      <Card className="p-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl shadow-lg border-indigo-800">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar Initials Badge */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-heading font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/20 shrink-0">
            {getInitials(teacher.name)}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-white truncate">
                {teacher.name}
              </h2>
              <Badge variant="warning" className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                Faculty Member
              </Badge>
            </div>

            <p className="text-xs text-indigo-200/90 font-medium">
              Employee ID: <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-lg">{teacher.employee_id}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-indigo-200/80 pt-1">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Department of {teacher.department}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                {assignments.subjects.length} Subjects Assigned
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                {assignments.classes.length} Classes Assigned
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Personal, Professional & Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Personal Contact Information */}
          <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">Personal Contact Information</h3>
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
                      Faculty Name (Institutional)
                    </label>
                    <Input value={teacher.name} disabled className="bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed" />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Institutional record — non-editable</span>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Institutional Email Address (Auth ID)
                    </label>
                    <Input value={teacher.email} disabled className="bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed" />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Authentication identity — non-editable</span>
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
                      Residential / Campus Office Address
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Staff Quarters, Block B"
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
                  <p className="font-bold text-slate-900 dark:text-white font-heading text-sm">{teacher.name}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> Email Address
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{teacher.email}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> Contact Phone
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {teacher.phone ? (
                      <span className="font-mono">{teacher.phone}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">Not specified</span>
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> Campus / City Address
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {teacher.address || <span className="text-slate-400 dark:text-slate-500 italic">Not specified</span>}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Section 2: Professional & Institutional Details */}
          <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <School className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">Professional Information</h3>
              </div>
              <Badge variant="neutral" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Institutional Record
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Department</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{teacher.department}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Employee ID</span>
                <p className="font-mono font-bold text-indigo-700 dark:text-indigo-400">{teacher.employee_id}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Portal Role</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Faculty Instructor</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Status</span>
                <Badge variant="success" withDot className="text-[10px]">Active</Badge>
              </div>
            </div>
          </Card>

          {/* Section 3: Assigned Subjects */}
          <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">Assigned Subjects</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Course curricula under your instructional responsibility</p>
                </div>
              </div>
              <Badge variant="info" className="text-[10px]">
                {assignments.subjects.length} Subjects
              </Badge>
            </div>

            {assignments.subjects.length === 0 ? (
              <EmptyState
                title="No Subjects Assigned"
                description="You currently have no course subjects assigned to teach. Please contact your college administrator if this is unexpected."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {assignments.subjects.map((sub) => (
                  <div
                    key={sub.subject_id}
                    className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate font-heading">{sub.name}</h4>
                        <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                          {sub.code}
                        </span>
                      </div>
                      <Badge variant="neutral" className="text-[10px] shrink-0">
                        Sem {sub.semester}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <p className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500">Assigned Classes:</p>
                      <div className="flex flex-wrap gap-1">
                        {sub.class_names.map((cls, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-lg shadow-xs"
                          >
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Section 4: Assigned Classes */}
          <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">Assigned Student Classes</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Student cohorts and academic batches enrolled</p>
                </div>
              </div>
              <Badge variant="info" className="text-[10px]">
                {assignments.classes.length} Classes
              </Badge>
            </div>

            {assignments.classes.length === 0 ? (
              <EmptyState
                title="No Classes Assigned"
                description="You currently have no classes assigned. Please contact your college administrator if this is unexpected."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {assignments.classes.map((cls) => (
                  <div
                    key={cls.class_id}
                    className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-sky-200 dark:hover:border-sky-800 hover:bg-sky-50/20 dark:hover:bg-sky-950/20 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate font-heading">{cls.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{cls.department}</p>
                      </div>
                      <Badge variant="info" className="text-[10px] shrink-0">
                        Section {cls.section}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Batch: <span className="font-semibold text-slate-700 dark:text-slate-300">{cls.academic_year}</span>
                      </span>
                      <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-800 font-mono">
                        {cls.student_count} Students
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col): Teaching Telemetry, Theme Settings & Account Security */}
        <div className="space-y-6">
          {/* Section 5: Teaching Summary & Attendance Telemetry */}
          <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">Teaching Overview</h3>
              </div>
              <Badge variant="success" className="text-[10px]">
                Live Telemetry
              </Badge>
            </div>

            {/* Metric Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex items-baseline justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider block">
                  Overall Student Attendance
                </span>
                <span className="text-3xl font-extrabold font-heading font-mono text-white mt-1 block">
                  {stats.overall_attendance_percentage}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-amber-300 tracking-wider block">
                  Late Rate
                </span>
                <span className="text-sm font-bold font-mono text-amber-200">{stats.late_percentage}%</span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60">
                <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-400 block">Total Sessions</span>
                <span className="text-lg font-bold font-mono text-indigo-900 dark:text-indigo-300">{stats.sessions_conducted}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60">
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">Finalized</span>
                <span className="text-lg font-bold font-mono text-emerald-800 dark:text-emerald-300">{stats.finalized_sessions}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/60">
                <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 block">Open Sessions</span>
                <span className="text-lg font-bold font-mono text-amber-800 dark:text-amber-300">{stats.open_sessions}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/60">
                <span className="text-[10px] font-bold uppercase text-sky-700 dark:text-sky-400 block">Enrolled Students</span>
                <span className="text-lg font-bold font-mono text-sky-900 dark:text-sky-300">{stats.students_count}</span>
              </div>
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
              <Link to="/teacher/attendance/analytics" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-center text-xs" leftIcon={<TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}>
                  View Full Analytics & Charts
                </Button>
              </Link>
              <Link to="/teacher/students/attendance" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-center text-xs" leftIcon={<Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}>
                  Search Student Attendance
                </Button>
              </Link>
              <Link to="/teacher/attendance/history" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-center text-xs" leftIcon={<Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}>
                  Session History & Records
                </Button>
              </Link>
            </div>
          </Card>

          {/* Section 6: Theme Preferences */}
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
                Customize your display theme across your faculty workspace. Preferences are persisted locally in your browser.
              </p>
              <div className="pt-1">
                <ThemeToggle variant="pill" className="w-full justify-center" />
              </div>
            </div>
          </Card>

          {/* Section 7: Account Security */}
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
                <Badge variant="warning" className="text-[10px]">TEACHER</Badge>
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
        changePasswordFn={apiChangeTeacherPassword}
        title="Change Faculty Account Password"
        subtitle="Update your teacher portal authentication credentials"
        onSuccess={() => {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 4000);
        }}
      />
    </div>
  );
};

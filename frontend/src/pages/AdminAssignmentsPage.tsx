import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck2, Plus, Trash2, AlertCircle, RefreshCw, X, School, BookOpen, Building2 } from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TeachingAssignment, Teacher, Subject, Class, CreateAssignmentPayload } from '../types';
import {
  apiGetAssignments,
  apiCreateAssignment,
  apiDeleteAssignment,
  apiGetTeachers,
  apiGetSubjects,
  apiGetClasses,
} from '../services/api';

export const AdminAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<TeachingAssignment | null>(null);

  // Form states
  const [addForm, setAddForm] = useState<CreateAssignmentPayload>({
    teacher_id: '',
    subject_id: '',
    class_id: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [assignmentsRes, teachersRes, subjectsRes, classesRes] = await Promise.all([
        apiGetAssignments(),
        apiGetTeachers(),
        apiGetSubjects(),
        apiGetClasses(),
      ]);
      setAssignments(assignmentsRes.data || []);
      setTeachers((teachersRes.data || []).filter((t) => t.is_active));
      setSubjects(subjectsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load teaching assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle Add Assignment
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!addForm.teacher_id || !addForm.subject_id || !addForm.class_id) {
      setAddError('Please select a teacher, subject, and class.');
      return;
    }

    setAddLoading(true);

    try {
      await apiCreateAssignment(addForm);
      setIsAddModalOpen(false);
      setAddForm({ teacher_id: '', subject_id: '', class_id: '' });
      await fetchAllData();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to create teaching assignment');
    } finally {
      setAddLoading(false);
    }
  };

  // Handle Delete Assignment
  const handleConfirmDelete = async () => {
    if (!deletingAssignment) return;
    setDeleteError(null);
    setDeleteLoading(true);

    try {
      await apiDeleteAssignment(deletingAssignment.id);
      setDeletingAssignment(null);
      await fetchAllData();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete assignment');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Teaching Assignments"
        description="Allocate faculty instructors to specific course subjects and classroom batches for lecture sessions."
        badge={
          <Badge variant="warning" withDot>
            {assignments.length} Active Allocations
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllData}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                setAddError(null);
                if (teachers.length > 0 && !addForm.teacher_id) {
                  setAddForm((prev) => ({
                    ...prev,
                    teacher_id: teachers[0].id,
                    subject_id: subjects[0]?.id || '',
                    class_id: classes[0]?.id || '',
                  }));
                }
                setIsAddModalOpen(true);
              }}
            >
              Assign Subject
            </Button>
          </div>
        }
      />

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAllData}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8">
          <LoadingSpinner size="lg" label="Loading teaching allocations..." />
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={<UserCheck2 className="w-8 h-8" />}
          title="No teaching assignments found"
          description="Faculty members have not yet been assigned to courses and class batches. Click below to create the first assignment."
          badgeText="Allocation Ready"
          action={
            <Button
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                setAddError(null);
                setIsAddModalOpen(true);
              }}
            >
              Assign Subject to Teacher
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card className="overflow-hidden p-0 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Faculty Member</th>
                      <th className="py-3.5 px-4">Assigned Course</th>
                      <th className="py-3.5 px-4">Class Batch</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Academic Term</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <School className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <div>
                              <div className="font-semibold text-slate-900 font-heading">{assignment.teacher_name}</div>
                              <div className="font-mono text-[11px] text-amber-700">{assignment.teacher_employee_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{assignment.subject_name}</div>
                          <span className="font-mono text-indigo-600 bg-indigo-50/50 px-1 py-0.5 rounded text-[11px]">
                            {assignment.subject_code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{assignment.class_name}</div>
                          <div className="text-slate-500 text-[11px]">
                            Sem {assignment.semester} &bull; Section {assignment.section}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{assignment.department}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">{assignment.academic_year}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingAssignment(assignment);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Remove assignment"
                            aria-label="Remove assignment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <School className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 font-heading">{assignment.teacher_name}</h4>
                      <span className="font-mono text-xs text-amber-700">{assignment.teacher_employee_id}</span>
                    </div>
                  </div>
                  <Badge variant="warning">Sem {assignment.semester}</Badge>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{assignment.subject_name}</span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-500">Code: {assignment.subject_code}</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {assignment.class_name} &bull; Sec {assignment.section} ({assignment.academic_year})
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeleteError(null);
                      setDeletingAssignment(assignment);
                    }}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    className="text-rose-600 hover:bg-rose-50 min-h-[40px]"
                  >
                    Remove Assignment
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Assign Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">Assign Teacher to Subject & Class</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Teacher Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Faculty Teacher
                </label>
                <select
                  className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  value={addForm.teacher_id}
                  onChange={(e) => setAddForm({ ...addForm, teacher_id: e.target.value })}
                  required
                >
                  <option value="">-- Choose Active Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.employee_id} ({t.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Course Subject
                </label>
                <select
                  className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  value={addForm.subject_id}
                  onChange={(e) => setAddForm({ ...addForm, subject_id: e.target.value })}
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.code} (Sem {s.semester})
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Target Class Batch
                </label>
                <select
                  className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  value={addForm.class_id}
                  onChange={(e) => setAddForm({ ...addForm, class_id: e.target.value })}
                  required
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Sem {c.semester} — Sec {c.section} ({c.academic_year})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={addLoading}>
                  Save Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">Remove teaching assignment?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                <strong>{deletingAssignment.teacher_name}</strong> will no longer be assigned to teach{' '}
                <strong>{deletingAssignment.subject_name}</strong> to <strong>{deletingAssignment.class_name}</strong>.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setDeletingAssignment(null)} disabled={deleteLoading}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" isLoading={deleteLoading} onClick={handleConfirmDelete}>
                Remove Assignment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

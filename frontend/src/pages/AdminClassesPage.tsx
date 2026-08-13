import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Edit2, Trash2, AlertCircle, RefreshCw, X, Users } from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Class, CreateClassPayload, UpdateClassPayload } from '../types';
import { apiGetClasses, apiCreateClass, apiUpdateClass, apiDeleteClass } from '../services/api';

export const AdminClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);

  // Form states
  const [addForm, setAddForm] = useState<CreateClassPayload>({
    name: 'B.Sc Computer Science',
    department: 'Computer Science',
    semester: 1,
    section: 'A',
    academic_year: '2026-27',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<UpdateClassPayload>({
    name: '',
    department: '',
    semester: 1,
    section: '',
    academic_year: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchClassesList = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiGetClasses();
      setClasses(res.data || []);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassesList();
  }, [fetchClassesList]);

  // Handle Add Class
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);

    try {
      await apiCreateClass(addForm);
      setIsAddModalOpen(false);
      setAddForm({
        name: 'B.Sc Computer Science',
        department: 'Computer Science',
        semester: 1,
        section: 'A',
        academic_year: '2026-27',
      });
      await fetchClassesList();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to create class');
    } finally {
      setAddLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (cls: Class) => {
    setEditingClass(cls);
    setEditForm({
      name: cls.name,
      department: cls.department,
      semester: cls.semester,
      section: cls.section,
      academic_year: cls.academic_year,
    });
    setEditError(null);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    setEditError(null);
    setEditLoading(true);

    try {
      await apiUpdateClass(editingClass.id, editForm);
      setEditingClass(null);
      await fetchClassesList();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update class');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Delete Class
  const handleConfirmDelete = async () => {
    if (!deletingClass) return;
    setDeleteError(null);
    setDeleteLoading(true);

    try {
      await apiDeleteClass(deletingClass.id);
      setDeletingClass(null);
      await fetchClassesList();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete class');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Classes & Academic Batches"
        description="Organize student batches by department, semester curriculum, section division, and academic year."
        badge={
          <Badge variant="info" withDot>
            {classes.length} Classes Defined
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchClassesList}
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
                setIsAddModalOpen(true);
              }}
            >
              Add Class
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
          <Button variant="outline" size="sm" onClick={fetchClassesList}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8">
          <LoadingSpinner size="lg" label="Loading classes directory..." />
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title="No classes defined yet"
          description="There are currently no academic classes in the system. Click below to create the first class batch."
          badgeText="Structure Ready"
          action={
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsAddModalOpen(true)}>
              Add First Class
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
                      <th className="py-3.5 px-4">Class / Program Name</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Semester & Section</th>
                      <th className="py-3.5 px-4">Academic Year</th>
                      <th className="py-3.5 px-4">Students Enrolled</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classes.map((cls) => (
                      <tr key={cls.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 font-heading">
                          {cls.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{cls.department}</td>
                        <td className="py-3.5 px-4 text-indigo-700 font-medium">
                          Sem {cls.semester} &bull; Section {cls.section}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">{cls.academic_year}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant="neutral" className="font-mono text-xs">
                            <Users className="w-3 h-3 mr-1 inline text-slate-400" />
                            {cls.student_count ?? 0} Students
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openEditModal(cls)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="Edit class"
                              aria-label="Edit class"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteError(null);
                                setDeletingClass(cls);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete class"
                              aria-label="Delete class"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
            {classes.map((cls) => (
              <Card key={cls.id} className="p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 font-heading">{cls.name}</h4>
                    <span className="font-mono text-xs text-indigo-600 font-medium">
                      Sem {cls.semester} &bull; Sec {cls.section}
                    </span>
                  </div>
                  <Badge variant="neutral" className="text-xs">
                    {cls.student_count ?? 0} Students
                  </Badge>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-medium">{cls.department}</p>
                  <p className="text-slate-400 font-mono text-[11px]">Academic Year: {cls.academic_year}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(cls)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    className="min-h-[40px]"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeleteError(null);
                      setDeletingClass(cls);
                    }}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    className="text-rose-600 hover:bg-rose-50 min-h-[40px]"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add Class Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">Add Academic Class</h3>
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

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <Input
                label="Class / Degree Program Name"
                placeholder="e.g. B.Sc Computer Science"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Department"
                  placeholder="e.g. Computer Science"
                  value={addForm.department}
                  onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  required
                />
                <Input
                  label="Academic Year"
                  placeholder="e.g. 2026-27"
                  value={addForm.academic_year}
                  onChange={(e) => setAddForm({ ...addForm, academic_year: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Semester
                  </label>
                  <select
                    className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    value={addForm.semester}
                    onChange={(e) => setAddForm({ ...addForm, semester: parseInt(e.target.value, 10) || 1 })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Section Division"
                  placeholder="e.g. A"
                  value={addForm.section}
                  onChange={(e) => setAddForm({ ...addForm, section: e.target.value })}
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={addLoading}>
                  Create Class
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">Edit Class Batch</h3>
              </div>
              <button
                onClick={() => setEditingClass(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <Input
                label="Class / Program Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Department"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  required
                />
                <Input
                  label="Academic Year"
                  value={editForm.academic_year}
                  onChange={(e) => setEditForm({ ...editForm, academic_year: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Semester
                  </label>
                  <select
                    className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: parseInt(e.target.value, 10) || 1 })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Section Division"
                  value={editForm.section}
                  onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setEditingClass(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={editLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">Delete this class?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Class <strong>{deletingClass.name}</strong> (Sem {deletingClass.semester} - {deletingClass.section}) will be removed.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setDeletingClass(null)} disabled={deleteLoading}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" isLoading={deleteLoading} onClick={handleConfirmDelete}>
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

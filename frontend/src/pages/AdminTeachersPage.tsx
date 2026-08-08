import React, { useState, useEffect, useCallback } from 'react';
import { School, Plus, Edit2, UserCheck, UserX, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Teacher, CreateTeacherPayload, UpdateTeacherPayload } from '../types';
import { apiGetTeachers, apiCreateTeacher, apiUpdateTeacher, apiToggleTeacherStatus } from '../services/api';

export const AdminTeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [statusTargetTeacher, setStatusTargetTeacher] = useState<Teacher | null>(null);

  // Add Form State
  const [addForm, setAddForm] = useState<CreateTeacherPayload>({
    name: '',
    email: '',
    password: '',
    employee_id: '',
    department: 'Computer Science',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Form State
  const [editForm, setEditForm] = useState<UpdateTeacherPayload>({
    name: '',
    email: '',
    employee_id: '',
    department: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Status toggle state
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchTeachersList = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiGetTeachers();
      setTeachers(res.data || []);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load teachers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachersList();
  }, [fetchTeachersList]);

  // Handle Create Teacher
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);

    try {
      await apiCreateTeacher(addForm);
      setIsAddModalOpen(false);
      setAddForm({
        name: '',
        email: '',
        password: '',
        employee_id: '',
        department: 'Computer Science',
      });
      await fetchTeachersList();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to create teacher');
    } finally {
      setAddLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditForm({
      name: teacher.name,
      email: teacher.email,
      employee_id: teacher.employee_id,
      department: teacher.department,
    });
    setEditError(null);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setEditError(null);
    setEditLoading(true);

    try {
      await apiUpdateTeacher(editingTeacher.id, editForm);
      setEditingTeacher(null);
      await fetchTeachersList();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update teacher');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Status Toggle
  const handleConfirmToggleStatus = async () => {
    if (!statusTargetTeacher) return;
    setStatusLoading(true);

    try {
      await apiToggleTeacherStatus(statusTargetTeacher.id, !statusTargetTeacher.is_active);
      setStatusTargetTeacher(null);
      await fetchTeachersList();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Faculty & Teachers Management"
        description="Register faculty members, manage department assignments, update teacher profiles, and handle account status."
        badge={
          <Badge variant="warning" withDot>
            {teachers.length} Faculty
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTeachersList}
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
              Add Teacher
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
          <Button variant="outline" size="sm" onClick={fetchTeachersList}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8">
          <LoadingSpinner size="lg" label="Loading faculty directory..." />
        </div>
      ) : teachers.length === 0 ? (
        <EmptyState
          icon={<School className="w-8 h-8" />}
          title="No teachers registered yet"
          description="There are currently no faculty members in the system. Click below to add the first teacher."
          badgeText="Database Ready"
          action={
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsAddModalOpen(true)}>
              Add First Teacher
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
                      <th className="py-3.5 px-4">Teacher Name</th>
                      <th className="py-3.5 px-4">Employee ID</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 font-heading">
                          {teacher.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-amber-700 bg-amber-50/30 rounded">
                          {teacher.employee_id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {teacher.email}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{teacher.department}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant={teacher.is_active ? 'success' : 'error'} withDot>
                            {teacher.is_active ? '● Active' : '● Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openEditModal(teacher)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="Edit teacher"
                              aria-label="Edit teacher"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setStatusTargetTeacher(teacher)}
                              className={`p-1.5 rounded-lg transition ${
                                teacher.is_active
                                  ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={teacher.is_active ? 'Deactivate teacher' : 'Activate teacher'}
                              aria-label={teacher.is_active ? 'Deactivate teacher' : 'Activate teacher'}
                            >
                              {teacher.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
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
            {teachers.map((teacher) => (
              <Card key={teacher.id} className="p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 font-heading">{teacher.name}</h4>
                    <span className="font-mono text-xs text-amber-700 font-medium">{teacher.employee_id}</span>
                  </div>
                  <Badge variant={teacher.is_active ? 'success' : 'error'} withDot>
                    {teacher.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-mono text-[11px] text-slate-500 truncate">{teacher.email}</p>
                  <p className="font-medium text-slate-700">{teacher.department}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(teacher)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    className="min-h-[40px]"
                  >
                    Edit
                  </Button>
                  <Button
                    variant={teacher.is_active ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => setStatusTargetTeacher(teacher)}
                    leftIcon={teacher.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    className={teacher.is_active ? 'text-rose-600 hover:bg-rose-50 min-h-[40px]' : 'min-h-[40px]'}
                  >
                    {teacher.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add Teacher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-heading">Register Faculty Member</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <Input
                label="Full Name"
                placeholder="e.g. Prof. Alan Turing"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="teacher@example.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  required
                />
                <Input
                  label="Temporary Password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Employee ID"
                  placeholder="e.g. EMP-101"
                  value={addForm.employee_id}
                  onChange={(e) => setAddForm({ ...addForm, employee_id: e.target.value })}
                  required
                />
                <Input
                  label="Department"
                  placeholder="e.g. Computer Science"
                  value={addForm.department}
                  onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={addLoading}>
                  Create Teacher
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-heading">Edit Teacher Profile</h3>
              </div>
              <button
                onClick={() => setEditingTeacher(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <Input
                label="Full Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Employee ID"
                  value={editForm.employee_id}
                  onChange={(e) => setEditForm({ ...editForm, employee_id: e.target.value })}
                  required
                />
                <Input
                  label="Department"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setEditingTeacher(null)}>
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

      {/* Confirmation Dialog for Status Toggle */}
      {statusTargetTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-center">
            <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
              statusTargetTeacher.is_active ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {statusTargetTeacher.is_active ? <UserX className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                {statusTargetTeacher.is_active ? 'Deactivate this teacher?' : 'Re-activate this teacher?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {statusTargetTeacher.is_active
                  ? `Teacher ${statusTargetTeacher.name} (${statusTargetTeacher.employee_id}) will no longer be able to log in.`
                  : `Teacher ${statusTargetTeacher.name} will be able to log in to their faculty portal.`}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2.5">
              <Button variant="outline" onClick={() => setStatusTargetTeacher(null)}>
                Cancel
              </Button>
              <Button
                variant={statusTargetTeacher.is_active ? 'danger' : 'primary'}
                isLoading={statusLoading}
                onClick={handleConfirmToggleStatus}
              >
                {statusTargetTeacher.is_active ? 'Deactivate Account' : 'Activate Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Edit2, UserCheck, UserX, AlertCircle, RefreshCw, X, Building2, Link2 } from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Student, Class, CreateStudentPayload, UpdateStudentPayload } from '../types';
import {
  apiGetStudents,
  apiCreateStudent,
  apiUpdateStudent,
  apiToggleStudentStatus,
  apiGetClasses,
  apiAssignStudentClass,
} from '../services/api';

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [statusTargetStudent, setStatusTargetStudent] = useState<Student | null>(null);
  const [assignClassStudent, setAssignClassStudent] = useState<Student | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Add Form State
  const [addForm, setAddForm] = useState<CreateStudentPayload>({
    name: '',
    email: '',
    password: '',
    roll_number: '',
    department: 'Computer Science',
    semester: 1,
    section: 'A',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Form State
  const [editForm, setEditForm] = useState<UpdateStudentPayload>({
    name: '',
    email: '',
    roll_number: '',
    department: '',
    semester: 1,
    section: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Status toggle state
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchStudentsAndClasses = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [studentsRes, classesRes] = await Promise.all([
        apiGetStudents(),
        apiGetClasses().catch(() => ({ data: [] })),
      ]);
      setStudents(studentsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load student directory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentsAndClasses();
  }, [fetchStudentsAndClasses]);

  // Handle Create Student
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);

    try {
      await apiCreateStudent(addForm);
      setIsAddModalOpen(false);
      setAddForm({
        name: '',
        email: '',
        password: '',
        roll_number: '',
        department: 'Computer Science',
        semester: 1,
        section: 'A',
      });
      await fetchStudentsAndClasses();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to create student');
    } finally {
      setAddLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name,
      email: student.email,
      roll_number: student.roll_number,
      department: student.department,
      semester: student.semester,
      section: student.section,
    });
    setEditError(null);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditError(null);
    setEditLoading(true);

    try {
      await apiUpdateStudent(editingStudent.id, editForm);
      setEditingStudent(null);
      await fetchStudentsAndClasses();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update student');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Status Toggle
  const handleConfirmToggleStatus = async () => {
    if (!statusTargetStudent) return;
    setStatusLoading(true);

    try {
      await apiToggleStudentStatus(statusTargetStudent.id, !statusTargetStudent.is_active);
      setStatusTargetStudent(null);
      await fetchStudentsAndClasses();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  // Open Assign Class Modal
  const openAssignClassModal = (student: Student) => {
    setAssignClassStudent(student);
    setSelectedClassId(student.class_id || '');
    setAssignError(null);
  };

  // Handle Assign Class Submit
  const handleAssignClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignClassStudent) return;
    setAssignError(null);
    setAssignLoading(true);

    try {
      const classIdPayload = selectedClassId === '' ? null : selectedClassId;
      await apiAssignStudentClass(assignClassStudent.id, classIdPayload);
      setAssignClassStudent(null);
      await fetchStudentsAndClasses();
    } catch (err: unknown) {
      setAssignError(err instanceof Error ? err.message : 'Failed to assign class');
    } finally {
      setAssignLoading(false);
    }
  };

  // Helper to find class details
  const getStudentClassInfo = (student: Student) => {
    if (!student.class_id) return null;
    const found = classes.find((c) => c.id === student.class_id);
    if (found) {
      return `${found.name} • Sem ${found.semester} • Sec ${found.section}`;
    }
    return student.class_name || 'Assigned Class';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Students Management"
        description="Register new student accounts, manage enrollments, edit academic batch assignments, and assign students to classes."
        badge={
          <Badge variant="info" withDot>
            {students.length} Registered
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStudentsAndClasses}
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
              Add Student
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
          <Button variant="outline" size="sm" onClick={fetchStudentsAndClasses}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8">
          <LoadingSpinner size="lg" label="Loading students directory..." />
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No students found"
          description="There are currently no students registered in the system. Click the button below to register the first student."
          badgeText="Database Ready"
          action={
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsAddModalOpen(true)}>
              Add First Student
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
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Roll Number</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Dept / Sem / Sec</th>
                      <th className="py-3.5 px-4">Assigned Class</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => {
                      const classInfo = getStudentClassInfo(student);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-semibold text-slate-900 font-heading">
                            {student.name}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-indigo-600 bg-indigo-50/30 rounded">
                            {student.roll_number}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                            {student.email}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {student.department} &bull; Sem {student.semester} &bull; Sec {student.section}
                          </td>
                          <td className="py-3.5 px-4">
                            {classInfo ? (
                              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                <Building2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                                <span className="truncate max-w-[160px]">{classInfo}</span>
                              </div>
                            ) : (
                              <Badge variant="neutral" className="text-[10px]">
                                Not Assigned
                              </Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={student.is_active ? 'success' : 'error'} withDot>
                              {student.is_active ? '● Active' : '● Inactive'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => openAssignClassModal(student)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                title="Assign to Class"
                                aria-label="Assign to Class"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal(student)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                title="Edit student"
                                aria-label="Edit student"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setStatusTargetStudent(student)}
                                className={`p-1.5 rounded-lg transition ${
                                  student.is_active
                                    ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                    : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={student.is_active ? 'Deactivate student' : 'Activate student'}
                                aria-label={student.is_active ? 'Deactivate student' : 'Activate student'}
                              >
                                {student.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {students.map((student) => {
              const classInfo = getStudentClassInfo(student);
              return (
                <Card key={student.id} className="p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 font-heading">{student.name}</h4>
                      <span className="font-mono text-xs text-indigo-600 font-medium">{student.roll_number}</span>
                    </div>
                    <Badge variant={student.is_active ? 'success' : 'error'} withDot>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-mono text-[11px] text-slate-500 truncate">{student.email}</p>
                    <p className="font-medium text-slate-700">
                      {student.department} &bull; Sem {student.semester} &bull; Sec {student.section}
                    </p>
                    <div className="pt-1 flex items-center gap-1.5">
                      <span className="text-slate-400 font-semibold">Class:</span>
                      {classInfo ? (
                        <span className="font-medium text-indigo-700">{classInfo}</span>
                      ) : (
                        <Badge variant="neutral" className="text-[10px]">
                          Not Assigned
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAssignClassModal(student)}
                      leftIcon={<Link2 className="w-3.5 h-3.5" />}
                      className="min-h-[40px]"
                    >
                      Assign Class
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(student)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      className="min-h-[40px]"
                    >
                      Edit
                    </Button>
                    <Button
                      variant={student.is_active ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => setStatusTargetStudent(student)}
                      leftIcon={student.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      className={student.is_active ? 'text-rose-600 hover:bg-rose-50 min-h-[40px]' : 'min-h-[40px]'}
                    >
                      {student.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Assign Class Modal */}
      {assignClassStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-heading">Assign Student to Class</h3>
              </div>
              <button
                onClick={() => setAssignClassStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
              <span className="text-slate-500 font-semibold">Student:</span>
              <p className="text-slate-900 font-bold font-heading">{assignClassStudent.name} ({assignClassStudent.roll_number})</p>
            </div>

            {assignError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            <form onSubmit={handleAssignClassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Academic Class
                </label>
                <select
                  className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">-- Not Assigned (Unassign from Class) --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} — Sem {cls.semester} — Sec {cls.section} ({cls.academic_year})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setAssignClassStudent(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={assignLoading}>
                  Save Class Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-heading">Register New Student</h3>
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
                placeholder="e.g. John Doe"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="student@example.com"
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
                  label="Roll Number"
                  placeholder="e.g. CS2026-001"
                  value={addForm.roll_number}
                  onChange={(e) => setAddForm({ ...addForm, roll_number: e.target.value })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Semester
                  </label>
                  <select
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
                  label="Section"
                  placeholder="e.g. A"
                  value={addForm.section}
                  onChange={(e) => setAddForm({ ...addForm, section: e.target.value })}
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={addLoading}>
                  Create Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-heading">Edit Student Profile</h3>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
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
                  label="Roll Number"
                  value={editForm.roll_number}
                  onChange={(e) => setEditForm({ ...editForm, roll_number: e.target.value })}
                  required
                />
                <Input
                  label="Department"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Semester
                  </label>
                  <select
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
                  label="Section"
                  value={editForm.section}
                  onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setEditingStudent(null)}>
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
      {statusTargetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-center">
            <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
              statusTargetStudent.is_active ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {statusTargetStudent.is_active ? <UserX className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                {statusTargetStudent.is_active ? 'Deactivate this student?' : 'Re-activate this student?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {statusTargetStudent.is_active
                  ? `Student ${statusTargetStudent.name} (${statusTargetStudent.roll_number}) will no longer be able to log in.`
                  : `Student ${statusTargetStudent.name} will be able to log in to their student portal.`}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2.5">
              <Button variant="outline" onClick={() => setStatusTargetStudent(null)}>
                Cancel
              </Button>
              <Button
                variant={statusTargetStudent.is_active ? 'danger' : 'primary'}
                isLoading={statusLoading}
                onClick={handleConfirmToggleStatus}
              >
                {statusTargetStudent.is_active ? 'Deactivate Account' : 'Activate Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

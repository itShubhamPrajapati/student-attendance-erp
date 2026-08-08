export type UserRole = 'admin' | 'teacher' | 'student';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  message: string;
  database: 'connected' | 'disconnected' | 'unavailable';
}

export interface ConnectionState {
  backendConnected: boolean;
  databaseConnected: boolean;
  loading: boolean;
  lastChecked: Date | null;
  error?: string;
}

export interface NavItem {
  name: string;
  path: string;
  iconName: string;
  badge?: string;
  roles?: UserRole[];
}

// Architecture Types Prepared for Future Phases
export interface UserPlaceholder {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface StudentPlaceholder {
  id: number;
  rollNumber: string;
  name: string;
  className: string;
  attendancePercentage: number;
}

export interface ClassPlaceholder {
  id: number;
  name: string;
  section: string;
  department: string;
  totalStudents: number;
}

export interface AttendanceSessionPlaceholder {
  id: number;
  className: string;
  subjectName: string;
  teacherName: string;
  sessionCode: string;
  isActive: boolean;
  startTime: string;
  totalPresent: number;
}

import { v4 as uuidv4 } from 'uuid';

export type Role = 'user' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'denied';

export interface AppUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: Role;
  approvalStatus: ApprovalStatus;
  createdAt: string;
}

export interface AppAuditLog {
  id: string;
  adminUserId: string;
  action: 'user_approved' | 'user_denied';
  targetUserId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AppReport {
  id: string;
  userId: string;
  address: string;
  city: string;
  state: string;
  county: string;
  zip: string;
  estimatedArv: number;
  upsetPrice: number;
  myArv: number;
  starRating: number;
  createdAt: string;
  customFields: Array<{ key: string; value: string }>;
  details: Record<string, unknown>;
}

const USERS_KEY = 'pi_users';
const REPORTS_KEY = 'pi_reports';
const SESSION_KEY = 'pi_session';
const AUDIT_LOG_KEY = 'pi_admin_audit_log';

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
function write<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); }

export function seed() {
  const users = read<AppUser[]>(USERS_KEY, []);
  if (users.length) return;
  const admin: AppUser = { id: uuidv4(), email: 'admin@propertyintel.app', password: 'admin123', fullName: 'Admin', role: 'admin', approvalStatus: 'approved', createdAt: new Date().toISOString() };
  const demo: AppUser = { id: uuidv4(), email: 'demo@propertyintel.app', password: 'demo12345', fullName: 'Demo User', role: 'user', approvalStatus: 'approved', createdAt: new Date().toISOString() };
  write(USERS_KEY, [admin, demo]);
}

export const db = {
  signUp(email: string, password: string, fullName: string) {
    const users = read<AppUser[]>(USERS_KEY, []);
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new Error('Email already exists.');
    const user: AppUser = { id: uuidv4(), email, password, fullName, role: 'user', approvalStatus: 'pending', createdAt: new Date().toISOString() };
    write(USERS_KEY, [...users, user]);
    return user;
  },
  login(email: string, password: string) {
    const users = read<AppUser[]>(USERS_KEY, []);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) throw new Error('Invalid email or password.');
    write(SESSION_KEY, user.id);
    return user;
  },
  logout() { localStorage.removeItem(SESSION_KEY); },
  session() {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return read<AppUser[]>(USERS_KEY, []).find((u) => u.id === id) ?? null;
  },
  listUsers() { return read<AppUser[]>(USERS_KEY, []); },
  updateUser(user: AppUser) {
    write(USERS_KEY, read<AppUser[]>(USERS_KEY, []).map((u) => (u.id === user.id ? user : u)));
  },

  listAuditLogs() {
    return read<AppAuditLog[]>(AUDIT_LOG_KEY, []);
  },
  addAuditLog(log: Omit<AppAuditLog, 'id' | 'createdAt'>) {
    const full: AppAuditLog = { ...log, id: uuidv4(), createdAt: new Date().toISOString() };
    write(AUDIT_LOG_KEY, [full, ...read<AppAuditLog[]>(AUDIT_LOG_KEY, [])]);
    return full;
  },
  saveReport(report: Omit<AppReport, 'id' | 'createdAt'>) {
    const full: AppReport = { ...report, id: uuidv4(), createdAt: new Date().toISOString() };
    write(REPORTS_KEY, [full, ...read<AppReport[]>(REPORTS_KEY, [])]);
    return full;
  },
  listReports(user: AppUser) {
    const all = read<AppReport[]>(REPORTS_KEY, []);
    return user.role === 'admin' ? all : all.filter((r) => r.userId === user.id);
  },
  getReport(id: string) { return read<AppReport[]>(REPORTS_KEY, []).find((r) => r.id === id) ?? null; },
  updateReport(report: AppReport) {
    write(REPORTS_KEY, read<AppReport[]>(REPORTS_KEY, []).map((r) => (r.id === report.id ? report : r)));
  },
  deleteReport(reportId: string, actor: AppUser) {
    const reports = read<AppReport[]>(REPORTS_KEY, []);
    const target = reports.find((r) => r.id === reportId);
    if (!target) return;
    if (actor.role !== 'admin' && target.userId !== actor.id) throw new Error('Unauthorized delete attempt.');
    write(REPORTS_KEY, reports.filter((r) => r.id !== reportId));
  }
};

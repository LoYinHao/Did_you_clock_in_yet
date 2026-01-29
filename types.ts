export enum PermissionLevel {
  VIEW_SELF = 'VIEW_SELF', // 僅看自己資料
  VIEW_ALL = 'VIEW_ALL',   // 可以觀看全部人員資料
  ADMIN = 'ADMIN'          // 最高權限
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  permission: PermissionLevel;
  lastLogin?: number; // Timestamp
  isActive: boolean;  // Account status
}

export enum AttendanceType {
  CLOCK_IN = '上班',
  CLOCK_OUT = '下班'
}

export enum RecordStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR' // For duplicate attempts or system errors
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  type: AttendanceType;
  timestamp: number; // Unix timestamp
  dateStr: string;   // YYYY-MM-DD for easy querying
  status: RecordStatus;
  errorMessage?: string; // If status is ERROR
}

// For the mock service to simulate sheet rows
export interface GoogleSheetRow {
  [key: string]: string | number;
}
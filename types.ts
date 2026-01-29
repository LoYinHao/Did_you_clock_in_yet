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
  dateStr: string;   // YYYY-MM-DD

  // 上班資訊
  startTime?: string;       // 格式化時間 (e.g., 14:30:05)
  systemStartTime?: number; // 系統時間戳
  startLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  // 下班資訊
  endTime?: string;         // 格式化時間
  systemEndTime?: number;   // 系統時間戳
  endLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  totalMinutes?: number;    // 本日上班總分鐘
  status: RecordStatus;
  errorMessage?: string;    // If status is ERROR
}

export interface SystemLog {
  id: string;
  userName: string;
  timestamp: number;
  action: string;    // "Login", "Logout", "Clock In", "Clock Out", "User Management"
  details: string;   // JSON string or description
}

// For the mock service to simulate sheet rows
export interface GoogleSheetRow {
  [key: string]: string | number;
}
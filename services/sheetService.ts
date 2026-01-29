import { User, PermissionLevel, AttendanceRecord, AttendanceType, RecordStatus } from '../types';

/**
 * SIMULATED BACKEND / GOOGLE SHEETS INTEGRATION
 */

const STORAGE_KEY_RECORDS = 'hl_attendance_records';
const STORAGE_KEY_USERS = 'hl_users_list';

// Initial mock personnel list
const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: '王小明',
    email: 'user@haoliang.com',
    phone: '0912-345-678',
    address: '台北市信義區信義路五段7號',
    permission: PermissionLevel.VIEW_SELF,
    isActive: true,
    lastLogin: Date.now() - 86400000
  },
  {
    id: 'u2',
    name: '李經理',
    email: 'manager@haoliang.com',
    phone: '0988-765-432',
    address: '新北市板橋區新站路28號',
    permission: PermissionLevel.VIEW_ALL,
    isActive: true,
    lastLogin: Date.now() - 43200000
  },
  {
    id: 'u3',
    name: '羅英豪',
    email: 'admin@haoliang.com',
    phone: '0900-111-222',
    address: '豪亮科技有限公司總部',
    permission: PermissionLevel.ADMIN,
    isActive: true,
    lastLogin: Date.now()
  }
];

// Helper to get users from storage or init
const getUsersFromStorage = (): User[] => {
  const stored = localStorage.getItem(STORAGE_KEY_USERS);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize if empty
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
};

const saveUsersToStorage = (users: User[]) => {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
};

export const SheetService = {
  // --- SYSTEM DATA MANAGEMENT (IMPORT/EXPORT) ---
  
  exportAllData: async (): Promise<string> => {
    // Pack users and records into a single JSON string
    const users = getUsersFromStorage();
    const recordsRaw = localStorage.getItem(STORAGE_KEY_RECORDS);
    const records = recordsRaw ? JSON.parse(recordsRaw) : [];
    
    const backupData = {
      timestamp: Date.now(),
      users: users,
      records: records
    };
    
    return JSON.stringify(backupData, null, 2);
  },

  importAllData: async (jsonString: string): Promise<void> => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.users || !Array.isArray(data.users)) {
        throw new Error('無效的資料格式：缺少使用者資料');
      }
      
      // Save to local storage
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(data.users));
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(data.records || []));
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      throw new Error('匯入失敗：檔案格式錯誤');
    }
  },

  // --- USER MANAGEMENT ---

  getAllUsers: async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return getUsersFromStorage();
  },

  addUser: async (newUser: Omit<User, 'id'>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const users = getUsersFromStorage();
    
    // Check duplicate email
    if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      throw new Error('此 Email 已經存在');
    }

    const user: User = {
      ...newUser,
      id: 'u' + Date.now().toString()
    };
    users.push(user);
    saveUsersToStorage(users);
    return user;
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const users = getUsersFromStorage();
    const index = users.findIndex(u => u.id === updatedUser.id);
    
    if (index === -1) throw new Error('找不到使用者');

    // Check email uniqueness if email changed
    const duplicate = users.find(u => u.email.toLowerCase() === updatedUser.email.toLowerCase() && u.id !== updatedUser.id);
    if (duplicate) throw new Error('此 Email 已經被其他使用者使用');

    users[index] = updatedUser;
    saveUsersToStorage(users);
    return updatedUser;
  },

  // --- AUTH ---

  checkUserExists: async (email: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const users = getUsersFromStorage();
    const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (index !== -1) {
      const user = users[index];
      if (!user.isActive) {
        // User exists but is inactive
        return null;
      }
      // Update Last Login
      user.lastLogin = Date.now();
      users[index] = user;
      saveUsersToStorage(users);
      
      return user;
    }
    return null;
  },

  // --- ATTENDANCE RECORDS ---

  getRecords: async (startDate: string, endDate: string, currentUser: User, targetUserId?: string): Promise<AttendanceRecord[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const rawData = localStorage.getItem(STORAGE_KEY_RECORDS);
    const allRecords: AttendanceRecord[] = rawData ? JSON.parse(rawData) : [];

    // Filter by Date Range
    let filtered = allRecords.filter(r => {
      return r.dateStr >= startDate && r.dateStr <= endDate;
    });

    // Permission Logic
    if (currentUser.permission === PermissionLevel.VIEW_SELF) {
      // Regular user: Can ONLY see own data
      filtered = filtered.filter(r => r.userId === currentUser.id);
    } else {
      // Admin or View All:
      // If a specific target user is selected, filter by that.
      // Otherwise show all.
      if (targetUserId) {
        filtered = filtered.filter(r => r.userId === targetUserId);
      }
    }

    // Sort by timestamp desc
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  },

  clockInOrOut: async (user: User, type: AttendanceType, dateStr: string, timestamp: number): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const rawData = localStorage.getItem(STORAGE_KEY_RECORDS);
    const allRecords: AttendanceRecord[] = rawData ? JSON.parse(rawData) : [];

    // Check duplicate
    const existing = allRecords.find(r => 
      r.userId === user.id && 
      r.dateStr === dateStr && 
      r.type === type && 
      r.status === RecordStatus.SUCCESS
    );

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      type: type,
      timestamp: timestamp,
      dateStr: dateStr,
      status: existing ? RecordStatus.ERROR : RecordStatus.SUCCESS,
      errorMessage: existing ? `重複打卡: ${dateStr} 已經${type}過` : undefined
    };

    allRecords.push(newRecord);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(allRecords));

    if (existing) {
      return { success: false, message: `錯誤：您今日 (${dateStr}) 已經完成${type}。系統已記錄此錯誤操作。` };
    }

    return { success: true, message: `${type}成功！時間：${new Date(timestamp).toLocaleTimeString()}` };
  },

  updateRecord: async (record: AttendanceRecord): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const rawData = localStorage.getItem(STORAGE_KEY_RECORDS);
    let allRecords: AttendanceRecord[] = rawData ? JSON.parse(rawData) : [];
    
    const index = allRecords.findIndex(r => r.id === record.id);
    if (index !== -1) {
      allRecords[index] = record;
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(allRecords));
    } else {
      throw new Error("Record not found");
    }
  }
};
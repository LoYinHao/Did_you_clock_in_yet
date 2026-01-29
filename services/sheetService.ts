import { ref, get, set, child, update } from "firebase/database";
import { db } from './firebase';
import { User, PermissionLevel, AttendanceRecord, AttendanceType, RecordStatus } from '../types';

/**
 * FIREBASE REALTIME DATABASE INTEGRATION
 */

const DB_PATH_RECORDS = 'records';
const DB_PATH_USERS = 'users';

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

// Helper to convert Firebase object/map to array
const mapToArray = <T>(map: any): T[] => {
  if (!map) return [];
  // Ensure we filter out any null/undefined entries that might exist in Firebase
  const values = Array.isArray(map) ? map : Object.values(map);
  return values.filter(Boolean) as T[];
};

// Helper to get users from Firebase
const getUsersFromFirebase = async (): Promise<User[]> => {
  try {
    const dbRef = ref(db);
    console.log("Fetching users from path:", DB_PATH_USERS);
    const snapshot = await get(child(dbRef, DB_PATH_USERS));

    if (snapshot.exists()) {
      const rawData = snapshot.val();
      const data = mapToArray<User>(rawData);
      console.log("Firebase Users Data Received:", rawData);

      // Silent Migration: If Firebase returned an array or the keys don't match IDs,
      // rewrite it as a map with ID keys. This prevents "editing becomes adding" issue.
      const isArray = Array.isArray(rawData);
      const isIncorrectKeys = !isArray && Object.keys(rawData).some(key => {
        const u = rawData[key];
        return u && u.id && key !== u.id;
      });

      if (isArray || isIncorrectKeys) {
        console.log("Detecting old data structure, performing silent migration...");
        const correctedMap: any = {};
        data.forEach(u => u && u.id && (correctedMap[u.id] = u));
        await set(ref(db, DB_PATH_USERS), correctedMap);
        console.log("Migration complete.");
      }

      console.log("Firebase Users Mapped:", data);

      if (data.length === 0) {
        console.log("Database node exists but is empty. Re-initializing...");
        const initialUsersMap: any = {};
        INITIAL_USERS.forEach(u => u && (initialUsersMap[u.id] = u));
        await set(ref(db, DB_PATH_USERS), initialUsersMap);
        return INITIAL_USERS;
      }
      return data;
    }

    console.log("Firebase Users node does not exist, initializing...");
    const initialUsersMap: any = {};
    INITIAL_USERS.forEach(u => u && (initialUsersMap[u.id] = u));
    await set(ref(db, DB_PATH_USERS), initialUsersMap);
    return INITIAL_USERS;
  } catch (err: any) {
    console.error("Firebase Critical Error:", err);
    if (err.message && err.message.includes("permission_denied")) {
      alert("Firebase 權限不足！請確認 Rules 已經設為 true。");
    }
    throw err;
  }
};

export const SheetService = {
  // --- SYSTEM DATA MANAGEMENT (IMPORT/EXPORT) ---

  exportAllData: async (): Promise<string> => {
    const dbRef = ref(db);
    const snapshot = await get(dbRef);
    const data = snapshot.exists() ? snapshot.val() : { users: {}, records: {} };

    const backupData = {
      timestamp: Date.now(),
      users: mapToArray<User>(data.users),
      records: mapToArray<AttendanceRecord>(data.records)
    };

    return JSON.stringify(backupData, null, 2);
  },

  importAllData: async (jsonString: string): Promise<void> => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.users || !Array.isArray(data.users)) {
        throw new Error('無效的資料格式：缺少使用者資料');
      }

      const usersMap: any = {};
      data.users.forEach((u: User) => u && u.id && (usersMap[u.id] = u));

      const recordsMap: any = {};
      (data.records || []).forEach((r: AttendanceRecord) => r && r.id && (recordsMap[r.id] = r));

      await set(ref(db, DB_PATH_USERS), usersMap);
      await set(ref(db, DB_PATH_RECORDS), recordsMap);
    } catch (e) {
      throw new Error('匯入失敗：檔案格式錯誤');
    }
  },

  // --- USER MANAGEMENT ---

  getAllUsers: async (): Promise<User[]> => {
    return getUsersFromFirebase();
  },

  addUser: async (newUser: Omit<User, 'id'>): Promise<User> => {
    const users = await getUsersFromFirebase();
    const newEmail = (newUser?.email || '').toLowerCase();

    if (users.some(u => u && (u.email || '').toLowerCase() === newEmail)) {
      throw new Error('此 Email 已經存在');
    }

    const id = 'u' + Date.now().toString();
    const user: User = { ...newUser, id };
    await set(ref(db, `${DB_PATH_USERS}/${id}`), user);
    return user;
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    console.log("Updating user:", updatedUser);
    const users = await getUsersFromFirebase();
    const exists = users.some(u => u?.id === updatedUser.id);
    if (!exists) throw new Error('找不到使用者');

    const updatedEmail = (updatedUser?.email || '').toLowerCase();
    const duplicate = users.find(u =>
      u && (u.email || '').toLowerCase() === updatedEmail && u.id !== updatedUser.id
    );
    if (duplicate) throw new Error('此 Email 已經被其他使用者使用');

    await set(ref(db, `${DB_PATH_USERS}/${updatedUser.id}`), updatedUser);
    return updatedUser;
  },

  deleteUser: async (userId: string): Promise<void> => {
    if (!userId) return;
    await set(ref(db, `${DB_PATH_USERS}/${userId}`), null);
  },

  // --- AUTH ---

  checkUserExists: async (email: string): Promise<User | null> => {
    const users = await getUsersFromFirebase();
    const searchEmail = (email || '').toLowerCase();
    const user = users.find(u => u && (u.email || '').toLowerCase() === searchEmail);
    if (user) {
      if (!user.isActive) return null;
      const lastLogin = Date.now();
      await update(ref(db, `${DB_PATH_USERS}/${user.id}`), { lastLogin });
      return { ...user, lastLogin };
    }
    return null;
  },

  // --- ATTENDANCE RECORDS ---

  getRecords: async (startDate: string, endDate: string, currentUser: User, targetUserId?: string): Promise<AttendanceRecord[]> => {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, DB_PATH_RECORDS));
    const allRecords: AttendanceRecord[] = mapToArray<AttendanceRecord>(snapshot.exists() ? snapshot.val() : {});

    let filtered = allRecords.filter(r => r && r.dateStr >= startDate && r.dateStr <= endDate);
    if (currentUser?.permission === PermissionLevel.VIEW_SELF) {
      filtered = filtered.filter(r => r && r.userId === currentUser.id);
    } else if (targetUserId) {
      filtered = filtered.filter(r => r && r.userId === targetUserId);
    }

    return filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  },

  clockInOrOut: async (user: User, type: AttendanceType, dateStr: string, timestamp: number): Promise<{ success: boolean; message: string }> => {
    const records = await SheetService.getRecords(dateStr, dateStr, user);
    const existing = records.find(r => r && r.type === type && r.status === RecordStatus.SUCCESS);

    const recordId = Date.now().toString();
    const newRecord: AttendanceRecord = {
      id: recordId,
      userId: user.id || '',
      userName: user.name || '',
      type: type,
      timestamp: timestamp,
      dateStr: dateStr,
      status: existing ? RecordStatus.ERROR : RecordStatus.SUCCESS,
      errorMessage: existing ? `重複打卡: ${dateStr} 已經${type}過` : undefined
    };

    await set(ref(db, `${DB_PATH_RECORDS}/${recordId}`), newRecord);
    if (existing) {
      return { success: false, message: `錯誤：您今日 (${dateStr}) 已經完成${type}。系統已記錄此錯誤操作。` };
    }
    return { success: true, message: `${type}成功！時間：${new Date(timestamp).toLocaleTimeString()}` };
  },

  updateRecord: async (record: AttendanceRecord): Promise<void> => {
    if (!record?.id) return;
    await set(ref(db, `${DB_PATH_RECORDS}/${record.id}`), record);
  },

  resetDatabase: async (): Promise<void> => {
    try {
      console.log("Forcing database reset...");
      const initialUsersMap: any = {};
      INITIAL_USERS.forEach(u => u && (initialUsersMap[u.id] = u));
      await set(ref(db, DB_PATH_USERS), initialUsersMap);
      await set(ref(db, DB_PATH_RECORDS), {});
    } catch (err) {
      console.error("Reset Database failed:", err);
      throw err;
    }
  }
};

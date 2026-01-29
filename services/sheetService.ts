import { ref, get, set, child, update, push } from "firebase/database";
import { db } from './firebase';
import { User, PermissionLevel, AttendanceRecord, AttendanceType, RecordStatus, SystemLog } from '../types';

/**
 * FIREBASE REALTIME DATABASE INTEGRATION
 */

const DB_PATH_RECORDS = 'records';
const DB_PATH_USERS = 'users';
const DB_PATH_LOGS = 'system_logs';

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
  const values = Array.isArray(map) ? map : Object.values(map);
  return values.filter(Boolean) as T[];
};

// Helper to get users from Firebase
const getUsersFromFirebase = async (): Promise<User[]> => {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, DB_PATH_USERS));

    if (snapshot.exists()) {
      const rawData = snapshot.val();
      const data = mapToArray<User>(rawData);

      const isArray = Array.isArray(rawData);
      const isIncorrectKeys = !isArray && Object.keys(rawData).some(key => {
        const u = rawData[key];
        return u && u.id && key !== u.id;
      });

      if (isArray || isIncorrectKeys) {
        const correctedMap: any = {};
        data.forEach(u => u && u.id && (correctedMap[u.id] = u));
        await set(ref(db, DB_PATH_USERS), correctedMap);
      }

      if (data.length === 0) {
        const initialUsersMap: any = {};
        INITIAL_USERS.forEach(u => u && (initialUsersMap[u.id] = u));
        await set(ref(db, DB_PATH_USERS), initialUsersMap);
        return INITIAL_USERS;
      }
      return data;
    }

    const initialUsersMap: any = {};
    INITIAL_USERS.forEach(u => u && (initialUsersMap[u.id] = u));
    await set(ref(db, DB_PATH_USERS), initialUsersMap);
    return INITIAL_USERS;
  } catch (err: any) {
    console.error("Firebase Critical Error:", err);
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

  // --- SYSTEM LOGS ---

  addLog: async (userName: string, action: string, details: string): Promise<void> => {
    const logId = push(child(ref(db), DB_PATH_LOGS)).key || Date.now().toString();
    const log: SystemLog = {
      id: logId,
      userName,
      timestamp: Date.now(),
      action,
      details
    };
    await set(ref(db, `${DB_PATH_LOGS}/${logId}`), log);
  },

  getLogs: async (startDate: string, endDate: string, userName?: string): Promise<SystemLog[]> => {
    const snapshot = await get(child(ref(db), DB_PATH_LOGS));
    let logs = mapToArray<SystemLog>(snapshot.exists() ? snapshot.val() : {});

    const startTs = new Date(startDate).getTime();
    const endTs = new Date(endDate).getTime() + 86399999;

    logs = logs.filter(l => l.timestamp >= startTs && l.timestamp <= endTs);
    if (userName) {
      logs = logs.filter(l => l.userName.includes(userName));
    }
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  },

  // --- USER MANAGEMENT ---

  getAllUsers: async (): Promise<User[]> => {
    return getUsersFromFirebase();
  },

  addUser: async (newUser: Omit<User, 'id'>, adminName: string): Promise<User> => {
    const users = await getUsersFromFirebase();
    const newEmail = (newUser?.email || '').toLowerCase();

    if (users.some(u => u && (u.email || '').toLowerCase() === newEmail)) {
      throw new Error('此 Email 已經存在');
    }

    const id = 'u' + Date.now().toString();
    const user: User = { ...newUser, id };
    await set(ref(db, `${DB_PATH_USERS}/${id}`), user);
    await SheetService.addLog(adminName, "新增使用者", `姓名: ${user.name}, Email: ${user.email}`);
    return user;
  },

  updateUser: async (updatedUser: User, adminName: string): Promise<User> => {
    const users = await getUsersFromFirebase();
    const exists = users.some(u => u?.id === updatedUser.id);
    if (!exists) throw new Error('找不到使用者');

    await set(ref(db, `${DB_PATH_USERS}/${updatedUser.id}`), updatedUser);
    await SheetService.addLog(adminName, "更新使用者", `姓名: ${updatedUser.name}`);
    return updatedUser;
  },

  deleteUser: async (userId: string, adminName: string): Promise<void> => {
    if (!userId) return;
    const users = await getUsersFromFirebase();
    const target = users.find(u => u.id === userId);
    await set(ref(db, `${DB_PATH_USERS}/${userId}`), null);
    await SheetService.addLog(adminName, "刪除使用者", `姓名: ${target?.name || '未知'}`);
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
      await SheetService.addLog(user.name, "登入", "系統登入成功");
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

    return filtered.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  },

  clockInOrOut: async (
    user: User,
    type: AttendanceType,
    dateStr: string,
    location?: { latitude: number; longitude: number; address?: string }
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, DB_PATH_RECORDS));
      const allRecords: any = snapshot.exists() ? snapshot.val() : {};

      // Find if user already has a record for this date
      let existingRecordId = Object.keys(allRecords).find(key =>
        allRecords[key].userId === user.id && allRecords[key].dateStr === dateStr
      );

      const now = new Date();
      const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false });
      const timestamp = now.getTime();

      if (type === AttendanceType.CLOCK_IN) {
        if (existingRecordId && allRecords[existingRecordId].startTime) {
          return { success: false, message: `今日 (${dateStr}) 已有上班打卡紀錄，不可重複打卡。` };
        }

        const recordId = existingRecordId || push(child(ref(db), DB_PATH_RECORDS)).key || Date.now().toString();
        const newRecord: AttendanceRecord = {
          ...(existingRecordId ? allRecords[existingRecordId] : {}),
          id: recordId,
          userId: user.id,
          userName: user.name,
          dateStr,
          startTime: timeStr,
          systemStartTime: timestamp,
          startLocation: location,
          status: RecordStatus.SUCCESS
        };

        await set(ref(db, `${DB_PATH_RECORDS}/${recordId}`), newRecord);
        await SheetService.addLog(user.name, "上班打卡", `日期: ${dateStr}, 時間: ${timeStr}`);
        return { success: true, message: `上班打卡成功！時間：${timeStr}` };

      } else {
        // CLOCK_OUT
        if (!existingRecordId) {
          return { success: false, message: `今日 (${dateStr}) 尚未有上班打卡紀錄，請先進行上班打卡。` };
        }

        const record = allRecords[existingRecordId];
        if (record.endTime) {
          return { success: false, message: `今日 (${dateStr}) 已完成下班打卡，不可重複。` };
        }

        // Calculate total minutes
        let totalMinutes = 0;
        if (record.systemStartTime) {
          totalMinutes = Math.round((timestamp - record.systemStartTime) / (1000 * 60));
        }

        const updatedRecord: AttendanceRecord = {
          ...record,
          endTime: timeStr,
          systemEndTime: timestamp,
          endLocation: location,
          totalMinutes: totalMinutes
        };

        await set(ref(db, `${DB_PATH_RECORDS}/${existingRecordId}`), updatedRecord);
        await SheetService.addLog(user.name, "下班打卡", `日期: ${dateStr}, 時間: ${timeStr}, 總時數: ${totalMinutes}分鐘`);
        return { success: true, message: `下班打卡成功！時間：${timeStr} (總時數: ${totalMinutes}分鐘)` };
      }
    } catch (err: any) {
      console.error("Firebase clock operation failed:", err);
      throw new Error(err.message || "資料庫寫入失敗");
    }
  },

  updateRecord: async (record: AttendanceRecord, adminName: string): Promise<void> => {
    if (!record?.id) return;
    await set(ref(db, `${DB_PATH_RECORDS}/${record.id}`), record);
    await SheetService.addLog(adminName, "修改打卡紀錄", `ID: ${record.id}, 姓名: ${record.userName}`);
  },

  resetDatabase: async (): Promise<void> => {
    try {
      const initialUsersMap: any = {};
      INITIAL_USERS.forEach(u => u && (initialUsersMap[u.id] = u));
      await set(ref(db, DB_PATH_USERS), initialUsersMap);
      await set(ref(db, DB_PATH_RECORDS), {});
      await set(ref(db, DB_PATH_LOGS), {});
    } catch (err) {
      console.error("Reset Database failed:", err);
      throw err;
    }
  }
};

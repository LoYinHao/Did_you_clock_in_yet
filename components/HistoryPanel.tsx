import React, { useState, useEffect } from 'react';
import { User, AttendanceRecord, RecordStatus, PermissionLevel, AttendanceType } from '../types';
import { SheetService } from '../services/sheetService';
import { Search, ChevronLeft, ChevronRight, AlertCircle, FileSpreadsheet, Download, Edit2, MapPin } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface HistoryPanelProps {
  user: User;
}

const ITEMS_PER_PAGE = 15;

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ user }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]); // List for dropdown

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Editing State
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  const canViewAll = user.permission === PermissionLevel.ADMIN || user.permission === PermissionLevel.VIEW_ALL;

  // Load Users for Dropdown
  useEffect(() => {
    if (canViewAll) {
      SheetService.getAllUsers().then(setUsers);
    }
  }, [canViewAll]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const targetId = canViewAll ? selectedUserId : user.id;
      const data = await SheetService.getRecords(startDate, endDate, user, targetId);
      setRecords(data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch records", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Attendance Report (${startDate} ~ ${endDate})`, 14, 22);

    const tableData = records.map(r => [
      r.userName,
      r.dateStr,
      r.startTime || '-',
      r.endTime || '-',
      r.totalMinutes ? `${r.totalMinutes} m` : '-',
      r.status === RecordStatus.SUCCESS ? 'OK' : 'Error'
    ]);

    (doc as any).autoTable({
      head: [['Name', 'Date', 'Clock In', 'Clock Out', 'Duration', 'Status']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 10 },
      theme: 'grid',
    });

    doc.save(`attendance_${startDate}_${endDate}.pdf`);
  };

  const handleEditClick = (record: AttendanceRecord) => {
    setEditingRecord({ ...record });
  };

  const handleEditSave = async () => {
    if (!editingRecord) return;
    try {
      await SheetService.updateRecord(editingRecord, user.name);
      setEditingRecord(null);
      fetchRecords();
    } catch (e) {
      alert("Update failed");
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(records.length / ITEMS_PER_PAGE);
  const displayedRecords = records.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 h-full flex flex-col relative">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">打卡紀錄查詢</h2>
          <p className="text-slate-500 text-sm mt-1">
            {canViewAll ? '可查詢全員資料並進行管理' : '查詢個人起訖時間內的上下班時數'}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
          {canViewAll && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">人員篩選</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="border-slate-300 rounded-md text-sm py-1.5 w-32 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">全部人員</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-500 mb-1">開始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-slate-300 rounded-md text-sm py-1.5 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="pb-2 text-slate-400">-</div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">結束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-slate-300 rounded-md text-sm py-1.5 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={fetchRecords}
            disabled={loading}
            className="ml-2 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            title="搜尋"
          >
            <Search className="w-5 h-5" />
          </button>

          {canViewAll && (
            <button
              onClick={handleDownloadPDF}
              className="ml-1 bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition-colors"
              title="下載 PDF"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white border border-slate-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">姓名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">日期</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">上班時間</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">下班時間</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">總時數</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">位置</th>
              {canViewAll && <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">管理</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">載入中...</td></tr>
            ) : displayedRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center flex flex-col items-center justify-center text-slate-400">
                  <FileSpreadsheet className="w-12 h-12 mb-2 opacity-20" />
                  <p>查無資料</p>
                </td>
              </tr>
            ) : (
              displayedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{record.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{record.dateStr}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{record.startTime || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{record.endTime || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 font-bold">
                    {record.totalMinutes ? `${record.totalMinutes} 分鐘` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {record.startLocation && (
                        <a
                          href={`https://www.google.com/maps?q=${record.startLocation.latitude},${record.startLocation.longitude}`}
                          target="_blank" rel="noreferrer"
                          className="text-blue-500 hover:text-blue-700" title="上班位置"
                        >
                          <MapPin className="w-4 h-4" />
                        </a>
                      )}
                      {record.endLocation && (
                        <a
                          href={`https://www.google.com/maps?q=${record.endLocation.latitude},${record.endLocation.longitude}`}
                          target="_blank" rel="noreferrer"
                          className="text-orange-500 hover:text-orange-700" title="下班位置"
                        >
                          <MapPin className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                  {canViewAll && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEditClick(record)} className="text-blue-600 hover:text-blue-900">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4">
          <div className="text-sm text-slate-500">
            {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, records.length)} / {records.length}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal (Simplified for new structure) */}
      {editingRecord && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
            <h3 className="text-lg font-bold mb-4">修改打卡時間 (ID: {editingRecord.id})</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">上班時間 (HH:mm:ss)</label>
                <input
                  type="text"
                  value={editingRecord.startTime || ''}
                  onChange={e => setEditingUser({ ...editingRecord, startTime: e.target.value })}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">下班時間 (HH:mm:ss)</label>
                <input
                  type="text"
                  value={editingRecord.endTime || ''}
                  onChange={e => setEditingUser({ ...editingRecord, endTime: e.target.value })}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditingRecord(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium">取消</button>
              <button onClick={handleEditSave} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium">儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
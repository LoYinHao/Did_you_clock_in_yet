import React, { useState, useEffect, useRef } from 'react';
import { User, PermissionLevel } from '../types';
import { SheetService } from '../services/sheetService';
import { Search, Plus, Download, Edit2, UserCheck, UserX, Loader2, Database, Upload } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const UserManagementPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await SheetService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('User List', 14, 22);

    const tableData = users.map(u => [
      u.name,
      u.email,
      u.phone,
      u.permission,
      u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'N/A',
      u.isActive ? 'Active' : 'Inactive'
    ]);

    (doc as any).autoTable({
      head: [['Name', 'Email', 'Phone', 'Role', 'Last Login', 'Status']],
      body: tableData,
      startY: 30,
    });

    doc.save('user_list.pdf');
  };

  // --- Backup / Restore ---
  
  const handleExportData = async () => {
    const dataStr = await SheetService.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `haoliang_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonStr = event.target?.result as string;
        await SheetService.importAllData(jsonStr);
        alert('資料庫還原成功！頁面將重新整理。');
        window.location.reload();
      } catch (err) {
        alert('匯入失敗，請確認檔案格式是否正確。');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // ---

  const handleAddClick = () => {
    setEditingUser({
      name: '', email: '', phone: '', address: '', 
      permission: PermissionLevel.VIEW_SELF, isActive: true
    });
    setModalMode('ADD');
    setIsModalOpen(true);
  };

  const handleEditClick = (user: User) => {
    setEditingUser({...user});
    setModalMode('EDIT');
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!editingUser.name || !editingUser.email) return;

    try {
      if (modalMode === 'ADD') {
        await SheetService.addUser(editingUser as User);
      } else {
        await SheetService.updateUser(editingUser as User);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Operation failed");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.includes(searchTerm) || u.email.includes(searchTerm)
  );

  return (
    <div className="p-6 h-full flex flex-col relative">
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">人員管理系統</h2>
        
        <div className="flex flex-wrap gap-2">
           {/* System Data Controls */}
          <div className="flex gap-2 mr-4 pr-4 border-r border-slate-200">
            <button 
              onClick={handleExportData}
              className="flex items-center gap-2 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 text-sm"
              title="下載目前所有資料 (JSON) 供編輯或備份"
            >
              <Database className="w-4 h-4" />
              備份/匯出資料
            </button>
            <button 
              onClick={handleImportClick}
              className="flex items-center gap-2 bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-200 text-sm"
              title="上傳編輯後的 JSON 檔案"
            >
              <Upload className="w-4 h-4" />
              還原/匯入資料
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json"
              onChange={handleFileChange}
            />
          </div>

          <button 
            onClick={handleAddClick}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            新增人員
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            匯出 PDF
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="搜尋姓名或 Email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white border border-slate-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">狀態</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">姓名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">電話</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">權限</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">最後登入</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
               <tr><td colSpan={7} className="text-center py-10"><Loader2 className="animate-spin mx-auto"/></td></tr>
            ) : (
              filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {u.isActive ? 
                      <span className="flex items-center text-green-600 text-xs font-bold"><UserCheck className="w-3 h-3 mr-1"/>啟用</span> : 
                      <span className="flex items-center text-slate-400 text-xs font-bold"><UserX className="w-3 h-3 mr-1"/>停用</span>
                    }
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                  <td className="px-6 py-4 text-slate-500">{u.email}</td>
                  <td className="px-6 py-4 text-slate-500">{u.phone}</td>
                  <td className="px-6 py-4 text-xs">
                    <span className={`px-2 py-1 rounded-full ${u.permission === 'ADMIN' ? 'bg-purple-100 text-purple-700' : u.permission === 'VIEW_ALL' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                      {u.permission}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEditClick(u)} className="text-blue-600 hover:text-blue-900">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
           <form onSubmit={handleSaveUser} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4 space-y-4 max-h-[90vh] overflow-y-auto">
             <h3 className="text-xl font-bold mb-4">{modalMode === 'ADD' ? '新增人員' : '編輯人員'}</h3>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700">姓名</label>
                 <input type="text" required className="w-full border rounded p-2 mt-1" 
                   value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700">Email (帳號)</label>
                 <input type="email" required className="w-full border rounded p-2 mt-1" 
                   value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
               </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700">電話</label>
               <input type="text" className="w-full border rounded p-2 mt-1" 
                 value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700">地址</label>
               <input type="text" className="w-full border rounded p-2 mt-1" 
                 value={editingUser.address} onChange={e => setEditingUser({...editingUser, address: e.target.value})} />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">權限</label>
                  <select className="w-full border rounded p-2 mt-1"
                    value={editingUser.permission} onChange={e => setEditingUser({...editingUser, permission: e.target.value as PermissionLevel})}
                  >
                    <option value={PermissionLevel.VIEW_SELF}>VIEW_SELF (僅自己)</option>
                    <option value={PermissionLevel.VIEW_ALL}>VIEW_ALL (看全員)</option>
                    <option value={PermissionLevel.ADMIN}>ADMIN (最高權限)</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" className="w-5 h-5"
                       checked={editingUser.isActive} 
                       onChange={e => setEditingUser({...editingUser, isActive: e.target.checked})} 
                     />
                     <span className="text-sm font-medium text-slate-700">啟用帳號</span>
                   </label>
                </div>
             </div>

             <div className="pt-4 flex justify-end gap-3">
               <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded hover:bg-slate-50">取消</button>
               <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">儲存</button>
             </div>
           </form>
        </div>
      )}
    </div>
  );
};
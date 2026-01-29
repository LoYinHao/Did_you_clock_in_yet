import React, { useState, useEffect } from 'react';
import { User, SystemLog } from '../types';
import { SheetService } from '../services/sheetService';
import { Search, Download, FileText, Loader2, Calendar } from 'lucide-react';

export const SystemLogPanel: React.FC = () => {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7); // Default 7 days
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [searchName, setSearchName] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await SheetService.getLogs(startDate, endDate, searchName);
            setLogs(data);
        } catch (e) {
            console.error("Failed to fetch logs", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDownloadCSV = () => {
        const headers = ['時間', '姓名', '動作', '詳細資訊'];
        const rows = logs.map(l => [
            new Date(l.timestamp).toLocaleString(),
            l.userName,
            l.action,
            l.details
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `system_logs_${startDate}_${endDate}.csv`;
        link.click();
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">系統資訊資料表</h2>
                    <p className="text-slate-500 text-sm mt-1">紀錄登入、改動、打卡等系統活動資訊</p>
                </div>

                <div className="flex flex-wrap items-end gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">姓名搜尋</label>
                        <input
                            type="text"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            placeholder="搜尋姓名..."
                            className="border-slate-300 rounded-md text-sm py-1.5 w-32 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">開始日期</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border-slate-300 rounded-md text-sm py-1.5 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
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
                        onClick={fetchLogs}
                        disabled={loading}
                        className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleDownloadCSV}
                        className="bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition-colors"
                        title="下載 CSV"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-white border border-slate-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">時間</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">姓名</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">動作</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">詳細資訊</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {loading ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">載入中...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                    <FileText className="w-12 h-12 mb-2 mx-auto opacity-20" />
                                    查無日誌資料
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{log.userName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${log.action === '登入' ? 'bg-blue-100 text-blue-700' :
                                                log.action.includes('打卡') ? 'bg-green-100 text-green-700' :
                                                    log.action.includes('刪除') ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{log.details}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

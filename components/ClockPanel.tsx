import React, { useState, useEffect } from 'react';
import { User, AttendanceType } from '../types';
import { SheetService } from '../services/sheetService';
import { Loader2, Briefcase, Home, CheckCircle, AlertOctagon, Clock } from 'lucide-react';

interface ClockPanelProps {
  user: User;
}

export const ClockPanel: React.FC<ClockPanelProps> = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState<'IN' | 'OUT' | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Initialize date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClock = async (type: AttendanceType) => {
    if (!selectedDate) {
      setMessage({ text: '請選擇日期', type: 'error' });
      return;
    }

    setLoading(type === AttendanceType.CLOCK_IN ? 'IN' : 'OUT');
    setMessage(null);

    try {
      // Use current time for the timestamp, but user-selected date for the record dateStr
      // This allows back-dating if policy allows, or strict checking. 
      // Prompt implies "Date selectable", so we pass selectedDate.
      const result = await SheetService.clockInOrOut(
        user, 
        type, 
        selectedDate, 
        new Date().getTime()
      );

      setMessage({
        text: result.message,
        type: result.success ? 'success' : 'error'
      });

    } catch (err) {
      setMessage({ text: '系統錯誤，無法寫入 Google Sheets', type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* Time Display */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-full text-blue-600 mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-4xl sm:text-6xl font-black text-slate-800 tracking-tight tabular-nums">
          {currentTime.toLocaleTimeString('zh-TW', { hour12: false })}
        </h2>
        <p className="text-slate-500 text-lg">
          {currentTime.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* Date Selector */}
      <div className="w-full max-w-xs">
        <label className="block text-sm font-medium text-slate-600 mb-1">
          打卡日期選擇
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 text-center text-lg font-medium bg-slate-50 hover:bg-white transition-colors cursor-pointer"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
        <button
          onClick={() => handleClock(AttendanceType.CLOCK_IN)}
          disabled={!!loading}
          className={`
            relative group flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-200
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-xl cursor-pointer'}
            bg-white border-blue-100 hover:border-blue-500 text-slate-700 hover:text-blue-600
          `}
        >
          {loading === 'IN' ? (
            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          ) : (
            <Briefcase className="w-12 h-12 mb-3" />
          )}
          <span className="text-2xl font-bold">上班</span>
          <span className="text-xs text-slate-400 mt-1">Clock In</span>
        </button>

        <button
          onClick={() => handleClock(AttendanceType.CLOCK_OUT)}
          disabled={!!loading}
          className={`
            relative group flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-200
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-xl cursor-pointer'}
            bg-white border-orange-100 hover:border-orange-500 text-slate-700 hover:text-orange-600
          `}
        >
          {loading === 'OUT' ? (
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
          ) : (
            <Home className="w-12 h-12 mb-3" />
          )}
          <span className="text-2xl font-bold">下班</span>
          <span className="text-xs text-slate-400 mt-1">Clock Out</span>
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className={`
          flex items-center max-w-lg w-full p-4 rounded-lg shadow-sm border
          ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}
          animate-in slide-in-from-bottom-2 duration-300
        `}>
          {message.type === 'success' ? (
            <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0" />
          ) : (
            <AlertOctagon className="w-6 h-6 mr-3 flex-shrink-0" />
          )}
          <div className="flex-1">
             <p className="font-bold">{message.type === 'success' ? '打卡成功' : '打卡異常'}</p>
             <p className="text-sm opacity-90">{message.text}</p>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-xs text-slate-400 max-w-md">
        <p>注意：系統將自動檢核重複打卡。若發生重複打卡，系統將自動記錄該筆異常並寫入資料庫。</p>
      </div>
    </div>
  );
};
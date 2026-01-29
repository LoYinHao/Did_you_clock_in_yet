import React, { useState, useEffect } from 'react';
import { User, AttendanceType } from '../types';
import { SheetService } from '../services/sheetService';
import { Loader2, Briefcase, Home, CheckCircle, AlertOctagon, Clock, MapPin, Info } from 'lucide-react';

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

  const getIpLocation = async (): Promise<{ latitude: number; longitude: number; address?: string } | undefined> => {
    try {
      console.log("Attempting to get IP-based location...");
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.latitude && data.longitude) {
        console.log("IP Location retrieved:", data.latitude, data.longitude);
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          address: `${data.city}, ${data.region}, ${data.country_name} (IP Based)`
        };
      }
    } catch (err) {
      console.error("IP Location fetch failed:", err);
    }
    return undefined;
  };

  const getGeolocation = (): Promise<{ latitude: number; longitude: number; address?: string } | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation API not supported");
        resolve(undefined);
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("GPS Location retrieved:", position.coords.latitude, position.coords.longitude);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        async (error) => {
          console.warn("GPS Location failed:", error.message);
          // Fallback to IP address location
          const ipLoc = await getIpLocation();
          resolve(ipLoc);
        },
        options
      );
    });
  };

  const handleClock = async (type: AttendanceType) => {
    if (!selectedDate) {
      setMessage({ text: '請選擇日期', type: 'error' });
      return;
    }

    setLoading(type === AttendanceType.CLOCK_IN ? 'IN' : 'OUT');
    setMessage(null);

    try {
      const location = await getGeolocation();
      console.log("Clock action location context:", location);

      const result = await SheetService.clockInOrOut(
        user,
        type,
        selectedDate,
        location
      );

      setMessage({
        text: result.message,
        type: result.success ? 'success' : 'error'
      });

    } catch (err: any) {
      console.error("Critical Clock-in Error:", err);
      setMessage({
        text: `系統錯誤: ${err.message || '無法寫入資料庫'}。請檢查網路連線或聯繫管理員。`,
        type: 'error'
      });
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
          <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity">
            <MapPin className="w-4 h-4" />
          </div>
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
          <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity">
            <MapPin className="w-4 h-4" />
          </div>
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

      <div className="mt-8 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center text-xs text-slate-500 max-w-md flex flex-col gap-2">
        <div className="flex items-center justify-center gap-1 text-blue-600 font-bold">
          <Info className="w-3 h-3" />
          <span>打卡位置提醒</span>
        </div>
        <p>系統將優先嘗試抓取精確 GPS 座標。若您未開啟 GPS 或瀏覽器權限，系統將自動透過網路路徑計算概略位置（IP 定位）以供後台存查。</p>
      </div>
    </div>
  );
};
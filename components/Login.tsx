import React, { useState } from 'react';
import { SheetService } from '../services/sheetService';
import { User } from '../types';
import { Loader2, AlertTriangle, Building2 } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const user = await SheetService.checkUserExists(email);
      
      if (user) {
        onLoginSuccess(user);
      } else {
        setError(
          <span>
            帳號 <span className="font-bold underline">{email}</span> 無權限登入。
            <br />
            需聯繫豪亮科技有限公司 負責人羅英豪
          </span>
        );
      }
    } catch (err) {
      setError('系統連線錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">豪亮打卡系統</h1>
          <p className="text-slate-500">請使用 Google 帳號登入</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-red-700 font-medium text-sm">
              <p className="font-bold">登入失敗</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Google Email (模擬)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="name@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                驗證中...
              </>
            ) : (
              '登入'
            )}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">測試帳號</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
           <button
            type="button"
            onClick={() => setEmail('user@haoliang.com')}
            className="w-full inline-flex justify-center py-2 px-2 border border-slate-300 rounded-md shadow-sm bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            一般員工
          </button>
           <button
            type="button"
            onClick={() => setEmail('admin@haoliang.com')}
            className="w-full inline-flex justify-center py-2 px-2 border border-slate-300 rounded-md shadow-sm bg-blue-50 text-xs font-bold text-blue-700 hover:bg-blue-100"
          >
            最高權限
          </button>
          <button
            type="button"
            onClick={() => setEmail('unknown@test.com')}
            className="w-full inline-flex justify-center py-2 px-2 border border-slate-300 rounded-md shadow-sm bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            未註冊
          </button>
        </div>
      </div>
    </div>
  );
};
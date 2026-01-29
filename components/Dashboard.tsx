import React, { useState } from 'react';
import { User, PermissionLevel } from '../types';
import { ClockPanel } from './ClockPanel';
import { HistoryPanel } from './HistoryPanel';
import { UserManagementPanel } from './UserManagementPanel';
import { LogOut, LayoutDashboard, History, UserCircle, Users } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type Tab = 'CLOCK' | 'HISTORY' | 'USERS';

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('CLOCK');

  const isAdmin = user.permission === PermissionLevel.ADMIN;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <img
                  src="https://lh3.googleusercontent.com/d/1an2P9_eOmoBciosufGRIwS_v9s8v1o4j"
                  alt="Logo"
                  className="w-10 h-10 object-contain"
                />
                <span className="hidden md:block font-black text-xl text-slate-800 tracking-tight">豪亮科技</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('CLOCK')}
                  className={`${activeTab === 'CLOCK'
                      ? 'border-blue-500 text-slate-900'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 transition-colors`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  打卡作業
                </button>
                <button
                  onClick={() => setActiveTab('HISTORY')}
                  className={`${activeTab === 'HISTORY'
                      ? 'border-blue-500 text-slate-900'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 transition-colors`}
                >
                  <History className="w-4 h-4 mr-2" />
                  紀錄查詢
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setActiveTab('USERS')}
                    className={`${activeTab === 'USERS'
                        ? 'border-blue-500 text-slate-900'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 transition-colors`}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    人員管理
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 py-1.5 px-3 rounded-full border border-slate-200">
                <UserCircle className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-slate-900">{user.name}</span>
                <span className="text-xs text-slate-400 border-l border-slate-300 pl-2 ml-1">
                  {user.permission === PermissionLevel.ADMIN ? '最高權限' :
                    user.permission === PermissionLevel.VIEW_ALL ? '檢視全員' : '一般權限'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="inline-flex items-center p-2 border border-transparent rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none"
                title="登出"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="sm:hidden border-t border-slate-200 grid grid-cols-3">
          <button
            onClick={() => setActiveTab('CLOCK')}
            className={`py-3 text-center text-sm font-medium ${activeTab === 'CLOCK' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}
          >
            打卡
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-3 text-center text-sm font-medium ${activeTab === 'HISTORY' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}
          >
            紀錄
          </button>
          {isAdmin ? (
            <button
              onClick={() => setActiveTab('USERS')}
              className={`py-3 text-center text-sm font-medium ${activeTab === 'USERS' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}
            >
              人員
            </button>
          ) : (
            <div className="bg-slate-50"></div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px]">
          {activeTab === 'CLOCK' && <ClockPanel user={user} />}
          {activeTab === 'HISTORY' && <HistoryPanel user={user} />}
          {activeTab === 'USERS' && isAdmin && <UserManagementPanel />}
        </div>
      </main>
    </div>
  );
};
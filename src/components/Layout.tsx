import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Calendar as CalendarIcon, PieChart, LogOut, Menu, X } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useUserStore((state) => state.logout);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: '事件展示', icon: LayoutDashboard },
    { path: '/events/new', label: '创建事件', icon: PlusCircle },
    { path: '/calendar', label: '日历视图', icon: CalendarIcon },
    { path: '/monitor', label: '事件监控', icon: PieChart },
    { path: '/stats', label: '数据整合', icon: PieChart },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold">事件追踪</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold">事件追踪</h1>
        </div>
        <nav className="px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-sky-100 text-sky-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full pt-20 md:pt-0 md:ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

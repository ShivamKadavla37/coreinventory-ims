import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineClipboardList,
  HiOutlineTruck,
  HiOutlineSwitchHorizontal,
  HiOutlineAdjustments,
  HiOutlineClock,
  HiOutlineOfficeBuilding,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineUser,
} from 'react-icons/hi';

const navItems = [
  { path: '/', label: 'Dashboard', icon: HiOutlineViewGrid },
  { path: '/products', label: 'Products', icon: HiOutlineCube },
  { path: '/receipts', label: 'Receipts', icon: HiOutlineClipboardList },
  { path: '/deliveries', label: 'Deliveries', icon: HiOutlineTruck },
  { path: '/transfers', label: 'Transfers', icon: HiOutlineSwitchHorizontal },
  { path: '/adjustments', label: 'Adjustments', icon: HiOutlineAdjustments },
  { path: '/history', label: 'Stock History', icon: HiOutlineClock },
  { path: '/warehouses', label: 'Warehouses', icon: HiOutlineOfficeBuilding },
  { path: '/low-stock', label: 'Low Stock Alerts', icon: HiOutlineExclamation },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass-card text-white"
        id="sidebar-toggle"
      >
        {collapsed ? <HiOutlineX size={20} /> : <HiOutlineMenu size={20} />}
      </button>

      {/* Overlay */}
      {collapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setCollapsed(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-surface-900/80 backdrop-blur-2xl border-r border-surface-700/50 
                     z-40 transition-all duration-300 flex flex-col
                     ${collapsed ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-64'}`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-surface-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
              <HiOutlineCube className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">KOSHNETRA</h1>
              <p className="text-xs text-surface-400">Inventory System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setCollapsed(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                 ${isActive
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30 shadow-glow'
                  : 'text-surface-400 hover:text-white hover:bg-surface-700/50'
                }`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-surface-700/50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-surface-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <NavLink
            to="/profile"
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 mb-2 rounded-xl text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-700/50 transition-all duration-200"
          >
            <HiOutlineUser size={18} />
            <span>My Profile</span>
          </NavLink>
          <button
            onClick={handleLogout}
            id="logout-btn"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 
                       hover:bg-red-500/10 transition-all duration-200"
          >
            <HiOutlineLogout size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

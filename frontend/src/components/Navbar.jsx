import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import {
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineBell
} from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import logoImg from '../assets/new-logo.png';

const navItems = [
  { path: '/', label: 'Dashboard', exact: true },
  { path: '/operations', label: 'Operations', exact: false, children: [
    { path: '/receipts', label: 'Receipts' },
    { path: '/deliveries', label: 'Delivery' },
    { path: '/transfers', label: 'Internal Transfers' },
    { path: '/adjustments', label: 'Stock Adjustments' },
  ]},
  { path: '/products', label: 'Products', exact: false },
  { path: '/history', label: 'Move History', exact: false },
  { path: '/warehouses', label: 'Settings', exact: false },
];

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [opsOpen, setOpsOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const opsRef = useRef(null);
  const notifRef = useRef(null);

  const isOpsActive = ['/receipts', '/deliveries', '/transfers', '/adjustments'].includes(location.pathname);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for real-time feel
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (opsRef.current && !opsRef.current.contains(e.target)) setOpsOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <nav className="navbar">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
        <div className="flex items-center h-12">
          {/* Brand Logo + Name */}
          <NavLink to="/" className="flex items-center gap-2.5 mr-6 shrink-0 group">
            <img 
              src={logoImg} 
              alt="KOSHNETRA Logo" 
              className="w-10 h-10 object-contain rounded-lg shadow-sm group-hover:shadow-md transition-shadow bg-white p-0.5" 
            />
            <span
              className="text-[1.15rem] font-bold tracking-wide text-gray-800 hidden sm:inline-block"
              style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '1.5px' }}
            >
              KOSHNETRA
            </span>
          </NavLink>
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0 h-full">
            {navItems.map((item) => {
              if (item.children) {
                return (
                  <div key={item.label} ref={opsRef} className="relative h-full flex items-center">
                    <button
                      onClick={() => setOpsOpen(!opsOpen)}
                      className={`nav-link h-full flex items-center ${isOpsActive ? 'nav-link-active' : ''}`}
                    >
                      {item.label}
                      <svg className={`ml-1 w-3.5 h-3.5 transition-transform ${opsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {opsOpen && (
                      <div className="absolute top-full left-0 mt-0 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 slide-up">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            onClick={() => setOpsOpen(false)}
                            className={({ isActive }) =>
                              `block px-4 py-2.5 text-sm transition-colors ${isActive
                                ? 'text-rose-600 bg-rose-50 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    `nav-link h-full flex items-center ${isActive ? 'nav-link-active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              );
            })}
          </div>

          <div className="ml-auto flex items-center pr-2 md:pr-0">
            {/* Notifications Dropdown */}
            <div className="relative mr-2 md:mr-0" ref={notifRef}>
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none"
              >
                <HiOutlineBell size={22} className={unreadCount > 0 ? "text-rose-600 animate-pulse" : ""} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden slide-up">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-800">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-sm text-gray-500">
                        No notifications yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${n.isRead ? 'opacity-60' : 'bg-rose-50/30'}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-sm font-medium ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</span>
                              {!n.isRead && <span className="h-2 w-2 rounded-full bg-rose-500 mt-1"></span>}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              id="navbar-toggle"
            >
              {mobileOpen ? <HiOutlineX size={22} /> : <HiOutlineMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white slide-up">
          <div className="px-4 py-3 space-y-1">
            <NavLink to="/" end onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium ${isActive ? 'text-rose-600 bg-rose-50' : 'text-gray-600 hover:bg-gray-50'}`
              }
            >Dashboard</NavLink>

            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Operations</div>
            {[
              { path: '/receipts', label: 'Receipts' },
              { path: '/deliveries', label: 'Delivery' },
              { path: '/transfers', label: 'Internal Transfers' },
              { path: '/adjustments', label: 'Stock Adjustments' },
            ].map(item => (
              <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-6 py-2.5 rounded-lg text-sm ${isActive ? 'text-rose-600 bg-rose-50 font-medium' : 'text-gray-600 hover:bg-gray-50'}`
                }
              >{item.label}</NavLink>
            ))}

            <NavLink to="/products" onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium ${isActive ? 'text-rose-600 bg-rose-50' : 'text-gray-600 hover:bg-gray-50'}`
              }
            >Products</NavLink>

            <NavLink to="/history" onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium ${isActive ? 'text-rose-600 bg-rose-50' : 'text-gray-600 hover:bg-gray-50'}`
              }
            >Move History</NavLink>

            <NavLink to="/warehouses" onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium ${isActive ? 'text-rose-600 bg-rose-50' : 'text-gray-600 hover:bg-gray-50'}`
              }
            >Settings</NavLink>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

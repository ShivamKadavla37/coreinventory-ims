import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineLogout, HiOutlineUser } from 'react-icons/hi';

const ProfileWidget = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="profile-widget" ref={ref}>
      {/* Popup menu */}
      {open && (
        <div className="absolute bottom-14 left-0 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-2 slide-up">
          <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
            <p className="text-xs text-rose-500 capitalize mt-0.5">{user?.role}</p>
          </div>
          <button
            onClick={() => { navigate('/profile'); setOpen(false); }}
            id="profile-btn"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700
                       hover:bg-gray-50 transition-all duration-200"
          >
            <HiOutlineUser size={16} />
            <span>My Profile</span>
          </button>
          <button
            onClick={handleLogout}
            id="logout-btn"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600
                       hover:bg-red-50 transition-all duration-200"
          >
            <HiOutlineLogout size={16} />
            <span>Log Out</span>
          </button>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        id="profile-widget-btn"
        className="w-12 h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center
                   shadow-lg hover:shadow-xl transition-all duration-200 text-lg font-bold"
      >
        {user?.name?.charAt(0)?.toUpperCase() || 'A'}
      </button>
    </div>
  );
};

export default ProfileWidget;

import { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HiOutlineUser, HiOutlineMail, HiOutlineShieldCheck, HiOutlineCalendar, HiOutlinePencil, HiOutlineX } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await profileAPI.get();
      setProfile(res.data);
      setForm({ name: res.data.name, email: res.data.email });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await profileAPI.update(form);
      setProfile({ ...profile, ...res.data });
      // Update the auth context
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...storedUser, name: res.data.name, email: res.data.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (setUser) setUser(updatedUser);
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="sub-header">
        <h1 className="page-title">My Profile</h1>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-new">
            <HiOutlinePencil size={16} /> Edit Profile
          </button>
        )}
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Header / Avatar area */}
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-8 flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold text-white border-2 border-white/30">
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
              <p className="text-rose-100 text-sm mt-0.5 capitalize">{profile?.role}</p>
            </div>
          </div>

          {/* Profile details or edit form */}
          {editing ? (
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setEditing(false); setForm({ name: profile.name, email: profile.email }); }} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">Save Changes</button>
              </div>
            </form>
          ) : (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <HiOutlineUser className="text-gray-400" size={20} />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Full Name</p>
                  <p className="text-sm font-semibold text-gray-800">{profile?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <HiOutlineMail className="text-gray-400" size={20} />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="text-sm font-semibold text-gray-800">{profile?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <HiOutlineShieldCheck className="text-gray-400" size={20} />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Role</p>
                  <p className="text-sm font-semibold text-gray-800 capitalize">{profile?.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <HiOutlineCalendar className="text-gray-400" size={20} />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Member Since</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

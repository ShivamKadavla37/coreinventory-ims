import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ProfileWidget from './ProfileWidget';
import AIChatbot from './AIChatbot';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-12 min-h-screen">
        <Outlet />
      </main>
      <ProfileWidget />
      <AIChatbot />
    </div>
  );
};

export default Layout;

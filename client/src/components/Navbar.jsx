import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, LogOut, Store, Clock, Compass, ShieldCheck, Settings } from 'lucide-react';

export const Navbar = () => {
  const { user, business, logout, isAuthenticated, isOwner, isStaff, isCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const navClass = (path) =>
    `inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
      isActive(path)
        ? 'border border-[#B9D4C8] bg-[#EBF2EE] text-[#2F7D6D]'
        : 'text-[#3F4946] hover:bg-[#F0EAE1] hover:text-[#1F2933]'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-[#E6DED2] bg-[#FFFDF9]/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D5CCC0] bg-[#1F2933] text-white">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-normal text-[#1F2933]">QueueFlow</span>
              <span className="status-badge status-open">LIVE</span>
            </div>
            <p className="hidden text-[11px] font-medium text-[#667085] sm:block">Digital queue operations</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {isAuthenticated ? (
            <>
              {isCustomer && (
                <>
                  <Link to="/discover" className={navClass('/discover')}>
                    <Compass className="h-4 w-4" />
                    Discover
                  </Link>
                  <Link to="/my-queue" className={navClass('/my-queue')}>
                    <Clock className="h-4 w-4" />
                    My Queue
                  </Link>
                </>
              )}

              {(isOwner || isStaff) && (
                <>
                  <Link to="/dashboard" className={navClass('/dashboard')}>
                    <Store className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link to="/dashboard/counters" className={navClass('/dashboard/counters')}>
                    Counters
                  </Link>
                  {isOwner && (
                    <Link to="/dashboard/settings" className={navClass('/dashboard/settings')}>
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  )}
                </>
              )}
            </>
          ) : (
            <Link to="/discover" className={navClass('/discover')}>
              <Compass className="h-4 w-4" />
              Browse Queues
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden text-right sm:block">
                <div className="flex items-center justify-end gap-1.5 text-sm font-bold text-[#1F2933]">
                  {user.name}
                  {isOwner && <ShieldCheck className="h-3.5 w-3.5 text-[#2F7D6D]" />}
                </div>
                <div className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-[#667085]">
                  <span className={`beacon ${isOwner ? 'bg-[#2F7D6D]' : isStaff ? 'bg-[#C98A2E]' : 'bg-[#5F8D72]'}`} />
                  {isOwner ? 'Owner' : isStaff ? 'Staff' : 'Customer'}
                  {business ? ` / ${business.name}` : ''}
                </div>
              </div>
              <button onClick={handleLogout} title="Log out" className="btn-secondary h-9 w-9 px-0">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary h-9">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary h-9">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

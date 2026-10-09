import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, LogOut, User, Store, Clock, Compass, ShieldCheck } from 'lucide-react';

export const Navbar = () => {
  const { user, business, logout, isAuthenticated, isOwner, isStaff, isCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                QueueFlow
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">Stop Waiting. Start Flowing.</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {isAuthenticated ? (
            <>
              {isCustomer && (
                <>
                  <Link
                    to="/discover"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/discover')
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    Discover Queues
                  </Link>
                  <Link
                    to="/my-queue"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/my-queue')
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    My Active Token
                  </Link>
                </>
              )}

              {(isOwner || isStaff) && (
                <>
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/dashboard')
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/dashboard/counters"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/dashboard/counters')
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    Counters
                  </Link>
                  {isOwner && (
                    <Link
                      to="/dashboard/settings"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/dashboard/settings')
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      Venue Settings
                    </Link>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <Link
                to="/discover"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                Browse Queues
              </Link>
            </>
          )}
        </nav>

        {/* Auth / Profile Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-100 flex items-center justify-end gap-1.5">
                  {user.name}
                  {isOwner && <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isOwner ? 'bg-indigo-400' : isStaff ? 'bg-cyan-400' : 'bg-emerald-400'
                    }`}
                  />
                  {isOwner ? 'Owner' : isStaff ? 'Staff' : 'Customer'}
                  {business ? ` • ${business.name}` : ''}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:shadow-indigo-600/40 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

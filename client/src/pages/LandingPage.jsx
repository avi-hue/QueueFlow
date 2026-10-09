import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  Clock,
  Store,
  ShieldCheck,
  TrendingUp,
  BellRing,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  Check
} from 'lucide-react';

export const LandingPage = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemoLogin = async (email, password, redirectPath) => {
    try {
      await login(email, password);
      navigate(redirectPath);
    } catch (err) {
      console.error('Demo login error:', err);
    }
  };

  return (
    <div className="relative overflow-hidden pt-12 pb-24">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[300px] bg-indigo-500/10 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Virtual Queue & Smart Wait Prediction Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Stop Waiting. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Start Flowing.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed">
            The issue is not long queues — it is <span className="text-white font-medium">uncertainty</span> about the wait. QueueFlow lets customers discover nearby businesses, compare live lines, receive digital tokens, and get notified when their turn arrives.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>Sign In to Account</span>
            </Link>
          </div>
        </div>

        {/* 1-Click Interactive Demo Card */}
        <div className="max-w-4xl mx-auto glass-card rounded-2xl p-6 sm:p-8 mb-20 border border-indigo-500/20 shadow-2xl shadow-indigo-950/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-lg font-bold text-white">Live Interactive Demo Accounts</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Explore QueueFlow instantly with pre-seeded demo accounts (Module 1 Auth & Business Basics)
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700">
              Pass: Password123!
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Owner Demo */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Business Owner
                  </span>
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <h4 className="font-bold text-white text-base">Apex Health Clinic</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Full control: edit venue profile, configure operating hours, and manage counters.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemoLogin('owner@queueflow.dev', 'Password123!', '/dashboard')}
                className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Login as Owner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Staff Demo */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Staff Member
                  </span>
                  <Store className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="font-bold text-white text-base">Sarah Connor (Staff)</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Assigned to Triage Counter A at Apex Health Clinic. Access live queue management.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemoLogin('staff@queueflow.dev', 'Password123!', '/dashboard')}
                className="w-full py-2 px-3 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Login as Staff</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Customer Demo */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Customer
                  </span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="font-bold text-white text-base">Alex Turner</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Remote queue seeker. Track wait time predictions and receive approaching alerts.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemoLogin('customer@queueflow.dev', 'Password123!', '/discover')}
                className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Login as Customer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <div className="glass-card glass-card-hover p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Nearby Discovery</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Find venues by location radius with real-time queue size, opening status, and live wait estimations.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Smart Wait Prediction</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Weighted algorithms combine rolling averages, historical day-of-week trends, and active counter capacity.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <BellRing className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Real-Time Alerts</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              In-app push notifications ping customers when their turn approaches or when called to a specific counter.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Business Operations</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Multi-counter calling, walk-in management, no-show timers, and peak-hour utilization heatmaps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

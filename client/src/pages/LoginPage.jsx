import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight, Lock, Mail, ShieldCheck, Store, User } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (from) navigate(from, { replace: true });
      else if (user.role === 'customer') navigate('/discover');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError('');
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
      <aside className="hidden lg:block">
        <p className="label-caps">Secure desk access</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-[#1F2933]">Pick up exactly where the live queue is moving.</h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-[#667085]">
          Staff and customers sign into the same operational system, with each role routed to the right queue view.
        </p>
        <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
          {['Realtime', 'Counters', 'Tokens'].map((item) => (
            <div key={item} className="panel-muted p-3">
              <p className="label-caps">{item}</p>
              <p className="mt-2 text-sm font-bold text-[#1F2933]">Ready</p>
            </div>
          ))}
        </div>
      </aside>

      <div className="panel-focus mx-auto w-full max-w-md p-6 sm:p-8">
        <div className="mb-6">
          <p className="label-caps">Account Sign In</p>
          <h1 className="mt-2 text-2xl font-bold text-[#1F2933]">Welcome back</h1>
          <p className="mt-1 text-sm text-[#667085]">Access your QueueFlow workspace.</p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-md border border-[#E8B8B2] bg-[#FFF0EE] p-3 text-sm text-[#B44A3F]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-caps mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail className="input-icon" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="input-field pl-10" />
            </div>
          </div>

          <div>
            <label className="label-caps mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="input-icon" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password123!" className="input-field pl-10" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary h-11 w-full">
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-7 border-t border-[#E6DED2] pt-5">
          <p className="label-caps mb-3 text-center">Demo Accounts</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Clinic Owner', 'apex@queueflow.dev', ShieldCheck],
              ['Cafe Owner', 'urban@queueflow.dev', Store],
              ['Bank Owner', 'first@queueflow.dev', ShieldCheck],
              ['Customer', 'customer@queueflow.dev', User]
            ].map(([label, demoEmail, Icon]) => (
              <button key={label} type="button" onClick={() => fillCredentials(demoEmail)} className="flex items-center gap-2 rounded-md border border-[#E6DED2] bg-white p-2 text-left font-semibold text-[#3F4946] transition hover:bg-[#F0EAE1]">
                <Icon className="h-3.5 w-3.5 shrink-0 text-[#2F7D6D]" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#667085]">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#2F7D6D] underline underline-offset-2">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

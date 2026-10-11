import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, BellRing, CheckCircle2, Clock, Compass, ShieldCheck, Store, Users } from 'lucide-react';

const Feature = ({ icon: Icon, title, text }) => (
  <div className="panel p-5">
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-[#D5CCC0] bg-[#F0EAE1] text-[#2F7D6D]">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="text-base font-bold text-[#1F2933]">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-[#667085]">{text}</p>
  </div>
);

export const LandingPage = () => {
  const { login } = useAuth();
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
    <div className="page-wrap space-y-12 py-10 lg:py-14">
      <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-sm border border-[#E6DED2] bg-[#FFFDF9] px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#2F7D6D]">
            <span className="beacon bg-[#2F7D6D]" />
            Live queue dispatch platform
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-[#1F2933] sm:text-5xl lg:text-6xl">
            Queue operations that feel calm, exact, and human.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#667085] sm:text-lg">
            QueueFlow helps customers discover live lines and gives businesses a crisp dispatch desk for counters, tokens, wait estimates, and real-time calls.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="btn-primary h-11 px-5">
              Start QueueFlow
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/discover" className="btn-secondary h-11 px-5">
              Browse Queues
            </Link>
          </div>
        </div>

        <div className="panel-focus p-4 sm:p-5">
          <div className="section-rule flex items-center justify-between pb-4">
            <div>
              <p className="label-caps">Dispatch Manifest</p>
              <h2 className="mt-1 text-xl font-bold text-[#1F2933]">Apex Health Clinic</h2>
            </div>
            <span className="status-badge status-open">
              <span className="beacon bg-[#2F7D6D]" />
              Queue Open
            </span>
          </div>
          <div className="grid gap-3 py-4 sm:grid-cols-3">
            {[
              ['WAITING', '18'],
              ['SERVING', '04'],
              ['EST. WAIT', '24m']
            ].map(([label, value]) => (
              <div key={label} className="panel-muted p-3">
                <p className="label-caps">{label}</p>
                <p className="metric-number mt-2 text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="divide-y divide-[#E6DED2] border-y border-[#E6DED2]">
            {['A-104', 'A-105', 'A-106'].map((token, index) => (
              <div key={token} className="queue-row">
                <div>
                  <p className="metric-number text-lg font-bold">{token}</p>
                  <p className="text-xs text-[#667085]">{index === 0 ? 'Now serving' : `${index + 1} in line`}</p>
                </div>
                <span className={index === 0 ? 'status-badge status-open' : 'status-badge status-warn'}>
                  {index === 0 ? 'Counter 02' : 'Waiting'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <div className="section-rule mb-5 flex flex-col justify-between gap-3 pb-4 sm:flex-row sm:items-end">
          <div>
            <p className="label-caps">Demo Access</p>
            <h2 className="mt-1 text-xl font-bold text-[#1F2933]">Try the app with seeded roles</h2>
          </div>
          <span className="rounded-sm border border-[#E6DED2] bg-[#F0EAE1] px-3 py-1.5 text-xs font-semibold text-[#3F4946]">Password123!</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Business Owner', 'owner@queueflow.dev', '/dashboard', ShieldCheck, 'Configure profile, counters, and queue rules.'],
            ['Staff Member', 'staff@queueflow.dev', '/dashboard', Store, 'Call next tokens and complete service.'],
            ['Customer', 'customer@queueflow.dev', '/discover', Users, 'Discover nearby queues and track a token.']
          ].map(([role, email, path, Icon, text]) => (
            <div key={role} className="panel-muted flex flex-col justify-between p-4">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="label-caps">{role}</span>
                  <Icon className="h-4 w-4 text-[#2F7D6D]" />
                </div>
                <p className="font-bold text-[#1F2933]">{email}</p>
                <p className="mt-2 text-sm leading-5 text-[#667085]">{text}</p>
              </div>
              <button onClick={() => handleQuickDemoLogin(email, 'Password123!', path)} className="btn-primary mt-4 w-full">
                Enter as {role.split(' ')[0]}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Feature icon={Compass} title="Nearby Discovery" text="Live business cards show queue size, status, distance, and wait estimates." />
        <Feature icon={Clock} title="Wait Prediction" text="Service-time settings keep customer expectations clear before they join." />
        <Feature icon={BellRing} title="Realtime Calls" text="Socket updates move tokens without customers or staff refreshing screens." />
        <Feature icon={CheckCircle2} title="Counter Control" text="Staff can call, serve, complete, and keep counters visible at a glance." />
      </section>
    </div>
  );
};

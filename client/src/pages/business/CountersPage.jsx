import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { AlertCircle, ArrowLeft, CheckCircle, Layers, Plus, Power, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CountersPage = () => {
  const { business, refreshBusiness, isOwner } = useAuth();
  const [newCounterName, setNewCounterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddCounter = async (e) => {
    e.preventDefault();
    if (!newCounterName.trim()) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/business/counters', { name: newCounterName.trim(), isActive: true });
      setNewCounterName('');
      setSuccess('Counter added successfully!');
      await refreshBusiness();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add counter');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCounter = async (counterId, currentStatus) => {
    try {
      await api.patch(`/business/counters/${counterId}`, { isActive: !currentStatus });
      await refreshBusiness();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update counter');
    }
  };

  const handleDeleteCounter = async (counterId) => {
    if (!window.confirm('Are you sure you want to delete this counter?')) return;
    try {
      await api.delete(`/business/counters/${counterId}`);
      await refreshBusiness();
      setSuccess('Counter deleted');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete counter');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="section-rule mb-6 pb-6">
        <Link to="/dashboard" className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#667085] transition hover:text-[#1F2933]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
        <p className="label-caps">Counter Management</p>
        <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold text-[#1F2933]">
          <Layers className="h-7 w-7 text-[#2F7D6D]" />
          Service Counters
        </h1>
        <p className="mt-2 text-sm text-[#667085]">Configure service desks, stations, or registers where customers are called and served.</p>
      </div>

      <div className="space-y-4">
        {error && <Notice tone="danger" icon={AlertCircle} text={error} />}
        {success && <Notice tone="open" icon={CheckCircle} text={success} />}

        {isOwner && (
          <section className="panel p-5">
            <p className="label-caps mb-3">Add New Counter</p>
            <form onSubmit={handleAddCounter} className="flex flex-col gap-3 sm:flex-row">
              <input type="text" required value={newCounterName} onChange={(e) => setNewCounterName(e.target.value)} placeholder="Counter 2, Consultation Room 3, Pickup Window..." className="input-field flex-1" />
              <button type="submit" disabled={loading || !newCounterName.trim()} className="btn-primary">
                <Plus className="h-4 w-4" />
                Add Counter
              </button>
            </form>
          </section>
        )}

        <section className="panel p-5">
          <div className="section-rule mb-2 flex items-center justify-between pb-3">
            <p className="label-caps">Current Counters</p>
            <span className="metric-number text-sm font-bold text-[#667085]">{business?.counters?.length || 0}</span>
          </div>

          {business?.counters?.length ? (
            <div className="divide-y divide-[#E6DED2]">
              {business.counters.map((counter) => (
                <div key={counter._id} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`beacon ${counter.isActive ? 'bg-[#2F7D6D]' : 'bg-[#9CA3AF]'}`} />
                    <div>
                      <h2 className="font-bold text-[#1F2933]">{counter.name}</h2>
                      <p className="text-xs text-[#667085]">{counter.isActive ? 'Active and open for calls' : 'Offline / paused'}</p>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleCounter(counter._id, counter.isActive)} title={counter.isActive ? 'Deactivate Counter' : 'Activate Counter'} className={counter.isActive ? 'btn-secondary h-9 px-3' : 'btn-primary h-9 px-3'}>
                        <Power className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{counter.isActive ? 'Pause' : 'Activate'}</span>
                      </button>
                      <button onClick={() => handleDeleteCounter(counter._id)} title="Delete Counter" className="btn-danger h-9 w-9 px-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-[#E6DED2] bg-[#F0EAE1] p-6 text-center text-sm text-[#667085]">No counters configured for this business yet.</div>
          )}
        </section>
      </div>
    </div>
  );
};

const Notice = ({ tone, icon: Icon, text }) => (
  <div className={`flex items-center gap-2 rounded-md border p-3 text-sm font-semibold ${tone === 'danger' ? 'border-[#E8B8B2] bg-[#FFF0EE] text-[#B44A3F]' : 'border-[#B9D4C8] bg-[#EBF2EE] text-[#2F7D6D]'}`}>
    <Icon className="h-4 w-4 shrink-0" />
    <span>{text}</span>
  </div>
);

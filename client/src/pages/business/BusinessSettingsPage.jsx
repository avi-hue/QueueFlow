import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { AlertCircle, ArrowLeft, CheckCircle, Clock, Save, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BusinessSettingsPage = () => {
  const { business, refreshBusiness } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Healthcare');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [avgServiceTimeDefault, setAvgServiceTimeDefault] = useState(5);
  const [maxQueueSize, setMaxQueueSize] = useState(0);
  const [approachingThreshold, setApproachingThreshold] = useState(3);
  const [noShowGraceMinutes, setNoShowGraceMinutes] = useState(5);
  const [allowRemoteJoin, setAllowRemoteJoin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (business) {
      setName(business.name || '');
      setCategory(business.category || 'Healthcare');
      setDescription(business.description || '');
      setAddress(business.address || '');
      setPhone(business.phone || '');
      if (business.settings) {
        setAvgServiceTimeDefault(business.settings.avgServiceTimeDefault || 5);
        setMaxQueueSize(business.settings.maxQueueSize || 0);
        setApproachingThreshold(business.settings.approachingThreshold || 3);
        setNoShowGraceMinutes(business.settings.noShowGraceMinutes || 5);
        setAllowRemoteJoin(business.settings.allowRemoteJoin !== false);
      }
    }
  }, [business]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.patch('/business/profile', {
        name,
        category,
        description,
        address,
        phone,
        settings: {
          avgServiceTimeDefault: Number(avgServiceTimeDefault),
          maxQueueSize: Number(maxQueueSize),
          approachingThreshold: Number(approachingThreshold),
          noShowGraceMinutes: Number(noShowGraceMinutes),
          allowRemoteJoin
        }
      });
      setSuccess('Venue profile and queue settings updated successfully!');
      await refreshBusiness();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="section-rule mb-6 pb-6">
        <Link to="/dashboard" className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#667085] transition hover:text-[#1F2933]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
        <p className="label-caps">Venue Configuration</p>
        <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold text-[#1F2933]">
          <Settings className="h-7 w-7 text-[#2F7D6D]" />
          Venue & Queue Settings
        </h1>
        <p className="mt-2 text-sm text-[#667085]">Configure business details, queue limits, and ETA baseline parameters.</p>
      </div>

      {error && <Notice tone="danger" icon={AlertCircle} text={error} />}
      {success && <Notice tone="open" icon={CheckCircle} text={success} />}

      <form onSubmit={handleSubmit} className="mt-4 space-y-5">
        <section className="panel p-5">
          <p className="label-caps mb-4">General Information</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business Name" value={name} onChange={setName} required />
            <div>
              <label className="label-caps mb-1.5 block">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
                <option value="Healthcare">Healthcare</option>
                <option value="Bank & Finance">Bank & Finance</option>
                <option value="Retail">Retail</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Government & DMV">Government & DMV</option>
                <option value="Salon & Spa">Salon & Spa</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Field label="Address" value={address} onChange={setAddress} required />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Phone" value={phone} onChange={setPhone} />
            <Field label="Description" value={description} onChange={setDescription} />
          </div>
        </section>

        <section className="panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#C98A2E]" />
            <p className="label-caps">Queue & ETA Prediction</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Avg Service Time Default (min)" type="number" min={1} max={120} value={avgServiceTimeDefault} onChange={setAvgServiceTimeDefault} required helper="Used by prediction algorithm as baseline" />
            <Field label="Approaching Alert Threshold" type="number" min={1} max={50} value={approachingThreshold} onChange={setApproachingThreshold} required helper="People ahead before approaching alert" />
            <Field label="No-Show Grace Period (min)" type="number" min={1} max={30} value={noShowGraceMinutes} onChange={setNoShowGraceMinutes} required helper="Timer before called token expires" />
            <Field label="Max Queue Capacity" type="number" min={0} max={1000} value={maxQueueSize} onChange={setMaxQueueSize} required helper="0 means unlimited" />
          </div>
          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-md border border-[#E6DED2] bg-[#F0EAE1] p-3">
            <input type="checkbox" checked={allowRemoteJoin} onChange={(e) => setAllowRemoteJoin(e.target.checked)} className="h-4 w-4 rounded border-[#D5CCC0] text-[#2F7D6D] focus:ring-[#2F7D6D]" />
            <span className="text-sm font-semibold text-[#1F2933]">Allow customers to join queue remotely from mobile/web</span>
          </label>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary h-11 px-5">
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

const Field = ({ label, value, onChange, helper, type = 'text', ...props }) => (
  <div>
    <label className="label-caps mb-1.5 block">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input-field" {...props} />
    {helper && <p className="mt-1 text-[11px] text-[#667085]">{helper}</p>}
  </div>
);

const Notice = ({ tone, icon: Icon, text }) => (
  <div className={`mb-4 flex items-center gap-2 rounded-md border p-3 text-sm font-semibold ${tone === 'danger' ? 'border-[#E8B8B2] bg-[#FFF0EE] text-[#B44A3F]' : 'border-[#B9D4C8] bg-[#EBF2EE] text-[#2F7D6D]'}`}>
    <Icon className="h-4 w-4 shrink-0" />
    <span>{text}</span>
  </div>
);

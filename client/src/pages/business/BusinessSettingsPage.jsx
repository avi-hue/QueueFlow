import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Settings, Save, ArrowLeft, CheckCircle, AlertCircle, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BusinessSettingsPage = () => {
  const { business, refreshBusiness } = useAuth();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Healthcare');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Queue settings
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-indigo-400" />
          <span>Venue & Queue Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure business details, queue limits, and prediction baseline parameters.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Profile */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
            General Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Business Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Address
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Queue & Prediction Parameters */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Queue & ETA Prediction Settings</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Avg Service Time Default (min)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                required
                value={avgServiceTimeDefault}
                onChange={(e) => setAvgServiceTimeDefault(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Used by prediction algorithm as baseline</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Approaching Alert Threshold (people ahead)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={approachingThreshold}
                onChange={(e) => setApproachingThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Sends "Your turn is approaching" alert</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                No-Show Grace Period (min)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                required
                value={noShowGraceMinutes}
                onChange={(e) => setNoShowGraceMinutes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Timer before called token expires</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Max Queue Capacity (0 = unlimited)
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                required
                value={maxQueueSize}
                onChange={(e) => setMaxQueueSize(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Stops remote joins if limit reached</p>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowRemoteJoin}
                onChange={(e) => setAllowRemoteJoin(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
              />
              <span className="text-sm text-slate-200 font-medium">
                Allow customers to join queue remotely from mobile/web
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight, Building, Lock, Mail, MapPin, Phone, Store, User } from 'lucide-react';

export const RegisterPage = () => {
  const [role, setRole] = useState('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Healthcare');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { name, email, password, phone, role };
      if (role === 'owner') {
        payload.business = { name: businessName, category, address, description, phone };
      }
      const user = await register(payload);
      navigate(user.role === 'owner' ? '/dashboard' : '/discover');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="panel-focus p-6 sm:p-8">
        <div className="mb-6">
          <p className="label-caps">Create Access</p>
          <h1 className="mt-2 text-2xl font-bold text-[#1F2933]">Register for QueueFlow</h1>
          <p className="mt-1 text-sm text-[#667085]">Join as a customer or open a business queue workspace.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg border border-[#E6DED2] bg-[#F0EAE1] p-1">
          {[
            ['customer', 'Customer', User],
            ['owner', 'Business Owner', Store]
          ].map(([value, label, Icon]) => (
            <button key={value} type="button" onClick={() => setRole(value)} className={`inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-bold transition ${role === value ? 'bg-white text-[#2F7D6D]' : 'text-[#667085] hover:text-[#1F2933]'}`}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-md border border-[#E8B8B2] bg-[#FFF0EE] p-3 text-sm text-[#B44A3F]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field icon={User} label="Full Name" value={name} onChange={setName} placeholder="Alex Turner" required />
            <Field icon={Mail} label="Email Address" type="email" value={email} onChange={setEmail} placeholder="alex@example.com" required />
            <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 chars" required minLength={6} />
            <Field icon={Phone} label="Phone" type="tel" value={phone} onChange={setPhone} placeholder="+1 (555) 000-0000" />
          </div>

          {role === 'owner' && (
            <div className="space-y-4 border-t border-[#E6DED2] pt-5">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-[#2F7D6D]" />
                <h3 className="text-sm font-bold text-[#1F2933]">Business Details</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Business Name" value={businessName} onChange={setBusinessName} placeholder="Apex Health Clinic" required />
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
              <Field icon={MapPin} label="Physical Address" value={address} onChange={setAddress} placeholder="350 5th Ave, New York, NY" required />
              <div>
                <label className="label-caps mb-1.5 block">Short Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of your business and services..." className="input-field" />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary h-11 w-full">
            {loading ? 'Creating...' : role === 'owner' ? 'Register Business' : 'Create Account'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#667085]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#2F7D6D] underline underline-offset-2">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

const Field = ({ icon: Icon, label, value, onChange, type = 'text', placeholder, ...props }) => (
  <div>
    <label className="label-caps mb-1.5 block">{label}</label>
    <div className="relative">
      {Icon && <Icon className="input-icon" />}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`input-field ${Icon ? 'pl-10' : ''}`} {...props} />
    </div>
  </div>
);

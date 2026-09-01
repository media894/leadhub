import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', companyName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        companyName: form.companyName,
        email: form.email,
        password: form.password,
      });
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-display font-bold text-2xl text-white tracking-tight">LeadHub</div>
          <div className="text-white/40 text-sm mt-1">by Odd Infotech</div>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-card p-7 space-y-4">
          <h1 className="font-display font-semibold text-lg text-ink">Create your account</h1>
          <p className="text-sm text-slate -mt-2">
            Set up your admin password, then connect your IndiaMART, email and WhatsApp.
          </p>

          {error && (
            <div className="text-sm text-ember bg-ember/10 border border-ember/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate mb-1 block">Your name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:border-signal outline-none"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate mb-1 block">Company name</label>
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:border-signal outline-none"
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate mb-1 block">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:border-signal outline-none"
              placeholder="Enter your email address"
            />
          </div>

          <PasswordInput
            label="Password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 6 characters"
          />

          <PasswordInput
            label="Confirm Password"
            required
            minLength={6}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Re-enter your password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-signal hover:bg-signalDark transition-colors text-white text-sm font-medium rounded-lg py-2.5 disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-sm text-slate">
            Already have an account?{' '}
            <Link to="/login" className="text-signal font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

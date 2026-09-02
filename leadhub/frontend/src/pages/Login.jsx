import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display font-bold text-2xl text-white tracking-tight">LeadHub</div>
          <div className="text-white/40 text-sm mt-1">by Odd Infotech</div>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="bg-card rounded-2xl shadow-card p-7 space-y-4">
          <h1 className="font-display font-semibold text-lg text-ink">Welcome back</h1>

          {error && (
            <div
              className={`text-xs rounded-xl px-4 py-3 border shadow-sm ${
                error.includes('REJECTED') || error.includes('rejected') || error.includes('Denied')
                  ? 'bg-rose-950/90 text-rose-200 border-rose-500/70 font-bold flex items-start gap-2 animate-shake'
                  : 'text-ember bg-ember/10 border border-ember/20'
              }`}
            >
              <span className="text-base">❌</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate mb-1 block">Email</label>
            <input
              type="email"
              required
              autoComplete="off"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:border-signal outline-none"
              placeholder="you@company.com"
            />
          </div>

          <PasswordInput
            label="Password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter your password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-signal hover:bg-signalDark transition-colors text-white text-sm font-medium rounded-lg py-2.5 disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-slate">
            New here?{' '}
            <Link to="/register" className="text-signal font-medium">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50 py-10">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center px-4">
        <div className="hidden md:block">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-900 mb-3">
              Welcome back to VisionAI
            </h1>
            <p className="text-sm text-slate-600 mb-6">
              Continue your clinically-inspired at-home vision screening. Your previous
              results, trends, and reliability scores are available on the dashboard.
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Medical-style dashboard for your test history</li>
              <li>• AI-assisted distance, posture, and lighting checks</li>
              <li>• Detailed result reports with clear recommendations</li>
            </ul>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-2 text-slate-900 text-center">
            Sign in to your account
          </h2>
          <p className="text-sm text-slate-600 mb-6 text-center">
            Use the email address you registered with your clinician or organization.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex justify-center items-center gap-2 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-600 transition"
            >
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-emerald-700 font-semibold hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
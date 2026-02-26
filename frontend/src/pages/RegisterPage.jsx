import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
              Create your VisionAI profile
            </h1>
            <p className="text-sm text-slate-600 mb-6">
              A profile lets you track vision changes over time, monitor test reliability,
              and share summaries with your clinician if needed.
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Secure access to your full test history</li>
              <li>• Clinically-inspired metrics and reliability scores</li>
              <li>• Clear, printable reports after every test</li>
            </ul>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-2 text-slate-900 text-center">
            Register for VisionAI
          </h2>
          <p className="text-sm text-slate-600 mb-6 text-center">
            Please provide accurate information so your test summaries remain clinically
            meaningful.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex justify-center items-center gap-2 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-600 transition"
            >
              {loading ? 'Registering…' : 'Register'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-700 font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
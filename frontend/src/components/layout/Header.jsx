import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            VA
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-slate-900 tracking-tight">
              VisionAI
            </span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-emerald-600">
              Vision Screening
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <HeaderLink to="/dashboard" active={isActive('/dashboard')}>
                Dashboard
              </HeaderLink>
              <HeaderLink to="/test" active={isActive('/test')}>
                Take Test
              </HeaderLink>
              <HeaderLink to="/history" active={isActive('/history')}>
                History
              </HeaderLink>
              <HeaderLink to="/calibration" active={isActive('/calibration')}>
                Calibration
              </HeaderLink>
              <span className="hidden md:inline text-xs text-slate-500 mx-2">
                {user.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <HeaderLink to="/login" active={isActive('/login')}>
                Login
              </HeaderLink>
              <HeaderLink to="/register" active={isActive('/register')}>
                Register
              </HeaderLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function HeaderLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-full font-medium transition ${
        active
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'text-slate-600 hover:bg-slate-50 border border-transparent'
      }`}
    >
      {children}
    </Link>
  );
}

export default Header;
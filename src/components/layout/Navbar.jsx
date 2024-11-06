// src/components/layout/Navbar.jsx
import { Bars3Icon } from '@heroicons/react/24/outline';

const Navbar = ({ onMenuClick }) => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden -ml-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
              onClick={onMenuClick}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="ml-4 lg:ml-0">
              <h1 className="text-xl font-semibold text-gray-900">
                Koperasi ATK Dashboard
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Add user profile, notifications, etc. here */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
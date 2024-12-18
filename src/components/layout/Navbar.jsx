// src/components/layout/Navbar.jsx
import { Menu } from "lucide-react";
import { Link } from "react-router-dom"; // Add this import

const Navbar = ({ onMenuClick }) => {
  return (
    <nav className="bg-[#e21c20] shadow-sm">
      <div className="px-4">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
          <button
              type="button"
              className="bg-white lg:hidden -ml-0.5 h-13 w-13 inline-flex items-center justify-center rounded-md text-black hover:text-gray-900"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5 text-gray-800" />
            </button>
            <div className="ml-4 lg:ml-0">
              <Link to="/" className="hover:opacity-90 transition-opacity">
                <h1 className="text-3xl font-medium text-white">
                  Koperasi Menara Tirza
                </h1>
              </Link>
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
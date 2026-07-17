import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold">
              SkillSwap
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className="hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link to="/skills" className="hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium">
                Skills
              </Link>
              <Link to="/profile" className="hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium">
                Profile
              </Link>
              <Link to="/bookings" className="hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium">
                Bookings
              </Link>
              <Link to="/messages" className="hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium">
                Messages
              </Link>
              <Link to="/login" className="hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium">
                Login
              </Link>
              <Link to="/register" className="bg-indigo-800 hover:bg-indigo-900 px-3 py-2 rounded-md text-sm font-medium">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

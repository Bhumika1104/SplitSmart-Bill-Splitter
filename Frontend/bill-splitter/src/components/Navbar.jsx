import React from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#070410]/90 backdrop-blur-2xl border-b border-violet-500/30 px-4 sm:px-8 py-3.5 shadow-[0_10px_40px_rgba(109,40,217,0.25)] font-sans transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Section: Back Button & Brand Logo */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Styled Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="group relative overflow-hidden flex items-center gap-1.5 bg-gradient-to-r from-violet-600/15 to-indigo-600/15 hover:from-violet-600/30 hover:to-indigo-600/30 text-violet-200 hover:text-white border border-violet-500/30 hover:border-violet-400 text-xs font-semibold px-3.5 py-2.5 rounded-2xl transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.15)] active:scale-95"
            title="Go Back"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1 font-bold text-violet-400 group-hover:text-white">
              ←
            </span>
            <span className="hidden sm:inline tracking-wide">Back</span>
          </button>

          {/* Premium Logo Design */}
          <Link
            to="/dashboard"
            className="text-base sm:text-xl font-extrabold text-white tracking-wide flex items-center gap-2.5 group no-underline ml-1"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
              <span className="relative bg-gradient-to-br from-violet-500 via-indigo-600 to-cyan-400 text-white p-2.5 rounded-2xl shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 flex items-center justify-center text-sm border border-white/20">
                ⚡
              </span>
            </div>
            <span className="bg-gradient-to-r from-white via-slate-100 to-violet-300 bg-clip-text text-transparent tracking-tight group-hover:tracking-wider transition-all duration-300">
              SplitSmart
            </span>
          </Link>
        </div>

        {/* Right Action Section: User Info & Logout OR Login/Register */}
        <div className="flex items-center gap-4 sm:gap-6">
          {user ? (
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Bold, White, Borderless User Name */}
              <div className="flex items-center gap-2.5 px-2 cursor-default">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></span>
                </span>
                <span className="text-slate-300 text-sm hidden sm:inline">
                  Hi,{" "}
                  <strong className="text-white text-lg font-bold font-mono tracking-wider ml-1 drop-shadow-md">
                    {user.name}
                  </strong>
                </span>
                <span className="text-white text-base font-bold font-mono sm:hidden tracking-wide drop-shadow-md">
                  {user.name}
                </span>
              </div>

              {/* Solid Red Round Shutdown Button with Zoom Effect */}
              <button
                onClick={handleLogout}
                className="group relative flex items-center justify-center w-11 h-11 bg-red-600 hover:bg-red-500 text-white border-none rounded-full transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:shadow-[0_0_25px_rgba(239,68,68,0.8)] hover:scale-110 active:scale-95"
                title="Logout"
              >
                {/* Shutdown / Power Icon SVG */}
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 5.636a9 9 0 11-12.728 0M12 3v9"
                  ></path>
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-violet-500/40 text-xs font-semibold px-4 py-2.5 rounded-2xl transition-all duration-300 shadow-sm no-underline"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="relative group overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold px-4.5 py-2.5 rounded-2xl transition-all duration-300 shadow-lg shadow-violet-600/30 hover:shadow-violet-600/60 active:scale-95 no-underline"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

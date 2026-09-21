import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post("/auth/login", formData);
      // User object localStorage madhe store karto ahot
      localStorage.setItem("user", JSON.stringify(response.data));
      alert("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090514] via-[#171033] to-[#0c081e] flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="flex flex-col lg:flex-row w-full max-w-5xl bg-[#130f26] border border-violet-500/20 rounded-3xl shadow-[0_25px_60px_-15px_rgba(109,40,217,0.3)] overflow-hidden">
        {/* Welcome Branding Section */}
        <div className="flex-1 p-8 lg:p-12 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15),transparent_70%)] flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-semibold px-3.5 py-1.5 rounded-full">
                🔒 Member Portal
              </span>
              <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-3 py-1.5 rounded-full">
                ⚡ Live Sync
              </span>
            </div>

            <h1 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              Welcome Back to{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SplitSmart.
              </span>
            </h1>

            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Access your real-time balance calculations, review settlement
              charts, and stay completely in sync with your group expenditures.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3">
              <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] p-3.5 rounded-xl">
                <span className="text-xl bg-blue-500/10 p-2.5 rounded-lg">
                  📊
                </span>
                <div>
                  <h6 className="text-white text-sm font-semibold mb-0">
                    Dynamic Balance Overview
                  </h6>
                  <p className="text-slate-400 text-xs mb-0">
                    Know who owes what instantly upon login.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10">
            <p className="text-slate-500 text-xs">
              Encrypted 256-bit secure user session management.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-1 p-8 lg:p-12 bg-[#16112d] flex items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-1">
                Member Login
              </h3>
              <p className="text-slate-400 text-xs">
                Enter your credentials to continue
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full bg-[#1e183b] border border-violet-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-400 transition-all shadow-inner"
                  placeholder="name@example.com"
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  className="w-full bg-[#1e183b] border border-violet-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-400 transition-all shadow-inner"
                  placeholder="••••••••"
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 cursor-pointer mt-2"
              >
                Login to Dashboard
              </button>
            </form>

            <div className="text-center mt-6 text-xs text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-blue-400 font-semibold hover:underline"
              >
                Register here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

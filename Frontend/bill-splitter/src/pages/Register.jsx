import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    upiId: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service to continue.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await API.post("/auth/register", formData);
      alert("Registration successful! Please login to your account.");
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data || "Registration failed. Email might already exist.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#05050f] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-slate-100 relative overflow-hidden">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-7xl bg-[#0b0c1e] border border-blue-500/20 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(37,99,235,0.3)] overflow-hidden flex flex-col lg:flex-row relative z-10">
        {/* Left Branding & App Mockup Section (Inspired by reference layout) */}
        <div className="flex-1 p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative dot matrix pattern */}
          <div className="absolute right-[-20px] top-[10%] w-48 h-48 opacity-10 bg-[radial-gradient(#fff_2px,transparent_2px)] [background-size:16px_16px] pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center font-black text-white text-lg tracking-wider">
                E
              </div>
              <span className="text-white font-bold text-xl tracking-wide">
                SplitSmart<span className="text-blue-300">.</span>
              </span>
            </div>

            <div className="w-12 h-1 bg-blue-300 rounded-full mb-6"></div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.15] mb-4 tracking-tight">
              Split your bill <br />
              among friends[cite: 1]
            </h1>

            <p className="text-blue-100/90 text-sm sm:text-base font-normal leading-relaxed mb-8 max-w-md">
              Splitting your bill is now easy[cite: 1]. Seamlessly track group
              expenses, calculate tabs, and clear payments with zero hassle.
            </p>

            {/* Feature Action / Mockup Graphic Representation */}
            <div className="relative mt-4 bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                  Checkout Total
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-medium">
                  Active Split
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-2xl font-black text-white">$180.00</span>
                <span className="text-xs text-blue-200">Date: 2026-04-08</span>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex justify-between text-xs text-blue-100">
                  <span>Tax and fees</span>
                  <span className="font-semibold">$15.00</span>
                </div>
                <div className="flex justify-between text-xs text-blue-100">
                  <span>Tips</span>
                  <span className="font-semibold">$5.00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-blue-200">
            <span>⚡ Fast, secure UPI & bill settlement</span>
            <span className="font-semibold text-white">v2.5 Release</span>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="flex-1 p-8 sm:p-12 lg:p-16 bg-[#0e0f24] flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
                Create Account 🚀
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm">
                Enter your credentials to launch your expense dashboard
              </p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs mb-6 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full bg-[#05050f] border border-blue-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  placeholder="Alex Morgan"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full bg-[#05050f] border border-blue-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="w-full bg-[#05050f] border border-blue-500/30 rounded-xl px-4 py-3 pr-10 text-white text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    {showPassword ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    className="w-full bg-[#05050f] border border-blue-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5">
                    UPI ID{" "}
                    <span className="text-slate-500 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="upiId"
                    className="w-full bg-[#05050f] border border-blue-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    placeholder="user@oksbi"
                    value={formData.upiId}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-blue-500/30 bg-[#05050f] text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <label
                  htmlFor="terms"
                  className="text-slate-400 text-xs cursor-pointer select-none"
                >
                  I agree to the{" "}
                  <span className="text-blue-400 hover:underline">
                    Terms of Service
                  </span>{" "}
                  &{" "}
                  <span className="text-blue-400 hover:underline">
                    Privacy Policy
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 cursor-pointer mt-3 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Creating Account...
                  </>
                ) : (
                  "Register Account ✨"
                )}
              </button>
            </form>

            <div className="text-center mt-6 text-xs text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-400 font-bold hover:underline transition-all"
              >
                Login here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

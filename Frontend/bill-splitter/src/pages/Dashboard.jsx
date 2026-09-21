import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [invites, setInvites] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState({
    totalSpent: 0,
    netBalance: 0,
    totalToReceive: 0,
    totalToPay: 0,
  });
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [showInvitesModal, setShowInvitesModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchUserGroups();
    fetchPendingInvites();
    fetchDashboardSummary();
  }, []);

  const fetchUserGroups = async () => {
    try {
      const response = await API.get(`/groups/user/${user.id}`);
      setGroups(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching groups", err);
      setGroups([]);
    }
  };

  const fetchPendingInvites = async () => {
    try {
      const response = await API.get(`/groups/invites/${user.id}`);
      setInvites(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching invites", err);
      setInvites([]);
    }
  };

  const fetchDashboardSummary = async () => {
    try {
      const response = await API.get(
        `/bills/user/${user.id}/dashboard-summary`,
      );
      setDashboardSummary(response.data);
    } catch (err) {
      console.error("Error fetching dashboard summary", err);
    }
  };

  const handleInviteResponse = async (groupId, status) => {
    try {
      await API.post(
        `/groups/respond?groupId=${groupId}&userId=${user.id}&status=${status}`,
      );
      alert(`Invitation ${status.toLowerCase()} successfully!`);
      fetchPendingInvites();
      fetchUserGroups();
      fetchDashboardSummary();
      if (invites.length <= 1) setShowInvitesModal(false);
    } catch (err) {
      alert("Failed to process invitation.");
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const newGroup = { groupName, description, createdBy: user.id };
      await API.post("/groups/create", newGroup);
      setGroupName("");
      setDescription("");
      fetchUserGroups();
      fetchDashboardSummary();
      alert("Group created successfully!");
    } catch (err) {
      setError("Failed to create group.");
    }
  };

  // Filter groups based on search input
  const filteredGroups = groups.filter((group) =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#070410] p-6 lg:p-10 font-sans text-slate-100 selection:bg-violet-500 selection:text-white flex flex-col justify-between">
      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(14, 9, 29, 0.5);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.4);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.8);
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-8 w-full">
        {/* Welcome Text & Notification Bell */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center relative gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white flex items-center gap-2">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-400 bg-clip-text text-transparent">
                {user?.name}
              </span>{" "}
              👋
            </h1>
            <p className="text-slate-400 text-xs lg:text-sm mt-1">
              Here is your financial overview across all active groups.
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowInvitesModal(!showInvitesModal)}
              className="relative bg-[#16102b] hover:bg-[#20173d] border border-violet-500/30 p-3 rounded-2xl text-violet-300 transition-all cursor-pointer shadow-md flex items-center justify-center hover:scale-95"
              title="View Invites"
            >
              <span className="text-lg">🔔</span>
              {invites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  {invites.length}
                </span>
              )}
            </button>

            {/* Invites Popover Dropdown */}
            {showInvitesModal && (
              <div className="absolute right-0 mt-3 w-80 bg-[#120d24] border border-violet-500/30 rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300">
                    Pending Invitations ({invites.length})
                  </h4>
                  <button
                    onClick={() => setShowInvitesModal(false)}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {invites.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No pending invites right now.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {invites.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-[#181033] border border-violet-500/20 p-3 rounded-xl space-y-2"
                      >
                        <p className="text-xs text-slate-200">
                          <strong className="text-white">
                            {inv.groupName}
                          </strong>{" "}
                          invited you to join.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleInviteResponse(inv.groupId, "ACCEPTED")
                            }
                            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white text-[11px] font-semibold py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleInviteResponse(inv.groupId, "REJECTED")
                            }
                            className="flex-1 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white text-[11px] font-semibold py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#120e26] via-[#100b21] to-[#0c0819] border-2 border-indigo-500/30 p-6 rounded-3xl shadow-lg transition-all duration-300 hover:scale-[0.98] hover:border-indigo-400 hover:shadow-[0_10px_35px_rgba(99,102,241,0.35)] relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
            <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="p-2 bg-indigo-500/10 rounded-xl">💳</span> Total
              Spent Across Groups
            </p>
            <h3 className="text-3xl font-extrabold text-indigo-100 tracking-tight mt-2">
              ₹
              {dashboardSummary.totalSpent
                ? dashboardSummary.totalSpent.toFixed(2)
                : "0.00"}
            </h3>
          </div>

          <div className="bg-gradient-to-br from-[#0a1c14] via-[#091510] to-[#060e0a] border-2 border-emerald-500/30 p-6 rounded-3xl shadow-lg transition-all duration-300 hover:scale-[0.98] hover:border-emerald-400 hover:shadow-[0_10px_35px_rgba(16,185,129,0.35)] relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="p-2 bg-emerald-500/10 rounded-xl">📥</span> To
              Receive
            </p>
            <h3 className="text-3xl font-extrabold text-emerald-300 tracking-tight mt-2">
              +₹
              {dashboardSummary.totalToReceive
                ? dashboardSummary.totalToReceive.toFixed(2)
                : "0.00"}
            </h3>
          </div>

          <div className="bg-gradient-to-br from-[#210e14] via-[#1a0a10] to-[#120609] border-2 border-rose-500/30 p-6 rounded-3xl shadow-lg transition-all duration-300 hover:scale-[0.98] hover:border-rose-400 hover:shadow-[0_10px_35px_rgba(244,63,94,0.35)] relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all"></div>
            <p className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="p-2 bg-rose-500/10 rounded-xl">📤</span> To Pay
            </p>
            <h3 className="text-3xl font-extrabold text-rose-300 tracking-tight mt-2">
              -₹
              {dashboardSummary.totalToPay
                ? dashboardSummary.totalToPay.toFixed(2)
                : "0.00"}
            </h3>
          </div>
        </div>

        {/* Main Grid: Create Group & Groups List with Equal Height (h-[500px]) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Group Section */}
          <div className="lg:col-span-1 bg-[#100b21] border border-violet-500/20 p-6 rounded-3xl shadow-xl flex flex-col h-[500px]">
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2 shrink-0">
              <span>✨</span> Create New Group
            </h4>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs mb-4 shrink-0">
                {error}
              </div>
            )}

            <form
              onSubmit={handleCreateGroup}
              className="flex flex-col flex-1 justify-between custom-scrollbar overflow-y-auto pr-1"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-violet-200 text-xs font-semibold mb-1.5">
                    Group Name
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#070410] border border-violet-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-400 transition-all"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Goa Trip"
                    required
                  />
                </div>

                <div>
                  <label className="block text-violet-200 text-xs font-semibold mb-1.5">
                    Description
                  </label>
                  <textarea
                    className="w-full bg-[#070410] border border-violet-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-400 transition-all resize-none"
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this group for?"
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-violet-600/20 cursor-pointer active:scale-95 hover:scale-[0.98] mt-4 shrink-0"
              >
                Create Group
              </button>
            </form>
          </div>

          {/* Groups List Section */}
          <div className="lg:col-span-2 bg-[#100b21] border border-violet-500/20 p-6 rounded-3xl shadow-xl flex flex-col h-[500px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 shrink-0">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📂</span> Your Groups ({filteredGroups.length})
              </h4>

              {/* Search Filter Input */}
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                  🔍
                </span>
                <input
                  type="text"
                  className="w-full bg-[#070410] border border-violet-500/30 rounded-xl pl-9 pr-4 py-2 text-white text-xs focus:outline-none focus:border-violet-400 transition-all"
                  placeholder="Search group by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {!Array.isArray(groups) || groups.length === 0 ? (
              <div className="text-center py-20 bg-[#150f2e]/40 border border-white/5 rounded-2xl flex-1 flex items-center justify-center">
                <p className="text-slate-400 text-sm">
                  No groups found. Create one or accept an invite!
                </p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-20 bg-[#150f2e]/40 border border-white/5 rounded-2xl flex-1 flex items-center justify-center">
                <p className="text-slate-400 text-sm">
                  No groups matching "{searchTerm}".
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                {filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-[#140e2b] hover:bg-[#1a1236] border border-violet-500/20 hover:border-violet-400 p-4.5 rounded-2xl flex justify-between items-center transition-all duration-300 cursor-pointer shadow-sm hover:scale-[0.98] hover:shadow-[0_8px_25px_rgba(139,92,246,0.3)] group"
                    onClick={() =>
                      navigate(`/group/${group.id}`, {
                        state: {
                          groupName: group.groupName,
                          description: group.description,
                        },
                      })
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <h5 className="text-white font-bold text-base mb-1 group-hover:text-violet-300 transition-colors flex items-center gap-2 truncate">
                        <span>👥</span> {group.groupName}
                      </h5>
                      <p className="text-slate-400 text-xs line-clamp-1 ml-6">
                        {group.description || "No description provided"}
                      </p>
                    </div>
                    <span className="bg-violet-500/10 group-hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shrink-0 ml-3">
                      View &rarr;
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sleek Non-Card Footer */}
      <footer className="max-w-7xl mx-auto w-full mt-16 pt-6 border-t border-violet-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-semibold text-slate-300">
          <span>⚡</span> SplitSmart — Split bills effortlessly with friends.
        </div>
        <div className="flex items-center gap-6">
          <span className="hover:text-violet-400 cursor-pointer transition-colors">
            Privacy Policy
          </span>
          <span className="hover:text-violet-400 cursor-pointer transition-colors">
            Terms of Service
          </span>
          <span className="hover:text-violet-400 cursor-pointer transition-colors">
            Support
          </span>
        </div>
        <div className="text-slate-500">
          &copy; {new Date().getFullYear()} All rights reserved.
        </div>
      </footer>
    </div>
  );
}

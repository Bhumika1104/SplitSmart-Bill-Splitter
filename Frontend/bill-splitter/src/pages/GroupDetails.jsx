import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import AddBillForm from "./AddBillForm";
import SuggestedSettlements from "./SuggestedSettlements";

export default function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([]);
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return "0.00";
    return Number(amount).toFixed(2);
  };

  const [newUserId, setNewUserId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState(null);

  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleData, setSettleData] = useState({
    toUser: "",
    toUserId: "",
    amount: "",
    method: "UPI",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchGroupDetails();
    fetchAllUsers();
    fetchPendingRequests();
  }, [groupId]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchGroupDetails = async () => {
    setError("");
    try {
      const groupRes = await API.get(`/groups/${groupId}`);
      const name =
        groupRes.data?.groupName ||
        groupRes.data?.name ||
        groupRes.data?.group?.name ||
        groupRes.data?.data?.name ||
        (typeof groupRes.data === "string" ? groupRes.data : "");

      if (name) {
        setGroupName(name);
      }
    } catch (err) {
      console.error("Error fetching group info", err);
      if (err.response && err.response.status === 403) {
        setError(
          "Access Denied (403): You do not have permission to view this group or your login token has expired.",
        );
      } else {
        setError("Failed to load group details.");
      }
    }

    try {
      const membersRes = await API.get(`/groups/${groupId}/members`);
      setMembers(membersRes.data);

      const billsRes = await API.get(`/bills/group/${groupId}`);
      setBills(billsRes.data);

      const summaryRes = await API.get(
        `/bills/group/${groupId}/summary/${user.id}`,
      );
      setSummary(summaryRes.data);
    } catch (err) {
      console.error("Error fetching group details", err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await API.get("/users/all");
      setAllUsers(res.data);
    } catch (err) {
      console.error("Error fetching users list", err);
    }
  };

  const fetchPendingRequests = async () => {
    if (!user) return;
    try {
      const res = await API.get(
        `/bills/group/${groupId}/pending-requests/${user.id}`,
      );
      setPendingRequests(res.data);
    } catch (err) {
      console.error("Error fetching pending requests", err);
    }
  };

  const handleConfirmRequest = async (requestId) => {
    setError("");
    setSuccess("");
    try {
      await API.post(`/bills/settlement-confirm/${requestId}`);
      setSuccess("Payment confirmed successfully! Balance updated.");
      fetchGroupDetails();
      fetchPendingRequests();
    } catch (err) {
      setError(err.response?.data || "Failed to confirm settlement.");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await API.post(
        `/groups/add-member?groupId=${groupId}&userId=${newUserId}`,
      );
      setNewUserId("");
      setShowAddMemberModal(false);
      setSuccess("Member invited successfully!");
      fetchGroupDetails();
    } catch (err) {
      setError(err.response?.data || "Failed to add member.");
    }
  };

  const handleSettleUpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await API.post("/bills/settlement-request", {
        groupId: groupId,
        fromUserId: user.id,
        toUserId: settleData.toUserId,
        amount: Number(settleData.amount),
        paymentMethod: settleData.method,
      });

      setShowSettleModal(false);
      setSuccess(
        `Settlement request of ₹${settleData.amount} sent to ${settleData.toUser} for confirmation!`,
      );
      fetchPendingRequests();
    } catch (err) {
      setError(err.response?.data || "Failed to send settlement request.");
    }
  };

  const handleDownloadCSV = () => {
    if (!expenseBills || expenseBills.length === 0) {
      setError("No bills available to download.");
      return;
    }

    const headers = ["Bill Title", "Paid By", "Amount (INR)", "Date & Time"];

    const rows = expenseBills.map((bill) => {
      const payer = members.find((m) => m.userId === bill.paidBy);
      const payerName = payer ? payer.name : "Unknown";
      const formattedDate = new Date(
        bill.createdAt || bill.date || new Date(),
      ).toLocaleString("en-IN");

      const title = `"${(bill.title || "").replace(/"/g, '""')}"`;

      return [
        title,
        `"${payerName}"`,
        bill.totalAmount || 0,
        `"${formattedDate}"`,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${groupName || "Group"}_Bills_History.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccess("Bills history downloaded as CSV! 📥");
  };

  const handleDownloadPDF = () => {
    if (!expenseBills || expenseBills.length === 0) {
      setError("No bills available to download.");
      return;
    }

    const printWindow = window.open("", "_blank");
    const rowsHtml = expenseBills
      .map((bill) => {
        const payer = members.find((m) => m.userId === bill.paidBy);
        const payerName = payer ? payer.name : "Unknown";
        const formattedDate = new Date(
          bill.createdAt || bill.date || new Date(),
        ).toLocaleString("en-IN");

        return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${bill.title}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${payerName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${formatAmount(bill.totalAmount)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${formattedDate}</td>
        </tr>
      `;
      })
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${groupName || "Group"} - Bills History</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { color: #4f46e5; margin-bottom: 5px; }
            p { color: #666; font-size: 13px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f3f4f6; color: #1f2937; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
            td { font-size: 14px; }
          </style>
        </head>
        <body>
          <h2>${groupName || "Group"} Expense History</h2>
          <p>Generated on: ${new Date().toLocaleString("en-IN")}</p>
          <table>
            <thead>
              <tr>
                <th>Bill Title</th>
                <th>Paid By</th>
                <th style="text-align: right;">Amount</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setSuccess("Preparing PDF download... 📄");
  };

  const availableUsers = allUsers.filter(
    (u) => !members.some((m) => m.userId === u.id),
  );

  const acceptedMembers = members.filter((m) => m.status === "ACCEPTED");

  const expenseBills = bills.filter((bill) => {
    const titleLower = (bill.title || "").toLowerCase();
    const isSettlement =
      titleLower.includes("settlement") ||
      titleLower.includes("settle") ||
      titleLower.includes("paid to");
    return !isSettlement;
  });

  return (
    <div className="min-h-screen bg-[#070410] p-6 lg:p-10 font-sans text-slate-100 relative">
      {success && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/30 animate-bounce">
          <span className="text-lg">🎉</span>
          <span className="text-xs font-bold tracking-wide">{success}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-400 bg-clip-text text-transparent">
                {groupName || "Loading Group..."}
              </span>
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Manage your group expenses, active bills, and member splits
              seamlessly.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
            <div className="relative">
              <button
                onClick={() => setShowMembersModal(!showMembersModal)}
                className="bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>👥</span> Members ({acceptedMembers.length})
              </button>

              {showMembersModal && (
                <div className="absolute right-0 mt-3 w-72 bg-[#120d24] border border-violet-500/30 rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-xl">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300">
                      Active Group Members
                    </h4>
                    <button
                      onClick={() => setShowMembersModal(false)}
                      className="text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {acceptedMembers.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-3">
                        No accepted members yet.
                      </p>
                    ) : (
                      acceptedMembers.map((m) => (
                        <div
                          key={m.id}
                          className="bg-[#181033] border border-violet-500/20 p-2.5 rounded-xl flex justify-between items-center"
                        >
                          <span className="text-xs text-slate-200 font-medium">
                            {m.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {m.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAddMemberModal(!showAddMemberModal)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-violet-600/20 active:scale-95"
            >
              <span>➕</span> Add Member
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs">
            {error}
          </div>
        )}

        {/* Pending Requests Box */}
        {pendingRequests.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-[#100b21] to-amber-500/10 border-2 border-amber-500/40 p-6 rounded-3xl shadow-xl">
            <h4 className="text-amber-300 font-bold text-base mb-3 flex items-center gap-2">
              <span>⏳</span> Pending Payment Approvals (Action Required)
            </h4>
            <div className="space-y-3">
              {pendingRequests.map((req) => {
                const debtor = members.find((m) => m.userId === req.fromUserId);
                const isReceiver = req.toUserId === user.id;

                return (
                  <div
                    key={req.id}
                    className="bg-[#140e2b] border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-slate-200 text-xs">
                        <strong className="text-white font-semibold">
                          {debtor ? debtor.name : "Someone"}
                        </strong>{" "}
                        has sent a payment request.
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-amber-400 font-bold">
                          Amount: ₹{formatAmount(req.amount)}
                        </span>
                        <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-violet-300">
                          Method:{" "}
                          <strong className="text-white">
                            {req.paymentMethod}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {isReceiver ? (
                      <button
                        onClick={() => handleConfirmRequest(req.id)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer shrink-0"
                      >
                        Confirm Payment ✅
                      </button>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-4 py-2 rounded-xl text-xs font-semibold">
                        ⏳ Waiting for confirmation...
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Member Collapsible Panel */}
        {showAddMemberModal && (
          <div className="bg-[#100b21] border-2 border-violet-500/40 p-6 rounded-3xl shadow-xl animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>👤</span> Add Member to Group
              </h4>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Cancel
              </button>
            </div>
            <form
              onSubmit={handleAddMember}
              className="flex flex-col sm:flex-row gap-4"
            >
              <select
                className="flex-1 bg-[#070410] border border-violet-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-400 transition-all cursor-pointer"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                required
              >
                <option value="">-- Select user from system list --</option>
                {availableUsers.map((u) => (
                  <option
                    key={u.id}
                    value={u.id}
                    className="bg-[#070410] text-white"
                  >
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Send Invite
              </button>
            </form>
          </div>
        )}

        {/* Dashboard Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-[#120e26] via-[#100b21] to-[#0c0819] border-2 border-indigo-500/30 p-6 rounded-3xl shadow-lg transition-all duration-300 hover:scale-[0.98] hover:border-indigo-400 relative overflow-hidden">
              <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="p-2 bg-indigo-500/10 rounded-xl">📊</span>{" "}
                Total Group Expense
              </p>
              <h3 className="text-3xl font-extrabold text-indigo-100 tracking-tight mt-2">
                ₹{formatAmount(summary.totalGroupExpense)}
              </h3>
            </div>

            <div className="bg-gradient-to-br from-[#0a1c14] via-[#091510] to-[#060e0a] border-2 border-emerald-500/30 p-6 rounded-3xl shadow-lg transition-all duration-300 hover:scale-[0.98] hover:border-emerald-400 relative overflow-hidden">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="p-2 bg-emerald-500/10 rounded-xl">💳</span> You
                Spent
              </p>
              <h3 className="text-3xl font-extrabold text-emerald-300 tracking-tight mt-2">
                ₹{formatAmount(summary.userTotalSpent)}
              </h3>
            </div>

            <div className="bg-gradient-to-br from-[#211a0e] via-[#1a1409] to-[#120e06] border-2 border-amber-500/30 p-6 rounded-3xl shadow-lg transition-all duration-300 hover:scale-[0.98] hover:border-amber-400 relative overflow-hidden">
              <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="p-2 bg-amber-500/10 rounded-xl">⚖️</span> Your
                Total Share
              </p>
              <h3 className="text-3xl font-extrabold text-amber-300 tracking-tight mt-2">
                ₹{formatAmount(summary.userShare)}
              </h3>
            </div>
          </div>
        )}

        {/* Main Content Grid: Add Bill Form & Group Bills */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 flex flex-col">
            <AddBillForm
              groupId={groupId}
              userId={user.id}
              members={members}
              onBillAdded={(msg) => {
                setSuccess(msg);
                fetchGroupDetails();
              }}
            />
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-[#100b21] border border-violet-500/20 p-6 rounded-3xl shadow-xl h-[580px] flex flex-col">
              {/* Group Bills Header with Download Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 shrink-0">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🧾</span> Group Bills
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    className="bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>📄</span> PDF
                  </button>
                </div>
              </div>

              {expenseBills.length === 0 ? (
                <div className="text-center py-20 bg-[#150f2e]/40 border border-white/5 rounded-2xl flex-1 flex items-center justify-center">
                  <p className="text-slate-400 text-sm">
                    No bills added in this group yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto pr-2 flex-1">
                  {expenseBills.map((bill) => {
                    const payer = members.find((m) => m.userId === bill.paidBy);
                    const fullReceiptUrl = bill.receiptUrl
                      ? `http://localhost:8080${bill.receiptUrl}`
                      : null;
                    const formattedDate = new Date(
                      bill.createdAt || bill.date || new Date(),
                    ).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    });

                    return (
                      <div
                        key={bill.id}
                        className="bg-gradient-to-r from-[#140e2b] to-[#181136] border border-violet-500/20 px-4 py-3.5 rounded-2xl flex items-center justify-between gap-4 hover:border-violet-400 transition-all duration-300 cursor-pointer shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <h5 className="text-white font-semibold text-sm truncate">
                            {bill.title}
                          </h5>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            Paid by:{" "}
                            <strong className="text-slate-200">
                              {payer ? payer.name : "Unknown"}
                            </strong>{" "}
                            • {formattedDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {fullReceiptUrl && (
                            <button
                              onClick={() =>
                                setSelectedReceiptUrl(fullReceiptUrl)
                              }
                              className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold px-3 py-1.5 rounded-xl cursor-pointer"
                            >
                              View
                            </button>
                          )}
                          <span className="text-emerald-400 font-bold text-base">
                            ₹{formatAmount(bill.totalAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Suggested Settlements Section */}
        <SuggestedSettlements
          summary={summary}
          members={members}
          user={user}
          formatAmount={formatAmount}
          onSettleUpClick={(data) => {
            setSettleData(data);
            setShowSettleModal(true);
          }}
        />
      </div>

      {/* Settlement Modal */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120d24] border border-cyan-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
              <h4 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                <span>💸</span> Settle Payment to {settleData.toUser}
              </h4>
              <button
                onClick={() => setShowSettleModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSettleUpSubmit} className="space-y-4">
              <div>
                <label className="block text-cyan-200 text-xs font-semibold mb-1.5">
                  Payment Method
                </label>
                <select
                  className="w-full bg-[#070410] border border-cyan-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400 cursor-pointer"
                  value={settleData.method}
                  onChange={(e) =>
                    setSettleData({ ...settleData, method: e.target.value })
                  }
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-cyan-200 text-xs font-semibold mb-1.5">
                  Amount to Pay (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-[#070410] border border-cyan-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400"
                  value={settleData.amount}
                  onChange={(e) =>
                    setSettleData({ ...settleData, amount: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-lg cursor-pointer"
                >
                  Send Approval Request ✅
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="bg-[#1a1236] hover:bg-[#25194d] text-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs border border-violet-500/30 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120d24] border border-violet-500/40 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative flex flex-col items-center">
            <div className="flex justify-between items-center w-full mb-4 pb-2 border-b border-white/10">
              <h4 className="text-sm font-bold text-violet-300 uppercase">
                Bill Receipt Preview
              </h4>
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <img
              src={selectedReceiptUrl}
              alt="Receipt"
              className="max-h-[65vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import API from "../services/api";

export default function AddBillForm({
  groupId,
  userId,
  members = [],
  onBillAdded,
}) {
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [receipt, setReceipt] = useState(null);

  // Per-expense participant selection state
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);

  // State to control dropdown visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter out only accepted members
  const acceptedMembers = members.filter((m) => m.status === "ACCEPTED");

  useEffect(() => {
    // By default, select all accepted members (including current user)
    if (acceptedMembers.length > 0) {
      setSelectedParticipantIds(acceptedMembers.map((m) => m.userId));
    } else if (userId) {
      // Always keep current user selected if no accepted members list available
      setSelectedParticipantIds([userId]);
    }
  }, [members, userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCheckboxChange = (memberUserId) => {
    // Prevent unchecking the current user who is creating/paying the bill
    if (memberUserId === userId) {
      return;
    }

    if (selectedParticipantIds.includes(memberUserId)) {
      setSelectedParticipantIds(
        selectedParticipantIds.filter((id) => id !== memberUserId),
      );
    } else {
      setSelectedParticipantIds([...selectedParticipantIds, memberUserId]);
    }
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (selectedParticipantIds.length === acceptedMembers.length) {
      // Deselect all EXCEPT the current active user
      setSelectedParticipantIds([userId]);
    } else {
      // Select all accepted members
      setSelectedParticipantIds(acceptedMembers.map((m) => m.userId));
    }
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Ensure current user is always included
    const finalParticipantIds = Array.from(
      new Set([...selectedParticipantIds, userId]),
    );

    if (finalParticipantIds.length === 0) {
      setError("Please select at least one participant for this bill.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("totalAmount", totalAmount);
      formData.append("groupId", groupId);
      formData.append("paidBy", userId);

      formData.append("participantIds", JSON.stringify(finalParticipantIds));

      if (receipt) {
        formData.append("receipt", receipt);
      }

      await API.post("/bills/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTitle("");
      setTotalAmount("");
      setReceipt(null);
      setSelectedParticipantIds(acceptedMembers.map((m) => m.userId));
      setSuccess("Bill added successfully with custom split!");

      if (onBillAdded)
        onBillAdded("Bill added successfully with custom split!");
    } catch (err) {
      setError(err.response?.data || "Failed to add bill.");
    }
  };

  return (
    <div className="bg-[#100b21] border border-violet-500/20 p-5 rounded-3xl shadow-xl flex flex-col justify-between max-w-lg mx-auto">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-bold text-white flex items-center gap-1.5">
            <span>💸</span> Add New Bill
          </h4>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-2.5 rounded-xl text-xs mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleAddBill} className="space-y-2.5">
          <div>
            <label className="block text-violet-200 text-xs font-semibold mb-1">
              Bill Title
            </label>
            <input
              type="text"
              className="w-full bg-[#070410] border border-violet-500/30 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-violet-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner at Hotel"
              required
            />
          </div>

          <div>
            <label className="block text-violet-200 text-xs font-semibold mb-1">
              Total Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full bg-[#070410] border border-violet-500/30 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-violet-400"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Participant Selection Dropdown Section */}
          <div className="space-y-1 relative" ref={dropdownRef}>
            <label className="block text-violet-200 text-xs font-semibold mb-1">
              Split Among Participants
            </label>

            {/* Dropdown Toggle Button */}
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-[#070410] border border-violet-500/30 rounded-xl px-3.5 py-2 text-white text-xs flex justify-between items-center cursor-pointer hover:border-violet-400 transition-colors"
            >
              <span className="font-medium">
                {selectedParticipantIds.length} of {acceptedMembers.length}{" "}
                Selected
              </span>
              <span className="text-violet-400 text-sm">
                {isDropdownOpen ? "▲" : "▼"}
              </span>
            </div>

            {/* Custom Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-[#0b0717] border border-violet-500/40 rounded-xl p-3 shadow-2xl space-y-2.5 max-h-48 overflow-y-auto">
                <div className="flex justify-between items-center pb-1.5 border-b border-violet-500/20 px-1">
                  <span className="text-[11px] text-violet-300 font-semibold">
                    Select Participants
                  </span>
                  {acceptedMembers.length > 0 && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={handleSelectAll}
                      className="text-[11px] text-violet-400 hover:text-violet-200 font-semibold cursor-pointer underline transition-colors"
                    >
                      {selectedParticipantIds.length === acceptedMembers.length
                        ? "Deselect Others"
                        : "Select All"}
                    </span>
                  )}
                </div>

                {acceptedMembers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">
                    No other members in group.
                  </p>
                ) : (
                  acceptedMembers.map((m) => {
                    const isSelf = m.userId === userId;
                    const isChecked =
                      selectedParticipantIds.includes(m.userId) || isSelf;

                    return (
                      <div
                        key={m.userId}
                        onClick={() => handleCheckboxChange(m.userId)}
                        className={`flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                          isSelf
                            ? "bg-violet-600/30 border-violet-400/60 text-white cursor-not-allowed opacity-90"
                            : isChecked
                              ? "bg-violet-600/25 border-violet-500/50 text-white shadow-sm cursor-pointer"
                              : "bg-[#070410] border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isSelf}
                            onChange={() => {}}
                            className="w-4 h-4 rounded accent-violet-600 cursor-pointer pointer-events-none"
                          />
                          <span className="text-xs font-medium">{m.name}</span>
                        </div>

                        {/* Visual badge for current user */}
                        {isSelf && (
                          <span className="text-[10px] bg-violet-500/30 text-violet-200 border border-violet-400/30 px-2 py-0.5 rounded-md font-medium">
                            Required
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-violet-200 text-xs font-semibold mb-1">
              Upload Bill Receipt (Optional)
            </label>
            <input
              type="file"
              className="w-full bg-[#070410] border border-violet-500/30 rounded-xl p-2 text-slate-300 text-xs file:mr-4 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white cursor-pointer"
              accept="image/*"
              onChange={(e) => setReceipt(e.target.files[0])}
            />
          </div>
        </form>
      </div>

      <div className="flex justify-center mt-4">
        <button
          type="button"
          onClick={handleAddBill}
          className="w-3/4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs transition-all duration-300 shadow-xl shadow-emerald-900/30 border-2 border-emerald-400/50 hover:border-cyan-300 hover:scale-[0.99] active:scale-95 cursor-pointer flex items-center justify-center gap-2 tracking-wide"
        >
          <span>✨</span> Add Bill & Split
        </button>
      </div>
    </div>
  );
}

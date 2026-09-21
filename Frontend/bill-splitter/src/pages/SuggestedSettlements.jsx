export default function SuggestedSettlements({
  summary,
  members,
  user,
  formatAmount,
  onSettleUpClick,
}) {
  if (!summary || !summary.settlements || summary.settlements.length === 0) {
    return null;
  }

  // Active (Pending) vs Completed (Done) settlements separation & history tracking
  const settlementsList = summary.settlements.map((s, index) => {
    const receiverMember = members.find((m) => m.name === s.to);
    const isDebtor = s.from === user.name;
    const isCompleted = s.status === "COMPLETED" || s.isSettled === true; // Backend status check if provided

    return {
      ...s,
      index,
      receiverMember,
      isDebtor,
      isCompleted,
      timestamp: s.updatedAt || s.createdAt || new Date(),
    };
  });

  // Sort: Active/Pending items on top, completed/history items at the bottom
  const sortedSettlements = settlementsList.sort((a, b) => {
    if (a.isCompleted === b.isCompleted) return 0;
    return a.isCompleted ? 1 : -1; // false (Active) comes first, true (Completed) goes down
  });

  // Function to handle PDF Download / Print View
  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    const htmlContent = `
      <html>
        <head>
          <title>Settlements & History Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { color: #4F46E5; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
            th { background-color: #f4f4f4; color: #333; }
            .badge-completed { color: #059669; font-weight: bold; }
            .badge-pending { color: #D97706; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Bill Splitter - Settlements & History Report</h2>
          <p><strong>Generated Date:</strong> ${new Date().toLocaleString("en-IN")}</p>
          <table>
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Amount (₹)</th>
                <th>Status</th>
                <th>Details / Date</th>
              </tr>
            </thead>
            <tbody>
              ${sortedSettlements
                .map(
                  (s) => `
                <tr>
                  <td>${s.from}</td>
                  <td>${s.to}</td>
                  <td>₹${formatAmount(s.amount)}</td>
                  <td>
                    <span class="${s.isCompleted ? "badge-completed" : "badge-pending"}">
                      ${s.isCompleted ? "COMPLETED ✅" : "PENDING ⏳"}
                    </span>
                  </td>
                  <td>${s.isCompleted ? `Via ${s.paymentMethod || "UPI"} (${new Date(s.timestamp).toLocaleDateString("en-IN")})` : "Suggested Transfer"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="bg-[#100b21] border border-violet-500/20 p-6 rounded-3xl shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white flex items-center gap-2">
          <span>💡</span> Suggested Settlements & History
        </h4>

        {/* Download PDF Button */}
        <button
          onClick={handleDownloadPDF}
          className="bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
        >
          <span>📥</span> Download PDF
        </button>
      </div>

      {/* Scroll container added with max-height and custom scrollbar */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
        {sortedSettlements.map((s) => {
          const formattedDate = s.isCompleted
            ? new Date(s.timestamp).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : null;

          return (
            <div
              key={s.index}
              className={`border px-5 py-4 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300 shadow-sm ${
                s.isCompleted
                  ? "bg-gradient-to-r from-[#0d1a17] to-[#102420] border-emerald-500/30 opacity-90"
                  : "bg-gradient-to-r from-[#140e2b] to-[#181136] border-violet-500/20 hover:border-violet-400 hover:scale-[0.98] hover:shadow-[0_8px_25px_rgba(139,92,246,0.3)]"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-sm truncate">
                    {s.from} pays {s.to}
                  </p>
                  {s.isCompleted && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
                      Done ✅
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {s.isCompleted
                    ? `Payment via ${s.paymentMethod || "UPI"} • ${formattedDate}`
                    : "Suggested balance transfer"}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={
                    s.isCompleted
                      ? "text-emerald-400 font-bold text-base"
                      : "text-cyan-400 font-bold text-base"
                  }
                >
                  ₹{formatAmount(s.amount)}
                </span>

                {s.isCompleted ? (
                  <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-[11px] font-semibold">
                    Settled History 🔒
                  </span>
                ) : s.isDebtor ? (
                  <button
                    onClick={() =>
                      onSettleUpClick({
                        toUser: s.to,
                        toUserId: s.receiverMember
                          ? s.receiverMember.userId
                          : "",
                        amount: s.amount,
                        method: "UPI",
                      })
                    }
                    className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold px-3.5 py-2 rounded-xl cursor-pointer transition-all active:scale-95"
                  >
                    Settle Up 🤝
                  </button>
                ) : (
                  <span className="bg-slate-800/60 text-slate-400 border border-white/10 px-3.5 py-2 rounded-xl text-[11px] font-semibold">
                    ⏳ Waiting
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

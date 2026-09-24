import { useNavigate } from "react-router";
import {
  Plus,
  Download,
  RotateCcw,
  History,
  BarChart2,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "../../auth/store/auth.store";
import { checkBillingPermission } from "../permissions/billing.permissions";
import { PP, RB } from "../constants/billing.constants";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onGenerateInvoice?: () => void;
  onViewPayments?: () => void;
  onViewDailyReport?: () => void;
  onExportReport?: () => void;
  isAdminReadOnly?: boolean;
}

export function BillingHeader({
  title = "Billing Dashboard",
  subtitle,
  onBack,
  onGenerateInvoice,
  onViewPayments,
  onViewDailyReport,
  onExportReport,
  isAdminReadOnly = false,
}: HeaderProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const showGenerate =
    checkBillingPermission(role, "generate_invoice") && !isAdminReadOnly;
  const showExport =
    checkBillingPermission(role, "export_reports") && !isAdminReadOnly;
  const showDailyReport = checkBillingPermission(role, "view_daily_report");
  const showPaymentsLedger = checkBillingPermission(role, "view_history");

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const defaultSubtitle = isAdminReadOnly
    ? "Monitor billing operations, invoice status and revenue overview across the hospital."
    : "Manage invoices, payment collections, billing status and daily revenue across outpatient consultations.";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 mb-3 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
          style={{ fontFamily: RB }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        {/* Title & Subtitle */}
        <h1
          className="text-xl font-bold text-[#111827]"
          style={{ fontFamily: PP }}
        >
          {title}
        </h1>
        <p
          className="text-xs text-[#64748B] mt-0.5"
          style={{ fontFamily: RB }}
        >
          {subtitle || defaultSubtitle}
        </p>
      </div>

      {/* Action Buttons & Quick Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {showGenerate && (
          <button
            onClick={onGenerateInvoice}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-blue-900 transition-transform shadow-sm active:scale-95 cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <Plus size={15} /> Generate Invoice
          </button>
        )}

        {showExport && !showGenerate && (
          <button
            onClick={
              onExportReport ||
              (() => console.log("Exporting Billing Report..."))
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-blue-900 transition-transform shadow-sm active:scale-95 cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <Download size={15} />
            Export Report
          </button>
        )}

        {showPaymentsLedger && (
          <button
            onClick={onViewPayments}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-teal-50 border border-teal-200 text-[#009688] text-xs font-semibold hover:bg-teal-100 transition-colors shadow-sm cursor-pointer"
            style={{ fontFamily: PP }}
          >
            {isAdminReadOnly ? <RotateCcw size={14} /> : <History size={14} />}
            <span className="hidden sm:inline">
              {isAdminReadOnly ? "Refresh Dashboard" : "Payment History Ledger"}
            </span>
          </button>
        )}

        {showDailyReport && (
          <button
            onClick={onViewDailyReport}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[#0D47A1] text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <BarChart2 size={14} />
            <span className="hidden sm:inline">Daily Billing Report</span>
          </button>
        )}
      </div>
    </div>
  );
}

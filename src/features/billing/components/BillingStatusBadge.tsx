import { RB } from "../constants/billing.constants";

const STATUS_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  Paid: {
    bg: "bg-green-50 border-green-200",
    text: "text-[#66BB6A]",
    dot: "bg-[#66BB6A]",
  },
  "Partially Paid": {
    bg: "bg-blue-50 border-blue-200",
    text: "text-[#0D47A1]",
    dot: "bg-[#0D47A1]",
  },
  Pending: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-[#F59E0B]",
    dot: "bg-[#F59E0B]",
  },
  "Pending Payment": {
    bg: "bg-amber-50 border-amber-200",
    text: "text-[#F59E0B]",
    dot: "bg-[#F59E0B]",
  },
  "Billing Pending": {
    bg: "bg-amber-50 border-amber-200",
    text: "text-[#F59E0B]",
    dot: "bg-[#F59E0B]",
  },
  Cancelled: {
    bg: "bg-slate-100 border-slate-200",
    text: "text-[#64748B]",
    dot: "bg-[#64748B]",
  },
  Refunded: {
    bg: "bg-red-50 border-red-200",
    text: "text-[#EF4444]",
    dot: "bg-[#EF4444]",
  },
  Voided: {
    bg: "bg-slate-100 border-slate-300",
    text: "text-[#475569]",
    dot: "bg-[#475569]",
  },
};

export function BillingStatusBadge({ status }: { status: string }) {
  const style = STATUS_MAP[status] || {
    bg: "bg-green-50 border-green-500",
    text: "text-green-500",
    dot: "bg-green-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text}`}
      style={{ fontFamily: RB }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

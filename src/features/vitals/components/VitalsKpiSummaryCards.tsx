import { Users, Clock, CheckSquare, Stethoscope } from "lucide-react";

const PP = "Poppins, sans-serif";
interface VitalsKpiStats {
  total: number;
  pending: number;
  recorded: number;
  ready: number;
}

export interface VitalsKpiSummaryCardsProps {
  kpiStats: VitalsKpiStats;
}

export function VitalsKpiSummaryCards({
  kpiStats,
}: VitalsKpiSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* Card 01: Today's Patients */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span
            className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider"
            style={{ fontFamily: PP }}
          >
            Today's Patients
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0D47A1] flex items-center justify-center border border-blue-100">
            <Users size={16} />
          </div>
        </div>
        <div
          className="text-2xl font-bold text-[#111827]"
          style={{ fontFamily: PP }}
        >
          {kpiStats.total}
        </div>
        <div className="text-[10px] text-slate-400">Total OPD queue today</div>
      </div>

      {/* Card 02: Vitals Pending */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span
            className="text-[11px] font-bold text-amber-700 uppercase tracking-wider"
            style={{ fontFamily: PP }}
          >
            Vitals Pending
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center border border-amber-100">
            <Clock size={16} />
          </div>
        </div>
        <div
          className="text-2xl font-bold text-[#F59E0B]"
          style={{ fontFamily: PP }}
        >
          {kpiStats.pending}
        </div>
        <div className="text-[10px] text-amber-600 font-medium">
          Awaiting prep recording
        </div>
      </div>

      {/* Card 03: Vitals Recorded */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span
            className="text-[11px] font-bold text-teal-700 uppercase tracking-wider"
            style={{ fontFamily: PP }}
          >
            Vitals Recorded
          </span>
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#009688] flex items-center justify-center border border-teal-100">
            <CheckSquare size={16} />
          </div>
        </div>
        <div
          className="text-2xl font-bold text-[#009688]"
          style={{ fontFamily: PP }}
        >
          {kpiStats.recorded}
        </div>
        <div className="text-[10px] text-teal-600 font-medium">
          Recorded & verified
        </div>
      </div>

      {/* Card 04: Ready For Consultation */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span
            className="text-[11px] font-bold text-green-700 uppercase tracking-wider"
            style={{ fontFamily: PP }}
          >
            Ready For Consultation
          </span>
          <div className="w-8 h-8 rounded-xl bg-green-50 text-[#66BB6A] flex items-center justify-center border border-green-100">
            <Stethoscope size={16} />
          </div>
        </div>
        <div
          className="text-2xl font-bold text-[#66BB6A]"
          style={{ fontFamily: PP }}
        >
          {kpiStats.ready}
        </div>
        <div className="text-[10px] text-green-600 font-medium">
          In Doctor queue
        </div>
      </div>
    </div>
  );
}

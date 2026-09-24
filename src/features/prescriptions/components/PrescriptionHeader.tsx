import React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ChevronRight, Plus } from "lucide-react";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

interface PrescriptionHeaderProps {
  role: "patient" | "doctor" | "admin";
  patientName?: string;
  onNewPrescription?: () => void;
}

export const PrescriptionHeader: React.FC<PrescriptionHeaderProps> = ({
  role,
  patientName = "Patient",
  onNewPrescription,
}) => {
  const navigate = useNavigate();

  if (role === "patient") {
    const handleBack = () => {
      navigate(-1);
    };

    return (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 mb-3 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
            style={{ fontFamily: RB }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1
            className="text-xl font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            My Prescriptions ({patientName})
          </h1>
          <p
            className="text-xs text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            View and download prescriptions issued by your doctors during your
            visits.
          </p>
        </div>
      </div>
    );
  }

  // Doctor or Admin Header
  return (
    <div className="mb-6">
      <div
        className="flex items-center gap-2 text-xs text-slate-500 mb-4 font-medium"
        style={{ fontFamily: RB }}
      >
        <span className="hover:text-[#0D47A1] cursor-pointer">
          {role === "doctor" ? "Doctor" : "Hospital Admin"}
        </span>
        <ChevronRight size={13} className="text-slate-400" />
        <span className="hover:text-[#0D47A1] cursor-pointer">
          Prescriptions
        </span>
        <ChevronRight size={13} className="text-slate-400" />
        <span className="text-[#111827] font-semibold">My Prescriptions</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            My Prescriptions
          </h1>
          <p
            className="text-xs text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            View, search, print and manage prescriptions issued during
            consultations.
          </p>
        </div>
        {role === "doctor" && onNewPrescription && (
          <button
            onClick={onNewPrescription}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-[#0c3d8a] transition-colors shadow-sm shrink-0"
            style={{ fontFamily: PP }}
          >
            <Plus size={15} /> + New Prescription
          </button>
        )}
      </div>
    </div>
  );
};

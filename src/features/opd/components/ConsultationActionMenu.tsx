import { Phone, Stethoscope, FolderOpen, FileText } from "lucide-react";
import type { ConsultationRecord, OauthRole } from "../types/consultation";

const PP = "'Poppins', system-ui, sans-serif";

export interface ConsultationActionMenuProps {
  item: ConsultationRecord;
  role: OauthRole;
  onStartConsultation?: (id: string) => void;
  onOpenConsultation?: (id: string) => void;
  onCallPatient?: (item: ConsultationRecord) => void;
  onCancelConsultation?: (item: ConsultationRecord) => void;
  onViewDetails?: (id: string) => void;
  canStartConsultation?: boolean;
  calledPatientIds?: Set<string>;
}

export const ConsultationActionMenu: React.FC<ConsultationActionMenuProps> = ({
  item,
  role = "doctor",
  onStartConsultation,
  onOpenConsultation,
  onCallPatient,
  onViewDetails,
  canStartConsultation = true,
  calledPatientIds,
}) => {
  const handleDetailsClick = () => {
    onViewDetails?.(item.id);
  };

  const statusUpper = String(item.status || "")
    .toUpperCase()
    .replace(/[\s-]/g, "_");

  const isLocallyCalled = Boolean(
    calledPatientIds &&
    (calledPatientIds.has(String(item.id)) ||
      (item.appointmentId != null &&
        calledPatientIds.has(String(item.appointmentId))) ||
      (item.tokenNo && calledPatientIds.has(String(item.tokenNo)))),
  );

  const isCalled =
    statusUpper === "CALLED" ||
    statusUpper === "PATIENT_CALLED" ||
    statusUpper === "CALLED_PATIENT" ||
    statusUpper === "CALL" ||
    isLocallyCalled;

  const isInConsultation =
    statusUpper === "IN_CONSULTATION" || statusUpper === "IN_PROGRESS";
  const isCancelled = statusUpper === "CANCELLED" || statusUpper === "CANCELED";
  const isCompleted =
    statusUpper === "COMPLETED" ||
    statusUpper === "CONSULTATION_COMPLETED" ||
    statusUpper === "READY_FOR_BILLING" ||
    statusUpper === "BILLING_PENDING" ||
    statusUpper === "PAYMENT_COMPLETED" ||
    statusUpper === "FINALIZED";

  const isWaitingForDoctorCall =
    !isCalled && !isInConsultation && !isCompleted && !isCancelled;

  const isDoctorRole = String(role).toLowerCase() === "doctor";

  return (
    <div
      className="flex items-center justify-end gap-1.5 relative"
      onClick={(e) => e.stopPropagation()}
    >
      {isDoctorRole &&
        canStartConsultation &&
        isWaitingForDoctorCall &&
        onCallPatient && (
          <button
            onClick={() => onCallPatient(item)}
            className="px-2.5 py-1.5 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 bg-purple-600 hover:bg-purple-700 cursor-pointer"
            title="Call Patient"
            style={{ fontFamily: PP }}
          >
            <Phone size={13} /> Call Patient
          </button>
        )}

      {isDoctorRole &&
        canStartConsultation &&
        isCalled &&
        onStartConsultation && (
          <button
            onClick={() => onStartConsultation(item.id)}
            className="px-2.5 py-1.5 bg-[#009688] hover:bg-[#00796B] text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
            style={{ fontFamily: PP }}
          >
            <Stethoscope size={13} /> Start Consultation
          </button>
        )}

      {isDoctorRole && canStartConsultation && isInConsultation && (
        <button
          onClick={() =>
            onOpenConsultation
              ? onOpenConsultation(item.id)
              : onStartConsultation?.(item.id)
          }
          className="px-2.5 py-1.5 bg-[#0D47A1] hover:bg-[#0a3880] text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          style={{ fontFamily: PP }}
        >
          <FolderOpen size={13} /> Continue Consultation
        </button>
      )}

      {isCompleted && (
        <button
          onClick={handleDetailsClick}
          className="px-3 py-1.5 bg-[#0D47A1] hover:bg-[#0a3880] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          title="View Finalized Prescription"
          style={{ fontFamily: PP }}
        >
          <FileText size={14} /> View Prescription
        </button>
      )}
    </div>
  );
};

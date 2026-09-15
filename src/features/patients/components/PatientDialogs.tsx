import { useState } from "react";
import {
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  AlertCircle,
} from "lucide-react";
import { formatTime } from "../../../lib/time-utils";
import type { PatientCancelAppointmentDialogProps } from "../types/patient.types";
import { PP, RB } from "../constants/patient.fonts";

export function PatientCancelAppointmentDialog({
  appointment,
  isOpen,
  onClose,
  onConfirmCancel,
  onBookNewAppointment,
}: PatientCancelAppointmentDialogProps) {
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setValidationError("Please select a cancellation reason.");
      return;
    }
    setValidationError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessDialog(true);
      onConfirmCancel(appointment.id, reason, comments);
    }, 300);
  };

  const handleCloseAll = () => {
    setReason("");
    setComments("");
    setValidationError(null);
    setShowSuccessDialog(false);
    onClose();
  };

  // Success Dialog View
  if (showSuccessDialog) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 max-sm:items-end">
        <div
          className="w-full max-w-md bg-white rounded-2xl max-sm:rounded-b-none max-sm:rounded-t-2xl shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-5 text-center transition-transform duration-200"
          style={{ fontFamily: RB }}
        >
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#66BB6A] flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <h3
              className="text-base font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Appointment Cancelled Successfully
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Your appointment{" "}
              <span className="font-mono font-bold text-[#0D47A1]">
                {appointment.id}
              </span>{" "}
              has been cancelled.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Doctor:</span>
              <span className="font-semibold text-[#111827]">
                {appointment.doctor}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Date & Time:</span>
              <span className="font-semibold text-[#111827]">
                {appointment.date} @ {formatTime(appointment.time)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Reason:</span>
              <span className="font-medium text-red-600">{reason}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            {onBookNewAppointment && (
              <button
                type="button"
                onClick={() => {
                  handleCloseAll();
                  onBookNewAppointment();
                }}
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors shadow-sm"
                style={{ fontFamily: PP }}
              >
                Book New Appointment
              </button>
            )}
            <button
              type="button"
              onClick={handleCloseAll}
              className="w-full sm:flex-1 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition-colors"
            >
              Back to My Appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation Modal View
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 max-sm:items-end">
      <div
        className="w-full max-w-md sm:max-w-lg bg-white rounded-2xl max-sm:rounded-b-none max-sm:rounded-t-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col transition-transform duration-200"
        style={{ fontFamily: RB }}
      >
        {/* Header - Solid Danger Banner Theme matching Reschedule Appointment header style */}
        <div className="p-5 bg-[#EF4444] flex items-start gap-3.5 text-white shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/30 text-white flex items-center justify-center shrink-0 shadow-inner">
            <AlertTriangle size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="text-base font-bold text-white"
              style={{ fontFamily: PP }}
            >
              Cancel Appointment
            </h2>
            <p className="text-xs text-red-50 mt-0.5">
              Are you sure you want to cancel this appointment?
            </p>
          </div>
          <button
            aria-label="Close"
            type="button"
            onClick={handleCloseAll}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleCancelSubmit}
          className="p-5 space-y-4 overflow-y-auto max-h-[80vh] bg-slate-50/50"
        >
          {/* Appointment Summary Card */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#0D47A1]">
                {appointment.id}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  appointment.status === "Confirmed"
                    ? "bg-green-50 text-[#66BB6A]"
                    : "bg-blue-50 text-[#0D47A1]"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />{" "}
                {appointment.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[#64748B] text-[10px] block">
                  Doctor Name
                </span>
                <span className="font-bold text-[#111827]">
                  {appointment.doctor}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] block">
                  Department
                </span>
                <span className="font-semibold text-slate-700">
                  {appointment.department}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] block">
                  Appointment Date
                </span>
                <span className="font-semibold text-[#111827]">
                  {appointment.date}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] block">
                  Appointment Time
                </span>
                <span className="font-semibold text-[#0D47A1]">
                  {appointment.time}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] block">
                  Visit Type
                </span>
                <span className="font-medium text-slate-600">
                  {appointment.visitType}
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation Reason Select */}
          <div>
            <span
              className="block text-xs font-bold text-[#111827] mb-1"
              style={{ fontFamily: PP }}
            >
              Cancellation Reason *
              <select
                aria-label="Select option"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value) setValidationError(null);
                }}
                className={`w-full px-3 py-2 text-xs bg-white border rounded-xl outline-none focus:border-[#0D47A1] transition-colors ${
                  validationError
                    ? "border-red-500 bg-red-50/20"
                    : "border-[#E5E7EB]"
                }`}
              >
                <option value="">Select Cancellation Reason</option>
                <option value="Personal Reason">Personal Reason</option>
                <option value="Feeling Better">Feeling Better</option>
                <option value="Schedule Conflict">Schedule Conflict</option>
                <option value="Booked by Mistake">Booked by Mistake</option>
                <option value="Doctor Change Request">
                  Doctor Change Request
                </option>
                <option value="Other">Other</option>
              </select>
            </span>
            {validationError && (
              <p className="text-[11px] text-[#EF4444] font-semibold mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {validationError}
              </p>
            )}
          </div>

          {/* Optional Comments */}
          <div>
            <span
              className="block text-xs font-bold text-[#111827] mb-1"
              style={{ fontFamily: PP }}
            >
              Additional Comments (Optional)
            </span>
            <textarea
              aria-label="Text area"
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add additional comments (optional)"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] transition-colors text-[#111827]"
            />
          </div>

          {/* Information Alert Card */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
            <div
              className="flex items-center gap-1.5 font-bold text-amber-800"
              style={{ fontFamily: PP }}
            >
              <Info size={14} className="text-amber-600" /> Information
              Guidelines
            </div>
            <ul className="space-y-0.5 text-[11px] text-amber-800/90 pl-1">
              <li>• Cancelled appointments cannot be restored.</li>
              <li>• You can book another appointment anytime.</li>
              <li>• Hospital cancellation policy may apply.</li>
            </ul>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleCloseAll}
              className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition-colors"
            >
              Keep Appointment
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#EF4444] text-white text-xs font-bold hover:bg-red-600 transition-colors shadow-sm flex items-center gap-1.5"
              style={{ fontFamily: PP }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" /> Cancelling...
                </>
              ) : (
                <>
                  <XCircle size={14} /> Cancel Appointment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

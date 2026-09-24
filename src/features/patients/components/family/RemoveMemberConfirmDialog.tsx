import React, { useState } from "react";
import { AlertCircle, UserX, Loader2 } from "lucide-react";
import type { FamilyMember } from "../../types/family.types";
import { apiClient, axios } from "../../../../lib/axios";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

interface RemoveMemberConfirmDialogProps {
  member: FamilyMember | null;
  removeFromDrawer?: boolean;
  onClose: () => void;
  onConfirmSuccess: (mrnOrId: string, name: string) => void;
  onError: (msg: string) => void;
}

export const RemoveMemberConfirmDialog: React.FC<
  RemoveMemberConfirmDialogProps
> = ({ member, onClose, onConfirmSuccess, onError }) => {
  const [isUnlinking, setIsUnlinking] = useState<boolean>(false);

  if (!member) return null;

  const mrn = member.mrn || member.id;
  const name = member.patientName || member.name || "Family Member";

  const handleConfirm = async () => {
    setIsUnlinking(true);
    try {
      if (mrn) {
        try {
          await apiClient.delete(
            `/api/v1/patients/${encodeURIComponent(mrn)}/link`,
          );
        } catch (err: unknown) {
          // If 404 RESOURCE_NOT_FOUND occurs (link does not exist or already removed), treat gracefully!
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            console.info(
              `Unlink endpoint returned 404 for ${mrn}, proceeding with removal.`,
            );
          } else {
            throw err;
          }
        }
      }
      onConfirmSuccess(mrn, name);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : `Failed to unlink family member ${name}`;
      onError(errorMsg);
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 transition-opacity duration-150 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#EF4444] flex items-center justify-center font-bold shrink-0">
            <AlertCircle size={22} />
          </div>
          <div>
            <h3
              className="text-base font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Remove Family Member
            </h3>
            <p className="text-xs text-[#64748B]" style={{ fontFamily: RB }}>
              Confirm removing linked family member
            </p>
          </div>
        </div>

        {/* BODY: PATIENT SUMMARY CARD */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-bold text-sm shrink-0">
            {name[0]?.toUpperCase() || "P"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold text-[#111827] truncate"
                style={{ fontFamily: PP }}
              >
                {name}
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-[#0D47A1] text-[10px] font-bold rounded-full">
                {member.relationship}
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#64748B]">
              {member.mrn}
            </div>
          </div>
        </div>

        {/* CONFIRMATION MESSAGE */}
        <div
          className="space-y-1 text-xs text-[#64748B] leading-relaxed"
          style={{ fontFamily: RB }}
        >
          <p>
            Are you sure you want to remove this linked family member from your
            Patient Portal account?
          </p>
          <p>
            This action only removes the relationship link from your account. It
            will <strong>NOT</strong> delete the patient's hospital record or
            medical history.
          </p>
        </div>

        {/* WARNING BOX */}
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-[#F59E0B]">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span
            style={{ fontFamily: RB }}
            className="text-[#854D0E] font-medium"
          >
            This action can be reversed later by sending a new link request.
          </span>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer"
            style={{ fontFamily: PP }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isUnlinking}
            className="px-5 py-2 bg-[#EF4444] text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            style={{ fontFamily: PP }}
          >
            {isUnlinking ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <UserX size={14} />
                Remove Member
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

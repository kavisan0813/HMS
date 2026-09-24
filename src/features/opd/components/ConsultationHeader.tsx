import React from "react";
import {ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

interface BreadcrumbItem {
  label: string;
  active?: boolean;
}

interface ConsultationHeaderProps {
  roleLabel: string;
  moduleLabel?: string;
  pageTitle: string;
  subtitle?: string;
  statusBadge?: React.ReactNode;
  breadcrumbs: BreadcrumbItem[];
  actions?: React.ReactNode;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const ConsultationHeader: React.FC<ConsultationHeaderProps> = ({
  pageTitle,
  subtitle,
  statusBadge,
  actions,
  onBack,
  showBackButton = true,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      try {
        navigate(-1);
      } catch {
        window.history.back();
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        {showBackButton && (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 mb-3 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
            style={{ fontFamily: RB }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}
        <div className="flex items-center gap-3">
          <h1
            className="text-xl font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            {pageTitle}
          </h1>
          {statusBadge}
        </div>
        {subtitle && (
          <p
            className="text-xs text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">{actions}</div>
    </div>
  );
};

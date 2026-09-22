import React from "react";
import { ChevronRight, ArrowLeft } from "lucide-react";
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
  roleLabel,
  moduleLabel = "OPD Consultation",
  pageTitle,
  subtitle,
  statusBadge,
  breadcrumbs,
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
      } catch (err) {
        console.log(err);
        window.history.back();
      }
    }
  };

  return (
    <div className="bg-white border-b border-[#E5E7EB] px-6 py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div
            className="flex items-center gap-2 text-xs text-[#64748B] mb-1"
            style={{ fontFamily: RB }}
          >
            <span>{roleLabel}</span>
            <ChevronRight size={12} className="text-slate-400" />
            <span>{moduleLabel}</span>
            {breadcrumbs.map((b) => (
              <React.Fragment key={b.label}>
                <ChevronRight size={12} className="text-slate-400" />
                <span
                  className={b.active ? "font-semibold text-[#0D47A1]" : ""}
                >
                  {b.label}
                </span>
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              {pageTitle}
            </h1>
            {statusBadge}
          </div>
          {subtitle && (
            <p
              className="text-sm text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] hover:bg-slate-50 text-xs font-semibold transition-all shadow-sm cursor-pointer"
              style={{ fontFamily: PP }}
            >
              <ArrowLeft size={14} />
              Back
            </button>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
};

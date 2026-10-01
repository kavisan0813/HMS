import { Check, ShieldCheck } from "lucide-react";
import logoImage from "../../../assets/safehandshospital_logo.webp";
import { useHospitalBranding } from "../../settings/hooks/useHospitalBranding";

export function BrandingPanel() {
  const { logoUrl } = useHospitalBranding();
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-linear-to-br from-[#083A84] via-[#0D47A1] to-[#082F6B] px-10 xl:px-14 py-12 text-white overflow-hidden relative select-none min-h-screen">
      {/* Decorative Soft Ambient Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-lg h-160 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-lg h-160 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center">
          <img
            src={logoUrl || logoImage}
            alt="Hospital Logo"
            className="h-16 w-auto object-contain filter drop-shadow-md"
          />
        </div>

        {/* Enterprise Compliance Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-body backdrop-blur-sm">
          <ShieldCheck className="h-4 w-4 text-green" />
          <span className="opacity-90 font-medium">Enterprise Secure</span>
        </div>
      </div>

      {/* Center Section — LARGER Container & BIGGER Centered Logo */}
      <div className="relative z-10 my-auto py-10 flex flex-col items-center justify-center text-center">
        <div className="relative flex flex-col items-center justify-center w-full max-w-xl lg:max-w-2xl">
          {/* Backing Ambient Glow */}
          <div className="absolute w-104 h-104 bg-white/15 rounded-full blur-3xl animate-pulse pointer-events-none" />

          {/* Extra Large Centered Logo Image */}
          <img
            src={logoUrl || logoImage}
            alt="Hospital Logo"
            className="h-64 sm:h-72 md:h-80 lg:h-96 w-auto object-contain filter drop-shadow-2xl hover:scale-105 transition-transform duration-300 relative z-20"
          />

          <div className="mt-8" />
        </div>
      </div>

      {/* Bottom Text Content & Features */}
      <div className="relative z-10 space-y-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-white leading-tight">
            Care You Can Trust,
            <br />
            <span className="text-accent">Health We Protect</span>
          </h1>
          <p className="mt-2.5 text-sm text-white/80 font-body leading-relaxed max-w-md">
            A comprehensive hospital management system built for modern
            healthcare teams. Efficient, secure, and patient-centric.
          </p>
        </div>

        {/* Checkmark Features List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {[
            "Secure Patient Management",
            "Appointment Scheduling",
            "Billing",
            "Clinical Workflows",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-secondary/30 border border-accent/40 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-green stroke-3" />
              </div>
              <span className="text-xs font-medium text-white/90 font-heading">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  ArrowLeft,
  Printer,
  FileText,
  Download,
  Activity,
  User,
  CheckCircle2,
  Clock,
  Layers,
  Check,
  Building2,
  Mail,
  Phone,
  ExternalLink,
  Server,
  Database,
} from "lucide-react";
import { useAuditLogDetail, useMainAuditLogs } from "../hooks/useAuditLog";
import {
  SeverityBadgeLarge,
  StatusBadgeLarge,
} from "../components/AuditBadges";
import type { AuditCategory } from "../types/auditlog.types";

const PP = "Poppins, sans-serif";
const RB = "Roboto, sans-serif";

interface AuditLogDetailsPageProps {
  recordId: string;
  sourceCategory?: AuditCategory;
  onBack: () => void;
  onNavigateCategory?: (category: AuditCategory) => void;
}

function safeArray<T>(data: T[] | undefined | null): T[] {
  return Array.isArray(data) ? data : [];
}

export function AuditLogDetailsPage({
  recordId,
  sourceCategory = "All Logs",
  onBack,
}: AuditLogDetailsPageProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const {
    data: record,
    isLoading,
    isError,
  } = useAuditLogDetail(recordId, sourceCategory);
  const { data: relatedData } = useMainAuditLogs({ page: 0, size: 10 });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const relatedAuditLogs = safeArray(relatedData?.content);

  if (isLoading) {
    return (
      <div
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F1F5F9]"
        style={{ fontFamily: RB }}
      >
        <div className="py-16 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-spin">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h3
              className="text-base font-bold text-gray-800"
              style={{ fontFamily: PP }}
            >
              Loading Audit Log Details...
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Fetching audit record {recordId}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F1F5F9]"
        style={{ fontFamily: RB }}
      >
        <div className="py-16 text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <h3
              className="text-base font-bold text-gray-800"
              style={{ fontFamily: PP }}
            >
              Audit Record Not Found
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {isError
                ? `Failed to load audit record ${recordId}. The server encountered an internal error.`
                : `The audit record ${recordId} could not be found.`}
            </p>
          </div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-lg"
            style={{ backgroundColor: "#0D47A1" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Audit Logs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F1F5F9]"
      style={{ fontFamily: RB }}
    >
      {toastMessage && (
        <div className="fixed bottom-16 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-gray-700 text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* WORKSPACE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>

            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                title="Back to Audit Logs"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1
                    className="text-2xl font-bold text-gray-900"
                    style={{ fontFamily: PP }}
                  >
                    Audit Log Details
                  </h1>
                  <span className="px-3 py-1 bg-blue-50 text-blue-900 font-mono font-bold rounded-lg border border-blue-200 text-xs">
                    {record.id}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Complete audit trail and event information for administrative
                  verification.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Audit Logs
            </button>
            <button
              onClick={() => showToast("Printing audit log details...")}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-gray-600" />
              Print
            </button>
            <button
              onClick={() => showToast("Exporting Audit Details PDF...")}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4 text-red-600" />
              Export PDF
            </button>
            <button
              onClick={() => showToast("Exporting JSON raw payload...")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm"
              style={{ backgroundColor: "#0D47A1" }}
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        </div>

      {/* CONTENT LAYOUT */}
      <div className="space-y-6">
        {/* SECTION 1: AUDIT EVENT SUMMARY */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-700" />
              <h2
                className="text-base font-bold text-gray-900"
                style={{ fontFamily: PP }}
              >
                Section 1: Audit Event Summary
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <SeverityBadgeLarge severity={record.severity} />
              <StatusBadgeLarge status={record.status} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Audit ID
              </span>
              <span className="font-mono font-bold text-gray-900 text-xs mt-0.5 block">
                {record.id}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Event ID
              </span>
              <span className="font-mono font-bold text-blue-900 text-xs mt-0.5 block">
                {record.id}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Category
              </span>
              <span className="font-semibold text-gray-800 text-xs mt-0.5 block">
                {record.category}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Module
              </span>
              <span className="font-bold text-blue-900 text-xs mt-0.5 block">
                {record.module}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Screen Name
              </span>
              <span className="font-medium text-gray-700 text-xs mt-0.5 block">
                {record.module} Workspace
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Timestamp
              </span>
              <span className="font-mono font-bold text-gray-900 text-xs mt-0.5 block">
                {record.timestamp}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Generated By
              </span>
              <span className="font-bold text-gray-900 text-xs mt-0.5 block">
                {record.user}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Department
              </span>
              <span className="font-medium text-gray-700 text-xs mt-0.5 block">
                {record.department}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                User Role
              </span>
              <span className="font-semibold text-gray-800 text-xs mt-0.5 block">
                {record.userRole}
              </span>
            </div>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">
              Action Performed
            </span>
            <div className="p-3 bg-blue-50 text-blue-950 font-bold rounded-xl border border-blue-100 text-sm">
              {record.action}
            </div>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">
              Full Event Description
            </span>
            <p className="p-3.5 bg-gray-50 text-gray-800 text-xs rounded-xl leading-relaxed border border-gray-200">
              {record.description}
            </p>
          </div>
        </div>

        {/* SECTION 2: USER INFORMATION */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <User className="w-5 h-5 text-teal-700" />
            <h2
              className="text-base font-bold text-gray-900"
              style={{ fontFamily: PP }}
            >
              Section 2: User Information
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 rounded-xl border border-gray-200">
            <div className="w-14 h-14 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-lg border-2 border-blue-200 shadow-sm">
              {(record.user || "?")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="flex-1 space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">
                  {record.user}
                </h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-semibold text-[11px]">
                  {record.userRole}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-gray-600 pt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  {record.department}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {record.userId || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />—
                </span>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[11px] block">
                Status: {record.status}
              </span>
              <span className="text-[11px] text-gray-400 mt-1 block">
                Last Login: {record.loginTime || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: ACTIVITY INFORMATION */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Layers className="w-5 h-5 text-purple-700" />
            <h2
              className="text-base font-bold text-gray-900"
              style={{ fontFamily: PP }}
            >
              Section 3: Activity Information
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Action Performed
              </span>
              <span className="font-bold text-gray-900 text-xs mt-0.5 block">
                {record.action}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Module
              </span>
              <span className="font-bold text-blue-900 text-xs mt-0.5 block">
                {record.module}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Related Record ID
              </span>
              <span className="font-mono font-bold text-purple-700 text-xs mt-0.5 block">
                {record.recordId || record.id}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                IP Address
              </span>
              <span className="font-mono text-gray-700 text-xs mt-0.5 block">
                {record.ipAddress}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Device Type
              </span>
              <span className="font-medium text-gray-800 text-xs mt-0.5 block">
                {record.device}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Browser
              </span>
              <span className="font-medium text-gray-800 text-xs mt-0.5 block">
                {record.browser}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Auth Method
              </span>
              <span className="font-semibold text-emerald-700 text-xs mt-0.5 block">
                {record.authenticationMethod || "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Session ID
              </span>
              <span className="font-mono text-gray-600 text-[11px] mt-0.5 block truncate">
                {record.sessionId || "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Network
              </span>
              <span className="font-medium text-gray-700 text-xs mt-0.5 block">
                {record.metadata?.network
                  ? String(record.metadata.network)
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 4: AUDIT TIMELINE */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Clock className="w-5 h-5 text-indigo-700" />
            <h2
              className="text-base font-bold text-gray-900"
              style={{ fontFamily: PP }}
            >
              Section 4: Audit Timeline
            </h2>
          </div>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {[
              {
                title: record.action,
                time: record.timestamp,
                desc: record.description,
              },
              ...(record.changes || []).map((change) => ({
                title: `Changed ${change.field}`,
                time: record.timestamp,
                desc: `${change.before} → ${change.after}`,
              })),
            ].map((step) => (
              <div
                key={step.title}
                className="relative flex items-start gap-4 text-xs"
              >
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white">
                  <Check className="w-3 h-3" />
                </div>
                <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900">
                      {step.title}
                    </span>
                    <span className="font-mono text-gray-400 text-[11px]">
                      {step.time}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: DATA COMPARISON (CONDITIONAL) */}
        {record.category === "Data Changes" && record.fieldChanged && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Database className="w-5 h-5 text-teal-700" />
              <h2
                className="text-base font-bold text-gray-900"
                style={{ fontFamily: PP }}
              >
                Section 5: Data Comparison (Field Modifications)
              </h2>
            </div>
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-700">
                Modified Field:{" "}
                <span className="font-bold text-blue-900">
                  {record.fieldChanged}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <span className="text-xs font-bold text-red-700 block mb-1">
                    Previous Value (Before)
                  </span>
                  <div className="font-mono text-xs text-red-900 font-bold bg-white p-3 rounded-lg border border-red-200">
                    {record.oldValue || "N/A"}
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-700 block mb-1">
                    Updated Value (After)
                  </span>
                  <div className="font-mono text-xs text-emerald-900 font-bold bg-white p-3 rounded-lg border border-emerald-200">
                    {record.newValue || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: RELATED RECORDS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <ExternalLink className="w-5 h-5 text-blue-700" />
            <h2
              className="text-base font-bold text-gray-900"
              style={{ fontFamily: PP }}
            >
              Section 6: Related Records
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              {
                label: `Record: ${record.recordId || record.id}`,
                type: "Record",
              },
              { label: `Module: ${record.module}`, type: "Module" },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => showToast(`Navigating to ${chip.label}...`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold text-xs rounded-xl border border-blue-200 transition-colors"
              >
                <span>{chip.label}</span>
                <ExternalLink className="w-3 h-3 text-blue-600" />
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 7: TECHNICAL INFORMATION */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Server className="w-5 h-5 text-gray-700" />
            <h2
              className="text-base font-bold text-gray-900"
              style={{ fontFamily: PP }}
            >
              Section 7: Technical Information
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                IP Address
              </span>
              <span className="font-mono font-bold text-gray-900 text-xs mt-0.5 block">
                {record.ipAddress}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Operating System
              </span>
              <span className="font-medium text-gray-800 text-xs mt-0.5 block">
                {record.metadata?.operatingSystem
                  ? String(record.metadata.operatingSystem)
                  : "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Device Type
              </span>
              <span className="font-medium text-gray-800 text-xs mt-0.5 block">
                {record.device}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                MAC Address
              </span>
              <span className="font-mono text-gray-600 text-xs mt-0.5 block">
                {record.metadata?.macAddress
                  ? String(record.metadata.macAddress)
                  : "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Hospital Branch
              </span>
              <span className="font-semibold text-blue-900 text-xs mt-0.5 block">
                {record.metadata?.branch
                  ? String(record.metadata.branch)
                  : "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Session Duration
              </span>
              <span className="font-mono text-gray-700 text-xs mt-0.5 block">
                {record.sessionDuration || "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Login Method
              </span>
              <span className="font-semibold text-emerald-700 text-xs mt-0.5 block">
                {record.authenticationMethod || "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">
                Timezone
              </span>
              <span className="font-mono text-gray-600 text-xs mt-0.5 block">
                {record.metadata?.timezone
                  ? String(record.metadata.timezone)
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL: RELATED AUDIT EVENTS */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3
              className="text-base font-bold text-gray-900"
              style={{ fontFamily: PP }}
            >
              Bottom Panel: Related Audit Events
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Latest related audit records from the system log stream.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            {relatedAuditLogs.length} Related Records
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Module</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Performed By</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white font-medium text-gray-800">
              {relatedAuditLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-blue-50/40 transition-colors"
                >
                  <td className="p-3.5 font-mono text-gray-500">
                    {log.timestamp}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-gray-100 font-medium text-gray-700">
                      {log.module}
                    </span>
                  </td>
                  <td className="p-3.5 font-semibold text-blue-950">
                    {log.action}
                  </td>
                  <td className="p-3.5 font-bold text-gray-900">{log.user}</td>
                  <td className="p-3.5">
                    <SeverityBadgeLarge severity={log.severity} />
                  </td>
                  <td className="p-3.5">
                    <StatusBadgeLarge status={log.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

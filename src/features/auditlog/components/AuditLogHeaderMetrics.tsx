import React from "react";
import { ArrowUpRight } from "lucide-react";
import type { AuditCategory, AuditMetric } from "../types/auditlog.types";

const PP = "Poppins, sans-serif";

interface WorkspaceCard {
  id: AuditCategory;
  title: string;
  count: number | string;
  description: string;
  icon: React.ReactNode;
}

interface AuditLogHeaderMetricsProps {
  currentWorkspace: AuditCategory;
  onSelectWorkspace: (workspace: AuditCategory) => void;
  metrics: AuditMetric[] | undefined;
  workspaceCards: WorkspaceCard[];
}

export function AuditLogHeaderMetrics({
  currentWorkspace,
  onSelectWorkspace,
  metrics,
  workspaceCards,
}: AuditLogHeaderMetricsProps) {
  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      {metrics && metrics.length > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.code || metric.label}
              className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-1"
            >
              <p className="text-xs font-semibold text-gray-500">
                {metric.label}
              </p>
              <div className="flex items-baseline justify-between">
                <span
                  className="text-2xl font-bold text-gray-900"
                  style={{ fontFamily: PP }}
                >
                  {typeof metric.value === "number"
                    ? metric.value.toLocaleString()
                    : metric.value}
                </span>
                {metric.trend !== undefined && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />
                    {metric.trend > 0
                      ? `+${metric.trend}%`
                      : `${metric.trend}%`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Workspace Stream Cards Selector */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2
              className="text-base font-bold text-gray-900"
              style={{ fontFamily: PP }}
            >
              Audit Log Streams
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select a specialized event stream to audit system activity,
              access, or data mutations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {workspaceCards.map((card) => {
            const isActive = currentWorkspace === card.id;
            return (
              <button
                key={card.id}
                onClick={() => onSelectWorkspace(card.id)}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? "bg-[#0D47A1] text-white border-[#0D47A1] shadow-md scale-[1.01]"
                    : "bg-gray-50/70 hover:bg-gray-100/80 text-gray-800 border-gray-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-blue-50 text-[#0D47A1]"
                      }`}
                    >
                      {card.icon}
                    </div>
                  </div>
                  <h3
                    className={`text-sm font-bold ${
                      isActive ? "text-white" : "text-gray-900"
                    }`}
                    style={{ fontFamily: PP }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className={`text-[11px] mt-1 leading-relaxed ${
                      isActive ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {card.description}
                  </p>
                </div>
                <div
                  className={`mt-4 pt-2 border-t text-[11px] font-bold flex items-center justify-between ${
                    isActive
                      ? "border-white/20 text-blue-100"
                      : "border-gray-100 text-gray-500"
                  }`}
                >
                  <span>
                    {typeof card.count === "number"
                      ? `${card.count.toLocaleString()} records`
                      : "Count unavailable"}
                  </span>
                  {isActive && (
                    <span className="text-[9px] tracking-wider font-mono bg-white/20 px-1.5 py-0.5 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

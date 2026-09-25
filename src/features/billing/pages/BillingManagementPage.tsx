import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../auth/store/auth.store";
import {
  useBillingList,
  useBillingDashboard,
  billingKeys,
} from "../hooks/useBilling";
import { billingService } from "../services/billing.service";
import { BillingHeader } from "../components/BillingHeader";
import { BillingKPICards } from "../components/BillingKPICards";
import { BillingTable } from "../components/BillingTable";
import { BillingPagination } from "../components/BillingPagination";
import { mapApiBillToInvoiceRecord as mapBillToInvoice } from "../utils/billing.utils";
import { RB } from "../constants/billing.constants";

export function BillingManagementPage({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const isPatient = String(role).toUpperCase() === "PATIENT";

  // Fetch bills list from API
  const [pageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [activeTab, setActiveTab] = useState<
    | "all"
    | "ready_for_billing"
    | "pending_payment"
    | "partially_paid"
    | "paid"
    | "refunded"
  >("all");

  const queryParams = useMemo(() => {
    if (isPatient) return undefined;
    const params: Record<string, string | number | boolean | undefined> = {
      page: currentPage - 1,
      size: pageSize,
      sortBy: "createdAt",
      direction: "desc",
      search: searchQuery || undefined,
    };

    if (activeTab === "ready_for_billing") {
      params.status = "READY_FOR_BILLING";
      params.paymentStatus = "UNPAID";
    } else if (activeTab === "pending_payment") {
      params.status = "FINALIZED";
      params.paymentStatus = "UNPAID";
    } else if (activeTab === "partially_paid") {
      params.paymentStatus = "PARTIALLY_PAID";
    } else if (activeTab === "paid") {
      params.paymentStatus = "PAID";
    } else if (activeTab === "refunded") {
      params.paymentStatus = "REFUNDED";
    }

    if (statusFilter !== "All" && activeTab === "all") {
      params.paymentStatus = statusFilter.toUpperCase().replace(" ", "_");
    }
    if (methodFilter !== "All") {
      params.paymentMethod = methodFilter.toUpperCase().replace(" ", "_");
    }

    if (dateFilter !== "All") {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      if (dateFilter === "Today") {
        params.fromDate = todayStr;
        params.toDate = todayStr;
      } else if (dateFilter === "Yesterday") {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        const yestStr = yest.toISOString().split("T")[0];
        params.fromDate = yestStr;
        params.toDate = yestStr;
      } else if (dateFilter === "This Week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.fromDate = weekAgo.toISOString().split("T")[0];
        params.toDate = todayStr;
      } else if (dateFilter === "This Month") {
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        params.fromDate = monthAgo.toISOString().split("T")[0];
        params.toDate = todayStr;
      } else if (dateFilter === "Custom" && startDate && endDate) {
        params.fromDate = startDate;
        params.toDate = endDate;
      }
    }

    return params;
  }, [
    isPatient,
    currentPage,
    pageSize,
    searchQuery,
    activeTab,
    statusFilter,
    methodFilter,
    dateFilter,
    startDate,
    endDate,
  ]);

  const { data: billsData, isLoading: listLoading } = useBillingList(
    isPatient ? undefined : queryParams,
  );
  const { data: overallBillsData } = useBillingList(
    isPatient
      ? undefined
      : { page: 0, size: 500, sortBy: "createdAt", direction: "desc" },
  );
  const { data: dashboardData, isLoading: dashboardLoading } =
    useBillingDashboard();

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason?: string }) =>
      billingService.cancelBill(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });

  // Map API bills to InvoiceRecord format for current filtered view
  const allInvoices = useMemo(() => {
    if (!billsData?.bills) return [];
    return billsData.bills.map(mapBillToInvoice);
  }, [billsData]);

  // Overall invoices for stable KPI stats across tab switching
  const overallInvoices = useMemo(() => {
    if (!overallBillsData?.bills) return allInvoices;
    return overallBillsData.bills.map(mapBillToInvoice);
  }, [overallBillsData, allInvoices]);

  const totalCount = billsData?.totalElements || 0;

  const normalizedRole = String(role).toUpperCase();
  const isAdminReadOnly =
    normalizedRole === "DOCTOR" || normalizedRole === "NURSE" || isPatient;
  const canCancelInvoice = ["SUPER_ADMIN", "HOSPITAL_ADMIN", "ADMIN"].includes(
    normalizedRole,
  );

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setMethodFilter("All");
    setDeptFilter("All");
    setDateFilter("All");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleCancelInvoice = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this invoice? This action cannot be undone.",
    );
    if (!confirmed) return;
    try {
      await cancelMutation.mutateAsync({
        id,
        reason: "Cancelled by " + (user?.name || "User"),
      });
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  // Patient View
  if (isPatient) {
    return (
      <div className="w-full bg-[#F1F5F9] min-h-screen p-4 md:p-6 pb-28 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
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
            <h1 className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight">
              My Bills
            </h1>
            <p className="text-xs md:text-sm text-[#64748B] mt-0.5">
              View all your invoices, payment status and download official
              receipts.
            </p>
          </div>
        </div>

        <BillingTable
          invoices={allInvoices}
          isAdminReadOnly={true}
          onViewInvoiceDetailsClick={(inv) =>
            navigate(`/billing/invoice/${inv.id}`)
          }
          onCancelInvoice={canCancelInvoice ? handleCancelInvoice : undefined}
          onViewPaymentHistory={(inv) =>
            navigate(`/billing/history?billId=${encodeURIComponent(inv.id)}`)
          }
          onPrintInvoice={(inv) => navigate(`/billing/invoice/${inv.id}/print`)}
        />

        <BillingPagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </div>
    );
  }

  // Staff View
  return (
    <div className="flex-1 overflow-y-auto bg-[#F1F5F9] min-h-screen p-4 md:p-6 space-y-6">
      <BillingHeader
        onBack={handleBack}
        onGenerateInvoice={() => navigate("/billing/create")}
        onViewPayments={() => navigate("/billing/history")}
        onViewDailyReport={() => navigate("/billing/report")}
        isAdminReadOnly={isAdminReadOnly}
      />

      <BillingKPICards
        dashboardData={dashboardData}
        invoices={overallInvoices}
        isLoading={dashboardLoading}
      />

      {/* Unified status tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap">
        {(
          [
            { id: "all", label: "All" },
            { id: "ready_for_billing", label: "Pending" },
            { id: "pending_payment", label: "Unpaid Invoices" },
            { id: "partially_paid", label: "Partially Paid" },
            { id: "paid", label: "Paid" },
            { id: "refunded", label: "Refunded" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
            }}
            className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[#0D47A1] text-[#0D47A1]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <BillingTable
        invoices={allInvoices}
        isAdminReadOnly={isAdminReadOnly}
        loading={listLoading}
        title={
          activeTab === "all"
            ? "All Billing Records"
            : activeTab === "ready_for_billing"
              ? "Pending (Completed, Billable Patients)"
              : activeTab === "pending_payment"
                ? "Unpaid Invoices"
                : activeTab === "partially_paid"
                  ? "Partially Paid Invoices"
                  : activeTab === "paid"
                    ? "Fully Paid Invoices"
                    : "Refunded Invoices"
        }
        subtitle="Real-time invoice management, payment statuses, and cashier settlement actions."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        methodFilter={methodFilter}
        onMethodChange={setMethodFilter}
        deptFilter={deptFilter}
        onDeptChange={setDeptFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onResetFilters={resetFilters}
        onViewInvoiceDetailsClick={(inv) =>
          navigate(`/billing/invoice/${inv.id}`)
        }
        onCollectPaymentClick={(inv) =>
          navigate(`/billing/collect-payment/${inv.id}`)
        }
        onGenerateInvoiceClick={(inv) => {
          const billIdParam =
            inv.id && inv.id !== "undefined"
              ? `billId=${encodeURIComponent(inv.id)}&`
              : "";
          navigate(
            `/billing/create?${billIdParam}appointmentId=${encodeURIComponent(String(inv.appointmentId ?? ""))}&encounterId=${encodeURIComponent(String(inv.encounterId ?? ""))}&patientId=${encodeURIComponent(String(inv.patientId ?? ""))}&patientMrn=${encodeURIComponent(inv.mrn)}&doctorId=${encodeURIComponent(String(inv.doctorId ?? ""))}`,
          );
        }}
        onCancelInvoice={canCancelInvoice ? handleCancelInvoice : undefined}
        onViewPaymentHistory={(inv) =>
          navigate(`/billing/history?billId=${encodeURIComponent(inv.id)}`)
        }
        onPrintInvoice={(inv) => navigate(`/billing/invoice/${inv.id}/print`)}
      />
    </div>
  );
}

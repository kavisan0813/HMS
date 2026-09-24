import { useState, useMemo, useReducer } from "react";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Clock,
  Printer,
  ChevronRight,
  TrendingUp,
  Filter,
  Search,
  PieChart as PieChartIcon,
  AlertCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Eye,
  BarChart3,
} from "lucide-react";
import { exportDataToCsv } from "../utils/export.utils";

type ReportState = {
  searchQuery: string;
  dateRange: string;
  deptFilter: string;
  doctorFilter: string;
  visitTypeFilter: string;
  payStatusFilter: string;
  aptStatusFilter: string;
  appliedFilters: {
    dateRange: string;
    dept: string;
    doctor: string;
    visitType: string;
    payStatus: string;
    aptStatus: string;
  };
  isLoading: boolean;
};

type ReportAction =
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_FILTER"; field: string; value: string }
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; payload: ReportState["appliedFilters"] }
  | { type: "RESET_FILTERS" }
  | { type: "RESET_FILTERS_SUCCESS"; payload: ReportState["appliedFilters"] };

const initialState: ReportState = {
  searchQuery: "",
  dateRange: "Today",
  deptFilter: "All Departments",
  doctorFilter: "All Doctors",
  visitTypeFilter: "All Visit Types",
  payStatusFilter: "All Payment Statuses",
  aptStatusFilter: "All Appointment Statuses",
  appliedFilters: {
    dateRange: "Today",
    dept: "All Departments",
    doctor: "All Doctors",
    visitType: "All Visit Types",
    payStatus: "All Payment Statuses",
    aptStatus: "All Appointment Statuses",
  },
  isLoading: false,
};

function reducer(state: ReportState, action: ReportAction): ReportState {
  switch (action.type) {
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "SET_FILTER":
      return { ...state, [action.field]: action.value };
    case "LOAD_START":
      return { ...state, isLoading: true };
    case "LOAD_SUCCESS":
      return { ...state, isLoading: false, appliedFilters: action.payload };
    case "RESET_FILTERS":
      return {
        ...initialState,
        isLoading: true,
      };
    case "RESET_FILTERS_SUCCESS":
      return {
        ...state,
        isLoading: false,
        appliedFilters: action.payload,
      };
    default:
      return state;
  }
}
import { PP, RB } from "../constants/reports.constants";
import type {
  KpiRevenueRecord,
  KpiAppointmentRecord,
  KpiPatientRecord,
  KpiConsultationRecord,
  KpiPendingPaymentRecord,
  DailyRevenueDetail,
  DailyAppointmentDetail,
  PatientMasterRecord,
  InvoiceRegisterRecord,
} from "../types/reports.types";
import {
  useDailyRevenueDetails,
  useDailyAppointmentDetails,
  usePatientMasterRegister,
  useInvoiceRegister,
  useCollectionRateSummary,
  extractList,
} from "../hooks/useReports";
import {
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "../../../common/components/recharts-lazy";

const renderStatusBadge = (status: string) => {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    Paid: {
      bg: "bg-emerald-50 border-teal-200",
      text: "text-[#009688]",
      dot: "bg-[#009688]",
    },
    Completed: {
      bg: "bg-emerald-50 border-teal-200",
      text: "text-[#009688]",
      dot: "bg-[#009688]",
    },
    "Partially Paid": {
      bg: "bg-blue-50 border-blue-200",
      text: "text-[#0D47A1]",
      dot: "bg-[#0D47A1]",
    },
    "Checked-In": {
      bg: "bg-blue-50 border-blue-200",
      text: "text-[#0D47A1]",
      dot: "bg-[#0D47A1]",
    },
    "In-Progress": {
      bg: "bg-blue-50 border-blue-200",
      text: "text-[#0D47A1]",
      dot: "bg-[#0D47A1]",
    },
    Pending: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-[#F59E0B]",
      dot: "bg-[#F59E0B]",
    },
    Scheduled: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-[#F59E0B]",
      dot: "bg-[#F59E0B]",
    },
    Cancelled: {
      bg: "bg-red-50 border-red-200",
      text: "text-[#EF4444]",
      dot: "bg-[#EF4444]",
    },
    Overdue: {
      bg: "bg-red-50 border-red-200",
      text: "text-[#EF4444]",
      dot: "bg-[#EF4444]",
    },
  };

  const style = map[status] || {
    bg: "bg-slate-50 border-slate-200",
    text: "text-[#64748B]",
    dot: "bg-[#64748B]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
};

export function DashboardKpiDetailScreen({
  onBack,
  initialKpi = "Today's Revenue",
}: {
  onBack?: () => void;
  onOpenRelatedReport?: () => void;
  initialKpi?: string;
}) {
  // State
  const [selectedKpi, setSelectedKpi] = useState<string>(initialKpi);
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    searchQuery,
    dateRange,
    deptFilter,
    doctorFilter,
    visitTypeFilter,
    payStatusFilter,
    aptStatusFilter,
    appliedFilters,
    isLoading,
  } = state;

  // API Data Hooks & Dynamic Parameter Mapping
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate] = useState(today);
  const [toDate] = useState(today);

  const getDateRange = (range: string) => {
    const now = new Date();
    if (range === "Today") return { fromDate: today, toDate: today };
    if (range === "Yesterday") {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      return { fromDate: yStr, toDate: yStr };
    }
    if (range === "7 Days" || range === "Last 7 Days") {
      const from = new Date(now);
      from.setDate(now.getDate() - 7);
      return { fromDate: from.toISOString().slice(0, 10), toDate: today };
    }
    if (range === "30 Days" || range === "This Month") {
      const from = new Date(now);
      from.setDate(now.getDate() - 30);
      return { fromDate: from.toISOString().slice(0, 10), toDate: today };
    }
    if (range === "Custom" && fromDate && toDate) {
      return { fromDate, toDate };
    }
    return { fromDate: fromDate || today, toDate: toDate || today };
  };

  const dates = getDateRange(appliedFilters.dateRange);

  const reportFilters = useMemo(
    () => ({
      fromDate: dates.fromDate,
      toDate: dates.toDate,
      doctorId:
        appliedFilters.doctor !== "All Doctors"
          ? appliedFilters.doctor
          : undefined,
      departmentId:
        appliedFilters.dept !== "All Departments"
          ? appliedFilters.dept
          : undefined,
      status:
        appliedFilters.payStatus !== "All Payment Statuses"
          ? appliedFilters.payStatus
          : appliedFilters.aptStatus !== "All Appointment Statuses"
            ? appliedFilters.aptStatus
            : undefined,
      appointmentType:
        appliedFilters.visitType !== "All Visit Types"
          ? appliedFilters.visitType
          : undefined,
      page: 0,
      size: 50,
    }),
    [dates, appliedFilters],
  );

  const { data: rawRevenueDetails } = useDailyRevenueDetails(reportFilters);
  const { data: rawApptDetails } = useDailyAppointmentDetails(reportFilters);
  const { data: rawPatientRegister } = usePatientMasterRegister(reportFilters);
  const { data: rawInvoiceRegister } = useInvoiceRegister(reportFilters);
  const { data: collectionRateSummaryData } =
    useCollectionRateSummary(reportFilters);

  const revenueList = useMemo(
    () => extractList<DailyRevenueDetail>(rawRevenueDetails),
    [rawRevenueDetails],
  );
  const apptList = useMemo(
    () => extractList<DailyAppointmentDetail>(rawApptDetails),
    [rawApptDetails],
  );
  const patientList = useMemo(
    () => extractList<PatientMasterRecord>(rawPatientRegister),
    [rawPatientRegister],
  );
  const invoiceList = useMemo(
    () => extractList<InvoiceRegisterRecord>(rawInvoiceRegister),
    [rawInvoiceRegister],
  );

  // Enterprise Export & Print Modal States
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "csv">(
    "pdf",
  );
  const [exportScope, setExportScope] = useState<
    "current" | "filtered" | "complete"
  >("filtered");
  const [includeOptions, setIncludeOptions] = useState({
    kpi: true,
    charts: true,
    tables: true,
    filters: true,
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleApplyFilters = () => {
    dispatch({ type: "LOAD_START" });
    setTimeout(() => {
      dispatch({
        type: "LOAD_SUCCESS",
        payload: {
          dateRange,
          dept: deptFilter,
          doctor: doctorFilter,
          visitType: visitTypeFilter,
          payStatus: payStatusFilter,
          aptStatus: aptStatusFilter,
        },
      });
    }, 300);
  };

  const handleResetFilters = () => {
    dispatch({ type: "RESET_FILTERS" });
    setTimeout(() => {
      dispatch({
        type: "RESET_FILTERS_SUCCESS",
        payload: {
          dateRange: "Today",
          dept: "All Departments",
          doctor: "All Doctors",
          visitType: "All Visit Types",
          payStatus: "All Payment Statuses",
          aptStatus: "All Appointment Statuses",
        },
      });
    }, 300);
  };

  // Determine active KPI category
  const isRevenueKpi =
    selectedKpi.includes("Revenue") || selectedKpi.includes("Collected");
  const isAppointmentKpi =
    selectedKpi.includes("Appointments") ||
    selectedKpi.includes("OPD Appointments");
  const isPatientKpi =
    selectedKpi.includes("Registered") || selectedKpi.includes("Patients");
  const isConsultationKpi =
    selectedKpi.includes("Consultations") ||
    selectedKpi.includes("OPD Consultations");
  const isPendingKpi =
    selectedKpi.includes("Pending") || selectedKpi.includes("Pending Payments");

  // Dynamic filter visibility rules
  const showPayStatusFilter = isRevenueKpi || isPendingKpi;
  const showAptStatusFilter = isAppointmentKpi;
  const showVisitTypeFilter = isAppointmentKpi || isPatientKpi;

  // Filtered dataset generator based on selected KPI
  const currentDataset = useMemo(() => {
    const q = searchQuery.toLowerCase();

    if (isRevenueKpi) {
      const source = revenueList.length > 0 ? revenueList : invoiceList;
      let mapped = source.map(
        (d: DailyRevenueDetail | InvoiceRegisterRecord) => {
          const isDaily = "paymentId" in d;
          const daily = d as DailyRevenueDetail;
          const invoice = d as InvoiceRegisterRecord;
          return {
            invoiceId: isDaily
              ? daily.paymentId ||
                daily.receiptNumber ||
                `INV-${daily.id || ""}`
              : invoice.invoiceNumber || `INV-${invoice.mrn || ""}`,
            patientName:
              "patientName" in d
                ? (d as { patientName: string }).patientName
                : "N/A",
            mrn:
              "mrn" in d
                ? String((d as { mrn: string }).mrn).startsWith("MRN-")
                  ? String((d as { mrn: string }).mrn)
                  : `MRN-${(d as { mrn: string }).mrn}`
                : `MRN-`,
            doctorName:
              (d as { doctorName?: string }).doctorName || "Dr. Sarath",
            department:
              (d as { department?: string }).department || "General Medicine",
            invoiceDate: isDaily
              ? daily.paidAt || today
              : invoice.invoiceDate || today,
            billedAmount: Number(
              isDaily ? daily.amount || 0 : invoice.billedAmount || 0,
            ),
            paidAmount: Number(
              isDaily
                ? daily.paidAmount || daily.amount || 0
                : invoice.paidAmount || 0,
            ),
            invoiceStatus: isDaily
              ? "Paid"
              : (invoice as { status?: string }).status ||
                invoice.paymentStatus ||
                "Paid",
            paymentMethod: isDaily
              ? daily.paymentMethod || "Cash"
              : invoice.paymentMethod || "Cash",
          };
        },
      );
      if (mapped.length === 0) {
        mapped = [
          {
            invoiceId: "INV-2026-001",
            patientName: "Kavisan R",
            mrn: "MRN-1001",
            doctorName: "Dr. sarath",
            department: "EYE DEPT",
            invoiceDate: today,
            billedAmount: 1500,
            paidAmount: 1500,
            invoiceStatus: "Paid",
            paymentMethod: "UPI",
          },
          {
            invoiceId: "INV-2026-002",
            patientName: "Pradeep Kumar",
            mrn: "MRN-1002",
            doctorName: "Dr. pradeep",
            department: "General Medicine",
            invoiceDate: today,
            billedAmount: 2200,
            paidAmount: 2200,
            invoiceStatus: "Paid",
            paymentMethod: "Cash",
          },
        ];
      }
      return mapped.filter((item) => {
        const matchesSearch =
          item.invoiceId.toLowerCase().includes(q) ||
          item.patientName.toLowerCase().includes(q) ||
          item.mrn.toLowerCase().includes(q) ||
          item.doctorName.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q);
        const matchesDept =
          appliedFilters.dept === "All Departments" ||
          item.department
            .toLowerCase()
            .includes(appliedFilters.dept.toLowerCase()) ||
          appliedFilters.dept
            .toLowerCase()
            .includes(item.department.toLowerCase());
        const matchesDoctor =
          appliedFilters.doctor === "All Doctors" ||
          item.doctorName
            .toLowerCase()
            .includes(appliedFilters.doctor.toLowerCase()) ||
          appliedFilters.doctor
            .toLowerCase()
            .includes(item.doctorName.toLowerCase());
        const matchesStatus =
          appliedFilters.payStatus === "All Payment Statuses" ||
          item.invoiceStatus.toLowerCase() ===
            appliedFilters.payStatus.toLowerCase();
        return matchesSearch && matchesDept && matchesDoctor && matchesStatus;
      }) as unknown as KpiRevenueRecord[];
    }

    if (isAppointmentKpi) {
      let mapped = apptList.map((d: DailyAppointmentDetail) => ({
        appointmentId: d.appointmentNumber || `APT-${d.appointmentId || ""}`,
        patientName: d.patientName || "N/A",
        mrn: d.mrn
          ? String(d.mrn).startsWith("MRN-")
            ? String(d.mrn)
            : `MRN-${d.mrn}`
          : `MRN-${d.patientId || ""}`,
        doctorName: d.doctorName || "Dr. sarath",
        department: d.department || "EYE DEPT",
        visitType: d.appointmentType || "New Visit",
        appointmentTime: d.appointmentTime || "09:00 AM",
        tokenNumber: d.queueNumber || "Q-1",
        appointmentStatus: d.status || "Scheduled",
      }));
      if (mapped.length === 0) {
        mapped = [
          {
            appointmentId: "APT-2026-001",
            patientName: "Kavisan R",
            mrn: "MRN-1001",
            doctorName: "Dr. sarath",
            department: "EYE DEPT",
            visitType: "New Visit",
            appointmentTime: "09:30 AM",
            tokenNumber: "Q-101",
            appointmentStatus: "Completed",
          },
          {
            appointmentId: "APT-2026-002",
            patientName: "Pradeep Kumar",
            mrn: "MRN-1002",
            doctorName: "Dr. pradeep",
            department: "General Medicine",
            visitType: "Follow-up",
            appointmentTime: "10:15 AM",
            tokenNumber: "Q-102",
            appointmentStatus: "Scheduled",
          },
        ];
      }
      return mapped.filter((item) => {
        const matchesSearch =
          item.appointmentId.toLowerCase().includes(q) ||
          item.patientName.toLowerCase().includes(q) ||
          item.mrn.toLowerCase().includes(q) ||
          item.doctorName.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q);
        const matchesDept =
          appliedFilters.dept === "All Departments" ||
          item.department
            .toLowerCase()
            .includes(appliedFilters.dept.toLowerCase()) ||
          appliedFilters.dept
            .toLowerCase()
            .includes(item.department.toLowerCase());
        const matchesDoctor =
          appliedFilters.doctor === "All Doctors" ||
          item.doctorName
            .toLowerCase()
            .includes(appliedFilters.doctor.toLowerCase()) ||
          appliedFilters.doctor
            .toLowerCase()
            .includes(item.doctorName.toLowerCase());
        const matchesVisit =
          appliedFilters.visitType === "All Visit Types" ||
          item.visitType.toLowerCase() ===
            appliedFilters.visitType.toLowerCase();
        const matchesStatus =
          appliedFilters.aptStatus === "All Appointment Statuses" ||
          item.appointmentStatus.toLowerCase() ===
            appliedFilters.aptStatus.toLowerCase();
        return (
          matchesSearch &&
          matchesDept &&
          matchesDoctor &&
          matchesVisit &&
          matchesStatus
        );
      }) as unknown as KpiAppointmentRecord[];
    }

    if (isPatientKpi) {
      let mapped = patientList.map((d: PatientMasterRecord) => ({
        patientId: String(d.patientId || ""),
        patientName: d.patientName || d.fullName || "N/A",
        mrn: d.mrn
          ? String(d.mrn).startsWith("MRN-")
            ? String(d.mrn)
            : `MRN-${d.mrn}`
          : `MRN-${d.patientId || ""}`,
        gender: d.gender || "Other",
        age: d.age || 0,
        registrationDate: d.registrationDate || d.createdDate || today,
        registeredBy: d.doctorName || "Dr. sarath",
        visitType: d.visitType || "New Visit",
      }));
      if (mapped.length === 0) {
        mapped = [
          {
            patientId: "1",
            patientName: "Kavisan R",
            mrn: "MRN-1001",
            gender: "Male",
            age: 24,
            registrationDate: today,
            registeredBy: "Dr. sarath",
            visitType: "New Visit",
          },
          {
            patientId: "2",
            patientName: "Pradeep Kumar",
            mrn: "MRN-1002",
            gender: "Male",
            age: 32,
            registrationDate: today,
            registeredBy: "Dr. pradeep",
            visitType: "Follow-up",
          },
        ];
      }
      return mapped.filter((item) => {
        const matchesSearch =
          item.patientName.toLowerCase().includes(q) ||
          item.mrn.toLowerCase().includes(q) ||
          item.gender.toLowerCase().includes(q) ||
          item.registeredBy.toLowerCase().includes(q);
        const matchesDept =
          appliedFilters.dept === "All Departments" ||
          item.registeredBy
            .toLowerCase()
            .includes(appliedFilters.dept.toLowerCase());
        const matchesDoctor =
          appliedFilters.doctor === "All Doctors" ||
          item.registeredBy
            .toLowerCase()
            .includes(appliedFilters.doctor.toLowerCase());
        const matchesVisit =
          appliedFilters.visitType === "All Visit Types" ||
          item.visitType.toLowerCase() ===
            appliedFilters.visitType.toLowerCase();
        return matchesSearch && matchesDept && matchesDoctor && matchesVisit;
      }) as unknown as KpiPatientRecord[];
    }

    if (isConsultationKpi) {
      let mapped = apptList.map((d: DailyAppointmentDetail) => ({
        consultationId: d.appointmentNumber || `CNS-${d.appointmentId || ""}`,
        patientName: d.patientName || "N/A",
        doctorName: d.doctorName || "Dr. sarath",
        department: d.department || "General Medicine",
        consultationTime: d.appointmentTime || "10:00 AM",
        durationMinutes: d.durationMinutes || 30,
        status:
          d.status === "Completed" || d.status === "COMPLETED"
            ? "Completed"
            : "In-Progress",
      }));
      if (mapped.length === 0) {
        mapped = [
          {
            consultationId: "CNS-2026-001",
            patientName: "Kavisan R",
            doctorName: "Dr. sarath",
            department: "EYE DEPT",
            consultationTime: "10:30 AM",
            durationMinutes: 15,
            status: "Completed",
          },
          {
            consultationId: "CNS-2026-002",
            patientName: "Pradeep Kumar",
            doctorName: "Dr. pradeep",
            department: "General Medicine",
            consultationTime: "11:15 AM",
            durationMinutes: 20,
            status: "In-Progress",
          },
        ];
      }
      return mapped.filter((item) => {
        const matchesSearch =
          item.consultationId.toLowerCase().includes(q) ||
          item.patientName.toLowerCase().includes(q) ||
          item.doctorName.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q);
        const matchesDept =
          appliedFilters.dept === "All Departments" ||
          item.department
            .toLowerCase()
            .includes(appliedFilters.dept.toLowerCase());
        const matchesDoctor =
          appliedFilters.doctor === "All Doctors" ||
          item.doctorName
            .toLowerCase()
            .includes(appliedFilters.doctor.toLowerCase());
        return matchesSearch && matchesDept && matchesDoctor;
      }) as unknown as KpiConsultationRecord[];
    }

    if (isPendingKpi) {
      const pendingInvoices = invoiceList.filter(
        (d: InvoiceRegisterRecord) =>
          Number(d.outstandingAmount || 0) > 0 ||
          d.paymentStatus === "Pending" ||
          d.paymentStatus === "UNPAID",
      );
      const source = pendingInvoices.length > 0 ? pendingInvoices : invoiceList;
      let mapped = source.map((d: InvoiceRegisterRecord) => ({
        invoiceId: d.invoiceNumber || `INV-${d.mrn || ""}`,
        patientName: d.patientName || "N/A",
        doctorName: d.doctorName || "Dr. sarath",
        department: d.department || "General Medicine",
        pendingAmount: Number(d.outstandingAmount || d.billedAmount || 500),
        dueDate: d.dueDate || today,
        status:
          d.paymentStatus === "Pending" || d.paymentStatus === "UNPAID"
            ? "Pending"
            : d.paymentStatus === "Partially Paid"
              ? "Partially Paid"
              : "Overdue",
      }));
      if (mapped.length === 0) {
        mapped = [
          {
            invoiceId: "INV-2026-003",
            patientName: "Kavisan R",
            doctorName: "Dr. sarath",
            department: "EYE DEPT",
            pendingAmount: 850,
            dueDate: today,
            status: "Pending",
          },
          {
            invoiceId: "INV-2026-004",
            patientName: "Pradeep Kumar",
            doctorName: "Dr. pradeep",
            department: "General Medicine",
            pendingAmount: 1200,
            dueDate: today,
            status: "Partially Paid",
          },
        ];
      }
      return mapped.filter((item) => {
        const matchesSearch =
          item.invoiceId.toLowerCase().includes(q) ||
          item.patientName.toLowerCase().includes(q) ||
          item.doctorName.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q);
        const matchesDept =
          appliedFilters.dept === "All Departments" ||
          item.department
            .toLowerCase()
            .includes(appliedFilters.dept.toLowerCase());
        const matchesDoctor =
          appliedFilters.doctor === "All Doctors" ||
          item.doctorName
            .toLowerCase()
            .includes(appliedFilters.doctor.toLowerCase());
        return matchesSearch && matchesDept && matchesDoctor;
      }) as unknown as KpiPendingPaymentRecord[];
    }

    return [];
  }, [
    isRevenueKpi,
    isAppointmentKpi,
    isPatientKpi,
    isConsultationKpi,
    isPendingKpi,
    searchQuery,
    appliedFilters,
    revenueList,
    apptList,
    patientList,
    invoiceList,
    today,
  ]);

  // Computed Report Summary Card Calculations
  const summaryMetrics = useMemo(() => {
    const count = currentDataset.length;
    let totalAmt = 0;
    let collectedAmt = 0;
    let pendingAmt = 0;

    if (collectionRateSummaryData) {
      return {
        recordCount: count,
        totalAmount: Number(collectionRateSummaryData.totalBilledAmount || 0),
        collectedAmount: Number(
          collectionRateSummaryData.totalCollectedAmount || 0,
        ),
        pendingAmount: Number(
          collectionRateSummaryData.totalPendingAmount || 0,
        ),
        averageValue:
          count > 0
            ? Math.round(
                Number(collectionRateSummaryData.totalBilledAmount || 0) /
                  count,
              )
            : 0,
      };
    }

    if (isRevenueKpi) {
      (currentDataset as KpiRevenueRecord[]).forEach((d) => {
        totalAmt += d.invoiceAmount;
        collectedAmt += d.collectedAmount;
      });
    } else if (isPendingKpi) {
      (currentDataset as KpiPendingPaymentRecord[]).forEach((d) => {
        pendingAmt += d.pendingAmount;
      });
    }

    return {
      recordCount: count,
      totalAmount: totalAmt,
      collectedAmount: collectedAmt,
      pendingAmount: pendingAmt,
      averageValue:
        count > 0 ? Math.round((totalAmt || pendingAmt || 500) / count) : 0,
    };
  }, [currentDataset, isRevenueKpi, isPendingKpi, collectionRateSummaryData]);

  const handleExportAllCsv = () => {
    const kpiSummaryRows = [
      {
        Section: "1. SUMMARY KPI CARD",
        Category_Item: selectedKpi,
        Count_or_Amount: String(
          summaryMetrics.totalAmount || summaryMetrics.recordCount,
        ),
        Percentage_Share: "100%",
        Primary_Detail: `Total Records: ${summaryMetrics.recordCount}`,
        Secondary_Detail: `Collected: INR ${summaryMetrics.collectedAmount} | Pending: INR ${summaryMetrics.pendingAmount}`,
        Date_or_Status: "Active",
      },
      {
        Section: "1. SUMMARY KPI CARD",
        Category_Item: "Average Value",
        Count_or_Amount: `INR ${summaryMetrics.averageValue}`,
        Percentage_Share: "100%",
        Primary_Detail: `Average per record in ${selectedKpi}`,
        Secondary_Detail: "KPI Summary Metric",
        Date_or_Status: "Calculated",
      },
    ];

    type CsvExportRecord = Record<
      string,
      string | number | boolean | null | undefined
    >;
    const recordRows = (
      currentDataset as unknown as Array<CsvExportRecord>
    ).map((rec, idx) => ({
      Section: "2. KPI DRILL-DOWN TABLE REGISTRY",
      Category_Item:
        rec.invoiceId ||
        rec.appointmentId ||
        rec.mrn ||
        rec.consultationId ||
        `REC-${idx + 1}`,
      Count_or_Amount: rec.invoiceAmount
        ? `INR ${rec.invoiceAmount}`
        : rec.pendingAmount
          ? `INR ${rec.pendingAmount}`
          : rec.visitType || rec.appointmentStatus || "Record",
      Percentage_Share: rec.collectedAmount
        ? `${((Number(rec.collectedAmount) / (Number(rec.invoiceAmount) || 1)) * 100).toFixed(1)}%`
        : "100%",
      Primary_Detail: rec.patientName
        ? `Patient: ${rec.patientName} (${rec.mrn || "N/A"})`
        : "N/A",
      Secondary_Detail: `Doctor: ${rec.doctorName || rec.registeredBy || "N/A"} | Dept: ${rec.department || "General"}`,
      Date_or_Status: `Date/Time: ${rec.invoiceDate || rec.appointmentTime || rec.dueDate || today} | Status: ${rec.paymentStatus || rec.appointmentStatus || rec.status || "Active"}`,
    }));

    const allRows = [...kpiSummaryRows, ...recordRows];

    exportDataToCsv(
      `Dashboard_KPI_Detail_${selectedKpi.replace(/[^A-Za-z0-9]/g, "_")}_All_Data_${new Date().toISOString().slice(0, 10)}.csv`,
      allRows,
    );
  };

  // Render status badge helper

  return (
    <div
      className="min-h-screen bg-[#F1F5F9] text-[#111827] pb-12"
      style={{ fontFamily: RB }}
    >
      {/* Top Header Section */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-20 shadow-sm">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <nav className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
                <button
                  type="button"
                  className="hover:text-[#0D47A1] cursor-pointer"
                  onClick={onBack}
                >
                  Hospital
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <button
                  type="button"
                  className="hover:text-[#0D47A1] cursor-pointer"
                  onClick={onBack}
                >
                  Reports
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0D47A1] font-semibold">
                  Dashboard KPI Detail
                </span>
              </nav>
              <div className="flex items-center gap-3">
                <h1
                  className="text-2xl font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {selectedKpi} Register
                </h1>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Audit, verify, and export transaction details for {selectedKpi}.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => (onBack ? onBack() : window.history.back())}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#111827] hover:bg-slate-50 transition-all shadow-2xs cursor-pointer mr-1"
                style={{ fontFamily: PP }}
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <div className="hidden lg:flex items-center gap-2 text-xs text-[#64748B] bg-slate-50 border border-[#E5E7EB] px-3 py-2 rounded-xl mr-1">
                <Clock className="w-4 h-4 text-[#0D47A1]" />
                <span>
                  Last Updated:{" "}
                  <strong className="text-[#111827]">
                    {new Date().toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </span>
              </div>

              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#111827] bg-white border border-[#E5E7EB] hover:bg-slate-50 transition shadow-sm"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#0D47A1] ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleExportAllCsv}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-slate-50 transition shadow-sm cursor-pointer"
                style={{ fontFamily: PP }}
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export Report</span>
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#111827] bg-white border border-[#E5E7EB] hover:bg-slate-50 transition shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-[#0D47A1]" />
                <span>Print Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 mt-6">
        {/* UNIFIED ENTERPRISE KPI DRILL-DOWN CONTEXT CARD */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E7EB] pb-4 mb-4">
            <div>
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Selected Dashboard KPI Drill-Down Context
              </span>
              <div className="flex items-center gap-3 mt-1">
                <h2
                  className="text-2xl font-bold text-[#0D47A1]"
                  style={{ fontFamily: PP }}
                >
                  {selectedKpi}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#66BB6A] border border-green-200 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> --
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium text-[#64748B]"
                style={{ fontFamily: PP }}
              >
                Select KPI To Inspect:
                <select
                  aria-label="Select option"
                  value={selectedKpi}
                  onChange={(e) => setSelectedKpi(e.target.value)}
                  className="bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs font-semibold px-3 py-2 text-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>Today's Revenue</option>
                  <option>Today's Appointments</option>
                  <option>Patients Registered</option>
                  <option>OPD Consultations</option>
                  <option>Completed Consultations</option>
                  <option>Pending Payments</option>
                </select>
              </span>
            </div>
          </div>

          {/* DYNAMIC KPI SUMMARY METRICS (Mutates based on selected KPI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch justify-center text-xs">
            {isRevenueKpi && (
              <>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB] flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[#64748B] text-[11px] block mb-1">
                      Current Revenue
                    </span>
                    <strong
                      className="text-xl font-bold text-[#111827] block"
                      style={{ fontFamily: PP }}
                    >
                      ₹{summaryMetrics.totalAmount.toLocaleString()}
                    </strong>
                  </div>
                  <span className="text-[10px] text-[#009688] font-semibold mt-2 block">
                    Collected: ₹
                    {summaryMetrics.collectedAmount.toLocaleString()}
                    {collectionRateSummaryData
                      ? ` (${collectionRateSummaryData.collectionRatePercentage || 0}%)`
                      : ""}
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB] flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[#64748B] text-[11px] block mb-1">
                      Yesterday Revenue
                    </span>
                    <strong
                      className="text-xl font-bold text-[#0D47A1] block"
                      style={{ fontFamily: PP }}
                    >
                      ₹--
                    </strong>
                  </div>
                  <span className="text-[10px] text-[#66BB6A] font-semibold mt-2 block">
                    --
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB] flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[#64748B] text-[11px] block mb-1">
                      Monthly Growth
                    </span>
                    <strong
                      className="text-xl font-bold text-[#009688] block"
                      style={{ fontFamily: PP }}
                    >
                      --
                    </strong>
                  </div>
                  <span className="text-[10px] text-[#64748B] mt-2 block">
                    vs monthly baseline
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB] flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[#64748B] text-[11px] block mb-1">
                      Yearly Growth
                    </span>
                    <strong
                      className="text-xl font-bold text-[#66BB6A] block"
                      style={{ fontFamily: PP }}
                    >
                      --
                    </strong>
                  </div>
                  <span className="text-[10px] text-[#64748B] mt-2 block">
                    YoY growth trajectory
                  </span>
                </div>
              </>
            )}

            {isAppointmentKpi && (
              <>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Today's Appointments
                  </span>
                  <strong
                    className="text-xl font-bold text-[#111827] block"
                    style={{ fontFamily: PP }}
                  >
                    {summaryMetrics.recordCount}
                  </strong>
                  <span className="text-[10px] text-[#009688] font-semibold">
                    Active Tokens
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Yesterday
                  </span>
                  <strong
                    className="text-xl font-bold text-[#0D47A1] block"
                    style={{ fontFamily: PP }}
                  >
                    38
                  </strong>
                  <span className="text-[10px] text-[#66BB6A] font-semibold">
                    --
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Weekly Average
                  </span>
                  <strong
                    className="text-xl font-bold text-[#009688] block"
                    style={{ fontFamily: PP }}
                  >
                    --
                  </strong>
                  <span className="text-[10px] text-[#64748B]">
                    7-day rolling avg
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Monthly Average
                  </span>
                  <strong
                    className="text-xl font-bold text-[#66BB6A] block"
                    style={{ fontFamily: PP }}
                  >
                    --
                  </strong>
                  <span className="text-[10px] text-[#64748B]">
                    Monthly baseline
                  </span>
                </div>
              </>
            )}

            {isPatientKpi && (
              <>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Today's Registrations
                  </span>
                  <strong
                    className="text-xl font-bold text-[#111827] block"
                    style={{ fontFamily: PP }}
                  >
                    {summaryMetrics.recordCount}
                  </strong>
                  <span className="text-[10px] text-[#009688] font-semibold">
                    OPD Walk-ins & Reg
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Yesterday
                  </span>
                  <strong
                    className="text-xl font-bold text-[#0D47A1] block"
                    style={{ fontFamily: PP }}
                  >
                    45
                  </strong>
                  <span className="text-[10px] text-[#66BB6A] font-semibold">
                    --
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Weekly Average
                  </span>
                  <strong
                    className="text-xl font-bold text-[#009688] block"
                    style={{ fontFamily: PP }}
                  >
                    --
                  </strong>
                  <span className="text-[10px] text-[#64748B]">
                    Stable registration
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Monthly Average
                  </span>
                  <strong
                    className="text-xl font-bold text-[#66BB6A] block"
                    style={{ fontFamily: PP }}
                  >
                    --
                  </strong>
                  <span className="text-[10px] text-[#64748B]">
                    Monthly average
                  </span>
                </div>
              </>
            )}

            {(isConsultationKpi ||
              (!isRevenueKpi &&
                !isAppointmentKpi &&
                !isPatientKpi &&
                !isPendingKpi)) && (
              <>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Total Consultations
                  </span>
                  <strong
                    className="text-xl font-bold text-[#111827] block"
                    style={{ fontFamily: PP }}
                  >
                    {summaryMetrics.recordCount}
                  </strong>
                  <span className="text-[10px] text-[#009688] font-semibold">
                    OPD Consultations
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Yesterday
                  </span>
                  <strong
                    className="text-xl font-bold text-[#0D47A1] block"
                    style={{ fontFamily: PP }}
                  >
                    28
                  </strong>
                  <span className="text-[10px] text-[#66BB6A] font-semibold">
                    --
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Avg Consultation Duration
                  </span>
                  <strong
                    className="text-xl font-bold text-[#009688] block"
                    style={{ fontFamily: PP }}
                  >
                    --
                  </strong>
                  <span className="text-[10px] text-[#64748B]">
                    Optimized flow
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Completion Rate
                  </span>
                  <strong
                    className="text-xl font-bold text-[#66BB6A] block"
                    style={{ fontFamily: PP }}
                  >
                    --
                  </strong>
                  <span className="text-[10px] text-[#66BB6A] font-semibold">
                    High turnaround
                  </span>
                </div>
              </>
            )}

            {isPendingKpi && (
              <>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Today's Collections
                  </span>
                  <strong
                    className="text-xl font-bold text-[#009688] block"
                    style={{ fontFamily: PP }}
                  >
                    â‚¹14,500
                  </strong>
                  <span className="text-[10px] text-[#009688] font-semibold">
                    Cleared today
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Pending Collections
                  </span>
                  <strong
                    className="text-xl font-bold text-[#EF4444] block"
                    style={{ fontFamily: PP }}
                  >
                    â‚¹{summaryMetrics.pendingAmount.toLocaleString()}
                  </strong>
                  <span className="text-[10px] text-[#F59E0B] font-semibold">
                    Requires follow-up
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Invoices Generated
                  </span>
                  <strong
                    className="text-xl font-bold text-[#0D47A1] block"
                    style={{ fontFamily: PP }}
                  >
                    {summaryMetrics.recordCount} Invoices
                  </strong>
                  <span className="text-[10px] text-[#64748B]">
                    Active billing
                  </span>
                </div>
                <div className="bg-[#F1F5F9] rounded-xl p-3.5 border border-[#E5E7EB]">
                  <span className="text-[#64748B] text-[11px] block mb-1">
                    Payment Completion %
                  </span>
                  <strong
                    className="text-xl font-bold text-[#66BB6A] block"
                    style={{ fontFamily: PP }}
                  >
                    --
                  </strong>
                  <span className="text-[10px] text-[#66BB6A] font-semibold">
                    Settled transactions
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* REUSABLE SMART REPORT FILTERS */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm mb-4">
          <div
            className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            <Filter className="w-4 h-4 text-[#009688]" />
            <span>Filter {selectedKpi} Records</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Patient Search
              </span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  aria-label="Input field"
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    dispatch({ type: "SET_SEARCH", payload: e.target.value })
                  }
                  placeholder="Name, MRN, ID..."
                  className="w-full pl-8 pr-2.5 py-2 bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs text-[#111827] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Date Range
                <select
                  aria-label="Select option"
                  value={dateRange}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FILTER",
                      field: "dateRange",
                      value: e.target.value,
                    })
                  }
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>Today</option>
                  <option>Yesterday</option>
                  <option>Last 7 Days</option>
                  <option>This Month</option>
                </select>
              </span>
            </div>

            {/* Department */}
            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Department
                <select
                  aria-label="Select option"
                  value={deptFilter}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FILTER",
                      field: "deptFilter",
                      value: e.target.value,
                    })
                  }
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Departments</option>
                  <option>General Medicine</option>
                  <option>Cardiology</option>
                  <option>Orthopedics</option>
                  <option>Neurology</option>
                  <option>Pediatrics</option>
                </select>
              </span>
            </div>

            {/* Doctor */}
            <div>
              <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                Doctor
                <select
                  aria-label="Select option"
                  value={doctorFilter}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FILTER",
                      field: "doctorFilter",
                      value: e.target.value,
                    })
                  }
                  className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                >
                  <option>All Doctors</option>
                  <option>Dr. Sarah Jenkins</option>
                  <option>Dr. Rajesh Kapoor</option>
                  <option>Dr. Priya Sharma</option>
                  <option>Dr. Arjun Mehta</option>
                  <option>Dr. Sunita Patel</option>
                </select>
              </span>
            </div>

            {/* Dynamic Visit Type Filter */}
            <div>
              <span
                className={`block text-[11px] font-medium mb-1 ${showVisitTypeFilter ? "text-[#64748B]" : "text-slate-400"}`}
              >
                Visit Type
                <select
                  aria-label="Select option"
                  disabled={!showVisitTypeFilter}
                  value={visitTypeFilter}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FILTER",
                      field: "visitTypeFilter",
                      value: e.target.value,
                    })
                  }
                  className={`w-full border rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1] ${showVisitTypeFilter ? "bg-[#F1F5F9] border-[#E5E7EB]" : "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed"}`}
                >
                  <option>All Visit Types</option>
                  <option>New Visit</option>
                  <option>Follow-up</option>
                  <option>Walk-in</option>
                  <option>Emergency</option>
                </select>
              </span>
            </div>

            {/* Dynamic Payment or Appointment Status Filter */}
            {showAptStatusFilter ? (
              <div>
                <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Appointment Status
                  <select
                    aria-label="Select option"
                    value={aptStatusFilter}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_FILTER",
                        field: "aptStatusFilter",
                        value: e.target.value,
                      })
                    }
                    className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                  >
                    <option>All Appointment Statuses</option>
                    <option>Scheduled</option>
                    <option>Checked-In</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </span>
              </div>
            ) : (
              <div>
                <span
                  className={`block text-[11px] font-medium mb-1 ${showPayStatusFilter ? "text-[#64748B]" : "text-slate-400"}`}
                >
                  Payment Status
                  <select
                    aria-label="Select option"
                    disabled={!showPayStatusFilter}
                    value={payStatusFilter}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_FILTER",
                        field: "payStatusFilter",
                        value: e.target.value,
                      })
                    }
                    className={`w-full border rounded-xl text-xs px-2.5 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D47A1] ${showPayStatusFilter ? "bg-[#F1F5F9] border-[#E5E7EB]" : "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed"}`}
                  >
                    <option>All Payment Statuses</option>
                    <option>Paid</option>
                    <option>Partially Paid</option>
                    <option>Pending</option>
                    <option>Overdue</option>
                  </select>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-[#E5E7EB]">
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#64748B] hover:text-[#111827] hover:bg-slate-100 transition"
            >
              Reset Filters
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-1.5 rounded-xl text-xs font-medium text-white bg-[#009688] hover:bg-teal-700 transition shadow-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* APPLIED FILTER CHIPS */}
        {(appliedFilters.dateRange !== "Today" ||
          appliedFilters.dept !== "All Departments" ||
          appliedFilters.doctor !== "All Doctors" ||
          appliedFilters.visitType !== "All Visit Types" ||
          appliedFilters.payStatus !== "All Payment Statuses" ||
          appliedFilters.aptStatus !== "All Appointment Statuses" ||
          searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap mb-4 bg-white p-3 rounded-2xl border border-[#E5E7EB] text-xs">
            <span
              className="font-semibold text-[#64748B] mr-1"
              style={{ fontFamily: PP }}
            >
              Applied Filters:
            </span>
            {appliedFilters.dateRange !== "Today" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[#0D47A1] border border-blue-200 font-medium">
                Period: {appliedFilters.dateRange}
                <button
                  onClick={() => {
                    dispatch({
                      type: "SET_FILTER",
                      field: "dateRange",
                      value: "Today",
                    });
                  }}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  Ã—
                </button>
              </span>
            )}
            {appliedFilters.dept !== "All Departments" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-[#009688] border border-teal-200 font-medium">
                Dept: {appliedFilters.dept}
                <button
                  onClick={() => {
                    dispatch({
                      type: "SET_FILTER",
                      field: "deptFilter",
                      value: "All Departments",
                    });
                  }}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  Ã—
                </button>
              </span>
            )}
            {appliedFilters.doctor !== "All Doctors" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-[#66BB6A] border border-emerald-200 font-medium">
                Doctor: {appliedFilters.doctor}
                <button
                  onClick={() => {
                    dispatch({
                      type: "SET_FILTER",
                      field: "doctorFilter",
                      value: "All Doctors",
                    });
                  }}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  Ã—
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[#111827] border border-slate-300 font-medium">
                Search: "{searchQuery}"
                <button
                  onClick={() => dispatch({ type: "SET_SEARCH", payload: "" })}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  Ã—
                </button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs text-[#EF4444] font-semibold hover:underline ml-auto"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* ANALYTICS CHARTS SECTION (DYNAMIC BY KPI) */}
        {!isLoading && currentDataset.length > 0 && (
          <div className="space-y-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Main Trend (Line / Area) */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      {isRevenueKpi
                        ? "Revenue Accumulation Trend"
                        : isAppointmentKpi
                          ? "Appointments Intraday Distribution"
                          : isPatientKpi
                            ? "Patient Registration Trend"
                            : "Consultation Activity Trend"}
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      {appliedFilters.dateRange} performance breakdown for{" "}
                      {selectedKpi}
                    </p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-[#0D47A1]" />
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        {
                          time: "08:00 AM",
                          value: isRevenueKpi
                            ? 4500
                            : isAppointmentKpi
                              ? 12
                              : 5,
                        },
                        {
                          time: "10:00 AM",
                          value: isRevenueKpi
                            ? 18200
                            : isAppointmentKpi
                              ? 38
                              : 18,
                        },
                        {
                          time: "12:00 PM",
                          value: isRevenueKpi
                            ? 34500
                            : isAppointmentKpi
                              ? 65
                              : 32,
                        },
                        {
                          time: "02:00 PM",
                          value: isRevenueKpi
                            ? 48900
                            : isAppointmentKpi
                              ? 84
                              : 45,
                        },
                        {
                          time: "04:00 PM",
                          value: isRevenueKpi
                            ? 62400
                            : isAppointmentKpi
                              ? 110
                              : 54,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: "#64748B" }}
                      />
                      <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: "12px",
                          borderColor: "#E5E7EB",
                          fontSize: "11px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#0D47A1"
                        strokeWidth={2.5}
                        dot={{ fill: "#0D47A1" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Distribution Share (Donut Chart) */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      {isRevenueKpi
                        ? "Payment Method Distribution"
                        : isAppointmentKpi
                          ? "Visit Type Breakdown"
                          : isPatientKpi
                            ? "Gender Distribution"
                            : "Status Share"}
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Categorical split of {selectedKpi}
                    </p>
                  </div>
                  <PieChartIcon className="w-4 h-4 text-[#009688]" />
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={
                          isRevenueKpi
                            ? [
                                { name: "Card", value: 45, color: "#0D47A1" },
                                { name: "UPI", value: 35, color: "#009688" },
                                { name: "Cash", value: 20, color: "#4DB6AC" },
                              ]
                            : isAppointmentKpi
                              ? [
                                  {
                                    name: "New Visit",
                                    value: 50,
                                    color: "#0D47A1",
                                  },
                                  {
                                    name: "Follow-up",
                                    value: 35,
                                    color: "#009688",
                                  },
                                  {
                                    name: "Walk-in",
                                    value: 15,
                                    color: "#F59E0B",
                                  },
                                ]
                              : [
                                  {
                                    name: "Female",
                                    value: 55,
                                    color: "#009688",
                                  },
                                  { name: "Male", value: 42, color: "#0D47A1" },
                                  { name: "Other", value: 3, color: "#4DB6AC" },
                                ]
                        }
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {[0, 1, 2].map((idx) => (
                          <Cell
                            key={idx}
                            fill={
                              isRevenueKpi
                                ? ["#0D47A1", "#009688", "#4DB6AC"][idx]
                                : ["#0D47A1", "#009688", "#F59E0B"][idx]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: "12px",
                          borderColor: "#E5E7EB",
                          fontSize: "11px",
                        }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Chart 3: Department Breakdown (Bar Chart) */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3
                    className="text-sm font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    Department Contribution Analysis
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Volume comparison across active clinical departments
                  </p>
                </div>
                <BarChart3 className="w-4 h-4 text-[#009688]" />
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { dept: "Gen. Medicine", count: 42 },
                      { dept: "Cardiology", count: 35 },
                      { dept: "Orthopedics", count: 28 },
                      { dept: "Neurology", count: 20 },
                      { dept: "Pediatrics", count: 18 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="dept"
                      tick={{ fontSize: 10, fill: "#64748B" }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "12px",
                        borderColor: "#E5E7EB",
                        fontSize: "11px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Total Volume"
                      fill="#009688"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {!isLoading && currentDataset.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center my-6 shadow-sm">
            <AlertCircle className="w-12 h-12 text-[#F59E0B] mx-auto mb-3" />
            <h3
              className="text-base font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              No records found for selected filters.
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              Try adjusting or resetting your applied date, department, or
              status filters to view transactions.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-[#0D47A1] text-white rounded-xl text-xs font-semibold hover:bg-blue-900 transition shadow-sm"
              style={{ fontFamily: PP }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* DYNAMIC REUSABLE SMART TRANSACTION TABLE */}
        {!isLoading && currentDataset.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden mb-6">
            <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3
                  className="text-base font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {selectedKpi} Transaction Register
                </h3>
                <p className="text-xs text-[#64748B]">
                  Granular drill-down log records supporting {selectedKpi}
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 border border-[#E5E7EB] text-xs font-semibold text-[#0D47A1] rounded-xl hover:bg-slate-100 transition"
              >
                <Download className="w-3.5 h-3.5 text-[#0D47A1]" />
                <span>Export Register</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F1F5F9] text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E5E7EB]">
                    {isRevenueKpi && (
                      <>
                        <th className="py-3.5 px-4">Invoice No</th>
                        <th className="py-3.5 px-4">Patient</th>
                        <th className="py-3.5 px-4">MRN</th>
                        <th className="py-3.5 px-4">Doctor</th>
                        <th className="py-3.5 px-4">Department</th>
                        <th className="py-3.5 px-4">Invoice Date</th>
                        <th className="py-3.5 px-4">Method</th>
                        <th className="py-3.5 px-4 text-right">Invoice Amt</th>
                        <th className="py-3.5 px-4 text-right">
                          Collected Amt
                        </th>
                        <th className="py-3.5 px-4 text-center">
                          Invoice Status
                        </th>
                      </>
                    )}

                    {isAppointmentKpi && (
                      <>
                        <th className="py-3.5 px-4">Appointment ID</th>
                        <th className="py-3.5 px-4">Patient</th>
                        <th className="py-3.5 px-4">MRN</th>
                        <th className="py-3.5 px-4">Doctor</th>
                        <th className="py-3.5 px-4">Department</th>
                        <th className="py-3.5 px-4">Visit Type</th>
                        <th className="py-3.5 px-4">Time</th>
                        <th className="py-3.5 px-4">Token</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                      </>
                    )}

                    {isPatientKpi && (
                      <>
                        <th className="py-3.5 px-4">Patient ID</th>
                        <th className="py-3.5 px-4">Patient Name</th>
                        <th className="py-3.5 px-4">MRN</th>
                        <th className="py-3.5 px-4">Gender</th>
                        <th className="py-3.5 px-4">Age</th>
                        <th className="py-3.5 px-4">Registration Date</th>
                        <th className="py-3.5 px-4">Registered By</th>
                        <th className="py-3.5 px-4">Visit Type</th>
                      </>
                    )}

                    {isConsultationKpi && (
                      <>
                        <th className="py-3.5 px-4">Consultation ID</th>
                        <th className="py-3.5 px-4">Patient</th>
                        <th className="py-3.5 px-4">Doctor</th>
                        <th className="py-3.5 px-4">Department</th>
                        <th className="py-3.5 px-4">Consultation Time</th>
                        <th className="py-3.5 px-4">Duration</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                      </>
                    )}

                    {isPendingKpi && (
                      <>
                        <th className="py-3.5 px-4">Invoice No</th>
                        <th className="py-3.5 px-4">Patient</th>
                        <th className="py-3.5 px-4">Doctor</th>
                        <th className="py-3.5 px-4">Department</th>
                        <th className="py-3.5 px-4 text-right">Pending Amt</th>
                        <th className="py-3.5 px-4">Due Date</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                      </>
                    )}
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-xs">
                  {/* Revenue Table Body */}
                  {isRevenueKpi &&
                    (currentDataset as KpiRevenueRecord[]).map((row) => (
                      <tr
                        key={row.invoiceId}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-[#0D47A1]">
                          {row.invoiceId}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#111827]">
                          {row.patientName}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {row.mrn}
                        </td>
                        <td className="py-3.5 px-4 text-[#111827]">
                          {row.doctorName}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {row.department}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {row.invoiceDate}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#111827]">
                          {row.paymentMethod}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#111827]">
                          â‚¹{row.invoiceAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#009688]">
                          â‚¹{row.collectedAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {renderStatusBadge(row.invoiceStatus)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => alert(`View ${row.invoiceId}`)}
                              className="p-1 text-[#0D47A1] hover:bg-blue-50 rounded"
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="p-1 text-[#64748B] hover:bg-slate-100 rounded"
                              title="Print"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={() => alert(`Download ${row.invoiceId}`)}
                              className="p-1 text-[#009688] hover:bg-teal-50 rounded"
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {/* Appointments Table Body */}
                  {isAppointmentKpi &&
                    (currentDataset as KpiAppointmentRecord[]).map((row) => (
                      <tr
                        key={row.appointmentId}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-[#0D47A1]">
                          {row.appointmentId}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#111827]">
                          {row.patientName}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {row.mrn}
                        </td>
                        <td className="py-3.5 px-4 text-[#111827]">
                          {row.doctorName}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {row.department}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#111827]">
                          {row.visitType}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {row.appointmentTime}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#0D47A1] font-bold">
                          {row.tokenNumber}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {renderStatusBadge(row.appointmentStatus)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => alert(`View ${row.appointmentId}`)}
                              className="p-1 text-[#0D47A1] hover:bg-blue-50 rounded"
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="p-1 text-[#64748B] hover:bg-slate-100 rounded"
                              title="Print"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={() =>
                                alert(`Download ${row.appointmentId}`)
                              }
                              className="p-1 text-[#009688] hover:bg-teal-50 rounded"
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {/* Patients Table Body */}
                  {isPatientKpi &&
                    (currentDataset as KpiPatientRecord[]).map((row) => (
                      <tr
                        key={row.patientId}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-[#0D47A1]">
                          {row.patientId}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#111827]">
                          {row.patientName}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {row.mrn}
                        </td>
                        <td className="py-3.5 px-4 text-[#111827]">
                          {row.gender}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {row.age} yrs
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {row.registrationDate}
                        </td>
                        <td className="py-3.5 px-4 text-[#111827] font-medium">
                          {row.registeredBy}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#009688]">
                          {row.visitType}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => alert(`View ${row.patientId}`)}
                              className="p-1 text-[#0D47A1] hover:bg-blue-50 rounded"
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="p-1 text-[#64748B] hover:bg-slate-100 rounded"
                              title="Print"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={() => alert(`Download ${row.patientId}`)}
                              className="p-1 text-[#009688] hover:bg-teal-50 rounded"
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {/* Consultations Table Body */}
                  {isConsultationKpi &&
                    (currentDataset as KpiConsultationRecord[]).map((row) => (
                      <tr
                        key={row.consultationId}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-[#0D47A1]">
                          {row.consultationId}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#111827]">
                          {row.patientName}
                        </td>
                        <td className="py-3.5 px-4 text-[#111827]">
                          {row.doctorName}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {row.department}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {row.consultationTime}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#111827]">
                          {row.durationMinutes} mins
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {renderStatusBadge(row.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() =>
                                alert(`View ${row.consultationId}`)
                              }
                              className="p-1 text-[#0D47A1] hover:bg-blue-50 rounded"
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="p-1 text-[#64748B] hover:bg-slate-100 rounded"
                              title="Print"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={() =>
                                alert(`Download ${row.consultationId}`)
                              }
                              className="p-1 text-[#009688] hover:bg-teal-50 rounded"
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {/* Pending Payments Table Body */}
                  {isPendingKpi &&
                    (currentDataset as KpiPendingPaymentRecord[]).map((row) => (
                      <tr
                        key={row.invoiceId}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-[#0D47A1]">
                          {row.invoiceId}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#111827]">
                          {row.patientName}
                        </td>
                        <td className="py-3.5 px-4 text-[#111827]">
                          {row.doctorName}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {row.department}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#EF4444]">
                          â‚¹{row.pendingAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {row.dueDate}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {renderStatusBadge(row.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => alert(`View ${row.invoiceId}`)}
                              className="p-1 text-[#0D47A1] hover:bg-blue-50 rounded"
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="p-1 text-[#64748B] hover:bg-slate-100 rounded"
                              title="Print"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={() => alert(`Download ${row.invoiceId}`)}
                              className="p-1 text-[#009688] hover:bg-teal-50 rounded"
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 bg-[#F1F5F9] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B]">
              <span>
                Showing 1 to {currentDataset.length} of {currentDataset.length}{" "}
                entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  aria-label="Previous"
                  disabled
                  className="p-1 rounded-lg border border-[#E5E7EB] opacity-50 cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-[#111827]">
                  Page 1 of 1
                </span>
                <button
                  aria-label="Next"
                  disabled
                  className="p-1 rounded-lg border border-[#E5E7EB] opacity-50 cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
          <div>
            Showing{" "}
            <strong className="text-[#111827]">
              {currentDataset.length} Transactions
            </strong>
          </div>
          <div>
            Safe Hands Hospital Management System • Dashboard KPI Detail v2.0
          </div>
          <div>
            Last Refreshed:{" "}
            <strong className="text-[#111827]">
              {new Date().toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* ENTERPRISE EXPORT REPORT MODAL WITH PRINT & CHARTS */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-md w-full p-6 shadow-2xl relative transition-opacity duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <h3
                className="text-base font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Export {selectedKpi} Report
              </h3>
              <button
                aria-label="Download"
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs" style={{ fontFamily: RB }}>
              <div>
                <span
                  className="block font-semibold text-[#111827] mb-2"
                  style={{ fontFamily: PP }}
                >
                  Export Format
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${exportFormat === "pdf" ? "bg-blue-50 border-[#0D47A1] text-[#0D47A1] font-semibold" : "bg-slate-50 border-[#E5E7EB] text-[#64748B]"}`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value="pdf"
                      checked={exportFormat === "pdf"}
                      onChange={() => setExportFormat("pdf")}
                      className="accent-[#0D47A1]"
                    />
                    <span>PDF</span>
                  </label>
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${exportFormat === "excel" ? "bg-teal-50 border-[#009688] text-[#009688] font-semibold" : "bg-slate-50 border-[#E5E7EB] text-[#64748B]"}`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value="excel"
                      checked={exportFormat === "excel"}
                      onChange={() => setExportFormat("excel")}
                      className="accent-[#009688]"
                    />
                    <span>Excel</span>
                  </label>
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${exportFormat === "csv" ? "bg-slate-100 border-slate-400 text-[#111827] font-semibold" : "bg-slate-50 border-[#E5E7EB] text-[#64748B]"}`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value="csv"
                      checked={exportFormat === "csv"}
                      onChange={() => setExportFormat("csv")}
                      className="accent-slate-700"
                    />
                    <span>CSV</span>
                  </label>
                </div>
              </div>

              <div>
                <span
                  className="block font-semibold text-[#111827] mb-2"
                  style={{ fontFamily: PP }}
                >
                  Export Scope
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="exportScope"
                      value="current"
                      checked={exportScope === "current"}
                      onChange={() => setExportScope("current")}
                      className="accent-[#0D47A1]"
                    />
                    <span>Current Page</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="exportScope"
                      value="filtered"
                      checked={exportScope === "filtered"}
                      onChange={() => setExportScope("filtered")}
                      className="accent-[#0D47A1]"
                    />
                    <span>Filtered Data</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="exportScope"
                      value="complete"
                      checked={exportScope === "complete"}
                      onChange={() => setExportScope("complete")}
                      className="accent-[#0D47A1]"
                    />
                    <span>Complete</span>
                  </label>
                </div>
              </div>

              {exportFormat !== "csv" && (
                <div>
                  <span
                    className="block font-semibold text-[#111827] mb-2"
                    style={{ fontFamily: PP }}
                  >
                    Include Options
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeOptions.kpi}
                        onChange={(e) =>
                          setIncludeOptions({
                            ...includeOptions,
                            kpi: e.target.checked,
                          })
                        }
                        className="accent-[#0D47A1]"
                      />
                      <span>Hospital Header & Logo</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeOptions.charts}
                        onChange={(e) =>
                          setIncludeOptions({
                            ...includeOptions,
                            charts: e.target.checked,
                          })
                        }
                        className="accent-[#0D47A1]"
                      />
                      <span>KPI Charts in PDF</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeOptions.tables}
                        onChange={(e) =>
                          setIncludeOptions({
                            ...includeOptions,
                            tables: e.target.checked,
                          })
                        }
                        className="accent-[#0D47A1]"
                      />
                      <span>Transaction Register</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeOptions.filters}
                        onChange={(e) =>
                          setIncludeOptions({
                            ...includeOptions,
                            filters: e.target.checked,
                          })
                        }
                        className="accent-[#0D47A1]"
                      />
                      <span>Applied Filter Summary</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <span
                  className="block font-semibold text-[#111827] mb-1"
                  style={{ fontFamily: PP }}
                >
                  Generated Export File Name
                </span>
                <div className="p-2.5 bg-slate-50 border border-[#E5E7EB] rounded-xl font-mono text-xs text-[#0D47A1] font-semibold">
                  {selectedKpi.replace(/[^a-zA-Z0-9]/g, "_")}_Report_
                  {dateRange.replace(/\s+/g, "_")}.
                  {exportFormat === "excel" ? "xlsx" : exportFormat}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB] mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#64748B] rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                style={{ fontFamily: PP }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(
                    `Exporting ${selectedKpi} Register as ${exportFormat.toUpperCase()} with Hospital Header, Applied Filters, and Printable Charts...`,
                  );
                  setShowExportModal(false);
                }}
                className="px-4 py-2 bg-[#0D47A1] text-white rounded-xl text-xs font-semibold hover:bg-blue-900 transition shadow-sm flex items-center gap-1.5"
                style={{ fontFamily: PP }}
              >
                <Download size={14} />
                <span>Export Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

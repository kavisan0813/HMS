import { useEffect, useMemo, useState } from "react";
import {
  usePrescriptionStore,
  prescriptionStoreActions,
} from "../store/prescription.store";
import { prescriptionService } from "../services/prescription.service";
import { useAuthStore } from "../../auth/store/auth.store";

export function usePrescription(mrn?: string, doctorNameFilter?: string) {
  const { prescriptions, loading, error, filters } = usePrescriptionStore();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const roleRaw = String(user?.role ?? "").toUpperCase();
  const isPatient = roleRaw === "PATIENT";

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    if (isPatient && mrn) {
      prescriptionService.loadPatientPrescriptions(mrn).catch((err) => {
        const message =
          err instanceof Error ? err.message : "Failed to load prescriptions";
        showToast(message);
      });
    } else if (mrn) {
      prescriptionService
        .loadPrescriptions(mrn, doctorNameFilter)
        .catch((err) => {
          const message =
            err instanceof Error ? err.message : "Failed to load prescriptions";
          showToast(message);
        });
    } else {
      prescriptionStoreActions.setPrescriptions([]);
      prescriptionStoreActions.setLoading(false);
    }
  }, [mrn, doctorNameFilter, isPatient]);

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      const query = filters.searchTerm.toLowerCase();
      const matchesSearch =
        rx.id.toLowerCase().includes(query) ||
        rx.doctorName.toLowerCase().includes(query) ||
        rx.patientName.toLowerCase().includes(query) ||
        rx.department.toLowerCase().includes(query) ||
        rx.diagnosis.toLowerCase().includes(query) ||
        rx.medicines.some((m) => m.name.toLowerCase().includes(query));

      const matchesStatus =
        filters.status === "All" ||
        rx.status.toLowerCase() === filters.status.toLowerCase();

      const matchesDept =
        filters.dept === "All" ||
        rx.department.toLowerCase() === filters.dept.toLowerCase();

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [prescriptions, filters]);

  const triggerRefresh = () => {
    if (isPatient && mrn) {
      prescriptionService.loadPatientPrescriptions(mrn).catch((err) => {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to refresh prescriptions";
        showToast(message);
      });
    } else if (mrn) {
      prescriptionService
        .loadPrescriptions(mrn, doctorNameFilter)
        .catch((err) => {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to refresh prescriptions";
          showToast(message);
        });
    }
  };

  return {
    prescriptions: filteredPrescriptions,
    allPrescriptions: prescriptions,
    loading,
    error,
    toastMsg,
    showToast,
    triggerRefresh,
  };
}

const loadDetails = async (
  id: string | number,
  onError?: (msg: string) => void,
) => {
  try {
    return await prescriptionService.getPrescriptionDetails(id);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to load prescription details";
    onError?.(message);
    return null;
  }
};

const closeDetails = () => {
  prescriptionStoreActions.setSelectedPrescription(null);
};

const setFilterValue = (key: string, val: string) => {
  prescriptionStoreActions.setFilters({ [key]: val });
};

const resetFilters = () => {
  prescriptionStoreActions.resetFilters();
};

export function usePrescriptionDetails() {
  const { selectedPrescription, loading } = usePrescriptionStore();

  return {
    selectedPrescription,
    loading,
    loadDetails,
    closeDetails,
  };
}

export function usePrescriptionFilters() {
  const { filters } = usePrescriptionStore();

  return {
    filters,
    setFilterValue,
    resetFilters,
  };
}

export function usePrescriptionActions(showToast: (msg: string) => void) {
  const handlePrint = async (rxId: string | number) => {
    try {
      const printData = await prescriptionService.getPrintOutput(rxId);
      if (printData) {
        showToast(`Prescription ${rxId} sent to printer`);
      } else {
        showToast(`Failed to load print layout for ${rxId}`);
      }
    } catch (err) {
      console.log(err);
      showToast(`Failed to print prescription ${rxId}`);
    }
  };

  const handleDownload = async (rxId: string | number) => {
    try {
      const printData = await prescriptionService.getPrintOutput(rxId);
      if (!printData) {
        showToast(`Failed to load prescription data for ${rxId}`);
        return;
      }
      const medicines = (printData.medicines || [])
        .map(
          (m) =>
            `<tr><td style="padding:4px 8px;border:1px solid #ddd">${m.medicineName || ""}</td><td style="padding:4px 8px;border:1px solid #ddd">${m.strength || ""}</td><td style="padding:4px 8px;border:1px solid #ddd">${m.dosage || ""}</td><td style="padding:4px 8px;border:1px solid #ddd">${m.frequency || ""}</td><td style="padding:4px 8px;border:1px solid #ddd">${m.duration || ""}</td><td style="padding:4px 8px;border:1px solid #ddd">${m.instructions || ""}</td></tr>`,
        )
        .join("");
      const html = `<!DOCTYPE html><html><head><title>Prescription ${printData.prescriptionNumber || rxId}</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:4px 8px;text-align:left;font-size:12px}h2,h3{margin:4px 0}</style></head><body>
        <h2>Prescription ${printData.prescriptionNumber || ""}</h2>
        <p><strong>Patient:</strong> ${printData.patientName || ""} (${printData.patientMrn || ""})</p>
        <p><strong>Doctor:</strong> ${printData.doctorName || ""} | <strong>Dept:</strong> ${printData.department || ""}</p>
        ${printData.followUpDate ? `<p><strong>Follow-up:</strong> ${printData.followUpDate}</p>` : ""}
        <h3>Medications</h3>
        <table><thead><tr><th>Medicine</th><th>Strength</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>${medicines}</tbody></table>
        ${printData.advice ? `<h3>Advice</h3><p>${printData.advice.general || ""}</p>${printData.advice.diet ? `<p><strong>Diet:</strong> ${printData.advice.diet}</p>` : ""}${printData.advice.precautions ? `<p><strong>Precautions:</strong> ${printData.advice.precautions}</p>` : ""}` : ""}
        ${printData.digitalSeal ? `<p style="margin-top:20px;color:#666;font-size:10px">Digital Seal: ${printData.digitalSeal}</p>` : ""}
        </body></html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      showToast(`Prescription ${rxId} ready for download`);
    } catch (err) {
      console.log(err);
      showToast(`Failed to download prescription ${rxId}`);
    }
  };

  const handleFinalize = async (rxId: string | number) => {
    try {
      const success = await prescriptionService.finalizePrescription(rxId);
      if (success) {
        showToast(`Prescription ${rxId} finalized successfully.`);
      } else {
        showToast(`Failed to finalize prescription ${rxId}.`);
      }
      return success;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : `Failed to finalize prescription ${rxId}`;
      showToast(message);
      return false;
    }
  };

  const handleDuplicate = async (rxId: string | number) => {
    try {
      await prescriptionService.createAmendment(rxId, {
        reason: "Patient requested duplicate",
      });
      showToast(`Duplicated prescription ${rxId}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : `Failed to duplicate prescription ${rxId}`;
      showToast(message);
    }
  };

  const handleReprint = async (rxId: string | number) => {
    try {
      await prescriptionService.reprintPrescription(rxId, {
        reason: "Reprint request",
      });
      showToast(`Reprinted prescription ${rxId}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : `Failed to reprint prescription ${rxId}`;
      showToast(message);
    }
  };

  return {
    handlePrint,
    handleDownload,
    handleFinalize,
    handleDuplicate,
    handleReprint,
  };
}

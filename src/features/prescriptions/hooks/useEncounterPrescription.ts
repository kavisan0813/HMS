import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/axios";
import type { EncounterPrescriptionResponse } from "../types/prescription.types";

interface ApiEnvelope<T> {
  success?: boolean;
  code?: string;
  message?: string;
  timestamp?: string;
  data?: T;
}

const encounterPrescriptionKeys = {
  all: ["encounter-prescriptions"] as const,
  detail: (encounterId: string | number) =>
    ["encounter-prescriptions", String(encounterId)] as const,
};

async function fetchEncounterPrescription(
  encounterId: string | number,
): Promise<EncounterPrescriptionResponse | null> {
  if (!encounterId) return null;
  try {
    let result: EncounterPrescriptionResponse | null = null;
    try {
      const response = await apiClient.get<
        | ApiEnvelope<EncounterPrescriptionResponse>
        | EncounterPrescriptionResponse
      >(`/api/v1/encounters/${encounterId}/prescription`);

      const body = response.data;
      if (body && typeof body === "object" && "data" in body && body.data) {
        result = body.data;
      } else {
        result = body as EncounterPrescriptionResponse;
      }
    } catch (error) {
      console.warn("Backend prescription fetch notice:", error);
    }

    // Check local fallback storage if backend return is missing or medications are empty
    let cachedMeds = [];
    try {
      const rawCached = localStorage.getItem(
        `hms-completed-meds:${encounterId}`,
      );
      if (rawCached) cachedMeds = JSON.parse(rawCached);
    } catch (err) {
      console.log(err);
      cachedMeds = [];
    }

    if (!result && cachedMeds.length === 0) return null;

    const resObj = (result || {}) as unknown as Record<string, unknown>;
    const rawMeds =
      resObj.medications ||
      resObj.medicines ||
      resObj.items ||
      resObj.prescriptionItems ||
      cachedMeds;

    const medsList = Array.isArray(rawMeds) ? rawMeds : [];

    return {
      ...(result || {}),
      id: resObj.id || encounterId,
      encounterId,
      status: String(resObj.status || "FINALIZED"),
      medications: medsList.map((m: unknown, idx: number) => {
        const item = (m && typeof m === "object" ? m : {}) as Record<
          string,
          unknown
        >;
        const doseObj = item.dose as
          | { value?: unknown; unit?: unknown }
          | undefined;
        const doseStr =
          typeof item.dose === "object" && item.dose !== null
            ? `${doseObj?.value ?? ""} ${doseObj?.unit ?? ""}`.trim()
            : String(item.dosage || item.dose || item.strength || "1 Tablet");

        const freqObj = item.frequency as
          | { code?: unknown; display?: unknown }
          | undefined;
        const freqStr =
          typeof item.frequency === "object" && item.frequency !== null
            ? String(freqObj?.display || freqObj?.code || "1-0-1")
            : String(item.frequency || "1-0-1");

        const durObj = item.duration as
          | { value?: unknown; unit?: unknown }
          | undefined;
        const durStr =
          typeof item.duration === "object" && item.duration !== null
            ? `${durObj?.value ?? ""} ${durObj?.unit ?? ""}`.trim()
            : String(item.duration || "5 Days");

        return {
          medicationId: String(item.id || item.medicationId || idx + 1),
          medicineName: String(
            item.name || item.medicineName || item.title || "Medication",
          ),
          dose: doseStr,
          frequency: freqStr,
          duration: durStr,
          route: String(item.route || "Oral"),
          instructions: String(item.instructions || "After Food"),
        };
      }) as unknown as EncounterPrescriptionResponse["medications"],
    } as EncounterPrescriptionResponse;
  } catch (error) {
    console.error("Error fetching encounter prescription:", error);
    return null;
  }
}

export function useEncounterPrescription(
  encounterId: string | number | null | undefined,
  options?: { enabled?: boolean },
) {
  const queryEnabled = Boolean(encounterId) && (options?.enabled ?? true);

  return useQuery({
    queryKey: encounterPrescriptionKeys.detail(encounterId || ""),
    queryFn: () => fetchEncounterPrescription(encounterId!),
    enabled: queryEnabled,
    staleTime: 60_000,
    retry: false,
  });
}

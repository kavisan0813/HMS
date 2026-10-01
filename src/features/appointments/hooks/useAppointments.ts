import { useState, useEffect, useCallback } from "react";
import { appointmentService } from "../services/appointment.service";
import type { AppointmentRecord, UserRole } from "../types/appointment.types";

export function useAppointments(
  userRole: UserRole = "Receptionist",
  date?: string,
  params?: {
    doctorId?: string | number;
    patientId?: string | number;
    mrn?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
    sort?: string;
  },
) {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const doctorId = params?.doctorId;
  const patientId = params?.patientId;
  const mrn = params?.mrn;
  const status = params?.status;
  const fromDate = params?.fromDate;
  const toDate = params?.toDate;
  const page = params?.page;
  const size = params?.size;
  const sort = params?.sort;

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let items: AppointmentRecord[] = [];
        const roleUpper = String(userRole || "").toUpperCase();

        if (roleUpper === "DOCTOR") {
          items = await appointmentService.listDoctorAppointments(
            doctorId,
            date,
            status,
          );
        } else if (
          roleUpper === "PATIENT" &&
          (patientId || mrn)
        ) {
          items = await appointmentService.listPatientAppointments(
            patientId || mrn || "",
          );
        } else {
          items = await appointmentService.listAppointments({
            doctorId,
            patientId,
            mrn,
            date,
            fromDate,
            toDate,
            status,
            page,
            size,
            sort,
          });
        }
        if (active) {
          setAppointments(items);
        }
      } catch (err: unknown) {
        if (active) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to load appointments from server.";
          setError(msg);
          setAppointments([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [
    userRole,
    date,
    doctorId,
    patientId,
    mrn,
    status,
    fromDate,
    toDate,
    page,
    size,
    sort,
  ]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let items: AppointmentRecord[] = [];
      const roleUpper = String(userRole || "").toUpperCase();
      if (roleUpper === "DOCTOR") {
        items = await appointmentService.listDoctorAppointments(
          doctorId,
          date,
          status,
        );
      } else if (
        roleUpper === "PATIENT" &&
        (patientId || mrn)
      ) {
        items = await appointmentService.listPatientAppointments(
          patientId || mrn || "",
        );
      } else {
        items = await appointmentService.listAppointments({
          doctorId,
          patientId,
          mrn,
          date,
          fromDate,
          toDate,
          status,
          page,
          size,
          sort,
        });
      }
      setAppointments(items);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load appointments from server.";
      setError(msg);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    userRole,
    date,
    doctorId,
    patientId,
    mrn,
    status,
    fromDate,
    toDate,
    page,
    size,
    sort,
  ]);

  return {
    appointments,
    setAppointments,
    isLoading,
    error,
    refetch,
  };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorDashboardApi } from "../api/doctorDashboard.api";

const doctorKeys = {
  all: ["doctor-dashboard"] as const,
  statistics: () => [...doctorKeys.all, "statistics"] as const,
  currentPatient: () => [...doctorKeys.all, "current-patient"] as const,
  nextPatient: () => [...doctorKeys.all, "next-patient"] as const,
  todayAppointments: () => [...doctorKeys.all, "today-appointments"] as const,
  meAppointments: () => [...doctorKeys.all, "me-appointments"] as const,
  consultationQueue: () => [...doctorKeys.all, "consultation-queue"] as const,
};

export function useDoctorStatistics() {
  return useQuery({
    queryKey: doctorKeys.statistics(),
    queryFn: doctorDashboardApi.getStatistics,
    refetchInterval: 30000,
  });
}

export function useDoctorCurrentPatient() {
  return useQuery({
    queryKey: doctorKeys.currentPatient(),
    queryFn: doctorDashboardApi.getCurrentPatient,
    refetchInterval: 15000,
  });
}

export function useDoctorNextPatient() {
  return useQuery({
    queryKey: doctorKeys.nextPatient(),
    queryFn: doctorDashboardApi.getNextPatient,
    refetchInterval: 15000,
  });
}

export function useDoctorTodayAppointments(
  doctorId?: string | number,
  date?: string,
) {
  return useQuery({
    queryKey: [...doctorKeys.todayAppointments(), doctorId, date] as const,
    queryFn: () => doctorDashboardApi.getTodayAppointments(doctorId, date),
    refetchInterval: 30000,
  });
}

export function useDoctorConsultationQueue() {
  return useQuery({
    queryKey: doctorKeys.consultationQueue(),
    queryFn: doctorDashboardApi.getConsultationQueue,
    refetchInterval: 15000,
  });
}

export function useDoctorCallToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => doctorDashboardApi.callToken(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.all });
    },
  });
}

export function useDoctorCompleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) =>
      doctorDashboardApi.completeAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.all });
    },
  });
}

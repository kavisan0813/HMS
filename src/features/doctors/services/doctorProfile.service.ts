import { doctorsApi } from "../api/doctors.api";
import { usersApi } from "../../users/api/users.api";
import { useAuthStore } from "../../auth/store/auth.store";
import type { AdminUpdateStaffData } from "../../users/types/users.types";
import { appointmentService } from "../../appointments/services/appointment.service";
import type { AppointmentRecord } from "../../appointments/types/appointment.types";
import type {
  DoctorRecord,
  DoctorAppointment,
  DoctorDailyAvailabilityData,
  ApiWeeklyScheduleData,
  ApiWeeklyScheduleDay,
  UpdateDoctorPayload,
} from "../types/doctors.types";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

const toDoctorAppointment = (a: AppointmentRecord): DoctorAppointment => {
  const patient = a.patient;
  return {
    id: String(a.id ?? a.appointmentNumber ?? ""),
    appointmentNumber: a.appointmentNumber || String(a.id ?? ""),
    patientId: String(a.patientId ?? a.mrn ?? ""),
    patientName: a.patientName || patient?.fullName || "Unknown",
    gender: patient?.gender || a.patientGender || "N/A",
    age: Number(patient?.age ?? a.patientAge ?? 0),
    date: a.appointmentDate || "",
    time: a.startTime || "",
    type: a.visitType || a.appointmentType || "Consultation",
    status: a.status || "Scheduled",
    complaint: a.chiefComplaint || a.reason || "—",
  };
};

export const resolveDoctorId = (doc: DoctorRecord): number | string => {
  if (doc.doctorId && doc.doctorId !== 0) return doc.doctorId;
  if (doc.userId && doc.userId !== 0) return doc.userId;
  const cleaned = String(doc.id || "")
    .replace(/^DOC-/, "")
    .trim();
  if (cleaned && cleaned !== "0") return cleaned;
  return doc.id || "";
};

export const resolveUserId = (doc: DoctorRecord): number | string => {
  if (doc.userId && doc.userId !== 0) return doc.userId;
  if (doc.doctorId && doc.doctorId !== 0) return doc.doctorId;
  const cleaned = String(doc.id || "")
    .replace(/^DOC-/, "")
    .trim();
  if (cleaned && cleaned !== "0") return cleaned;
  return doc.id || "";
};

const toUpdateDoctorPayload = (d: DoctorRecord): UpdateDoctorPayload => ({
  fullName: d.name.replace(/^Dr\.\s*/, ""),
  email: d.email,
  mobile: d.phone,
  gender: d.gender,
  dateOfBirth: d.dob || undefined,
  residentialAddress: d.address || undefined,
  professionalBio: d.bio || undefined,
  medicalRegistrationNumber: d.regNumber,
  qualification: d.qualification,
  yearsOfExperience: d.experienceYrs,
  primaryDepartmentId: d.primaryDepartmentId,
  primarySpecialtyId: d.primarySpecialtyId,
  consultationFee: d.consultationFee,
  followUpFee: d.followUpFee,
  slotDurationMinutes: d.slotDurationMinutes,
  availability: d.rawAvailability,
  photo: d.photo || d.photoUrl || undefined,
  photoUrl: d.photoUrl || d.photo || undefined,
});

export const dayLabel = (dayOfWeek: string): string =>
  DAY_LABELS[String(dayOfWeek).toUpperCase()] || dayOfWeek || "—";

export const doctorProfileService = {
  async getDoctorProfile(userId: number | string): Promise<DoctorRecord> {
    const record = await doctorsApi.getById(String(userId));
    try {
      const cleanId = String(userId).replace(/^DOC-/, "");
      const stored =
        localStorage.getItem(`doctor_profile_custom_${userId}`) ||
        localStorage.getItem(`doctor_profile_custom_${cleanId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          return {
            ...record,
            ...parsed,
            photoUrl: parsed.photoUrl || record.photoUrl,
            photo: parsed.photo || record.photo,
          };
        }
      }
    } catch (err) {
      console.log(err);
      // Ignore
    }
    return record;
  },

  async getWeeklySchedule(
    doctorId: number | string,
  ): Promise<ApiWeeklyScheduleDay[]> {
    const data: ApiWeeklyScheduleData | null =
      await doctorsApi.getWeeklySchedule(doctorId);
    return data?.weeklySchedule || [];
  },

  async getDailyAvailability(
    doctorId: number | string,
    date: string,
  ): Promise<DoctorDailyAvailabilityData | null> {
    return doctorsApi.getDailyAvailability(doctorId, date);
  },

  async listAppointments(
    doctorId: number | string,
  ): Promise<DoctorAppointment[]> {
    const records = await appointmentService.listDoctorAppointments(doctorId);
    return records.map(toDoctorAppointment);
  },

  async updateDoctor(doc: DoctorRecord): Promise<DoctorRecord> {
    const userId = resolveUserId(doc);
    const doctorId = resolveDoctorId(doc);
    const payload = toUpdateDoctorPayload(doc);

    // Save to localStorage for instant client persistence
    try {
      if (userId) {
        localStorage.setItem(
          `doctor_profile_custom_${userId}`,
          JSON.stringify(doc),
        );
      }
      if (doctorId) {
        localStorage.setItem(
          `doctor_profile_custom_${doctorId}`,
          JSON.stringify(doc),
        );
      }
    } catch (err) {
      console.log(err);
      // Ignore
    }

    // Sync auth store if current user is this doctor
    const currentUser = useAuthStore.getState().user;
    if (
      currentUser &&
      (String(currentUser.id) === String(userId) ||
        String(currentUser.doctorId) === String(doctorId))
    ) {
      useAuthStore.setUser({
        ...currentUser,
        fullName: doc.fullName || doc.name || currentUser.fullName,
        mobile: doc.phone || currentUser.mobile,
        photoUrl: doc.photoUrl || doc.photo || currentUser.photoUrl,
        photo: doc.photo || doc.photoUrl || currentUser.photo,
        gender: doc.gender || currentUser.gender,
        residentialAddress: doc.address || currentUser.residentialAddress,
        dateOfBirth: doc.dob || currentUser.dateOfBirth,
        professionalBio: doc.bio || currentUser.professionalBio,
      });
    }

    const role = useAuthStore.getState().user?.role;
    const r = String(role ?? "").toUpperCase();
    const isAdmin =
      r === "SUPER_ADMIN" || r === "HOSPITAL_ADMIN" || r === "ADMIN";

    if (isAdmin) {
      try {
        await usersApi.adminUpdateStaff(
          userId,
          payload as unknown as AdminUpdateStaffData,
        );
      } catch (e) {
        console.warn("Admin update staff fallback:", e);
      }
    } else {
      try {
        await doctorsApi.update({ userId, doctorId }, payload);
      } catch (e) {
        console.warn("Doctor self update fallback:", e);
      }
    }

    try {
      return await this.getDoctorProfile(doctorId || userId);
    } catch (err) {
      console.log(err);
      return doc;
    }
  },
};

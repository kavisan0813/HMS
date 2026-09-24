import { appointmentsApi } from "../api/appointments.api";
import { departmentsApi } from "../../users/api/departments.api";
import type {
  AppointmentRecord,
  CreateAppointmentRequest,
  RescheduleAppointmentRequest,
  CancelAppointmentRequest,
  LinkedPatient,
  DoctorSummary,
  PatientSummary,
  Department,
} from "../types/appointment.types";

const STATUS_MAP: Record<string, AppointmentRecord["status"]> = {
  BOOKED: "Booked",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked-In",
  WAITING_FOR_VITALS: "Waiting for Vitals",
  WAITING_FOR_DOCTOR: "Waiting for Doctor",
  WAITING_FOR_DOCTOR_CALL: "Waiting for Doctor",
  CALLED: "Called",
  IN_CONSULTATION: "In Consultation",
  CONSULTATION_COMPLETED: "Consultation Completed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
  RESCHEDULED: "Rescheduled",
  WAITING: "Waiting",
  WAITING_FOR_CONSULTATION: "Waiting for Doctor",
  VITALS_DONE: "Waiting for Doctor",
  REGULAR: "Booked",
  SCHEDULED: "Scheduled",
};

export const toDisplayStatus = (status?: string): AppointmentRecord["status"] =>
  STATUS_MAP[String(status || "").toUpperCase()] ||
  (status as AppointmentRecord["status"]) ||
  "Booked";

const normalizeTimeFormat = (timeStr: string): string => {
  if (!timeStr) return "";
  let trimmed = timeStr.trim().toUpperCase().replace(/\s+/g, "");
  if (/^\d{1}:/.test(trimmed)) {
    trimmed = "0" + trimmed;
  }
  return trimmed;
};

const normalizeAppointmentRecord = (
  item: Record<string, unknown> | null | undefined,
  doctorsMap?: Map<string, DoctorSummary>,
): AppointmentRecord => {
  const patient = (item?.patient as Record<string, unknown>) || {};
  const doctor = (item?.doctor as Record<string, unknown>) || {};
  const appointmentDate = (item?.appointmentDate || item?.date || "") as string;
  const startTime = (item?.startTime ||
    item?.timeSlot ||
    item?.appointmentTime ||
    "") as string;

  const docIdStr = String(
    item?.doctorId ?? doctor?.doctorId ?? doctor?.id ?? "",
  );
  const knownDoc = doctorsMap && docIdStr ? doctorsMap.get(docIdStr) : null;

  const deptObj =
    item?.department && typeof item.department === "object"
      ? (item.department as Record<string, unknown>)
      : null;
  const resolvedDeptName = (item?.departmentName ||
    deptObj?.departmentName ||
    deptObj?.name ||
    deptObj?.departmentCode ||
    item?.deptName ||
    item?.dept ||
    (typeof item?.department === "string" ? item.department : undefined) ||
    doctor?.departmentName ||
    doctor?.department ||
    knownDoc?.departmentName ||
    knownDoc?.department ||
    "General Medicine") as string;

  const rawStatus = (item?.status ||
    item?.appointmentStatus ||
    item?.state ||
    "SCHEDULED") as string;
  const displayStatus = toDisplayStatus(rawStatus) || "Booked";

  return {
    id: (item?.id ?? item?.appointmentId ?? item?.appointmentNumber ?? "") as
      | string
      | number,
    appointmentNumber: (item?.appointmentNumber ||
      item?.queueToken ||
      String(item?.id ?? "")) as string,
    queueToken: (item?.queueToken || item?.tokenNo) as string | undefined,
    patientId: (item?.patientId ?? patient?.id ?? "") as string | number,
    patientName: (item?.patientName ||
      patient?.fullName ||
      patient?.name ||
      "") as string,
    patientMrn: (item?.patientMrn || patient?.mrn || item?.mrn) as
      | string
      | undefined,
    doctorId: (item?.doctorId ?? doctor?.doctorId ?? doctor?.id ?? "") as
      | string
      | number,
    doctorName: (item?.doctorName ||
      doctor?.name ||
      doctor?.fullName ||
      "") as string,
    appointmentDate,
    startTime,
    endTime: item?.endTime as string | undefined,
    status: displayStatus,
    queueStatus: (item?.queueStatus || item?.arrivalStatus) as
      | string
      | undefined,
    appointmentType: item?.appointmentType as string | undefined,
    reason: (item?.reason || item?.chiefComplaint) as string | undefined,
    symptoms: item?.symptoms as string | undefined,
    departmentId:
      typeof item?.departmentId === "number"
        ? item.departmentId
        : typeof deptObj?.departmentId === "number" ||
            typeof deptObj?.departmentId === "string"
          ? Number(deptObj.departmentId)
          : undefined,
    departmentName: resolvedDeptName,
    department: resolvedDeptName,
    specialty: (item?.specialty ||
      doctor?.specialty ||
      resolvedDeptName ||
      "General Medicine") as string,

    patient: patient as unknown as PatientSummary,
    doctor: doctor as unknown as DoctorSummary,
    cancellationReason: item?.cancellationReason as string | undefined,
    rescheduleReason: item?.rescheduleReason as string | undefined,
    vitalsRecorded: item?.vitalsRecorded as boolean | undefined,
    paymentStatus: item?.paymentStatus as
      | "PAID"
      | "UNPAID"
      | "PARTIAL"
      | "PENDING"
      | undefined,
    priority: item?.priority as string | undefined,
    arrivalStatus: item?.arrivalStatus as string | undefined,
    opdRoom: (item?.opdRoom || doctor?.opdRoom) as string | undefined,
    waitingTimeMinutes: item?.waitingTimeMinutes as number | undefined,
    isWalkIn: item?.isWalkIn as boolean | undefined,
    createdDate: (item?.createdDate || item?.createdAt) as string | undefined,
    mrn: (item?.mrn || patient?.mrn) as string | undefined,
    patientAge: (item?.patientAge ??
      item?.age ??
      patient?.age ??
      patient?.patientAge) as number | undefined,
    patientGender: (item?.patientGender ||
      item?.gender ||
      patient?.gender ||
      patient?.sex) as string | undefined,
    patientPhone: (item?.patientPhone ||
      item?.phone ||
      item?.mobile ||
      patient?.phone ||
      patient?.mobile) as string | undefined,
    doctorSpecialty: (item?.doctorSpecialty || doctor?.specialty) as
      | string
      | undefined,
    tokenNo: (item?.tokenNo || item?.queueToken) as string | undefined,
    timeSlot: (item?.timeSlot || startTime) as string | undefined,
    visitType: (item?.visitType || item?.appointmentType) as string | undefined,
    chiefComplaint: (item?.chiefComplaint || item?.reason) as
      | string
      | undefined,
    notes: item?.notes as string | undefined,
    arrivalTime: "",
    time: startTime,
  };
};

const unwrapAppointmentCollection = (
  response: unknown,
): Record<string, unknown>[] => {
  if (Array.isArray(response)) return response as Record<string, unknown>[];
  if (!response || typeof response !== "object") return [];
  const res = response as Record<string, unknown>;
  if (Array.isArray(res.data)) return res.data as Record<string, unknown>[];
  if (Array.isArray(res.content))
    return res.content as Record<string, unknown>[];
  if (Array.isArray(res.appointments))
    return res.appointments as Record<string, unknown>[];

  const resData = res.data as Record<string, unknown> | null | undefined;
  if (resData && typeof resData === "object") {
    if (Array.isArray(resData.appointments))
      return resData.appointments as Record<string, unknown>[];
    if (Array.isArray(resData.content))
      return resData.content as Record<string, unknown>[];
    if (Array.isArray(resData.data))
      return resData.data as Record<string, unknown>[];
    const deepData = resData.data as Record<string, unknown> | null | undefined;
    if (deepData && typeof deepData === "object") {
      if (Array.isArray(deepData.content))
        return deepData.content as Record<string, unknown>[];
      if (Array.isArray(deepData.appointments))
        return deepData.appointments as Record<string, unknown>[];
    }
  }

  if (res.success && resData && typeof resData === "object") {
    if (Array.isArray(resData.appointments))
      return resData.appointments as Record<string, unknown>[];
    if (Array.isArray(resData.content))
      return resData.content as Record<string, unknown>[];
    if (Array.isArray(resData.data))
      return resData.data as Record<string, unknown>[];
  }

  return [];
};

export const appointmentService = {
  async listAppointments(params?: {
    doctorId?: string | number;
    patientId?: string | number;
    mrn?: string;
    date?: string;
    fromDate?: string;
    toDate?: string;
    status?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<AppointmentRecord[]> {
    // 1. Fetch doctors lookup to resolve empty/missing department fields
    const doctorsMap = new Map<string, DoctorSummary>();
    try {
      const doctors = await this.listDoctors();
      doctors.forEach((d) => {
        if (d.id) doctorsMap.set(String(d.id), d);
      });
    } catch (e) {
      console.warn("Failed to load doctors for resolving departments:", e);
    }

    const res = await appointmentsApi.getAppointments(params);
    const items = unwrapAppointmentCollection(res);

    return items.map((item) => {
      const docObj = (item?.doctor as Record<string, unknown>) || {};
      const docId = String(
        item?.doctorId || docObj?.id || docObj?.doctorId || "",
      );
      const knownDoc = docId ? doctorsMap.get(docId) : null;

      const updatedItem = { ...item };
      if (knownDoc) {
        if (
          (!updatedItem.departmentName || updatedItem.departmentName === "") &&
          knownDoc.departmentName
        ) {
          updatedItem.departmentName = knownDoc.departmentName;
        }
        if (
          (!updatedItem.departmentId || updatedItem.departmentId === 0) &&
          knownDoc.departmentId
        ) {
          updatedItem.departmentId = Number(knownDoc.departmentId);
        }
      }
      return normalizeAppointmentRecord(updatedItem);
    });
  },

  async listDoctorAppointments(
    doctorId?: string | number,
    date?: string,
    status?: string,
  ): Promise<AppointmentRecord[]> {
    const doctorsMap = new Map<string, DoctorSummary>();
    try {
      const doctors = await this.listDoctors();
      doctors.forEach((d) => {
        if (d.id) doctorsMap.set(String(d.id), d);
      });
    } catch (e) {
      console.warn("Failed to load doctors for resolving departments:", e);
    }

    let rawItems: Record<string, unknown>[];
    try {
      const res = await appointmentsApi.getDoctorAppointments(
        doctorId,
        date,
        status,
      );
      rawItems = unwrapAppointmentCollection(res);
    } catch (err) {
      console.log(err);
      rawItems = [];
    }

    if (rawItems.length === 0) {
      try {
        const fallbackRes = await appointmentsApi.getAppointments({
          doctorId,
          date,
          status,
        });
        const fallbackItems = unwrapAppointmentCollection(fallbackRes);
        if (fallbackItems.length > 0) {
          rawItems = fallbackItems;
        }
      } catch (e) {
        console.warn("Doctor appointment fallback 1 failed:", e);
      }

      if (rawItems.length === 0) {
        try {
          const generalRes = await appointmentsApi.getAppointments({
            date,
            status,
          });
          const generalItems = unwrapAppointmentCollection(generalRes);
          if (generalItems.length > 0) {
            const docIdStr = String(doctorId || "").toLowerCase();
            rawItems = generalItems.filter((item: Record<string, unknown>) => {
              const docObj = (item?.doctor as Record<string, unknown>) || {};
              const itemDocId = String(
                item?.doctorId ?? docObj?.doctorId ?? docObj?.id ?? "",
              );
              const itemDocCode = String(
                item?.doctorCode ?? docObj?.doctorCode ?? docObj?.code ?? "",
              );
              const itemDocName = String(
                item?.doctorName ??
                  docObj?.name ??
                  docObj?.doctorName ??
                  item?.doctor ??
                  "",
              ).toLowerCase();

              return (
                (docIdStr && itemDocId === docIdStr) ||
                (docIdStr && itemDocCode.toLowerCase() === docIdStr) ||
                (docIdStr && itemDocName.includes(docIdStr))
              );
            });
          }
        } catch (e) {
          console.warn("Doctor appointment fallback 2 failed:", e);
        }
      }
    }

    const items: AppointmentRecord[] = rawItems.map((item) =>
      normalizeAppointmentRecord(item, doctorsMap),
    );

    return items.flatMap((item) => {
      const matchesStatus = !status
        ? true
        : String(item?.status || "").toUpperCase() === status.toUpperCase();
      if (!matchesStatus) return [];

      const docObj = (item?.doctor as unknown as Record<string, unknown>) || {};
      const docId = String(
        item?.doctorId || docObj?.id || docObj?.doctorId || "",
      );
      const knownDoc = docId ? doctorsMap.get(docId) : null;

      const updatedItem = { ...item };
      if (knownDoc) {
        if (
          (!updatedItem.departmentName || updatedItem.departmentName === "") &&
          knownDoc.departmentName
        ) {
          updatedItem.departmentName = knownDoc.departmentName;
        }
        if (
          (!updatedItem.departmentId || updatedItem.departmentId === 0) &&
          knownDoc.departmentId
        ) {
          updatedItem.departmentId = Number(knownDoc.departmentId);
        }
      }
      return [normalizeAppointmentRecord(updatedItem)];
    });
  },

  async listPatientAppointments(
    patientId: string | number,
  ): Promise<AppointmentRecord[]> {
    const doctorsMap = new Map<string, DoctorSummary>();
    try {
      const doctors = await this.listDoctors();
      doctors.forEach((d) => {
        if (d.id) doctorsMap.set(String(d.id), d);
      });
    } catch (e) {
      console.warn("Failed to load doctors for resolving departments:", e);
    }

    const res = await appointmentsApi.getPatientAppointments(patientId);
    const items = unwrapAppointmentCollection(res);
    return items.map((item) => {
      const docObj = (item?.doctor as Record<string, unknown>) || {};
      const docId = String(
        item?.doctorId || docObj?.id || docObj?.doctorId || "",
      );
      const knownDoc = docId ? doctorsMap.get(docId) : null;

      const updatedItem = { ...item };
      if (knownDoc) {
        if (
          (!updatedItem.departmentName || updatedItem.departmentName === "") &&
          knownDoc.departmentName
        ) {
          updatedItem.departmentName = knownDoc.departmentName;
        }
        if (
          (!updatedItem.departmentId || updatedItem.departmentId === 0) &&
          knownDoc.departmentId
        ) {
          updatedItem.departmentId = Number(knownDoc.departmentId);
        }
      }
      return normalizeAppointmentRecord(updatedItem);
    });
  },

  async getAppointment(
    appointmentId: string | number,
  ): Promise<AppointmentRecord | null> {
    const res = await appointmentsApi.getAppointmentById(appointmentId);
    const data = res?.data;
    return data
      ? normalizeAppointmentRecord(data as unknown as Record<string, unknown>)
      : null;
  },

  async bookAppointment(
    payload: CreateAppointmentRequest,
  ): Promise<AppointmentRecord> {
    const res = await appointmentsApi.createAppointment(payload);
    const data = res?.data;
    if (!data) {
      throw new Error("Appointment booking did not return a record.");
    }
    return normalizeAppointmentRecord(
      data as unknown as Record<string, unknown>,
    );
  },

  async rescheduleAppointment(
    appointmentId: string | number,
    payload: RescheduleAppointmentRequest,
  ): Promise<AppointmentRecord> {
    const res = await appointmentsApi.rescheduleAppointment(
      appointmentId,
      payload,
    );
    const data = res?.data;
    if (!data) {
      throw new Error("Appointment reschedule did not return a record.");
    }
    return normalizeAppointmentRecord(
      data as unknown as Record<string, unknown>,
    );
  },

  async cancelAppointment(
    appointmentId: string | number,
    payload: CancelAppointmentRequest,
  ): Promise<AppointmentRecord> {
    const res = await appointmentsApi.cancelAppointment(appointmentId, payload);
    const data = res?.data;
    if (!data) {
      throw new Error("Appointment cancellation did not return a record.");
    }
    return normalizeAppointmentRecord(
      data as unknown as Record<string, unknown>,
    );
  },

  async receptionCheckIn(appointmentId: string | number) {
    return appointmentsApi.receptionCheckIn(appointmentId);
  },

  async getQueueTimeline(queueId: string | number) {
    return appointmentsApi.getQueueTimeline(queueId);
  },

  async getAppointmentToken(appointmentId: string | number) {
    const res = await appointmentsApi.getAppointmentToken(appointmentId);
    return res?.data?.tokenNumber || `TK-${String(appointmentId).slice(-4)}`;
  },

  async getTokenDetails(appointmentId: string | number) {
    return appointmentsApi.getTokenDetails(appointmentId);
  },

  async updateAppointmentStatus(
    appointmentId: string | number,
    status: string,
  ) {
    return appointmentsApi.updateAppointmentStatus(appointmentId, status);
  },

  async queueCallNext(doctorId?: string | number) {
    return appointmentsApi.queueCallNext(doctorId);
  },

  async doctorStartConsultation(appointmentId: string | number) {
    return appointmentsApi.doctorStartConsultation(appointmentId);
  },

  async doctorCompleteConsultation(appointmentId: string | number) {
    return appointmentsApi.doctorCompleteConsultation(appointmentId);
  },

  async finalizePrescription(prescriptionId: string | number) {
    return appointmentsApi.finalizePrescription(prescriptionId);
  },

  async generateBill(appointmentId: string | number) {
    return appointmentsApi.generateBill(appointmentId);
  },

  async processPayment(appointmentId: string | number, amount: number) {
    return appointmentsApi.processPayment(appointmentId, amount);
  },

  async listLinkedPatients(): Promise<LinkedPatient[]> {
    const res = await appointmentsApi.getLinkedPatients();
    return Array.isArray(res?.data) ? res.data : [];
  },

  async listDepartments(): Promise<Department[]> {
    const data = await departmentsApi.getDepartments();
    const items = data?.content || (Array.isArray(data) ? data : []);
    return items.map(
      (d: {
        departmentId?: string | number;
        id?: string | number;
        departmentName?: string;
        name?: string;
        departmentCode?: string;
        code?: string;
      }) => ({
        id: String(d.departmentId ?? d.id ?? ""),
        departmentName: d.departmentName ?? d.name ?? "",
        departmentCode: d.departmentCode ?? d.code ?? "",
      }),
    );
  },

  async listDoctors(departmentId?: string | number): Promise<DoctorSummary[]> {
    try {
      const res = await appointmentsApi.getDoctors(departmentId);
      const rawList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      // Read localStorage overrides for status
      const statusOverrides = JSON.parse(
        localStorage.getItem("doctor_status_overrides") || "{}",
      );

      interface DoctorInputShape {
        id?: string | number;
        doctorId?: string | number;
        doctorProfile?: {
          doctorId?: string | number;
          status?: string;
          active?: boolean;
          isActive?: boolean;
          primarySpecialty?: {
            specialtyName?: string;
          };
          consultationFee?: number | string;
          consultFee?: number | string;
          qualification?: string;
        };
        userId?: string | number;
        doctor?: {
          id?: string | number;
          status?: string;
          active?: boolean;
          isActive?: boolean;
        };
        user?: {
          id?: string | number;
          status?: string;
          accountStatus?: string;
          active?: boolean;
          isActive?: boolean;
          enabled?: boolean;
        };
        status?: string;
        accountStatus?: string;
        employmentStatus?: string;
        active?: boolean;
        isActive?: boolean;
        enabled?: boolean;
        doctorName?: string;
        fullName?: string;
        name?: string;
        departmentName?: string;
        department?: string;
        departmentId?: string | number;
        fees?: {
          standardConsultationFee?: number | string;
        };
        consultationFee?: number | string;
        opdRoom?: string;
        primarySpecialty?: {
          specialtyName?: string;
        };
        specialty?: string;
        qualification?: string;
        primaryDepartment?: {
          departmentId?: string | number;
          departmentName?: string;
        };
      }

      // Filter out inactive doctors before mapping
      const activeDoctors = rawList.filter((d: DoctorInputShape) => {
        const candidateIds = [
          d.doctorId,
          d.doctorProfile?.doctorId,
          d.userId,
          d.doctor?.id,
          d.user?.id,
          d.id,
        ];
        const candidateKeys = candidateIds.flatMap((cid) => {
          if (cid === undefined || cid === null || cid === "") return [];
          return [`DOC-${cid}`, String(cid)];
        });

        // Check localStorage override for every possible id/key shape
        if (
          candidateKeys.some(
            (key) => statusOverrides[key]?.status === "Inactive",
          )
        ) {
          return false;
        }

        // Check status field in every known location (handles "INACTIVE", "Inactive", etc.)
        const rawStatuses = [
          d.status,
          d.doctorProfile?.status,
          d.doctor?.status,
          d.user?.status,
          d.accountStatus,
          d.user?.accountStatus,
          d.employmentStatus,
        ].filter((s) => typeof s === "string" && s.trim() !== "");
        if (rawStatuses.some((s) => String(s).toUpperCase() === "INACTIVE")) {
          return false;
        }

        // Check boolean active/enabled flags in every known location
        const booleans = [
          d.active,
          d.isActive,
          d.enabled,
          d.doctorProfile?.active,
          d.doctorProfile?.isActive,
          d.doctor?.active,
          d.doctor?.isActive,
          d.user?.active,
          d.user?.isActive,
          d.user?.enabled,
        ];
        if (booleans.some((flag) => flag === false)) return false;

        return true;
      });

      return activeDoctors.map(
        (d: DoctorInputShape): DoctorSummary => ({
          id: String(
            d.doctorId ?? d.doctorProfile?.doctorId ?? d.userId ?? d.id ?? "",
          ),
          doctorId: d.doctorId ?? d.doctorProfile?.doctorId ?? d.id ?? "",
          name: String(d.doctorName ?? d.fullName ?? d.name ?? ""),
          fullName: String(d.doctorName ?? d.fullName ?? d.name ?? ""),
          departmentName:
            d.departmentName ??
            d.department ??
            d.primaryDepartment?.departmentName ??
            "",
          department:
            d.departmentName ??
            d.department ??
            d.primaryDepartment?.departmentName ??
            "",
          departmentId: (d.departmentId ??
            d.primaryDepartment?.departmentId ??
            departmentId ??
            "") as string | number,
          specialty:
            d.specialty ??
            d.primarySpecialty?.specialtyName ??
            d.doctorProfile?.primarySpecialty?.specialtyName ??
            "",
          qualification:
            d.qualification ?? d.doctorProfile?.qualification ?? "",
          consultationFee:
            Number(
              (d as Record<string, unknown>).consultFee ??
                d.consultationFee ??
                (d as Record<string, unknown>).consultFeeInr ??
                (d as Record<string, unknown>).fee ??
                d.fees?.standardConsultationFee ??
                d.doctorProfile?.consultationFee ??
                d.doctorProfile?.consultFee ??
                0,
            ) || 0,
          opdRoom: d.opdRoom ?? "",
          status:
            d.status ??
            d.doctorProfile?.status ??
            d.doctor?.status ??
            d.user?.status ??
            "ACTIVE",
          active:
            d.active ??
            d.isActive ??
            d.enabled ??
            d.doctorProfile?.active ??
            d.doctorProfile?.isActive ??
            d.doctor?.active ??
            d.doctor?.isActive ??
            d.user?.active ??
            d.user?.isActive ??
            d.user?.enabled ??
            (d.status
              ? String(d.status).toUpperCase() === "ACTIVE"
              : undefined),
        }),
      );
    } catch (error) {
      console.warn("[appointmentService] listDoctors failed:", error);
      return [];
    }
  },

  async listAvailableSlots(
    doctorId: string | number,
    date: string,
  ): Promise<unknown[]> {
    type AppointmentSlot = {
      id?: number;
      slotId?: number;
      time: string;
      startTime?: string;
      endTime?: string;
      slot?: string;
      available: boolean;
      [key: string]: unknown;
    };

    let availabilitySlots: unknown[] = [];
    try {
      const res = await appointmentsApi.getAvailableSlots(doctorId, date);
      const rawData = (res as { data?: unknown })?.data ?? res;
      availabilitySlots = Array.isArray(rawData)
        ? rawData
        : Array.isArray((rawData as { slots?: unknown[] })?.slots)
          ? (rawData as { slots: unknown[] }).slots
          : Array.isArray((rawData as { content?: unknown[] })?.content)
            ? (rawData as { content: unknown[] }).content
            : [];
    } catch (e) {
      console.warn("Failed to load doctor availability slots from API:", e);
    }

    const defaultTimeSlots = [
      "09:00 AM",
      "09:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "12:00 PM",
      "02:00 PM",
      "02:30 PM",
      "03:00 PM",
      "03:30 PM",
      "04:00 PM",
      "04:30 PM",
      "05:00 PM",
    ];

    let slots: AppointmentSlot[];

    if (availabilitySlots.length === 0) {
      slots = defaultTimeSlots.map((timeStr, idx) => ({
        id: idx + 1,
        slotId: idx + 1,
        time: timeStr,
        startTime: timeStr,
        available: true,
      }));
    } else {
      slots = availabilitySlots.map(
        (rawItem: unknown, idx: number): AppointmentSlot => {
          const s = (rawItem as Record<string, unknown>) || {};
          const statusUpper = String(s.status || "").toUpperCase();
          const available =
            statusUpper === "" ||
            ["AVAILABLE", "OPEN", "FREE", "TRUE"].includes(statusUpper) ||
            s.available === true;
          return {
            ...s,
            id: (s.id || s.slotId || idx + 1) as number,
            slotId: (s.slotId || s.id || idx + 1) as number,
            time: String(s.startTime || s.endTime || s.time || s.slot || ""),
            available,
          };
        },
      );
    }

    try {
      const apptRes = await appointmentsApi.getAppointments({ doctorId, date });
      const appointments = unwrapAppointmentCollection(apptRes).map((item) =>
        normalizeAppointmentRecord(item),
      );

      const occupiedSlots = new Set<string>();
      const blockingStatusSet = new Set([
        "BOOKED",
        "CONFIRMED",
        "CHECKED_IN",
        "WAITING_FOR_VITALS",
        "WAITING_FOR_DOCTOR_CALL",
        "CALLED",
        "IN_CONSULTATION",
        "COMPLETED",
        "CONSULTATION_COMPLETED",
        "BILLING_PENDING",
        "PAYMENT_COMPLETED",
        "Booked",
        "Scheduled",
        "Checked-In",
        "Waiting",
        "Waiting for Vitals",
        "Waiting for Doctor",
        "Called",
        "In Consultation",
        "In Progress",
      ]);

      appointments.forEach((apt) => {
        const statusUpper = String(apt.status || "").toUpperCase();
        const displayStatus = STATUS_MAP[statusUpper] || apt.status;
        const isBlocking =
          blockingStatusSet.has(statusUpper) ||
          blockingStatusSet.has(displayStatus);

        if (isBlocking) {
          const slotTime = apt.startTime || apt.timeSlot || apt.appointmentTime;
          if (slotTime) {
            occupiedSlots.add(normalizeTimeFormat(slotTime));
          }
        }
      });

      slots = slots.map((s) => {
        const slotTime = s.time || s.startTime || s.slot;
        if (slotTime && occupiedSlots.has(normalizeTimeFormat(slotTime))) {
          return { ...s, available: false };
        }
        return s;
      });
    } catch (err) {
      console.warn("Failed to block slots dynamically based on status:", err);
    }

    return slots;
  },

  async getAppointmentsByStatus(
    status: string,
    params?: {
      doctorId?: string | number;
      date?: string;
      page?: number;
      size?: number;
    },
  ): Promise<AppointmentRecord[]> {
    const res = await appointmentsApi.getAppointments({
      ...params,
      status,
    });
    const items = unwrapAppointmentCollection(res);
    return items.map((item) => normalizeAppointmentRecord(item));
  },

  async getActiveAppointments(params?: {
    doctorId?: string | number;
    date?: string;
    page?: number;
    size?: number;
  }): Promise<AppointmentRecord[]> {
    const activeStatuses = [
      "BOOKED",
      "CONFIRMED",
      "CHECKED_IN",
      "WAITING_FOR_VITALS",
      "WAITING_FOR_DOCTOR_CALL",
      "CALLED",
      "IN_CONSULTATION",
      "CONSULTATION_COMPLETED",
      "BILLING_PENDING",
      "PAYMENT_COMPLETED",
      "COMPLETED",
    ];
    const results = await Promise.all(
      activeStatuses.map((status) =>
        this.getAppointmentsByStatus(status, params),
      ),
    );
    return results.flat();
  },

  async isSlotAvailable(
    doctorId: string | number,
    date: string,
    startTime: string,
  ): Promise<boolean> {
    const slots = await this.listAvailableSlots(doctorId, date);
    const slot = slots.find((rawItem: unknown) => {
      const s = (rawItem as Record<string, unknown>) || {};
      return (
        s.time === startTime ||
        s.startTime === startTime ||
        s.slot === startTime
      );
    });
    return (slot as Record<string, unknown>)?.available !== false;
  },

  async getBlockedStatuses(): Promise<string[]> {
    return ["CANCELLED", "NO_SHOW"];
  },

  // ── Queue Management Methods ──

  async queueCallPatient(appointmentId: string | number) {
    return appointmentsApi.queueCallPatient(appointmentId);
  },

  async queueRecallPatient(appointmentId: string | number) {
    return appointmentsApi.queueRecallPatient(appointmentId);
  },

  async queueStartConsultation(appointmentId: string | number) {
    return appointmentsApi.queueStartConsultation(appointmentId);
  },

  async queueCompleteConsultation(appointmentId: string | number) {
    return appointmentsApi.queueCompleteConsultation(appointmentId);
  },

  async queueSkipPatient(appointmentId: string | number, reason?: string) {
    return appointmentsApi.queueSkipPatient(appointmentId, reason);
  },

  async queueRequeuePatient(appointmentId: string | number) {
    return appointmentsApi.queueRequeuePatient(appointmentId);
  },

  async queueTransferPatient(
    appointmentId: string | number,
    targetDoctorId: string | number,
    reason?: string,
  ) {
    return appointmentsApi.queueTransferPatient(
      appointmentId,
      targetDoctorId,
      reason,
    );
  },

  async queueRemovePatient(appointmentId: string | number, reason?: string) {
    return appointmentsApi.queueRemovePatient(appointmentId, reason);
  },

  async receptionMarkNoShow(appointmentId: string | number, reason?: string) {
    return appointmentsApi.receptionMarkNoShow(appointmentId, reason);
  },
};

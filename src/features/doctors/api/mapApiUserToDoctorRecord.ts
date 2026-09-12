import type {
  ApiUserDoctorRecord,
  DoctorRecord,
  ApiDoctorProfile,
  ApiScheduleExceptionItem,
  ApiSpecialtyRef,
  ApiAvailabilityItem,
} from "../types/doctors.types";

interface ApiFallbackRecord {
  primaryDepartment?: ApiDoctorProfile["primaryDepartment"];
  primarySpecialty?: ApiDoctorProfile["primarySpecialty"];
  gender: string;
  email: string;
  profile?: ApiDoctorProfile;
  doctor?: ApiDoctorProfile;
  departmentName?: string;
  department?: string;
  primaryDepartmentName?: string;
  deptName?: string;
  dept?: string;
  departmentId?: number;
  specialtyName?: string;
  specialty?: string;
  primarySpecialtyName?: string;
  specName?: string;
  specialtyId?: number;
  qualification?: string;
  yearsOfExperience?: number;
  experienceYrs?: number;
  experienceYears?: number;
  experience?: number;
  medicalRegistrationNumber?: string;
  regNumber?: string;
  empId?: string;
  employeeId?: string;
  consultationFee?: number;
  fees?: { standardConsultationFee?: number; followUpFee?: number };
  followUpFee?: number;
  slotDurationMinutes?: number;
  availability?: ApiAvailabilityItem[];
  doctorId?: number;
  userId?: number;
  id?: number;
  photoUrl?: string;
  photo?: string;
  opdRoom?: string;
  joinedDate?: string;
  status?: string;
  scheduleExceptions?: ApiScheduleExceptionItem[];
  effectiveFrom?: string;
  effectiveTo?: string;
  availabilityTemplate?: string;
  bio?: string;
  professionalBio?: string;
  designation?: string;
  dateOfBirth?: string;
  dob?: string;
  address?: string;
  residentialAddress?: string;
  phone?: string;
  mobile?: string;
  name?: string;
}

export function mapApiUserToDoctorRecord(u: ApiUserDoctorRecord): DoctorRecord {
  const fallbackRecord = (u || {}) as ApiFallbackRecord;
  const profile = (u.doctorProfile ||
    fallbackRecord.profile ||
    fallbackRecord.doctor ||
    u) as unknown as ApiDoctorProfile;
  const anyProfile = (profile || {}) as unknown as ApiFallbackRecord;

  const primaryDept =
    profile?.primaryDepartment?.departmentName ||
    anyProfile?.primaryDepartmentName ||
    anyProfile?.departmentName ||
    anyProfile?.department ||
    fallbackRecord.departmentName ||
    fallbackRecord.department ||
    fallbackRecord.primaryDepartmentName ||
    fallbackRecord.primaryDepartment?.departmentName ||
    fallbackRecord.deptName ||
    fallbackRecord.dept ||
    "";

  const primarySpec =
    profile?.primarySpecialty?.specialtyName ||
    anyProfile?.primarySpecialtyName ||
    anyProfile?.specialtyName ||
    anyProfile?.specialty ||
    fallbackRecord.specialtyName ||
    fallbackRecord.specialty ||
    fallbackRecord.primarySpecialtyName ||
    fallbackRecord.primarySpecialty?.specialtyName ||
    fallbackRecord.specName ||
    "";

  const qualification =
    profile?.qualification ||
    anyProfile?.qualification ||
    fallbackRecord.qualification ||
    "";

  const experienceYrs =
    profile?.yearsOfExperience ??
    anyProfile?.yearsOfExperience ??
    anyProfile?.experienceYrs ??
    anyProfile?.experienceYears ??
    anyProfile?.experience ??
    fallbackRecord.yearsOfExperience ??
    fallbackRecord.experienceYrs ??
    fallbackRecord.experienceYears ??
    fallbackRecord.experience ??
    0;

  const regNumber =
    profile?.medicalRegistrationNumber ||
    anyProfile?.medicalRegistrationNumber ||
    anyProfile?.regNumber ||
    fallbackRecord.medicalRegistrationNumber ||
    fallbackRecord.regNumber ||
    "";

  const empId =
    u.employeeId ||
    fallbackRecord.empId ||
    anyProfile?.employeeId ||
    anyProfile?.empId ||
    "";

  const consultationFee =
    profile?.consultationFee ??
    anyProfile?.consultationFee ??
    anyProfile?.fees?.standardConsultationFee ??
    fallbackRecord.consultationFee ??
    fallbackRecord.fees?.standardConsultationFee ??
    0;

  const followUpFee =
    profile?.followUpFee ??
    anyProfile?.followUpFee ??
    fallbackRecord.followUpFee ??
    0;

  const slotDurationMinutes =
    profile?.slotDurationMinutes ??
    anyProfile?.slotDurationMinutes ??
    fallbackRecord.slotDurationMinutes ??
    15;

  const slotDuration = slotDurationMinutes
    ? `${slotDurationMinutes} mins`
    : "15 mins";

  const rawAvail =
    profile?.availability ||
    anyProfile?.availability ||
    fallbackRecord.availability ||
    [];
  const workingDays = Array.from(
    new Set(
      rawAvail.map((a: ApiAvailabilityItem) =>
        String(a.dayOfWeek || "")
          .substring(0, 3)
          .toUpperCase(),
      ),
    ),
  ).filter(Boolean);

  let shiftTimings = "";
  if (rawAvail.length > 0 && rawAvail[0].startTime && rawAvail[0].endTime) {
    shiftTimings = `${rawAvail[0].startTime} - ${rawAvail[0].endTime}`;
  }

  const rawStatus = String(
    u.status || anyProfile?.status || "ACTIVE",
  ).toUpperCase();
  let status: "Active" | "Inactive" | "On Leave" | "Suspended" = "Active";
  if (rawStatus === "INACTIVE") status = "Inactive";
  else if (rawStatus === "ON_LEAVE" || rawStatus === "LEAVE")
    status = "On Leave";
  else if (rawStatus === "SUSPENDED") status = "Suspended";

  const rawDoctorId =
    profile?.doctorId ?? anyProfile?.doctorId ?? fallbackRecord.doctorId ?? 0;
  const hasExplicitDoctorId = Number.isFinite(rawDoctorId) && rawDoctorId > 0;
  const rawUserId = hasExplicitDoctorId
    ? (u.userId ?? anyProfile?.userId ?? 0)
    : (u.userId ?? u.id ?? anyProfile?.userId ?? anyProfile?.id ?? 0);
  const finalDoctorId = hasExplicitDoctorId ? rawDoctorId : rawUserId;

  const fullName = String(u.fullName || u.name || anyProfile?.name || "");
  const photoUrl = String(
    fallbackRecord.photoUrl ||
      fallbackRecord.photo ||
      anyProfile?.photoUrl ||
      anyProfile?.photo ||
      "",
  );
  const photo = String(
    fallbackRecord.photo ||
      fallbackRecord.photoUrl ||
      anyProfile?.photo ||
      anyProfile?.photoUrl ||
      "",
  );

  return {
    fullName,
    id: `DOC-${finalDoctorId || rawUserId}`,
    userId: Number(rawUserId),
    doctorId: Number(finalDoctorId),
    empId: String(empId || ""),
    regNumber: String(regNumber || ""),
    name: fullName.startsWith("Dr.") ? fullName : `Dr. ${fullName || "Doctor"}`,
    gender:
      ((u.gender || anyProfile?.gender) as "Male" | "Female" | "Other") ||
      "Male",
    department: String(primaryDept || ""),
    primaryDepartmentId:
      profile?.primaryDepartment?.departmentId ??
      anyProfile?.departmentId ??
      fallbackRecord.departmentId,
    specialty: String(primarySpec || ""),
    primarySpecialtyId:
      profile?.primarySpecialty?.specialtyId ??
      anyProfile?.specialtyId ??
      fallbackRecord.specialtyId,
    qualification: String(qualification || ""),
    experienceYrs: Number(experienceYrs),
    consultationFee: Number(consultationFee),
    followUpFee: Number(followUpFee),
    slotDuration,
    slotDurationMinutes: Number(slotDurationMinutes),
    availability:
      status === "Inactive"
        ? "Out of Office"
        : status === "On Leave"
          ? "On Leave"
          : "Available Today",
    status,
    email: String(u.email || anyProfile?.email || ""),
    phone: String(
      u.mobile ||
        u.phoneNumber ||
        u.phone ||
        anyProfile?.phone ||
        anyProfile?.mobile ||
        "",
    ),
    address: String(
      u.residentialAddress ||
        anyProfile?.address ||
        anyProfile?.residentialAddress ||
        "",
    ),
    dob: String(
      u.dateOfBirth || anyProfile?.dateOfBirth || anyProfile?.dob || "",
    ),
    opdRoom: String(anyProfile?.opdRoom || fallbackRecord.opdRoom || ""),
    joinedDate: String(
      anyProfile?.joinedDate || fallbackRecord.joinedDate || "",
    ),
    shiftTimings,
    workingDays: workingDays.length > 0 ? (workingDays as string[]) : [],
    bio: String(
      u.professionalBio || anyProfile?.bio || anyProfile?.professionalBio || "",
    ),
    designation: String(
      (profile?.designation as string) || anyProfile?.designation || "",
    ),
    scheduleExceptions:
      profile?.scheduleExceptions || anyProfile?.scheduleExceptions || [],
    rawAvailability: rawAvail,
    secondarySpecialties:
      profile?.secondarySpecialties?.map(
        (s: ApiSpecialtyRef) => s.specialtyName,
      ) || [],
    photoUrl,
    photo,
    effectiveFrom: anyProfile?.effectiveFrom as string | undefined,
    effectiveTo: anyProfile?.effectiveTo as string | undefined,
    availabilityTemplate: anyProfile?.availabilityTemplate as
      | string
      | undefined,
  };
}

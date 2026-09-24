import { useState, useEffect, useMemo, useRef } from "react";
import {
  Edit,
  X,
  Check,
  Loader2,
  AlertTriangle,
  Clock,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { TimeSelect } from "../../../components/TimeSelect";
import { usersApi } from "../api/users.api";
import { departmentsApi } from "../api/departments.api";
import { doctorsApi } from "../../doctors/api/doctors.api";
import { to24Hour } from "../../../lib/time-utils";
import { UserAvatar } from "../../../common/components/UserAvatar";
import type {
  BackendAvailabilityItem,
  UserDetailData,
  AdminUpdateStaffData,
  ScheduleException,
  OpdWeeklySchedule,
} from "../types/users.types";
import type { ApiWeeklyScheduleData } from "../../doctors/types/doctors.types";

const PP = "Poppins, sans-serif";
const RB = "Roboto, sans-serif";

export interface EditableStaffUser {
  id: string;
  userId?: number | string;
  empId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: string | null;
  status: string;
  doctorId?: number;
  photoUrl?: string | null;
  photo?: string | null;
}

export interface EditStaffUserDrawerProps {
  user: EditableStaffUser | null;
  onClose: () => void;
  onSaved: () => void;
}

const DAY_NAME_MAP: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const mapHospitalScheduleToAvailability = (
  schedule: OpdWeeklySchedule,
): BackendAvailabilityItem[] => {
  if (!schedule?.weeklySchedule) return [];
  return schedule.weeklySchedule.map((day) => {
    const intervals = day.workingIntervals || [];
    const firstInterval = intervals[0];
    return {
      dayOfWeek: day.dayOfWeek.toUpperCase(),
      startTime: firstInterval?.startTime || "",
      endTime: firstInterval?.endTime || "",
    };
  });
};

const isTimeWithinWindow = (
  time: string,
  windowStart: string,
  windowEnd: string,
): boolean => {
  if (!time || !windowStart || !windowEnd) return true;
  const t = to24Hour(time);
  const ws = to24Hour(windowStart);
  const we = to24Hour(windowEnd);
  return t >= ws && t <= we;
};

const createInitialForm = (
  user: EditableStaffUser | null,
  departments: { id: number | string; name: string }[],
  deptNameToId: Record<string, number>,
) => {
  if (!user) {
    return {
      fullName: "",
      email: "",
      phone: "",
      gender: "MALE",
      dateOfBirth: "",
      photoUrl: "",
      photo: "",
      residentialAddress: "",
      professionalBio: "",
      medicalRegistrationNumber: "",
      qualification: "",
      yearsOfExperience: 0,
      primaryDepartmentId: 2,
      primarySpecialtyId: 1,
      consultationFee: 500,
      slotDurationMinutes: 15,
      availability: [] as BackendAvailabilityItem[],
      scheduleExceptions: [] as ScheduleException[],
      department: "General Medicine",
      status: "Active",
    };
  }
  return {
    fullName: user.fullName || "",
    email: user.email || "",
    phone: user.phone || "",
    gender: "MALE",
    dateOfBirth: "",
    photoUrl: user.photoUrl || user.photo || "",
    photo: user.photo || user.photoUrl || "",
    residentialAddress: "",
    professionalBio: "",
    medicalRegistrationNumber: "",
    qualification: "",
    yearsOfExperience: 0,
    primaryDepartmentId:
      (user.department ? deptNameToId[user.department] : undefined) ??
      (departments.length ? Number(departments[0].id) : 2),
    primarySpecialtyId: 1,
    consultationFee: 500,
    slotDurationMinutes: 15,
    availability: [] as BackendAvailabilityItem[],
    scheduleExceptions: [] as ScheduleException[],
    department: user.department || "General Medicine",
    status: user.status || "Active",
  };
};

export function EditStaffUserDrawer({
  user,
  onClose,
  onSaved,
}: EditStaffUserDrawerProps) {
  const [departments, setDepartments] = useState<
    { id: number | string; name: string }[]
  >([]);
  const [hospitalSchedule, setHospitalSchedule] =
    useState<OpdWeeklySchedule | null>(null);

  const deptNameToId = useMemo(() => {
    const map: Record<string, number> = {};
    departments.forEach((d) => {
      map[d.name] = Number(d.id);
    });
    return map;
  }, [departments]);

  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [doctorSchedule, setDoctorSchedule] =
    useState<ApiWeeklyScheduleData | null>(null);

  const [form, setForm] = useState(() =>
    createInitialForm(user, departments, deptNameToId),
  );

  const [prevUserId, setPrevUserId] = useState<string | null>(null);

  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    setSaveError(null);
    setPhotoUploadError(null);
    setIsLoadingDetail(true);
    setLoadWarning(null);
    setForm(createInitialForm(user, departments, deptNameToId));
  }

  const isDoctor = (user?.role || "").toUpperCase().includes("DOCTOR");

  // Fetch departments (mirrors UserManagement approach)
  useEffect(() => {
    departmentsApi
      .getDepartmentLookup(true)
      .then((lookupList) => {
        if (lookupList && lookupList.length > 0) {
          const mapped = lookupList.map((d) => ({
            id: d.departmentId,
            name: d.departmentName,
          }));
          if (mapped.length > 0) setDepartments(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch hospital OPD weekly schedule for doctor availability defaults
  useEffect(() => {
    usersApi
      .fetchOpdWeeklySchedule()
      .then((schedule) => {
        setHospitalSchedule(schedule);
      })
      .catch(() => {});
  }, []);

  // Reset + prefill whenever a new user opens the drawer
  useEffect(() => {
    if (!user) return;
    let isCancelled = false;

    const loadUserDetails = async (candidateId: string) => {
      try {
        const response = await usersApi.adminGetUserById(candidateId);
        if (isCancelled) return null;
        if (!response.success || !response.data) {
          return null;
        }
        const detail: UserDetailData = response.data;
        const profile = detail.doctorProfile;
        const loadedPhoto =
          detail.photoUrl ||
          detail.photo ||
          (profile as { photoUrl?: string; photo?: string } | undefined)
            ?.photoUrl ||
          (profile as { photoUrl?: string; photo?: string } | undefined)
            ?.photo ||
          user.photoUrl ||
          user.photo ||
          "";

        setForm((prev) => ({
          ...prev,
          fullName: detail.fullName || user.fullName,
          email: detail.email || user.email,
          phone: detail.mobile || user.phone,
          gender: detail.gender || "MALE",
          dateOfBirth: detail.dateOfBirth || "",
          photoUrl: String(loadedPhoto || ""),
          photo: String(loadedPhoto || ""),
          residentialAddress: detail.residentialAddress || "",
          professionalBio: detail.professionalBio || "",
          employeeId: detail.employeeId || user.empId,
          role: detail.role || user.role,
          status: detail.status || user.status,
          medicalRegistrationNumber: profile?.medicalRegistrationNumber || "",
          qualification: profile?.qualification || "",
          yearsOfExperience: profile?.yearsOfExperience || 0,
          primaryDepartmentId:
            profile?.primaryDepartment?.departmentId ||
            (user.department ? deptNameToId[user.department] : undefined) ||
            (departments.length > 0 ? Number(departments[0].id) : 2),
          primarySpecialtyId: profile?.primarySpecialty?.specialtyId || 1,
          consultationFee: profile?.consultationFee ?? 500,
          slotDurationMinutes: profile?.slotDurationMinutes || 15,
          availability:
            profile?.availability && profile.availability.length > 0
              ? profile.availability
              : hospitalSchedule
                ? mapHospitalScheduleToAvailability(hospitalSchedule)
                : [],
          scheduleExceptions: profile?.scheduleExceptions || [],
        }));
        return detail;
      } catch {
        return null;
      }
    };

    const resolveAndLoad = async () => {
      setIsLoadingDetail(true);
      setLoadWarning(null);

      const candidates = [
        user.userId ? String(user.userId) : null,
        user.id,
        user.doctorId ? String(user.doctorId) : null,
      ].filter(Boolean) as string[];

      // Deduplicate candidates
      const uniqueCandidates = Array.from(new Set(candidates));

      let detail: UserDetailData | null = null;
      for (const candidate of uniqueCandidates) {
        detail = await loadUserDetails(candidate);
        if (detail) break;
      }

      if (!detail && (user.email || user.empId)) {
        try {
          const allUsers = await usersApi.adminGetUsers();
          const matchedUser = allUsers.data?.find(
            (u) =>
              (user.email && u.email?.toLowerCase() === user.email.toLowerCase()) ||
              (user.empId && (u as { employeeId?: string }).employeeId === user.empId),
          );
          if (matchedUser && matchedUser.id) {
            detail = await loadUserDetails(String(matchedUser.id));
          }
        } catch {
          // ignore lookup failure
        }
      }

      if (!detail && !isCancelled) {
        setLoadWarning(
          "User account could not be found for this doctor. You can still update the locally available information.",
        );
      }

      if (!isCancelled) setIsLoadingDetail(false);
    };

    resolveAndLoad();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.id,
    user?.userId,
    user?.doctorId,
    user?.email,
    user?.empId,
  ]);

  useEffect(() => {
    if (!user || user.role !== "Doctor" || !user.doctorId) {
      return;
    }
    let isCancelled = false;

    doctorsApi
      .getWeeklySchedule(user.doctorId)
      .then((data) => {
        if (!isCancelled) setDoctorSchedule(data);
      })
      .catch(() => {
        if (!isCancelled) setDoctorSchedule(null);
      });

    return () => {
      isCancelled = true;
    };
  }, [user?.doctorId, user?.role, user]);

  if (!user) return null;

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setPhotoUploadError(
        "Please upload a valid image file (JPG, PNG, WEBP, GIF, SVG).",
      );
      return;
    }
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const err = `Image file size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 5MB.`;
      setPhotoUploadError(err);
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoUploadError(null);
    try {
      const uploadedUrl = await usersApi.uploadPhoto(file);
      setForm((prev) => ({
        ...prev,
        photoUrl: uploadedUrl,
        photo: uploadedUrl,
      }));
    } catch (err: unknown) {
      setPhotoUploadError(
        err instanceof Error ? err.message : "Failed to upload photo.",
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({
      ...prev,
      photoUrl: "",
      photo: "",
    }));
    setPhotoUploadError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (isUploadingPhoto) {
      setSaveError("Please wait for photo upload to finish before saving.");
      return;
    }

    setIsSubmitting(true);
    setSaveError(null);
    try {
      // Validate doctor availability against hospital schedule
      if (isDoctor && hospitalSchedule?.weeklySchedule) {
        for (const item of form.availability) {
          const hospitalDay = hospitalSchedule.weeklySchedule.find(
            (d) => d.dayOfWeek.toUpperCase() === item.dayOfWeek.toUpperCase(),
          );
          if (hospitalDay && hospitalDay.isOpen) {
            const interval = hospitalDay.workingIntervals?.[0];
            if (interval) {
              if (
                !isTimeWithinWindow(
                  item.startTime,
                  interval.startTime,
                  interval.endTime,
                )
              ) {
                setSaveError(
                  `${item.dayOfWeek} start time ${item.startTime} is outside hospital schedule (${interval.startTime} - ${interval.endTime}).`,
                );
                setIsSubmitting(false);
                return;
              }
              if (
                !isTimeWithinWindow(
                  item.endTime,
                  interval.startTime,
                  interval.endTime,
                )
              ) {
                setSaveError(
                  `${item.dayOfWeek} end time ${item.endTime} is outside hospital schedule (${interval.startTime} - ${interval.endTime}).`,
                );
                setIsSubmitting(false);
                return;
              }
            }
          }
        }
      }

      const deptId =
        form.primaryDepartmentId ||
        deptNameToId[form.department] ||
        (departments.length > 0 ? Number(departments[0].id) : 2);
      const apiStatus =
        form.status.toUpperCase() === "ACTIVE"
          ? "ACTIVE"
          : form.status.toUpperCase() === "SUSPENDED"
            ? "SUSPENDED"
            : form.status.toUpperCase() === "PENDING"
              ? "PENDING"
              : "INACTIVE";
      const changeReason = `Updated staff details via ${
        isDoctor ? "Doctor" : "User"
      } Management`;

      const payload: AdminUpdateStaffData = {
        fullName: form.fullName,
        email: form.email,
        mobile: form.phone,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        photo: form.photo || form.photoUrl || undefined,
        photoUrl: form.photoUrl || form.photo || undefined,
        residentialAddress: form.residentialAddress,
        professionalBio: form.professionalBio,
        medicalRegistrationNumber: form.medicalRegistrationNumber,
        qualification: form.qualification,
        yearsOfExperience: Number(form.yearsOfExperience),
        primaryDepartmentId: deptId,
        secondaryDepartmentIds: [],
        primarySpecialtyId: form.primarySpecialtyId || 1,
        secondarySpecialtyIds: [],
        consultationFee: Number(form.consultationFee),
        slotDurationMinutes: Number(form.slotDurationMinutes),
        availability: form.availability.map((item) => ({
          ...item,
          startTime: to24Hour(item.startTime),
          endTime: to24Hour(item.endTime),
        })),
        scheduleExceptions: form.scheduleExceptions,
        departmentId: deptId,
        status: apiStatus,
        changeReason: changeReason,
      };

      const response = await usersApi.adminUpdateStaff(user.id, payload);
      if (response.success) {
        onSaved();
      } else {
        setSaveError(response.message || "Failed to update staff profile.");
      }
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : "Error updating staff profile.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAvailability = (
    index: number,
    key: "startTime" | "endTime",
    value: string,
  ) => {
    setForm((prev) => {
      const next = [...prev.availability];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, availability: next };
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        role="presentation"
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-gray-100 transition-transform duration-200">
          <div className="px-6 py-4 bg-[#009688] text-white flex items-center justify-between shadow-sm">
            <div>
              <h2
                className="text-base font-bold flex items-center gap-2"
                style={{ fontFamily: PP }}
              >
                <Edit size={18} /> Edit {isDoctor ? "Doctor" : "User"} Details
              </h2>
              <p className="text-xs text-teal-100 mt-0.5">
                Modify profile info for {user.empId}
              </p>
            </div>
            <button
              aria-label="Close"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleSave}
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F1F5F9]/50"
            style={{ fontFamily: RB }}
          >
            {saveError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#EF4444] font-semibold flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {isLoadingDetail && (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                <Loader2 size={14} className="animate-spin" /> Fetching current
                profile data...
              </div>
            )}

            {loadWarning && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 font-semibold flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{loadWarning}</span>
              </div>
            )}

            {/* Profile Photo Upload Section */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative shadow-xs">
                  {form.photoUrl || form.photo ? (
                    <img
                      src={form.photoUrl || form.photo}
                      alt={form.fullName || "Staff"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserAvatar
                      name={form.fullName || user.fullName || "Staff"}
                      size="lg"
                      src={form.photoUrl || form.photo || undefined}
                    />
                  )}

                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span className="text-[8px] font-bold mt-0.5">
                        Uploading
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  title="Upload Photo"
                  className="absolute -bottom-1 -right-1 p-1 bg-[#009688] text-white rounded-lg shadow-sm hover:bg-[#00796B] transition-colors cursor-pointer disabled:opacity-50 border border-white"
                >
                  <Camera size={11} />
                </button>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon size={13} className="text-[#009688]" />
                      Profile Photo
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      JPG, PNG, WEBP, GIF up to 5MB
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file);
                        e.target.value = "";
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2
                            size={11}
                            className="animate-spin text-[#009688]"
                          />
                          Uploading
                        </>
                      ) : form.photoUrl || form.photo ? (
                        <>
                          <Upload size={11} /> Replace
                        </>
                      ) : (
                        <>
                          <Upload size={11} /> Upload
                        </>
                      )}
                    </button>

                    {(form.photoUrl || form.photo) && !isUploadingPhoto && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {photoUploadError && (
                  <div className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-[10px] text-red-600 font-semibold flex items-center gap-1">
                    <AlertTriangle size={11} className="shrink-0" />
                    <span>{photoUploadError}</span>
                  </div>
                )}

                {form.photoUrl && !photoUploadError && !isUploadingPhoto && (
                  <div className="text-[10px] text-teal-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-[#009688]" />
                    Photo attached
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-xs font-bold text-[#64748B] mb-1">
                  System Access Role (Locked)
                  <input
                    aria-label="Input field"
                    type="text"
                    readOnly
                    value={user.role}
                    className="w-full px-3 py-2.5 text-xs bg-slate-100 border border-[#E5E7EB] rounded-xl text-slate-500 outline-none font-semibold cursor-not-allowed"
                  />
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-[#111827] mb-1">
                  Account Status
                  <select
                    aria-label="Select option"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-xs bg-white border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#009688]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </span>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-[#111827] mb-1">
                Full Name *
                <input
                  aria-label="Input field"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2.5 text-xs bg-white border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#009688]"
                />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-xs font-bold text-[#111827] mb-1">
                  Email Address *
                  <input
                    aria-label="Input field"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-xs bg-white border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#009688]"
                  />
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-[#111827] mb-1">
                  Phone Number
                  <input
                    aria-label="Input field"
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-xs bg-white border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#009688]"
                  />
                </span>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-[#111827] mb-1">
                Department
              </span>
              {isDoctor ? (
                <select
                  aria-label="Select option"
                  value={form.department}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      department: e.target.value,
                      primaryDepartmentId:
                        deptNameToId[e.target.value] ||
                        (departments.length > 0
                          ? Number(departments[0].id)
                          : 2),
                    })
                  }
                  className="w-full px-3 py-2.5 text-xs bg-white border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#009688]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  aria-label="Input field"
                  type="text"
                  value={form.department}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      department: e.target.value,
                      primaryDepartmentId:
                        deptNameToId[e.target.value] ||
                        (departments.length > 0
                          ? Number(departments[0].id)
                          : 2),
                    })
                  }
                  className="w-full px-3 py-2.5 text-xs bg-white border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#009688]"
                />
              )}
            </div>

            {/* Additional Doctor Clinical Profile Inputs if Doctor */}
            {isDoctor && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-[#009688] uppercase tracking-wider">
                  Doctor Clinical Profile & Fees
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs font-bold text-[#111827] mb-1">
                      Reg Number
                      <input
                        aria-label="Input field"
                        type="text"
                        value={form.medicalRegistrationNumber}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            medicalRegistrationNumber: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-xl outline-none focus:border-[#009688]"
                      />
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#111827] mb-1">
                      Qualification
                      <input
                        aria-label="Input field"
                        type="text"
                        value={form.qualification}
                        onChange={(e) =>
                          setForm({ ...form, qualification: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-xl outline-none focus:border-[#009688]"
                      />
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="block text-xs font-bold text-[#111827] mb-1">
                      Experience (Yrs)
                      <input
                        aria-label="Input field"
                        type="number"
                        value={form.yearsOfExperience}
                        onChange={(e) => {
                          const v = e.currentTarget.valueAsNumber;
                          setForm({
                            ...form,
                            yearsOfExperience: Number.isFinite(v) ? v : 0,
                          });
                        }}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-xl outline-none focus:border-[#009688]"
                      />
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#111827] mb-1">
                      Consult Fee (₹)
                      <input
                        aria-label="Input field"
                        type="number"
                        value={form.consultationFee}
                        onChange={(e) => {
                          const v = e.currentTarget.valueAsNumber;
                          setForm({
                            ...form,
                            consultationFee: Number.isFinite(v) ? v : 0,
                          });
                        }}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-xl outline-none focus:border-[#009688]"
                      />
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold text-[#111827] mb-1">
                    Slot Duration (Minutes)
                    <input
                      aria-label="Input field"
                      type="number"
                      value={form.slotDurationMinutes}
                      onChange={(e) => {
                        const v = e.currentTarget.valueAsNumber;
                        setForm({
                          ...form,
                          slotDurationMinutes: Number.isFinite(v) ? v : 0,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-xl outline-none focus:border-[#009688]"
                    />
                  </span>
                </div>

                {/* Pre-populated Schedule & Availability Editor */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-bold text-[#111827]">
                      Doctor Weekly Availability Schedule
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      AM/PM Format
                    </span>
                  </div>

                  {/* Hospital Schedule Reference */}
                  {hospitalSchedule?.weeklySchedule && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs">
                      <div className="flex items-center gap-1.5 text-[#0D47A1] font-bold mb-2">
                        <Clock size={12} />
                        <span>Hospital OPD Schedule (Reference)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {hospitalSchedule.weeklySchedule.flatMap((day) => {
                          if (!day.isOpen) return [];
                          const interval = day.workingIntervals?.[0];
                          return [
                            <span
                              key={day.dayOfWeek}
                              className="bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-semibold"
                            >
                              {DAY_NAME_MAP[day.dayOfWeek] || day.dayOfWeek}:{" "}
                              {interval
                                ? `${interval.startTime}–${interval.endTime}`
                                : "Closed"}
                            </span>,
                          ];
                        })}
                      </div>
                    </div>
                  )}

                  {/* Doctor Schedule from API */}
                  {doctorSchedule?.weeklySchedule && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-2">
                        <Clock size={12} />
                        <span>Doctor Schedule</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {doctorSchedule.weeklySchedule.flatMap((day) => {
                          if (!day.workingDay) return [];
                          const firstPeriod = day.workingPeriods?.[0];
                          return [
                            <span
                              key={day.dayOfWeek}
                              className="bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-semibold"
                            >
                              {DAY_NAME_MAP[day.dayOfWeek] || day.dayOfWeek}:{" "}
                              {firstPeriod
                                ? `${firstPeriod.startTime}–${firstPeriod.endTime}`
                                : "Off"}
                            </span>,
                          ];
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {form.availability.map((item, index) => (
                      <div
                        key={
                          item.dayOfWeek || item.id || `day-${item.startTime}`
                        }
                        className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs"
                      >
                        <span className="w-20 font-bold text-slate-700">
                          {item.dayOfWeek}
                        </span>
                        <TimeSelect
                          value={item.startTime}
                          onChange={(val) =>
                            updateAvailability(index, "startTime", val)
                          }
                          className="w-28"
                        />
                        <span className="text-slate-400 font-bold">-</span>
                        <TimeSelect
                          value={item.endTime}
                          onChange={(val) =>
                            updateAvailability(index, "endTime", val)
                          }
                          className="w-28"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-border text-text-muted hover:bg-slate-50 py-3 rounded-xl font-heading font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoadingDetail || isUploadingPhoto}
                className="flex-1 bg-[#009688] hover:bg-[#00796B] text-white py-3 rounded-xl font-heading font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

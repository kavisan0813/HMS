import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Shield,
  Loader2,
  Upload,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { PP, RB } from "../constants/patient.fonts";
import { usePatient, useUpdatePatient } from "../hooks/usePatients";
import type { Patient } from "../types/patient.types";
import { CustomDatePicker } from "../../../components/CustomDatePicker";

const BLOOD_GROUPS = [
  { value: "", label: "Select Blood Group" },
  { value: "A_POSITIVE", label: "A+" },
  { value: "A_NEGATIVE", label: "A−" },
  { value: "B_POSITIVE", label: "B+" },
  { value: "B_NEGATIVE", label: "B−" },
  { value: "AB_POSITIVE", label: "AB+" },
  { value: "AB_NEGATIVE", label: "AB−" },
  { value: "O_POSITIVE", label: "O+" },
  { value: "O_NEGATIVE", label: "O−" },
  { value: "UNKNOWN", label: "Unknown" },
];

const GENDERS = [
  { value: "", label: "Select Gender" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const MARITAL_STATUSES = [
  { value: "", label: "Select Status" },
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
  { value: "SEPARATED", label: "Separated" },
];

const RELATIONSHIPS = [
  { value: "", label: "Select Relationship" },
  { value: "Spouse", label: "Spouse" },
  { value: "Parent", label: "Parent" },
  { value: "Child", label: "Child" },
  { value: "Sibling", label: "Sibling" },
  { value: "Guardian", label: "Guardian" },
  { value: "Friend", label: "Friend" },
  { value: "Other", label: "Other" },
];

const REGISTRATION_TYPES = [
  { value: "WALK_IN", label: "Walk-in" },
  { value: "APPOINTMENT", label: "Appointment" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "REFERRAL", label: "Referral" },
];

const PATIENT_CATEGORIES = [
  { value: "GENERAL", label: "General" },
  { value: "VIP", label: "VIP" },
  { value: "CORPORATE", label: "Corporate" },
];

export function EditPatientScreen({
  onBack,
  patient,
  patientMrn,
}: {
  onBack: () => void;
  patient?: Patient;
  patientMrn?: string;
}) {
  const activeMrn = patientMrn || patient?.mrn;
  const { data: fetchedPatient, isLoading: isFetching } = usePatient(
    activeMrn && !patient ? activeMrn : "",
  );
  const currentPatient = patient || fetchedPatient;

  const updateMutation = useUpdatePatient(
    activeMrn || String(currentPatient?.id || "") || "CURRENT_PATIENT",
  );

  // Toast state
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");

  // Address
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");

  // Registration & Clinical
  const [registrationType, setRegistrationType] = useState("WALK_IN");
  const [patientCategory, setPatientCategory] = useState("GENERAL");
  const [assignedDoctor, setAssignedDoctor] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");

  const [prevPatientId, setPrevPatientId] = useState<string | number | null>(
    null,
  );

  const currentPatientId = currentPatient?.id || null;

  if (currentPatientId !== prevPatientId) {
    setPrevPatientId(currentPatientId);
    if (currentPatient) {
      setFullName(currentPatient.patientName || currentPatient.name || "");
      setEmail(currentPatient.email || "");
      setPhone(currentPatient.phone || "");
      setGender(currentPatient.gender || "");
      setDob(
        currentPatient.dob ||
          currentPatient.registrationDate?.split("T")[0] ||
          "",
      );
      setBloodGroup(currentPatient.bloodGroup || "");
      setMaritalStatus(currentPatient.maritalStatus || "");
      setPhotoUrl(currentPatient.photoUrl || currentPatient.photo || "");

      if (currentPatient.emergencyContact) {
        setEmergencyName(
          currentPatient.emergencyContact.contactName ||
            currentPatient.emergencyContact.name ||
            "",
        );
        setEmergencyPhone(
          currentPatient.emergencyContact.contactNumber ||
            currentPatient.emergencyContact.phone ||
            "",
        );
        setEmergencyRelationship(
          currentPatient.emergencyContact.relationship || "",
        );
      } else {
        setEmergencyName("");
        setEmergencyPhone("");
        setEmergencyRelationship("");
      }

      if (currentPatient.address) {
        if (
          typeof currentPatient.address === "object" &&
          currentPatient.address !== null
        ) {
          const addr = currentPatient.address as Record<string, unknown>;
          setAddressLine(
            String(
              addr.streetAddress || addr.street || addr.addressLine1 || "",
            ),
          );
          setCity(String(addr.city || ""));
          setState(String(addr.state || ""));
          setPostalCode(String(addr.postalCode || addr.zipCode || ""));
          setCountry(String(addr.country || "India"));
        } else if (typeof currentPatient.address === "string") {
          setAddressLine(currentPatient.address);
          setCity("");
          setState("");
          setPostalCode("");
          setCountry("India");
        }
      } else {
        setAddressLine("");
        setCity("");
        setState("");
        setPostalCode("");
        setCountry("India");
      }

      setRegistrationType(currentPatient.registrationType || "WALK_IN");
      setPatientCategory(currentPatient.patientCategory || "GENERAL");
      setAssignedDoctor(currentPatient.assignedDoctor || "");
      setAllergies(
        currentPatient.allergies ? currentPatient.allergies.join(", ") : "",
      );
      setMedicalConditions(
        currentPatient.medicalHistory
          ? currentPatient.medicalHistory.join(", ")
          : "",
      );
    }
  }

  // Calculate age from DOB
  const calculatedAge = useMemo(() => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age > 0 ? String(age) : "0";
  }, [dob]);

  // Image Upload Handler (Base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        triggerToast("Image file size must be less than 2MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      triggerToast("Full name is required.", "error");
      return;
    }
    if (!phone.trim()) {
      triggerToast("Phone number is required.", "error");
      return;
    }

    const payload = {
      fullName,
      email,
      mobile: phone,
      gender,
      dateOfBirth: dob,
      photo: photoUrl,
      photoUrl,
      residentialAddress: [addressLine, city, state, postalCode, country]
        .filter(Boolean)
        .join(", "),
      bloodGroup,
      maritalStatus,
      emergencyContactName: emergencyName,
      emergencyContactRelationship: emergencyRelationship,
      emergencyContactNumber: emergencyPhone,
      registrationType,
      patientCategory,
      assignedDoctor,
      allergies: allergies ? allergies.split(",").map((s) => s.trim()) : [],
      medicalHistory: medicalConditions
        ? medicalConditions.split(",").map((s) => s.trim())
        : [],
      version: currentPatient?.version || 1,
      changeReason: "Patient Profile Updated via HMS Web App",
    };

    try {
      await updateMutation.mutateAsync(payload);
      triggerToast("Patient record updated successfully!", "success");
      setTimeout(() => {
        onBack();
      }, 1200);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to update patient record.";
      triggerToast(errMsg, "error");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in ${
            toast.type === "error" ? "bg-[#EF4444]" : "bg-[#111827]"
          }`}
        >
          {toast.type === "error" ? (
            <AlertTriangle size={16} className="text-white" />
          ) : (
            <CheckCircle2 size={16} className="text-[#66BB6A]" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="w-full max-w-5xl">
        {/* Header Breadcrumbs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <button
              aria-label="Previous"
              onClick={onBack}
              className="p-1.5 -ml-1.5 text-slate-400 hover:text-[#0D47A1] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <h1
              className="text-xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Edit Patient Profile
            </h1>
          </div>
          <div
            className="flex items-center gap-1.5 text-sm text-slate-500 pl-8"
            style={{ fontFamily: RB }}
          >
            <span>Dashboard</span>
            <ChevronRight size={14} className="text-slate-300" />
            <button
              onClick={onBack}
              className="hover:text-[#0D47A1] transition-colors"
            >
              Patients
            </button>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="font-medium text-[#111827]">Edit Patient</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isFetching ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={32} className="animate-spin text-[#0D47A1] mb-2" />
              <span className="text-xs font-medium">
                Fetching patient record details...
              </span>
            </div>
          ) : (
            <form className="p-6 md:p-8 space-y-8" onSubmit={handleSubmit}>
              {/* Photo Upload Section */}
              <section className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group shrink-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Patient Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#0D47A1] text-white flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md">
                      {fullName ? (
                        fullName.charAt(0).toUpperCase()
                      ) : (
                        <User size={36} />
                      )}
                    </div>
                  )}
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-0 right-0 bg-[#0D47A1] text-white p-2 rounded-full shadow-md cursor-pointer hover:bg-[#0c3d8a] transition-colors"
                    title="Upload Photo"
                  >
                    <Upload size={14} />
                    <input
                      aria-label="Input field"
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <h3
                    className="text-sm font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    Patient Profile Photo
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md">
                    Upload a high-resolution facial photo of the patient (JPG,
                    PNG, max 2MB).
                  </p>
                </div>
              </section>

              {/* 1. Personal Details */}
              <section>
                <h2
                  className="text-sm font-bold text-[#0D47A1] uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2"
                  style={{ fontFamily: PP }}
                >
                  <User size={16} /> Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      MRN / Patient ID
                      <input
                        type="text"
                        value={activeMrn || "AUTO-GENERATED"}
                        disabled
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-lg text-slate-500 font-mono outline-none cursor-not-allowed"
                      />
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                      <input
                        type="text"
                        value={fullName}
                        readOnly
                        placeholder="Enter patient full name"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-lg text-slate-600 outline-none cursor-not-allowed font-medium"
                      />
                    </label>
                  </div>
                  <div>
                    <CustomDatePicker
                      label="Date of Birth"
                      labelClassName="block text-xs font-medium text-slate-700 mb-1.5"
                      value={dob}
                      onChange={(val) => setDob(val)}
                      maxDate={new Date().toISOString().split("T")[0]}
                      inputClassName="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Age
                      <input
                        type="text"
                        value={calculatedAge ? `${calculatedAge} Years` : "—"}
                        readOnly
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-lg text-slate-500 outline-none"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Gender
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors cursor-pointer"
                      >
                        {GENDERS.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Blood Group
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors cursor-pointer"
                      >
                        {BLOOD_GROUPS.map((b) => (
                          <option key={b.value} value={b.value}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Marital Status
                      <select
                        value={maritalStatus}
                        onChange={(e) => setMaritalStatus(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors cursor-pointer"
                      >
                        {MARITAL_STATUSES.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Phone / Mobile Number{" "}
                      <span className="text-red-500">*</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Email Address
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="patient@example.com"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors"
                      />
                    </label>
                  </div>
                </div>
              </section>

              {/* 2. Emergency Contact */}
              <section>
                <h2
                  className="text-sm font-bold text-[#0D47A1] uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2"
                  style={{ fontFamily: PP }}
                >
                  <Shield size={16} /> Emergency Contact Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Contact Person Name
                      <input
                        type="text"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        placeholder="Name of Next of Kin"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Relationship
                      <select
                        value={emergencyRelationship}
                        onChange={(e) =>
                          setEmergencyRelationship(e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors cursor-pointer"
                      >
                        {RELATIONSHIPS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Emergency Phone Number
                      <input
                        type="tel"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="+91 98765 00000"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors"
                      />
                    </label>
                  </div>
                </div>
              </section>

              {/* 3. Address Information */}
              <section>
                <h2
                  className="text-sm font-bold text-[#0D47A1] uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2"
                  style={{ fontFamily: PP }}
                >
                  <MapPin size={16} /> Residential Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Street Address
                      <input
                        type="text"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="Door No, Street Name, Landmark"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      City
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City Name"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      State / Province
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State Name"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Postal Code / PIN
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="600001"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors font-mono"
                      />
                    </label>
                  </div>
                </div>
              </section>

              {/* 4. Registration Category & Clinical Notes */}
              <section>
                <h2
                  className="text-sm font-bold text-[#0D47A1] uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2"
                  style={{ fontFamily: PP }}
                >
                  Registration Details &amp; History
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Registration Type
                      <select
                        value={registrationType}
                        onChange={(e) => setRegistrationType(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors cursor-pointer"
                      >
                        {REGISTRATION_TYPES.map((rt) => (
                          <option key={rt.value} value={rt.value}>
                            {rt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Patient Category
                      <select
                        value={patientCategory}
                        onChange={(e) => setPatientCategory(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors cursor-pointer"
                      >
                        {PATIENT_CATEGORIES.map((pc) => (
                          <option key={pc.value} value={pc.value}>
                            {pc.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Assigned Doctor
                      <input
                        type="text"
                        value={assignedDoctor}
                        onChange={(e) => setAssignedDoctor(e.target.value)}
                        placeholder="Dr. Arjun Mehta"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors"
                      />
                    </label>
                  </div>
                  <div className="md:col-span-3">
                    <span className="block text-xs font-medium text-slate-700 mb-1.5">
                      Known Allergies (Comma Separated)
                      <input
                        aria-label="Input field"
                        type="text"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        placeholder="e.g. Penicillin, Peanuts, Sulfa Drugs"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors"
                      />
                    </span>
                  </div>
                  <div className="md:col-span-3">
                    <span className="block text-xs font-medium text-slate-700 mb-1.5">
                      Existing Medical Conditions / History
                      <textarea
                        aria-label="Text area"
                        rows={3}
                        value={medicalConditions}
                        onChange={(e) => setMedicalConditions(e.target.value)}
                        placeholder="Summary of pre-existing conditions, surgeries, or chronic illness..."
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] transition-colors resize-none"
                      />
                    </span>
                  </div>
                </div>
              </section>

              {/* Form Action Controls */}
              <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-6 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-[#0c3d8a] text-white text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{ fontFamily: PP }}
                >
                  {updateMutation.isPending && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

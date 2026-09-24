import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  MapPin,
  Clock,
  GraduationCap,
  Award,
  ChevronRight,
  Eye,
  Filter,
  X,
  Stethoscope,
} from "lucide-react";
import { doctorsApi } from "../../doctors/api/doctors.api";
import type { DoctorRecord } from "../../doctors/types/doctors.types";
import { PP, RB } from "../constants/patient.fonts";
import { ROUTES } from "../../../app/routes/routes";

export function PatientDoctorSearchScreen() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRecord | null>(
    null,
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    const loadDoctors = async () => {
      setIsLoading(true);
      try {
        const res = await doctorsApi.getAll({ activeOnly: true });
        setDoctors(res.items || []);
      } catch (err) {
        console.log(err);
        setDoctors([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadDoctors();
  }, []);

  const departments = Array.from(
    new Set(doctors.flatMap((d) => (d.department ? [d.department] : []))),
  );

  const filteredDoctors = doctors.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q);
    const matchesDept = selectedDept === "All" || d.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div
      className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F1F5F9]"
      style={{ fontFamily: RB }}
    >
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#111827] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-opacity duration-200">
          <Eye size={16} className="text-[#66BB6A]" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            Find a Doctor
          </h1>
          <p
            className="text-xs text-[#64748B] mt-0.5"
            style={{ fontFamily: RB }}
          >
            Search and view doctor profiles, availability, and specialties.
          </p>
          <div
            className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1"
            style={{ fontFamily: RB }}
          >
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="hover:text-[#0D47A1] transition-colors font-medium cursor-pointer"
            >
              Patient Portal
            </button>
            <ChevronRight size={13} className="text-slate-300" />
            <span className="font-medium text-[#111827]">Doctors</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-label="Input field"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, specialty, or department..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1] focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              aria-label="Close"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#64748B]" />
            <select
              aria-label="Select option"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] outline-none focus:border-[#0D47A1]"
            >
              <option value="All">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-xs text-slate-500 py-12">
          Loading doctors...
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center shadow-sm">
          <Stethoscope size={32} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-[#111827]">No doctors found</h3>
          <p className="text-xs text-[#64748B] mt-1">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#0D47A1] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {doc.name
                    .replace("Dr. ", "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-sm font-bold text-[#111827] truncate"
                    style={{ fontFamily: PP }}
                  >
                    {doc.name}
                  </h3>
                  <p className="text-xs text-[#64748B]">{doc.specialty}</p>
                  <p className="text-xs text-slate-500">{doc.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <GraduationCap size={12} className="text-[#0D47A1]" />
                  <span>{doc.qualification}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award size={12} className="text-[#009688]" />
                  <span>{doc.experienceYrs} yrs exp</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#EF4444]" />
                  <span className="truncate">{doc.address || "Hospital"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-[#F59E0B]" />
                  <span>{doc.availability}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs font-bold text-[#111827]">
                  Fee: ₹{doc.consultationFee}
                </span>
                <button
                  onClick={() => {
                    setSelectedDoctor(doc);
                    triggerToast(`Viewing ${doc.name}'s profile`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#0D47A1] text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <Eye size={13} /> View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDoctor && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedDoctor(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E5E7EB] max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-base font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Doctor Profile
              </h2>
              <button
                aria-label="Close"
                onClick={() => setSelectedDoctor(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-[#0D47A1] text-white flex items-center justify-center font-bold text-lg">
                {selectedDoctor.name
                  .replace("Dr. ", "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <h3
                  className="text-sm font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {selectedDoctor.name}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {selectedDoctor.specialty} · {selectedDoctor.department}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedDoctor.qualification} ·{" "}
                  {selectedDoctor.experienceYrs} yrs
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#64748B] block text-[11px]">
                  Consultation Fee
                </span>
                <span className="font-bold text-[#111827]">
                  ₹{selectedDoctor.consultationFee}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">
                  Follow-up Fee
                </span>
                <span className="font-bold text-[#111827]">
                  ₹{selectedDoctor.followUpFee}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">
                  Slot Duration
                </span>
                <span className="font-bold text-[#111827]">
                  {selectedDoctor.slotDuration}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">Status</span>
                <span className="font-bold text-[#66BB6A]">
                  {selectedDoctor.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedDoctor(null);
                  triggerToast("Opening booking flow...");
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors"
              >
                Book Appointment
              </button>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-medium text-[#64748B] hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

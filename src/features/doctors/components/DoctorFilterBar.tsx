import {
  X,
  Hash,
  FileCheck,
  Building2,
  Stethoscope,
  Clock,
  Filter,
  Award,
  RotateCcw,
} from "lucide-react";

export interface DoctorFilterBarProps {
  searchDoctorQuery: string;
  setSearchDoctorQuery: (value: string) => void;
  searchEmpIdQuery: string;
  setSearchEmpIdQuery: (value: string) => void;
  searchRegNoQuery: string;
  setSearchRegNoQuery: (value: string) => void;
  deptFilter: string;
  setDeptFilter: (value: string) => void;
  specialtyFilter: string;
  setSpecialtyFilter: (value: string) => void;
  availabilityFilter: string;
  setAvailabilityFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  experienceFilter: string;
  setExperienceFilter: (value: string) => void;
  onResetFilters: () => void;
  departments?: string[];
  specialties?: string[];
}

export function DoctorFilterBar({
  searchEmpIdQuery,
  setSearchEmpIdQuery,
  searchRegNoQuery,
  setSearchRegNoQuery,
  deptFilter,
  setDeptFilter,
  specialtyFilter,
  setSpecialtyFilter,
  availabilityFilter,
  setAvailabilityFilter,
  statusFilter,
  setStatusFilter,
  experienceFilter,
  setExperienceFilter,
  onResetFilters,
  departments,
  specialties,
}: DoctorFilterBarProps) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Hash
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-label="Input field"
            type="text"
            value={searchEmpIdQuery}
            onChange={(e) => setSearchEmpIdQuery(e.target.value)}
            placeholder="Filter by Employee ID (EMP-1001)..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1] focus:bg-white transition-colors"
          />
          {searchEmpIdQuery && (
            <button
              aria-label="Close"
              onClick={() => setSearchEmpIdQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="relative">
          <FileCheck
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-label="Input field"
            type="text"
            value={searchRegNoQuery}
            onChange={(e) => setSearchRegNoQuery(e.target.value)}
            placeholder="Filter by Reg Number (MCI-REG)..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1] focus:bg-white transition-colors"
          />
          {searchRegNoQuery && (
            <button
              aria-label="Close"
              onClick={() => setSearchRegNoQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-[#E5E7EB] px-3 py-1.5 rounded-xl">
          <Building2 size={13} className="text-slate-400" />
          <span className="text-slate-500 font-medium">Department:</span>
          <select
            aria-label="Select option"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-transparent font-semibold text-[#111827] outline-none cursor-pointer"
          >
            <option value="All">All Departments</option>
            {departments && departments.length > 0
              ? departments.map((deptName) => (
                  <option key={deptName} value={deptName}>
                    {deptName}
                  </option>
                ))
              : null}
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-[#E5E7EB] px-3 py-1.5 rounded-xl">
          <Stethoscope size={13} className="text-slate-400" />
          <span className="text-slate-500 font-medium">Specialty:</span>
          <select
            aria-label="Select option"
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="bg-transparent font-semibold text-[#111827] outline-none cursor-pointer"
          >
            <option value="All">All Specialties</option>
            {specialties && specialties.length > 0
              ? specialties.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))
              : null}
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-[#E5E7EB] px-3 py-1.5 rounded-xl">
          <Clock size={13} className="text-slate-400" />
          <span className="text-slate-500 font-medium">Availability:</span>
          <select
            aria-label="Select option"
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="bg-transparent font-semibold text-[#111827] outline-none cursor-pointer"
          >
            <option value="All">All Availability</option>
            <option value="Available Today">Available Today</option>
            <option value="On Duty">On Duty</option>
            <option value="On Call">On Call</option>
            <option value="On Leave">On Leave</option>
            <option value="Out of Office">Out of Office</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-[#E5E7EB] px-3 py-1.5 rounded-xl">
          <Filter size={13} className="text-slate-400" />
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            aria-label="Select option"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent font-semibold text-[#111827] outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-[#E5E7EB] px-3 py-1.5 rounded-xl">
          <Award size={13} className="text-slate-400" />
          <span className="text-slate-500 font-medium">Experience:</span>
          <select
            aria-label="Select option"
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            className="bg-transparent font-semibold text-[#111827] outline-none cursor-pointer"
          >
            <option value="All">All Experience</option>
            <option value="0-5 Years">0 - 5 Years</option>
            <option value="5-10 Years">5 - 10 Years</option>
            <option value="10-15 Years">10 - 15 Years</option>
            <option value="15+ Years">15+ Years</option>
          </select>
        </div>

        <button
          onClick={onResetFilters}
          className="p-2 rounded-xl border border-[#E5E7EB] bg-white text-slate-500 hover:text-[#0D47A1] hover:bg-slate-50 transition-colors"
          title="Reset Filters"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

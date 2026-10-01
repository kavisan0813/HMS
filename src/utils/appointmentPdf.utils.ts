/**
 * Common Appointment Slip PDF / Print Receipt Generator Utility
 * Can be used across all screens (Patient Portal, Book Appointment, Reception, OPD)
 */

export interface PrintableAppointmentData {
  id?: string | number;
  appointmentNumber?: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  allergies?: string;
  mrn?: string;
  doctor?: string;
  doctorName?: string;
  department?: string;
  specialty?: string;
  qualification?: string;
  consultationFee?: string | number;
  date?: string;
  appointmentDate?: string;
  time?: string;
  startTime?: string;
  timeSlot?: string;
  visitType?: string;
  status?: string;
  tokenNo?: string | number;
  roomLocation?: string;
  opdRoom?: string;
  reason?: string;
  chiefComplaint?: string;
  notes?: string;
  remarks?: string;
}

export function downloadAppointmentSlipPdf(
  appt: PrintableAppointmentData,
): void {
  const aptId = String(appt.appointmentNumber || appt.id || "APT-REC");
  const patName = appt.patientName || "Patient";
  const docName = appt.doctor || appt.doctorName || "Attending Doctor";
  const dept = appt.department || "General Medicine";
  const specialty = appt.specialty || "General Physician";
  const dateStr =
    appt.date || appt.appointmentDate || new Date().toISOString().split("T")[0];
  const timeStr = appt.timeSlot || appt.time || appt.startTime || "09:00 AM";
  const visitType = appt.visitType || "In-Person OPD";
  const status = appt.status || "Booked";
  const token = appt.tokenNo ? String(appt.tokenNo) : "Pending";
  const room = appt.roomLocation || appt.opdRoom || "General OPD Room";
  const fee = appt.consultationFee ? String(appt.consultationFee) : "Standard Fee";
  const reason = appt.chiefComplaint || appt.reason || "General Consultation";
  const notes = appt.notes || appt.remarks || "No additional remarks recorded.";
  const mrn = appt.mrn || "MRN-2026";
  const phone = appt.patientPhone || "Not Provided";
  const bloodGroup = appt.bloodGroup || "Not Specified";
  const emergency = appt.emergencyContact || "Not Provided";
  const allergies = appt.allergies || "None reported";

  const ageStr = appt.patientAge ? `${appt.patientAge} yrs` : "";
  const genderStr = appt.patientGender || "";
  const ageGender =
    ageStr && genderStr ? `${ageStr} / ${genderStr}` : ageStr || genderStr || "Not Specified";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Appointment Summary - ${aptId}</title>
  <style>
    body { font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #1e293b; margin: 0; padding: 24px; background: #fff; line-height: 1.5; }
    .slip-container { max-width: 720px; margin: 0 auto; border: 2px solid #0D47A1; border-radius: 16px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0D47A1; padding-bottom: 16px; margin-bottom: 20px; }
    .hospital-title { font-size: 20px; font-weight: 800; color: #0D47A1; text-transform: uppercase; margin: 0; letter-spacing: -0.5px; }
    .hospital-sub { font-size: 11px; color: #64748B; margin-top: 3px; }
    .badge-box { text-align: right; }
    .badge { background: #0D47A1; color: #fff; padding: 5px 12px; border-radius: 8px; font-size: 13px; font-weight: 800; font-family: monospace; display: inline-block; }
    .status-tag { display: inline-block; margin-top: 4px; font-size: 10px; font-weight: 700; color: #00796B; background: #E0F2F1; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
    .section-title { font-size: 11px; font-weight: 800; color: #0D47A1; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 10px; margin-top: 16px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 12px; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 12px; }
    .field-label { font-size: 10px; color: #64748B; font-weight: 600; text-transform: uppercase; margin-bottom: 2px; }
    .field-value { font-weight: 700; color: #0f172a; word-break: break-word; }
    .highlight-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 14px; margin-top: 12px; font-size: 12px; }
    .instructions { font-size: 11px; color: #334155; margin-top: 20px; background: #EFF6FF; border-left: 4px solid #0D47A1; padding: 10px 14px; border-radius: 6px; }
    .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #94A3B8; border-top: 1px solid #F1F5F9; padding-top: 12px; }
    @media print {
      body { padding: 0; }
      .slip-container { border: 1px solid #ccc; box-shadow: none; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="slip-container">
    <div class="header">
      <div>
        <h1 class="hospital-title">Safe Hands Hospital</h1>
        <div class="hospital-sub">NABH Accredited Medical Center · Comprehensive OPD Services</div>
      </div>
      <div class="badge-box">
        <div class="badge">${aptId}</div>
        <div><span class="status-tag">${status}</span></div>
      </div>
    </div>

    <div class="section-title">Section 01 · Patient Information</div>
    <div class="grid">
      <div>
        <div class="field-label">Patient Name</div>
        <div class="field-value">${patName}</div>
      </div>
      <div>
        <div class="field-label">MRN Number</div>
        <div class="field-value" style="font-family: monospace; color: #0D47A1;">${mrn}</div>
      </div>
      <div>
        <div class="field-label">Age & Gender</div>
        <div class="field-value">${ageGender}</div>
      </div>
      <div>
        <div class="field-label">Blood Group</div>
        <div class="field-value" style="color: #0D47A1;">${bloodGroup}</div>
      </div>
      <div>
        <div class="field-label">Mobile Number</div>
        <div class="field-value">${phone}</div>
      </div>
      <div>
        <div class="field-label">Emergency Contact</div>
        <div class="field-value">${emergency}</div>
      </div>
    </div>

    <div class="section-title">Section 02 · Appointment Schedule & Details</div>
    <div class="grid">
      <div>
        <div class="field-label">Appointment Date</div>
        <div class="field-value">${dateStr}</div>
      </div>
      <div>
        <div class="field-label">Scheduled Time Slot</div>
        <div class="field-value" style="color: #0D47A1; font-family: monospace;">${timeStr}</div>
      </div>
      <div>
        <div class="field-label">Token Number</div>
        <div class="field-value" style="color: #0D47A1; font-family: monospace;">${token}</div>
      </div>
      <div>
        <div class="field-label">Visit Type</div>
        <div class="field-value" style="color: #00796B;">${visitType}</div>
      </div>
      <div>
        <div class="field-label">OPD Location</div>
        <div class="field-value">${room}</div>
      </div>
      <div>
        <div class="field-label">Consultation Fee</div>
        <div class="field-value" style="color: #00796B;">${fee}</div>
      </div>
    </div>

    <div class="section-title">Section 03 · Doctor Information</div>
    <div class="grid">
      <div>
        <div class="field-label">Attending Doctor</div>
        <div class="field-value">${docName}</div>
      </div>
      <div>
        <div class="field-label">Department</div>
        <div class="field-value">${dept}</div>
      </div>
      <div>
        <div class="field-label">Specialization</div>
        <div class="field-value">${specialty}</div>
      </div>
    </div>

    <div class="section-title">Section 04 · Clinical Information & Notes</div>
    <div class="highlight-box">
      <div style="margin-bottom: 8px;">
        <div class="field-label">Chief Complaint / Reason for Visit</div>
        <div class="field-value">${reason}</div>
      </div>
      <div style="margin-bottom: 8px;">
        <div class="field-label">Known Allergies</div>
        <div class="field-value" style="color: #991b1b;">${allergies}</div>
      </div>
      <div>
        <div class="field-label">Special Notes</div>
        <div class="field-value" style="font-weight: 400; color: #475569;">${notes}</div>
      </div>
    </div>

    <div class="instructions">
      <strong>Patient Instructions:</strong>
      <ul style="margin: 4px 0 0 0; padding-left: 18px;">
        <li>Please report to the OPD reception counter 15 minutes before your scheduled slot.</li>
        <li>Present this appointment summary slip or your MRN number at check-in.</li>
        <li>Carry all relevant prior prescriptions and lab investigation records.</li>
      </ul>
    </div>

    <div class="footer">
      This is an official computer-generated appointment slip from Safe Hands Hospital Management System.
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Appointment_Slip_${aptId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}


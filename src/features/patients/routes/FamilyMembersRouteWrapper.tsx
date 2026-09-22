import { useState, useCallback } from "react";
import { usePatientPortal } from "../context/usePatientPortal";
import { useAuthStore } from "../../auth/store/auth.store";
import { patientsApi } from "../api/patient.api";
import { RegisterPatientScreen } from "../pages/RegisterPatientScreen";
import { FamilyMembersManagement } from "../pages/FamilyMembersManagement";

export function FamilyMembersRouteWrapper() {
  const [registering, setRegistering] = useState(false);
  const portal = usePatientPortal();
  const user = useAuthStore((state) => state.user);
  const primaryMrn =
    portal?.primaryMrn || String(user?.patientId || user?.id || "");

  const handleViewProfile = useCallback(
    (mrn: string) => {
      const member = (portal?.familyMembers ?? []).find(
        (m) => String(m.mrn) === String(mrn),
      );
      if (member) {
        portal?.switchToPatient(member);
        setRegistering(false);
      }
      portal?.refresh();
    },
    [portal],
  );

  if (registering) {
    return (
      <RegisterPatientScreen
        isFamilyMode
        primaryPatientMrn={primaryMrn}
        onBack={() => {
          setRegistering(false);
          portal?.refresh();
        }}
        onRegistered={() => portal?.refresh()}
        onViewProfile={handleViewProfile}
      />
    );
  }

  return (
    <FamilyMembersManagement
      familyMembers={portal?.familyMembers || []}
      activeFamilyMember={portal?.activePatient || undefined}
      onAddFamilyMember={() => setRegistering(true)}
      onSwitchProfile={(member) => portal?.switchToPatient(member)}
      onRemoveFamilyMember={async (id) => {
        if (!primaryMrn) return;
        const wasActive = String(portal?.activePatient?.id) === String(id);
        const removed = await patientsApi.deleteFamilyMember(primaryMrn, id);
        if (removed && wasActive) {
          localStorage.setItem("hms-active-patient-mrn:v1", primaryMrn);
        }
        if (removed) portal?.refresh();
      }}
      onUpdateRelationship={async (id, relationship, updatedMemberData) => {
        if (!primaryMrn) return;
        const targetMember = portal?.familyMembers?.find(
          (m) => String(m.mrn) === String(id) || String(m.id) === String(id),
        );
        const payload = {
          relationship: relationship.toUpperCase(),
          fullName:
            (updatedMemberData?.fullName as string) ||
            targetMember?.patientName ||
            targetMember?.fullName ||
            targetMember?.name ||
            "Family Member",
          gender: String(
            updatedMemberData?.gender || targetMember?.gender || "MALE",
          ).toUpperCase(),
          dateOfBirth:
            (updatedMemberData?.dateOfBirth as string) ||
            targetMember?.dateOfBirth ||
            new Date().toISOString().split("T")[0],
          phone:
            (updatedMemberData?.phone as string) ||
            targetMember?.registeredMobile ||
            targetMember?.phone ||
            targetMember?.mobileNumber ||
            "8765434567",
          email:
            (updatedMemberData?.email as string) ||
            targetMember?.email ||
            "family@example.com",
          bloodGroup: updatedMemberData?.bloodGroup
            ? String(updatedMemberData.bloodGroup)
                .replace("+", "_POSITIVE")
                .replace("-", "_NEGATIVE")
            : targetMember?.bloodGroup
              ? String(targetMember.bloodGroup)
                  .replace("+", "_POSITIVE")
                  .replace("-", "_NEGATIVE")
              : "O_POSITIVE",
          maritalStatus:
            (updatedMemberData?.maritalStatus as string) || "SINGLE",
          emergencyContact: (updatedMemberData?.emergencyContact as Record<
            string,
            string
          >) || {
            name: "Emergency Contact",
            relationship: relationship.toUpperCase(),
            phone:
              (updatedMemberData?.phone as string) ||
              targetMember?.registeredMobile ||
              targetMember?.phone ||
              "8765434567",
          },
          specialNotes:
            (updatedMemberData?.specialNotes as string) ||
            "Updated family member profile",
        };
        const updated = await patientsApi.updateFamilyMember(
          primaryMrn,
          id,
          payload,
        );
        if (updated) portal?.refresh();
      }}
    />
  );
}

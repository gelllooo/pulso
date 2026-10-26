import type { Municipality, UserProfile, UserRole } from "../types";

export const ROLES: UserRole[] = [
  "resident_guest",
  "municipal_officer",
  "provincial_officer",
  "administrator",
];
export const ROLE_LABELS: Record<UserRole, string> = {
  resident_guest: "Resident / guest",
  municipal_officer: "Municipal officer",
  provincial_officer: "Provincial officer",
  administrator: "Administrator",
};
export function canManageReports(
  user: UserProfile,
  municipality?: Municipality,
) {
  return (
    user.id !== "guest" &&
    (user.role === "provincial_officer" ||
      (user.role === "municipal_officer" &&
        !!user.scopeMunicipality &&
        (!municipality || user.scopeMunicipality === municipality)))
  );
}
export function isAdministrator(user: UserProfile) {
  return user.id !== "guest" && user.role === "administrator";
}

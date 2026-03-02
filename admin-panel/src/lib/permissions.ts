import { UserRole } from "./types";

type Permission =
  | "view_bookings"
  | "view_booking_detail"
  | "approve_decline_items"
  | "add_notes"
  | "view_pii"
  | "view_inventory"
  | "add_edit_listings"
  | "delete_listings"
  | "toggle_status_featured"
  | "block_calendar"
  | "view_users"
  | "view_user_detail"
  | "edit_lifetime_value"
  | "add_user_notes"
  | "export_data"
  | "manage_admins"
  | "manage_cities";

const permissionsMatrix: Record<UserRole, Permission[]> = {
  owner: [
    "view_bookings", "view_booking_detail", "approve_decline_items",
    "add_notes", "view_pii", "view_inventory", "add_edit_listings",
    "delete_listings", "toggle_status_featured", "block_calendar",
    "view_users", "view_user_detail", "edit_lifetime_value",
    "add_user_notes", "export_data", "manage_admins", "manage_cities",
  ],
  admin: [
    "view_bookings", "view_booking_detail", "approve_decline_items",
    "add_notes", "view_pii", "view_inventory", "add_edit_listings",
    "delete_listings", "toggle_status_featured", "block_calendar",
    "view_users", "view_user_detail", "edit_lifetime_value",
    "add_user_notes", "export_data", "manage_cities",
  ],
  viewer: [
    "view_bookings", "view_booking_detail", "view_inventory",
    "view_users", "view_user_detail",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return permissionsMatrix[role].includes(permission);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***.com";
  return `${local[0]}***@${domain}`;
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return "***";
  return `***-${phone.slice(-4)}`;
}

export type { Permission };

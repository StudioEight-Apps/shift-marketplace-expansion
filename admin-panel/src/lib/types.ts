export type UserRole = "owner" | "admin" | "viewer";

export type ItemStatus = "Pending" | "Approved" | "Declined";

export type BookingStatus = "Pending" | "Approved" | "Declined" | "Partial" | "Completed";

export type ItemType = "villa" | "car" | "yacht";

export type SourceType = "shift_fleet" | "pms" | "api";

export interface AdminUser {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface Customer {
  uid: string;
  name: string;
  email: string;
  phone: string;
}

export interface VillaBookingItem {
  id: string;
  name: string;
  location: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  pricePerNight: number;
  price: number;
  status: ItemStatus;
}

export interface CarBookingItem {
  id: string;
  name: string;
  location?: string;
  pickupDate: Date;
  dropoffDate: Date;
  days: number;
  pricePerDay: number;
  price: number;
  status: ItemStatus;
}

export interface YachtBookingItem {
  id: string;
  name: string;
  location?: string;
  date: Date;
  startTime: string;
  endTime: string;
  hours: number;
  pricePerHour: number;
  price: number;
  status: ItemStatus;
}

export interface BookingNote {
  text: string;
  author: string;
  timestamp: Date;
}

export interface ActivityLogEntry {
  action: string;
  actor: string;
  timestamp: Date;
  details?: string;
}

export interface BookingRequest {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  customer: Customer;
  villa: VillaBookingItem | null;
  car: CarBookingItem | null;
  yacht: YachtBookingItem | null;
  grandTotal: number;
  notes: BookingNote[];
  activityLog: ActivityLogEntry[];
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  totalTrips: number;
  lastTripDate: Date | null;
  lifetimeValue: number;
  createdAt: Date;
  notes: BookingNote[];
  bookings: string[]; // booking IDs
  status: "active" | "deactivated";
}

export interface ListingBase {
  id: string;
  name: string;
  description: string;
  location: string;
  photos: string[];
  sourceType: SourceType;
  sourceName?: string;
  status: "active" | "hidden";
  featured: boolean;
  blockedDates: string[];
  syncedBlockedDates?: string[];
  lastSynced?: Date;
}

export interface VillaListing extends ListingBase {
  type: "villa";
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  address: string;
  neighborhood: string;
  minimumStay: number;
  market: string;
}

export interface CarListing extends ListingBase {
  type: "car";
  brand: string;
  model: string;
  pricePerDay: number;
  bodyStyle: string;
  seats: number;
  transmission: "Automatic" | "Manual";
}

export interface YachtListing extends ListingBase {
  type: "yacht";
  pricePerHour: number;
  length: string;
  maxGuests: number;
  captainIncluded: boolean;
  amenities: string[];
}

export type Listing = VillaListing | CarListing | YachtListing;

import {
  DeskModuleItem,
  UserRbacItem,
  PartnerProfitShareItem,
  ActiveDeviceSession,
} from "@/types/settings";

export const mockDeskModules: DeskModuleItem[] = [
  { id: "general", name: "General", iconName: "general", isActive: true },
  { id: "company", name: "Company & Legal", iconName: "company", badge: "DIFC", badgeVariant: "gray" },
  { id: "users", name: "Users & Access Control", iconName: "users", badge: "3 Active", badgeVariant: "blue" },
  { id: "partners", name: "Partner Management", iconName: "partners", badge: "2 Partners", badgeVariant: "blue" },
  { id: "entities", name: "Business Entities", iconName: "entities", badge: "2 Entities", badgeVariant: "blue" },
  { id: "currency", name: "Currency & FX Hedging", iconName: "currency", badge: "AED Base", badgeVariant: "gray" },
  { id: "notifications", name: "Notification Triggers", iconName: "notifications" },
  { id: "security", name: "Security & 2FA", iconName: "security", badge: "TIER-1", badgeVariant: "solid" },
  { id: "audit", name: "Audit & Compliance", iconName: "audit", badge: "SHA-256", badgeVariant: "gray" },
  { id: "danger", name: "Danger Zone", iconName: "danger", badge: "ROOT", badgeVariant: "outline", isDanger: true },
];

export const mockUserRbacList: UserRbacItem[] = [
  {
    id: "usr-01",
    name: "Alexander Vane",
    initials: "AV",
    email: "admin@ivora.com",
    role: "Main Admin (Root)",
    roleVariant: "root",
    businessScope: "All Businesses (Consolidated)",
    status: "ACTIVE",
    lastActive: "Just now",
  },
  {
    id: "usr-02",
    name: "Partner B",
    initials: "PB",
    email: "partnerb@ivora.com",
    role: "Partner (Restricted)",
    roleVariant: "restricted",
    businessScope: "Business 01 (A + B) only",
    status: "ACTIVE",
    lastActive: "Today 11:20 AM",
  },
  {
    id: "usr-03",
    name: "Partner C",
    initials: "PC",
    email: "partnerc@ivora.com",
    role: "Partner (Restricted)",
    roleVariant: "restricted",
    businessScope: "Business 02 (A + C) only",
    status: "ACTIVE",
    lastActive: "Yesterday",
  },
];

export const mockPartnerProfitShareList: PartnerProfitShareItem[] = [
  {
    id: "ptn-01",
    partnerEntity: "Partner B",
    assignedBusiness: "Business 01 (A + B)",
    paidInCapitalAED: 150000,
    profitSplitWeightPercent: 40.0,
    allocatedProfitAED: 9600.0,
    outstandingPayoutAED: 3600.0,
    overrideStatus: "MANUAL LOCK",
  },
  {
    id: "ptn-02",
    partnerEntity: "Partner C",
    assignedBusiness: "Business 02 (A + C)",
    paidInCapitalAED: 100000,
    profitSplitWeightPercent: 35.0,
    allocatedProfitAED: 4672.5,
    outstandingPayoutAED: 0.0,
    overrideStatus: "MANUAL LOCK",
  },
];

export const mockActiveSessions: ActiveDeviceSession[] = [
  {
    id: "dev-01",
    deviceName: 'MacBook Pro 16" • Chrome 128 (macOS Sonoma)',
    isCurrentDevice: true,
    locationDetails: "DIFC Dubai Gate, UAE",
    ipAddress: "194.67.218.4",
    tlsVersion: "TLS 1.3 Strict",
    isActiveNow: true,
    deviceType: "laptop",
  },
  {
    id: "dev-02",
    deviceName: "iPhone 15 Pro • Native Gateway Terminal",
    securityBadge: "Biometric Authenticated",
    locationDetails: "Dubai Downtown, UAE",
    ipAddress: "185.120.44.89",
    tlsVersion: "TLS 1.3 Strict",
    lastActiveText: "Last active 48m ago",
    deviceType: "phone",
  },
];

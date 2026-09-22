export interface DeskModuleItem {
  id: string;
  name: string;
  iconName: string;
  badge?: string;
  badgeVariant?: "solid" | "outline" | "blue" | "gray";
  isActive?: boolean;
  isDanger?: boolean;
}

export interface UserRbacItem {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: string;
  roleVariant: "root" | "restricted";
  businessScope: string;
  status: "ACTIVE" | "INACTIVE";
  lastActive: string;
}

export interface PartnerProfitShareItem {
  id: string;
  partnerEntity: string;
  assignedBusiness: string;
  paidInCapitalAED: number;
  profitSplitWeightPercent: number;
  allocatedProfitAED: number;
  outstandingPayoutAED: number;
  overrideStatus: string;
}

export interface ActiveDeviceSession {
  id: string;
  deviceName: string;
  isCurrentDevice?: boolean;
  securityBadge?: string;
  locationDetails: string;
  ipAddress: string;
  tlsVersion: string;
  isActiveNow?: boolean;
  lastActiveText?: string;
  deviceType: "laptop" | "phone";
}

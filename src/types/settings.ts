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

export interface PartnerAssignedBusiness {
  id: string;
  name: string;
  code: string;
  partnerEquityPct: number;
}

export interface PartnerProfitShareItem {
  id: string;
  partnerEntity: string;
  email?: string;
  assignedBusiness: string;
  assignedBusinesses?: PartnerAssignedBusiness[];
  paidInCapitalAED: number;
  profitSplitWeightPercent: number;
  allocatedProfitAED: number;
  outstandingPayoutAED: number;
  overrideStatus: string;
  overrideEnabled?: boolean;
}


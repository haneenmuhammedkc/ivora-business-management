"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, MailIcon } from "@/components/ui/icons";

export interface AdminProfileData {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: "ACTIVE" | "INACTIVE";
  joinedDate: string;
  location: string;
  accessScope: string;
  twoFactorAuth: string;
}

export const initialAdminProfile: AdminProfileData = {
  fullName: "Alexander Vane",
  email: "admin@ivora.trade",
  phone: "+971 50 892 4410",
  role: "Sovereign Administrator (Root)",
  status: "ACTIVE",
  joinedDate: "15 Jan 2025",
  location: "DIFC Dubai Gate, UAE",
  accessScope: "All Businesses (Consolidated Oversight)",
  twoFactorAuth: "Hardware Key + Authenticator App",
};

export function AdminDetailsCard() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<AdminProfileData>(initialAdminProfile);
  const [formData, setFormData] = useState<AdminProfileData>(initialAdminProfile);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(formData);
    setIsEditing(false);
    setSuccessMessage("Profile details updated successfully.");
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 bg-white">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
            Administrator Account Details
          </h2>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Sovereign platform credentials and root governance profile.
          </p>
        </div>

        <div>
          {!isEditing ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs font-semibold shadow-2xs"
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-xs text-gray-500 hover:text-gray-900"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckIcon size={15} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Card Body */}
      <div className="p-5">
        {!isEditing ? (
          <div className="space-y-6">
            {/* Top Identity Block */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-[#0c0d12] text-sm font-black text-white tracking-widest shadow-xs">
                  AV
                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-gray-950">
                      {profile.fullName}
                    </h3>
                    <Badge variant="active" className="px-1.5 py-0.2 text-[9px]">
                      {profile.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium flex items-center gap-1.5">
                    <MailIcon size={13} className="text-gray-400" />
                    <span>{profile.email}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:self-center">
                <span className="px-2.5 py-1 rounded-md bg-[#0c0d12] text-white text-[10px] font-bold uppercase tracking-wider">
                  ROOT ADMIN
                </span>
              </div>
            </div>

            {/* Profile Field Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-lg border border-gray-100 bg-white space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  FULL NAME
                </span>
                <span className="text-xs font-bold text-gray-900 block">
                  {profile.fullName}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-gray-100 bg-white space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  CORPORATE EMAIL
                </span>
                <span className="text-xs font-mono font-bold text-gray-900 block">
                  {profile.email}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-gray-100 bg-white space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  DIRECT PHONE
                </span>
                <span className="text-xs font-mono font-bold text-gray-900 block">
                  {profile.phone}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-gray-100 bg-white space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  ROLE ASSIGNMENT
                </span>
                <span className="text-xs font-bold text-gray-900 block">
                  {profile.role}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-gray-100 bg-white space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  OFFICE LOCATION
                </span>
                <span className="text-xs font-bold text-gray-900 block">
                  {profile.location}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-gray-100 bg-white space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  ACCOUNT CREATED
                </span>
                <span className="text-xs font-bold text-gray-900 block">
                  {profile.joinedDate}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Editable Form */
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
                >
                  FULL NAME
                </label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
                >
                  CORPORATE EMAIL
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
                >
                  PHONE NUMBER
                </label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
                >
                  OFFICE LOCATION
                </label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <Button
                type="submit"
                variant="primary"
                size="sm"
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import React from "react";
import { UserRbacItem } from "@/types/settings";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface UserManagementRbacProps {
  users: UserRbacItem[];
}

export function UserManagementRbac({ users }: UserManagementRbacProps) {
  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-3">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
            User Management & Multi-Entity RBAC
          </h2>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Air-gapped role allocations, cryptographically isolated business partition keys.
          </p>
        </div>
        <button
          type="button"
          className="h-8 px-3.5 rounded-lg bg-[#0c0d12] text-white text-xs font-bold hover:bg-[#1e222d] transition-colors flex items-center justify-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
        >
          <span>+</span>
          <span>Add System User</span>
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Air-Gapped Isolation Banner */}
        <div className="p-3.5 rounded-lg bg-gray-50/80 border border-gray-200/90 flex items-start gap-3 text-xs">
          <span className="text-base mt-0.5">🔒</span>
          <div>
            <h4 className="font-bold text-gray-950 text-xs">
              Strict Air-Gapped Entity Isolation Enforced
            </h4>
            <p className="text-[11px] text-gray-600 font-normal mt-0.5 leading-relaxed">
              Partner accounts are cryptographically restricted to assigned business ledgers. Cross-entity access prohibited at database level. Root admin maintains consolidated sovereign oversight.
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-bold">USER</th>
                <th className="px-4 py-3 font-bold">EMAIL</th>
                <th className="px-3.5 py-3 font-bold">ROLE</th>
                <th className="px-4 py-3 font-bold">BUSINESS ACCESS SCOPE</th>
                <th className="px-3.5 py-3 font-bold text-center">STATUS</th>
                <th className="px-4 py-3 font-bold">LAST ACTIVE</th>
                <th className="px-4 py-3 font-bold text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-gray-50/60">
                  {/* User Name & Initials */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-gray-100 text-gray-900 border border-gray-200 font-extrabold text-[10.5px] flex items-center justify-center shrink-0">
                        {user.initials}
                      </div>
                      <span className="font-bold text-gray-950 text-xs">
                        {user.name}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-xs text-gray-600 font-mono">
                      {user.email}
                    </span>
                  </td>

                  {/* Role */}
                  <td className="px-3.5 py-3.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase select-none ${
                        user.roleVariant === "root"
                          ? "bg-[#0c0d12] text-white"
                          : "bg-transparent border border-gray-300 text-gray-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Business Access Scope */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      {user.roleVariant === "root" && <span>🌐</span>}
                      <span>{user.businessScope}</span>
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                    <Badge variant="active" className="px-2 py-0.5 text-[9.5px] font-bold">
                      {user.status}
                    </Badge>
                  </td>

                  {/* Last Active */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-[11px] text-gray-500 font-medium">
                      {user.lastActive}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-900 hover:text-black transition-colors cursor-pointer"
                    >
                      <span>Manage</span>
                      <ArrowRightIcon size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

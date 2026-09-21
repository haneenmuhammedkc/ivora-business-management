import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Settings"
        subtitle="Central Governance For Enterprise Configuration, Entity Partition Scopes, Partner RBAC Access, Currency Pegging, And Cryptographic Audit Controls."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Settings Panel */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between pb-3">
              <div>
                <CardTitle>General Application Configuration</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Core baseline parameters, calendar parsing, and accounting denomination standards.
                </p>
              </div>
              <Badge variant="tag">SCOPE: GLOBAL SYSTEM</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="APPLICATION IDENTIFIER"
                  defaultValue="IVORA"
                  disabled
                  helperText="Locked system alias"
                />
                <Input
                  label="REGISTERED TRADING ENTITY NAME"
                  defaultValue="IVORA GENERAL TRADING LLC"
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center bg-gray-50/50">
            <h3 className="text-sm font-semibold text-gray-700">
              Institutional Settings & RBAC Governance Modules
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              DIFC licensing, multi-entity RBAC partitions, partner equity configs, real-time FX valuation, and 2FA session modules ready for Phase 2.
            </p>
          </div>
        </div>

        {/* Settings Navigation Sidebar */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase font-bold text-gray-500">
                Desk Modules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {[
                { name: "General", active: true },
                { name: "Company & Legal", count: "DIFC" },
                { name: "Users & Access Control", count: "3 Active" },
                { name: "Partner Management", count: "2 Partners" },
                { name: "Business Entities", count: "2 Entities" },
                { name: "Currency & FX Hedging", count: "AED Base" },
                { name: "Security & 2FA", count: "TIER-1" },
                { name: "Danger Zone", count: "ROOT" },
              ].map((module) => (
                <button
                  key={module.name}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors text-left ${
                    module.active
                      ? "bg-[#0c0d12] text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span>{module.name}</span>
                  {module.count && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        module.active
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {module.count}
                    </span>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

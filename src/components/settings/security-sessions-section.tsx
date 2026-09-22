import React from "react";
import { ActiveDeviceSession } from "@/types/settings";

export interface SecuritySessionsSectionProps {
  sessions: ActiveDeviceSession[];
  onTerminateOtherSessions: () => void;
  onRevokeKey: (id: string) => void;
}

export function SecuritySessionsSection({
  sessions,
  onTerminateOtherSessions,
  onRevokeKey,
}: SecuritySessionsSectionProps) {
  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-2">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
            Security, 2FA & Active Institutional Sessions
          </h2>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Cryptographic token validation, hardware key bindings, and active transport sessions.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wider uppercase bg-[#0c0d12] text-white">
          ENFORCEMENT: TIER-1 ROOT
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Top 2 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-gray-950 text-xs">
                <span>🔑</span>
                <span>Two-Factor Authentication (2FA)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wider uppercase bg-[#0c0d12] text-white">
                HARDWARE / TOTP
              </span>
            </div>
            <p className="text-[11px] text-gray-600 font-normal leading-relaxed">
              Mandatory biometric or YubiKey FIDO2 token authentication for all transaction sign-offs above AED 50,000.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-gray-950 text-xs">
                <span>⏱️</span>
                <span>Session Lease & Re-Auth Protocol</span>
              </div>
              <span className="text-[10.5px] font-bold text-gray-600">
                30 Minutes Idle
              </span>
            </div>
            <p className="text-[11px] text-gray-600 font-normal leading-relaxed">
              Terminals automatically wipe memory storage and disengage credentials upon 1,800 seconds of inactivity.
            </p>
          </div>
        </div>

        {/* Active Device Transports */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              ACTIVE DEVICE TRANSPORTS
            </span>
            <button
              type="button"
              onClick={onTerminateOtherSessions}
              className="text-[11px] font-bold text-gray-700 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>🚫</span>
              <span>Terminate Other Sessions</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3.5 rounded-lg border border-gray-200/90 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-800 shrink-0 shadow-2xs mt-0.5">
                    {sess.deviceType === "laptop" ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-gray-950 text-xs">
                        {sess.deviceName}
                      </span>
                      {sess.isCurrentDevice && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-[#0c0d12] text-white tracking-wider">
                          THIS DEVICE
                        </span>
                      )}
                      {sess.securityBadge && (
                        <span className="text-[10px] text-gray-500 font-medium italic">
                          {sess.securityBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 font-normal">
                      {sess.locationDetails} • IP: <span className="font-mono">{sess.ipAddress}</span> • {sess.tlsVersion}
                      {sess.lastActiveText && <span> • {sess.lastActiveText}</span>}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center sm:justify-end">
                  {sess.isActiveNow ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-950">
                      <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                      <span>Active Now</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRevokeKey(sess.id)}
                      className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Revoke Key
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  ArrowLeftIcon,
  InvestorsIcon,
  BusinessesIcon,
  AlertTriangleIcon,
  PencilIcon,
  TrashIcon,
  DownloadIcon,
  PrinterIcon,
} from "@/components/ui/icons";
import { InvestorRecord } from "@/types/investors";
import { InvestorSettlementOverview } from "@/services/investor/settlement.service";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";
import { useAuth } from "@/context/auth-context";
import { EditInvestorModal } from "@/components/admin/investors/edit-investor-modal";
import { DeleteInvestorModal } from "@/components/admin/investors/delete-investor-modal";
import { ProfitAllocationSection } from "@/components/investors/settlement/profit-allocation-section";
import { InvestorDueSection } from "@/components/investors/settlement/investor-due-section";
import { RecordDisbursalSection } from "@/components/investors/settlement/record-disbursal-section";
import { DisbursalHistoryTable } from "@/components/investors/settlement/disbursal-history-table";
import { exportInvestorToPdf } from "@/lib/export/export-investor-pdf";
import { exportInvestorToExcel } from "@/lib/export/export-investor-excel";

interface InvestorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function InvestorDetailPage({ params }: InvestorDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = use(params);
  const investorId = resolvedParams.id;

  // 1. Fetch Investor Metadata
  const {
    data: investorData,
    error: fetchError,
    isLoading: isInvestorLoading,
    mutate: mutateInvestor,
  } = useCachedFetch<{
    success: boolean;
    investor: InvestorRecord;
    message?: string;
    error?: string;
  }>(investorId ? `/api/investors/${encodeURIComponent(investorId)}` : null);

  // 2. Fetch Authoritative Settlement Overview
  const {
    data: settlementData,
    isLoading: isSettlementLoading,
    mutate: mutateSettlement,
  } = useCachedFetch<{
    success: boolean;
    settlement: InvestorSettlementOverview;
    message?: string;
    error?: string;
  }>(investorId ? `/api/investors/${encodeURIComponent(investorId)}/settlement` : null);

  const investor = investorData?.investor || null;
  const settlement = settlementData?.settlement || null;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleRefreshAll = () => {
    mutateInvestor();
    mutateSettlement();
  };

  const handleExportPdf = async () => {
    if (!investor) return;
    try {
      setIsExportingPdf(true);
      setExportError(null);
      exportInvestorToPdf(investor, settlement);
    } catch (err) {
      console.error("[Export Investor PDF Error]", err);
      setExportError("Failed to generate PDF. Please try again.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    if (!investor) return;
    try {
      setIsExportingExcel(true);
      setExportError(null);
      exportInvestorToExcel(investor, settlement);
    } catch (err) {
      console.error("[Export Investor Excel Error]", err);
      setExportError("Failed to generate Excel workbook. Please try again.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isLoading = isInvestorLoading || (isSettlementLoading && !settlement);
  const error = fetchError
    ? fetchError.message
    : investorData && !investorData.success
    ? investorData.message || investorData.error || "Investor details could not be found."
    : null;

  if (isLoading) {
    return (
      <div className="space-y-6 pb-14">
        <div className="h-6 w-36 rounded bg-gray-100 animate-pulse" />
        <div className="h-20 w-full rounded-xl bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="h-96 w-full rounded-xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (error || !investor) {
    return (
      <div className="space-y-6 pb-14">
        <Link
          href="/investors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon size={14} />
          <span>Back to All Businesses</span>
        </Link>

        <div className="rounded-2xl border border-gray-200/90 bg-white p-10 text-center shadow-2xs max-w-lg mx-auto space-y-4 my-12">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangleIcon size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-gray-950">Investor Not Found</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {error || "The requested investor could not be found or you do not have permission to access it."}
            </p>
          </div>
          <Link
            href="/investors"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0c0d12] hover:bg-gray-800 rounded-lg transition-colors shadow-xs"
          >
            <span>Return to Investors</span>
          </Link>
        </div>
      </div>
    );
  }

  const pType = investor.participantType || "INVESTOR";
  const backHref = investor.businessId
    ? `/investors/business/${encodeURIComponent(investor.businessId)}`
    : "/investors";
  const isAdmin = user?.role === "ADMIN";

  // Financial values from settlement or fallback
  const totalInvestmentAED = settlement ? settlement.totalInvestmentAED : (investor.details?.totalInvestmentAED ?? investor.investmentAED);
  const sharePct = settlement ? settlement.contractualSharePct : (investor.sharePercent ?? 0);
  const allocatedProfitAED = settlement ? settlement.allocatedProfitAED : (investor.details?.allocatedProfit ?? 0);
  const outstandingAED = settlement ? settlement.totalOutstandingAED : (investor.details?.outstandingBalance ?? 0);
  const totalPaidAED = settlement ? settlement.totalPaidAED : (investor.details?.paidAmount ?? 0);
  const isSettled = settlement?.isFullySettled || investor.status === "SETTLED";

  return (
    <div className="space-y-6 pb-14 print:space-y-4 print:pb-0">
      {/* Top Back Navigation Link */}
      <FadeUp delay={0.05}>
        <div className="flex items-center gap-2 print:hidden">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon size={14} />
            <span>Back to Business Investors</span>
          </Link>
        </div>
      </FadeUp>

      {/* Export Error Banner if any */}
      {exportError && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-medium print:hidden">
          {exportError}
        </div>
      )}

      {/* Page Header */}
      <FadeUp delay={0.1}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <PageHeader
                title={`Investor Details: ${investor.name}`}
                subtitle={`${investor.code || "INV"} • ${investor.business || "Business Entity"} • ${pType} Participant`}
              />
              <span
                className={`inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded uppercase ${
                  isSettled
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : investor.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {isSettled ? "SETTLED" : investor.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {/* Export Actions */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <DownloadIcon size={13} />
              <span>{isExportingPdf ? "Exporting PDF..." : "PDF"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>{isExportingExcel ? "Exporting Excel..." : "Excel"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
            >
              <PrinterIcon size={13} />
              <span>Print</span>
            </button>

            {/* Admin Management Actions */}
            {isAdmin && pType === "INVESTOR" && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <PencilIcon size={13} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50/70 border border-red-200 rounded-lg hover:bg-red-100/70 transition-colors shadow-2xs cursor-pointer"
                >
                  <TrashIcon size={13} />
                  <span>Deactivate</span>
                </button>
              </>
            )}

            {investor.businessId && (
              <Link
                href={`/businesses/${encodeURIComponent(investor.businessId)}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
              >
                <BusinessesIcon size={14} />
                <span>Workspace</span>
              </Link>
            )}
          </div>
        </div>
      </FadeUp>

      {/* 4 Metric Cards */}
      <FadeUp delay={0.15}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Total Investment */}
          <div className="p-4 rounded-xl border border-[#d6e3ed] bg-[#edf4f8]/70 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              TOTAL INVESTMENT
            </span>
            <span className="text-base sm:text-lg font-bold text-gray-950 mt-1">
              AED {totalInvestmentAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Card 2: Profit Share */}
          <div className="p-4 rounded-xl border border-[#d6e3ed] bg-[#edf4f8]/70 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              CONTRACTUAL SHARE %
            </span>
            <div>
              <span className="text-base sm:text-lg font-bold text-gray-950 mt-1 block">
                {sharePct !== null ? `${sharePct}%` : "—"}
              </span>
              <span className="text-[10.5px] text-gray-500 font-medium block">
                {investor.details?.profitShareContract ?? `${pType} Capital Stake`}
              </span>
            </div>
          </div>

          {/* Card 3: Allocated Profit */}
          <div className="p-4 rounded-xl border border-[#d6e3ed] bg-[#edf4f8]/70 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              ALLOCATED PROFIT
            </span>
            <span className="text-base sm:text-lg font-bold text-emerald-700 mt-1">
              AED {allocatedProfitAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Card 4: Outstanding Balance */}
          <div className="p-4 rounded-xl border border-[#d6e3ed] bg-[#edf4f8]/70 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              OUTSTANDING BALANCE
            </span>
            <div>
              <span className="text-base sm:text-lg font-black text-gray-950 mt-1 block">
                AED {outstandingAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10.5px] text-gray-500 font-medium block">
                Paid: AED {totalPaidAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* Participant Profile & Overview Details */}
      <FadeUp delay={0.2}>
        <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 bg-white">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#0c0d12] flex items-center justify-center text-white text-xs font-bold shrink-0">
                <InvestorsIcon size={18} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
                  Participant Overview & Contract
                </h2>
                <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                  Registered investment entity, capital allocation, and contact details.
                </p>
              </div>
            </div>

            <div>
              {pType === "ADMIN" && (
                <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-purple-700 bg-purple-50 border border-purple-200 rounded uppercase">
                  ADMIN PARTICIPANT
                </span>
              )}
              {pType === "PARTNER" && (
                <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 rounded uppercase">
                  PARTNER PARTICIPANT
                </span>
              )}
              {pType === "INVESTOR" && (
                <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded uppercase">
                  EXTERNAL INVESTOR
                </span>
              )}
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  INVESTOR NAME
                </span>
                <span className="text-xs font-bold text-gray-900 block truncate">
                  {investor.name}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  PARTICIPANT CODE
                </span>
                <span className="text-xs font-mono font-bold text-gray-900 block truncate">
                  {investor.code || "—"}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  EMAIL ADDRESS
                </span>
                <span className="text-xs font-mono font-medium text-gray-900 block truncate">
                  {investor.email || "—"}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  PHONE NUMBER
                </span>
                <span className="text-xs font-mono font-medium text-gray-900 block truncate">
                  {investor.phone || "—"}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  ASSIGNED BUSINESS
                </span>
                <span className="text-xs font-bold text-gray-900 block truncate">
                  {investor.business}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  COMMITTED CAPITAL
                </span>
                <span className="text-xs font-mono font-bold text-gray-900 block">
                  AED {totalInvestmentAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  INVESTMENT DATE
                </span>
                <span className="text-xs font-bold text-gray-900 block">
                  {investor.date}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  SETTLEMENT STATUS
                </span>
                <span className="text-xs font-bold text-gray-900 block">
                  {isSettled ? "Settled (Cleared)" : "Active / Accruing"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* SECTION 1 — PROFIT ALLOCATION */}
      {settlement && (
        <FadeUp delay={0.25}>
          <ProfitAllocationSection
            settlement={settlement}
            isAdmin={isAdmin}
            onAllocationUpdated={handleRefreshAll}
          />
        </FadeUp>
      )}

      {/* SECTION 2 — INVESTOR DUE */}
      {settlement && (
        <FadeUp delay={0.3}>
          <InvestorDueSection settlement={settlement} />
        </FadeUp>
      )}

      {/* SECTION 3 — PAYMENT / DISBURSAL */}
      {settlement && (
        <div className="print:hidden">
          <FadeUp delay={0.35}>
            <RecordDisbursalSection
              settlement={settlement}
              isAdmin={isAdmin}
              onPaymentRecorded={handleRefreshAll}
            />
          </FadeUp>
        </div>
      )}

      {/* SECTION 4 — SETTLEMENT PAYMENT HISTORY TABLE */}
      {settlement && (
        <FadeUp delay={0.4}>
          <DisbursalHistoryTable paymentHistory={settlement.paymentHistory} />
        </FadeUp>
      )}

      {/* Modals */}
      {isEditModalOpen && (
        <EditInvestorModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          investor={investor}
          onSuccess={() => {
            setIsEditModalOpen(false);
            handleRefreshAll();
          }}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteInvestorModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          investor={investor}
          onSuccess={() => {
            setIsDeleteModalOpen(false);
            router.push(backHref);
          }}
        />
      )}
    </div>
  );
}

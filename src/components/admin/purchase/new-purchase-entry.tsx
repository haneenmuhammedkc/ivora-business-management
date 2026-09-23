"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PurchaseIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PurchaseRecord, PurchaseStatus } from "@/types/purchase";

export interface NewPurchaseEntryProps {
  onRecordPurchase?: (purchase: PurchaseRecord) => void;
}

export function NewPurchaseEntry({
  onRecordPurchase,
}: NewPurchaseEntryProps) {
  const router = useRouter();
  const [business, setBusiness] = useState("Business 01 (Entity A + B)");
  const [purchaseDate, setPurchaseDate] = useState("10 Sep 2026");
  const [sourcingDesk, setSourcingDesk] = useState("Dubai Gold Souk Vault #04");
  const [productType, setProductType] = useState(
    "999.9 Fine Gold Bullion (Kilobars / Cast)"
  );
  const [quantityGms, setQuantityGms] = useState("6200");
  const [basePrice, setBasePrice] = useState("31.50");
  const [freight, setFreight] = useState("520");
  const [labour, setLabour] = useState("380");
  const [customs, setCustoms] = useState("1150");
  const [tradingCycle, setTradingCycle] = useState("Assign to Cycle #TC-2025-090");
  const [statusMode, setStatusMode] = useState<PurchaseStatus>("IN PROGRESS");

  // Calculations
  const qty = Number(quantityGms) || 0;
  const price = Number(basePrice) || 0;
  const baseValue = qty * price;
  const freightVal = Number(freight) || 0;
  const labourVal = Number(labour) || 0;
  const customsVal = Number(customs) || 0;
  const totalLanded = baseValue + freightVal + labourVal + customsVal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: PurchaseRecord = {
      id: `PR-${Math.floor(Math.random() * 900) + 249}`,
      business: business.split(" (")[0] || "Business 01",
      businessEntities: business.includes("(")
        ? business.split("(")[1].replace(")", "")
        : "Entity A + B",
      date: purchaseDate,
      product: productType.split(" (")[0] || productType,
      locationVault: sourcingDesk,
      quantityGms: qty,
      basePriceAED: price,
      freightAED: freightVal,
      labourAED: labourVal,
      customsAED: customsVal,
      totalLandedAED: totalLanded,
      status: statusMode,
      selected: false,
    };

    if (onRecordPurchase) {
      onRecordPurchase(newRecord);
    }
    router.push("/purchase");
  };

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-6 sm:p-7 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900">
            <PurchaseIcon size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-950 flex items-center gap-2">
              New Purchase Entry
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Record Dubai physical trading acquisition and landed expenses.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 01: ENTITY PARTITIONING */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">
              SECTION 01: ENTITY PARTITIONING
            </span>
            <span className="text-xs font-mono font-bold text-gray-900">
              AUTO-ID: PR-0249
            </span>
          </div>

          <div>
            <Select
              label="Assigned Business Entity"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              options={[
                {
                  value: "Business 01 (Entity A + B)",
                  label: "Business 01 (Entity A + B)",
                },
                {
                  value: "Business 02 (Entity A + C)",
                  label: "Business 02 (Entity A + C)",
                },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="PURCHASE DATE"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
            <Input
              label="SOURCING DESK / VAULT"
              value={sourcingDesk}
              onChange={(e) => setSourcingDesk(e.target.value)}
            />
          </div>
        </div>

        {/* SECTION 02: COMMODITY SPECIFICATIONS */}
        <div className="space-y-3.5 pt-2 border-t border-gray-100">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
            SECTION 02: COMMODITY SPECIFICATIONS
          </span>

          <Select
            label="Product Type / Fineness"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            options={[
              {
                value: "999.9 Fine Gold Bullion (Kilobars / Cast)",
                label: "999.9 Fine Gold Bullion (Kilobars / Cast)",
              },
              {
                value: "Gold Grain 995 (Refinery Grade)",
                label: "Gold Grain 995 (Refinery Grade)",
              },
              {
                value: "Pure Silver Grain 999",
                label: "Pure Silver Grain 999",
              },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="QUANTITY (GMS)"
              type="number"
              value={quantityGms}
              onChange={(e) => setQuantityGms(e.target.value)}
              className="text-right font-medium"
            />
            <Input
              label="BASE PRICE / GMS (AED)"
              type="number"
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="text-right font-medium"
            />
          </div>
        </div>

        {/* SECTION 03: LANDED COST FORMULA */}
        <div className="rounded-xl border border-[#d4e2ed] bg-[#edf3f8]/80 p-5 space-y-4">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-600 block">
            SECTION 03: LANDED COST FORMULA
          </span>

          <div className="space-y-3">
            {/* Base Acquisition Value */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-700 font-medium">
                Base Acquisition Value ({qty.toLocaleString()} × {price.toFixed(2)})
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500 font-bold">AED</span>
                <span className="font-bold text-gray-900 text-xs sm:text-sm">
                  {baseValue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Freight */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-700 font-medium">
                (+) Transit Insurance & Freight
              </span>
              <div className="w-32">
                <input
                  type="number"
                  value={freight}
                  onChange={(e) => setFreight(e.target.value)}
                  className="w-full text-right bg-white border border-gray-300 rounded px-2.5 py-1 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900"
                />
              </div>
            </div>

            {/* Vault Handling */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-700 font-medium">
                (+) Vault Handling & Labour
              </span>
              <div className="w-32">
                <input
                  type="number"
                  value={labour}
                  onChange={(e) => setLabour(e.target.value)}
                  className="w-full text-right bg-white border border-gray-300 rounded px-2.5 py-1 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900"
                />
              </div>
            </div>

            {/* Customs Clearance */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-700 font-medium">
                (+) Customs Clearance & Security
              </span>
              <div className="w-32">
                <input
                  type="number"
                  value={customs}
                  onChange={(e) => setCustoms(e.target.value)}
                  className="w-full text-right bg-white border border-gray-300 rounded px-2.5 py-1 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Landed Total */}
          <div className="pt-3 border-t border-[#d4e2ed] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                TOTAL LANDED COST
              </span>
              <span className="text-[10px] text-gray-500 block">
                Consolidated Net Outflow
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold text-gray-800 uppercase">
                AED
              </span>
              <span className="text-2xl font-black text-gray-950 tracking-tight">
                {totalLanded.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 04: TRADING LINKAGE */}
        <div className="space-y-3.5 pt-2 border-t border-gray-100">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
            SECTION 04: TRADING LINKAGE
          </span>

          <Select
            label="Target Trading Cycle"
            value={tradingCycle}
            onChange={(e) => setTradingCycle(e.target.value)}
            options={[
              {
                value: "Assign to Cycle #TC-2025-090",
                label: "Assign to Cycle #TC-2025-090",
              },
              {
                value: "Assign to Cycle #TC-2025-091",
                label: "Assign to Cycle #TC-2025-091",
              },
            ]}
          />

          {/* Radio Status Options */}
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex items-center gap-2.5 text-xs font-medium text-gray-800 cursor-pointer">
              <input
                type="radio"
                name="purchase-status"
                checked={statusMode === "IN PROGRESS"}
                onChange={() => setStatusMode("IN PROGRESS")}
                className="h-4 w-4 text-black focus:ring-black cursor-pointer"
              />
              <span>Mark as In Progress</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-medium text-gray-800 cursor-pointer">
              <input
                type="radio"
                name="purchase-status"
                checked={statusMode === "DRAFT"}
                onChange={() => setStatusMode("DRAFT")}
                className="h-4 w-4 text-black focus:ring-black cursor-pointer"
              />
              <span>Save as Draft Consignment</span>
            </label>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-center sm:justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href="/purchase"
            className="inline-flex items-center justify-center font-semibold transition-colors bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 h-9 px-6 text-xs rounded-md shadow-xs"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            variant="primary"
            className="px-6 text-xs font-bold"
          >
            Record Consignment
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SalesIcon, CheckIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SaleRecord, SaleStatus } from "@/types/sales";

export interface NewSaleEntryProps {
  onRecordSale?: (sale: SaleRecord) => void;
}

export function NewSaleEntry({ onRecordSale }: NewSaleEntryProps) {
  const router = useRouter();

  const [business, setBusiness] = useState("Business 01 (Entity A + B)");
  const [tradingCycle, setTradingCycle] = useState("Cycle #TR-0248 (Linked to Dubai Purchase)");
  const [saleDate, setSaleDate] = useState("10 Sep 2026");
  const [liquidationDesk, setLiquidationDesk] = useState("Zaveri Bazaar, Mumbai");
  const [productType, setProductType] = useState("999.9 Fine Gold Bullion (Kilobars / Cast)");
  const [quantityGms, setQuantityGms] = useState("6500");
  const [sellingPrice, setSellingPrice] = useState("21.85");
  const [buyerFirm, setBuyerFirm] = useState("Surat & Zaveri Diamond & Bullion House");
  const [inrRealization, setInrRealization] = useState("3228000");
  const [fxRate, setFxRate] = useState("22.74");
  const purchaseCost = "112000";
  const freightSecurity = "6000";

  // Dynamic partner share based on business
  const partnersShare = business.includes("Business 02")
    ? "A: 50% | C: 50%"
    : "A: 60% | B: 40%";

  // Calculations
  const qty = Number(quantityGms) || 0;
  const price = Number(sellingPrice) || 0;
  const grossSale = qty * price > 0 ? Math.round(qty * price) : 142000;
  const inrVal = Number(inrRealization) || 0;
  const rate = Number(fxRate) || 1;
  const aedEquivalent = rate > 0 && inrVal > 0 ? Math.round(inrVal / rate) : grossSale;

  const cost = Number(purchaseCost) || 0;
  const freight = Number(freightSecurity) || 0;
  const grossArbitrage = aedEquivalent - cost;
  const netRealizedProfit = grossArbitrage - freight;
  const netMargin = aedEquivalent > 0 ? (netRealizedProfit / aedEquivalent) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: SaleRecord = {
      id: "SL-0249",
      business: business.split(" (")[0] || "Business 01",
      partnersShare,
      date: saleDate,
      cycle: tradingCycle.includes("#")
        ? tradingCycle.split("#")[1].split(" ")[0]
        : "TR-0249",
      commodity: productType.split(" (")[0] || productType,
      locationDesk: liquidationDesk,
      quantityGms: qty,
      priceAED: price,
      totalAED: aedEquivalent,
      inrRealizationFormatted: `₹ ${inrVal.toLocaleString("en-IN")}`,
      fxRate: rate,
      profitAED: netRealizedProfit,
      status: "CLEARED" as SaleStatus,
      selected: false,
    };

    if (onRecordSale) {
      onRecordSale(newRecord);
    }
    router.push("/sales");
  };

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-6 sm:p-7 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900">
            <SalesIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-950">
                New Sale & Realization Entry
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded uppercase">
                AUTO
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Record India sales liquidation against active consignment.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 01. CYCLE & PARTITIONING */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">
              01. CYCLE & PARTITIONING
            </span>
            <span className="text-xs font-mono font-bold text-gray-900">
              ID: SL-0249
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
            <div className="sm:col-span-2">
              <Select
                label="Assigned Business & Partition"
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
            <div className="pb-0.5">
              <div className="h-9 px-3 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                {partnersShare}
              </div>
            </div>
          </div>

          <Select
            label="Linked Trading Cycle"
            value={tradingCycle}
            onChange={(e) => setTradingCycle(e.target.value)}
            options={[
              {
                value: "Cycle #TR-0248 (Linked to Dubai Purchase)",
                label: "Cycle #TR-0248 (Linked to Dubai Purchase)",
              },
              {
                value: "Cycle #TR-0247 (Linked to Dubai Purchase)",
                label: "Cycle #TR-0247 (Linked to Dubai Purchase)",
              },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Sale Date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />
            <Input
              label="Liquidation Desk"
              value={liquidationDesk}
              onChange={(e) => setLiquidationDesk(e.target.value)}
            />
          </div>
        </div>

        {/* 02. PRODUCT SPECIFICATIONS */}
        <div className="space-y-3.5 pt-2 border-t border-gray-100">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
            02. PRODUCT SPECIFICATIONS
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
                value: "Gold Grain 995 (Refinery Consignment)",
                label: "Gold Grain 995 (Refinery Consignment)",
              },
              {
                value: "Pure Silver Grain 999",
                label: "Pure Silver Grain 999",
              },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Quantity (GMS)"
              type="number"
              value={quantityGms}
              onChange={(e) => setQuantityGms(e.target.value)}
              className="text-right font-medium"
            />
            <Input
              label="Selling Price / GMS (AED)"
              type="number"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="text-right font-medium"
            />
          </div>

          <Input
            label="Buyer / Clearing Firm"
            value={buyerFirm}
            onChange={(e) => setBuyerFirm(e.target.value)}
          />
        </div>

        {/* 03. INDIA INR REALIZATION & CONVERSION */}
        <div className="space-y-3.5 pt-2 border-t border-gray-100">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
            03. INDIA INR REALIZATION & CONVERSION
          </span>

          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="INR Realization Value (₹)"
                value={inrRealization}
                onChange={(e) => setInrRealization(e.target.value)}
                className="font-semibold"
              />
              <Input
                label="Realized FX Rate (₹ / AED)"
                value={fxRate}
                onChange={(e) => setFxRate(e.target.value)}
                className="font-semibold"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200/70 text-xs">
              <span className="text-gray-600 font-medium">
                AED Equivalent Realized:
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  AED
                </span>
                <span className="text-lg font-extrabold text-gray-950">
                  {aedEquivalent.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 04. MARGIN & ARBITRAGE LEDGER */}
        <div className="rounded-xl border border-[#d4e2ed] bg-[#edf3f8]/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-700">
              04. MARGIN & ARBITRAGE LEDGER
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Total Gross Sale:</span>
              <span className="font-bold text-gray-900">
                AED {aedEquivalent.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Less Purchase Cost:</span>
              <span className="font-medium text-gray-800">
                - AED {cost.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#d4e2ed]">
              <span className="text-gray-700 font-bold">Gross Arbitrage Profit:</span>
              <span className="font-bold text-gray-950">
                AED {grossArbitrage.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Less Freight & Security:</span>
              <span className="font-medium text-gray-800">
                - AED {freight.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Net Realized Profit */}
          <div className="pt-3 border-t border-[#d4e2ed] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                NET REALIZED PROFIT
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xs font-bold text-gray-800 uppercase">
                  AED
                </span>
                <span className="text-2xl font-black text-gray-950 tracking-tight">
                  {netRealizedProfit.toLocaleString()}
                </span>
              </div>
            </div>

            <span className="inline-block px-3 py-1 text-xs font-bold text-white bg-[#0c0d12] rounded-md shadow-xs">
              {netMargin.toFixed(2)}% Net Margin
            </span>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-center sm:justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href="/sales"
            className="inline-flex items-center justify-center font-semibold transition-colors bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 h-9 px-6 text-xs rounded-md shadow-xs"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            variant="primary"
            icon={<CheckIcon size={14} />}
            className="px-6 text-xs font-bold"
          >
            Save & Confirm Realization
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SalesIcon, ChevronDownIcon, CheckIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvailableProductItem } from "@/types/sales";

interface BusinessOption {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function NewSaleEntry() {
  const router = useRouter();

  // Businesses state
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [isBusinessDropdownOpen, setIsBusinessDropdownOpen] = useState(false);
  const businessDropdownRef = useRef<HTMLDivElement>(null);

  // Available products state for selected business
  const [availableProducts, setAvailableProducts] = useState<AvailableProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Form inputs
  const [businessId, setBusinessId] = useState("");
  const [saleDate, setSaleDate] = useState(getTodayString());
  const [productType, setProductType] = useState("");
  const [buyerFirm, setBuyerFirm] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState<"GRAM" | "PIECE">("GRAM");
  const [totalSellingPriceINR, setTotalSellingPriceINR] = useState("");
  const [realizedFxRate, setRealizedFxRate] = useState("");

  // Submitting & status messages
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Find currently selected product object
  const activeProduct = useMemo(() => {
    return availableProducts.find((p) => p.productType === productType) || null;
  }, [availableProducts, productType]);

  // Derived available quantity
  const availableQty = activeProduct ? activeProduct.remainingQuantity : 0;

  // Sales Base Price = (Total Selling Price INR ÷ Realized FX Rate) ÷ Quantity
  // = AED Equivalent Realized ÷ Quantity
  const calculatedSalesBasePrice = useMemo(() => {
    const qty = parseFloat(quantity);
    const inr = parseFloat(totalSellingPriceINR);
    const fx = parseFloat(realizedFxRate);
    if (isNaN(qty) || isNaN(inr) || isNaN(fx) || qty <= 0 || inr <= 0 || fx <= 0) {
      return null;
    }
    const aedTotal = inr / fx;
    return aedTotal / qty;
  }, [quantity, totalSellingPriceINR, realizedFxRate]);

  const displaySalesBasePrice = useMemo(() => {
    if (calculatedSalesBasePrice === null) return "—";
    const unitSuffix = quantityUnit === "PIECE" ? "Piece" : "Gram";
    return `AED ${calculatedSalesBasePrice.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} / ${unitSuffix}`;
  }, [calculatedSalesBasePrice, quantityUnit]);

  // INR Realization Value is identical to Total Selling Price (INR)
  const displayInrRealization = useMemo(() => {
    const val = parseFloat(totalSellingPriceINR);
    if (isNaN(val) || val <= 0) return "—";
    return `₹ ${val.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [totalSellingPriceINR]);

  // AED Equivalent Realized = Total Selling Price INR ÷ FX Rate
  const displayAedEquivalent = useMemo(() => {
    const inr = parseFloat(totalSellingPriceINR);
    const fx = parseFloat(realizedFxRate);
    if (isNaN(inr) || isNaN(fx) || inr <= 0 || fx <= 0) return "—";
    const aed = inr / fx;
    return `AED ${aed.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [totalSellingPriceINR, realizedFxRate]);

  // Live Quantity validation & Form validity
  const quantityNum = parseFloat(quantity);
  const unitLabel = quantityUnit === "PIECE" ? "PCS" : "GMS";
  const purchasedQty = activeProduct?.totalPurchasedQuantity ?? 0;
  const alreadySoldQty = activeProduct?.totalSoldQuantity ?? 0;
  const currentSaleQty = isNaN(quantityNum) || quantityNum <= 0 ? 0 : quantityNum;
  const remainingAfterSale = activeProduct !== null ? availableQty - currentSaleQty : null;

  const quantityValidationError = useMemo(() => {
    if (!quantity || !productType) return null;
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return "Quantity must be greater than 0.";
    }
    if (quantityUnit === "PIECE" && !Number.isInteger(quantityNum)) {
      return "Quantity in PIECES must be a whole integer.";
    }
    if (quantityNum > availableQty) {
      const formattedAvail = availableQty.toLocaleString(undefined, {
        minimumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
        maximumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
      });
      return `Sale quantity exceeds available stock. Only ${formattedAvail} ${unitLabel} are available.`;
    }
    return null;
  }, [quantity, productType, quantityNum, quantityUnit, availableQty, unitLabel]);

  const isFormValid = useMemo(() => {
    if (!businessId || !saleDate || !productType || !buyerFirm.trim()) return false;
    if (isNaN(quantityNum) || quantityNum <= 0) return false;
    if (quantityUnit === "PIECE" && !Number.isInteger(quantityNum)) return false;
    if (quantityNum > availableQty) return false;
    const inr = parseFloat(totalSellingPriceINR);
    if (isNaN(inr) || inr <= 0) return false;
    const fx = parseFloat(realizedFxRate);
    if (isNaN(fx) || fx <= 0) return false;
    return true;
  }, [
    businessId,
    saleDate,
    productType,
    buyerFirm,
    quantityNum,
    quantityUnit,
    availableQty,
    totalSellingPriceINR,
    realizedFxRate,
  ]);

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        businessDropdownRef.current &&
        !businessDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBusinessDropdownOpen(false);
      }
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProductDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsBusinessDropdownOpen(false);
        setIsProductDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // 1. Load real businesses from DB, ordered createdAt DESC
  useEffect(() => {
    let isMounted = true;
    async function loadBusinesses() {
      try {
        setLoadingBusinesses(true);
        const res = await fetch("/api/businesses");
        if (!res.ok) throw new Error(`Failed to load businesses (${res.status})`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.businesses)) {
          const mapped: BusinessOption[] = data.businesses.map(
            (b: { id: string; name: string; code: string; createdAt?: string }) => ({
              id: b.id,
              name: b.name,
              code: b.code,
              createdAt: b.createdAt || "",
            })
          );

          // Strictly sort NEWEST -> OLDEST by createdAt timestamp
          mapped.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });

          setBusinesses(mapped);
        }
      } catch (err) {
        console.error("Error fetching businesses:", err);
      } finally {
        if (isMounted) setLoadingBusinesses(false);
      }
    }
    loadBusinesses();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. When business changes: reset product & quantity, fetch available products
  const handleBusinessSelect = async (bId: string) => {
    setBusinessId(bId);
    setIsBusinessDropdownOpen(false);
    setProductType("");
    setQuantity("");
    setTotalSellingPriceINR("");
    setRealizedFxRate("");
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!bId) {
      setAvailableProducts([]);
      return;
    }

    try {
      setLoadingProducts(true);
      const res = await fetch(`/api/sales/available-products?businessId=${encodeURIComponent(bId)}`);
      if (!res.ok) throw new Error(`Failed to load available products (${res.status})`);
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setAvailableProducts(data.products);
      } else {
        setAvailableProducts([]);
      }
    } catch (err) {
      console.error("Error fetching available products:", err);
      setAvailableProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // 3. When product changes: update unit & display available quantity
  const handleProductSelect = (prod: AvailableProductItem) => {
    setProductType(prod.productType);
    setQuantityUnit(prod.quantityUnit);
    setQuantity("");
    setIsProductDropdownOpen(false);
    setErrorMessage(null);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!businessId) {
      setErrorMessage("Please select an Assigned Business Entity.");
      return;
    }

    if (!saleDate) {
      setErrorMessage("Please enter a valid Sale Date.");
      return;
    }

    if (!productType) {
      setErrorMessage("Please select an available Product Type.");
      return;
    }

    const trimmedBuyer = buyerFirm.trim();
    if (!trimmedBuyer) {
      setErrorMessage("Please enter the Buyer / Clearing Firm.");
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMessage("Quantity must be a positive number greater than 0.");
      return;
    }

    if (quantityUnit === "PIECE" && !Number.isInteger(qtyNum)) {
      setErrorMessage("Quantity in PIECES must be a whole integer.");
      return;
    }

    if (qtyNum > availableQty) {
      const formattedAvail = availableQty.toLocaleString(undefined, {
        minimumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
        maximumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
      });
      setErrorMessage(`Sale quantity exceeds available stock. Only ${formattedAvail} ${unitLabel} are available.`);
      return;
    }

    const sellingPriceNum = parseFloat(totalSellingPriceINR);
    if (isNaN(sellingPriceNum) || sellingPriceNum <= 0) {
      setErrorMessage("Total Selling Price (INR) must be a positive number greater than 0.");
      return;
    }

    const fxRateNum = parseFloat(realizedFxRate);
    if (isNaN(fxRateNum) || fxRateNum <= 0) {
      setErrorMessage("Realized FX Rate must be a positive number greater than 0.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        businessId,
        saleDate,
        productType,
        buyerFirm: trimmedBuyer,
        quantity: qtyNum,
        quantityUnit,
        totalSellingPriceINR: sellingPriceNum,
        realizedFxRate: fxRateNum,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        const errorDetail = result.details?.availableQuantity !== undefined
          ? ` (Available: ${Number(result.details.availableQuantity).toLocaleString()} ${result.details.quantityUnit || "units"})`
          : "";
        throw new Error((result.message || result.error || "Failed to record sale.") + errorDetail);
      }

      setSuccessMessage("Sale successfully recorded and inventory updated.");
      setTimeout(() => {
        router.push("/sales");
      }, 700);
    } catch (err: unknown) {
      console.error("Sale submission error:", err);
      const msg = err instanceof Error ? err.message : "Failed to record sale.";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBusinessObj = businesses.find((b) => b.id === businessId);

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
                New Sale Entry
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded uppercase">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Record physical liquidation against available inventory and realize proceeds.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3 text-xs rounded-lg border border-red-200 bg-red-50 text-red-800 font-medium">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="p-3 text-xs rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-medium">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 01. SALE INFORMATION */}
        <div className="space-y-3.5">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
            01. SALE INFORMATION
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assigned Business */}
            <div className="space-y-1.5" ref={businessDropdownRef}>
              <label className="block text-xs font-semibold text-gray-700">
                Assigned Business <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsBusinessDropdownOpen((prev) => !prev)}
                  disabled={loadingBusinesses}
                  className="w-full h-10 px-3.5 rounded-lg border border-gray-300 bg-white text-left text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black flex items-center justify-between transition-colors disabled:opacity-50"
                >
                  <span className="truncate">
                    {loadingBusinesses
                      ? "Loading businesses..."
                      : selectedBusinessObj
                      ? `${selectedBusinessObj.name} (${selectedBusinessObj.code})`
                      : "Select an assigned business..."}
                  </span>
                  <ChevronDownIcon
                    size={16}
                    className={`text-gray-500 transition-transform ${
                      isBusinessDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isBusinessDropdownOpen && (
                  <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto overscroll-contain py-1">
                    {businesses.length === 0 ? (
                      <div className="px-3.5 py-2 text-xs text-gray-400">
                        No businesses found
                      </div>
                    ) : (
                      businesses.map((b) => {
                        const isSelected = b.id === businessId;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => handleBusinessSelect(b.id)}
                            className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-50 transition-colors ${
                              isSelected ? "bg-gray-50 font-bold text-gray-950" : "text-gray-700"
                            }`}
                          >
                            <div className="flex flex-col truncate">
                              <span className="truncate font-semibold">{b.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {b.code}
                              </span>
                            </div>
                            {isSelected && <CheckIcon size={14} className="text-black shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sale Date */}
            <div>
              <Input
                label="Sale Date"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Type (Filtered to purchased products with stock > 0) */}
            <div className="space-y-1.5" ref={productDropdownRef}>
              <label className="block text-xs font-semibold text-gray-700">
                Product Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProductDropdownOpen((prev) => !prev)}
                  disabled={!businessId || loadingProducts}
                  className="w-full h-10 px-3.5 rounded-lg border border-gray-300 bg-white text-left text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black flex items-center justify-between transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="truncate">
                    {!businessId
                      ? "Select a business first"
                      : loadingProducts
                      ? "Loading available products..."
                      : productType || "Select a product with available stock..."}
                  </span>
                  <ChevronDownIcon
                    size={16}
                    className={`text-gray-500 transition-transform ${
                      isProductDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isProductDropdownOpen && (
                  <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto overscroll-contain py-1">
                    {availableProducts.length === 0 ? (
                      <div className="px-3.5 py-2 text-xs text-gray-400">
                        No products with available inventory found for this business.
                      </div>
                    ) : (
                      availableProducts.map((p) => {
                        const isSelected = p.productType === productType;
                        const unitStr = p.quantityUnit === "PIECE" ? "PCS" : "GMS";
                        return (
                          <button
                            key={p.productType}
                            type="button"
                            onClick={() => handleProductSelect(p)}
                            className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-50 transition-colors ${
                              isSelected ? "bg-gray-50 font-bold text-gray-950" : "text-gray-700"
                            }`}
                          >
                            <div className="flex flex-col truncate">
                              <span className="truncate font-semibold">{p.productType}</span>
                              <span className="text-[10px] text-emerald-600 font-mono">
                                Available: {p.remainingQuantity.toLocaleString()} {unitStr}
                              </span>
                            </div>
                            {isSelected && <CheckIcon size={14} className="text-black shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Buyer / Clearing Firm */}
            <div>
              <Input
                label="Buyer / Clearing Firm"
                placeholder="e.g. Surat & Zaveri Diamond & Bullion House"
                value={buyerFirm}
                onChange={(e) => setBuyerFirm(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* 02. PRODUCT / QUANTITY */}
        <div className="space-y-3.5 pt-3 border-t border-gray-100">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
            02. PRODUCT / QUANTITY
          </span>

          {/* Commodity Inventory Breakdown */}
          {productType && (
            <div className="rounded-xl border border-gray-200/90 bg-neutral-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                  Commodity Inventory Breakdown
                </span>
                <span className="text-[10px] font-mono text-gray-500 bg-gray-200/60 px-1.5 py-0.5 rounded">
                  {productType}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="rounded-lg bg-white border border-gray-200 p-2.5">
                  <span className="text-[10px] font-semibold uppercase text-gray-500 block">
                    Purchased Quantity
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 font-mono">
                    {purchasedQty.toLocaleString(undefined, {
                      minimumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
                      maximumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
                    })} {unitLabel}
                  </span>
                </div>

                <div className="rounded-lg bg-white border border-gray-200 p-2.5">
                  <span className="text-[10px] font-semibold uppercase text-gray-500 block">
                    Already Sold
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-gray-800 font-mono">
                    {alreadySoldQty.toLocaleString(undefined, {
                      minimumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
                      maximumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
                    })} {unitLabel}
                  </span>
                </div>

                <div className="rounded-lg bg-white border border-gray-200 p-2.5">
                  <span className="text-[10px] font-semibold uppercase text-gray-500 block">
                    Available Stock
                  </span>
                  <span className={`text-xs sm:text-sm font-bold font-mono ${availableQty > 0 ? "text-emerald-700" : "text-amber-700"}`}>
                    {availableQty.toLocaleString(undefined, {
                      minimumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
                      maximumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
                    })} {unitLabel}
                  </span>
                </div>

                <div className="rounded-lg bg-white border border-gray-200 p-2.5">
                  <span className="text-[10px] font-semibold uppercase text-gray-500 block">
                    Current Sale
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-gray-950 font-mono">
                    {currentSaleQty > 0
                      ? `${currentSaleQty.toLocaleString(undefined, {
                          minimumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
                          maximumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
                        })} ${unitLabel}`
                      : "—"}
                  </span>
                </div>

                <div className="rounded-lg bg-white border border-gray-200 p-2.5">
                  <span className="text-[10px] font-semibold uppercase text-gray-500 block">
                    Remaining After Sale
                  </span>
                  <span className={`text-xs sm:text-sm font-bold font-mono ${
                    remainingAfterSale !== null && remainingAfterSale < 0
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}>
                    {remainingAfterSale !== null && currentSaleQty > 0
                      ? `${remainingAfterSale.toLocaleString(undefined, {
                          minimumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
                          maximumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
                        })} ${unitLabel}`
                      : `${availableQty.toLocaleString(undefined, {
                          minimumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
                          maximumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
                        })} ${unitLabel}`}
                  </span>
                </div>
              </div>

              {quantityValidationError && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs text-red-800 font-semibold flex items-center gap-2">
                  <span className="text-red-600">⚠️ Inventory Limit Exceeded:</span>
                  <span>{quantityValidationError}</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {/* Quantity Input + Unit Indicator */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Quantity ({quantityUnit === "PIECE" ? "PIECES" : "GRAMS"}){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step={quantityUnit === "PIECE" ? "1" : "0.001"}
                  placeholder={quantityUnit === "PIECE" ? "e.g. 80" : "e.g. 1000.000"}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setErrorMessage(null);
                  }}
                  className={`w-full h-10 px-3.5 rounded-lg border bg-white text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 transition-colors ${
                    quantityValidationError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 ring-1 ring-red-500"
                      : "border-gray-300 focus:border-black focus:ring-black/10"
                  }`}
                  required
                />
                <div className="h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-700 whitespace-nowrap select-none">
                  {quantityUnit === "PIECE" ? "PIECES" : "GRAMS"}
                </div>
              </div>
              {quantityValidationError && (
                <p className="text-xs text-red-600 font-semibold mt-1">
                  {quantityValidationError}
                </p>
              )}
            </div>

            {/* Available Quantity Display Tile */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Available Stock
              </label>
              <div className="h-10 px-3.5 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs cursor-default select-none">
                <span className="text-neutral-500 font-medium">Remaining:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {productType
                    ? `${availableQty.toLocaleString(undefined, {
                        minimumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
                        maximumFractionDigits: quantityUnit === "PIECE" ? 0 : 3,
                      })} ${
                        quantityUnit === "PIECE" ? "PCS" : "GMS"
                      }`
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 03. SALE VALUE */}
        <div className="space-y-3.5 pt-3 border-t border-gray-100">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
            03. SALE VALUE
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            {/* Total Selling Price (INR) - USER ENTERS */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Total Selling Price (INR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 select-none">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 3200000.00"
                  value={totalSellingPriceINR}
                  onChange={(e) => {
                    setTotalSellingPriceINR(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full h-10 pl-8 pr-3.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                  required
                />
              </div>
            </div>

            {/* Base Price - READ ONLY (Sales Selling Price Per Unit: INR / FX / Qty) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700">
                  {quantityUnit === "PIECE" ? "Base Price (AED / Piece)" : "Base Price (AED / Gram)"}
                </label>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  READ-ONLY
                </span>
              </div>
              <div className="h-10 px-3.5 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs cursor-default select-none">
                <span className="font-mono font-bold text-neutral-800">
                  {displaySalesBasePrice}
                </span>
              </div>
            </div>

            {/* INR Realization Value - READ ONLY (= Total Selling Price INR) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700">
                  INR Realization Value (₹)
                </label>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  AUTO
                </span>
              </div>
              <div className="h-10 px-3.5 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs cursor-default select-none">
                <span className="font-mono font-bold text-neutral-900">
                  {displayInrRealization}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 04. REALIZATION */}
        <div className="space-y-3.5 pt-3 border-t border-gray-100">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
            04. REALIZATION
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {/* Realized FX Rate (₹ / AED) - USER ENTERS */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Realized FX Rate (₹ / AED) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                placeholder="e.g. 22.7400"
                value={realizedFxRate}
                onChange={(e) => {
                  setRealizedFxRate(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full h-10 px-3.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                required
              />
            </div>

            {/* AED Equivalent Realized - READ ONLY */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700">
                  AED Equivalent Realized
                </label>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  AUTO
                </span>
              </div>
              <div className="h-10 px-3.5 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs cursor-default select-none">
                <span className="font-mono font-bold text-gray-950">
                  {displayAedEquivalent}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href="/sales">
            <Button type="button" variant="outline" disabled={submitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={submitting || !isFormValid}>
            {submitting ? "Saving..." : "Save & Confirm Sale"}
          </Button>
        </div>
      </form>
    </div>
  );
}

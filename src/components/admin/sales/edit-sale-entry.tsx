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

interface EditSaleEntryProps {
  saleId: string;
}

export function EditSaleEntry({ saleId }: EditSaleEntryProps) {
  const router = useRouter();

  // Loading states
  const [loadingSale, setLoadingSale] = useState(true);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Businesses & Products
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AvailableProductItem[]>([]);
  const [isBusinessDropdownOpen, setIsBusinessDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const businessDropdownRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Original sale state
  const [originalQty, setOriginalQty] = useState<number>(0);
  const [saleCode, setSaleCode] = useState("");

  // Form inputs
  const [businessId, setBusinessId] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [productType, setProductType] = useState("");
  const [buyerFirm, setBuyerFirm] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState<"GRAM" | "PIECE">("GRAM");
  const [totalSellingPriceINR, setTotalSellingPriceINR] = useState("");
  const [realizedFxRate, setRealizedFxRate] = useState("");
  const [originalBasePrice, setOriginalBasePrice] = useState<number | null>(null);

  // Status & error messages
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active product
  const activeProduct = useMemo(() => {
    return availableProducts.find((p) => p.productType === productType) || null;
  }, [availableProducts, productType]);

  // Derived effective available quantity (includes original quantity of this sale)
  const effectiveAvailableQty = useMemo(() => {
    const remaining = activeProduct ? activeProduct.remainingQuantity : 0;
    return remaining + originalQty;
  }, [activeProduct, originalQty]);

  // Sales Base Price = (Total Selling Price INR ÷ Realized FX Rate) ÷ Quantity
  // = AED Equivalent Realized ÷ Quantity
  const calculatedSalesBasePrice = useMemo(() => {
    const qty = parseFloat(quantity);
    const inr = parseFloat(totalSellingPriceINR);
    const fx = parseFloat(realizedFxRate);
    if (isNaN(qty) || isNaN(inr) || isNaN(fx) || qty <= 0 || inr <= 0 || fx <= 0) {
      if (originalBasePrice && originalBasePrice > 0) return originalBasePrice;
      return null;
    }
    const aedTotal = inr / fx;
    return aedTotal / qty;
  }, [quantity, totalSellingPriceINR, realizedFxRate, originalBasePrice]);

  const displaySalesBasePrice = useMemo(() => {
    if (calculatedSalesBasePrice === null) return "—";
    const unitSuffix = quantityUnit === "PIECE" ? "Piece" : "Gram";
    return `AED ${calculatedSalesBasePrice.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} / ${unitSuffix}`;
  }, [calculatedSalesBasePrice, quantityUnit]);

  // INR Realization display
  const displayInrRealization = useMemo(() => {
    const val = parseFloat(totalSellingPriceINR);
    if (isNaN(val) || val <= 0) return "—";
    return `₹ ${val.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [totalSellingPriceINR]);

  // AED Equivalent display
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

  const quantityValidationError = useMemo(() => {
    if (!quantity || !productType) return null;
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return "Quantity must be greater than 0.";
    }
    if (quantityUnit === "PIECE" && !Number.isInteger(quantityNum)) {
      return "Quantity in PIECES must be a whole integer.";
    }
    if (quantityNum > effectiveAvailableQty) {
      const unitLabel = quantityUnit === "PIECE" ? "PCS" : "GMS";
      return `Only ${effectiveAvailableQty.toLocaleString()} ${unitLabel} are available. You cannot sell ${quantityNum.toLocaleString()} ${unitLabel}.`;
    }
    return null;
  }, [quantity, productType, quantityNum, quantityUnit, effectiveAvailableQty]);

  const isFormValid = useMemo(() => {
    if (!businessId || !saleDate || !productType || !buyerFirm.trim()) return false;
    if (isNaN(quantityNum) || quantityNum <= 0) return false;
    if (quantityUnit === "PIECE" && !Number.isInteger(quantityNum)) return false;
    if (quantityNum > effectiveAvailableQty) return false;
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
    effectiveAvailableQty,
    totalSellingPriceINR,
    realizedFxRate,
  ]);

  // Close dropdowns on outside click
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Fetch businesses
  useEffect(() => {
    let isMounted = true;
    async function loadBusinesses() {
      try {
        setLoadingBusinesses(true);
        const res = await fetch("/api/businesses");
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
          mapped.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });
          setBusinesses(mapped);
        }
      } catch (err) {
        console.error("Error loading businesses:", err);
      } finally {
        if (isMounted) setLoadingBusinesses(false);
      }
    }
    loadBusinesses();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch sale details
  useEffect(() => {
    let isMounted = true;
    async function loadSale() {
      try {
        setLoadingSale(true);
        const res = await fetch(`/api/sales/${saleId}`);
        const data = await res.json();
        if (!res.ok || !data.success || !data.sale) {
          throw new Error(data.message || "Failed to load sale details");
        }

        if (isMounted) {
          const s = data.sale;
          setSaleCode(s.saleCode);
          setBusinessId(s.businessId);
          setIsLocked(s.status === "CLEARED");
          setProductType(s.productType);
          setBuyerFirm(s.buyerFirm || "");
          const qtyVal = Number(s.quantity || s.quantityGms || 0);
          setOriginalQty(qtyVal);
          setQuantity(String(qtyVal));
          setQuantityUnit(s.quantityUnit || "GRAM");
          setOriginalBasePrice(s.basePricePerUnitAED ? Number(s.basePricePerUnitAED) : null);

          const d = s.saleDate ? new Date(s.saleDate) : new Date();
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          setSaleDate(`${y}-${m}-${day}`);

          const priceVal = s.totalSellingPriceINR || s.inrRealizationValue || 0;
          setTotalSellingPriceINR(String(priceVal));
          setRealizedFxRate(String(s.realizedFxRate || ""));

          // Fetch available products for this business
          fetch(`/api/sales/available-products?businessId=${encodeURIComponent(s.businessId)}`)
            .then((r) => r.json())
            .then((prodData) => {
              if (isMounted && prodData.success && Array.isArray(prodData.products)) {
                setAvailableProducts(prodData.products);
              }
            })
            .catch((err) => console.error("Error loading products:", err));
        }
      } catch (err: unknown) {
        console.error("Error loading sale:", err);
        const msg = err instanceof Error ? err.message : "Failed to load sale";
        setErrorMessage(msg);
      } finally {
        if (isMounted) setLoadingSale(false);
      }
    }
    loadSale();
    return () => {
      isMounted = false;
    };
  }, [saleId]);

  // Handle business change
  const handleBusinessSelect = async (bId: string) => {
    if (isLocked) return;
    setBusinessId(bId);
    setIsBusinessDropdownOpen(false);
    setProductType("");
    setQuantity("");
    setTotalSellingPriceINR("");
    setRealizedFxRate("");

    try {
      setLoadingProducts(true);
      const res = await fetch(`/api/sales/available-products?businessId=${encodeURIComponent(bId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setAvailableProducts(data.products);
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle product change
  const handleProductSelect = (prod: AvailableProductItem) => {
    if (isLocked) return;
    setProductType(prod.productType);
    setQuantityUnit(prod.quantityUnit);
    setQuantity("");
    setIsProductDropdownOpen(false);
  };

  // Handle submit update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setErrorMessage(null);
    setSuccessMessage(null);

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

    if (qtyNum > effectiveAvailableQty) {
      const unitLabel = quantityUnit === "PIECE" ? "PCS" : "GMS";
      setErrorMessage(`Only ${effectiveAvailableQty.toLocaleString()} ${unitLabel} are available. You cannot sell ${qtyNum.toLocaleString()} ${unitLabel}.`);
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

      const res = await fetch(`/api/sales/${saleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || result.error || "Failed to update sale.");
      }

      setSuccessMessage("Sale successfully updated.");
      setTimeout(() => {
        router.push("/sales");
      }, 700);
    } catch (err: unknown) {
      console.error("Sale update error:", err);
      const msg = err instanceof Error ? err.message : "Failed to update sale.";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSale) {
    return (
      <div className="w-full rounded-xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-500">
        Loading sale details...
      </div>
    );
  }

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
                Edit Sale Entry
              </h2>
              <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                {saleCode}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Modify liquidation quantity and realization parameters.
            </p>
          </div>
        </div>
      </div>

      {/* Lock banner if CLEARED */}
      {isLocked && (
        <div className="p-3 text-xs rounded-lg border border-amber-300 bg-amber-50 text-amber-900 font-semibold flex items-center justify-between">
          <span>🔒 This sale record has been CLEARED and finalized. Modifications are prohibited.</span>
        </div>
      )}

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
                  onClick={() => !isLocked && setIsBusinessDropdownOpen((prev) => !prev)}
                  disabled={isLocked || loadingBusinesses}
                  className="w-full h-10 px-3.5 rounded-lg border border-gray-300 bg-white text-left text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black flex items-center justify-between transition-colors disabled:opacity-50 disabled:bg-gray-50"
                >
                  <span className="truncate">
                    {selectedBusinessObj
                      ? `${selectedBusinessObj.name} (${selectedBusinessObj.code})`
                      : "Select business..."}
                  </span>
                  <ChevronDownIcon size={16} className="text-gray-500" />
                </button>

                {isBusinessDropdownOpen && (
                  <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto overscroll-contain py-1">
                    {businesses.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleBusinessSelect(b.id)}
                        className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-50 ${
                          b.id === businessId ? "bg-gray-50 font-bold" : "text-gray-700"
                        }`}
                      >
                        <div className="flex flex-col truncate">
                          <span className="truncate font-semibold">{b.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {b.code}
                          </span>
                        </div>
                        {b.id === businessId && <CheckIcon size={14} className="text-black shrink-0" />}
                      </button>
                    ))}
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
                disabled={isLocked}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Type */}
            <div className="space-y-1.5" ref={productDropdownRef}>
              <label className="block text-xs font-semibold text-gray-700">
                Product Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => !isLocked && setIsProductDropdownOpen((prev) => !prev)}
                  disabled={isLocked || !businessId || loadingProducts}
                  className="w-full h-10 px-3.5 rounded-lg border border-gray-300 bg-white text-left text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black flex items-center justify-between transition-colors disabled:opacity-50 disabled:bg-gray-50"
                >
                  <span className="truncate">{productType || "Select a product..."}</span>
                  <ChevronDownIcon size={16} className="text-gray-500" />
                </button>

                {isProductDropdownOpen && (
                  <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto overscroll-contain py-1">
                    {availableProducts.map((p) => (
                      <button
                        key={p.productType}
                        type="button"
                        onClick={() => handleProductSelect(p)}
                        className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-50 ${
                          p.productType === productType ? "bg-gray-50 font-bold" : "text-gray-700"
                        }`}
                      >
                        <div className="flex flex-col truncate">
                          <span className="truncate font-semibold">{p.productType}</span>
                          <span className="text-[10px] text-emerald-600 font-mono">
                            Available: {p.remainingQuantity.toLocaleString()} {p.quantityUnit === "PIECE" ? "PCS" : "GMS"}
                          </span>
                        </div>
                        {p.productType === productType && (
                          <CheckIcon size={14} className="text-black shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Buyer Firm */}
            <div>
              <Input
                label="Buyer / Clearing Firm"
                value={buyerFirm}
                onChange={(e) => setBuyerFirm(e.target.value)}
                disabled={isLocked}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Quantity ({quantityUnit === "PIECE" ? "PIECES" : "GRAMS"}){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step={quantityUnit === "PIECE" ? "1" : "0.001"}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setErrorMessage(null);
                  }}
                  disabled={isLocked}
                  className={`w-full h-10 px-3.5 rounded-lg border bg-white text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-50 ${
                    quantityValidationError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-black focus:ring-black/10"
                  }`}
                  required
                />
                <div className="h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-700 whitespace-nowrap select-none">
                  {quantityUnit === "PIECE" ? "PIECES" : "GRAMS"}
                </div>
              </div>
              {quantityValidationError && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  {quantityValidationError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Available Stock
              </label>
              <div className="h-10 px-3.5 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs cursor-default select-none">
                <span className="text-neutral-500 font-medium">Remaining:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {productType
                    ? `${effectiveAvailableQty.toLocaleString()} ${
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
                  value={totalSellingPriceINR}
                  onChange={(e) => {
                    setTotalSellingPriceINR(e.target.value);
                    setErrorMessage(null);
                  }}
                  disabled={isLocked}
                  className="w-full h-10 pl-8 pr-3.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors disabled:bg-gray-50"
                  required
                />
              </div>
            </div>

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
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Realized FX Rate (₹ / AED) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={realizedFxRate}
                onChange={(e) => {
                  setRealizedFxRate(e.target.value);
                  setErrorMessage(null);
                }}
                disabled={isLocked}
                className="w-full h-10 px-3.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors disabled:bg-gray-50"
                required
              />
            </div>

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
              Back to Sales
            </Button>
          </Link>
          {!isLocked && (
            <Button type="submit" disabled={submitting || !isFormValid}>
              {submitting ? "Updating..." : "Update Sale"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PurchaseIcon, ChevronDownIcon, CheckIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PurchaseRecord } from "@/types/purchase";

interface BusinessOption {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface NewPurchaseEntryProps {
  onRecordPurchase?: (purchase: PurchaseRecord) => void;
}

function inferUnitFromProduct(name: string): "GRAM" | "PIECE" | null {
  const lower = name.toLowerCase();
  if (
    lower.includes("gold") ||
    lower.includes("silver") ||
    lower.includes("bullion") ||
    lower.includes("grain") ||
    lower.includes("kilobar") ||
    lower.includes("metal")
  ) {
    return "GRAM";
  }
  if (
    lower.includes("mobile") ||
    lower.includes("phone") ||
    lower.includes("iphone") ||
    lower.includes("laptop") ||
    lower.includes("macbook") ||
    lower.includes("ipad") ||
    lower.includes("piece") ||
    lower.includes("unit") ||
    lower.includes("device") ||
    lower.includes("electronics")
  ) {
    return "PIECE";
  }
  return null;
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function NewPurchaseEntry({ onRecordPurchase }: NewPurchaseEntryProps) {
  const router = useRouter();

  // Businesses state
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form state
  const [businessId, setBusinessId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(getTodayString());
  const [productType, setProductType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState<"GRAM" | "PIECE">("GRAM");
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState("");

  // Live client-side calculation for display: Base Amount = Total Purchase Amount ÷ Quantity
  const calculatedBaseAmount = React.useMemo(() => {
    const q = parseFloat(quantity);
    const t = parseFloat(totalPurchaseAmount);
    if (isNaN(q) || q <= 0 || isNaN(t) || t <= 0) return null;
    return t / q;
  }, [quantity, totalPurchaseAmount]);

  const displayBaseAmount = React.useMemo(() => {
    if (calculatedBaseAmount === null) return "—";
    const unitSuffix = quantityUnit === "PIECE" ? "Piece" : "Gram";
    return `AED ${calculatedBaseAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })} / ${unitSuffix}`;
  }, [calculatedBaseAmount, quantityUnit]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Load real businesses from database and sort newest-first by createdAt
  useEffect(() => {
    let isMounted = true;
    async function loadBusinesses() {
      try {
        setLoadingBusinesses(true);
        const res = await fetch("/api/businesses");
        if (!res.ok) {
          throw new Error(`Failed to load businesses (${res.status})`);
        }
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

          // Strictly sort NEWEST -> OLDEST using createdAt timestamp
          mapped.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            const validTimeA = isNaN(timeA) ? 0 : timeA;
            const validTimeB = isNaN(timeB) ? 0 : timeB;
            return validTimeB - validTimeA;
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

  // Safe unit switcher
  const handleUnitChange = (newUnit: "GRAM" | "PIECE") => {
    if (newUnit === quantityUnit) return;
    setQuantityUnit(newUnit);
    setErrorMessage(null);

    // If switching to PIECE, clear quantity if it's not a valid positive integer
    if (newUnit === "PIECE" && quantity) {
      const num = Number(quantity);
      if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
        setQuantity("");
      }
    }
  };

  // Handle product type text change and automatic unit detection
  const handleProductTypeChange = (value: string) => {
    setProductType(value);
    setErrorMessage(null);
    const inferred = inferUnitFromProduct(value);
    if (inferred) {
      handleUnitChange(inferred);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Frontend validations
    if (!businessId) {
      setErrorMessage("Please select an Assigned Business Entity.");
      return;
    }

    if (!purchaseDate) {
      setErrorMessage("Please enter a valid Purchase Date.");
      return;
    }

    const trimmedProduct = productType.trim();
    if (!trimmedProduct) {
      setErrorMessage("Please enter a Product Type.");
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMessage("Quantity must be a positive number greater than 0.");
      return;
    }

    if (quantityUnit === "PIECE" && !Number.isInteger(qtyNum)) {
      setErrorMessage("Quantity in PIECES must be a whole number (integer).");
      return;
    }

    const totalNum = parseFloat(totalPurchaseAmount);
    if (isNaN(totalNum) || totalNum <= 0) {
      setErrorMessage("Total Purchase Amount must be a positive number greater than 0.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        businessId,
        purchaseDate,
        productType: trimmedProduct,
        quantity: qtyNum,
        quantityUnit,
        totalPurchaseAmount: totalNum,
      };

      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || "Failed to record purchase.");
      }

      setSuccessMessage(`Purchase ${result.purchase.purchaseCode} created successfully!`);

      if (onRecordPurchase) {
        const created = result.purchase;
        const effectiveBase = created.basePricePerUnitAED !== null && created.basePricePerUnitAED !== undefined
          ? Number(created.basePricePerUnitAED)
          : created.basePricePerGm !== null && created.basePricePerGm !== undefined
          ? Number(created.basePricePerGm)
          : null;
        const effectiveTotal = created.baseAcquisitionValue !== null && created.baseAcquisitionValue !== undefined
          ? Number(created.baseAcquisitionValue)
          : null;

        onRecordPurchase({
          id: created.purchaseCode,
          rawId: created.id,
          businessId: created.businessId,
          business: created.business?.name || "Business",
          businessCode: created.business?.code,
          businessEntities: created.business?.code || "",
          date: new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(created.purchaseDate)),
          product: created.productType,
          locationVault: null,
          quantity: Number(created.quantity),
          quantityUnit: created.quantityUnit,
          quantityGms: created.quantityGms ? Number(created.quantityGms) : null,
          baseAmount: effectiveBase,
          basePriceAED: effectiveBase,
          basePricePerUnitAED: effectiveBase,
          totalPurchaseAmount: effectiveTotal,
          baseAcquisitionValue: effectiveTotal,
          freightAED: created.transitInsuranceFreight ? Number(created.transitInsuranceFreight) : null,
          labourAED: created.vaultHandlingLabour ? Number(created.vaultHandlingLabour) : null,
          customsAED: created.customsSecurity ? Number(created.customsSecurity) : null,
          totalLandedAED: created.totalLandedCost ? Number(created.totalLandedCost) : null,
          status: created.status || "DRAFT",
          selected: false,
        });
      }

      router.push("/purchase");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  const selectedBusiness = businesses.find((b) => b.id === businessId);

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
              Record physical acquisition by assigning entity, date, product, and quantity.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-800">
          <span className="font-semibold">Error:</span> {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-800">
          <span className="font-semibold">Success:</span> {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* 1. Assigned Business Entity */}
          <div className="space-y-1 sm:col-span-2">
            <label
              id="assigned-business-entity-label"
              className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              ASSIGNED BUSINESS ENTITY
            </label>
            <div className="relative w-full" ref={dropdownRef}>
              <button
                id="assigned-business-entity-trigger"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                aria-labelledby="assigned-business-entity-label"
                onClick={() => {
                  if (!loadingBusinesses && !submitting && businesses.length > 0) {
                    setIsDropdownOpen((prev) => !prev);
                  }
                }}
                disabled={loadingBusinesses || submitting || businesses.length === 0}
                className={`w-full flex items-center justify-between rounded-md border bg-white px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${
                  isDropdownOpen
                    ? "border-gray-900 ring-1 ring-gray-900"
                    : "border-gray-200 hover:border-gray-300"
                } ${
                  loadingBusinesses || submitting || businesses.length === 0
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                    : businessId
                    ? "text-gray-900"
                    : "text-gray-700"
                }`}
              >
                <span className="truncate">
                  {loadingBusinesses
                    ? "Loading businesses..."
                    : businesses.length === 0
                    ? "No businesses available"
                    : selectedBusiness
                    ? `${selectedBusiness.name} (${selectedBusiness.code})`
                    : "Select Business"}
                </span>
                <span
                  className={`text-gray-500 shrink-0 ml-2 transition-transform duration-150 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDownIcon size={13} />
                </span>
              </button>

              {isDropdownOpen && businesses.length > 0 && (
                <ul
                  role="listbox"
                  aria-labelledby="assigned-business-entity-label"
                  className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg focus:outline-none"
                >
                  {businesses.map((b) => {
                    const isSelected = b.id === businessId;
                    return (
                      <li
                        key={b.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setBusinessId(b.id);
                          setErrorMessage(null);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-gray-100 font-semibold text-gray-950"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="truncate">
                          {b.name} ({b.code})
                        </span>
                        {isSelected && (
                          <span className="text-gray-900 shrink-0 ml-2">
                            <CheckIcon size={13} />
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* 2. Purchase Date */}
          <div className="space-y-1">
            <Input
              label="PURCHASE DATE"
              type="date"
              value={purchaseDate}
              onChange={(e) => {
                setPurchaseDate(e.target.value);
                setErrorMessage(null);
              }}
              disabled={submitting}
              required
            />
          </div>

          {/* 3. Product Type */}
          <div className="space-y-1">
            <Input
              label="PRODUCT TYPE"
              placeholder="Enter product type"
              value={productType}
              onChange={(e) => handleProductTypeChange(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {/* 4. Quantity & Unit Selection */}
          <div className="space-y-1 sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">
              QUANTITY ({quantityUnit === "GRAM" ? "GRAMS" : "PIECES"})
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min={quantityUnit === "GRAM" ? "0.001" : "1"}
                  step={quantityUnit === "GRAM" ? "0.001" : "1"}
                  placeholder={quantityUnit === "GRAM" ? "e.g. 6200 or 6200.500" : "e.g. 25"}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setErrorMessage(null);
                  }}
                  disabled={submitting}
                  className="w-full h-10 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium transition-colors"
                  required
                />
              </div>

              {/* Unit Toggle Buttons */}
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 h-10 shrink-0">
                <button
                  type="button"
                  onClick={() => handleUnitChange("GRAM")}
                  disabled={submitting}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    quantityUnit === "GRAM"
                      ? "bg-white text-gray-950 shadow-2xs border border-gray-200/80"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  GRAMS
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitChange("PIECE")}
                  disabled={submitting}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    quantityUnit === "PIECE"
                      ? "bg-white text-gray-950 shadow-2xs border border-gray-200/80"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  PIECES
                </button>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {quantityUnit === "GRAM"
                ? "Physical weight for precious metals and grain (supports decimal grams, e.g. 6200.500)."
                : "Whole unit count for physical items and hardware (e.g. 25)."}
            </p>
          </div>

          {/* 5. Total Purchase Amount (Editable) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">
              TOTAL PURCHASE AMOUNT (AED)
            </label>
            <input
              type="number"
              min="0.01"
              step="any"
              placeholder="e.g. 195315.75"
              value={totalPurchaseAmount}
              onChange={(e) => {
                setTotalPurchaseAmount(e.target.value);
                setErrorMessage(null);
              }}
              disabled={submitting}
              className="w-full h-10 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium transition-colors"
              required
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Total monetary value in AED paid for this acquisition.
            </p>
          </div>

          {/* 6. Base Amount (Read-Only, Auto-Calculated) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">
                BASE AMOUNT ({quantityUnit === "GRAM" ? "AED / GRAM" : "AED / PIECE"})
              </label>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Read-only
              </span>
            </div>
            <div className="w-full h-10 px-3 bg-gray-50/80 border border-gray-200 rounded-lg flex items-center justify-between text-gray-950 font-bold text-xs sm:text-sm select-none">
              <span>{displayBaseAmount}</span>
              <span className="text-[10px] text-gray-400 font-medium">
                Auto-calculated
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Automatically calculated as Total Purchase Amount ÷ Quantity.
            </p>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href="/purchase"
            className="inline-flex items-center justify-center font-semibold transition-colors bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 h-9 px-6 text-xs rounded-md shadow-xs"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || loadingBusinesses}
            className="px-6 text-xs font-bold"
          >
            {submitting ? "Recording..." : "Record Purchase"}
          </Button>
        </div>
      </form>
    </div>
  );
}

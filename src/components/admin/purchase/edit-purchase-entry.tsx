"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PurchaseIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface BusinessOption {
  id: string;
  name: string;
  code: string;
}

export interface EditPurchaseEntryProps {
  purchaseId: string;
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

function formatDateForInput(dateVal: string | Date | undefined): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function EditPurchaseEntry({ purchaseId }: EditPurchaseEntryProps) {
  const router = useRouter();

  // Businesses state
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  // Existing record state
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [purchaseCode, setPurchaseCode] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  // Form state
  const [businessId, setBusinessId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [productType, setProductType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState<"GRAM" | "PIECE">("GRAM");
  const [baseAmount, setBaseAmount] = useState("");

  // Live client-side calculation for display
  const calculatedTotal = React.useMemo(() => {
    const q = parseFloat(quantity);
    const b = parseFloat(baseAmount);
    if (isNaN(q) || q <= 0 || isNaN(b) || b <= 0) return null;
    return q * b;
  }, [quantity, baseAmount]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load real businesses from database
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
          setBusinesses(
            data.businesses.map((b: { id: string; name: string; code: string }) => ({
              id: b.id,
              name: b.name,
              code: b.code,
            }))
          );
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

  // Load existing purchase record
  useEffect(() => {
    let isMounted = true;
    async function loadPurchase() {
      try {
        setLoadingRecord(true);
        setErrorMessage(null);
        const res = await fetch(`/api/purchases/${purchaseId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || data.error || "Failed to load purchase details");
        }

        const p = data.purchase;
        if (isMounted && p) {
          setPurchaseCode(p.purchaseCode || "");
          if (p.status === "CLEARED") {
            setIsLocked(true);
          }
          setBusinessId(p.businessId || "");
          setPurchaseDate(formatDateForInput(p.purchaseDate));
          setProductType(p.productType || "");
          setQuantity(p.quantity !== undefined && p.quantity !== null ? String(p.quantity) : "");
          setQuantityUnit(p.quantityUnit === "PIECE" ? "PIECE" : "GRAM");
          const baseVal =
            p.basePricePerUnitAED !== null && p.basePricePerUnitAED !== undefined
              ? String(p.basePricePerUnitAED)
              : p.basePricePerGm !== null && p.basePricePerGm !== undefined
              ? String(p.basePricePerGm)
              : "";
          setBaseAmount(baseVal);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to load purchase details");
        }
      } finally {
        if (isMounted) setLoadingRecord(false);
      }
    }

    if (purchaseId) {
      loadPurchase();
    }

    return () => {
      isMounted = false;
    };
  }, [purchaseId]);

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
    if (isLocked) return;

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

    const baseNum = parseFloat(baseAmount);
    if (isNaN(baseNum) || baseNum <= 0) {
      setErrorMessage("Base Amount must be a positive number greater than 0.");
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
        baseAmount: baseNum,
      };

      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || "Failed to update purchase.");
      }

      setSuccessMessage("Purchase updated successfully! Returning to purchase list...");

      setTimeout(() => {
        router.push("/purchase");
        router.refresh();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  const businessOptions = [
    { value: "", label: loadingBusinesses ? "Loading businesses..." : "Select Business" },
    ...businesses.map((b) => ({
      value: b.id,
      label: `${b.name} (${b.code})`,
    })),
  ];

  if (loadingRecord) {
    return (
      <div className="w-full rounded-xl border border-gray-200/90 bg-white p-12 text-center text-xs text-gray-500 shadow-2xs">
        Loading purchase details...
      </div>
    );
  }

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
              <span>Edit Purchase Entry</span>
              {purchaseCode && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  {purchaseCode}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Update physical acquisition details: entity, date, product, and quantity.
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
            <Select
              label="ASSIGNED BUSINESS ENTITY"
              value={businessId}
              onChange={(e) => {
                setBusinessId(e.target.value);
                setErrorMessage(null);
              }}
              options={businessOptions}
              disabled={loadingBusinesses || submitting || isLocked}
            />
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
              disabled={submitting || isLocked}
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
              disabled={submitting || isLocked}
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
                  disabled={submitting || isLocked}
                  className="w-full h-10 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                  required
                />
              </div>

              {/* Unit Toggle Buttons */}
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 h-10 shrink-0">
                <button
                  type="button"
                  onClick={() => handleUnitChange("GRAM")}
                  disabled={submitting || isLocked}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    quantityUnit === "GRAM"
                      ? "bg-white text-gray-950 shadow-2xs border border-gray-200/80"
                      : "text-gray-500 hover:text-gray-800"
                  } disabled:cursor-not-allowed`}
                >
                  GRAMS
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitChange("PIECE")}
                  disabled={submitting || isLocked}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    quantityUnit === "PIECE"
                      ? "bg-white text-gray-950 shadow-2xs border border-gray-200/80"
                      : "text-gray-500 hover:text-gray-800"
                  } disabled:cursor-not-allowed`}
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

          {/* 5. Base Amount */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">
              BASE AMOUNT ({quantityUnit === "GRAM" ? "AED / GRAM" : "AED / PIECE"})
            </label>
            <input
              type="number"
              min="0.0001"
              step="any"
              placeholder={quantityUnit === "GRAM" ? "e.g. 31.50" : "e.g. 250.00"}
              value={baseAmount}
              onChange={(e) => {
                setBaseAmount(e.target.value);
                setErrorMessage(null);
              }}
              disabled={submitting || isLocked}
              className="w-full h-10 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium transition-colors disabled:bg-gray-50 disabled:text-gray-500"
              required
            />
            <p className="text-[11px] text-gray-500 mt-1">
              {quantityUnit === "GRAM"
                ? "Price in AED per physical gram."
                : "Price in AED per individual piece."}
            </p>
          </div>

          {/* 6. Total Purchase Amount (Read-Only) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">
                TOTAL PURCHASE AMOUNT
              </label>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Read-only
              </span>
            </div>
            <div className="w-full h-10 px-3 bg-gray-50/80 border border-gray-200 rounded-lg flex items-center justify-between text-gray-950 font-bold text-xs sm:text-sm select-none">
              <span>
                {calculatedTotal !== null
                  ? `AED ${calculatedTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "—"}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                Auto-calculated
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Automatically calculated as Quantity × Base Amount.
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
          {!isLocked && (
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || loadingBusinesses}
              className="px-6 text-xs font-bold"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

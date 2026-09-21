"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { XIcon, PlusIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BusinessEntity } from "@/types/business";

export interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBusiness: (business: BusinessEntity) => void;
}

export function CreateBusinessModal({
  isOpen,
  onClose,
  onCreateBusiness,
}: CreateBusinessModalProps) {
  const shouldReduceMotion = useReducedMotion();

  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [code, setCode] = useState("");
  const [productType, setProductType] = useState("Gold Bullion");
  const [investment, setInvestment] = useState("100000");
  const [partnerA, setPartnerA] = useState("60");
  const [partnerB, setPartnerB] = useState("40");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newBusiness: BusinessEntity = {
      id: `b-${Date.now()}`,
      name: name.trim(),
      code: code.trim() || `B0${Math.floor(Math.random() * 90) + 10}-DXB-BOM`,
      subtitle:
        subtitle.trim() ||
        `${productType} Trading & Liquidation • ${code || "DXB-BOM"}`,
      partners: [
        { name: "Admin A", sharePercentage: Number(partnerA) || 60 },
        { name: "Partner B", sharePercentage: Number(partnerB) || 40 },
      ],
      partnersSummary: `Admin A (${partnerA || 60}%) + Partner B (${partnerB || 40}%)`,
      investmentAED: Number(investment) || 100000,
      purchaseCostAED: Math.round((Number(investment) || 100000) * 0.74),
      salesIndiaAED: Math.round((Number(investment) || 100000) * 0.94),
      expensesAED: 5000,
      netProfitAED: Math.round((Number(investment) || 100000) * 0.15),
      marginPercentage: 15.5,
      status: "ACTIVE",
      createdAt: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      productType,
      locationRoute: "Dubai (DXB) → Mumbai (BOM)",
    };

    onCreateBusiness(newBusiness);
    onClose();
    setName("");
    setSubtitle("");
    setCode("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{
              duration: shouldReduceMotion ? 0.1 : 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-2xl z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-business-title"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <h2
                  id="create-business-title"
                  className="text-base font-bold text-gray-950"
                >
                  Create New Business
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set up a new bullion trading partnership and workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close dialog"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label="Business Name"
                  placeholder="e.g. Business 03"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Business Code"
                  placeholder="e.g. B03-DXB-BOM"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <Input
                label="Description / Subtitle"
                placeholder="e.g. Dubai Bullion & Direct Zaveri Liquidation"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Select
                  label="Primary Product"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  options={[
                    { value: "Gold Bullion", label: "Gold Bullion" },
                    { value: "Granulated Silver", label: "Granulated Silver" },
                    { value: "Platinum", label: "Platinum" },
                  ]}
                />
                <Input
                  label="Initial Investment (AED)"
                  type="number"
                  placeholder="100000"
                  value={investment}
                  onChange={(e) => setInvestment(e.target.value)}
                />
              </div>

              {/* Partner Splits */}
              <div className="rounded-lg bg-gray-50 p-3.5 border border-gray-200/80 space-y-2.5">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  Partner Equity Allocation
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Admin A (%)"
                    type="number"
                    value={partnerA}
                    onChange={(e) => setPartnerA(e.target.value)}
                  />
                  <Input
                    label="Partner B (%)"
                    type="number"
                    value={partnerB}
                    onChange={(e) => setPartnerB(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="px-4 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<PlusIcon size={14} />}
                  className="px-5 text-xs font-semibold"
                >
                  Create Business
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import React from "react";
import Link from "next/link";
import { FadeUp } from "@/components/ui/motion";
import { EditSaleEntry } from "@/components/admin/sales";

export const metadata = {
  title: "Edit Sale - Ivora",
  description: "Update India physical liquidation details and realization.",
};

interface EditSalePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSalePage({ params }: EditSalePageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6 pb-14 max-w-5xl">
      {/* Top Back Navigation Link */}
      <FadeUp delay={0.05}>
        <div className="flex items-center gap-2">
          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span>← Back to Sales</span>
          </Link>
        </div>
      </FadeUp>

      {/* Main Edit Sale Form */}
      <FadeUp delay={0.1}>
        <EditSaleEntry saleId={id} />
      </FadeUp>
    </div>
  );
}

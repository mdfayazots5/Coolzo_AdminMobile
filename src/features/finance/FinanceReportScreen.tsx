/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { paymentRepository } from "@/core/network/payment-repository"

const titles: Record<string, string> = {
  revenue: "Revenue Analytics",
  "collection-efficiency": "Collection Efficiency",
  "financial-summary": "Financial Summary",
  "discount-coupon-usage": "Discount & Coupon Usage",
}

export default function FinanceReportScreen() {
  const navigate = useNavigate()
  const { reportType = "financial-summary" } = useParams()
  const [data, setData] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const loadReport = async () => {
      try {
        if (reportType === "revenue") {
          setData(await paymentRepository.getRevenueTrend("monthly"))
        } else if (reportType === "collection-efficiency") {
          setData(await paymentRepository.getCollectionEfficiency())
        } else if (reportType === "discount-coupon-usage") {
          setData(await paymentRepository.getDiscountUsage())
        } else {
          setData(await paymentRepository.getFinancialSummary())
        }
      } catch (error) {
        console.error(error)
        toast.error("Unable to load finance report")
      } finally {
        setIsLoading(false)
      }
    }

    void loadReport()
  }, [reportType])

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="rounded-xl p-2 transition-colors hover:bg-brand-navy/5">
          <ChevronLeft size={20} className="text-brand-navy" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{titles[reportType] ?? "Finance Report"}</h1>
          <p className="text-sm text-brand-muted">Phase 15 finance reporting output</p>
        </div>
      </div>

      <AdminCard className="p-8">
        <SectionHeader title="Report Data" />
        <pre className="mt-6 overflow-x-auto rounded-3xl bg-brand-navy/5 p-6 text-sm text-brand-navy">{JSON.stringify(data, null, 2)}</pre>
      </AdminCard>
    </div>
  )
}

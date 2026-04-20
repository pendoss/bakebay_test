'use client'

import {useCallback, useEffect, useState} from 'react'

export type StockLineStatus = 'available' | 'low' | 'missing'

export interface StockLineDTO {
    key: string
    name: string
    unit: string
    required: number
    available: number
    status: StockLineStatus
}

export interface StockReportDTO {
    lines: StockLineDTO[]
    overall: StockLineStatus
}

export function useSellerOrderStockReport(sellerOrderId: number | null) {
    const [report, setReport] = useState<StockReportDTO | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        if (sellerOrderId === null) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/seller-orders/${sellerOrderId}/stock-report`, {credentials: 'include'})
            if (!res.ok) {
                setReport(null)
                setError(`status ${res.status}`)
                return
            }
            const data = (await res.json()) as StockReportDTO
            setReport(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'failed')
        } finally {
            setLoading(false)
        }
    }, [sellerOrderId])

    useEffect(() => {
        void load()
    }, [load])

    return {report, loading, error, reload: load}
}

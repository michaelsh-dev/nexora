import { useEffect, useMemo, useState } from 'react'
import {
    BarChart3,
    Calendar,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Wallet,
    FileText,
} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/api'

function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(value) || 0)
}

function formatDate(date) {
    if (!date) return '-'

    return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

function ProfitLossReport() {
    const [salesInvoices, setSalesInvoices] = useState([])
    const [purchaseInvoices, setPurchaseInvoices] = useState([])
    const [expenses, setExpenses] = useState([])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const fetchData = async () => {
        try {
            setLoading(true)
            setError('')

            const [
                salesResponse,
                purchaseResponse,
                expensesResponse,
            ] = await Promise.all([
                api.get('/sales-invoices'),
                api.get('/purchase-invoices'),
                api.get('/expenses'),
            ])

            const salesData = Array.isArray(salesResponse.data)
                ? salesResponse.data
                : salesResponse.data.data || []

            const purchaseData = Array.isArray(purchaseResponse.data)
                ? purchaseResponse.data
                : purchaseResponse.data.data || []

            const expensesData = Array.isArray(expensesResponse.data)
                ? expensesResponse.data
                : expensesResponse.data.data || []

            setSalesInvoices(salesData)
            setPurchaseInvoices(purchaseData)
            setExpenses(expensesData)
        } catch (err) {
            console.error(err)

            setError(
                err.response?.data?.message ||
                'Gagal mengambil data laporan laba rugi.'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    /*
     * Filter Faktur Penjualan
     */
    const filteredSales = useMemo(() => {
        return salesInvoices.filter((invoice) => {
            const status = String(
                invoice.status || ''
            ).toLowerCase()

            if (status === 'draft' || status === 'cancelled') {
                return false
            }

            const invoiceDate = invoice.date
                ? String(invoice.date).substring(0, 10)
                : ''

            if (!invoiceDate) {
                return false
            }

            if (startDate && invoiceDate < startDate) {
                return false
            }

            if (endDate && invoiceDate > endDate) {
                return false
            }

            return true
        })
    }, [salesInvoices, startDate, endDate])

    /*
     * Filter Faktur Pembelian
     */
    const filteredPurchases = useMemo(() => {
        return purchaseInvoices.filter((invoice) => {
            const status = String(
                invoice.status || ''
            ).toLowerCase()

            if (
                status === 'draft' ||
                status === 'cancelled'
            ) {
                return false
            }

            const invoiceDate = invoice.date
                ? String(invoice.date).substring(0, 10)
                : ''

            if (!invoiceDate) {
                return false
            }

            if (startDate && invoiceDate < startDate) {
                return false
            }

            if (endDate && invoiceDate > endDate) {
                return false
            }

            return true
        })
    }, [purchaseInvoices, startDate, endDate])

    /*
     * Filter Pengeluaran
     */
    const filteredExpenses = useMemo(() => {
        return expenses.filter((expense) => {
            const expenseDate = expense.date
                ? String(expense.date).substring(0, 10)
                : ''

            if (!expenseDate) {
                return false
            }

            if (startDate && expenseDate < startDate) {
                return false
            }

            if (endDate && expenseDate > endDate) {
                return false
            }

            return true
        })
    }, [expenses, startDate, endDate])

    /*
     * Perhitungan Laba Rugi
     */
    const summary = useMemo(() => {
        const totalSales = filteredSales.reduce(
            (total, invoice) =>
                total + Number(invoice.total || 0),
            0
        )

        const totalPurchases = filteredPurchases.reduce(
            (total, invoice) =>
                total + Number(invoice.total || 0),
            0
        )

        const totalExpenses = filteredExpenses.reduce(
            (total, expense) =>
                total + Number(expense.amount || 0),
            0
        )

        const netProfit =
            totalSales -
            totalPurchases -
            totalExpenses

        return {
            totalSales,
            totalPurchases,
            totalExpenses,
            netProfit,
        }
    }, [
        filteredSales,
        filteredPurchases,
        filteredExpenses,
    ])

    /*
     * Reset Filter
     */
    const resetFilter = () => {
        setStartDate('')
        setEndDate('')
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50 p-8">

                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>
                        <div className="mb-2 flex items-center gap-3">

                            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                                <BarChart3 size={24} />
                            </div>

                            <h1 className="text-2xl font-bold text-slate-800">
                                Laba Rugi
                            </h1>

                        </div>

                        <p className="text-sm text-slate-500">
                            Ringkasan pendapatan, pembelian, dan pengeluaran berdasarkan periode.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchData}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            size={17}
                            className={
                                loading
                                    ? 'animate-spin'
                                    : ''
                            }
                        />

                        Refresh
                    </button>

                </div>

                {/* Filter */}
                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="mb-4 flex items-center gap-2">

                        <Calendar
                            size={18}
                            className="text-blue-600"
                        />

                        <h2 className="font-semibold text-slate-800">
                            Filter Periode
                        </h2>

                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Dari Tanggal
                            </label>

                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) =>
                                    setStartDate(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Sampai Tanggal
                            </label>

                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) =>
                                    setEndDate(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="flex items-end">

                            <button
                                type="button"
                                onClick={resetFilter}
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Reset Filter
                            </button>

                        </div>

                    </div>

                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                    {/* Penjualan */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                        <div className="mb-4 flex items-center justify-between">

                            <div>
                                <p className="text-sm text-slate-500">
                                    Pendapatan Penjualan
                                </p>

                                <h3 className="mt-1 text-xl font-bold text-slate-800">
                                    {formatRupiah(
                                        summary.totalSales
                                    )}
                                </h3>
                            </div>

                            <div className="rounded-lg bg-green-100 p-3 text-green-600">
                                <TrendingUp size={22} />
                            </div>

                        </div>

                        <p className="text-xs text-slate-400">
                            {filteredSales.length} faktur penjualan
                        </p>

                    </div>

                    {/* Pembelian */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                        <div className="mb-4 flex items-center justify-between">

                            <div>
                                <p className="text-sm text-slate-500">
                                    Pembelian
                                </p>

                                <h3 className="mt-1 text-xl font-bold text-slate-800">
                                    {formatRupiah(
                                        summary.totalPurchases
                                    )}
                                </h3>
                            </div>

                            <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
                                <TrendingDown size={22} />
                            </div>

                        </div>

                        <p className="text-xs text-slate-400">
                            {filteredPurchases.length} faktur pembelian
                        </p>

                    </div>

                    {/* Pengeluaran */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                        <div className="mb-4 flex items-center justify-between">

                            <div>
                                <p className="text-sm text-slate-500">
                                    Pengeluaran
                                </p>

                                <h3 className="mt-1 text-xl font-bold text-slate-800">
                                    {formatRupiah(
                                        summary.totalExpenses
                                    )}
                                </h3>
                            </div>

                            <div className="rounded-lg bg-red-100 p-3 text-red-600">
                                <Wallet size={22} />
                            </div>

                        </div>

                        <p className="text-xs text-slate-400">
                            {filteredExpenses.length} transaksi pengeluaran
                        </p>

                    </div>

                    {/* Laba / Rugi */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                        <div className="mb-4 flex items-center justify-between">

                            <div>
                                <p className="text-sm text-slate-500">
                                    Laba / Rugi Bersih
                                </p>

                                <h3
                                    className={`mt-1 text-xl font-bold ${
                                        summary.netProfit >= 0
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                    }`}
                                >
                                    {formatRupiah(
                                        summary.netProfit
                                    )}
                                </h3>
                            </div>

                            <div
                                className={`rounded-lg p-3 ${
                                    summary.netProfit >= 0
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-red-100 text-red-600'
                                }`}
                            >
                                {summary.netProfit >= 0 ? (
                                    <TrendingUp size={22} />
                                ) : (
                                    <TrendingDown size={22} />
                                )}
                            </div>

                        </div>

                        <p className="text-xs text-slate-400">
                            Penjualan - Pembelian - Pengeluaran
                        </p>

                    </div>

                </div>

                {/* Ringkasan Laba Rugi */}
                <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 px-6 py-5">

                        <h2 className="font-semibold text-slate-800">
                            Ringkasan Laba Rugi
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Perhitungan berdasarkan periode yang dipilih.
                        </p>

                    </div>

                    <div className="p-6">

                        <div className="space-y-4">

                            {/* Pendapatan */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                                <span className="text-sm text-slate-600">
                                    Pendapatan Penjualan
                                </span>

                                <span className="font-semibold text-green-600">
                                    {formatRupiah(
                                        summary.totalSales
                                    )}
                                </span>

                            </div>

                            {/* Pembelian */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                                <span className="text-sm text-slate-600">
                                    (-) Pembelian
                                </span>

                                <span className="font-semibold text-red-600">
                                    {formatRupiah(
                                        summary.totalPurchases
                                    )}
                                </span>

                            </div>

                            {/* Pengeluaran */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                                <span className="text-sm text-slate-600">
                                    (-) Pengeluaran Operasional
                                </span>

                                <span className="font-semibold text-red-600">
                                    {formatRupiah(
                                        summary.totalExpenses
                                    )}
                                </span>

                            </div>

                            {/* Laba */}
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-4">

                                <span className="font-semibold text-slate-800">
                                    Laba / Rugi Bersih
                                </span>

                                <span
                                    className={`text-lg font-bold ${
                                        summary.netProfit >= 0
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                    }`}
                                >
                                    {formatRupiah(
                                        summary.netProfit
                                    )}
                                </span>

                            </div>

                        </div>

                    </div>

                </div>

                {/* Detail Penjualan */}
                <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 px-6 py-5">

                        <div className="flex items-center gap-2">
                            <TrendingUp
                                size={19}
                                className="text-green-600"
                            />

                            <h2 className="font-semibold text-slate-800">
                                Detail Pendapatan Penjualan
                            </h2>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                            Faktur penjualan yang masuk dalam laporan.
                        </p>

                    </div>

                    {filteredSales.length === 0 ? (
                        <div className="px-6 py-12 text-center">

                            <FileText
                                size={36}
                                className="mx-auto mb-3 text-slate-300"
                            />

                            <p className="font-medium text-slate-600">
                                Tidak ada data penjualan
                            </p>

                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[700px] text-left text-sm">

                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>

                                        <th className="px-6 py-4 font-semibold">
                                            No. Faktur
                                        </th>

                                        <th className="px-6 py-4 font-semibold">
                                            Tanggal
                                        </th>

                                        <th className="px-6 py-4 font-semibold">
                                            Pelanggan
                                        </th>

                                        <th className="px-6 py-4 text-right font-semibold">
                                            Total
                                        </th>

                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {filteredSales.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            className="transition hover:bg-slate-50"
                                        >

                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                {invoice.number || '-'}
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {formatDate(
                                                    invoice.date
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {invoice.customer?.name ||
                                                    invoice.customer_name ||
                                                    '-'}
                                            </td>

                                            <td className="px-6 py-4 text-right font-semibold text-green-600">
                                                {formatRupiah(
                                                    invoice.total
                                                )}
                                            </td>

                                        </tr>
                                    ))}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

                {/* Detail Pembelian */}
                <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 px-6 py-5">

                        <div className="flex items-center gap-2">
                            <TrendingDown
                                size={19}
                                className="text-orange-600"
                            />

                            <h2 className="font-semibold text-slate-800">
                                Detail Pembelian
                            </h2>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                            Faktur pembelian yang masuk dalam laporan.
                        </p>

                    </div>

                    {filteredPurchases.length === 0 ? (
                        <div className="px-6 py-12 text-center">

                            <FileText
                                size={36}
                                className="mx-auto mb-3 text-slate-300"
                            />

                            <p className="font-medium text-slate-600">
                                Tidak ada data pembelian
                            </p>

                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[700px] text-left text-sm">

                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>

                                        <th className="px-6 py-4 font-semibold">
                                            No. Faktur
                                        </th>

                                        <th className="px-6 py-4 font-semibold">
                                            Tanggal
                                        </th>

                                        <th className="px-6 py-4 font-semibold">
                                            Supplier
                                        </th>

                                        <th className="px-6 py-4 text-right font-semibold">
                                            Total
                                        </th>

                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {filteredPurchases.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            className="transition hover:bg-slate-50"
                                        >

                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                {invoice.number || '-'}
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {formatDate(
                                                    invoice.date
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {invoice.supplier?.name ||
                                                    invoice.supplier_name ||
                                                    '-'}
                                            </td>

                                            <td className="px-6 py-4 text-right font-semibold text-orange-600">
                                                {formatRupiah(
                                                    invoice.total
                                                )}
                                            </td>

                                        </tr>
                                    ))}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

                {/* Detail Pengeluaran */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 px-6 py-5">

                        <div className="flex items-center gap-2">
                            <Wallet
                                size={19}
                                className="text-red-600"
                            />

                            <h2 className="font-semibold text-slate-800">
                                Detail Pengeluaran
                            </h2>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                            Pengeluaran operasional dalam periode yang dipilih.
                        </p>

                    </div>

                    {filteredExpenses.length === 0 ? (
                        <div className="px-6 py-12 text-center">

                            <FileText
                                size={36}
                                className="mx-auto mb-3 text-slate-300"
                            />

                            <p className="font-medium text-slate-600">
                                Tidak ada data pengeluaran
                            </p>

                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[700px] text-left text-sm">

                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>

                                        <th className="px-6 py-4 font-semibold">
                                            No. Pengeluaran
                                        </th>

                                        <th className="px-6 py-4 font-semibold">
                                            Tanggal
                                        </th>

                                        <th className="px-6 py-4 font-semibold">
                                            Kategori
                                        </th>

                                        <th className="px-6 py-4 text-right font-semibold">
                                            Jumlah
                                        </th>

                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {filteredExpenses.map((expense) => (
                                        <tr
                                            key={expense.id}
                                            className="transition hover:bg-slate-50"
                                        >

                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                {expense.number || '-'}
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {formatDate(
                                                    expense.date
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {expense.category || '-'}
                                            </td>

                                            <td className="px-6 py-4 text-right font-semibold text-red-600">
                                                {formatRupiah(
                                                    expense.amount
                                                )}
                                            </td>

                                        </tr>
                                    ))}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

                {/* Loading */}
                {loading && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
                        <div className="rounded-xl bg-white px-6 py-5 shadow-lg">

                            <div className="flex items-center gap-3">

                                <RefreshCw
                                    size={20}
                                    className="animate-spin text-blue-600"
                                />

                                <span className="text-sm font-medium text-slate-700">
                                    Memuat laporan...
                                </span>

                            </div>

                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    )
}

export default ProfitLossReport
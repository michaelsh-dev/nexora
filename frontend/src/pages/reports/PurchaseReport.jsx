import { useEffect, useMemo, useState } from 'react'
import {
    BarChart3,
    Calendar,
    RefreshCw,
    FileText,
} from 'lucide-react'
import api from '../../services/api'
import DashboardLayout from '../../layouts/DashboardLayout'

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

function PurchaseReport() {
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const fetchInvoices = async () => {
        try {
            setLoading(true)
            setError('')

            const response = await api.get('/purchase-invoices')

            const data = Array.isArray(response.data)
                ? response.data
                : response.data.data || []

            setInvoices(data)
        } catch (err) {
            console.error(err)

            setError(
                err.response?.data?.message ||
                'Gagal mengambil data faktur pembelian.'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInvoices()
    }, [])

    const filteredInvoices = useMemo(() => {
        return invoices.filter((invoice) => {
            const status = String(invoice.status || '').toLowerCase()

            // Draft dan cancelled tidak dihitung
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
    }, [invoices, startDate, endDate])

    const summary = useMemo(() => {
        const totalInvoices = filteredInvoices.length

        const totalPurchases = filteredInvoices.reduce(
            (total, invoice) => total + Number(invoice.total || 0),
            0
        )

        const paidInvoices = filteredInvoices.filter(
            (invoice) =>
                String(invoice.status || '').toLowerCase() === 'paid'
        )

        const unpaidInvoices = filteredInvoices.filter((invoice) => {
            const status = String(invoice.status || '').toLowerCase()

            return (
                status === 'unpaid' ||
                status === 'partially_paid'
            )
        })

        const totalPaid = paidInvoices.reduce(
            (total, invoice) => total + Number(invoice.total || 0),
            0
        )

        const totalUnpaid = unpaidInvoices.reduce(
            (total, invoice) => total + Number(invoice.total || 0),
            0
        )

        return {
            totalInvoices,
            totalPurchases,
            paidInvoices: paidInvoices.length,
            unpaidInvoices: unpaidInvoices.length,
            totalPaid,
            totalUnpaid,
        }
    }, [filteredInvoices])

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
                                Laporan Pembelian
                            </h1>
                        </div>

                        <p className="text-sm text-slate-500">
                            Ringkasan transaksi faktur pembelian berdasarkan periode.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchInvoices}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            size={17}
                            className={loading ? 'animate-spin' : ''}
                        />
                        Refresh
                    </button>
                </div>

                {/* Filter */}
                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-blue-600" />

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
                                    setStartDate(e.target.value)
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
                                    setEndDate(e.target.value)
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

                {/* Summary */}
                <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                    {/* Jumlah Faktur */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Jumlah Faktur
                                </p>

                                <h3 className="mt-1 text-2xl font-bold text-slate-800">
                                    {summary.totalInvoices}
                                </h3>
                            </div>

                            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                                <FileText size={22} />
                            </div>
                        </div>

                        <p className="text-xs text-slate-400">
                            Faktur pada periode terpilih
                        </p>
                    </div>

                    {/* Total Pembelian */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Total Pembelian
                                </p>

                                <h3 className="mt-1 text-xl font-bold text-slate-800">
                                    {formatRupiah(
                                        summary.totalPurchases
                                    )}
                                </h3>
                            </div>

                            <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
                                <BarChart3 size={22} />
                            </div>
                        </div>

                        <p className="text-xs text-slate-400">
                            Nilai seluruh faktur
                        </p>
                    </div>

                    {/* Lunas */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Faktur Lunas
                                </p>

                                <h3 className="mt-1 text-2xl font-bold text-slate-800">
                                    {summary.paidInvoices}
                                </h3>
                            </div>

                            <div className="rounded-lg bg-green-100 p-3 text-green-600">
                                <FileText size={22} />
                            </div>
                        </div>

                        <p className="text-xs text-slate-400">
                            Total {formatRupiah(summary.totalPaid)}
                        </p>
                    </div>

                    {/* Belum Lunas */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Belum Lunas
                                </p>

                                <h3 className="mt-1 text-2xl font-bold text-slate-800">
                                    {summary.unpaidInvoices}
                                </h3>
                            </div>

                            <div className="rounded-lg bg-yellow-100 p-3 text-yellow-600">
                                <FileText size={22} />
                            </div>
                        </div>

                        <p className="text-xs text-slate-400">
                            Total {formatRupiah(summary.totalUnpaid)}
                        </p>
                    </div>

                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 px-6 py-5">
                        <h2 className="font-semibold text-slate-800">
                            Detail Pembelian
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {filteredInvoices.length} transaksi ditampilkan
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <RefreshCw
                                size={24}
                                className="animate-spin text-blue-600"
                            />
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <FileText
                                size={40}
                                className="mx-auto mb-3 text-slate-300"
                            />

                            <p className="font-medium text-slate-600">
                                Tidak ada data pembelian
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                                Belum ada faktur pada periode yang dipilih.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">

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
                                            Subtotal
                                        </th>

                                        <th className="px-6 py-4 text-right font-semibold">
                                            Diskon
                                        </th>

                                        <th className="px-6 py-4 text-right font-semibold">
                                            Pajak
                                        </th>

                                        <th className="px-6 py-4 text-right font-semibold">
                                            Total
                                        </th>

                                        <th className="px-6 py-4 text-center font-semibold">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredInvoices.map((invoice) => {
                                        const status = String(
                                            invoice.status || ''
                                        ).toLowerCase()

                                        return (
                                            <tr
                                                key={invoice.id}
                                                className="transition hover:bg-slate-50"
                                            >
                                                <td className="px-6 py-4 font-medium text-slate-800">
                                                    {invoice.number || '-'}
                                                </td>

                                                <td className="px-6 py-4 text-slate-600">
                                                    {formatDate(invoice.date)}
                                                </td>

                                                <td className="px-6 py-4 text-slate-600">
                                                    {invoice.supplier?.name ||
                                                        invoice.supplier_name ||
                                                        '-'}
                                                </td>

                                                <td className="px-6 py-4 text-right text-slate-600">
                                                    {formatRupiah(
                                                        invoice.subtotal
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-right text-slate-600">
                                                    {formatRupiah(
                                                        invoice.discount
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-right text-slate-600">
                                                    {formatRupiah(
                                                        invoice.tax
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-right font-semibold text-slate-800">
                                                    {formatRupiah(
                                                        invoice.total
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    {status === 'paid' ? (
                                                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                                            Lunas
                                                        </span>
                                                    ) : status === 'partially_paid' ? (
                                                        <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                                                            Sebagian
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                                                            Belum Lunas
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>

                            </table>
                        </div>
                    )}

                </div>

            </div>
        </DashboardLayout>
    )
}

export default PurchaseReport
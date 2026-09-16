import { useEffect, useState } from 'react'
import {
    Wallet,
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    Calendar,
    FileText,
} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/api'

function SalesReceipts() {
    const [receipts, setReceipts] = useState([])
    const [invoices, setInvoices] = useState([])

    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    const [showModal, setShowModal] = useState(false)
    const [editingReceipt, setEditingReceipt] = useState(null)

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        sales_invoice_id: '',
        amount: '',
        payment_method: 'bank_transfer',
        notes: '',
    })

    useEffect(() => {
        fetchReceipts()
        fetchInvoices()
    }, [])

    const fetchReceipts = async () => {
        try {
            const response = await api.get('/sales-receipts')
            setReceipts(response.data)
        } catch (error) {
            console.error(error)
            alert('Gagal mengambil data penerimaan.')
        } finally {
            setLoading(false)
        }
    }

    const fetchInvoices = async () => {
        try {
            const response = await api.get('/sales-invoices')
            setInvoices(response.data)
        } catch (error) {
            console.error(error)
        }
    }

    const openCreateModal = () => {
        setEditingReceipt(null)

        setForm({
            date: new Date().toISOString().split('T')[0],
            sales_invoice_id: '',
            amount: '',
            payment_method: 'bank_transfer',
            notes: '',
        })

        setShowModal(true)
    }

    const openEditModal = (receipt) => {
        setEditingReceipt(receipt)

        setForm({
            date: receipt.date?.split('T')[0] || '',
            sales_invoice_id: receipt.sales_invoice_id,
            amount: receipt.amount,
            payment_method: receipt.payment_method,
            notes: receipt.notes || '',
        })

        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingReceipt(null)
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(Number(value) || 0)
    }

    const formatDate = (date) => {
        if (!date) return '-'

        return new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    }

    const getPaymentMethodLabel = (method) => {
        const labels = {
            cash: 'Tunai',
            bank_transfer: 'Transfer Bank',
            credit_card: 'Kartu Kredit',
            debit_card: 'Kartu Debit',
            other: 'Lainnya',
        }

        return labels[method] || method
    }

    const getRemaining = (invoice) => {
        if (!invoice) return 0

        const paid =
            invoice.receipts?.reduce(
                (sum, receipt) =>
                    sum + Number(receipt.amount),
                0
            ) || 0

        /*
         * Saat edit, pembayaran yang sedang diedit
         * dikembalikan ke sisa.
         */
        const currentPayment = editingReceipt
            ? Number(editingReceipt.amount)
            : 0

        return Math.max(
            0,
            Number(invoice.total) - paid + currentPayment
        )
    }

    const handleInvoiceChange = (invoiceId) => {
        const invoice = invoices.find(
            (item) =>
                String(item.id) === String(invoiceId)
        )

        setForm({
            ...form,
            sales_invoice_id: invoiceId,
            amount: invoice
                ? getRemaining(invoice)
                : '',
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.sales_invoice_id) {
            alert('Pilih faktur terlebih dahulu.')
            return
        }

        if (!form.amount || Number(form.amount) <= 0) {
            alert('Masukkan jumlah pembayaran.')
            return
        }

        const payload = {
            date: form.date,
            sales_invoice_id: form.sales_invoice_id,
            amount: Number(form.amount),
            payment_method: form.payment_method,
            notes: form.notes,
        }

        try {
            if (editingReceipt) {
                await api.put(
                    `/sales-receipts/${editingReceipt.id}`,
                    payload
                )
            } else {
                await api.post(
                    '/sales-receipts',
                    payload
                )
            }

            closeModal()

            fetchReceipts()
            fetchInvoices()

            alert(
                editingReceipt
                    ? 'Penerimaan berhasil diperbarui.'
                    : 'Penerimaan berhasil dibuat.'
            )
        } catch (error) {
            console.error(error)

            alert(
                error.response?.data?.message ||
                'Gagal menyimpan penerimaan.'
            )
        }
    }

    const handleDelete = async (receipt) => {
        if (
            !window.confirm(
                `Hapus penerimaan ${receipt.number}?`
            )
        ) {
            return
        }

        try {
            await api.delete(
                `/sales-receipts/${receipt.id}`
            )

            fetchReceipts()
            fetchInvoices()

            alert('Penerimaan berhasil dihapus.')
        } catch (error) {
            console.error(error)

            alert(
                error.response?.data?.message ||
                'Gagal menghapus penerimaan.'
            )
        }
    }

    const filteredReceipts = receipts.filter(
        (receipt) => {
            const keyword = search.toLowerCase()

            return (
                receipt.number
                    ?.toLowerCase()
                    .includes(keyword) ||
                receipt.salesInvoice?.number
                    ?.toLowerCase()
                    .includes(keyword) ||
                receipt.salesInvoice?.customer?.name
                    ?.toLowerCase()
                    .includes(keyword)
            )
        }
    )

    return (
        <DashboardLayout>
            <div className="p-8">

                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Wallet size={25} />
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                Penerimaan Penjualan
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Kelola pembayaran dari pelanggan
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        <Plus size={18} />
                        Buat Penerimaan
                    </button>
                </div>

                {/* Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

                    {/* Search */}
                    <div className="border-b border-slate-200 p-6">
                        <div className="relative w-full max-w-lg">
                            <Search
                                size={19}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                placeholder="Cari nomor penerimaan, faktur, atau pelanggan..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-6 py-4">
                                        No. Penerimaan
                                    </th>

                                    <th className="px-6 py-4">
                                        Tanggal
                                    </th>

                                    <th className="px-6 py-4">
                                        Faktur
                                    </th>

                                    <th className="px-6 py-4">
                                        Pelanggan
                                    </th>

                                    <th className="px-6 py-4 text-right">
                                        Jumlah
                                    </th>

                                    <th className="px-6 py-4">
                                        Metode
                                    </th>

                                    <th className="px-6 py-4 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-16 text-center text-sm text-slate-500"
                                        >
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : filteredReceipts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-16 text-center"
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                                    <Wallet size={25} />
                                                </div>

                                                <h3 className="font-semibold text-slate-700">
                                                    Belum ada penerimaan
                                                </h3>

                                                <p className="mt-1 text-sm text-slate-400">
                                                    Belum ada pembayaran dari pelanggan.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReceipts.map(
                                        (receipt) => (
                                            <tr
                                                key={receipt.id}
                                                className="transition hover:bg-slate-50"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="font-semibold text-blue-600">
                                                        {receipt.number}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 text-sm text-slate-600">
                                                    {formatDate(
                                                        receipt.date
                                                    )}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="font-medium text-slate-800">
                                                        {receipt.salesInvoice?.number || '-'}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="font-medium text-slate-800">
                                                        {receipt.salesInvoice?.customer?.name || '-'}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 text-right font-semibold text-slate-800">
                                                    {formatCurrency(
                                                        receipt.amount
                                                    )}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                                                        {getPaymentMethodLabel(
                                                            receipt.payment_method
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() =>
                                                                openEditModal(
                                                                    receipt
                                                                )
                                                            }
                                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    receipt
                                                                )
                                                            }
                                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
                        Total penerimaan:{' '}
                        <span className="font-semibold text-slate-700">
                            {filteredReceipts.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-6">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">

                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingReceipt
                                        ? 'Edit Penerimaan Penjualan'
                                        : 'Buat Penerimaan Penjualan'}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Catat pembayaran dari pelanggan
                                </p>
                            </div>

                            <button
                                onClick={closeModal}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5 p-7">

                                {/* Date */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Tanggal
                                    </label>

                                    <div className="relative">
                                        <Calendar
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            type="date"
                                            required
                                            value={form.date}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    date: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Invoice */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Faktur Penjualan
                                    </label>

                                    <div className="relative">
                                        <FileText
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <select
                                            required
                                            value={form.sales_invoice_id}
                                            onChange={(e) =>
                                                handleInvoiceChange(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                                        >
                                            <option value="">
                                                Pilih faktur
                                            </option>

                                            {invoices
                                                .filter(
                                                    (invoice) =>
                                                        invoice.status !==
                                                            'draft' &&
                                                        invoice.status !==
                                                            'cancelled'
                                                )
                                                .map(
                                                    (invoice) => (
                                                        <option
                                                            key={
                                                                invoice.id
                                                            }
                                                            value={
                                                                invoice.id
                                                            }
                                                        >
                                                            {invoice.number} - {invoice.customer?.name} - {formatCurrency(invoice.total)}
                                                        </option>
                                                    )
                                                )}
                                        </select>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Jumlah Pembayaran
                                    </label>

                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        value={form.amount}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                amount: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Metode Pembayaran
                                    </label>

                                    <select
                                        value={
                                            form.payment_method
                                        }
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                payment_method:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    >
                                        <option value="cash">
                                            Tunai
                                        </option>

                                        <option value="bank_transfer">
                                            Transfer Bank
                                        </option>

                                        <option value="credit_card">
                                            Kartu Kredit
                                        </option>

                                        <option value="debit_card">
                                            Kartu Debit
                                        </option>

                                        <option value="other">
                                            Lainnya
                                        </option>
                                    </select>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Catatan
                                    </label>

                                    <textarea
                                        rows="3"
                                        value={form.notes}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                notes: e.target.value,
                                            })
                                        }
                                        placeholder="Catatan pembayaran..."
                                        className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 border-t border-slate-200 px-7 py-5">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>

                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    {editingReceipt
                                        ? 'Simpan Perubahan'
                                        : 'Simpan Penerimaan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}

export default SalesReceipts
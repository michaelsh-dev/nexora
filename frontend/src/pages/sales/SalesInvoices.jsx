import { useEffect, useState } from 'react'
import {
    FileText,
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    Calendar,
    User,
    Package,

} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/api'

function SalesInvoices() {
    const [invoices, setInvoices] = useState([])
    const [customers, setCustomers] = useState([])
    const [products, setProducts] = useState([])

    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    const [showModal, setShowModal] = useState(false)
    const [editingInvoice, setEditingInvoice] = useState(null)
    const [warehouses, setWarehouses] = useState([])

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        customer_id: '',
        warehouse_id: '',
        discount: 0,
        tax: 0,
        tax_rate: 0,
        status: 'unpaid',
        notes: '',
        items: [
            {
                product_id: '',
                quantity: 1,
                price: 0,
                discount: 0,
            },
        ],
    })

    useEffect(() => {
        fetchInvoices()
        fetchCustomers()
        fetchProducts()
        fetchWarehouses()
    }, [])

    const fetchInvoices = async () => {
        try {
            const response = await api.get('/sales-invoices')
            setInvoices(response.data)
        } catch (error) {
            console.error(error)
            alert('Gagal mengambil data faktur.')
        } finally {
            setLoading(false)
        }
    }

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers')
            setCustomers(response.data)
        } catch (error) {
            console.error(error)
        }
    }

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products')
            setProducts(response.data)
        } catch (error) {
            console.error(error)
        }
    }

    const fetchWarehouses = async () => {
        try {
            const response = await api.get('/warehouses')
            setWarehouses(response.data)
        } catch (error) {
            console.error(error)
        }
    }

    const openCreateModal = () => {
        setEditingInvoice(null)

        setForm({
            date: new Date().toISOString().split('T')[0],
            customer_id: '',
            warehouse_id: '',
            discount: 0,
            tax: 0,
            tax_rate: 0,
            status: 'unpaid',
            notes: '',
            items: [
                {
                    product_id: '',
                    quantity: 1,
                    price: 0,
                    discount: 0,
                },
            ],
        })

        setShowModal(true)
    }

    const openEditModal = (invoice) => {
        setEditingInvoice(invoice)

        const taxRate =
            invoice.subtotal > 0
                ? ((Number(invoice.tax) / Number(invoice.subtotal)) * 100).toFixed(2)
                : 0

        setForm({
            date: invoice.date?.split('T')[0] || invoice.date,
            customer_id: invoice.customer_id,
            warehouse_id: invoice.warehouse_id || '',
            discount: Number(invoice.discount),
            tax: Number(invoice.tax),
            tax_rate: Number(taxRate),
            status: invoice.status,
            notes: invoice.notes || '',
            items: invoice.items.map((item) => ({
                product_id: item.product_id,
                quantity: Number(item.quantity),
                price: Number(item.price),
                discount: Number(item.discount),
            })),
        })

        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingInvoice(null)
    }

    const handleProductChange = (index, productId) => {
        const selectedProduct = products.find(
            (product) => String(product.id) === String(productId)
        )

        const updatedItems = [...form.items]

        updatedItems[index] = {
            ...updatedItems[index],
            product_id: productId,
            price: selectedProduct
                ? Number(selectedProduct.selling_price)
                : 0,
        }

        setForm({
            ...form,
            items: updatedItems,
        })
    }

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...form.items]

        updatedItems[index] = {
            ...updatedItems[index],
            [field]: value,
        }

        setForm({
            ...form,
            items: updatedItems,
        })
    }

    const addItem = () => {
        setForm({
            ...form,
            items: [
                ...form.items,
                {
                    product_id: '',
                    quantity: 1,
                    price: 0,
                    discount: 0,
                },
            ],
        })
    }

    const removeItem = (index) => {
        if (form.items.length === 1) return

        setForm({
            ...form,
            items: form.items.filter((_, i) => i !== index),
        })
    }

    const calculateItemSubtotal = (item) => {
        const quantity = Number(item.quantity) || 0
        const price = Number(item.price) || 0
        const discount = Number(item.discount) || 0

        return Math.max(
            0,
            quantity * price - discount
        )
    }

    const subtotal = form.items.reduce(
        (total, item) => total + calculateItemSubtotal(item),
        0
    )

    const discount = Number(form.discount) || 0

    const tax =
        subtotal > 0
            ? (subtotal - discount) * (Number(form.tax_rate) / 100)
            : 0

    const total = Math.max(
        0,
        subtotal - discount + tax
    )

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

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Draft',
            unpaid: 'Belum Lunas',
            paid: 'Lunas',
            cancelled: 'Dibatalkan',
        }

        return labels[status] || status
    }

    const getStatusClass = (status) => {
        const classes = {
            draft: 'bg-slate-100 text-slate-600',
            unpaid: 'bg-amber-50 text-amber-600',
            paid: 'bg-green-50 text-green-600',
            cancelled: 'bg-red-50 text-red-600',
        }

        return classes[status] || 'bg-slate-100 text-slate-600'
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.customer_id) {
            alert('Pilih pelanggan terlebih dahulu.')
            return
        }

        const validItems = form.items.filter(
            (item) => item.product_id
        )

        if (validItems.length === 0) {
            alert('Tambahkan minimal satu barang.')
            return
        }

        const payload = {
            date: form.date,
            customer_id: form.customer_id,
            warehouse_id: Number(form.warehouse_id),
            discount: discount,
            tax: tax,
            status: form.status,
            notes: form.notes,
            items: validItems.map((item) => ({
                product_id: item.product_id,
                quantity: Number(item.quantity),
                price: Number(item.price),
                discount: Number(item.discount) || 0,
            })),
        }

        try {
            if (editingInvoice) {
                await api.put(
                    `/sales-invoices/${editingInvoice.id}`,
                    payload
                )
            } else {
                await api.post('/sales-invoices', payload)
            }

            closeModal()
            fetchInvoices()

            alert(
                editingInvoice
                    ? 'Faktur berhasil diperbarui.'
                    : 'Faktur berhasil dibuat.'
            )
        } catch (error) {
            console.error(error)

            const message =
                error.response?.data?.message ||
                'Gagal menyimpan faktur.'

            alert(message)
        }
    }

    const handleDelete = async (invoice) => {
        const confirmed = window.confirm(
            `Hapus faktur ${invoice.number}?`
        )

        if (!confirmed) return

        try {
            await api.delete(`/sales-invoices/${invoice.id}`)

            fetchInvoices()

            alert('Faktur berhasil dihapus.')
        } catch (error) {
            console.error(error)

            alert(
                error.response?.data?.message ||
                'Gagal menghapus faktur.'
            )
        }
    }

    const filteredInvoices = invoices.filter((invoice) => {
        const keyword = search.toLowerCase()

        return (
            invoice.number?.toLowerCase().includes(keyword) ||
            invoice.customer?.name?.toLowerCase().includes(keyword)
        )
    })

    return (
        <DashboardLayout>
            <div className="p-8">

                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <FileText size={25} />
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                Faktur Penjualan
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Kelola transaksi penjualan dan faktur pelanggan
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        <Plus size={18} />
                        Buat Faktur
                    </button>
                </div>

                {/* Main Card */}
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
                                placeholder="Cari nomor faktur atau pelanggan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
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
                                        No. Faktur
                                    </th>

                                    <th className="px-6 py-4">
                                        Tanggal
                                    </th>

                                    <th className="px-6 py-4">
                                        Pelanggan
                                    </th>

                                    <th className="px-6 py-4 text-right">
                                        Total
                                    </th>

                                    <th className="px-6 py-4">
                                        Status
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
                                            colSpan="6"
                                            className="px-6 py-16 text-center text-sm text-slate-500"
                                        >
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-6 py-16 text-center"
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                                    <FileText size={25} />
                                                </div>

                                                <h3 className="font-semibold text-slate-700">
                                                    Belum ada faktur
                                                </h3>

                                                <p className="mt-1 text-sm text-slate-400">
                                                    Buat faktur penjualan pertama kamu.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="font-semibold text-blue-600">
                                                    {invoice.number}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5 text-sm text-slate-600">
                                                {formatDate(invoice.date)}
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="font-medium text-slate-800">
                                                    {invoice.customer?.name || '-'}
                                                </div>

                                                <div className="text-xs text-slate-400">
                                                    {invoice.items?.length || 0} barang
                                                </div>
                                            </td>

                                            <td className="px-6 py-5 text-right font-semibold text-slate-800">
                                                {formatCurrency(invoice.total)}
                                            </td>

                                            <td className="px-6 py-5">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(invoice.status)}`}
                                                >
                                                    {getStatusLabel(invoice.status)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(invoice)
                                                        }
                                                        className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(invoice)
                                                        }
                                                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
                        Total faktur: <span className="font-semibold text-slate-700">{filteredInvoices.length}</span>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-6">
                    <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingInvoice
                                        ? 'Edit Faktur Penjualan'
                                        : 'Buat Faktur Penjualan'}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Masukkan informasi transaksi penjualan
                                </p>
                            </div>

                            <button
                                onClick={closeModal}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form
                            onSubmit={handleSubmit}
                            className="overflow-y-auto"
                        >
                            <div className="space-y-7 p-7">

                                {/* Customer + Warehouse + Date */}
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Pelanggan
                                        </label>

                                        <div className="relative">
                                            <User
                                                size={18}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <select
                                                required
                                                value={form.customer_id}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        customer_id: e.target.value,
                                                    })
                                                }
                                                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                                            >
                                                <option value="">
                                                    Pilih pelanggan
                                                </option>

                                                {customers.map((customer) => (
                                                    <option
                                                        key={customer.id}
                                                        value={customer.id}
                                                    >
                                                        {customer.code} - {customer.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Gudang
                                        </label>

                                        <select
                                            required
                                            value={form.warehouse_id}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    warehouse_id: e.target.value,
                                                })
                                            }
                                            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        >
                                            <option value="">
                                                Pilih gudang
                                            </option>

                                            {warehouses.map((warehouse) => (
                                                <option
                                                    key={warehouse.id}
                                                    value={warehouse.id}
                                                >
                                                    {warehouse.code} - {warehouse.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

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
                                </div>

                                {/* Items */}
                                <div>
                                    <div className="mb-3 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-slate-800">
                                                Barang
                                            </h3>

                                            <p className="text-xs text-slate-400">
                                                Tambahkan barang yang dijual
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                                        >
                                            <Plus size={16} />
                                            Tambah Barang
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="w-full min-w-[850px]">
                                            <thead className="bg-slate-50">
                                                <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                                                    <th className="px-4 py-3">
                                                        Barang
                                                    </th>

                                                    <th className="w-28 px-4 py-3">
                                                        Qty
                                                    </th>

                                                    <th className="w-44 px-4 py-3">
                                                        Harga
                                                    </th>

                                                    <th className="w-36 px-4 py-3">
                                                        Diskon
                                                    </th>

                                                    <th className="w-44 px-4 py-3 text-right">
                                                        Subtotal
                                                    </th>

                                                    <th className="w-12 px-4 py-3"></th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-100">
                                                {form.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-3">
                                                            <div className="relative">
                                                                <Package
                                                                    size={17}
                                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                                />

                                                                <select
                                                                    required
                                                                    value={item.product_id}
                                                                    onChange={(e) =>
                                                                        handleProductChange(
                                                                            index,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                                                                >
                                                                    <option value="">
                                                                        Pilih barang
                                                                    </option>

                                                                    {products.map(
                                                                        (product) => (
                                                                            <option
                                                                                key={
                                                                                    product.id
                                                                                }
                                                                                value={
                                                                                    product.id
                                                                                }
                                                                            >
                                                                                {product.code} - {product.name}
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="0.01"
                                                                step="0.01"
                                                                value={item.quantity}
                                                                onChange={(e) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        'quantity',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                                            />
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.price}
                                                                onChange={(e) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        'price',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                                            />
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.discount}
                                                                onChange={(e) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        'discount',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                                            />
                                                        </td>

                                                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                                                            {formatCurrency(
                                                                calculateItemSubtotal(
                                                                    item
                                                                )
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeItem(index)
                                                                }
                                                                disabled={
                                                                    form.items.length ===
                                                                    1
                                                                }
                                                                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                                                            >
                                                                <Trash2 size={17} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Bottom */}
                                <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">

                                    {/* Notes */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Catatan
                                        </label>

                                        <textarea
                                            rows="5"
                                            value={form.notes}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    notes: e.target.value,
                                                })
                                            }
                                            placeholder="Tambahkan catatan jika diperlukan..."
                                            className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Summary */}
                                    <div className="rounded-xl bg-slate-50 p-5">

                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm text-slate-600">
                                                <span>Subtotal</span>
                                                <span className="font-medium">
                                                    {formatCurrency(subtotal)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
                                                <span>Diskon Faktur</span>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={form.discount}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            discount:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
                                                <span>PPN (%)</span>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={form.tax_rate}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            tax_rate:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            <div className="flex justify-between text-sm text-slate-600">
                                                <span>Nilai PPN</span>
                                                <span>
                                                    {formatCurrency(tax)}
                                                </span>
                                            </div>

                                            <div className="border-t border-slate-200 pt-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-slate-800">
                                                        Grand Total
                                                    </span>

                                                    <span className="text-xl font-bold text-blue-600">
                                                        {formatCurrency(total)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="max-w-sm">
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Status
                                    </label>

                                    <select
                                        value={form.status}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                status: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    >
                                        <option value="draft">
                                            Draft
                                        </option>

                                        <option value="unpaid">
                                            Belum Lunas
                                        </option>

                                        <option value="paid">
                                            Lunas
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Modal Footer */}
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
                                    {editingInvoice
                                        ? 'Simpan Perubahan'
                                        : 'Simpan Faktur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}

export default SalesInvoices
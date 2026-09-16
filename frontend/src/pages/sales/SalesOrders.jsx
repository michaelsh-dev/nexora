import { useEffect, useState } from 'react'
import {
    ShoppingCart,
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

function SalesOrders() {
    const [orders, setOrders] = useState([])
    const [customers, setCustomers] = useState([])
    const [products, setProducts] = useState([])

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [loading, setLoading] = useState(true)

    const [showModal, setShowModal] = useState(false)
    const [editingOrder, setEditingOrder] = useState(null)

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        customer_id: '',
        discount: 0,
        tax_rate: 0,
        status: 'draft',
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
        fetchOrders()
        fetchCustomers()
        fetchProducts()
    }, [])

    const fetchOrders = async () => {
        try {
            const response = await api.get('/sales-orders')
            setOrders(response.data)
        } catch (error) {
            console.error(error)
            alert('Gagal mengambil data pesanan.')
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

    const openCreateModal = () => {
        setEditingOrder(null)

        setForm({
            date: new Date().toISOString().split('T')[0],
            customer_id: '',
            discount: 0,
            tax_rate: 0,
            status: 'draft',
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

    const openEditModal = (order) => {
        setEditingOrder(order)

        const taxRate =
            Number(order.subtotal) > 0
                ? (
                    (Number(order.tax) /
                        Number(order.subtotal)) *
                    100
                ).toFixed(2)
                : 0

        setForm({
            date: order.date?.split('T')[0] || order.date,
            customer_id: order.customer_id,
            discount: Number(order.discount),
            tax_rate: Number(taxRate),
            status: order.status,
            notes: order.notes || '',
            items: order.items.map((item) => ({
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
        setEditingOrder(null)
    }

    const handleProductChange = (index, productId) => {
        const selectedProduct = products.find(
            (product) =>
                String(product.id) === String(productId)
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
            items: form.items.filter(
                (_, itemIndex) => itemIndex !== index
            ),
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
        (total, item) =>
            total + calculateItemSubtotal(item),
        0
    )

    const invoiceDiscount =
        Number(form.discount) || 0

    const tax =
        Math.max(
            0,
            subtotal - invoiceDiscount
        ) *
        ((Number(form.tax_rate) || 0) / 100)

    const total = Math.max(
        0,
        subtotal - invoiceDiscount + tax
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

        return new Date(date).toLocaleDateString(
            'id-ID',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }
        )
    }

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Draft',
            processing: 'Diproses',
            completed: 'Selesai',
            cancelled: 'Dibatalkan',
        }

        return labels[status] || status
    }

    const getStatusClass = (status) => {
        const classes = {
            draft:
                'bg-slate-100 text-slate-600',
            processing:
                'bg-blue-50 text-blue-600',
            completed:
                'bg-green-50 text-green-600',
            cancelled:
                'bg-red-50 text-red-600',
        }

        return (
            classes[status] ||
            'bg-slate-100 text-slate-600'
        )
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
            discount: invoiceDiscount,
            tax,
            status: form.status,
            notes: form.notes,
            items: validItems.map((item) => ({
                product_id: item.product_id,
                quantity: Number(item.quantity),
                price: Number(item.price),
                discount:
                    Number(item.discount) || 0,
            })),
        }

        try {
            if (editingOrder) {
                await api.put(
                    `/sales-orders/${editingOrder.id}`,
                    payload
                )
            } else {
                await api.post(
                    '/sales-orders',
                    payload
                )
            }

            closeModal()
            fetchOrders()

            alert(
                editingOrder
                    ? 'Pesanan berhasil diperbarui.'
                    : 'Pesanan berhasil dibuat.'
            )
        } catch (error) {
            console.error(error)

            alert(
                error.response?.data?.message ||
                'Gagal menyimpan pesanan.'
            )
        }
    }

    const handleDelete = async (order) => {
        if (
            !window.confirm(
                `Hapus pesanan ${order.number}?`
            )
        ) {
            return
        }

        try {
            await api.delete(
                `/sales-orders/${order.id}`
            )

            fetchOrders()

            alert('Pesanan berhasil dihapus.')
        } catch (error) {
            console.error(error)

            alert(
                error.response?.data?.message ||
                'Gagal menghapus pesanan.'
            )
        }
    }

    const filteredOrders = orders.filter((order) => {
        const keyword = search.toLowerCase()

        const matchesSearch =
            order.number
                ?.toLowerCase()
                .includes(keyword) ||
            order.customer?.name
                ?.toLowerCase()
                .includes(keyword)

        const matchesStatus =
            !statusFilter ||
            order.status === statusFilter

        return (
            matchesSearch &&
            matchesStatus
        )
    })

    return (
        <DashboardLayout>
            <div className="p-8">

                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <ShoppingCart size={25} />
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                Pesanan Penjualan
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Kelola pesanan pelanggan sebelum diproses menjadi faktur
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        <Plus size={18} />
                        Buat Pesanan
                    </button>
                </div>

                {/* Main Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

                    {/* Filters */}
                    <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center">

                        <div className="relative w-full md:max-w-lg">
                            <Search
                                size={19}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                placeholder="Cari nomor pesanan atau pelanggan..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="">
                                Semua Status
                            </option>

                            <option value="draft">
                                Draft
                            </option>

                            <option value="processing">
                                Diproses
                            </option>

                            <option value="completed">
                                Selesai
                            </option>

                            <option value="cancelled">
                                Dibatalkan
                            </option>
                        </select>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-6 py-4">
                                        No. Pesanan
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
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-6 py-16 text-center"
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                                    <ShoppingCart size={25} />
                                                </div>

                                                <h3 className="font-semibold text-slate-700">
                                                    Belum ada pesanan
                                                </h3>

                                                <p className="mt-1 text-sm text-slate-400">
                                                    Buat pesanan penjualan pertama kamu.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map(
                                        (order) => (
                                            <tr
                                                key={order.id}
                                                className="transition hover:bg-slate-50"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="font-semibold text-blue-600">
                                                        {order.number}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 text-sm text-slate-600">
                                                    {formatDate(
                                                        order.date
                                                    )}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="font-medium text-slate-800">
                                                        {order.customer?.name || '-'}
                                                    </div>

                                                    <div className="text-xs text-slate-400">
                                                        {order.items?.length || 0}{' '}
                                                        barang
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 text-right font-semibold text-slate-800">
                                                    {formatCurrency(
                                                        order.total
                                                    )}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(order.status)}`}
                                                    >
                                                        {getStatusLabel(
                                                            order.status
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() =>
                                                                openEditModal(
                                                                    order
                                                                )
                                                            }
                                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    order
                                                                )
                                                            }
                                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                                            title="Hapus"
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

                    {/* Footer */}
                    <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
                        Total pesanan:{' '}
                        <span className="font-semibold text-slate-700">
                            {filteredOrders.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-6">
                    <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">

                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingOrder
                                        ? 'Edit Pesanan Penjualan'
                                        : 'Buat Pesanan Penjualan'}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Masukkan informasi pesanan pelanggan
                                </p>
                            </div>

                            <button
                                onClick={closeModal}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="overflow-y-auto"
                        >
                            <div className="space-y-7 p-7">

                                {/* Customer + Date */}
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
                                                value={
                                                    form.customer_id
                                                }
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        customer_id:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                                            >
                                                <option value="">
                                                    Pilih pelanggan
                                                </option>

                                                {customers.map(
                                                    (customer) => (
                                                        <option
                                                            key={
                                                                customer.id
                                                            }
                                                            value={
                                                                customer.id
                                                            }
                                                        >
                                                            {customer.code} - {customer.name}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
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
                                                Tambahkan barang yang dipesan
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
                                                {form.items.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (
                                                        <tr
                                                            key={
                                                                index
                                                            }
                                                        >
                                                            <td className="px-4 py-3">
                                                                <div className="relative">
                                                                    <Package
                                                                        size={
                                                                            17
                                                                        }
                                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                                    />

                                                                    <select
                                                                        required
                                                                        value={
                                                                            item.product_id
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
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
                                                                            (
                                                                                product
                                                                            ) => (
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
                                                                    value={
                                                                        item.quantity
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
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
                                                                    value={
                                                                        item.price
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
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
                                                                    value={
                                                                        item.discount
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
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
                                                                        removeItem(
                                                                            index
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        form
                                                                            .items
                                                                            .length ===
                                                                        1
                                                                    }
                                                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            17
                                                                        }
                                                                    />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">

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

                                    <div className="rounded-xl bg-slate-50 p-5">
                                        <div className="space-y-4">

                                            <div className="flex justify-between text-sm text-slate-600">
                                                <span>
                                                    Subtotal
                                                </span>

                                                <span className="font-medium">
                                                    {formatCurrency(
                                                        subtotal
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
                                                <span>
                                                    Diskon Pesanan
                                                </span>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        form.discount
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
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
                                                <span>
                                                    PPN (%)
                                                </span>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={
                                                        form.tax_rate
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
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
                                                <span>
                                                    Nilai PPN
                                                </span>

                                                <span>
                                                    {formatCurrency(
                                                        tax
                                                    )}
                                                </span>
                                            </div>

                                            <div className="border-t border-slate-200 pt-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-slate-800">
                                                        Grand Total
                                                    </span>

                                                    <span className="text-xl font-bold text-blue-600">
                                                        {formatCurrency(
                                                            total
                                                        )}
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

                                        <option value="processing">
                                            Diproses
                                        </option>

                                        <option value="completed">
                                            Selesai
                                        </option>

                                        <option value="cancelled">
                                            Dibatalkan
                                        </option>
                                    </select>
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
                                    {editingOrder
                                        ? 'Simpan Perubahan'
                                        : 'Simpan Pesanan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}

export default SalesOrders
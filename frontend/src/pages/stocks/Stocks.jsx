import { useEffect, useState } from 'react'
import { Pencil, Plus, Search, Trash2, Package } from 'lucide-react'
import api from '../../services/api'
import DashboardLayout from '../../layouts/DashboardLayout'

function Stocks() {
    const [stocks, setStocks] = useState([])
    const [products, setProducts] = useState([])
    const [warehouses, setWarehouses] = useState([])

    const [search, setSearch] = useState('')
    const [warehouseFilter, setWarehouseFilter] = useState('')

    const [showModal, setShowModal] = useState(false)
    const [editingStock, setEditingStock] = useState(null)

    const [form, setForm] = useState({
        product_id: '',
        warehouse_id: '',
        quantity: '',
    })

    const fetchStocks = async () => {
        try {
            const params = {}

            if (search) {
                params.search = search
            }

            if (warehouseFilter) {
                params.warehouse_id = warehouseFilter
            }

            const response = await api.get('/stocks', { params })
            setStocks(response.data)
        } catch (error) {
            console.error(error)
        }
    }

    const fetchMasterData = async () => {
        try {
            const [productsResponse, warehousesResponse] = await Promise.all([
                api.get('/products'),
                api.get('/warehouses'),
            ])

            setProducts(productsResponse.data)
            setWarehouses(warehousesResponse.data)
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchStocks()
        fetchMasterData()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStocks()
        }, 300)

        return () => clearTimeout(timer)
    }, [search, warehouseFilter])

    const openAddModal = () => {
        setEditingStock(null)

        setForm({
            product_id: '',
            warehouse_id: '',
            quantity: '',
        })

        setShowModal(true)
    }

    const openEditModal = (stock) => {
        setEditingStock(stock)

        setForm({
            product_id: stock.product_id,
            warehouse_id: stock.warehouse_id,
            quantity: Number(stock.quantity),
        })

        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            if (editingStock) {
                await api.put(`/stocks/${editingStock.id}`, form)
            } else {
                await api.post('/stocks', form)
            }

            setShowModal(false)
            fetchStocks()
        } catch (error) {
            console.error(error)

            alert(
                error.response?.data?.message ||
                'Terjadi kesalahan saat menyimpan stok.'
            )
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus data stok ini?')) {
            return
        }

        try {
            await api.delete(`/stocks/${id}`)
            fetchStocks()
        } catch (error) {
            console.error(error)
            alert('Gagal menghapus stok.')
        }
    }

    return (
        <DashboardLayout>
            <div className="p-8">

                {/* Header */}
                <div className="mb-6 flex items-center justify-between">

                    <div className="flex items-center gap-3">

                        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                            <Package size={22} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Stok
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                Kelola stok barang berdasarkan gudang
                            </p>
                        </div>

                    </div>

                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        <Plus size={18} />
                        Tambah Stok
                    </button>

                </div>

                {/* Filter */}
                <div className="rounded-xl border border-gray-200 bg-white">

                    <div className="border-b border-gray-200 p-5">

                        <div className="flex flex-col gap-3 md:flex-row">

                            <div className="relative max-w-sm flex-1">

                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="text"
                                    placeholder="Cari kode atau nama barang..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
                                />

                            </div>

                            <select
                                value={warehouseFilter}
                                onChange={(e) => setWarehouseFilter(e.target.value)}
                                className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
                            >
                                <option value="">Semua Gudang</option>

                                {warehouses.map((warehouse) => (
                                    <option
                                        key={warehouse.id}
                                        value={warehouse.id}
                                    >
                                        {warehouse.name}
                                    </option>
                                ))}

                            </select>

                        </div>

                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">

                        <table className="w-full text-left text-sm">

                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                                <tr>
                                    <th className="px-6 py-4">Kode</th>
                                    <th className="px-6 py-4">Barang</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4">Gudang</th>
                                    <th className="px-6 py-4">Stok</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {stocks.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">

                                            <Package
                                                size={35}
                                                className="mx-auto text-gray-300"
                                            />

                                            <p className="mt-3 font-medium text-gray-600">
                                                Belum ada stok
                                            </p>

                                            <p className="mt-1 text-sm text-gray-400">
                                                Tambahkan stok barang pertama.
                                            </p>

                                        </td>
                                    </tr>
                                ) : (
                                    stocks.map((stock) => (
                                        <tr
                                            key={stock.id}
                                            className="hover:bg-gray-50"
                                        >

                                            <td className="px-6 py-4 font-medium text-blue-600">
                                                {stock.product?.code}
                                            </td>

                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-800">
                                                    {stock.product?.name}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-400">
                                                    Satuan: {stock.product?.unit}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                {stock.product?.category?.name || '-'}
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                {stock.warehouse?.name || '-'}
                                            </td>

                                            <td className="px-6 py-4">

                                                <span
                                                    className={`font-semibold ${Number(stock.quantity) <=
                                                        Number(stock.product?.minimum_stock || 0)
                                                        ? 'text-red-600'
                                                        : 'text-green-600'
                                                        }`}
                                                >
                                                    {Number(stock.quantity).toFixed(0)}                                                </span>

                                                <span className="ml-1 text-gray-400">
                                                    {stock.product?.unit}
                                                </span>

                                            </td>

                                            <td className="px-6 py-4">

                                                <div className="flex justify-end gap-2">

                                                    <button
                                                        onClick={() => openEditModal(stock)}
                                                        className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                                                    >
                                                        <Pencil size={17} />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(stock.id)}
                                                        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 size={17} />
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
                    <div className="border-t border-gray-200 px-6 py-4">

                        <p className="text-sm text-gray-500">
                            Total stok:{' '}
                            <span className="font-semibold text-gray-800">
                                {stocks.length}
                            </span>
                        </p>

                    </div>

                </div>

            </div>

            {/* Modal Tambah / Edit Stok */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

                        {/* Header Modal */}
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {editingStock ? 'Edit Stok' : 'Tambah Stok'}
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Kelola stok barang berdasarkan gudang
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-6"
                        >

                            {/* Barang */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Barang
                                </label>

                                <select
                                    name="product_id"
                                    value={form.product_id}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            product_id: e.target.value,
                                        })
                                    }
                                    required
                                    disabled={!!editingStock}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                                >
                                    <option value="">
                                        Pilih barang
                                    </option>

                                    {products.map((product) => (
                                        <option
                                            key={product.id}
                                            value={product.id}
                                        >
                                            {product.code} - {product.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Gudang */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Gudang
                                </label>

                                <select
                                    name="warehouse_id"
                                    value={form.warehouse_id}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            warehouse_id: e.target.value,
                                        })
                                    }
                                    required
                                    disabled={!!editingStock}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                                >
                                    <option value="">
                                        Pilih gudang
                                    </option>

                                    {warehouses.map((warehouse) => (
                                        <option
                                            key={warehouse.id}
                                            value={warehouse.id}
                                        >
                                            {warehouse.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Jumlah */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Jumlah Stok
                                </label>

                                <input
                                    type="number"
                                    name="quantity"
                                    value={form.quantity}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            quantity: e.target.value,
                                        })
                                    }
                                    min="0"
                                    step="1"
                                    placeholder="10"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            {/* Tombol */}
                            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">

                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    Batal
                                </button>

                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    {editingStock
                                        ? 'Simpan Perubahan'
                                        : 'Simpan Stok'}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}

        </DashboardLayout>
    )
}

export default Stocks
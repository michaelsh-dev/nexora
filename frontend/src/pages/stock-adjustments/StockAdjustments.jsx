import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ClipboardMinus,
} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/api'

function StockAdjustments() {
  const [adjustments, setAdjustments] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])

  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')

  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    product_id: '',
    warehouse_id: '',
    adjustment_quantity: '',
    reason: '',
  })

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchAdjustments = async () => {
    try {
      setLoading(true)

      const params = {}

      if (search) {
        params.search = search
      }

      if (warehouseFilter) {
        params.warehouse_id = warehouseFilter
      }

      const response = await api.get(
        '/stock-adjustments',
        { params }
      )

      setAdjustments(response.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMasterData = async () => {
    try {
      const [
        productsResponse,
        warehousesResponse,
      ] = await Promise.all([
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
    fetchMasterData()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdjustments()
    }, 300)

    return () => clearTimeout(timer)
  }, [search, warehouseFilter])

  const openAdd = () => {
    setEditing(null)

    setForm({
      date: new Date().toISOString().split('T')[0],
      product_id: products[0]?.id || '',
      warehouse_id: warehouses[0]?.id || '',
      adjustment_quantity: '',
      reason: '',
    })

    setError('')
    setShowModal(true)
  }

  const openEdit = (adjustment) => {
    setEditing(adjustment)

    setForm({
      date: adjustment.date?.split('T')[0] || '',
      product_id: adjustment.product_id,
      warehouse_id: adjustment.warehouse_id,
      adjustment_quantity: adjustment.adjustment_quantity,
      reason: adjustment.reason || '',
    })

    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setError('')
  }

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.adjustment_quantity) {
      setError('Masukkan jumlah penyesuaian.')
      return
    }

    if (Number(form.adjustment_quantity) === 0) {
      setError('Jumlah penyesuaian tidak boleh 0.')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (editing) {
        await api.put(
          `/stock-adjustments/${editing.id}`,
          form
        )
      } else {
        await api.post(
          '/stock-adjustments',
          form
        )
      }

      closeModal()
      fetchAdjustments()
    } catch (error) {
      const errors = error.response?.data?.errors

      if (errors) {
        setError(Object.values(errors)[0]?.[0])
      } else {
        setError(
          error.response?.data?.message ||
          'Gagal menyimpan penyesuaian stok.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (adjustment) => {
    if (
      !window.confirm(
        `Hapus penyesuaian "${adjustment.number}"?`
      )
    ) {
      return
    }

    try {
      await api.delete(
        `/stock-adjustments/${adjustment.id}`
      )

      fetchAdjustments()
    } catch (error) {
      alert(
        error.response?.data?.message ||
        'Gagal menghapus penyesuaian stok.'
      )
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'

    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date))
  }

  return (
    <DashboardLayout>

      <div className="p-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <ClipboardMinus size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Penyesuaian Stok
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Koreksi stok barang berdasarkan kondisi aktual
              </p>
            </div>

          </div>

          <button
            onClick={openAdd}
            disabled={
              products.length === 0 ||
              warehouses.length === 0
            }
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            Tambah Penyesuaian
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
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Cari nomor atau barang..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />

              </div>

              <select
                value={warehouseFilter}
                onChange={(e) =>
                  setWarehouseFilter(e.target.value)
                }
                className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="">
                  Semua Gudang
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

          </div>

          {/* Table */}
          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                <tr>
                  <th className="px-6 py-4">
                    Nomor
                  </th>

                  <th className="px-6 py-4">
                    Tanggal
                  </th>

                  <th className="px-6 py-4">
                    Barang
                  </th>

                  <th className="px-6 py-4">
                    Gudang
                  </th>

                  <th className="px-6 py-4">
                    Stok Sebelum
                  </th>

                  <th className="px-6 py-4">
                    Penyesuaian
                  </th>

                  <th className="px-6 py-4">
                    Stok Sesudah
                  </th>

                  <th className="px-6 py-4">
                    Alasan
                  </th>

                  <th className="px-6 py-4 text-right">
                    Aksi
                  </th>
                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : adjustments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-12 text-center"
                    >

                      <ClipboardMinus
                        size={35}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 font-medium text-gray-600">
                        Belum ada penyesuaian stok
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        Tambahkan penyesuaian stok pertama.
                      </p>

                    </td>
                  </tr>
                ) : (
                  adjustments.map((adjustment) => {

                    const adjustmentValue =
                      Number(
                        adjustment.adjustment_quantity
                      )

                    return (
                      <tr
                        key={adjustment.id}
                        className="hover:bg-gray-50"
                      >

                        <td className="px-6 py-4 font-medium text-blue-600">
                          {adjustment.number}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(adjustment.date)}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">
                            {adjustment.product?.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {adjustment.product?.code}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {adjustment.warehouse?.name}
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {adjustment.quantity_before}
                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={
                              adjustmentValue > 0
                                ? 'font-semibold text-green-600'
                                : 'font-semibold text-red-600'
                            }
                          >
                            {adjustmentValue > 0
                              ? `+${adjustment.adjustment_quantity}`
                              : adjustment.adjustment_quantity}
                          </span>

                        </td>

                        <td className="px-6 py-4 font-semibold text-gray-800">
                          {adjustment.quantity_after}
                        </td>

                        <td className="max-w-xs px-6 py-4 text-gray-500">
                          <span className="block truncate">
                            {adjustment.reason || '-'}
                          </span>
                        </td>

                        <td className="px-6 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              onClick={() =>
                                openEdit(adjustment)
                              }
                              className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(adjustment)
                              }
                              className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={17} />
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  })
                )}

              </tbody>

            </table>

          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">

            <p className="text-sm text-gray-500">
              Total penyesuaian:{' '}
              <span className="font-semibold text-gray-800">
                {adjustments.length}
              </span>
            </p>

          </div>

        </div>

      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">

          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editing
                    ? 'Edit Penyesuaian Stok'
                    : 'Tambah Penyesuaian Stok'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Masukkan perubahan jumlah stok
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X size={20} />
              </button>

            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tanggal
                </label>

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Product + Warehouse */}
              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Barang
                  </label>

                  <select
                    name="product_id"
                    value={form.product_id}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Gudang
                  </label>

                  <select
                    name="warehouse_id"
                    value={form.warehouse_id}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
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

              </div>

              {/* Adjustment */}
              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Penyesuaian Stok
                </label>

                <input
                  type="number"
                  name="adjustment_quantity"
                  value={form.adjustment_quantity}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="Contoh: 5 atau -2"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1.5 text-xs text-gray-400">
                  Gunakan angka positif untuk menambah stok,
                  negatif untuk mengurangi stok.
                </p>

              </div>

              {/* Reason */}
              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Alasan
                </label>

                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Contoh: Barang rusak, selisih stok, barang hilang..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? 'Menyimpan...'
                    : editing
                      ? 'Simpan Perubahan'
                      : 'Simpan Penyesuaian'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </DashboardLayout>
  )
}

export default StockAdjustments
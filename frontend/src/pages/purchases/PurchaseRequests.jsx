import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ClipboardList,
  X,
} from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/api'

const emptyItem = { 
  product_id: '',
  quantity: 1,
  notes: '',
}

const initialForm = {
  date: new Date().toISOString().split('T')[0],
  supplier_id: '',
  status: 'draft',
  notes: '',
  items: [{ ...emptyItem }],
}

const statusLabels = {
  draft: 'Draft',
  submitted: 'Diajukan',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  completed: 'Selesai',
}

function PurchaseRequests() {
  const [requests, setRequests] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState(initialForm)

  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    try {
      const [
        requestRes,
        supplierRes,
        productRes,
      ] = await Promise.all([
        api.get('/purchase-requests'),
        api.get('/suppliers'),
        api.get('/products'),
      ])

      setRequests(requestRes.data)
      setSuppliers(supplierRes.data)
      setProducts(productRes.data)
    } catch (error) {
      console.error(error)
      alert('Gagal mengambil data.')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredRequests = requests.filter((request) => {
    const searchText = search.toLowerCase()

    const matchesSearch =
      request.number
        ?.toLowerCase()
        .includes(searchText) ||
      request.supplier?.name
        ?.toLowerCase()
        .includes(searchText)

    const matchesStatus =
      !statusFilter ||
      request.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const openCreateModal = () => {
    setEditingId(null)

    setForm({
      ...initialForm,
      date: new Date().toISOString().split('T')[0],
      items: [{ ...emptyItem }],
    })

    setShowModal(true)
  }

  const openEditModal = (request) => {
    setEditingId(request.id)

    setForm({
      date: request.date?.split('T')[0] || '',
      supplier_id: request.supplier_id,
      status: request.status,
      notes: request.notes || '',
      items:
        request.items?.length > 0
          ? request.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              notes: item.notes || '',
            }))
          : [{ ...emptyItem }],
    })

    setShowModal(true)
  }

  const handleItemChange = (
    index,
    field,
    value
  ) => {
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
        { ...emptyItem },
      ],
    })
  }

  const removeItem = (index) => {
    if (form.items.length === 1) {
      return
    }

    setForm({
      ...form,
      items: form.items.filter(
        (_, i) => i !== index
      ),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.supplier_id) {
      alert('Pilih supplier terlebih dahulu.')
      return
    }

    for (const item of form.items) {
      if (!item.product_id) {
        alert('Semua barang harus dipilih.')
        return
      }

      if (Number(item.quantity) <= 0) {
        alert('Qty harus lebih dari 0.')
        return
      }
    }

    const payload = {
      date: form.date,
      supplier_id: Number(form.supplier_id),
      status: form.status,
      notes: form.notes,

      items: form.items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        notes: item.notes,
      })),
    }

    try {
      setLoading(true)

      if (editingId) {
        await api.put(
          `/purchase-requests/${editingId}`,
          payload
        )
      } else {
        await api.post(
          '/purchase-requests',
          payload
        )
      }

      setShowModal(false)
      setEditingId(null)
      setForm(initialForm)

      await fetchData()

      alert(
        editingId
          ? 'Permintaan pembelian berhasil diperbarui.'
          : 'Permintaan pembelian berhasil dibuat.'
      )
    } catch (error) {
      console.error(error)

      const message =
        error.response?.data?.message ||
        'Gagal menyimpan permintaan pembelian.'

      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Yakin ingin menghapus permintaan pembelian ini?'
    )

    if (!confirmed) {
      return
    }

    try {
      await api.delete(
        `/purchase-requests/${id}`
      )

      await fetchData()

      alert(
        'Permintaan pembelian berhasil dihapus.'
      )
    } catch (error) {
      console.error(error)

      alert(
        'Gagal menghapus permintaan pembelian.'
      )
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">

          <div className="flex items-center gap-3">

            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <ClipboardList size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Permintaan Pembelian
              </h1>

              <p className="text-sm text-slate-500">
                Kelola permintaan pembelian barang
              </p>
            </div>

          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium"
          >
            <Plus size={18} />
            Tambah Permintaan
          </button>

        </div>

        {/* SEARCH */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">

          <div className="flex gap-3">

            <div className="relative flex-1">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Cari nomor atau supplier..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">
                Semua Status
              </option>

              <option value="draft">
                Draft
              </option>

              <option value="submitted">
                Diajukan
              </option>

              <option value="approved">
                Disetujui
              </option>

              <option value="rejected">
                Ditolak
              </option>

              <option value="completed">
                Selesai
              </option>
            </select>

          </div>

        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          <table className="w-full">

            <thead className="bg-slate-50 border-b border-slate-200">

              <tr>

                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  No. Permintaan
                </th>

                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  Tanggal
                </th>

                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  Supplier
                </th>

                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">
                  Jumlah Barang
                </th>

                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">
                  Status
                </th>

                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">
                  Aksi
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredRequests.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="text-center py-12 text-slate-500"
                  >
                    Belum ada data permintaan pembelian.
                  </td>

                </tr>

              ) : (

                filteredRequests.map(
                  (request) => (

                    <tr
                      key={request.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >

                      <td className="px-6 py-4 font-medium text-slate-800">
                        {request.number}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {request.date}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {request.supplier?.name || '-'}
                      </td>

                      <td className="px-6 py-4 text-center text-slate-600">
                        {request.items?.length || 0}
                      </td>

                      <td className="px-6 py-4 text-center">

                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {statusLabels[
                            request.status
                          ] || request.status}
                        </span>

                      </td>

                      <td className="px-6 py-4">

                        <div className="flex justify-center gap-2">

                          <button
                            onClick={() =>
                              openEditModal(request)
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                request.id
                              )
                            }
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={17} />
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

      </div>

      {/* MODAL */}
      {showModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">

              <div>

                <h2 className="text-xl font-bold text-slate-800">
                  {editingId
                    ? 'Edit Permintaan Pembelian'
                    : 'Tambah Permintaan Pembelian'}
                </h2>

                <p className="text-sm text-slate-500">
                  Isi barang yang ingin dibeli
                </p>

              </div>

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6"
            >

              {/* HEADER DATA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tanggal
                  </label>

                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"
                    required
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Supplier
                  </label>

                  <select
                    value={form.supplier_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        supplier_id:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"
                    required
                  >

                    <option value="">
                      Pilih supplier
                    </option>

                    {suppliers.map(
                      (supplier) => (

                        <option
                          key={supplier.id}
                          value={supplier.id}
                        >
                          {supplier.code} -{' '}
                          {supplier.name}
                        </option>

                      )
                    )}

                  </select>

                </div>

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
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
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"
                  >

                    <option value="draft">
                      Draft
                    </option>

                    <option value="submitted">
                      Diajukan
                    </option>

                    <option value="approved">
                      Disetujui
                    </option>

                    <option value="rejected">
                      Ditolak
                    </option>

                    <option value="completed">
                      Selesai
                    </option>

                  </select>

                </div>

              </div>

              {/* ITEMS */}
              <div>

                <div className="flex items-center justify-between mb-3">

                  <h3 className="font-semibold text-slate-800">
                    Barang yang Diminta
                  </h3>

                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus size={16} />
                    Tambah Barang
                  </button>

                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">

                  <table className="w-full">

                    <thead className="bg-slate-50">

                      <tr>

                        <th className="text-left px-4 py-3 text-sm">
                          Barang
                        </th>

                        <th className="text-right px-4 py-3 text-sm">
                          Qty
                        </th>

                        <th className="text-left px-4 py-3 text-sm">
                          Keterangan
                        </th>

                        <th className="w-12"></th>

                      </tr>

                    </thead>

                    <tbody>

                      {form.items.map(
                        (item, index) => (

                          <tr
                            key={index}
                            className="border-t border-slate-100"
                          >

                            <td className="px-4 py-3">

                              <select
                                value={
                                  item.product_id
                                }
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    'product_id',
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                required
                              >

                                <option value="">
                                  Pilih barang
                                </option>

                                {products.map(
                                  (product) => (

                                    <option
                                      key={product.id}
                                      value={product.id}
                                    >
                                      {product.code} -{' '}
                                      {product.name}
                                    </option>

                                  )
                                )}

                              </select>

                            </td>

                            <td className="px-4 py-3">

                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={
                                  item.quantity
                                }
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    'quantity',
                                    e.target.value
                                  )
                                }
                                className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-right"
                                required
                              />

                            </td>

                            <td className="px-4 py-3">

                              <input
                                type="text"
                                value={item.notes}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    'notes',
                                    e.target.value
                                  )
                                }
                                placeholder="Keterangan..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                              />

                            </td>

                            <td className="px-4 py-3">

                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(index)
                                }
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </button>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

              {/* NOTES */}
              <div>

                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Catatan
                </label>

                <textarea
                  rows="4"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Catatan permintaan pembelian..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"
                />

              </div>

              {/* BUTTON */}
              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading
                    ? 'Menyimpan...'
                    : editingId
                      ? 'Simpan Perubahan'
                      : 'Simpan Permintaan'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </DashboardLayout>
  )
}

export default PurchaseRequests
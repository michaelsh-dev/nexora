import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FileText,
  X,
} from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/api'

const emptyItem = {
  product_id: '',
  quantity: 1,
  price: 0,
  discount: 0,
}

const initialForm = {
  date: new Date().toISOString().split('T')[0],
  customer_id: '',
  valid_until: '',
  discount: 0,
  tax: 0,
  status: 'draft',
  notes: '',
  items: [{ ...emptyItem }],
}

const statusLabels = {
  draft: 'Draft',
  sent: 'Dikirim',
  accepted: 'Diterima',
  rejected: 'Ditolak',
  expired: 'Kadaluarsa',
}

function SalesQuotations() {
  const [quotations, setQuotations] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState(initialForm)

  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    try {
      const [quotationRes, customerRes, productRes] =
        await Promise.all([
          api.get('/sales-quotations'),
          api.get('/customers'),
          api.get('/products'),
        ])

      setQuotations(quotationRes.data)
      setCustomers(customerRes.data)
      setProducts(productRes.data)
    } catch (error) {
      console.error(error)
      alert('Gagal mengambil data.')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredQuotations = quotations.filter((quotation) => {
    const searchText = search.toLowerCase()

    const matchesSearch =
      quotation.number?.toLowerCase().includes(searchText) ||
      quotation.customer?.name?.toLowerCase().includes(searchText)

    const matchesStatus =
      !statusFilter ||
      quotation.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getItemSubtotal = (item) => {
    const quantity = Number(item.quantity) || 0
    const price = Number(item.price) || 0
    const discount = Number(item.discount) || 0

    const gross = quantity * price
    const discountAmount = gross * (discount / 100)

    return gross - discountAmount
  }

  const subtotal = form.items.reduce(
    (sum, item) => sum + getItemSubtotal(item),
    0
  )

  const invoiceDiscount = Number(form.discount) || 0

  const invoiceDiscountAmount =
    subtotal * (invoiceDiscount / 100)

  const afterDiscount = Math.max(
    0,
    subtotal - invoiceDiscountAmount
  )

  const taxRate = Number(form.tax) || 0

  const taxAmount =
    afterDiscount * (taxRate / 100)

  const total = afterDiscount + taxAmount

  const openCreateModal = () => {
    setEditingId(null)

    setForm({
      ...initialForm,
      date: new Date().toISOString().split('T')[0],
      items: [{ ...emptyItem }],
    })

    setShowModal(true)
  }

  const openEditModal = (quotation) => {
    setEditingId(quotation.id)

    setForm({
      date: quotation.date?.split('T')[0] || '',
      customer_id: quotation.customer_id,
      valid_until:
        quotation.valid_until?.split('T')[0] || '',
      discount: quotation.discount || 0,
      tax:
        quotation.tax && quotation.total
          ? 0
          : 0,
      status: quotation.status,
      notes: quotation.notes || '',
      items:
        quotation.items?.length > 0
          ? quotation.items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
          }))
          : [{ ...emptyItem }],
    })

    setShowModal(true)
  }

  const handleCustomerChange = (e) => {
    setForm({
      ...form,
      customer_id: e.target.value,
    })
  }

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...form.items]

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    }

    if (field === 'product_id') {
      const product = products.find(
        (p) => String(p.id) === String(value)
      )

      if (product) {
        updatedItems[index].price =
          product.selling_price || 0
      }
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

    const updatedItems = form.items.filter(
      (_, i) => i !== index
    )

    setForm({
      ...form,
      items: updatedItems,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.customer_id) {
      alert('Pilih pelanggan terlebih dahulu.')
      return
    }

    if (form.items.length === 0) {
      alert('Tambahkan minimal satu barang.')
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
      customer_id: Number(form.customer_id),
      valid_until: form.valid_until || null,
      discount: Number(form.discount) || 0,
      tax: Number(form.tax) || 0,
      status: form.status,
      notes: form.notes,

      items: form.items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        price: Number(item.price),
        discount: Number(item.discount) || 0,
      })),
    }

    try {
      setLoading(true)

      if (editingId) {
        await api.put(
          `/sales-quotations/${editingId}`,
          payload
        )
      } else {
        await api.post(
          '/sales-quotations',
          payload
        )
      }

      setShowModal(false)
      setEditingId(null)
      setForm(initialForm)

      await fetchData()

      alert(
        editingId
          ? 'Penawaran berhasil diperbarui.'
          : 'Penawaran berhasil dibuat.'
      )
    } catch (error) {
      console.error(error)

      const message =
        error.response?.data?.message ||
        'Gagal menyimpan penawaran.'

      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Yakin ingin menghapus penawaran ini?'
    )

    if (!confirmDelete) {
      return
    }

    try {
      await api.delete(
        `/sales-quotations/${id}`
      )

      await fetchData()

      alert('Penawaran berhasil dihapus.')
    } catch (error) {
      console.error(error)

      alert('Gagal menghapus penawaran.')
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(
      'id-ID',
      {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }
    ).format(Number(value) || 0)
  }

  return (
    <DashboardLayout>
      <div className="p-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <FileText size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Penawaran Penjualan
              </h1>

              <p className="text-sm text-slate-500">
                Kelola penawaran harga kepada pelanggan
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium"
          >
            <Plus size={18} />
            Tambah Penawaran
          </button>
        </div>

        {/* SEARCH + FILTER */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex gap-3">

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Cari nomor penawaran atau pelanggan..."
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

              <option value="sent">
                Dikirim
              </option>

              <option value="accepted">
                Diterima
              </option>

              <option value="rejected">
                Ditolak
              </option>

              <option value="expired">
                Kadaluarsa
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
                  No. Penawaran
                </th>

                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  Tanggal
                </th>

                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  Pelanggan
                </th>

                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">
                  Total
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
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-12 text-slate-500"
                  >
                    Belum ada data penawaran.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map(
                  (quotation) => (
                    <tr
                      key={quotation.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {quotation.number}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {quotation.date}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {quotation.customer?.name ||
                          '-'}
                      </td>

                      <td className="px-6 py-4 text-right font-medium text-slate-800">
                        {formatCurrency(
                          quotation.total
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {statusLabels[
                            quotation.status
                          ] || quotation.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">

                          <button
                            onClick={() =>
                              openEditModal(
                                quotation
                              )
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                quotation.id
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
                    ? 'Edit Penawaran'
                    : 'Tambah Penawaran'}
                </h2>

                <p className="text-sm text-slate-500">
                  Isi informasi penawaran penjualan
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

            {/* FORM */}
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
                    Pelanggan
                  </label>

                  <select
                    value={form.customer_id}
                    onChange={handleCustomerChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"
                    required
                  >
                    <option value="">
                      Pilih pelanggan
                    </option>

                    {customers.map(
                      (customer) => (
                        <option
                          key={customer.id}
                          value={customer.id}
                        >
                          {customer.code} -{' '}
                          {customer.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Berlaku Sampai
                  </label>

                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        valid_until:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* ITEMS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800">
                    Barang
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

                        <th className="text-right px-4 py-3 text-sm">
                          Harga
                        </th>

                        <th className="text-right px-4 py-3 text-sm">
                          Diskon (%)
                        </th>

                        <th className="text-right px-4 py-3 text-sm">
                          Subtotal
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
                                      key={
                                        product.id
                                      }
                                      value={
                                        product.id
                                      }
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
                                className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-right"
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
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    'price',
                                    e.target.value
                                  )
                                }
                                className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-right"
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
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    'discount',
                                    e.target.value
                                  )
                                }
                                className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-right"
                              />
                            </td>

                            <td className="px-4 py-3 text-right font-medium">
                              {formatCurrency(
                                getItemSubtotal(
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
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2
                                  size={16}
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

              {/* BOTTOM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* STATUS + NOTES */}
                <div className="space-y-4">

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

                      <option value="sent">
                        Dikirim
                      </option>

                      <option value="accepted">
                        Diterima
                      </option>

                      <option value="rejected">
                        Ditolak
                      </option>

                      <option value="expired">
                        Kadaluarsa
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
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
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"
                      placeholder="Catatan penawaran..."
                    />
                  </div>

                </div>

                {/* TOTAL */}
                <div className="bg-slate-50 rounded-xl p-5">

                  <div className="flex justify-between mb-3">
                    <span className="text-slate-600">
                      Subtotal
                    </span>

                    <span className="font-medium">
                      {formatCurrency(
                        subtotal
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-600">
                      Diskon (%)
                    </span>

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
                      className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-right"
                    />
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-600">
                      Pajak (%)
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.tax}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tax: e.target.value,
                        })
                      }
                      className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-right"
                    />
                  </div>

                  <div className="border-t border-slate-200 pt-4 flex justify-between">
                    <span className="text-lg font-bold text-slate-800">
                      Total
                    </span>

                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(total)}
                    </span>
                  </div>

                </div>

              </div>

              {/* BUTTON */}
              <div className="flex justify-end gap-3 pt-2">

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
                      : 'Simpan Penawaran'}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default SalesQuotations
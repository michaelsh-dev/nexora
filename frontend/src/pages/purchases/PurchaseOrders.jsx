import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ShoppingCart,
} from 'lucide-react'
import api from '../../services/api'
import DashboardLayout from '../../layouts/DashboardLayout'

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
  }).format(Number(value || 0))

const emptyItem = {
  product_id: '',
  quantity: 1,
  price: 0,
  discount: 0,
}

function PurchaseOrders() {
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [purchaseRequests, setPurchaseRequests] = useState([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier_id: '',
    purchase_request_id: '',
    discount: 0,
    tax: 0,
    status: 'draft',
    notes: '',
    items: [{ ...emptyItem }],
  })

  const loadData = async () => {
    try {
      const [
        ordersRes,
        suppliersRes,
        productsRes,
        requestsRes,
      ] = await Promise.all([
        api.get('/purchase-orders'),
        api.get('/suppliers'),
        api.get('/products'),
        api.get('/purchase-requests'),
      ])

      setOrders(ordersRes.data)
      setSuppliers(suppliersRes.data)
      setProducts(productsRes.data)
      setPurchaseRequests(requestsRes.data)
    } catch (error) {
      console.error(error)
      alert('Gagal mengambil data.')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const keyword = search.toLowerCase()

      const matchesSearch =
        order.number?.toLowerCase().includes(keyword) ||
        order.supplier?.name?.toLowerCase().includes(keyword)

      const matchesStatus =
        !statusFilter ||
        order.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [orders, search, statusFilter])

  const subtotal = useMemo(() => {
    return form.items.reduce((total, item) => {
      const gross =
        Number(item.quantity || 0) *
        Number(item.price || 0)

      const discount =
        gross *
        (Number(item.discount || 0) / 100)

      return total + (gross - discount)
    }, 0)
  }, [form.items])

  const discountAmount =
    subtotal * (Number(form.discount || 0) / 100)

  const afterDiscount =
    subtotal - discountAmount

  const taxAmount =
    afterDiscount * (Number(form.tax || 0) / 100)

  const total =
    afterDiscount + taxAmount

  const openCreate = () => {
    setEditingId(null)

    setForm({
      date: new Date().toISOString().split('T')[0],
      supplier_id: '',
      purchase_request_id: '',
      discount: 0,
      tax: 0,
      status: 'draft',
      notes: '',
      items: [{ ...emptyItem }],
    })

    setShowModal(true)
  }

  const openEdit = (order) => {
    setEditingId(order.id)

    setForm({
      date: order.date?.slice(0, 10),
      supplier_id: order.supplier_id,
      purchase_request_id:
        order.purchase_request_id || '',
      discount: order.discount || 0,
      tax: order.tax
        ? ((Number(order.tax) /
            Math.max(
              Number(order.subtotal || 0) -
              Number(order.subtotal || 0) *
              (Number(order.discount || 0) / 100),
              1
            )) * 100).toFixed(2)
        : 0,
      status: order.status,
      notes: order.notes || '',
      items: order.items?.map((item) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
        price: Number(item.price),
        discount: Number(item.discount || 0),
      })) || [{ ...emptyItem }],
    })

    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
  }

  const updateItem = (index, field, value) => {
    const items = [...form.items]

    items[index] = {
      ...items[index],
      [field]: value,
    }

    if (field === 'product_id') {
      const product = products.find(
        (p) => String(p.id) === String(value)
      )

      if (product) {
        items[index].price =
          Number(product.purchase_price || 0)
      }
    }

    setForm({
      ...form,
      items,
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
    if (form.items.length === 1) return

    setForm({
      ...form,
      items: form.items.filter(
        (_, i) => i !== index
      ),
    })
  }

  const loadPurchaseRequest = (requestId) => {
    const request = purchaseRequests.find(
      (item) =>
        String(item.id) === String(requestId)
    )

    if (!request) return

    setForm((prev) => ({
      ...prev,
      supplier_id: request.supplier_id,
      purchase_request_id: request.id,
      items:
        request.items?.map((item) => {
          const product = products.find(
            (p) => p.id === item.product_id
          )

          return {
            product_id: item.product_id,
            quantity: Number(item.quantity),
            price: Number(
              product?.purchase_price || 0
            ),
            discount: 0,
          }
        }) || [{ ...emptyItem }],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.supplier_id) {
      alert('Supplier wajib dipilih.')
      return
    }

    if (form.items.length === 0) {
      alert('Minimal satu barang.')
      return
    }

    try {
      const payload = {
        date: form.date,
        supplier_id: Number(form.supplier_id),
        purchase_request_id:
          form.purchase_request_id
            ? Number(form.purchase_request_id)
            : null,
        discount: Number(form.discount || 0),
        tax: Number(form.tax || 0),
        status: form.status,
        notes: form.notes,
        items: form.items.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          price: Number(item.price),
          discount: Number(item.discount || 0),
        })),
      }

      if (editingId) {
        await api.put(
          `/purchase-orders/${editingId}`,
          payload
        )
      } else {
        await api.post(
          '/purchase-orders',
          payload
        )
      }

      closeModal()
      loadData()
    } catch (error) {
      console.error(error)

      const message =
        error.response?.data?.message ||
        'Gagal menyimpan Pesanan Pembelian.'

      alert(message)
    }
  }

  const handleDelete = async (id) => {
    if (
      !confirm(
        'Yakin ingin menghapus Pesanan Pembelian ini?'
      )
    ) {
      return
    }

    try {
      await api.delete(`/purchase-orders/${id}`)
      loadData()
    } catch (error) {
      console.error(error)
      alert('Gagal menghapus data.')
    }
  }

  const statusLabel = {
    draft: 'Draft',
    ordered: 'Dipesan',
    received: 'Diterima',
    cancelled: 'Dibatalkan',
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Pesanan Pembelian
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola pesanan pembelian kepada supplier.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Tambah Pesanan
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row">
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
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="ordered">Dipesan</option>
              <option value="received">Diterima</option>
              <option value="cancelled">
                Dibatalkan
              </option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">
                    No. PO
                  </th>

                  <th className="px-5 py-3 text-left font-semibold text-slate-600">
                    Tanggal
                  </th>

                  <th className="px-5 py-3 text-left font-semibold text-slate-600">
                    Supplier
                  </th>

                  <th className="px-5 py-3 text-left font-semibold text-slate-600">
                    Permintaan
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-slate-600">
                    Total
                  </th>

                  <th className="px-5 py-3 text-center font-semibold text-slate-600">
                    Status
                  </th>

                  <th className="px-5 py-3 text-center font-semibold text-slate-600">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      Belum ada Pesanan Pembelian.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {order.number}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {order.date?.slice(0, 10)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {order.supplier?.name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {order.purchaseRequest?.number ||
                          '-'}
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-slate-700">
                        {formatRupiah(order.total)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {statusLabel[order.status] ||
                            order.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() =>
                              openEdit(order)
                            }
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(order.id)
                            }
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
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
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <ShoppingCart size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-800">
                    {editingId
                      ? 'Edit Pesanan Pembelian'
                      : 'Tambah Pesanan Pembelian'}
                  </h2>

                  <p className="text-xs text-slate-500">
                    Buat pesanan barang kepada supplier.
                  </p>
                </div>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Supplier
                  </label>

                  <select
                    value={form.supplier_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        supplier_id: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    required
                  >
                    <option value="">
                      Pilih Supplier
                    </option>

                    {suppliers.map((supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {supplier.code} -{' '}
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Dari Permintaan Pembelian
                  </label>

                  <select
                    value={form.purchase_request_id}
                    onChange={(e) =>
                      loadPurchaseRequest(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="">
                      Tidak dari permintaan
                    </option>

                    {purchaseRequests.map(
                      (request) => (
                        <option
                          key={request.id}
                          value={request.id}
                        >
                          {request.number}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="draft">
                      Draft
                    </option>
                    <option value="ordered">
                      Dipesan
                    </option>
                    <option value="received">
                      Diterima
                    </option>
                    <option value="cancelled">
                      Dibatalkan
                    </option>
                  </select>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-3 text-left">
                        Barang
                      </th>

                      <th className="w-28 px-3 py-3 text-right">
                        Qty
                      </th>

                      <th className="w-40 px-3 py-3 text-right">
                        Harga
                      </th>

                      <th className="w-28 px-3 py-3 text-right">
                        Diskon %
                      </th>

                      <th className="w-40 px-3 py-3 text-right">
                        Subtotal
                      </th>

                      <th className="w-16 px-3 py-3">
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {form.items.map(
                      (item, index) => {
                        const gross =
                          Number(
                            item.quantity || 0
                          ) *
                          Number(
                            item.price || 0
                          )

                        const itemDiscount =
                          gross *
                          (Number(
                            item.discount || 0
                          ) / 100)

                        const itemSubtotal =
                          gross -
                          itemDiscount

                        return (
                          <tr
                            key={index}
                            className="border-t border-slate-100"
                          >
                            <td className="px-3 py-3">
                              <select
                                value={
                                  item.product_id
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'product_id',
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                required
                              >
                                <option value="">
                                  Pilih Barang
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
                                      {
                                        product.name
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={
                                  item.quantity
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'quantity',
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right"
                                required
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  item.price
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'price',
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right"
                                required
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={
                                  item.discount
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'discount',
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right"
                              />
                            </td>

                            <td className="px-3 py-3 text-right font-medium">
                              {formatRupiah(
                                itemSubtotal
                              )}
                            </td>

                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(
                                    index
                                  )
                                }
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>
                            </td>
                          </tr>
                        )
                      }
                    )}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                + Tambah Barang
              </button>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    placeholder="Catatan pesanan..."
                  />
                </div>

                <div className="rounded-lg bg-slate-50 p-5">
                  <div className="flex justify-between py-2 text-sm">
                    <span>Subtotal</span>
                    <span>
                      {formatRupiah(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 text-sm">
                    <span>Diskon</span>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={form.discount}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            discount:
                              e.target.value,
                          })
                        }
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-right"
                      />

                      <span>%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 text-sm">
                    <span>Pajak</span>

                    <div className="flex items-center gap-2">
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
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-right"
                      />

                      <span>%</span>
                    </div>
                  </div>

                  <div className="my-3 border-t border-slate-200" />

                  <div className="flex justify-between text-lg font-bold text-slate-800">
                    <span>Total</span>

                    <span>
                      {formatRupiah(total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {editingId
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

export default PurchaseOrders
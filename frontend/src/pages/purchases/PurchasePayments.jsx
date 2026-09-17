import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Wallet,
} from 'lucide-react'
import api from '../../services/api'
import DashboardLayout from '../../layouts/DashboardLayout'

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
  }).format(Number(value || 0))

const paymentLabels = {
  cash: 'Tunai',
  bank_transfer: 'Transfer Bank',
  credit_card: 'Kartu Kredit',
  debit_card: 'Kartu Debit',
  other: 'Lainnya',
}

function PurchasePayments() {
  const [payments, setPayments] = useState([])
  const [invoices, setInvoices] = useState([])

  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    purchase_invoice_id: '',
    amount: '',
    payment_method: 'bank_transfer',
    notes: '',
  })

  const loadData = async () => {
    try {
      const [
        paymentsRes,
        invoicesRes,
      ] = await Promise.all([
        api.get('/purchase-payments'),
        api.get('/purchase-invoices'),
      ])

      setPayments(paymentsRes.data)
      setInvoices(invoicesRes.data)
    } catch (error) {
      console.error(error)
      alert('Gagal mengambil data.')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredPayments = useMemo(() => {
    const keyword = search.toLowerCase()

    return payments.filter((payment) =>
      payment.number
        ?.toLowerCase()
        .includes(keyword) ||
      payment.purchaseInvoice?.number
        ?.toLowerCase()
        .includes(keyword) ||
      payment.purchaseInvoice?.supplier?.name
        ?.toLowerCase()
        .includes(keyword)
    )
  }, [payments, search])

  const selectedInvoice = invoices.find(
    (invoice) =>
      String(invoice.id) ===
      String(form.purchase_invoice_id)
  )

  const getPaid = (invoice) => {
    if (!invoice) return 0

    return payments
      .filter(
        (payment) =>
          payment.purchase_invoice_id ===
          invoice.id &&
          payment.id !== editingId
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      )
  }

  const remaining = selectedInvoice
    ? Math.max(
        Number(selectedInvoice.total || 0) -
          getPaid(selectedInvoice),
        0
      )
    : 0

  const openCreate = () => {
    setEditingId(null)

    setForm({
      date: new Date().toISOString().split('T')[0],
      purchase_invoice_id: '',
      amount: '',
      payment_method: 'bank_transfer',
      notes: '',
    })

    setShowModal(true)
  }

  const openEdit = (payment) => {
    setEditingId(payment.id)

    setForm({
      date: payment.date?.slice(0, 10),
      purchase_invoice_id:
        payment.purchase_invoice_id,
      amount: Number(payment.amount),
      payment_method:
        payment.payment_method,
      notes: payment.notes || '',
    })

    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
  }

  const handleInvoiceChange = (value) => {
    const invoice = invoices.find(
      (item) =>
        String(item.id) === String(value)
    )

    const paid = invoice
      ? getPaid(invoice)
      : 0

    const invoiceRemaining = invoice
      ? Math.max(
          Number(invoice.total || 0) - paid,
          0
        )
      : 0

    setForm((prev) => ({
      ...prev,
      purchase_invoice_id: value,
      amount:
        invoiceRemaining > 0
          ? invoiceRemaining
          : '',
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.purchase_invoice_id) {
      alert('Faktur Pembelian wajib dipilih.')
      return
    }

    if (Number(form.amount) <= 0) {
      alert('Jumlah pembayaran harus lebih dari 0.')
      return
    }

    try {
      const payload = {
        date: form.date,
        purchase_invoice_id:
          Number(form.purchase_invoice_id),
        amount: Number(form.amount),
        payment_method:
          form.payment_method,
        notes: form.notes,
      }

      if (editingId) {
        await api.put(
          `/purchase-payments/${editingId}`,
          payload
        )
      } else {
        await api.post(
          '/purchase-payments',
          payload
        )
      }

      closeModal()
      await loadData()
    } catch (error) {
      console.error(error)

      alert(
        error.response?.data?.message ||
          'Gagal menyimpan pembayaran.'
      )
    }
  }

  const handleDelete = async (id) => {
    if (
      !confirm(
        'Yakin ingin menghapus pembayaran ini?'
      )
    ) {
      return
    }

    try {
      await api.delete(
        `/purchase-payments/${id}`
      )

      await loadData()
    } catch (error) {
      console.error(error)
      alert(
        error.response?.data?.message ||
          'Gagal menghapus pembayaran.'
      )
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Pembayaran Pembelian
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola pembayaran kepada supplier.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Tambah Pembayaran
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="relative max-w-xl">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Cari nomor pembayaran, faktur, atau supplier..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left">
                    No. Pembayaran
                  </th>

                  <th className="px-5 py-3 text-left">
                    Tanggal
                  </th>

                  <th className="px-5 py-3 text-left">
                    Faktur
                  </th>

                  <th className="px-5 py-3 text-left">
                    Supplier
                  </th>

                  <th className="px-5 py-3 text-right">
                    Jumlah
                  </th>

                  <th className="px-5 py-3 text-left">
                    Metode
                  </th>

                  <th className="px-5 py-3 text-center">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      Belum ada pembayaran.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(
                    (payment) => (
                      <tr
                        key={payment.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {payment.number}
                        </td>

                        <td className="px-5 py-4">
                          {payment.date?.slice(
                            0,
                            10
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {
                            payment
                              .purchaseInvoice
                              ?.number
                          }
                        </td>

                        <td className="px-5 py-4">
                          {
                            payment
                              .purchaseInvoice
                              ?.supplier
                              ?.name
                          }
                        </td>

                        <td className="px-5 py-4 text-right font-medium">
                          {formatRupiah(
                            payment.amount
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {
                            paymentLabels[
                              payment.payment_method
                            ]
                          }
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() =>
                                openEdit(
                                  payment
                                )
                              }
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(
                                  payment.id
                                )
                              }
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
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
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <Wallet size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-800">
                    {editingId
                      ? 'Edit Pembayaran'
                      : 'Tambah Pembayaran'}
                  </h2>

                  <p className="text-xs text-slate-500">
                    Catat pembayaran faktur supplier.
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
              className="space-y-5 p-6"
            >
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
                  Faktur Pembelian
                </label>

                <select
                  value={
                    form.purchase_invoice_id
                  }
                  onChange={(e) =>
                    handleInvoiceChange(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  required
                >
                  <option value="">
                    Pilih Faktur
                  </option>

                  {invoices
                    .filter(
                      (invoice) =>
                        ![
                          'draft',
                          'cancelled',
                        ].includes(
                          invoice.status
                        )
                    )
                    .map((invoice) => (
                      <option
                        key={invoice.id}
                        value={invoice.id}
                      >
                        {invoice.number} -{' '}
                        {invoice.supplier?.name}
                      </option>
                    ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="rounded-lg bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between">
                    <span>Total Faktur</span>

                    <span className="font-medium">
                      {formatRupiah(
                        selectedInvoice.total
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between">
                    <span>Sisa Tagihan</span>

                    <span className="font-semibold text-blue-600">
                      {formatRupiah(remaining)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Jumlah Pembayaran
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amount: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Metode Pembayaran
                </label>

                <select
                  value={form.payment_method}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      payment_method:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
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

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {editingId
                    ? 'Simpan Perubahan'
                    : 'Simpan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default PurchasePayments
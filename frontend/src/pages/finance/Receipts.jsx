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

function Receipts() {
  const [receipts, setReceipts] = useState([])
  const [cashBanks, setCashBanks] = useState([])

  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    cash_bank_id: '',
    source: '',
    amount: '',
    description: '',
  })

  const loadData = async () => {
    try {
      const [
        receiptsRes,
        cashBanksRes,
      ] = await Promise.all([
        api.get('/receipts'),
        api.get('/cash-banks'),
      ])

      setReceipts(receiptsRes.data)
      setCashBanks(cashBanksRes.data)
    } catch (error) {
      console.error(error)
      alert('Gagal mengambil data.')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredReceipts = useMemo(() => {
    const keyword = search.toLowerCase()

    return receipts.filter((receipt) => {
      return (
        receipt.number
          ?.toLowerCase()
          .includes(keyword) ||
        receipt.source
          ?.toLowerCase()
          .includes(keyword) ||
        receipt.cashBank?.name
          ?.toLowerCase()
          .includes(keyword)
      )
    })
  }, [receipts, search])

  const openCreate = () => {
    setEditingId(null)

    setForm({
      date: new Date().toISOString().split('T')[0],
      cash_bank_id: '',
      source: '',
      amount: '',
      description: '',
    })

    setShowModal(true)
  }

  const openEdit = (receipt) => {
    setEditingId(receipt.id)

    setForm({
      date: receipt.date?.slice(0, 10),
      cash_bank_id: receipt.cash_bank_id,
      source: receipt.source,
      amount: Number(receipt.amount),
      description: receipt.description || '',
    })

    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.cash_bank_id) {
      alert('Kas atau Bank wajib dipilih.')
      return
    }

    if (!form.source.trim()) {
      alert('Sumber penerimaan wajib diisi.')
      return
    }

    if (Number(form.amount) <= 0) {
      alert('Jumlah penerimaan harus lebih dari 0.')
      return
    }

    try {
      const payload = {
        date: form.date,
        cash_bank_id: Number(form.cash_bank_id),
        source: form.source,
        amount: Number(form.amount),
        description: form.description,
      }

      if (editingId) {
        await api.put(
          `/receipts/${editingId}`,
          payload
        )
      } else {
        await api.post(
          '/receipts',
          payload
        )
      }

      closeModal()
      await loadData()
    } catch (error) {
      console.error(error)

      alert(
        error.response?.data?.message ||
          'Gagal menyimpan Penerimaan.'
      )
    }
  }

  const handleDelete = async (id) => {
    if (
      !confirm(
        'Yakin ingin menghapus Penerimaan ini?'
      )
    ) {
      return
    }

    try {
      await api.delete(`/receipts/${id}`)
      await loadData()
    } catch (error) {
      console.error(error)

      alert(
        error.response?.data?.message ||
          'Gagal menghapus data.'
      )
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Penerimaan
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola transaksi uang masuk ke Kas & Bank.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Tambah Penerimaan
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
                placeholder="Cari nomor, sumber, atau Kas & Bank..."
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
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">
                    No. Penerimaan
                  </th>

                  <th className="px-5 py-3 text-left font-semibold text-slate-600">
                    Tanggal
                  </th>

                  <th className="px-5 py-3 text-left font-semibold text-slate-600">
                    Kas & Bank
                  </th>

                  <th className="px-5 py-3 text-left font-semibold text-slate-600">
                    Sumber
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-slate-600">
                    Jumlah
                  </th>

                  <th className="px-5 py-3 text-center font-semibold text-slate-600">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      Belum ada Penerimaan.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((receipt) => (
                    <tr
                      key={receipt.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {receipt.number}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {receipt.date?.slice(0, 10)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {receipt.cashBank?.name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {receipt.source}
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-slate-700">
                        {formatRupiah(receipt.amount)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() =>
                              openEdit(receipt)
                            }
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(receipt.id)
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
          <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <Wallet size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-800">
                    {editingId
                      ? 'Edit Penerimaan'
                      : 'Tambah Penerimaan'}
                  </h2>

                  <p className="text-xs text-slate-500">
                    Catat uang masuk ke Kas & Bank.
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
                  Kas & Bank
                </label>

                <select
                  value={form.cash_bank_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cash_bank_id:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  required
                >
                  <option value="">
                    Pilih Kas & Bank
                  </option>

                  {cashBanks
                    .filter(
                      (item) =>
                        item.status === 'active'
                    )
                    .map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.code} - {item.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Sumber Penerimaan
                </label>

                <input
                  type="text"
                  value={form.source}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      source: e.target.value,
                    })
                  }
                  placeholder="Contoh: Pendapatan Lain-lain"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Jumlah
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
                  Keterangan
                </label>

                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  placeholder="Keterangan transaksi..."
                />
              </div>

              <div className="flex justify-end gap-3">
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

export default Receipts
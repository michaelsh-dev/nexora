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

const typeLabel = {
  cash: 'Kas',
  bank: 'Bank',
}

function CashBanks() {
  const [cashBanks, setCashBanks] = useState([])

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'cash',
    opening_balance: 0,
    status: 'active',
    description: '',
  })

  const loadData = async () => {
    try {
      const response = await api.get('/cash-banks')
      setCashBanks(response.data)
    } catch (error) {
      console.error(error)
      alert('Gagal mengambil data Kas & Bank.')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredCashBanks = useMemo(() => {
    const keyword = search.toLowerCase()

    return cashBanks.filter((item) => {
      const matchesSearch =
        item.code?.toLowerCase().includes(keyword) ||
        item.name?.toLowerCase().includes(keyword)

      const matchesType =
        !typeFilter ||
        item.type === typeFilter

      return matchesSearch && matchesType
    })
  }, [cashBanks, search, typeFilter])

  const openCreate = () => {
    setEditingId(null)

    setForm({
      code: '',
      name: '',
      type: 'cash',
      opening_balance: 0,
      status: 'active',
      description: '',
    })

    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditingId(item.id)

    setForm({
      code: item.code,
      name: item.name,
      type: item.type,
      opening_balance: Number(
        item.opening_balance || 0
      ),
      status: item.status,
      description: item.description || '',
    })

    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.code.trim()) {
      alert('Kode wajib diisi.')
      return
    }

    if (!form.name.trim()) {
      alert('Nama wajib diisi.')
      return
    }

    try {
      const payload = {
        code: form.code,
        name: form.name,
        type: form.type,
        opening_balance:
          Number(form.opening_balance || 0),
        status: form.status,
        description: form.description,
      }

      if (editingId) {
        await api.put(
          `/cash-banks/${editingId}`,
          payload
        )
      } else {
        await api.post(
          '/cash-banks',
          payload
        )
      }

      closeModal()
      await loadData()
    } catch (error) {
      console.error(error)

      alert(
        error.response?.data?.message ||
          'Gagal menyimpan Kas & Bank.'
      )
    }
  }

  const handleDelete = async (id) => {
    if (
      !confirm(
        'Yakin ingin menghapus Kas & Bank ini?'
      )
    ) {
      return
    }

    try {
      await api.delete(`/cash-banks/${id}`)
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
              Kas & Bank
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola rekening kas dan bank perusahaan.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Tambah Kas & Bank
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
                placeholder="Cari kode atau nama..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">
                Semua Tipe
              </option>

              <option value="cash">
                Kas
              </option>

              <option value="bank">
                Bank
              </option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">
                    Kode
                  </th>

                  <th className="px-5 py-3 text-left font-semibold text-slate-600">
                    Nama
                  </th>

                  <th className="px-5 py-3 text-left font-semibold text-slate-600">
                    Tipe
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-slate-600">
                    Saldo Awal
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
                {filteredCashBanks.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      Belum ada data Kas & Bank.
                    </td>
                  </tr>
                ) : (
                  filteredCashBanks.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {item.code}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {typeLabel[item.type]}
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-slate-700">
                        {formatRupiah(
                          item.opening_balance
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            item.status === 'active'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.status === 'active'
                            ? 'Aktif'
                            : 'Nonaktif'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() =>
                              openEdit(item)
                            }
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(item.id)
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
                      ? 'Edit Kas & Bank'
                      : 'Tambah Kas & Bank'}
                  </h2>

                  <p className="text-xs text-slate-500">
                    Kelola rekening keuangan perusahaan.
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
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Kode
                  </label>

                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        code: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    placeholder="KAS-001"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Nama
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    placeholder="Kas Utama"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tipe
                  </label>

                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="cash">
                      Kas
                    </option>

                    <option value="bank">
                      Bank
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Saldo Awal
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.opening_balance}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        opening_balance:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  />
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
                    <option value="active">
                      Aktif
                    </option>

                    <option value="inactive">
                      Nonaktif
                    </option>
                  </select>
                </div>
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
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  placeholder="Keterangan..."
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
                    : 'Simpan Kas & Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default CashBanks
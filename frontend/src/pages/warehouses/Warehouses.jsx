import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Warehouse as WarehouseIcon,
} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/api'

function Warehouses() {
  const [warehouses, setWarehouses] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const [form, setForm] = useState({
    code: '',
    name: '',
    location: '',
    description: '',
    status: 'active',
  })

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchWarehouses = async () => {
    try {
      setLoading(true)

      const response = await api.get('/warehouses', {
        params: { search },
      })

      setWarehouses(response.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, [search])

  const openAdd = () => {
    setEditing(null)

    setForm({
      code: '',
      name: '',
      location: '',
      description: '',
      status: 'active',
    })

    setError('')
    setShowModal(true)
  }

  const openEdit = (warehouse) => {
    setEditing(warehouse)

    setForm({
      code: warehouse.code,
      name: warehouse.name,
      location: warehouse.location || '',
      description: warehouse.description || '',
      status: warehouse.status,
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

    setSaving(true)
    setError('')

    try {
      if (editing) {
        await api.put(`/warehouses/${editing.id}`, form)
      } else {
        await api.post('/warehouses', form)
      }

      closeModal()
      fetchWarehouses()
    } catch (error) {
      const errors = error.response?.data?.errors

      if (errors) {
        setError(Object.values(errors)[0]?.[0])
      } else {
        setError(
          error.response?.data?.message ||
          'Gagal menyimpan gudang.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (warehouse) => {
    if (!window.confirm(`Hapus gudang "${warehouse.name}"?`)) {
      return
    }

    try {
      await api.delete(`/warehouses/${warehouse.id}`)
      fetchWarehouses()
    } catch (error) {
      alert('Gagal menghapus gudang.')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8">

        <div className="mb-6 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <WarehouseIcon size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gudang
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Kelola lokasi penyimpanan barang
              </p>
            </div>

          </div>

          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Tambah Gudang
          </button>

        </div>

        <div className="rounded-xl border border-gray-200 bg-white">

          <div className="border-b border-gray-200 p-5">

            <div className="relative max-w-sm">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari gudang..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                <tr>
                  <th className="px-6 py-4">Kode</th>
                  <th className="px-6 py-4">Gudang</th>
                  <th className="px-6 py-4">Lokasi</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : warehouses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">

                      <WarehouseIcon
                        size={35}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 font-medium text-gray-600">
                        Belum ada gudang
                      </p>

                    </td>
                  </tr>
                ) : (
                  warehouses.map((warehouse) => (
                    <tr
                      key={warehouse.id}
                      className="hover:bg-gray-50"
                    >

                      <td className="px-6 py-4 font-medium text-blue-600">
                        {warehouse.code}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">
                          {warehouse.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          ID #{warehouse.id}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {warehouse.location || '-'}
                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={
                            warehouse.status === 'active'
                              ? 'rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600'
                              : 'rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500'
                          }
                        >
                          {warehouse.status === 'active'
                            ? 'Aktif'
                            : 'Tidak Aktif'}
                        </span>

                      </td>

                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() => openEdit(warehouse)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() => handleDelete(warehouse)}
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

          <div className="border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-500">
              Total gudang:{' '}
              <span className="font-semibold text-gray-800">
                {warehouses.length}
              </span>
            </p>
          </div>

        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editing ? 'Edit Gudang' : 'Tambah Gudang'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Masukkan informasi gudang
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">

                <Input
                  label="Kode Gudang"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="WH-0001"
                  required
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Tidak Aktif</option>
                  </select>
                </div>

              </div>

              <Input
                label="Nama Gudang"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Gudang Utama"
                required
              />

              <Input
                label="Lokasi"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Jakarta Barat"
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Deskripsi
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600"
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
                      : 'Simpan Gudang'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </DashboardLayout>
  )
}

function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}

export default Warehouses
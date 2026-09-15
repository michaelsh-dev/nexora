import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Tags,
} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/api'

function Categories() {
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    status: 'active',
  })

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchCategories = async () => {
    try {
      setLoading(true)

      const response = await api.get('/categories', {
        params: { search },
      })

      setCategories(response.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [search])

  const openAdd = () => {
    setEditing(null)

    setForm({
      code: '',
      name: '',
      description: '',
      status: 'active',
    })

    setError('')
    setShowModal(true)
  }

  const openEdit = (category) => {
    setEditing(category)

    setForm({
      code: category.code,
      name: category.name,
      description: category.description || '',
      status: category.status,
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
        await api.put(`/categories/${editing.id}`, form)
      } else {
        await api.post('/categories', form)
      }

      closeModal()
      fetchCategories()
    } catch (error) {
      const errors = error.response?.data?.errors

      if (errors) {
        setError(Object.values(errors)[0]?.[0])
      } else {
        setError(
          error.response?.data?.message ||
          'Gagal menyimpan kategori.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category) => {
    if (!window.confirm(`Hapus kategori "${category.name}"?`)) {
      return
    }

    try {
      await api.delete(`/categories/${category.id}`)
      fetchCategories()
    } catch (error) {
      alert(
        error.response?.data?.message ||
        'Gagal menghapus kategori.'
      )
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8">

        <div className="mb-6 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <Tags size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Kategori Barang
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Kelola kategori produk
              </p>
            </div>

          </div>

          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Tambah Kategori
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
                placeholder="Cari kategori..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">Kode</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Jumlah Barang</th>
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
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <Tags size={35} className="mx-auto text-gray-300" />
                      <p className="mt-3 font-medium text-gray-600">
                        Belum ada kategori
                      </p>
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">

                      <td className="px-6 py-4 font-medium text-blue-600">
                        {category.code}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">
                          {category.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {category.description || 'Tidak ada deskripsi'}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {category.products_count} barang
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            category.status === 'active'
                              ? 'rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600'
                              : 'rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500'
                          }
                        >
                          {category.status === 'active'
                            ? 'Aktif'
                            : 'Tidak Aktif'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() => openEdit(category)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() => handleDelete(category)}
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
              Total kategori:{' '}
              <span className="font-semibold text-gray-800">
                {categories.length}
              </span>
            </p>
          </div>

        </div>

      </div>

      {showModal && (
        <Modal
          title={editing ? 'Edit Kategori' : 'Tambah Kategori'}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">

              <Input
                label="Kode Kategori"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="CAT-0001"
                required
              />

              <SelectStatus
                value={form.status}
                onChange={handleChange}
              />

            </div>

            <Input
              label="Nama Kategori"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Laptop Gaming"
              required
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <ModalButtons
              closeModal={closeModal}
              saving={saving}
              label={editing ? 'Simpan Perubahan' : 'Simpan Kategori'}
            />

          </form>
        </Modal>
      )}

    </DashboardLayout>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X size={20} />
          </button>

        </div>

        <div className="p-6">
          {children}
        </div>

      </div>

    </div>
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

function SelectStatus({ value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Status
      </label>

      <select
        name="status"
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
      >
        <option value="active">Aktif</option>
        <option value="inactive">Tidak Aktif</option>
      </select>
    </div>
  )
}

function ModalButtons({ closeModal, saving, label }) {
  return (
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
        {saving ? 'Menyimpan...' : label}
      </button>

    </div>
  )
}

export default Categories
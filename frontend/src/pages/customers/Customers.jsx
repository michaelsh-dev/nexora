import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Users,
} from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/api'

function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

  const [form, setForm] = useState({
    code: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
  })

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchCustomers = async () => {
    try {
      setLoading(true)

      const response = await api.get('/customers', {
        params: {
          search,
        },
      })

      setCustomers(response.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [search])

  const openAddModal = () => {
    setEditingCustomer(null)

    setForm({
      code: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
    })

    setError('')
    setShowModal(true)
  }

  const openEditModal = (customer) => {
    setEditingCustomer(customer)

    setForm({
      code: customer.code,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      status: customer.status,
    })

    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCustomer(null)
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
      if (editingCustomer) {
        await api.put(
          `/customers/${editingCustomer.id}`,
          form
        )
      } else {
        await api.post('/customers', form)
      }

      closeModal()
      fetchCustomers()
    } catch (error) {
      console.error(error)

      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        const firstError = Object.values(errors)[0]?.[0]

        setError(firstError || 'Terjadi kesalahan.')
      } else {
        setError(
          error.response?.data?.message ||
          'Gagal menyimpan data pelanggan.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (customer) => {
    const confirmed = window.confirm(
      `Hapus pelanggan "${customer.name}"?`
    )

    if (!confirmed) return

    try {
      await api.delete(`/customers/${customer.id}`)

      fetchCustomers()
    } catch (error) {
      console.error(error)
      alert('Gagal menghapus pelanggan.')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                <Users size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Pelanggan
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Kelola data pelanggan Nexora
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Tambah Pelanggan
          </button>

        </div>

        {/* Table Card */}
        <div className="rounded-xl border border-gray-200 bg-white">

          {/* Toolbar */}
          <div className="border-b border-gray-200 p-5">

            <div className="relative max-w-sm">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari pelanggan..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />

            </div>

          </div>

          {/* Table */}
          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                <tr>
                  <th className="px-6 py-4">Kode</th>
                  <th className="px-6 py-4">Pelanggan</th>
                  <th className="px-6 py-4">Kontak</th>
                  <th className="px-6 py-4">Alamat</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center"
                    >
                      <Users
                        size={35}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 font-medium text-gray-600">
                        Belum ada pelanggan
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        Tambahkan pelanggan pertama kamu.
                      </p>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-gray-50"
                    >

                      <td className="px-6 py-4 font-medium text-blue-600">
                        {customer.code}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">
                          {customer.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          ID #{customer.id}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-gray-700">
                          {customer.email || '-'}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {customer.phone || '-'}
                        </p>
                      </td>

                      <td className="max-w-xs px-6 py-4 text-gray-500">
                        <p className="truncate">
                          {customer.address || '-'}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            customer.status === 'active'
                              ? 'rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600'
                              : 'rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500'
                          }
                        >
                          {customer.status === 'active'
                            ? 'Aktif'
                            : 'Tidak Aktif'}
                        </span>
                      </td>

                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              openEditModal(customer)
                            }
                            className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                            title="Edit"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(customer)
                            }
                            className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            title="Hapus"
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
              Total pelanggan:{' '}
              <span className="font-semibold text-gray-800">
                {customers.length}
              </span>
            </p>
          </div>

        </div>

      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingCustomer
                    ? 'Edit Pelanggan'
                    : 'Tambah Pelanggan'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingCustomer
                    ? 'Perbarui informasi pelanggan'
                    : 'Masukkan informasi pelanggan baru'}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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

              <div className="grid grid-cols-2 gap-4">

                <Input
                  label="Kode Pelanggan"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="CUST-0001"
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
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">
                      Tidak Aktif
                    </option>
                  </select>
                </div>

              </div>

              <Input
                label="Nama Pelanggan"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="PT Maju Jaya"
                required
              />

              <div className="grid grid-cols-2 gap-4">

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@majujaya.com"
                />

                <Input
                  label="Telepon"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="021-12345678"
                />

              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Alamat
                </label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Alamat pelanggan..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

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
                    : editingCustomer
                      ? 'Simpan Perubahan'
                      : 'Simpan Pelanggan'}
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
  type = 'text',
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
        type={type}
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

export default Customers
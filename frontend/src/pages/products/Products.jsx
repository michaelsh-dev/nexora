import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Package,
} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/api'

function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const [form, setForm] = useState({
    category_id: '',
    code: '',
    name: '',
    unit: 'Unit',
    purchase_price: '',
    selling_price: '',
    status: 'active',
    description: '',
  })

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchProducts = async () => {
    try {
      setLoading(true)

      const response = await api.get('/products', {
        params: { search },
      })

      setProducts(response.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      setCategories(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [search])

  useEffect(() => {
    fetchCategories()
  }, [])

  const openAdd = () => {
    setEditing(null)

    setForm({
      category_id: categories[0]?.id || '',
      code: '',
      name: '',
      unit: 'Unit',
      purchase_price: '',
      selling_price: '',
      status: 'active',
      description: '',
    })

    setError('')
    setShowModal(true)
  }

  const openEdit = (product) => {
    setEditing(product)

    setForm({
      category_id: product.category_id,
      code: product.code,
      name: product.name,
      unit: product.unit,
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      status: product.status,
      description: product.description || '',
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

    if (!form.category_id) {
      setError('Pilih kategori barang terlebih dahulu.')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form)
      } else {
        await api.post('/products', form)
      }

      closeModal()
      fetchProducts()
    } catch (error) {
      const errors = error.response?.data?.errors

      if (errors) {
        setError(Object.values(errors)[0]?.[0])
      } else {
        setError(
          error.response?.data?.message ||
          'Gagal menyimpan barang.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Hapus barang "${product.name}"?`)) {
      return
    }

    try {
      await api.delete(`/products/${product.id}`)
      fetchProducts()
    } catch (error) {
      alert('Gagal menghapus barang.')
    }
  }

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <DashboardLayout>
      <div className="p-8">

        <div className="mb-6 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <Package size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Barang
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Kelola produk dan harga barang
              </p>
            </div>

          </div>

          <button
            onClick={openAdd}
            disabled={categories.length === 0}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            Tambah Barang
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
                placeholder="Cari barang..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                <tr>
                  <th className="px-6 py-4">Kode</th>
                  <th className="px-6 py-4">Barang</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Harga Beli</th>
                  <th className="px-6 py-4">Harga Jual</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <Package size={35} className="mx-auto text-gray-300" />

                      <p className="mt-3 font-medium text-gray-600">
                        Belum ada barang
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        Tambahkan barang pertama.
                      </p>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">

                      <td className="px-6 py-4 font-medium text-blue-600">
                        {product.code}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Satuan: {product.unit}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {product.category?.name || '-'}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {formatRupiah(product.purchase_price)}
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-800">
                        {formatRupiah(product.selling_price)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            product.status === 'active'
                              ? 'rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600'
                              : 'rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500'
                          }
                        >
                          {product.status === 'active'
                            ? 'Aktif'
                            : 'Tidak Aktif'}
                        </span>
                      </td>

                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() => openEdit(product)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() => handleDelete(product)}
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
              Total barang:{' '}
              <span className="font-semibold text-gray-800">
                {products.length}
              </span>
            </p>
          </div>

        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">

          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editing ? 'Edit Barang' : 'Tambah Barang'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Masukkan informasi barang
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X size={20} />
              </button>

            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">

                <Input
                  label="Kode Barang"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="LPT-0001"
                  required
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Kategori
                  </label>

                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Pilih kategori</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <Input
                label="Nama Barang"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Lenovo LOQ 15"
                required
              />

              <div className="grid grid-cols-3 gap-4">

                <Input
                  label="Satuan"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  placeholder="Unit"
                  required
                />

                <Input
                  label="Harga Beli"
                  name="purchase_price"
                  type="number"
                  value={form.purchase_price}
                  onChange={handleChange}
                  placeholder="10000000"
                  required
                />

                <Input
                  label="Harga Jual"
                  name="selling_price"
                  type="number"
                  value={form.selling_price}
                  onChange={handleChange}
                  placeholder="12000000"
                  required
                />

              </div>

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
                      : 'Simpan Barang'}
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

export default Products
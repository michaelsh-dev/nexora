import { useEffect, useState } from 'react'
import {
    Settings as SettingsIcon,
    Building2,
    Mail,
    Phone,
    MapPin,
    FileText,
    Globe,
    Save,
    RefreshCw,
} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/api'

function Settings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [form, setForm] = useState({
        company_name: '',
        email: '',
        phone: '',
        address: '',
        tax_number: '',
        website: '',
        currency: 'IDR',
        timezone: 'Asia/Jakarta',
    })

    const fetchSettings = async () => {
        try {
            setLoading(true)
            setError('')

            const response = await api.get(
                '/company-settings'
            )

            const data = response.data

            setForm({
                company_name: data.company_name || '',
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || '',
                tax_number: data.tax_number || '',
                website: data.website || '',
                currency: data.currency || 'IDR',
                timezone:
                    data.timezone || 'Asia/Jakarta',
            })
        } catch (err) {
            console.error(err)

            setError(
                err.response?.data?.message ||
                'Gagal mengambil pengaturan.'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }))

        setError('')
        setSuccess('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        setSaving(true)
        setError('')
        setSuccess('')

        try {
            await api.put(
                '/company-settings',
                form
            )

            setSuccess(
                'Pengaturan berhasil disimpan.'
            )

            await fetchSettings()
        } catch (err) {
            console.error(err)

            const validationErrors =
                err.response?.data?.errors

            if (validationErrors) {
                const firstError =
                    Object.values(
                        validationErrors
                    )[0]?.[0]

                setError(
                    firstError ||
                    'Data pengaturan tidak valid.'
                )
            } else {
                setError(
                    err.response?.data?.message ||
                    'Gagal menyimpan pengaturan.'
                )
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50 p-8">

                {/* Header */}
                <div className="mb-8">

                    <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <SettingsIcon size={24} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">
                                Pengaturan
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Kelola informasi dan konfigurasi perusahaan.
                            </p>
                        </div>

                    </div>

                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {success}
                    </div>
                )}

                {loading ? (
                    <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-white">

                        <div className="flex items-center gap-3 text-sm text-slate-600">

                            <RefreshCw
                                size={20}
                                className="animate-spin text-blue-600"
                            />

                            Memuat pengaturan...

                        </div>

                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>

                        {/* Informasi Perusahaan */}
                        <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b border-slate-200 px-6 py-5">

                                <div className="flex items-center gap-3">

                                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                        <Building2 size={20} />
                                    </div>

                                    <div>
                                        <h2 className="font-semibold text-slate-800">
                                            Informasi Perusahaan
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Informasi utama perusahaan yang digunakan di Nexora.
                                        </p>
                                    </div>

                                </div>

                            </div>

                            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">

                                {/* Nama */}
                                <div className="md:col-span-2">

                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Nama Perusahaan
                                    </label>

                                    <div className="relative">

                                        <Building2
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            type="text"
                                            name="company_name"
                                            value={form.company_name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Nama perusahaan"
                                            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                                {/* Email */}
                                <div>

                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Email
                                    </label>

                                    <div className="relative">

                                        <Mail
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="email@perusahaan.com"
                                            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                                {/* Telepon */}
                                <div>

                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Nomor Telepon
                                    </label>

                                    <div className="relative">

                                        <Phone
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            type="text"
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="021-12345678"
                                            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                                {/* Alamat */}
                                <div className="md:col-span-2">

                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Alamat
                                    </label>

                                    <div className="relative">

                                        <MapPin
                                            size={18}
                                            className="absolute left-3 top-3 text-slate-400"
                                        />

                                        <textarea
                                            name="address"
                                            value={form.address}
                                            onChange={handleChange}
                                            rows="4"
                                            placeholder="Alamat lengkap perusahaan"
                                            className="w-full resize-none rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                                {/* NPWP */}
                                <div>

                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        NPWP
                                    </label>

                                    <div className="relative">

                                        <FileText
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            type="text"
                                            name="tax_number"
                                            value={form.tax_number}
                                            onChange={handleChange}
                                            placeholder="Nomor NPWP"
                                            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                                {/* Website */}
                                <div>

                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Website
                                    </label>

                                    <div className="relative">

                                        <Globe
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            type="text"
                                            name="website"
                                            value={form.website}
                                            onChange={handleChange}
                                            placeholder="www.perusahaan.com"
                                            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* Konfigurasi */}
                        <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b border-slate-200 px-6 py-5">

                                <div className="flex items-center gap-3">

                                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                        <SettingsIcon size={20} />
                                    </div>

                                    <div>
                                        <h2 className="font-semibold text-slate-800">
                                            Konfigurasi
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Pengaturan dasar sistem Nexora.
                                        </p>
                                    </div>

                                </div>

                            </div>

                            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">

                                {/* Currency */}
                                <div>

                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Mata Uang
                                    </label>

                                    <select
                                        name="currency"
                                        value={form.currency}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="IDR">
                                            IDR - Rupiah Indonesia
                                        </option>

                                        <option value="USD">
                                            USD - US Dollar
                                        </option>

                                        <option value="SGD">
                                            SGD - Singapore Dollar
                                        </option>

                                        <option value="MYR">
                                            MYR - Malaysian Ringgit
                                        </option>
                                    </select>

                                </div>

                                {/* Timezone */}
                                <div>

                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Zona Waktu
                                    </label>

                                    <select
                                        name="timezone"
                                        value={form.timezone}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="Asia/Jakarta">
                                            Asia/Jakarta (WIB)
                                        </option>

                                        <option value="Asia/Makassar">
                                            Asia/Makassar (WITA)
                                        </option>

                                        <option value="Asia/Jayapura">
                                            Asia/Jayapura (WIT)
                                        </option>
                                    </select>

                                </div>

                            </div>

                        </div>

                        {/* Footer */}
                        <div className="flex justify-end">

                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                                {saving ? (
                                    <RefreshCw
                                        size={18}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Save size={18} />
                                )}

                                {saving
                                    ? 'Menyimpan...'
                                    : 'Simpan Pengaturan'}

                            </button>

                        </div>

                    </form>
                )}

            </div>
        </DashboardLayout>
    )
}

export default Settings
import { NavLink } from 'react-router-dom'
import { useEffect, useRef } from 'react'

import {
    LayoutDashboard,
    Users,
    FileText,
    ShoppingCart,
    Package,
    Warehouse,
    Wallet,
    BarChart3,
    Settings,
    Building2,
    Tags,
    ClipboardMinus,
    ClipboardList,
} from 'lucide-react'

function Sidebar() {
    const navRef = useRef(null)

    useEffect(() => {
        const nav = navRef.current

        if (!nav) return

        const savedScroll = sessionStorage.getItem(
            'nexora-sidebar-scroll'
        )

        if (savedScroll) {
            nav.scrollTop = Number(savedScroll)
        }

        const handleScroll = () => {
            sessionStorage.setItem(
                'nexora-sidebar-scroll',
                nav.scrollTop
            )
        }

        nav.addEventListener('scroll', handleScroll)
    }, [])

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 text-white">

            {/* Logo */}
            <div className="flex h-16 items-center border-b border-slate-800 px-6">
                <div className="text-2xl font-bold text-blue-500">
                    Nexora
                </div>
            </div>

            {/* Menu */}
            <nav ref={navRef} className="h-[calc(100vh-4rem)] overflow-y-auto px-4 py-5">

                {/* Dashboard */}
                <NavLink
                    to="/dashboard"
                    end
                    className={({ isActive }) =>
                        `mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`
                    }
                >
                    <LayoutDashboard size={19} />
                    Dashboard
                </NavLink>

                {/* Penjualan */}
                <div className="mt-6">
                    <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Penjualan
                    </p>

                    <SidebarItem
                        icon={<Users size={18} />}
                        text="Pelanggan"
                        href="/customers"
                    />

                    <SidebarItem
                        icon={<FileText size={18} />}
                        text="Penawaran"
                        href="/sales-quotations"
                    />
                    <SidebarItem
                        icon={<ShoppingCart size={18} />}
                        text="Pesanan Penjualan"
                        href="/sales-orders"
                    />

                    <SidebarItem
                        icon={<FileText size={18} />}
                        text="Faktur Penjualan"
                        href="/sales-invoices"
                    />

                    <SidebarItem
                        icon={<Wallet size={18} />}
                        text="Penerimaan Penjualan"
                        href="/sales-receipts"
                    />

                </div>

                {/* Pembelian */}
                <div className="mt-6">
                    <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Pembelian
                    </p>

                    <SidebarItem
                        icon={<Building2 size={18} />}
                        text="Supplier"
                        href="/suppliers"
                    />

                    <SidebarItem
                        icon={<ClipboardList size={18} />}
                        text="Permintaan Pembelian"
                        href="/purchase-requests"
                    />
                    <SidebarItem
                        icon={<ShoppingCart size={18} />}
                        text="Pesanan Pembelian"
                        href="/purchase-orders"
                    />
                    <SidebarItem
                        icon={<FileText size={18} />}
                        text="Faktur Pembelian"
                        href="/purchase-invoices"
                    />
                    <SidebarItem
                        icon={<Wallet size={18} />}
                        text="Pembayaran Pembelian"
                        href="/purchase-payments"
                    />
                </div>

                {/* Persediaan */}
                <div className="mt-6">
                    <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Persediaan
                    </p>

                    <SidebarItem
                        icon={<Package size={18} />}
                        text="Barang"
                        href="/products"
                    />

                    <SidebarItem
                        icon={<Tags size={18} />}
                        text="Kategori Barang"
                        href="/categories"
                    />

                    <SidebarItem
                        icon={<Warehouse size={18} />}
                        text="Gudang"
                        href="/warehouses"
                    />

                    <SidebarItem
                        icon={<BarChart3 size={18} />}
                        text="Stok"
                        href="/stocks"
                    />

                    <SidebarItem
                        icon={<ClipboardMinus size={18} />}
                        text="Penyesuaian Stok"
                        href="/stock-adjustments"
                    />
                </div>

                {/* Keuangan */}
                <div className="mt-6">
                    <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Keuangan
                    </p>

                    <SidebarItem icon={<Wallet size={18} />} text="Kas & Bank" href="/cash-banks" />
                    <SidebarItem
                        icon={<Wallet size={18} />}
                        text="Penerimaan"
                        href="/receipts" />
                    <SidebarItem icon={<Wallet size={18} />} text="Pengeluaran" href="/expenses" />
                </div>

                {/* Laporan */}
                <div className="mt-6">
                    <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Laporan
                    </p>

                    <SidebarItem
                        icon={<BarChart3 size={18} />}
                        text="Laporan Penjualan"
                        href="/reports/sales"
                    />
                    <SidebarItem
                        icon={<BarChart3 size={18} />}
                        text="Laporan Pembelian"
                        href="/reports/purchases"
                    />
                    <SidebarItem
                        icon={<BarChart3 size={18} />}
                        text="Laba Rugi"
                        href="/reports/profit-loss"
                    />
                </div>

                {/* Pengaturan */}
                <div className="mt-6">
                    <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Pengaturan
                    </p>

                    <SidebarItem
                        icon={<Settings size={18} />}
                        text="Pengaturan"
                        href="/settings"
                    />
                </div>

            </nav>
        </aside>
    )
}

function SidebarItem({ icon, text, href = '#' }) {
    const isDisabled = href === '#'

    return (
        <NavLink
            to={href}
            className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition ${!isDisabled && isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
            }
            onClick={(e) => {
                if (isDisabled) {
                    e.preventDefault()
                }
            }}
        >
            {icon}
            <span>{text}</span>
        </NavLink>
    )
}

export default Sidebar
import {
    TrendingUp,
    ShoppingBag,
    Wallet,
    Package,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react'

import DashboardLayout from '../../layouts/DashboardLayout'

function Dashboard() {
    return (
        <DashboardLayout>

            <div className="p-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Dashboard
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Welcome back, Admin 👋 Here's what's happening today.
                    </p>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                    <StatCard
                        title="Total Penjualan"
                        value="Rp 45.200.000"
                        change="+12.5%"
                        positive
                        icon={<TrendingUp size={22} />}
                    />

                    <StatCard
                        title="Total Pembelian"
                        value="Rp 18.700.000"
                        change="-4.2%"
                        positive={false}
                        icon={<ShoppingBag size={22} />}
                    />

                    <StatCard
                        title="Pendapatan"
                        value="Rp 26.500.000"
                        change="+8.3%"
                        positive
                        icon={<Wallet size={22} />}
                    />

                    <StatCard
                        title="Total Stok"
                        value="1.248 Item"
                        change="+24"
                        positive
                        icon={<Package size={22} />}
                    />

                </div>

                {/* Middle Section */}
                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">

                    {/* Sales Chart */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 xl:col-span-2">

                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    Penjualan
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Performa penjualan 7 hari terakhir
                                </p>
                            </div>

                            <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none">
                                <option>7 Hari</option>
                                <option>30 Hari</option>
                                <option>3 Bulan</option>
                            </select>
                        </div>

                        {/* Simple chart */}
                        <div className="mt-8 flex h-64 items-end gap-4">

                            <ChartBar height="45%" label="Sen" value="4.2jt" />
                            <ChartBar height="60%" label="Sel" value="5.8jt" />
                            <ChartBar height="50%" label="Rab" value="4.9jt" />
                            <ChartBar height="75%" label="Kam" value="7.2jt" />
                            <ChartBar height="65%" label="Jum" value="6.3jt" />
                            <ChartBar height="90%" label="Sab" value="8.5jt" />
                            <ChartBar height="72%" label="Min" value="6.9jt" />

                        </div>

                    </div>

                    {/* Low Stock */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6">

                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    Stok Menipis
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Perlu segera diperhatikan
                                </p>
                            </div>

                            <Package size={21} className="text-gray-400" />
                        </div>

                        <div className="mt-5 space-y-3">

                            <StockItem
                                name="Lenovo LOQ 15"
                                stock="5"
                            />

                            <StockItem
                                name="ASUS TUF Gaming A15"
                                stock="7"
                            />

                            <StockItem
                                name="Acer Nitro V 15"
                                stock="8"
                            />

                            <StockItem
                                name="HP Victus 15"
                                stock="4"
                            />

                        </div>

                        <button className="mt-6 w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Lihat Semua Stok
                        </button>

                    </div>

                </div>

                {/* Recent Transactions */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-white">

                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

                        <div>
                            <h2 className="font-semibold text-gray-900">
                                Transaksi Terbaru
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Aktivitas transaksi terbaru
                            </p>
                        </div>

                        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                            Lihat Semua
                        </button>

                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full text-left text-sm">

                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                                <tr>
                                    <th className="px-6 py-4">No. Faktur</th>
                                    <th className="px-6 py-4">Pelanggan</th>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                <Transaction
                                    invoice="INV-0001"
                                    customer="PT ABC Indonesia"
                                    date="15 Sep 2026"
                                    total="Rp 5.000.000"
                                    status="Paid"
                                />

                                <Transaction
                                    invoice="INV-0002"
                                    customer="PT XYZ Sejahtera"
                                    date="15 Sep 2026"
                                    total="Rp 3.200.000"
                                    status="Pending"
                                />

                                <Transaction
                                    invoice="INV-0003"
                                    customer="PT DEF Makmur"
                                    date="14 Sep 2026"
                                    total="Rp 7.500.000"
                                    status="Paid"
                                />

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </DashboardLayout>
    )
}

function StatCard({ title, value, change, positive, icon }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6">

            <div className="flex items-start justify-between">

                <div>
                    <p className="text-sm text-gray-500">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-gray-900">
                        {value}
                    </p>
                </div>

                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                    {icon}
                </div>

            </div>

            <div className="mt-4 flex items-center gap-1 text-sm">

                {positive ? (
                    <ArrowUpRight size={16} className="text-green-500" />
                ) : (
                    <ArrowDownRight size={16} className="text-red-500" />
                )}

                <span className={positive ? 'text-green-600' : 'text-red-600'}>
                    {change}
                </span>

                <span className="text-gray-400">
                    vs bulan lalu
                </span>

            </div>

        </div>
    )
}

function ChartBar({ height, label, value }) {
    return (
        <div className="flex h-full flex-1 flex-col items-center justify-end gap-2">

            <span className="text-xs text-gray-500">
                {value}
            </span>

            <div
                className="w-full max-w-10 rounded-t-lg bg-blue-500 transition hover:bg-blue-600"
                style={{ height }}
            />

            <span className="text-xs text-gray-500">
                {label}
            </span>

        </div>
    )
}

function StockItem({ name, stock }) {
  return (
    <div className="flex items-center justify-between py-1">

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">
          {name}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Stok tersisa
        </p>
      </div>

      <span className="ml-4 shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
        {stock} unit
      </span>

    </div>
  )
}

function Transaction({
    invoice,
    customer,
    date,
    total,
    status,
}) {
    return (
        <tr className="hover:bg-gray-50">

            <td className="px-6 py-4 font-medium text-blue-600">
                {invoice}
            </td>

            <td className="px-6 py-4 text-gray-700">
                {customer}
            </td>

            <td className="px-6 py-4 text-gray-500">
                {date}
            </td>

            <td className="px-6 py-4 font-medium text-gray-800">
                {total}
            </td>

            <td className="px-6 py-4">
                <span
                    className={
                        status === 'Paid'
                            ? 'rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600'
                            : 'rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-600'
                    }
                >
                    {status}
                </span>
            </td>

        </tr>
    )
}

export default Dashboard
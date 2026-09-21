import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Login from './pages/auth/login'
import Dashboard from './pages/dashboard/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import Register from './pages/auth/Register'
import Customers from './pages/customers/Customers'
import Suppliers from './pages/suppliers/Suppliers'
import Categories from './pages/categories/Categories'
import Products from './pages/products/Products'
import Warehouses from './pages/warehouses/Warehouses'
import Stocks from './pages/stocks/Stocks'
import StockAdjustments from './pages/stock-adjustments/StockAdjustments'
import SalesInvoices from './pages/sales/SalesInvoices'
import SalesReceipts from './pages/sales/SalesReceipts'
import SalesOrders from './pages/sales/SalesOrders'
import SalesQuotations from './pages/sales/SalesQuotations'
import PurchaseRequests from './pages/purchases/PurchaseRequests'
import PurchaseOrders from './pages/purchases/PurchaseOrders'
import PurchaseInvoices from './pages/purchases/PurchaseInvoices'
import PurchasePayments from './pages/purchases/PurchasePayments'
import CashBanks from './pages/finance/CashBanks'
import Receipts from './pages/finance/Receipts'
import Expenses from './pages/finance/Expenses'
import SalesReport from './pages/reports/SalesReport'
import PurchaseReport from './pages/reports/PurchaseReport'
import ProfitLossReport from './pages/reports/ProfitLossReport'
import Settings from './pages/settings/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />
        {/* Public */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<h1>Forgot Password</h1>}
        />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />
          <Route
            path="/customers"
            element={<Customers />}
          />
          <Route
            path="/suppliers"
            element={<Suppliers />}
          />
          <Route
            path="/categories"
            element={<Categories />}
          />

          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/warehouses"
            element={<Warehouses />}
          />

          <Route path="/stocks"
            element={<Stocks />} />

          <Route path="/stock-adjustments"
            element={<StockAdjustments />} />

          <Route
            path="/sales-receipts"
            element={<SalesReceipts />}
          />

          <Route
            path="/sales-orders"
            element={<SalesOrders />}
          />

          <Route path="/sales-invoices" element={<SalesInvoices />} />

          <Route path="/sales-quotations" element={<SalesQuotations />} />

          <Route
            path="/purchase-requests"
            element={<PurchaseRequests />}
          />

          <Route
            path="/purchase-orders"
            element={<PurchaseOrders />}
          />
          <Route
            path="/purchase-invoices"
            element={<PurchaseInvoices />}
          />
          <Route
            path="/purchase-payments"
            element={<PurchasePayments />}
          />

          <Route
            path="/cash-banks"
            element={<CashBanks />}
          />

          <Route
            path="/receipts"
            element={<Receipts />}
          />

          <Route
            path="/expenses"
            element={<Expenses />}
          />

          <Route
            path="/reports/sales"
            element={<SalesReport />}
          />

          <Route
            path="/reports/purchases"
            element={<PurchaseReport />}
          />

          <Route
            path="/reports/profit-loss"
            element={<ProfitLossReport />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

        </Route>

        {/* Not Found */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
        <Route
          path="/sales-invoices"
          element={<SalesInvoices />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
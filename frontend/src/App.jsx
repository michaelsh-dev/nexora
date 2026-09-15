import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Login from './pages/auth/Login'
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
        </Route>

        {/* Not Found */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App
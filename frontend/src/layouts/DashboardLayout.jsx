
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">

      <Sidebar />

      <Topbar />

      <main className="ml-64 pt-16">
        {children}
      </main>

    </div>
  )
}

export default DashboardLayout
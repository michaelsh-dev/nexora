import { useState } from 'react'
import { Bell, Search, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function Topbar() {
    const navigate = useNavigate()

    const [user] = useState(() => {
        const savedUser = localStorage.getItem('user')

        return savedUser ? JSON.parse(savedUser) : null
    })

    const handleLogout = async () => {
        try {
            await api.post('/logout')
        } catch (error) {
            console.log(error)
        } finally {
            localStorage.removeItem('token')
            localStorage.removeItem('user')

            navigate('/login')
        }
    }

    return (
        <header className="fixed right-0 top-0 z-30 flex h-16 left-64 items-center justify-between border-b border-gray-200 bg-white px-8">

            {/* Search */}
            <div className="relative w-80">
                <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />
            </div>

            {/* Right */}
            <div className="flex items-center gap-5">

                <button className="relative text-gray-500 hover:text-gray-700">
                    <Bell size={21} />

                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                </button>

                <div className="h-8 w-px bg-gray-200" />

                <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                        A
                    </div>

                    <div className="text-left">
                        <p className="text-sm font-semibold text-gray-800">
                            {user?.name || 'User Nexora'}                        </p>

                        <p className="text-xs text-gray-500">
                            {user?.role || 'Administrator'}
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="ml-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600"
                    >
                        Logout
                    </button>

                </div>
            </div>
        </header>
    )
}

export default Topbar
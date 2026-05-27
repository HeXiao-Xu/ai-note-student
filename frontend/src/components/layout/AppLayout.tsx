import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 bg-gray-50 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

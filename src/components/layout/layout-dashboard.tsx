import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"

export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar />
                <main className="p-6 overflow-y-auto flex-1 pb-20 md:pb-6">
                    {children}
                </main>
            </div>
        </div>
    )
}

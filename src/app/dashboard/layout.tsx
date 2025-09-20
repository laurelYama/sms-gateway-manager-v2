import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar - Fixed */}
            <div className="fixed top-0 left-0 h-full w-64 z-10">
                <Sidebar />
            </div>
            
            {/* Main Content - Offset by sidebar width */}
            <div className="flex-1 flex flex-col ml-64 min-h-screen">
                {/* Navbar - Fixed at top */}
                <header className="sticky top-0 z-10 bg-white shadow-sm">
                    <Navbar />
                </header>
                
                {/* Main Content Area */}
                <main className="flex-1 p-6 bg-gray-50">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
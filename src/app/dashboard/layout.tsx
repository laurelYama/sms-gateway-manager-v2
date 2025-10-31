"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { useRequireAnyRole } from "@/hooks/use-require-role"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isChecking, allowed } = useRequireAnyRole(["ADMIN", "SUPER_ADMIN", "AUDITEUR"])

    // Loading state while determining auth/role
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Prevent flash while redirecting unauth/unauthorized users
    if (!allowed) return null

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* Sidebar - Hidden on mobile, shown on md and up */}
            <div className="hidden md:block fixed top-0 left-0 h-full w-64 z-10">
                <Sidebar />
            </div>
            
            {/* Main Content Wrapper */}
            <div className="flex flex-col h-screen md:ml-64">
                {/* Navbar */}
                <header className="fixed top-0 right-0 left-64 z-20 bg-white shadow-sm h-16">
                    <Navbar />
                </header>
                
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pt-16">
                    <main className="min-h-[calc(100vh-4rem)] px-2 sm:px-4 py-4 md:p-6 bg-gray-50">
                        <div className="w-full max-w-7xl mx-auto">
                            <div className="w-full">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
                
                {/* Mobile Navigation - Fixed at bottom */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-20">
                    <Sidebar />
                </div>
            </div>
        </div>
    )
}
"use client"

import { LayoutDashboard, Users, FileText, MessageSquare, Database, CreditCard } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"

const menuItems = [
    { name: "Tableau de bord", icon: LayoutDashboard, href: "/dashboard/home" },
    { name: "Clients", icon: Users, href: "/dashboard/clients" },
    { name: "Crédits", icon: CreditCard, href: "/dashboard/credits" },
    { name: "Facturation", icon: FileText, href: "/dashboard/facturation" },
    { name: "Tickets", icon: MessageSquare, href: "/dashboard/tickets" },
    { name: "Référentiels", icon: Database, href: "/dashboard/referentiels" },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 h-screen bg-gradient-to-b from-[#0072BB] to-[#005a96] text-white p-5 flex flex-col">
            {/* Logo */}
            <div className="mb-8 -mt-2 flex justify-center">
                <div className="w-11/12 h-24 bg-white rounded-lg flex items-center justify-center shadow-lg p-2">
                    <Image
                        src="/Logo_ION-1-removebg-preview 1.png"
                        alt="Logo"
                        width={150}
                        height={36}
                        className="object-contain"
                    />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-white text-[#0072BB] shadow-lg"
                                    : "text-blue-100 hover:bg-blue-500 hover:text-white"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-5 w-5 transition-colors flex-shrink-0",
                                    isActive ? "text-[#0072BB]" : "text-blue-200 group-hover:text-white"
                                )}
                            />
                            <span className={cn(
                                "font-medium",
                                isActive ? "text-[#0072BB]" : "group-hover:text-white"
                            )}>
                                {item.name}
                            </span>
                            {isActive && (
                                <div className="ml-auto w-2 h-2 bg-[#8DC73D] rounded-full"></div>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer de la sidebar */}
            <div className="pt-6 mt-auto border-t border-blue-400/30">
                <div className="text-xs text-blue-200/70 text-center">
                    <p>Version 1.2.0</p>
                    <p className="mt-1">© 2025 SMS Gateway</p>
                </div>
            </div>
        </aside>
    )
}
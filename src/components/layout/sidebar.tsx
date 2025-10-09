"use client"

import { LayoutDashboard, Users, FileText, MessageSquare, Database, CreditCard, Settings, Shield, ActivitySquare } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useAuth } from "@/lib/auth"

// Éléments de menu de base pour tous les utilisateurs
const baseMenuItems = [
    { name: "Tableau de bord", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Clients", icon: Users, href: "/dashboard/clients" },
    { name: "Commandes", icon: CreditCard, href: "/dashboard/credits" },
    { name: "Facturation", icon: FileText, href: "/dashboard/facturation" },
    { name: "Tickets", icon: MessageSquare, href: "/dashboard/tickets" },
    { name: "Paramètres", icon: Settings, href: "/dashboard/parametres" },
]

// Élément de menu Référentiels (uniquement pour SUPER_ADMIN)
const referentielItem = { name: "Référentiels", icon: Database, href: "/dashboard/referentiels" }

export function Sidebar() {
    const pathname = usePathname()
    const { user } = useAuth()
    const isSuperAdmin = user?.role === 'SUPER_ADMIN'
    
    // Créer la liste des éléments de menu
    let menuItems = [...baseMenuItems]
    
    // Ajouter Référentiels en 6ème position uniquement pour les SUPER_ADMIN
    if (isSuperAdmin) {
        menuItems.splice(5, 0, referentielItem)
    }
    const securityItems = [
        { name: 'Utilisateurs', icon: Users, href: '/dashboard/users' },
        { name: "Journal d'activité", icon: ActivitySquare, href: "/dashboard/parametres/logs" },
    ]
    const itemsToRender = isSuperAdmin
        ? menuItems
        : menuItems.filter((item) => item.href !== '/dashboard/parametres')
    const securityActive = ['/dashboard/users', '/dashboard/parametres/logs'].includes(pathname)

    return (
        <aside className="w-64 h-screen bg-gradient-to-b from-[#0072BB] to-[#005a96] text-white p-4 flex flex-col">
            {/* Logo */}
            <div className="mb-6 -mt-2 flex justify-center">
                <div className="w-11/12 h-20 bg-white rounded-lg flex items-center justify-center shadow-lg p-2">
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
            <nav className="flex-1 pr-1 space-y-0.5">
                {itemsToRender.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <div key={item.name} className="relative group">
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full",
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
                            {/* Zone cliquable étendue */}
                            <Link 
                                href={item.href} 
                                className="absolute inset-0 z-10" 
                                aria-hidden="true"
                            />
                        </div>
                    )
                })}
                {isSuperAdmin && (
                    <div className="mt-3">
                        <Accordion type="single" collapsible defaultValue={securityActive ? "security" : undefined}>
                            <AccordionItem value="security" className="border-none">
                                <AccordionTrigger className="px-3 py-2 rounded-xl hover:no-underline text-blue-100 hover:bg-blue-500 hover:text-white">
                                    <div className="flex items-center gap-3">
                                        <Shield className="h-5 w-5" />
                                        <span className="font-medium">Sécurité</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-2">
                                    <div className="space-y-0.5 pt-1">
                                        {securityItems.map((item) => {
                                            const isActive = pathname === item.href
                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    className={cn(
                                                        "ml-6 flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group",
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
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                )}
            </nav>

            {/* Footer de la sidebar */}
            <div className="pt-6 mt-auto border-t border-blue-400/30">
                <div className="text-xs text-blue-200/70 text-center">
                    <p className="mt-1"> 2025 SMS Gateway</p>
                </div>
            </div>
        </aside>
    )
}
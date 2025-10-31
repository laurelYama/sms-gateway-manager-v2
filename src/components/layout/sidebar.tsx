"use client"

import { LayoutDashboard, Users, FileText, MessageSquare, Database, CreditCard, Settings, Shield, ActivitySquare } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useAuth } from "@/lib/auth"
import { useState, useEffect } from "react"

// Éléments de menu de base pour tous les utilisateurs
const baseMenuItems = [
    { name: "Panel de control", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Clientes", icon: Users, href: "/dashboard/clients" },
    { name: "Pedidos", icon: CreditCard, href: "/dashboard/credits" },
    { name: "Facturación", icon: FileText, href: "/dashboard/facturation" },
    { name: "Tickets", icon: MessageSquare, href: "/dashboard/tickets" },
    { name: "Configuración", icon: Settings, href: "/dashboard/parametres" },
]

// Élément de menu Référentiels (uniquement pour SUPER_ADMIN)
const referentielItem = { name: "Repositorios", icon: Database, href: "/dashboard/referentiels" }

export function Sidebar() {
    // mobile detection removed for now (not used)
    const pathname = usePathname()
    const { user } = useAuth()
    const isSuperAdmin = user?.role === 'SUPER_ADMIN'
    
    // Détecter si on est sur mobile
    useEffect(() => {
        // No-op: keeping the resize listener placeholder for future mobile-specific
        // behavior. Currently it does nothing to avoid unused state.
        const noop = () => {}
        window.addEventListener('resize', noop)
        return () => window.removeEventListener('resize', noop)
    }, [])
    
    // Fermer le menu mobile lors du changement de route (no-op since mobile menu
    // state is not kept here; keep effect to avoid lint warnings about unused
    // dependencies and to allow future extension)
    useEffect(() => {
        // intentionally empty
    }, [pathname])
    
    // Créer la liste des éléments de menu
    const menuItems = [...baseMenuItems]
    
    // Ajouter Référentiels en 6ème position uniquement pour les SUPER_ADMIN
    if (isSuperAdmin) {
        menuItems.splice(5, 0, referentielItem)
    }
    const securityItems = [
        { name: 'Usuarios', icon: Users, href: '/dashboard/users' },
        { name: "Registro de actividad", icon: ActivitySquare, href: "/dashboard/parametres/logs" },
    ]
    const itemsToRender = isSuperAdmin
        ? menuItems
        : menuItems.filter((item) => item.href !== '/dashboard/parametres')
    const securityActive = ['/dashboard/users', '/dashboard/parametres/logs'].includes(pathname)

    // Rendu du menu de navigation
    const renderNavItems = (mobile = false) => {
        return (
            <nav className={`flex-1 ${mobile ? 'flex flex-row md:hidden' : 'hidden md:flex flex-col'}`}>
                {itemsToRender.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <div key={item.name} className={`relative group ${mobile ? 'flex-1' : 'mb-2'}`}>
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-2.5 rounded-xl transition-all duration-200 w-full overflow-hidden",
                                    isActive
                                        ? "bg-white text-[#0072BB] shadow-md"
                                        : "text-blue-100 hover:bg-blue-500/80 hover:text-white",
                                    mobile && "flex-col justify-center text-center py-2 px-0.5 text-[11px] leading-tight"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "flex-shrink-0 transition-colors",
                                        isActive ? "text-[#0072BB]" : "text-blue-200 group-hover:text-white",
                                        mobile ? "h-5 w-5 mx-auto mb-0.5" : "h-4 w-4"
                                    )}
                                />
                                <span className={cn(
                                    "font-medium truncate px-0.5",
                                    isActive ? "text-[#0072BB] font-semibold" : "group-hover:text-white",
                                    mobile ? "text-[11px]" : "text-sm"
                                )}>
                                    {item.name}
                                </span>
                                {isActive && !mobile && (
                                    <div className="ml-auto w-2 h-2 bg-[#8DC73D] rounded-full flex-shrink-0"></div>
                                )}
                            </Link>
                            {!mobile && (
                                <Link 
                                    href={item.href} 
                                    className="absolute inset-0 z-10" 
                                    aria-hidden="true"
                                />
                            )}
                        </div>
                    )
                })}
            </nav>
        )
    }

    // Rendu du logo
    const renderLogo = () => (
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
    )

    // Rendu du menu de sécurité (uniquement pour les administrateurs)
    const renderSecurityMenu = () => (
        isSuperAdmin && (
            <div className="mt-3">
                <Accordion type="single" collapsible defaultValue={securityActive ? "security" : undefined}>
                    <AccordionItem value="security" className="border-none">
                        <AccordionTrigger className="px-3 py-2 rounded-xl hover:no-underline text-blue-100 hover:bg-blue-500 hover:text-white">
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5" />
                                <span className="font-medium">Seguridad</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pl-2">
                            {securityItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <div key={item.name} className="relative group">
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 w-full text-sm",
                                                isActive
                                                    ? "bg-white/10 text-white"
                                                    : "text-blue-100 hover:bg-blue-500 hover:text-white"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4 flex-shrink-0" />
                                            <span>{item.name}</span>
                                            {isActive && (
                                                <div className="ml-auto w-2 h-2 bg-[#8DC73D] rounded-full"></div>
                                            )}
                                        </Link>
                                    </div>
                                );
                            })}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        )
    )

    // Rendu du footer
    const renderFooter = () => (
        <div className="pt-6 mt-auto border-t border-blue-400/30">
            <div className="text-xs text-blue-200/70 text-center">
                <p className="mt-1">2025 SMS Gateway</p>
            </div>
        </div>
    )

    // Rendu de la version desktop
    const renderDesktopSidebar = () => (
        <aside className="hidden md:flex md:w-64 h-screen bg-gradient-to-b from-[#0072BB] to-[#005a96] text-white p-4 flex-col">
            {renderLogo()}
            <div className="flex-1 pr-1 space-y-0.5 overflow-y-auto no-scrollbar">
                {renderNavItems()}
                {renderSecurityMenu()}
            </div>
            {renderFooter()}
        </aside>
    )

    // Rendu de la version mobile
    const renderMobileNav = () => (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-[0_-2px_15px_rgba(0,0,0,0.08)]">
            <div className="max-w-full mx-auto px-1 py-1 overflow-x-auto">
                <nav className="flex flex-nowrap min-w-max w-full">
                    {itemsToRender.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <div key={item.name} className="flex-shrink-0 w-20">
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex flex-col items-center justify-center py-2 rounded-lg transition-all duration-200 px-1",
                                        isActive 
                                            ? "text-[#0072BB] bg-blue-50" 
                                            : "text-gray-600 hover:text-[#0072BB]"
                                    )}
                                >
                                    <item.icon 
                                        className={cn(
                                            "h-5 w-5 mb-0.5 flex-shrink-0",
                                            isActive ? "text-[#0072BB]" : "text-gray-500"
                                        )} 
                                    />
                                    <span className="text-[10px] font-medium text-center leading-tight px-0.5">
                                        {item.name.split(' ')[0]}
                                    </span>
                                </Link>
                            </div>
                        );
                    })}
                </nav>
            </div>
        </div>
    )

    return (
        <>
            {renderDesktopSidebar()}
            {renderMobileNav()}
        </>
    )
}
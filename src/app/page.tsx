import { redirect } from "next/navigation"

export default function Home() {
    // Redirection automatique
    redirect("/login")
}

import { TicketList } from '@/components/tickets/TicketList'

export default function TicketsPage() {
    return (
        <div className="container mx-auto py-6">
            <div className="flex flex-col gap-4">
                <TicketList />
            </div>
        </div>
    )
}

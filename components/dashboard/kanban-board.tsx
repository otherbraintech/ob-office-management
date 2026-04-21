import { TicketStatus, TicketPriority } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type KanbanTicket = {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
};

const STATUS_COLUMNS: TicketStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'TESTING', 'DONE'];

export function KanbanBoard({ tickets }: { tickets: KanbanTicket[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
      {STATUS_COLUMNS.map((status) => (
        <div key={status} className="bg-muted p-2 rounded-lg">
          <h3 className="font-semibold mb-4 text-center">{status}</h3>
          <div className="space-y-4">
            {tickets
              .filter((ticket) => ticket.status === status)
              .map((ticket) => (
                <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="p-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm font-medium">{ticket.title}</CardTitle>
                      <Badge variant={ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {ticket.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  {ticket.description && (
                    <CardContent className="px-3 pb-3 text-xs text-muted-foreground line-clamp-2">
                       {ticket.description}
                    </CardContent>
                  )}
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

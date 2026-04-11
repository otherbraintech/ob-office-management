import { TicketStatus, TicketPriority } from '@prisma/client';

export type Ticket = {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  lead: { name: string | null };
};

export interface DashboardActionResponse<T> {
  data?: T;
  error?: string;
}

// AI Integration Mock
export async function generateTicketDetails(prompt: string) {
  // Mock AI call to OpenRouter or similar
  return {
    title: "AI Generated: " + prompt.substring(0, 20),
    description: "Generated task description for: " + prompt,
    priority: TicketPriority.MEDIUM,
  };
}

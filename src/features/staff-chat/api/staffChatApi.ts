import { axiosClient, endpoints } from "@/services";

export interface SupportSession {
  id: number;
  conversationId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: "WAITING" | "ACTIVE" | "CLOSED";
  assignedStaffId?: number | null;
  assignedStaffName?: string | null;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
}

export interface SupportMessage {
  id: number;
  conversationId: string;
  senderType: "CUSTOMER" | "STAFF" | "BOT";
  senderName: string;
  content: string;
  createdAt: string;
}

export const staffChatApi = {
  async getSessions(status?: string): Promise<SupportSession[]> {
    const res = await axiosClient.get<{ data: SupportSession[] }>(
      endpoints.support.staff.sessions,
      { params: { status: status || "ALL" } }
    );
    return res.data.data;
  },

  async getSession(conversationId: string): Promise<SupportSession> {
    const res = await axiosClient.get<{ data: SupportSession }>(
      endpoints.support.staff.session(conversationId)
    );
    return res.data.data;
  },

  async getMessages(conversationId: string, afterId?: number): Promise<SupportMessage[]> {
    const res = await axiosClient.get<{ data: SupportMessage[] }>(
      endpoints.support.staff.messages(conversationId),
      { params: { afterId } }
    );
    return res.data.data;
  },

  async assignStaff(conversationId: string): Promise<SupportSession> {
    const res = await axiosClient.post<{ data: SupportSession }>(
      endpoints.support.staff.assign(conversationId)
    );
    return res.data.data;
  },

  async sendMessage(conversationId: string, content: string): Promise<SupportMessage> {
    const res = await axiosClient.post<{ data: SupportMessage }>(
      endpoints.support.staff.send(conversationId),
      { content }
    );
    return res.data.data;
  },

  async closeSession(conversationId: string): Promise<SupportSession> {
    const res = await axiosClient.post<{ data: SupportSession }>(
      endpoints.support.staff.close(conversationId)
    );
    return res.data.data;
  },
};

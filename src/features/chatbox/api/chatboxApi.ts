import { axiosClient, endpoints } from "@/services";

export interface QuickAction {
  label: string;
  action: "navigate" | "ask" | "connect_staff" | "end_staff_session" | string;
  route?: string | null;
}

export interface ProductSummary {
  id: number;
  variantId?: number;
  name: string;
  brand?: string;
  description?: string;
  variantName?: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  stock?: number;
  imageUrl?: string;
  route?: string;
}

export interface StaffInfo {
  id: number;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status?: string;
}

export interface AiChatResponse {
  conversationId: string;
  message: string;
  messageType: "info" | "proposal" | "navigate" | "handover_proposal" | "staff_connected" | "staff_reply" | "staff_ended" | string;
  messageRoute?: string | null;
  quickActions: QuickAction[];
  products?: ProductSummary[];
  staffInfo?: StaffInfo | null;
}

export interface ChatHistoryItem {
  sender: "user" | "bot" | "staff";
  text: string;
}

export interface AiChatPayload {
  message: string;
  conversationId?: string;
  currentPath?: string;
  mode?: "ai" | "staff";
  history?: ChatHistoryItem[];
}

export interface SupportMessage {
  id: number;
  conversationId: string;
  senderType: "CUSTOMER" | "STAFF" | "BOT" | string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface SupportPollResponse {
  status: "WAITING" | "ACTIVE" | "CLOSED" | string;
  assignedStaffName?: string | null;
  messages: SupportMessage[];
}

export const chatboxApi = {
  async sendMessage(payload: AiChatPayload): Promise<AiChatResponse> {
    const res = await axiosClient.post<{ data: AiChatResponse }>(
      endpoints.support.chat,
      payload
    );
    return res.data.data;
  },

  async pollStaffMessages(conversationId: string, afterId?: number): Promise<SupportPollResponse> {
    const res = await axiosClient.get<{ data: SupportPollResponse }>(
      endpoints.support.poll,
      { params: { conversationId, afterId } }
    );
    return res.data.data;
  },
};

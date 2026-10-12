import { useState } from "react";
import { useStore } from "../state/context";
import { readState, request } from "./demoStore";
import {
  addTicketNote,
  createTicket,
  myWarrantyCards,
  relinkTicketCard,
  replaceTicketDevice,
  searchWarrantyCards,
  ticketSummaries,
  ticketView,
  transitionTicket,
} from "../domain/commerce";

// Các màn hình bảo hành gọi cùng một bộ hàm cho hai nguồn dữ liệu, cùng dạng trả về:
// đăng nhập thật (có token của BE) thì gọi API; phiên demo thì dùng dữ liệu trên trình duyệt.
function api(onSessionExpired) {
  const call = (path, options) =>
    request(path, options).then(
      (res) => res?.data ?? res,
      (err) => {
        // Token hết hạn hoặc tài khoản bị khóa: báo để người dùng được đưa về trang đăng nhập.
        if (err.status === 401) onSessionExpired(err.message);
        // Khi không tới được BE, fetch ném TypeError với thông báo tiếng Anh của trình duyệt.
        throw err instanceof TypeError
          ? new Error("Không kết nối được máy chủ. Vui lòng thử lại.")
          : err;
      },
    );
  const send = (method, path, body) =>
    call(path, { method, body: JSON.stringify(body) });
  return {
    mode: "api",
    searchCards: (q) => call("/api/warranty-cards?q=" + encodeURIComponent(q)),
    createRequest: (body) => send("POST", "/api/service-requests", body),
    listRequests: (status) =>
      call("/api/service-requests" + (status ? "?status=" + status : "")),
    getRequest: (id) => call("/api/service-requests/" + id),
    transition: (id, body) =>
      send("POST", "/api/service-requests/" + id + "/transitions", body),
    addNote: (id, body) =>
      send("POST", "/api/service-requests/" + id + "/notes", body),
    relinkCard: (id, body) =>
      send("PUT", "/api/service-requests/" + id + "/warranty-card", body),
    replaceDevice: (id, body) =>
      send("POST", "/api/service-requests/" + id + "/replacement", body),
    myCards: () => call("/api/my/warranty-cards"),
  };
}

function demo(commit, user) {
  // readState() luôn là dữ liệu vừa ghi gần nhất, kể cả khi React chưa kịp vẽ lại.
  const change = async (update, id) => ticketView(commit(update), id, user);
  return {
    mode: "demo",
    searchCards: async (q) => searchWarrantyCards(readState(), q),
    createRequest: async (body) => {
      const id =
        "BH-" +
        new Date().toLocaleDateString("en-CA").slice(2).replaceAll("-", "") +
        "-" +
        crypto.randomUUID().slice(0, 6).toUpperCase();
      return change((d) => createTicket(d, body, id, user), id);
    },
    listRequests: async (status) => ticketSummaries(readState(), status),
    getRequest: async (id) => ticketView(readState(), id, user),
    transition: async (id, body) =>
      change((d) => transitionTicket(d, id, body, user), id),
    addNote: async (id, body) =>
      change((d) => addTicketNote(d, id, body, user), id),
    relinkCard: async (id, body) =>
      change((d) => relinkTicketCard(d, id, body, user), id),
    replaceDevice: async (id, body) =>
      change((d) => replaceTicketDevice(d, id, body, user), id),
    myCards: async () => myWarrantyCards(readState(), user.id),
  };
}

export function useAftersales() {
  const { commit, user, signOut, notify } = useStore();
  // Tạo một lần cho cả vòng đời màn hình, để effect tải dữ liệu không chạy lại mỗi lần vẽ.
  // Giữ các hàm của lần vẽ đầu là an toàn: chúng chỉ dùng ref và setState của StoreProvider.
  const [service] = useState(() =>
    sessionStorage.getItem("techzone-token")
      ? api((message) => {
          // Đăng xuất làm RequireRole chuyển về trang đăng nhập và nhớ trang đang xem.
          signOut();
          notify(message, "danger");
        })
      : demo(commit, user),
  );
  return service;
}

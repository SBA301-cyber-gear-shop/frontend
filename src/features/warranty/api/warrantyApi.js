import { axiosClient, endpoints } from "@/services";

const e = endpoints.aftersales;

// Gọi API bảo hành của BE. onSessionExpired chạy khi BE trả 401 (token hết hạn hoặc tài khoản bị khóa).
export function createWarrantyApi(onSessionExpired) {
  const call = (promise) =>
    promise.then(
      ({ data }) => data?.data ?? data,
      (err) => {
        if (err.response?.status === 401) onSessionExpired(err.message);
        // Không có response nghĩa là không tới được BE; thông báo gốc của axios là tiếng Anh.
        throw err.response
          ? err
          : new Error("Không kết nối được máy chủ. Vui lòng thử lại.");
      },
    );
  return {
    searchCards: (q) => call(axiosClient.get(e.cards, { params: { q } })),
    createRequest: (body) => call(axiosClient.post(e.requests, body)),
    listRequests: (status) =>
      call(
        axiosClient.get(e.requests, {
          params: status ? { status } : undefined,
        }),
      ),
    getRequest: (id) => call(axiosClient.get(e.request(id))),
    transition: (id, body) => call(axiosClient.post(e.transitions(id), body)),
    addNote: (id, body) => call(axiosClient.post(e.notes(id), body)),
    relinkCard: (id, body) => call(axiosClient.put(e.card(id), body)),
    replaceDevice: (id, body) =>
      call(axiosClient.post(e.replacement(id), body)),
    myCards: () => call(axiosClient.get(e.myCards)),
  };
}

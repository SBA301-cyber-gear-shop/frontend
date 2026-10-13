export const fits = [
  {
    id: "gaming",
    label: "Chơi game",
    title: "Đắm mình trong từng khung hình.",
    description:
      "Bắt đầu từ tựa game, độ phân giải và ngân sách. Cân đối card đồ họa, CPU và màn hình cho trải nghiệm bạn muốn.",
    focus: ["Card đồ họa", "Bộ vi xử lý", "Màn hình 144Hz+"],
    budgetRecommendation: "Từ 18.500.000₫",
    perfHighlight: "240+ FPS Esports / 90+ FPS AAA 2K",
    image: "gpu",
    link: "/build-pc?purpose=gaming",
  },
  {
    id: "creative",
    label: "Sáng tạo",
    title: "Thêm không gian cho ý tưởng.",
    description:
      "Dựng video 4K, thiết kế 3D hay xử lý âm thanh: chọn linh kiện theo phần mềm, dung lượng dự án và khả năng mở rộng.",
    focus: ["Bộ nhớ RAM 32GB+", "SSD Gen4 tốc độ cao", "CPU đa nhân"],
    budgetRecommendation: "Từ 24.000.000₫",
    perfHighlight: "Render After Effects & Blender siêu tốc",
    image: "ram",
    link: "/build-pc?purpose=creative",
  },
  {
    id: "work",
    label: "Làm việc",
    title: "Gọn góc làm việc. Rộng khả năng.",
    description:
      "Ưu tiên tính ổn định, tản nhiệt êm ái, màn hình chuẩn màu và khả năng nâng cấp lâu dài cho văn phòng & lập trình.",
    focus: ["Đa nhiệm mượt mà", "Màn hình IPS chuẩn màu", "Tiết kiệm điện"],
    budgetRecommendation: "Từ 12.900.000₫",
    perfHighlight: "Đa nhiệm 50+ tabs, biên dịch mã tức thì",
    image: "laptop",
    link: "/danh-muc/laptop",
  },
];
export const budgetPresets = [
  {
    tier: "Phổ thông & Esports",
    range: "15 - 20 Triệu",
    badge: "Bán chạy nhất",
    budgetVal: 18,
    specs: {
      cpu: "Intel Core i5-13400F (10 nhân / 16 luồng)",
      gpu: "NVIDIA GeForce RTX 3050 6GB GDDR6",
      ram: "16GB DDR4 3200MHz tản nhiệt thép",
      ssd: "500GB NVMe PCIe Gen3 (2500MB/s)",
      psu: "550W 80 Plus Bronze chứng nhận",
    },
    fps: [
      { name: "Valorant (1080p High)", val: "280 FPS" },
      { name: "League of Legends", val: "240 FPS" },
      { name: "CS2 (1080p Medium)", val: "170 FPS" },
    ],
    highlight: "Khởi đầu hoàn hảo cho game thủ trẻ & học tập đồ họa cơ bản",
    link: "/build-pc?budget=18",
  },
  {
    tier: "Gaming 2K & Đồ họa",
    range: "25 - 32 Triệu",
    badge: "Khuyên dùng",
    budgetVal: 28,
    specs: {
      cpu: "Intel Core i5-14400F / Ryzen 5 7600",
      gpu: "NVIDIA GeForce RTX 4060 8GB (DLSS 3)",
      ram: "32GB (2x16GB) DDR5 5600MHz",
      ssd: "1TB PCIe Gen4 NVMe (5000MB/s)",
      psu: "650W 80 Plus Gold hiệu suất cao",
    },
    fps: [
      { name: "Black Myth: Wukong (DLSS)", val: "85 FPS" },
      { name: "Cyberpunk 2077 (2K)", val: "75 FPS" },
      { name: "Premiere 4K Timeline", val: "Mượt mà" },
    ],
    highlight:
      "Chiến trọn vẹn game AAA ở độ phân giải 2K và dựng video mượt mà",
    link: "/build-pc?budget=28",
  },
  {
    tier: "Hiệu năng Cao & Streamer",
    range: "38 - 48 Triệu",
    badge: "Pro Choice",
    budgetVal: 42,
    specs: {
      cpu: "Intel Core i7-14700K / Ryzen 7 7800X3D",
      gpu: "NVIDIA GeForce RTX 4070 SUPER 12GB",
      ram: "32GB DDR5 6000MHz CL30 RGB",
      ssd: "1TB PCIe Gen4 Pro (7400MB/s)",
      psu: "750W 80 Plus Gold Modular",
    },
    fps: [
      { name: "Black Myth: Wukong (2K Max RT)", val: "115 FPS" },
      { name: "Forza Horizon 5 (2K Extreme)", val: "160 FPS" },
      { name: "Live Stream 1080p60fps", val: "Không tụt FPS" },
    ],
    highlight:
      "Cấu hình chuẩn cho streamer, tuyển thủ thi đấu và nhà sáng tạo nội dung",
    link: "/build-pc?budget=42",
  },
  {
    tier: "Flagship Creator & AI",
    range: "60+ Triệu",
    badge: "Cực đỉnh",
    budgetVal: 65,
    specs: {
      cpu: "Intel Core i9-14900K / Ryzen 9 7950X3D",
      gpu: "NVIDIA GeForce RTX 4080 SUPER 16GB",
      ram: "64GB DDR5 6400MHz",
      ssd: "2TB Samsung 990 PRO NVMe",
      psu: "1000W 80 Plus Platinum AIO 360",
    },
    fps: [
      { name: "Cyberpunk 4K Ray Tracing Overdrive", val: "100+ FPS" },
      { name: "3D Blender Render", val: "Nhanh gấp 3x" },
      { name: "Chạy mô hình LLM AI Local", val: "Tức thì" },
    ],
    highlight:
      "Không giới hạn sáng tạo, tối đa khung hình ở chuẩn hiển thị 4K cao cấp",
    link: "/build-pc?budget=65",
  },
];
export const faqs = [
  {
    id: "showroom",
    num: "01",
    tag: "Showroom",
    q: "Có được tự tay kiểm tra và xem ráp máy không?",
    highlights: [
      "Tự tay bóc seal & kiểm tra linh kiện chính hãng 100%.",
      "Xem trực tiếp kỹ thuật viên lắp ráp & test tải nặng trước khi nhận máy.",
    ],
    linkText: "Xem địa chỉ showroom",
    linkTo: "/cua-hang",
  },
  {
    id: "beginner",
    num: "02",
    tag: "Tư vấn",
    q: "Chưa rành phần cứng thì bắt đầu từ đâu?",
    highlights: [
      "Chỉ cần chọn mức ngân sách & tựa game/phần mềm cần dùng.",
      "Hệ thống tự động ghép linh kiện tương thích 100%, không lo nghẽn.",
    ],
    linkText: "Mở bộ dự toán cấu hình",
    linkTo: "#simulator",
  },
  {
    id: "stress-test",
    num: "03",
    tag: "Chất lượng",
    q: "Quy trình kiểm tra nhiệt độ và độ ổn định ra sao?",
    highlights: [
      "Stress Test FurMark + Cinebench liên tục tối thiểu 45 phút.",
      "Bàn giao kèm biên bản đo nhiệt độ tải tối đa và hiệu năng thực tế.",
    ],
    linkText: "Khám phá cấu hình mẫu",
    linkTo: "/build-pc",
  },
  {
    id: "warranty",
    num: "04",
    tag: "Bảo hành",
    q: "Chính sách đổi mới 30 ngày và bảo hành áp dụng thế nào?",
    highlights: [
      "Lỗi phần cứng trong 30 ngày đầu được đổi mới linh kiện 100%.",
      "Bảo hành điện tử chính hãng theo số điện thoại, không cần giữ giấy tờ.",
    ],
    linkText: "Tra cứu bảo hành của tôi",
    linkTo: "/bao-hanh",
  },
  {
    id: "payment",
    num: "05",
    tag: "Thanh toán",
    q: "TechZone hỗ trợ hình thức thanh toán và trả góp nào?",
    highlights: [
      "Trả góp 0% qua thẻ tín dụng, xét duyệt nhanh trong 15 phút.",
      "Thanh toán linh hoạt: Chuyển khoản QR 24/7, Visa/MasterCard, tiền mặt.",
    ],
    linkText: "Chính sách mua sắm",
    linkTo: "/cua-hang",
  },
];

# MeetDraw

> **Xây dựng hệ thống phòng họp trực tuyến tích hợp bảng trắng cộng tác theo mô hình Client–Server kết hợp Peer-to-Peer (P2P) sử dụng WebRTC.**

---

## 1. Tính năng chính (Version 1 - Web Application)

- **Phòng họp trực tuyến**:
  - Tạo phòng tức thì với mã phòng ngắn gọn hoặc tiêu đề tùy chọn.
  - Tham gia phòng bằng Room ID hoặc đường link trực tiếp.
  - Hỗ trợ mạng lưới đa người dùng Mesh P2P (tối ưu cho 2–4 người dùng).
- **Whiteboard cộng tác thời gian thực (Fabric.js)**:
  - Vẽ bút tự do (Pen) với tùy biến nét vẽ và màu sắc.
  - Vẽ các hình cơ bản: Đường thẳng (Line), Hình chữ nhật (Rect), Hình tròn (Circle).
  - Chèn và chỉnh sửa văn bản (Text / IText).
  - Chọn, di chuyển, phóng to/thu nhỏ, xoay đối tượng (Select & Transform).
  - Tẩy xóa từng đối tượng (Eraser), xóa các đối tượng đang chọn, xóa sạch bảng (Clear).
  - Thao tác Undo / Redo cục bộ và đồng bộ thay đổi qua mạng P2P.
  - Chia sẻ con trỏ chuột thời gian thực (Floating Remote Cursors) hiển thị tên và màu đại diện của từng thành viên.
  - Lưu và tải lại bản vẽ (Whiteboard Snapshot) vào cơ sở dữ liệu MySQL.
  - Xuất bảng vẽ ra file ảnh PNG chất lượng cao.
- **Voice & Video Call (WebRTC)**:
  - Thu nhận luồng âm thanh Microphone và hình ảnh Camera (`getUserMedia`).
  - Hiển thị lưới video (Video Grid) với chỉ báo người nói và trạng thái mute.
  - Bật/Tắt Microphone và Camera linh hoạt.
- **Chat thời gian thực**:
  - Nhắn tin trực tiếp giữa các Peer qua WebRTC DataChannel (UDP).
- **Kiến trúc mạng tối ưu**:
  - **TCP (HTTP / WebSocket)**: Dùng cho REST API (Auth, Room metadata) và Signaling đàm phán kết nối ban đầu.
  - **UDP (WebRTC P2P)**: Truyền tải trực tiếp toàn bộ luồng Audio, Video, sự kiện Whiteboard và tin nhắn Chat. Không đi qua server trung gian nếu kết nối P2P thành công.

---

## 2. Cấu trúc dự án (Monorepo)

```text
MeetRoom/
├── shared/       # Protocol & Types dùng chung (Signaling, Whiteboard, Room, User)
├── server/       # Node.js + Express + WebSocket Signaling + MySQL2
├── client/       # React + Vite + Tailwind CSS + Fabric.js + WebRTC Mesh
└── docs/         # Tài liệu phân tích mạng Wireshark (TCP vs UDP)
```

---

## 3. Hướng dẫn cài đặt và khởi chạy

### Yêu cầu hệ thống
- **Node.js**: >= 18 (Khuyên dùng v20 hoặc v24)
- **MySQL**: (Tùy chọn – Hệ thống có tích hợp in-memory store tự động nếu chưa bật MySQL)

### Cài đặt dependencies
Tại thư mục gốc dự án:
```bash
npm install
```

### Khởi chạy chế độ phát triển (Development)

Chạy cả Server và Client song song:
```bash
npm run dev
```

Hoặc chạy từng thành phần:
```bash
# Chạy Server (Port 5000)
npm run dev:server

# Chạy Client (Port 3000)
npm run dev:client
```

- **Client Web UI**: [http://localhost:3000](http://localhost:3000)
- **Server REST API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Signaling WebSocket**: `ws://localhost:5000/signaling`

---

## 4. Hướng dẫn kiểm thử 2 hoặc nhiều Peer (Multi-Peer Testing)

1. Mở cửa sổ trình duyệt 1 (ví dụ Chrome): truy cập `http://localhost:3000`.
2. Nhập tên (ví dụ: *User A*), nhấn **Create & Launch** để tạo phòng họp mới.
3. Nhấp vào nút copy mã phòng trên thanh TopNav.
4. Mở cửa sổ trình duyệt thứ 2 (hoặc mở chế độ ẩn danh / trình duyệt Edge): truy cập `http://localhost:3000`.
5. Nhập tên (ví dụ: *User B*), dán mã phòng và nhấn **Join Meeting**.
6. **Kiểm tra kết nối**:
   - Chỉ báo WebRTC trên TopNav chuyển sang `1 P2P Peer (UDP)`.
   - Vẽ một hình chữ nhật trên màn hình User A -> Hình chữ nhật xuất hiện tức thì trên màn hình User B.
   - Di chuyển chuột trên màn hình User B -> Con trỏ chuột của User B xuất hiện mượt mà trên bảng vẽ của User A.
   - Gửi tin nhắn trong mục Chat -> Tin nhắn được truyền qua kênh DataChannel UDP.
   - Bật camera/mic -> Hai bên nghe và nhìn thấy nhau qua luồng WebRTC.
7. Mở tiếp tab thứ 3 và 4 để kiểm thử khả năng Mesh P2P đa điểm.

# 📖 PHÙ THỦY GIẢ — TIỂU THUYẾT KỲ ẢO HIỆN ĐẠI

> **Tác giả:** Andy Hoàng Hiếu  
> **Quy mô:** 4 Tập • 70 Chương hoàn chỉnh  
> **Nền tảng:** Website đọc truyện hiện đại chuẩn Editorial & Cinematic, tối ưu hóa trải nghiệm đọc tập trung cao cấp.

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Trang Chủ Hiện Đại (Landing Page)**:
   - **Hero Banner điện ảnh**: Tên tác phẩm ánh kim phong cách `Cormorant Upright`, tóm tắt bối cảnh và nút **"Đọc tiếp [Chương X]"** tự động nhận diện từ bookmark đã lưu.
   - **Thư viện 4 Tập sách phong cách Amazon Kindle Full-Bleed**:
     - Ảnh bìa tập sách chiếm trọn 100% bề rộng đỉnh card, thiết kế tràn viền hiện đại (không có khoảng đệm thừa).
     - Hiệu ứng gờ gáy sách ánh kim và hiệu ứng zoom nhẹ (`scale(1.04)`) khi rê chuột.
     - Chiều cao tiêu đề được cố định chuẩn 2 dòng, giúp 4 thẻ tập luôn thẳng hàng và đồng đều tuyệt đối.

2. **Hệ Thống Phông Chữ Độc Quyền (Typography System)**:
   - **Tiêu đề cố định nghệ thuật (`Cormorant Upright` & `Cormorant Garamond`)**: Mọi tiêu đề lớn, tên tác phẩm, tên chương và chữ hoa đầu dòng (Drop Cap) luôn giữ vững phong cách typography cổ điển châu Âu sang trọng, hỗ trợ trọn vẹn 100% tiếng Việt không bị khuyết dấu hay cắt đỉnh.
   - **Văn bản đọc chuẩn sách Amazon Kindle (`Bookerly Webfont`)**: Tích hợp trực tiếp bộ font `Bookerly` bản địa (Regular, Italic, Bold, Bold Italic) trong thư mục `bookerly-webfont/` làm font đọc mặc định, đem lại độ tương phản và nét chữ êm ái nhất cho mắt khi đọc lâu.
   - **Tùy biến linh hoạt**: Khi người đọc đổi font trong bảng cài đặt (Bookerly, EB Garamond, Lora, Không chân), hệ thống **chỉ thay đổi font chữ của nội dung truyện**, giữ nguyên phong cách nhận diện cho toàn bộ tiêu đề.

3. **Trải Nghiệm Đọc Sách Chuyên Sâu (Reader Mode)**:
   - **Chữ cái đầu chương (Editorial Drop Cap)**: Tự động trích xuất chữ cái đầu tiên của chương và phóng lớn nghệ thuật.
   - **Tự động in nghiêng câu thoại**: Bất kỳ đoạn văn nào bắt đầu bằng ký tự gạch đầu dòng (`–`, `—`, `-`) đều tự động được nhận diện và in nghiêng.
   - **Tự động in nghiêng suy nghĩ**: Mọi câu văn nằm trong dấu ngoặc kép `“ ”` hoặc `" "` đều tự động được định dạng chữ nghiêng (`thought-text`).
   - **Tự động làm sạch dữ liệu**: Tự động loại bỏ hoàn toàn các dãy ký tự phân cách thô dạng `========================` hoặc `----`.

4. **Hệ Thống Từ Khóa Nổi Bật (Text Highlight)**:
   - Danh sách từ khóa quản lý độc lập tại file `contents/text-highlight.txt`.
   - Mọi từ khóa xuất hiện trong truyện đều tự động được **in nghiêng** và đổi sang **màu cam sậm (`#d95a14`)** trang nhã.

5. **Quản Lý Hình Ảnh Theo Vị Trí (Local Images)**:
   - Ảnh được tổ chức theo thư mục riêng từng chương: `Images/Vol-<X>/Life-<YY>/`.
   - Đánh số theo thứ tự hiển thị từ trên xuống:
     - `image-01`: Ảnh bìa Hero Banner trên cùng của chương.
     - `image-02`, `image-03`...: Các tranh minh họa chèn trải đều giữa nội dung bài viết.
   - Nhấp vào bất kỳ ảnh nào để mở chế độ xem phóng to toàn màn hình (Lightbox).

6. **Lưu Trữ Tự Động & Cá Nhân Hóa (100% Offline)**:
   - Tự động lưu chương và vị trí cuộn trang đang đọc dở (`localStorage`).
   - Tùy chỉnh chế độ đọc: 4 Theme màu (Tối, Sáng, Sepia, Nord), 4 Phông chữ văn bản đọc, thanh trượt cỡ chữ và độ rộng trang.
   - Không cần cài đặt máy chủ web phức tạp, mở trực tiếp bằng cách click đúp file `index.html`.

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```text
Phu Thuy Gia/
├── index.html                 # Giao diện chính của website
├── style.css                  # Toàn bộ mã định dạng CSS, theme và typography
├── script.js                  # Logic ứng dụng, hiệu ứng cuộn, bộ lọc thoại & suy nghĩ
├── data.js                    # Dữ liệu 4 tập và 70 chương truyện (sinh tự động)
├── parse-novel.js             # Script tự động phân tích file txt và ánh xạ ảnh
├── package.json               # Cấu hình dự án và lệnh npm run parse
├── README.md                  # Tài liệu hướng dẫn sử dụng và cập nhật
│
├── bookerly-webfont/          # Bộ font Kindle Bookerly chuẩn cho nội dung đọc
│   ├── Bookerly.woff          # Bookerly Regular (400)
│   ├── Bookerly Italic.woff   # Bookerly Italic (400)
│   ├── Bookerly Bold.woff     # Bookerly Bold (700)
│   └── ...
│
├── contents/                  # Thư mục chứa dữ liệu văn bản nguồn
│   ├── combine/
│   │   └── Phu Thuy Gia.txt   # File văn bản tổng của toàn bộ tác phẩm (4 tập, 70 chương)
│   ├── text-highlight.txt     # Danh sách từ khóa in nghiêng & màu cam sậm
│   └── text-highlight.json    # File từ khóa định dạng JSON (dự phòng)
│
└── Images/                    # Thư mục hình ảnh phân cấp theo tập & chương
    ├── Vol-1/
    │   ├── Life-00/
    │   │   ├── image-01.jpg   # Ảnh bìa chương 0 (Hero Banner)
    │   │   └── image-02.jpg   # Ảnh minh họa trong bài (nếu có)
    │   ├── Life-01/
    │   └── ...
    ├── Vol-2/
    ├── Vol-3/
    └── Vol-4/
```

---

## 🛠️ HƯỚNG DẪN CẬP NHẬT TRUYỆN

### 1. Thêm hoặc chỉnh sửa nội dung chương
1. Mở file `contents/combine/Phu Thuy Gia.txt` và sửa nội dung hoặc thêm chương mới (đặt tiêu đề theo cú pháp `Life XX - Tên Chương`).
2. Mở cửa sổ dòng lệnh (Terminal / PowerShell) tại thư mục dự án và chạy:
   ```bash
   npm run parse
   ```
3. Tải lại trang web (F5), toàn bộ nội dung mới sẽ được biên dịch và cập nhật tự động.

---

### 2. Thêm hoặc đổi ảnh bìa / minh họa
1. Vào thư mục của chương tương ứng, ví dụ `Images/Vol-1/Life-00/`.
2. Đặt tên file ảnh theo quy tắc vị trí từ trên xuống:
   - **Ảnh bìa trên cùng**: Đặt tên là `image-01.jpg` (hoặc `.png`, `.webp`).
   - **Ảnh minh họa thứ 1**: Đặt tên là `image-02.jpg`.
   - **Ảnh minh họa thứ 2**: Đặt tên là `image-03.jpg`.
3. Chạy lệnh:
   ```bash
   npm run parse
   ```
4. Web sẽ tự động phân bổ và hiển thị ảnh đúng vị trí.

---

### 3. Thêm từ khóa in nghiêng và màu cam sậm
1. Mở file `contents/text-highlight.txt`.
2. Gõ thêm từ khóa hoặc tên riêng bạn muốn làm nổi bật (mỗi từ trên một dòng).
3. Chạy lệnh:
   ```bash
   npm run parse
   ```
4. Tải lại trang web để xem các từ khóa mới được highlight tức thì.

---

## ⌨️ PHÍM TẮT TIỆN ÍCH KHI ĐỌC

| Phím tắt | Chức năng |
| :--- | :--- |
| **`H`** | Quay về **Trang chủ** |
| **`M`** | Mở / Đóng thanh trượt **Mục lục** |
| **`ESC`** | Đóng Mục lục / Bảng cài đặt / Chế độ phóng to ảnh |
| **`←` (Mũi tên trái)** | Chuyển về **Chương trước** |
| **`→` (Mũi tên phải)** | Chuyển sang **Chương kế tiếp** |

---

*Tác phẩm độc quyền của tác giả **Andy Hoàng Hiếu**.*

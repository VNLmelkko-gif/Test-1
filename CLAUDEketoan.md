# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tổng quan

Website giới thiệu (landing page) của VNL Trading Oy – giải pháp tự làm kế toán tài chính cho doanh nghiệp tại Phần Lan. Node.js thuần, **không có dependency, không build, không lint, không test**. Giao diện có 3 ngôn ngữ: Phần Lan (mặc định), Việt, Anh.

## Lệnh

```bash
npm start        # chạy server tại http://localhost:3000 (đổi cổng bằng biến môi trường PORT)
```

Sau khi sửa file trong `public/`, chỉ cần tải lại trình duyệt (Ctrl+F5 để bỏ cache) – không cần khởi động lại server. Chỉ sửa `server.js` mới phải chạy lại. Kiểm tra cú pháp nhanh: `node --check public/i18n.js`.

## Kiến trúc

- `server.js`: static server dùng module `http`, phục vụ thư mục `public/`, có chặn path traversal (`startsWith(PUBLIC_DIR)`). Không có API hay route nào khác.
- `public/index.html`: toàn bộ nội dung trang. **Không viết chữ trực tiếp trong HTML** – mọi đoạn văn bản dùng `data-i18n="khóa"` (hoặc `data-i18n-ph` cho placeholder), phần tử để trống.
- `public/i18n.js`: từ điển `I18N = { fi, vi, en }` cùng hàm `applyLang()`. Nó gán `innerHTML` (nên giá trị có thể chứa `<br>`, `<span class="gold">`), cập nhật `<title>`, meta description, `lang` của `<html>`, và lưu lựa chọn vào `localStorage` (`vnl-lang`). Thiếu khóa ở một ngôn ngữ thì rơi về bản tiếng Phần Lan.
- `public/app.js`: máy tính VAT và form đăng ký (demo, không gửi đi đâu). Đăng ký `window.onLangChange` để tính lại số tiền theo `LOCALES` và đổi lại thông báo khi đổi ngôn ngữ. `app.js` phụ thuộc biến toàn cục từ `i18n.js` nên **phải load sau** nó.
- `chatbot.js` + `public/chat.js`: khung chat nổi ở góc phải. Trình duyệt gửi lịch sử hội thoại tới `POST /api/chat` (`server.js`), server gọi Gemini (`gemini-3.5-flash-lite`) với `GEMINI_API_KEY` đọc từ `.env` – khóa chỉ nằm ở server. Bot đóng vai kế toán viên và chỉ trả lời theo bộ FAQ nằm trong `SYSTEM_PROMPT` (trả lời theo ngôn ngữ người hỏi); sửa FAQ thì sửa ở đó và phải **khởi động lại server**. Có giới hạn 20 câu/phút/IP.
- `public/styles.css`: biến màu ở `:root` (đen, navy, trắng, vàng). Header là nền vàng chuyển sắc dùng logo chữ xanh; phần thân là tone tối.
- `Logo VNL Trading/`: bộ logo gốc do khách cung cấp. Trang chỉ dùng bản đã copy vào `public/` (`logo-blue.png` cho header, `favicon.png`); `logo.png` (chữ trắng) hiện không còn được tham chiếu.

## Quy ước khi chỉnh sửa

- Thêm hoặc đổi chữ: sửa **cả ba ngôn ngữ** trong `public/i18n.js` cùng lúc, giữ cùng một bộ khóa. Câu tiếng Việt thường do chủ dự án chỉ định nguyên văn – không tự viết lại.
- Thuế và pháp lý là nội dung nhạy cảm; đối chiếu với Verohallinto (vero.fi) trước khi sửa. Mức VAT hiện hành (từ 1/1/2026): 25,5 %, 13,5 % (thực phẩm, nhà hàng, sách, thuốc, thể thao–văn hóa, vận tải hành khách, lưu trú), 10 % (báo và tạp chí), 0 % (thuế suất 0 %, khác với miễn VAT). Lưu trữ: chứng từ ≥ 6 năm, sổ sách và báo cáo tài chính ≥ 10 năm. Các mức này xuất hiện ở nhiều chỗ: ô `<select id="rate">` và danh sách `.notes` trong `index.html`, các khóa `calc.*` và `f6.p` trong `i18n.js`.
- Gói giá (29/49/99 €) nằm trực tiếp trong `index.html`; tên gói và mục tính năng nằm ở các khóa `p*.n` và `pl.*`. Gói Oy dùng `pl.taxOy` (tờ khai thuế công ty), hai gói Tmi dùng `pl.tax` – hai loại tờ khai khác nhau.
- Khoảng cách dọc giữa hero, "Tính năng" và "Bạn không đơn độc" được chủ dự án chỉnh có chủ đích (~88 px nhìn thấy); thay đổi padding của `.hero`, `#ominaisuudet`, `#tuki` ở cuối `styles.css` cần đo lại.
- Nhánh làm việc là `main`, remote `origin` là `VNLmelkko-gif/Test-1`. Chưa có `.gitignore`.

## Quy tắc Git

- Luôn hỏi xác nhận trước khi push lên Github
- Không bao giờ commit file .env hoặc bất kỳ file chứa API key

<div align="center">

# Quire Ink cho Ghost

`0.1.0`

**Một theme Ghost cho người viết dài và muốn được đọc.**
Mặt đọc của blog engine [Quire Ink](https://quireink.com), được *sinh ra* từ chính stylesheet
của engine đó chứ không chép tay.
Không máy chủ font, không đo đếm hành vi, không một request nào của theme đi ra khỏi tên miền
của bạn.

![Ghost 5+](https://img.shields.io/badge/Ghost-5%2B-15171A?logo=ghost&logoColor=white)
![Handlebars](https://img.shields.io/badge/Handlebars-f0772b?logo=handlebarsdotjs&logoColor=white)
![gscan: 0 lỗi](https://img.shields.io/badge/gscan-0%20l%E1%BB%97i-22c55e)
![121 KB một bài](https://img.shields.io/badge/m%E1%BB%99t%20b%C3%A0i-121%20KB-22c55e)

[English](./README.md) · **Tiếng Việt**

<img src="docs/shots/article.png" alt="Trang bài viết: mục lục của bài đứng ở lề trái với đánh số phân cấp, khoảng bảy mươi ký tự chữ Literata ở giữa, ngày tháng cùng số chữ, thời gian đọc và thẻ ở lề phải" width="1000">

<sub>Một bài viết ở khổ màn hình đủ chứa ba cột. Cột giữa rộng chừng bảy mươi ký tự, hai lề là
phần còn lại. Đó là thiết kế chứ không phải chi tiết của thiết kế: hẹp hơn khổ đó thì hai lề tự
gập lại và cột chữ chiếm cả màn hình.</sub>

</div>

## Nó là gì

Một theme cho blog mà thứ đáng kể là chữ.

Người đọc mở một bài và nhận được một cột chữ bằng font sách, mục lục của chính bài đó đứng ở
lề bên này, các thông tin của bài ở lề bên kia. Họ chọn một trong sáu bảng màu, sáng hoặc tối,
và site nhớ lựa chọn đó trên máy họ. Sáu bộ chữ nằm sẵn trong theme, nên người lạ ở đầu sóng
yếu chỉ phải chờ chữ của bạn chứ không chờ một máy chủ font.

Toàn bộ phần nhìn được **sinh ra** từ stylesheet của blog engine, đúng cái sheet mà blog đó
đang render. Không phải bản mô phỏng, cũng không phải bản chép rồi trôi dần: bộ trích chạy
chính các hàm sinh CSS của engine, và một chốt canh so từng byte.

Không có gì của bạn bị khoá lại. Không kiểu bài tự chế, không phân loại riêng, không bảng cơ sở
dữ liệu nào. Đổi theme thì mọi bài vẫn là bài.

## Bạn được gì

| Phần | Nó làm gì |
|:---|:---|
| 📐&nbsp;**Trang** | Một cột chừng bảy mươi ký tự, mục lục bài ở một lề và thông tin bài ở lề kia. Hẹp hơn khổ chứa nổi chúng, cả hai tự gập, không cần một bố cục thứ hai để bảo trì |
| 🎨&nbsp;**Màu** | Sáu bảng màu, mỗi bảng có bản sáng và tối, người đọc chọn và máy họ nhớ. Bảng nào cũng đạt WCAG AA trên chính nền của nó, và một chốt canh đo lại cả sáu mươi màu sau mỗi lần chạy |
| 🔤&nbsp;**Chữ** | Sáu bộ chữ nằm trong theme, đều giấy phép OFL, cắt cho Latin, Latin mở rộng và tiếng Việt. Hai mươi mốt file được đóng gói, trình duyệt tải bốn, vì mỗi bộ tự khai nó phủ những ký tự nào |
| 📖&nbsp;**Chế độ sách** | Bài viết dựng lại thành hai cột với chữ hoa đầu bài, cỡ tính theo cửa sổ, và giữ đúng chỗ người đọc đang dừng |
| ✒️&nbsp;**Kiểu chữ sách** | Thụt đầu dòng, canh đều hai bên, ngắt từ ở cuối dòng. Mặc định tắt, vì đó là khẩu vị chứ không phải cải tiến |
| 🗓️&nbsp;**Trang danh sách** | Một trục dọc ở lề với nhãn năm dính theo và một mốc ở mỗi tháng mới, đặt dựa vào các thẻ bài đã có sẵn |
| 🔍&nbsp;**Tìm kiếm** | Ô tìm nổi của engine, mở bằng phím `/` ở bất cứ đâu, đọc dữ liệu qua Content API của Ghost |
| 💻&nbsp;**Giao diện terminal** | Dấu ngoặc vuông thay cho biểu tượng, số thứ tự ở lề. Tắt được |
| ⚙️&nbsp;**Chín cài đặt** | Bảng màu, cho phép người đọc đổi màu, sáng/tối mặc định, giao diện terminal, kiểu chữ sách, ảnh trong danh sách, ảnh đầu bài, dòng mô tả site, dòng ghi công. Tất cả nằm trong bảng Design của Ghost |

## Người đọc trả bao nhiêu

Đo bằng `bun run check:filesize`, nén gzip ở chỗ máy chủ sẽ nén, và chỉ tính bốn file font mà
trình duyệt của người đọc Latin hay tiếng Việt thật sự tải trong hai mươi mốt file được đóng gói.

| | |
|:---|---:|
| Năm stylesheet (đã gzip) | 51,9 KB |
| Ba script (đã gzip) | 15,4 KB |
| Font (hai bộ chữ mà bài đầu tiên cần) | 53,8 KB |
| **Một bài đầu tiên** | **121,2 KB** |
| Thư mục theme, khi tải lên | 674 KB |

**Một điều cần nói rõ, và nó không nằm trong tay theme.** Chính Ghost chèn Portal và script tìm
kiếm của nó từ `cdn.jsdelivr.net` trên mọi trang, dù theme có dùng hay không. Theme không thêm
request bên thứ ba nào; trang thì vẫn có hai. Ghost tự cài trên máy riêng có thể cấu hình để
phục vụ chúng từ chính tên miền của mình. Số đo nằm ở [`docs/gaps.md`](docs/gaps.md).

## Cái gì không mang sang được

Bản ngắn. [`docs/gaps.md`](docs/gaps.md) có số đo, [`docs/decisions/`](docs/decisions/README.md)
có lý do.

- **Cây bút, bút dạ quang và chú thích cuối trang.** 273 KB SVG sinh sẵn, bám vào các thuộc tính
  mà chỉ trình soạn của Quire Ink mới viết ra. Koenig không viết nổi, nên sheet đó không được
  đóng gói.
- **Loạt bài, và khối Lưu trữ ở lề.** Ghost chỉ có thẻ và tác giả, không có đường dẫn theo ngày
  tháng. Một khối **Tác giả** đứng vào chỗ của khối chuyên mục. Trục thời gian ở lề không bị ảnh
  hưởng và vẫn có, vì nó không trỏ đi đâu cả.
- **Chiều phải sang trái.** Bản WordPress được tặng không một bản lật, vì WordPress tự liên kết
  `rtl.css`. Ghost không có quy ước đó. Không phải từ chối, chỉ là chưa làm.
- **Phần bình luận là của Ghost.** Đăng nhập, trả lời và kiểm duyệt là của nền tảng và chúng
  tốt; cái giá là Ghost vẽ chúng trong một iframe mà theme không chạm vào bên trong được.
- **Khối callout giữ biểu tượng và mất màu nền.** Tám màu pastel của Ghost cộng với vạch nhấn
  của engine là một ý nói hai lần, và là một mảng sáng chóe giữa trang tối.

## Cài đặt

Tải file zip ở mục Releases, hoặc tự dựng:

```bash
bun run zip
```

Rồi vào **Ghost → Settings → Design → Change theme → Upload theme** và chọn file zip. Chín cài
đặt nằm ngay trong bảng đó.

Hai việc nên làm sau khi cài: thêm vài liên kết vào **Navigation** để khối menu ở lề có thứ để
hiện, và đánh dấu hai ba bài là **featured** để khối Nổi bật xuất hiện.

## Làm việc với repo này

```bash
dev/up.sh        # Ghost ở http://localhost:2368, theme gắn thẳng vào
dev/seed.sh      # tài khoản chủ, bật theme, mười bài trải ba năm, một trang, một menu
bun run check:all
```

`bun run extract` chạy lại bộ sinh dựa trên checkout `../quireink` nằm cạnh. Mọi thứ trong
`assets/css/quireink-*`, `assets/fonts/`, `assets/js/{core,post}.js` và `partials/generated-*`
đến từ đó và bị ghi đè bởi nó.

[`CLAUDE.md`](CLAUDE.md) là hướng dẫn làm việc, gồm cả những lỗi đã trả giá rồi.

## Giấy phép

**PolyForm Noncommercial 1.0.0**, đúng giấy phép của engine mà theme này được sinh ra từ đó.
Ghost, khác với thư mục theme của WordPress, không đòi hỏi gì ở một theme, nên không có gì bị
cho đi nhiều hơn cái engine vốn đã cho.
[ADR 0001](docs/decisions/0001-polyform-not-gpl.md) giải thích vì sao đây cố ý *không* phải câu
trả lời của bản WordPress.

Sáu bộ chữ theo **SIL Open Font License 1.1**, và văn bản giấy phép đi kèm chúng trong
`quire-ink/assets/fonts/OFL.txt`.

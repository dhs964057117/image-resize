# CutImage - Privacy-First In-Browser Image Processing Suite

CutImage 是一个高性能、商业化、专注于隐私与极致速度的在线纯前端图像工具箱。所有核心图像算法均利用 HTML5 Canvas、JavaScript 及 WebAssembly 在浏览器本地直接运行，**图片数据 100% 不经任何服务器上传与存储**。

---

## 🌟 工具矩阵 (Tool Suite)

| 工具 | 页面 | 核心能力 |
| :--- | :--- | :--- |
| **Compress** | `compress.html` | 智能压缩 JPEG, PNG, WebP，节省高达 90% 空间，支持实时双视图对比（Side-by-side & Split-view） |
| **Convert** | `convert.html` | 多格式无损/高质互转（PNG, JPG, WebP, AVIF, GIF, BMP），支持透明通道保持 |
| **Crop** | `crop.html` | 自由裁切与旋转（支持 1:1, 16:9, 4:3, 9:16 等主流社交媒体比例预设） |
| **Resize** | `resize.html` | 高精度按像素宽高或百分比等比缩放，采用高质量采样算法防模糊 |
| **Favicon** | `favicon.html` | 一键生成生产级全平台图标包（16x16, 32x32, 180x180 Apple Touch, Android PWA） |
| **Trace (SVG)** | `trace.html` | 纯前端位图转矢量（SVG）描摹引擎，支持黑白二值化与多色阶平滑度调节 |
| **FAQ** | `faq.html` | 包含 35+ 个精选高频问答，内置平滑手风琴交互与实时搜索过滤，附带高权重 FAQPage Schema |

---

## 💰 盈利与 Google AdSense 接入指南

本项目已严格按照 Google AdSense 最新政策规范进行了商业化布局：

### 1. 替换您的发布商 ID (Publisher ID)
在全站所有 HTML 文件中搜索占位符并替换：
- 将所有的 `ca-pub-XXXXXXXXXXXXXXXX` 替换为您自己的 Google AdSense 账户 ID（例如 `ca-pub-1234567890123456`）。
- 将各个广告单元中的 `data-ad-slot="1234567890"` 替换为您在 AdSense 控制台创建的实际广告单元 ID（也可保持 Auto Ads 自动投放）。
- 打开根目录下的 `ads.txt`，将 `pub-XXXXXXXXXXXXXXXX` 改为您对应的实际 ID：
  ```text
  google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
  ```

### 2. 合规与高通过率说明
- **广告位布局**：每页合理分布 Top Leaderboard（顶部横幅）、Mid Content（操作区下内容横幅）、Bottom Banner（底部横幅），并均有规范的 `ADVERTISEMENT` 标签，杜绝误触风险。
- **隐私与法律合规**：`privacy.html` 已包含 Google DoubleClick DART Cookies、第三方广告追踪告知以及 GDPR / CCPA 豁免申明，这是顺利通过 AdSense 审核的必备条件。
- **丰富原创内容**：每个工具页均配有详细操作步骤与原理说明，FAQ 页面拥有 35+ 题高价值内容，避免因“低价值内容 / Thin Content”被拒。

---

## 🚀 部署至 GitHub & Cloudflare Pages

### 步骤一：推送到 GitHub
1. 打开您的 [GitHub](https://github.com/) 并创建一个新的公开或私有仓库（例如命名为 `image-resize` 或 `cutimage`）。
2. 在本地终端执行以下命令（将 `YOUR_USERNAME` 和 `REPO_NAME` 替换为您的实际仓库）：
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

### 步骤二：在 Cloudflare Pages 上一键上线
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 进入 **Workers & Pages** -> 点击 **Create application** -> 选择 **Pages** -> **Connect to Git**。
3. 授权并选中您刚推送的 GitHub 仓库。
4. 构建设置（Build Settings）：
   - **Framework preset**: `None`
   - **Build command**: *（留空）*
   - **Build output directory**: `.` （或者留空表示根目录）
5. 点击 **Save and Deploy**，Cloudflare 将在十几秒内完成全球 CDN 部署！
6. （可选）在 **Custom domains** 中一键绑定您的自有独立域名并自动开启免费 SSL 证书。

---

## 🔍 SEO 优化特性

- **完整语义化与元数据**：每个页面配备独立、高权重的 `Title`、`Meta Description`、`Canonical URL`、`Open Graph` 以及 `Twitter Card`。
- **Schema.org 结构化数据**：
  - 各工具页挂载 `WebApplication` 结构化标记。
  - FAQ 页面挂载 Google 官方富文本识别的 `FAQPage` JSON-LD。
  - 首页集成 `WebSite` 与 `Organization` 站点标识。
- **搜索引擎规范**：
  - `sitemap.xml`：覆盖全部 10 个页面的优先级与更新频次。
  - `robots.txt`：允许所有合法搜索引擎爬虫抓取。
  - `_redirects`：配置了 Cloudflare Pages 干净 URL（如访问 `/compress` 直接对应 `/compress.html`，无需 `.html` 后缀）。
  - `_headers`：启用静态资源长久缓存（1 年 Cache-Control）与安全响应头（X-Content-Type-Options 等）。

---

## 💻 本地预览与调试

如需在本地电脑预览与测试：
```bash
# 使用 Python 启动静态服务器
python -m http.server 8080

# 或使用 Node.js / npx
npx serve .
```
浏览器打开 `http://localhost:8080` 即可畅爽体验所有工具。

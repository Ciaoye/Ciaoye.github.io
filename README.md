# ciao os

浏览器里的 Win95 风格桌面操作系统。聊天、写信、画画、听电台、翻文件、玩扫雷——全在浏览器里跑。

**[ciaoye.github.io](https://ciaoye.github.io/)**

---

## 桌面上有什么

### 应用

| 图标 | 名称 | 说明 |
|------|------|------|
| 💬 | **Chat** | AI 即时聊天，Enter 发送，`/new` 开新会话，历史存在 IndexedDB |
| ✉️ | **Letter** | AI 笔友模式，写长信，慢下来 |
| 📅 | **Lifelog** | 个人时间轴、周报、情绪地图 |
| 📚 | **Wikipedia** | 个人百科，205+ 篇双链笔记，浏览器预编译静态 HTML |
| 🎨 | **Paint** | 像素画板，Win95 画图复刻，支持触屏作画 |
| 📁 | **Files** | 文件管理器，IndexedDB 文件系统，存画作和聊天记录 |
| 📝 | **Notepad** | 纯文本记事本 |
| 🔢 | **2048** | 经典数字合并游戏，键盘方向键 + 触屏滑动 |
| 💣 | **Sweeper** | 扫雷，初级/中级/高级，插旗模式切换 |

### 桌面小部件

- **Lo-fi Radio** — 7 个电台，像素风播放器，可拖拽、调节音量，移动端默认折叠
- **便利贴** — 可拖拽便签，内容自动保存到 localStorage
- **桌面时钟** — 像素风格时钟，可拖拽

---

## 移动端

768px 以下宽度自动适配：

- 桌面图标 2 列布局，旋转屏幕自动重排
- 应用窗口强制全屏
- Lo-fi Radio 默认折叠，点击展开不挡图标
- 2048 触屏滑动操作
- 扫雷格子自适应宽度，插旗/翻开模式切换
- 触屏作画支持

---

## 项目结构

```
├── index.html              # 主入口，HTML + 应用注册 + Lo-fi Radio / Sticky 内联逻辑
├── css/
│   ├── theme.css           # Win95 主题变量、控件样式、全局规则
│   ├── desktop.css         # 桌面图标网格、Lo-fi Radio、便利贴、时钟、开始菜单
│   ├── window.css          # 应用窗口框架（拖拽、缩放、全屏）
│   └── taskbar.css         # 底部任务栏、时钟
├── js/
│   ├── core/
│   │   ├── windowManager.js   # 窗口管理器：创建、拖拽、聚焦、最大化、关闭
│   │   ├── desktop.js         # 桌面图标注册、网格渲染、拖拽排序
│   │   ├── taskbar.js         # 任务栏：开始菜单、应用切换、时钟更新
│   │   ├── fileSystem.js      # IndexedDB 文件系统（文件 CRUD、目录管理）
│   │   └── sound.js           # 系统音效（打开/关闭/点击/开始菜单）
│   └── apps/
│       ├── chat.js            # AI 聊天
│       ├── letter.js          # AI 笔友
│       ├── lifelog.js         # 时间轴与报告
│       ├── wiki.js            # 个人百科浏览器
│       ├── wikiGraph.js       # Wiki 知识星云图
│       ├── moodTracker.js     # 情绪追踪
│       ├── paint.js           # 像素画板
│       ├── fileManager.js     # 文件管理器
│       ├── notepad.js         # 记事本
│       ├── browser.js         # 内嵌网页浏览器
│       ├── game2048.js        # 2048
│       └── minesweeper.js     # 扫雷
├── assets/icons/           # 桌面图标（30+ 张 Win95 风格像素图）
├── data/                   # Wiki 数据（184 篇 MD + 4 篇 HTML）
├── reference/              # 参考素材
└── README.md
```

---

## 技术栈

| 层 | 选型 |
|----|------|
| 前端 | 纯静态 HTML + CSS + 原生 JavaScript，零框架 |
| UI 库 | Tailwind CDN + Font Awesome CDN |
| 存储 | IndexedDB（文件系统）+ localStorage（用户偏好、便签、Lo-fi 位置/音量） |
| 窗口系统 | 自研 windowManager.js，z-index 堆叠、层级管理 |
| 移动端 | matchMedia + CSS 媒体查询，无框架 |

---

## 本地运行

没有构建步骤，直接打开即可：

```bash
# 方式一：直接打开
open index.html

# 方式二：本地服务器（推荐，避免跨域问题）
python -m http.server 8080
# 然后访问 http://localhost:8080

# 方式三：VS Code Live Server 插件
```

Chat 和 Letter 需要后端 API。项目配套了一个 Node.js 后端（`server.js`），代理请求到本地 Agent 服务。

---

## 致敬

- Lo-fi 电台流来自 [labilio/lofi-radio](https://github.com/labilio/lofi-radio)
- Win95 视觉风格致敬那个像素即正义的年代

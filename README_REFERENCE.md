# 俏也 OS

一个浏览器里的 Win95 风格桌面模拟器。修改下面任何文字后告诉我，我来同步到代码中。

---

## 1. 系统文字

| 位置               | 当前文字               |
| ---------------- | ------------------ |
| 页面标题 (`<title>`) | ciao os            |
| 开始菜单侧边栏          | ciao os            |
| 任务栏 Start 按钮     | Start              |
| 控制台欢迎语           | ciao OS v1.0 ready |

---

## 2. 桌面图标

| ID          | 桌面名称     | 开始菜单名称    | 悬停提示        |     |
| ----------- | -------- | --------- | ----------- | --- |
| chat        | Chat     | Ciao Chat | 和 ciao 发短信！ |     |
| paint       | Paint    | Paint     | 画个画吧        |     |
| letter      | Letter   | Letter    | 和 ciao 发邮件！ |     |
| mood        | Mood Map | Mood Map  | 我的情绪地图      |     |
| wiki        | Wiki Map | Wiki Map  | 我的知识地图      |     |
| browser     | Browser  | Browser   | 浏览一些漫长的文档   |     |
| 2048        | 2048     | 2048      | 2048        |     |
| minesweeper | Sweeper  | Sweeper   | 扫雷          |     |
| files       | Files    | Files     | 存了的东西都在这里   |     |
| notepad     | Notepad  | Notepad   | 写点东西吧       |     |

---

## 3. Chat（聊天）

| 位置              | 当前文字                          |
| --------------- | ----------------------------- |
| 窗口标题            | Ciao Chat                     |
| 欢迎语             | `Ciao！我是俏也的分身。` + `你想聊点什么？`   |
| 输入框 placeholder | 输入消息... (Enter 发送, /new 开新对话) |
| 发送按钮            | 发送                            |
| 状态栏（在线）         | 在线                            |
| 状态栏（离线）         | 连接断开                          |
| 状态栏初始提示         | Ciao！输入消息开始对话 — /new 开启新对话    |
| /new 后的提示       | 新对话                           |
| 恢复历史消息提示        | 恢复了 N 条消息                     |

---

## 4. Letter（书信 & 演示信）

### 4.1 侧边栏

| 位置  | 当前文字 |
| --- | ---- |
| 写信  | 写信   |
| 收件箱 | 收件箱  |
| 发件箱 | 发件箱  |
| 草稿箱 | 草稿箱  |

### 4.2 按钮

| 位置          | 当前文字 |
| ----------- | ---- |
| 写信页 - 发送    | 发送   |
| 写信页 - 保存草稿  | 保存草稿 |
| 写信页 - 取消    | 取消   |
| 信件查看 - 返回   | ← 返回 |
| 信件查看 - 回复   | 回复   |
| 信件查看 - 保存文本 | 保存文本 |
| 信件查看 - 删除   | 删除   |
| 回复页 - 发送回复  | 发送回复 |
| 回复页 - 取消    | 取消   |
| 顶部工具栏 - 写信  | 写信   |

### 4.3 写信页

| 位置             | 当前文字                 |
| -------------- | -------------------- |
| 主题 placeholder | 主题（可选）               |
| 正文 placeholder | 开始给 ciao 写信...       |
| 状态栏初始          | 写信 · 收件箱 · 发件箱 · 草稿箱 |

### 4.4 演示信 — 第一封

**主题：** 你好呀！

**AI来信：**
```
亲爱的陌生人：

你好吗？我想告诉你，你正在做的事情很棒。这个小小的操作系统，是你为自己搭建的一个空间——可以聊天、画画、写信、看情绪星云、逛知识图谱。它就像你内心世界的一个窗户。

保持好奇，保持温柔。

祝好，
ciao
```

## 5. Paint（画板）

| 位置 | 当前文字 |
|------|---------|
| 窗口标题 | untitled - Paint |
| 工具提示（铅笔） | 铅笔 |
| 工具提示（橡皮） | 橡皮 |
| 工具提示（直线） | 直线 |
| 工具提示（矩形） | 矩形 |
| 工具提示（圆形） | 圆形 |
| 工具提示（填充） | 填充 |
| 画笔大小标签 | Size: |
| 撤销按钮 | 撤销 |
| 重做按钮 | 重做 |
| 清空按钮 | 清空 |
| 保存按钮 | 保存 |
| 导出按钮 | 导出PNG |
| 清空确认对话框 | 确定清空画布？ |
| 保存成功提示 | 已保存到本地: {名称} |
| 导出成功提示 | 已导出 PNG |
| 状态栏初始 | Tools: 铅笔 橡皮 直线 矩形 圆形 填充 \| 撤销 重做 |

---

## 6. Notepad（记事本）

| 位置              | 当前文字                     |
| --------------- | ------------------------ |
| 窗口标题            | untitled - Notepad       |
| 工具栏标题           | 📝 Notepad               |
| 文件名 placeholder | untitled                 |
| Save 按钮         | Save                     |
| Download 按钮     | Download                 |
| New 按钮          | New                      |
| File 菜单         | File                     |
| File → New      | New                      |
| File → Open     | Open...                  |
| File → Save     | Save                     |
| Open 对话框标题      | Open File                |
| Open 对话框空状态     | No text files found      |
| Open 对话框取消      | Cancel                   |
| 文本区 placeholder | Write here...            |
| 状态栏             | ciao os Notepad          |
| 自动保存提示          | 已自动保存                    |
| 新文档状态           | New document             |
| 放弃修改确认          | Discard unsaved changes? |
| Open 选择提示       | Select a file to open    |

---

## 7. 启动时打开的 readme.txt

```
你好呀！我是俏也。

这是我在做的一些小项目的展示。

你可以跟 ciao 发短消息（Chat） ！也可以写很长的信（Letter）。

另外，还有几个我这几天在做的小项目：
- Mood：2008 年到现在，2400+ 情绪的数据可视化
- Wiki：整理的 Wikipedia 知识图谱
- Explorer：我写过的东西，和目前整理的 Wikipedia

除此之外加了一些有的没的，比如画画、扫雷、2048……

我应该会经常更新这里的东西。欢迎随时来看看。
如果想加什么东西，遇到什么问题，请随时联系我！

— 俏也
```

---

## 8. Files（文件管理器）

| 位置           | 当前文字                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| 窗口标题         | File Manager                                                            |
| 工具栏标题        | 📁 Files                                                                |
| Refresh 按钮   | Refresh                                                                 |
| Clear All 按钮 | Clear All                                                               |
| 空状态          | No files yet. / Files from Paint, Chat and other apps will appear here. |
| 批量删除确认       | Delete ALL N file(s)? This cannot be undone!                            |
| 单个删除确认       | Delete "{文件名}"?                                                         |
| 预览关闭按钮       | Close                                                                   |
| 状态栏标语        | ciao os File System                                                     |

---

## 9. Mood（情绪星云）

| 位置    | 当前文字 |     |
| ----- | ---- | --- |
| 全屏标题栏 | 情绪星云 |     |

---

## 10. Wiki（知识图谱）

| 位置    | 当前文字 |
| ----- | ---- |
| 全屏标题栏 | 知识星云 |

---

## 11. Browser（浏览器）

| 位置 | 当前文字 |
|------|---------|
| 窗口标题 | Browser |

---

## 12. 2048 / Sweeper

| 位置           | 当前文字 |
| ------------ | ---- |
| 2048 窗口标题    | 2048 |
| Sweeper 窗口标题 | 扫雷   |

---

## 13. Lofi 播放器

| 位置 | 当前文字 |
|------|---------|
| 标题栏 | Lofi Radio |
| 状态（初始） | Paste a stream URL to start |
| 播放按钮 | ▶ Play / ⏸ Pause |
| 停止按钮 | ■ |
| URL placeholder | https://... (lofi stream URL) |

---

## 14. 桌面装饰

| 元素                 | 当前文字      |
| ------------------ | --------- |
| 便利贴标题              | Note      |
| 便利贴初始内容            | 今天要做的事... |
| 便利贴空状态 placeholder | 写点什么吧...  |

---

## 15. 弹窗 / 对话框

| 场景 | 当前文字 |
|------|---------|
| Paint 清空确认 | 确定清空画布？ |
| Letter 删除确认 | 删除这封信及全部回复？ |
| Files 删除确认 | Delete "{文件名}"? |
| Files 批量删除确认 | Delete ALL N file(s)? This cannot be undone! |
| Files 删除错误 | Delete failed: ... |
| Notepad 放弃修改 | Discard unsaved changes? |

---

修改后告诉我，我来同步。

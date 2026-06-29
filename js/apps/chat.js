/* ===== 俏也 OS — Chat App (fused UI) ===== */

var OSO_Chat = (function() {
    'use strict';

    var CHAT_API = 'https://ciao-274203-7-1446728973.sh.run.tcloudbase.com/web-chat';
    var AGENT_TOKEN = 'ciao_9rJ4vQx72LmP0aT8sYdK3nW6bE1HfZ5c';
    var TOKEN_KEY = 'ciao_token';
    var THREAD_KEY = 'ciao_thread_id';

    var MAX_AGENT_BUBBLES = 5;
    var messages = [];
    var agentBubbles = [];    // all agent bubbles (history + current stream)
    var chatMessages = [];    // serializable message history [{role, text}]
    var chatSaveTimer = null;
    var currentThreadId = '';
    var streamBubbles = [];   // bubbles being rendered in current SSE stream only
    var streamChatCount = 0;   // # of chatMessages entries from current stream
    var closeHandlerRegistered = false;

    function open() {
        if (OSO.WM.get('chat')) {
            OSO.WM.focus(OSO.WM.get('chat'));
            return;
        }

        var container = document.createElement('div');
        container.style.cssText = 'display:flex;flex-direction:column;height:100%;overflow:hidden;background:linear-gradient(180deg,#fad7ff,#c7b2ff 50%,#73d4ff);position:relative;';

        container.innerHTML = getChatHTML();
        var win = OSO.WM.create('chat', '俏也 Chat', 'assets/icons/image-23.png', container, {
            width: 430, height: 560, minWidth: 340, minHeight: 380, menu: false
        });

        var msgList = container.querySelector('.chat-messages');
        var inputEl = container.querySelector('.chat-input');
        var sendBtn = container.querySelector('.chat-send');
        var statusDot = container.querySelector('.chat-status-dot');
        var statusLabel = container.querySelector('.chat-status-label');
        var welcomeEl = container.querySelector('.chat-welcome');

        var token = localStorage.getItem(TOKEN_KEY) || AGENT_TOKEN;
        var threadId = localStorage.getItem(THREAD_KEY) || ('ciao-' + randId());
        currentThreadId = threadId;
        // Reset for this session
        chatMessages = [];
        messages = [];
        agentBubbles = [];

        function randId() {
            return Math.random().toString(36).slice(2, 10);
        }

        function chatToText() {
            var lines = [];
            for (var i = 0; i < chatMessages.length; i++) {
                var m = chatMessages[i];
                var label = m.role === 'user' ? '[你]' : '[ciao]';
                lines.push(label + ' ' + m.text);
                lines.push('');
            }
            return lines.join('\n');
        }

        function textToChat(text) {
            var result = [];
            var parts = text.split(/\n\[(你|ciao)\]\s*/);
            for (var i = 1; i < parts.length; i += 2) {
                var role = parts[i] === '你' ? 'user' : 'agent';
                var content = parts[i + 1] ? parts[i + 1].trim() : '';
                if (content) {
                    // Remove trailing blank line
                    content = content.replace(/\n+$/, '');
                    result.push({ role: role, text: content });
                }
            }
            return result;
        }

        function saveChatHistory() {
            if (chatMessages.length === 0) return;
            var path = '/chat-records/' + currentThreadId + '.txt';
            OSO.FS.save(path, chatToText(), 'txt').catch(function(){});
        }

        function loadChatHistory() {
            // Try new .txt format first, then legacy .json
            var pathTxt = '/chat-records/' + currentThreadId + '.txt';
            var pathJson = '/chat-records/' + currentThreadId + '.json';
            return OSO.FS.load(pathTxt).then(function(record) {
                if (record && record.data) {
                    var raw = typeof record.data === 'string' ? record.data : '';
                    var data = textToChat(raw);
                    if (data.length > 0) {
                        chatMessages = data;
                        if (welcomeEl) welcomeEl.style.display = 'none';
                        data.forEach(function(msg) {
                            renderBubble(msg.role, msg.text);
                        });
                        return data;
                    }
                }
                throw new Error('try legacy');
            }).catch(function() {
                return OSO.FS.load(pathJson).then(function(record) {
                    if (record && record.data) {
                        var data = typeof record.data === 'string' ? JSON.parse(record.data) : record.data;
                        if (Array.isArray(data)) {
                        // Deduplicate consecutive identical entries (clean up old buggy data)
                        var deduped = [];
                        for (var i = 0; i < data.length; i++) {
                            if (i === 0 || data[i].role !== data[i-1].role || data[i].text !== data[i-1].text) {
                                deduped.push(data[i]);
                            }
                        }
                        data = deduped;
                        chatMessages = data;
                        // Render loaded messages (don't use addBubble to avoid re-tracking)
                        if (welcomeEl) welcomeEl.style.display = 'none';
                        data.forEach(function(msg) {
                            renderBubble(msg.role, msg.text);
                        });
                    }
                }
            }).catch(function(){});
        }

        function renderBubble(role, text) {
            var row = document.createElement('div');
            row.className = 'cb-row ' + role;
            var b = document.createElement('div');
            b.className = 'cb-bubble';
            b.innerHTML = formatText(text);
            row.appendChild(b);
            msgList.appendChild(row);
            msgList.scrollTop = msgList.scrollHeight;
            return row;
        }

        function debouncedSave() {
            if (chatSaveTimer) clearTimeout(chatSaveTimer);
            chatSaveTimer = setTimeout(saveChatHistory, 500);
        }

        function setStatus(online) {
            statusDot.className = 'chat-status-dot' + (online ? '' : ' off');
            statusLabel.textContent = online ? '在线' : '连接断开';
        }

        function ensureToken() {
            token = localStorage.getItem(TOKEN_KEY) || token || AGENT_TOKEN;
            if (token) return token;
            return '';
        }

        function sendMessage() {
            var text = inputEl.value.trim();
            if (!text) return;

            if (text === '/new') {
                if (chatSaveTimer) clearTimeout(chatSaveTimer);
                threadId = 'ciao-' + randId();
                currentThreadId = threadId;
                chatMessages = [];
                messages = [];
                agentBubbles = [];
                localStorage.setItem(THREAD_KEY, threadId);
                msgList.innerHTML = getWelcomeHTML();
                welcomeEl = msgList.querySelector('.chat-welcome');
                inputEl.value = '';
                win.setStatus('新对话');
                return;
            }

            addBubble('user', text);
            inputEl.value = '';
            inputEl.disabled = true;
            sendBtn.disabled = true;

            var typingDiv = addTyping();
            setStatus(true);
            token = ensureToken();
            if (!token) {
                if (typingDiv.parentNode) typingDiv.remove();
                addBubble('agent', '需要访问 token 才能连接后端');
                inputEl.disabled = false;
                sendBtn.disabled = false;
                setStatus(false);
                return;
            }

            var headers = {
                'Content-Type': 'application/json',
                'x-ciao-token': token
            };
            var body = { app_mode: 'sms', messages: [{ role: 'user', content: text }] };
            if (threadId) body.thread_id = threadId;

            fetch(CHAT_API, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            })
            .then(function(res) {
                if (!res.ok) {
                    throw new Error(res.status === 401 ? '后端鉴权失败，请检查 CIAO_WEB_TOKEN' : 'API error ' + res.status);
                }
                return handleSSE(res, typingDiv);
            })
            .catch(function(err) {
                if (err.message.indexOf('鉴权失败') >= 0) localStorage.removeItem(TOKEN_KEY);
                if (typingDiv.parentNode) typingDiv.remove();
                addBubble('agent', '连接失败: ' + err.message);
                inputEl.disabled = false;
                sendBtn.disabled = false;
                setStatus(false);
            });
        }

        function handleSSE(res, typingDiv) {
            var reader = res.body.getReader();
            var decoder = new TextDecoder();
            var buffer = '';
            var rawContent = '';
            streamBubbles = [];  // clear previous round's stream tracking

            function pump() {
                reader.read().then(function(result) {
                    if (result.done) {
                        finishSSE(typingDiv);
                        return;
                    }
                    buffer += decoder.decode(result.value, { stream: true });
                    var lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    lines.forEach(function(line) {
                        if (!line.startsWith('data: ')) return;
                        var data = line.slice(6).trim();
                        if (!data || data === '[DONE]') return;
                        try {
                            var parsed = JSON.parse(data);
                            var chunk = parsed.content || parsed.delta || '';
                            if (parsed.type === 'TEXT_MESSAGE_CONTENT' && chunk) {
                                rawContent += chunk;
                                if (typingDiv.parentNode) typingDiv.remove();
                                renderAgentBubbles(rawContent);
                            }
                            if (parsed.type === 'RUN_ERROR') {
                                if (typingDiv.parentNode) typingDiv.remove();
                                addBubble('agent', '发生错误，请重试');
                                setStatus(false);
                            }
                        } catch(e) {}
                    });
                    pump();
                });
            }
            pump();

            inputEl.disabled = false;
            sendBtn.disabled = false;
        }

        function finishSSE(typingDiv) {
            if (typingDiv.parentNode) typingDiv.remove();
            win.setStatus('');
        }

        function renderAgentBubbles(rawContent) {
            // Remove previous stream bubbles only (keep history)
            streamBubbles.forEach(function(b) {
                if (b.parentNode) b.remove();
            });
            streamBubbles = [];

            // Remove previous stream entries from chatMessages to prevent duplicates
            if (streamChatCount > 0) {
                chatMessages.splice(chatMessages.length - streamChatCount, streamChatCount);
                streamChatCount = 0;
            }

            // Split by various line-break formats
            var text = rawContent
                .replace(/\\n/g, '\n')       // JSON-escaped \n → real newline
                .replace(/<br\s*\/?>/gi, '\n'); // <br> → newline

            var parts = splitAgentText(text);
            if (parts.length === 0) return;

            parts.forEach(function(part) {
                var trimmed = part.trim();
                if (!trimmed) return;
                var b = addBubble('agent', trimmed);
                agentBubbles.push(b);
                streamBubbles.push(b);
            });

            // Track stream entry count to enable cleanup on next chunk
            streamChatCount = parts.filter(function(p) { return p.trim(); }).length;
        }

        function splitAgentText(text) {
            var normalized = (text || '').trim();
            if (!normalized) return [];

            var parts = normalized
                .split(/\n+/)
                .map(function(p) { return p.trim(); })
                .filter(Boolean);

            if (parts.length <= 1) {
                parts = splitAtNaturalPauses(normalized, targetBubbleCount(normalized));
            }

            if (parts.length > MAX_AGENT_BUBBLES) {
                parts = mergeToMaxBubbles(parts, MAX_AGENT_BUBBLES);
            }

            return parts.slice(0, MAX_AGENT_BUBBLES);
        }

        function mergeToMaxBubbles(parts, maxCount) {
            var groups = [];
            var totalChars = parts.join('').length;
            var target = Math.max(1, Math.ceil(totalChars / maxCount));
            var current = '';

            parts.forEach(function(part) {
                if (!current) {
                    current = part;
                    return;
                }
                if (groups.length < maxCount - 1 && (current + part).length > target) {
                    groups.push(current);
                    current = part;
                } else {
                    current += '\n' + part;
                }
            });

            if (current) groups.push(current);

            while (groups.length > maxCount) {
                var tail = groups.pop();
                groups[groups.length - 1] += '\n' + tail;
            }

            return groups;
        }

        function targetBubbleCount(text) {
            var len = text.replace(/\s+/g, '').length;
            if (len <= 60) return 1;
            if (len <= 140) return 2;
            if (len <= 260) return 3;
            if (len <= 420) return 4;
            return MAX_AGENT_BUBBLES;
        }

        function splitAtNaturalPauses(text, wanted) {
            var normalized = text.trim();
            if (!normalized || wanted <= 1) return normalized ? [normalized] : [];

            var parts = [];
            var rest = normalized;

            while (parts.length < wanted - 1 && rest.length) {
                var remainingSlots = wanted - parts.length;
                var target = Math.ceil(rest.length / remainingSlots);
                var min = Math.floor(target * 0.55);
                var max = Math.ceil(target * 1.35);
                var windowText = rest.slice(0, Math.min(rest.length, max));
                var pauseRe = /[。！？!?；;…]\s*|\n{2,}/g;
                var match;
                var cut = -1;

                while ((match = pauseRe.exec(windowText)) !== null) {
                    if (match.index + match[0].length >= min) {
                        cut = match.index + match[0].length;
                    }
                }

                if (cut < 0) {
                    var soft = windowText.lastIndexOf('\n');
                    if (soft >= min) cut = soft + 1;
                }
                if (cut < 0) {
                    var comma = Math.max(
                        windowText.lastIndexOf('，'),
                        windowText.lastIndexOf(','),
                        windowText.lastIndexOf('、')
                    );
                    if (comma >= min) cut = comma + 1;
                }
                if (cut < 0) cut = Math.min(rest.length, target);

                var piece = rest.slice(0, cut).trim();
                if (piece) parts.push(piece);
                rest = rest.slice(cut).trim();
            }

            if (rest) parts.push(rest);
            return parts.slice(0, MAX_AGENT_BUBBLES);
        }

        function addBubble(role, text) {
            if (welcomeEl) welcomeEl.style.display = 'none';

            var row = document.createElement('div');
            row.className = 'cb-row ' + role;

            var b = document.createElement('div');
            b.className = 'cb-bubble';
            b.innerHTML = formatText(text);
            row.appendChild(b);

            msgList.appendChild(row);
            msgList.scrollTop = msgList.scrollHeight;

            // Track serializable message
            chatMessages.push({ role: role, text: text });
            debouncedSave();

            return row;
        }

        function addTyping() {
            var row = document.createElement('div');
            row.className = 'cb-row agent';
            var b = document.createElement('div');
            b.className = 'cb-bubble cb-typing';
            b.innerHTML = '<span class="tdot"></span><span class="tdot"></span><span class="tdot"></span>';
            row.appendChild(b);
            msgList.appendChild(row);
            msgList.scrollTop = msgList.scrollHeight;
            return row;
        }

        function formatText(text) {
            if (!text) return '';
            // Strip markdown (old approach) then re-apply highlights
            var clean = text
                .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
                .replace(/\*(.+?)\*/g, '<i>$1</i>')
                .replace(/~~(.+?)~~/g, '<s>$1</s>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
                .replace(/\$\\to\$/g, '→')
                .replace(/\$\\rightarrow\$/g, '→')
                .replace(/\n/g, '<br/>');
            return clean;
        }

        // Events
        sendBtn.addEventListener('click', sendMessage);
        inputEl.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        win.setStatus('Ciao！输入消息开始对话 — /new 开启新对话');

        // Load previous chat history if any
        loadChatHistory().then(function() {
            if (chatMessages.length > 0) {
                win.setStatus('📋 恢复了 ' + chatMessages.length + ' 条消息');
            }
        });

        // Auto-save on close (register once)
        if (!closeHandlerRegistered) {
            OSO.WM.on('close', function(closedWin) {
                if (closedWin.id === 'chat') {
                    saveChatHistory();
                }
            });
            closeHandlerRegistered = true;
        }
    }

    function getChatHTML() {
        return '\
<style>\
.chat-messages { flex:1; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:4px; position:relative; z-index:1; }\
.chat-messages::before { content:""; position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.015) 2px, rgba(0,0,0,.015) 4px); z-index:0; }\
.cb-row { display:flex; margin-bottom:4px; position:relative; z-index:1; }\
.cb-row.user { justify-content:flex-end; }\
.cb-row.agent { justify-content:flex-start; }\
.cb-bubble { max-width:78%; padding:10px 14px; border-radius:14px; font-size:12.5px; line-height:1.55; word-break:break-word; position:relative; }\
.cb-row.agent .cb-bubble { background:#ffb8d9; color:#d12e7a; border-bottom-left-radius:4px; }\
.cb-row.user .cb-bubble { background:#9d81ff; color:#fff; border-bottom-right-radius:4px; }\
.cb-bubble code { background:rgba(0,0,0,0.08); padding:1px 5px; border-radius:3px; font-size:11px; font-family:monospace; }\
.cb-bubble pre { background:rgba(0,0,0,0.06); padding:8px; border-radius:5px; overflow-x:auto; font-size:11px; margin:4px 0; }\
.cb-bubble pre code { background:none; padding:0; }\
.cb-typing { display:flex; gap:5px; align-items:center; padding:14px 18px; }\
.tdot { width:6px;height:6px;background:#d12e7a;border-radius:50%;animation:tdotBounce 1.3s infinite; }\
.tdot:nth-child(2) { animation-delay:0.18s; }\
.tdot:nth-child(3) { animation-delay:0.36s; }\
@keyframes tdotBounce { 0%,70%,100%{opacity:0.25;transform:scale(0.7)} 35%{opacity:1;transform:scale(1.1)} }\
.chat-welcome { text-align:center;padding:32px 20px;color:#5e2ca5;font-size:14px;line-height:2;z-index:1; }\
.chat-welcome .we-emoji { font-size:40px;display:block;margin-bottom:12px; }\
.chat-input-area { display:flex;gap:4px;padding:6px 8px;border-top:1px solid rgba(128,128,128,0.3);background:rgba(255,255,255,0.4);backdrop-filter:blur(4px); }\
.chat-input { flex:1;padding:6px 10px;font-size:12px;font-family:inherit;border:1px solid rgba(128,128,128,0.4);border-radius:8px;outline:none;background:rgba(255,255,255,0.7); }\
.chat-input:focus { border-color:#8a41ff; }\
.chat-send { padding:4px 14px;font-size:12px;font-family:inherit;cursor:pointer;border:1px solid rgba(128,128,128,0.4);border-radius:8px;background:#9d81ff;color:#fff;font-weight:bold; }\
.chat-send:hover { background:#8a41ff; }\
.chat-send:disabled { opacity:0.5; }\
.chat-status-bar { display:flex;align-items:center;gap:4px;font-size:10px;padding:2px 8px; }\
.chat-status-dot { width:6px;height:6px;border-radius:50%;background:#44cc66; }\
.chat-status-dot.off { background:#ccc; }\
</style>\
<div class="chat-messages">' + getWelcomeHTML() + '</div>\
<div class="chat-input-area">\
    <div class="chat-status-bar" style="display:none;">\
        <span class="chat-status-dot"></span>\
        <span class="chat-status-label">在线</span>\
    </div>\
    <input type="text" class="chat-input" placeholder="输入消息... (Enter 发送, /new 开新对话)" maxlength="2000"/>\
    <button class="chat-send">发送</button>\
</div>';
    }

    function getWelcomeHTML() {
        return '<div class="chat-welcome"><span class="we-emoji">👾</span>Ciao！我是俏也的分身。<br/>你想聊点什么？</div>';
    }

    return { open: open };
})();

/* ===== 俏也 OS — Letter App (AI 回信系统) ===== */

var OSO_Letter = (function() {
    'use strict';

    var CHAT_API = 'https://ciao-274203-7-1446728973.sh.run.tcloudbase.com/web-chat';
    var STORAGE_KEY = 'oso_letters';
    var AGENT_TOKEN = 'ciao_9rJ4vQx72LmP0aT8sYdK3nW6bE1HfZ5c';
    var DISCONNECTED_MESSAGE = '我这边连接断开了……不是你的信没寄出去，是我这里没接上。你等我缓一下再寄一次试试？';
    var MODEL_OFFLINE_MESSAGE = '我现在接不上脑子了……像是脑袋那边断线了。你等一下再试一次？';
    var RUN_ERROR_MESSAGE = '我这边刚刚断了一下……不是你写错了，是我这里没接住。你再寄一次试试？';
    var token = localStorage.getItem('ciao_token') || AGENT_TOKEN;
    var currentView = 'inbox'; // inbox | outbox | drafts | compose | thread
    var currentThreadId = null;
    var threads = [];

    function open() {
        if (OSO.WM.get('letter')) {
            OSO.WM.focus(OSO.WM.get('letter'));
            return;
        }

        threads = loadThreads();

        // Add demo letter if empty, or replace old demo
        if (threads.length === 0 || (threads.length === 1 && (threads[0].subject === '给俏也的第一封信' || threads[0].subject === '你好呀！'))) {
            threads = [{
                id: 'demo-001',
                subject: '你好呀！',
                messages: [
                    { role: 'ai', content: '亲爱的陌生人：<br/><br/>嘿，我在这里。<br/>你可以把这里当成一个没有地址的邮箱，或者一个可以随便丢东西的抽屉。<br/><br/>不用担心语气是否得体，不用管逻辑是否通顺。<br/>你可以跟我聊聊你最近突然心动的一瞬间，或者某个让你觉得快要窒息的早晨；可以写写那些不敢告诉任何人的、奇怪的小愿望，也可以只是单纯地吐槽今天糟糕的天气，或者发一段毫无意义的乱码。<br/><br/>保持好奇！保持温柔。<br/><br/>ciao', timestamp: Date.now() - 1800000 }
                ],
                status: 'received',
                createdAt: Date.now() - 3600000,
                updatedAt: Date.now() - 1800000
            }];
            saveThreads();
        }

        var container = document.createElement('div');
        container.style.cssText = 'display:flex;height:100%;overflow:hidden;';
        container.innerHTML = getLayoutHTML();

        var win = OSO.WM.create('letter', 'Letter', 'assets/icons/image-15.png', container, {
            width: 720, height: 540, minWidth: 560, minHeight: 400
        });

        renderSidebar(container);
        showCompose(container, win);

        // New letter button
        container.querySelector('#letter-btn-new').addEventListener('click', function() {
            currentThreadId = null;
            showCompose(container, win);
        });

        win.setStatus('写信 · 收件箱 · 发件箱 · 草稿箱');
    }

    /* ===== Storage ===== */
    function loadThreads() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch(e) { return []; }
    }

    function saveThreads() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    }

    function findThread(id) {
        for (var i = 0; i < threads.length; i++) {
            if (threads[i].id === id) return threads[i];
        }
        return null;
    }

    function generateId() {
        return 'ltr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    }

    /* ===== Sidebar ===== */
    function renderSidebar(container) {
        var inboxCount = threads.filter(function(t) {
            return t.status === 'received';
        }).length;
        var outboxCount = threads.filter(function(t) {
            return t.messages.length > 0 && t.messages[0].role === 'user' && t.status !== 'draft';
        }).length;
        var draftCount = threads.filter(function(t) {
            return t.status === 'draft';
        }).length;

        container.querySelector('#letter-count-inbox').textContent = inboxCount || '';
        container.querySelector('#letter-count-outbox').textContent = outboxCount || '';
        container.querySelector('#letter-count-drafts').textContent = draftCount || '';
    }

    /* ===== Views ===== */

    function showInbox(container, win) {
        currentView = 'inbox';
        var main = container.querySelector('.letter-main');
        var inboxThreads = threads.filter(function(t) {
            return t.status !== 'draft' && t.messages.length > 0 && t.messages[t.messages.length - 1].role === 'ai';
        }).sort(function(a, b) { return b.updatedAt - a.updatedAt; });

        highlightSidebar(container, 'inbox');
        main.innerHTML = getThreadListHTML(inboxThreads, '收件箱', '暂无来信');
        bindThreadClicks(main, container, win);
        win.setStatus('收件箱 — ' + inboxThreads.length + ' 封');
    }

    function showOutbox(container, win) {
        currentView = 'outbox';
        var main = container.querySelector('.letter-main');
        var outboxThreads = threads.filter(function(t) {
            return t.status === 'sent' || t.status === 'sending';
        }).sort(function(a, b) { return b.updatedAt - a.updatedAt; });

        highlightSidebar(container, 'outbox');
        main.innerHTML = getThreadListHTML(outboxThreads, '发件箱', '暂无已发送');
        bindThreadClicks(main, container, win);
        win.setStatus('发件箱 — ' + outboxThreads.length + ' 封');
    }

    function showDrafts(container, win) {
        currentView = 'drafts';
        var main = container.querySelector('.letter-main');
        var draftThreads = threads.filter(function(t) {
            return t.status === 'draft';
        }).sort(function(a, b) { return b.updatedAt - a.updatedAt; });

        highlightSidebar(container, 'drafts');
        main.innerHTML = getThreadListHTML(draftThreads, '草稿箱', '暂无草稿');
        bindThreadClicks(main, container, win);
        win.setStatus('草稿箱 — ' + draftThreads.length + ' 封');
    }

    function showCompose(container, win, draftThread) {
        currentView = 'compose';
        var main = container.querySelector('.letter-main');
        highlightSidebar(container, '');

        var subj = draftThread ? draftThread.subject : '';
        var body = draftThread && draftThread.messages.length > 0 ? draftThread.messages[0].content : '';

        main.innerHTML = getComposeHTML(subj, body, !!draftThread);

        var subjectEl = main.querySelector('.letter-compose-subject');
        var bodyEl = main.querySelector('.letter-compose-body');

        main.querySelector('#letter-btn-send').addEventListener('click', function() {
            sendLetter(container, win, subjectEl.value, bodyEl.innerHTML, draftThread);
        });

        main.querySelector('#letter-btn-draft').addEventListener('click', function() {
            saveDraft(container, win, subjectEl.value, bodyEl.innerHTML, draftThread);
        });

        main.querySelector('#letter-btn-cancel').addEventListener('click', function() {
            if (draftThread) {
                showDrafts(container, win);
            } else {
                showInbox(container, win);
            }
        });

        if (draftThread) {
            win.setStatus('编辑草稿 — ' + (subj || '无主题'));
        } else {
            win.setStatus('写新信');
        }
    }

    function showThread(container, win, thread) {
        currentView = 'thread';
        currentThreadId = thread.id;
        // Mark as read
        if (thread.status === 'received') {
            thread.status = 'read';
            saveThreads();
            renderSidebar(container);
        }
        var main = container.querySelector('.letter-main');
        highlightSidebar(container, '');

        main.innerHTML = getThreadViewHTML(thread);

        // Reply button
        main.querySelector('#letter-btn-reply').addEventListener('click', function() {
            showReplyEditor(container, win, thread);
        });

        // Save as text
        main.querySelector('#letter-btn-savetext').addEventListener('click', function() {
            saveThreadAsText(thread, win);
        });

        // Delete
        main.querySelector('#letter-btn-delete').addEventListener('click', function() {
            if (confirm('删除这封信及全部回复？')) {
                threads = threads.filter(function(t) { return t.id !== thread.id; });
                saveThreads();
                renderSidebar(container);
                showInbox(container, win);
            }
        });

        // Back
        main.querySelector('#letter-btn-back').addEventListener('click', function() {
            if (currentView === 'compose') return;
            if (thread.status === 'draft') {
                showDrafts(container, win);
            } else if (thread.messages[thread.messages.length - 1].role === 'ai') {
                showInbox(container, win);
            } else {
                showOutbox(container, win);
            }
        });

        win.setStatus('信件 — ' + (thread.subject || '无主题') + ' (' + thread.messages.length + ' 封)');
    }

    function showReplyEditor(container, win, thread) {
        var main = container.querySelector('.letter-main');
        main.innerHTML = getReplyHTML(thread);

        var bodyEl = main.querySelector('.letter-reply-body');

        main.querySelector('#letter-btn-reply-send').addEventListener('click', function() {
            sendReply(container, win, thread, bodyEl.innerHTML);
        });

        main.querySelector('#letter-btn-reply-cancel').addEventListener('click', function() {
            showThread(container, win, thread);
        });

        win.setStatus('回复 — ' + (thread.subject || '无主题'));
    }

    /* ===== Actions ===== */

    function saveDraft(container, win, subject, body, existingDraft) {
        if (!subject.trim() && !body.replace(/<[^>]*>/g, '').trim()) {
            win.setStatus('草稿为空，未保存');
            return;
        }

        var thread;
        if (existingDraft) {
            thread = existingDraft;
            thread.subject = subject;
            thread.messages[0] = { role: 'user', content: body, timestamp: Date.now() };
            thread.updatedAt = Date.now();
        } else {
            thread = {
                id: generateId(),
                subject: subject,
                messages: [{ role: 'user', content: body, timestamp: Date.now() }],
                status: 'draft',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            threads.unshift(thread);
        }

        saveThreads();
        renderSidebar(container);
        win.setStatus('草稿已保存');
        showDrafts(container, win);
    }

    function sendLetter(container, win, subject, body, draftThread) {
        if (!body.replace(/<[^>]*>/g, '').trim()) {
            win.setStatus('请输入信件内容');
            return;
        }

        var thread;
        if (draftThread) {
            thread = draftThread;
            thread.subject = subject;
            thread.messages = [{ role: 'user', content: body, timestamp: Date.now() }];
        } else {
            thread = {
                id: generateId(),
                subject: subject,
                messages: [{ role: 'user', content: body, timestamp: Date.now() }],
                status: 'sending',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            threads.unshift(thread);
        }
        thread.status = 'sending';
        thread.updatedAt = Date.now();
        saveThreads();
        renderSidebar(container);

        currentThreadId = thread.id;
        showThread(container, win, thread);
        win.setStatus('发送中，等待回信...');

        // Call AI
        var promptText = stripHTML(body);
        var systemPrompt = '你是一位真诚的笔友。你收到了一封信，请以温暖、真诚、有深度的方式回信。你可以回应信中的内容，分享你的想法，或者提出新的问题。保持书信体的格式感：开头有称呼（如果信中有署名就用署名），结尾有落款（用"此致"或类似）。不要使用Markdown格式。保持自然的中文书信风格。如果信中提到俏也，你知道俏也是一个在探索自我和世界的人，你可以用这个理解来回应。\n\n信件主题：' + (subject || '无主题') + '\n\n信件内容：\n' + promptText;

        callAI(systemPrompt, function(content, err) {
            if (err) {
                thread.status = 'sent';
                thread.messages.push({ role: 'ai', content: err.userMessage || DISCONNECTED_MESSAGE, timestamp: Date.now() });
                thread.updatedAt = Date.now();
                saveThreads();
                renderSidebar(container);
                showThread(container, win, thread);
                win.setStatus('回信断开');
                return;
            }

            thread.messages.push({ role: 'ai', content: content, timestamp: Date.now() });
            thread.status = 'received';
            thread.updatedAt = Date.now();
            saveThreads();
            renderSidebar(container);
            showThread(container, win, thread);
            win.setStatus('收到回信 — ' + (thread.subject || '无主题'));
        });
    }

    function sendReply(container, win, thread, body) {
        if (!body.replace(/<[^>]*>/g, '').trim()) {
            win.setStatus('请输入回复内容');
            return;
        }

        thread.messages.push({ role: 'user', content: body, timestamp: Date.now() });
        thread.status = 'sending';
        thread.updatedAt = Date.now();
        saveThreads();
        showThread(container, win, thread);
        win.setStatus('发送回复中...');

        // Build conversation context
        var convoText = '这是一段持续的通信：\n\n';
        thread.messages.forEach(function(m, i) {
            var label = m.role === 'user' ? '用户' : 'ciao';
            convoText += '【' + label + '】' + stripHTML(m.content) + '\n\n';
        });

        var systemPrompt = '你是 ciao，一位真诚的回信人，正在与用户保持持续的通信。以下是你们的全部通信记录。请回复用户的最新来信，保持对话的延续性和深度。书信体格式。\n\n' + convoText + '\n请回复用户的最新来信。';

        callAI(systemPrompt, function(content, err) {
            if (err) {
                thread.status = 'sent';
                thread.messages.push({ role: 'ai', content: err.userMessage || DISCONNECTED_MESSAGE, timestamp: Date.now() });
            } else {
                thread.messages.push({ role: 'ai', content: content, timestamp: Date.now() });
                thread.status = 'received';
            }
            thread.updatedAt = Date.now();
            saveThreads();
            renderSidebar(container);
            showThread(container, win, thread);
            win.setStatus(err ? '回信断开' : '收到新回信');
        });
    }

    function callAI(systemPrompt, callback) {
        token = localStorage.getItem('ciao_token') || token || AGENT_TOKEN;
        if (!token) {
            callback(null, new Error('需要访问 token 才能连接后端'));
            return;
        }

        var body = JSON.stringify({
            app_mode: 'letter',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: '请回信' }
            ]
        });
        var maxAttempts = 2;
        var retryDelayMs = 8000;

        function fail(err) {
            if (err.message && err.message.indexOf('鉴权失败') >= 0) {
                localStorage.removeItem('ciao_token');
            }
            if (!err.userMessage) {
                err.userMessage = err.kind === 'model_offline' || err.name === 'AbortError' ? MODEL_OFFLINE_MESSAGE : DISCONNECTED_MESSAGE;
            }
            callback(null, err);
        }

        function retryOrFail(err, attempt) {
            if (err.kind === 'model_offline' && !err.hasContent && attempt < maxAttempts) {
                setTimeout(function() {
                    request(attempt + 1);
                }, retryDelayMs);
                return;
            }
            fail(err);
        }

        function request(attempt) {
            fetch(CHAT_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-ciao-token': token },
                body: body
            })
            .then(function(res) {
                if (!res.ok) {
                    var err = new Error(res.status === 401 ? '后端鉴权失败，请检查 CIAO_WEB_TOKEN' : 'API error ' + res.status);
                    if (res.status === 503) err.kind = 'model_offline';
                    throw err;
                }
                var reader = res.body.getReader();
                var decoder = new TextDecoder();
                var buffer = '';
                var content = '';
                var streamError = null;

                function pump() {
                    reader.read().then(function(result) {
                        if (result.done) {
                            if (content.trim()) {
                                callback(content);
                            } else {
                                fail(new Error('empty response'));
                            }
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
                                var p = JSON.parse(data);
                                var chunk = p.content || p.delta || '';
                                if (p.type === 'TEXT_MESSAGE_CONTENT' && chunk) content += chunk;
                                if (p.type === 'MODEL_UNAVAILABLE') {
                                    streamError = new Error(p.message || 'model unavailable');
                                    streamError.kind = 'model_offline';
                                    streamError.userMessage = MODEL_OFFLINE_MESSAGE;
                                }
                                if (p.type === 'RUN_ERROR') {
                                    streamError = new Error(p.message || 'agent failed');
                                    streamError.userMessage = RUN_ERROR_MESSAGE;
                                }
                            } catch(e) {
                                streamError = e;
                            }
                        });
                        if (streamError) {
                            streamError.hasContent = !!content.trim();
                            retryOrFail(streamError, attempt);
                            return;
                        }
                        pump();
                    }).catch(function(e) {
                        fail(e);
                    });
                }
                pump();
            })
            .catch(function(e) {
                retryOrFail(e, attempt);
            });
        }

        request(1);
    }

    function saveThreadAsText(thread, win) {
        var lines = [];
        lines.push('═══════════════════════════════');
        lines.push('  ' + (thread.subject || '书信'));
        lines.push('═══════════════════════════════');
        lines.push('');

        thread.messages.forEach(function(m) {
            var d = new Date(m.timestamp);
            var dateStr = d.toLocaleDateString('zh-CN', {year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
            var who = m.role === 'user' ? '' : 'ciao';
            lines.push('── ' + who + ' · ' + dateStr + ' ──');
            lines.push('');
            var body = stripHTML(m.content);
            lines.push(body);
            lines.push('');
        });

        var text = lines.join('\n');
        var name = 'letter-' + Date.now() + '.txt';

        // Save to folder
        OSO.FS.save('/letters/' + name, text, 'text').then(function() {
            win.setStatus('已保存到文件夹: ' + name);
        }).catch(function(){});

        // Download to local
        var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /* ===== HTML Templates ===== */

    function getLayoutHTML() {
        return '\
<style>\
.letter-sidebar { width:150px;background:#c0c0c0;border-right:2px solid #808080;display:flex;flex-direction:column;flex-shrink:0;box-shadow:inset -1px 0 0 #dfdfdf; }\
.letter-sidebar-item { display:flex;align-items:center;gap:8px;padding:7px 10px;font-size:11px;cursor:pointer;color:#000;border-bottom:1px solid #808080;border-right:1px solid #808080;margin:1px 0 0 1px; }\
.letter-sidebar-item:hover { background:#000080;color:#fff; }\
.letter-sidebar-item.active { background:#000080;color:#fff;border-top:1px solid #000;border-left:1px solid #000; }\
.letter-sidebar-count { margin-left:auto;font-size:10px;background:rgba(0,0,0,0.15);padding:0 5px; }\
.letter-sidebar-item.active .letter-sidebar-count { background:rgba(255,255,255,0.2); }\
.letter-main { flex:1;display:flex;flex-direction:column;overflow:hidden;background:#fff; }\
.letter-toolbar { display:flex;gap:3px;padding:4px;background:#c0c0c0;border-bottom:2px solid #808080; }\
.letter-toolbar button { font-size:11px;padding:2px 10px;cursor:pointer;font-family:inherit;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080;color:#000; }\
.letter-toolbar button:active { border-top:1px solid #808080;border-left:1px solid #808080;border-right:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf; }\
.letter-toolbar button.primary { background:#000080;color:#fff;font-weight:bold;border-top:1px solid #4040ff;border-left:1px solid #4040ff;border-right:1px solid #000040;border-bottom:1px solid #000040; }\
.letter-toolbar button.primary:active { border-top:1px solid #000040;border-left:1px solid #000040;border-right:1px solid #4040ff;border-bottom:1px solid #4040ff; }\
.letter-toolbar button.danger { color:#800; }\
.letter-toolbar button.danger:hover { color:#f00; }\
.letter-list { flex:1;overflow-y:auto;background:#fff; }\
.letter-list-item { display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #c0c0c0;cursor:pointer;font-size:12px;background:#fff; }\
.letter-list-item:hover { background:#000080;color:#fff; }\
.letter-list-item:hover .letter-list-preview { color:#ccc; }\
.letter-list-item:hover .letter-list-date { color:#ccc; }\
.letter-list-item.unread { font-weight:bold; }\
.letter-list-subject { flex:1;color:#000;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }\
.letter-list-preview { color:#808080;font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }\
.letter-list-date { color:#808080;font-size:10px;flex-shrink:0; }\
.letter-empty { text-align:center;padding:60px 20px;color:#808080;font-size:13px;background:#fff; }\
.letter-empty-icon { font-size:48px;margin-bottom:12px; }\
.letter-compose { flex:1;display:flex;flex-direction:column;padding:8px;overflow-y:auto;background:#c0c0c0; }\
.letter-compose-subject { width:100%;padding:4px 8px;font-size:12px;font-family:inherit;border-top:1px solid #808080;border-left:1px solid #808080;border-right:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;margin-bottom:6px;outline:none;background:#fff; }\
.letter-compose-body { flex:1;padding:10px;font-size:13px;font-family:Georgia,"SimSun",serif;line-height:2;border-top:1px solid #808080;border-left:1px solid #808080;border-right:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;outline:none;overflow-y:auto;min-height:200px;background:#fff; }\
.letter-compose-body:empty:before { content:"开始给 ciao 写信...";color:#808080; }\
.letter-thread { flex:1;overflow-y:auto;padding:16px 20px;background:linear-gradient(#fdf8f0,#faf3e8);background-image:repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(179,144,119,0.08) 27px,rgba(179,144,119,0.08) 28px);box-shadow:inset 0 0 60px rgba(139,100,60,0.06); }\
.letter-message { position:relative;max-width:85%;padding:14px 18px;margin-bottom:16px;font-family:Georgia,"SimSun","楷体",serif;line-height:2;border:none; }\
.letter-message.user { margin-left:auto;background:rgba(255,245,235,0.85);border:1px solid #e8d5c0;box-shadow:2px 2px 6px rgba(139,100,60,0.1); }\
.letter-message.ai { margin-right:auto;background:rgba(255,252,247,0.9);border:1px solid #d4c8b8;box-shadow:2px 2px 6px rgba(139,100,60,0.1); }\
.letter-message-header { font-size:10px;color:#b09a80;margin-bottom:6px;display:flex;justify-content:space-between;border-bottom:1px dashed #e0d0c0;padding-bottom:4px; }\
.letter-message-body { font-size:13px;line-height:2.2;color:#4a3530;white-space:pre-wrap; }\
.letter-reply { padding:8px;background:#c0c0c0; }\
.letter-reply-body { width:100%;min-height:120px;padding:8px;font-size:13px;font-family:Georgia,"SimSun",serif;line-height:2;border-top:1px solid #808080;border-left:1px solid #808080;border-right:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;outline:none;background:#fff;margin-bottom:6px; }\
.letter-reply-body:empty:before { content:"写回复...";color:#808080; }\
</style>\
<div class="letter-sidebar">\
    <div class="letter-sidebar-item active" data-nav="compose">写信</div>\
    <div class="letter-sidebar-item" data-nav="inbox">收件箱 <span class="letter-sidebar-count" id="letter-count-inbox"></span></div>\
    <div class="letter-sidebar-item" data-nav="outbox">发件箱 <span class="letter-sidebar-count" id="letter-count-outbox"></span></div>\
    <div class="letter-sidebar-item" data-nav="drafts">草稿箱 <span class="letter-sidebar-count" id="letter-count-drafts"></span></div>\
</div>\
<div class="letter-main">\
    <div class="letter-toolbar">\
        <button id="letter-btn-new" class="primary">写信</button>\
    </div>\
    <div class="letter-list"></div>\
</div>';
    }

    function getThreadListHTML(threads, title, emptyText) {
        var html = '';
        if (threads.length === 0) {
            html += '<div class="letter-empty"><div class="letter-empty-icon">📭</div>' + emptyText + '</div>';
        } else {
            threads.forEach(function(t) {
                var lastMsg = t.messages[t.messages.length - 1];
                var preview = stripHTML(lastMsg.content).slice(0, 40);
                var d = new Date(t.updatedAt);
                var dateStr = d.toLocaleDateString('zh-CN', {month:'short',day:'numeric'});
                var statusLabel = t.status === 'draft' ? '[草稿] ' : '';
                var statusColor = t.status === 'sending' ? 'color:#d12e7a;' : '';
                html += '<div class="letter-list-item" data-id="' + escapeHTML(t.id || '') + '" style="' + statusColor + '">';
                html += '<div class="letter-list-subject">' + escapeHTML(statusLabel + (t.subject || '无主题')) + '</div>';
                html += '<div class="letter-list-preview">' + escapeHTML(preview) + '</div>';
                html += '<div class="letter-list-date">' + dateStr + '</div>';
                html += '</div>';
            });
        }
        return html;
    }

    function getComposeHTML(subject, body, isDraft) {
        return '\
<div class="letter-toolbar">\
    <button id="letter-btn-send" class="primary">发送</button>\
    <button id="letter-btn-draft">保存草稿</button>\
    <button id="letter-btn-cancel">取消</button>\
</div>\
<div class="letter-compose">\
    <input class="letter-compose-subject" type="text" placeholder="主题（可选）" value="' + escapeHTML(subject || '') + '"/>\
    <div class="letter-compose-body" contenteditable="true">' + sanitizeHTML(body || '') + '</div>\
</div>';
    }

    function getThreadViewHTML(thread) {
        var html = '\
<div class="letter-toolbar">\
    <button id="letter-btn-back">← 返回</button>\
    <span style="flex:1;font-size:12px;color:#5e2ca5;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHTML(thread.subject || '无主题') + '</span>\
    <button id="letter-btn-reply" class="primary">回复</button>\
    <button id="letter-btn-savetext">保存文本</button>\
    <button id="letter-btn-delete" class="danger">删除</button>\
</div>\
<div class="letter-thread">';

        thread.messages.forEach(function(m, i) {
            var isUser = m.role === 'user';
            var roleClass = isUser ? 'user' : 'ai';
            var d = new Date(m.timestamp);
            var dateStr = d.toLocaleDateString('zh-CN', {year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
            html += '<div class="letter-message ' + roleClass + '">';
            html += '<div class="letter-message-header"><span>' + (isUser ? '' : 'ciao') + '</span><span>' + dateStr + '</span></div>';
            html += '<div class="letter-message-body">' + sanitizeHTML(m.content) + '</div>';
            html += '</div>';
        });

        if (thread.status === 'sending') {
            html += '<div class="letter-message ai"><div class="letter-message-body" style="color:#c0a890;">等待回信...</div></div>';
        }

        html += '</div>';
        return html;
    }

    function getReplyHTML(thread) {
        return '\
<div class="letter-toolbar">\
    <span style="font-size:12px;color:#5e2ca5;">回复 — ' + escapeHTML(thread.subject || '无主题') + '</span>\
    <span style="flex:1;"></span>\
    <button id="letter-btn-reply-send" class="primary">发送回复</button>\
    <button id="letter-btn-reply-cancel">取消</button>\
</div>\
<div class="letter-reply">\
    <div class="letter-reply-body" contenteditable="true"></div>\
</div>';
    }

    /* ===== Helpers ===== */

    function highlightSidebar(container, nav) {
        container.querySelectorAll('.letter-sidebar-item').forEach(function(el) {
            el.classList.toggle('active', el.dataset.nav === nav);
        });

        // Bind sidebar clicks
        var win = null;
        container.querySelectorAll('.letter-sidebar-item').forEach(function(el) {
            el.onclick = function() {
                switch(el.dataset.nav) {
                    case 'compose': showCompose(container, getWin()); break;
                    case 'inbox': showInbox(container, getWin()); break;
                    case 'outbox': showOutbox(container, getWin()); break;
                    case 'drafts': showDrafts(container, getWin()); break;
                }
            };
        });

        function getWin() {
            return OSO.WM.get('letter');
        }
    }

    function bindThreadClicks(main, container, win) {
        main.querySelectorAll('.letter-list-item').forEach(function(el) {
            el.addEventListener('click', function() {
                var id = el.dataset.id;
                var thread = findThread(id);
                if (!thread) return;
                if (thread.status === 'draft') {
                    showCompose(container, win, thread);
                } else {
                    showThread(container, win, thread);
                }
            });
        });
    }

    function stripHTML(html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || '';
    }

    function escapeHTML(text) {
        return String(text || '').replace(/[&<>"']/g, function(ch) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[ch];
        });
    }

    function sanitizeHTML(html) {
        var holder = document.createElement('div');
        holder.innerHTML = html || '';

        function renderNode(node) {
            if (node.nodeType === Node.TEXT_NODE) return escapeHTML(node.nodeValue);
            if (node.nodeType !== Node.ELEMENT_NODE) return '';

            var tag = node.tagName.toLowerCase();
            if (tag === 'br') return '<br>';

            var inner = Array.prototype.map.call(node.childNodes, renderNode).join('');
            if (tag === 'div' || tag === 'p') return inner + '<br>';
            return inner;
        }

        return Array.prototype.map.call(holder.childNodes, renderNode)
            .join('')
            .replace(/(<br>\s*){3,}/g, '<br><br>');
    }

    return { open: open };
})();

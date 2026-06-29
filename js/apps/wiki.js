/* ===== Ciao OS - Wikipedia (Wiki Reader) ===== */

var OSO_Wiki = (function() {
    'use strict';

    var pageIndex = null;       // { pageName: "path/to/file.md" }
    var historyStack = [];      // [pageName, ...]
    var historyPos = -1;
    var currentContainer = null;
    var currentFrame = null;
    var currentTitle = null;
    var currentStatus = null;
    var backBtn = null;
    var fwdBtn = null;

    function open() {
        if (OSO.WM.get('wiki')) {
            OSO.WM.focus(OSO.WM.get('wiki'));
            return;
        }
        init();
    }

    function init() {
        // Load page index first, then open window
        if (pageIndex) {
            createWindow();
        } else {
            fetch('data/wiki-index.json')
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    pageIndex = data;
                    createWindow();
                })
                .catch(function() {
                    pageIndex = {};
                    createWindow();
                });
        }
    }

    function createWindow() {
        var container = document.createElement('div');
        container.style.cssText = 'display:flex;flex-direction:column;height:100%;overflow:hidden;';
        container.innerHTML = getToolbarHTML();

        currentContainer = container;

        var win = OSO.WM.create('wiki', 'Wikipedia', 'assets/icons/image-9.png', container, {
            width: 820, height: 620, minWidth: 520, minHeight: 400
        });

        // Content area
        var body = document.createElement('div');
        body.className = 'wiki-body';
        body.style.cssText = 'flex:1;overflow:auto;padding:20px 24px;background:#f6f6f0;font-family:Georgia,"Times New Roman",serif;font-size:14px;line-height:1.7;color:#202122;';
        container.appendChild(body);
        currentFrame = body;

        // Wire up toolbar buttons
        backBtn = container.querySelector('.wiki-btn-back');
        fwdBtn = container.querySelector('.wiki-btn-fwd');
        currentTitle = container.querySelector('.wiki-nav-title');
        currentStatus = container.querySelector('.wiki-nav-status');

        backBtn.addEventListener('click', goBack);
        fwdBtn.addEventListener('click', goForward);
        container.querySelector('.wiki-btn-home').addEventListener('click', goHome);
        container.querySelector('.wiki-btn-nebula').addEventListener('click', openNebula);

        // Click delegation for wiki links
        body.addEventListener('click', function(e) {
            var link = e.target.closest('.wiki-link');
            if (!link) return;
            e.preventDefault();
            var page = link.getAttribute('data-page');
            if (page) navigateTo(page);
        });

        // Load home page
        navigateTo('index', true);
    }

    /* ---- Navigation ---- */

    function navigateTo(pageName, replace) {
        // Trim the history if we're not at the end
        if (historyPos < historyStack.length - 1) {
            historyStack = historyStack.slice(0, historyPos + 1);
        }
        if (!replace || historyStack.length === 0) {
            historyStack.push(pageName);
            historyPos = historyStack.length - 1;
        } else {
            historyStack[historyPos] = pageName;
        }
        updateNavButtons();
        loadPage(pageName);
    }

    function goBack() {
        if (historyPos > 0) {
            historyPos--;
            updateNavButtons();
            loadPage(historyStack[historyPos]);
        }
    }

    function goForward() {
        if (historyPos < historyStack.length - 1) {
            historyPos++;
            updateNavButtons();
            loadPage(historyStack[historyPos]);
        }
    }

    function goHome() {
        navigateTo('index');
    }

    function openNebula() {
        if (typeof OSO_WikiGraph !== 'undefined' && OSO_WikiGraph.open) {
            OSO_WikiGraph.open();
        }
    }

    function updateNavButtons() {
        if (backBtn) backBtn.disabled = (historyPos <= 0);
        if (fwdBtn) fwdBtn.disabled = (historyPos >= historyStack.length - 1);
    }

    /* ---- Page Loading ---- */

    function loadPage(pageName) {
        var url;
        if (pageName === 'index') {
            url = 'data/wiki-public/index.md';
        } else {
            var relPath = pageIndex[pageName];
            if (!relPath) {
                renderPage(pageName, '<div class="wiki-content"><h1>' + esc(pageName) + '</h1><p><em>Page not found in wiki.</em></p></div>');
                return;
            }
            url = 'data/wiki-public/' + relPath;
        }

        if (currentStatus) currentStatus.textContent = 'Loading...';
        if (currentTitle) currentTitle.textContent = pageName;

        fetch(url)
            .then(function(r) {
                if (!r.ok) throw new Error('Not found');
                return r.text();
            })
            .then(function(md) {
                var html = mdToHTML(md);
                renderPage(pageName, html);
            })
            .catch(function() {
                renderPage(pageName, '<div class="wiki-content"><h1>' + esc(pageName) + '</h1><p><em>Unable to load this page.</em></p></div>');
            });
    }

    function renderPage(pageName, html) {
        if (currentFrame) {
            currentFrame.innerHTML = html;
            currentFrame.scrollTop = 0;
        }
        if (currentStatus) currentStatus.textContent = pageName;
        if (currentTitle) currentTitle.textContent = pageName;

        // Update window title
        var win = OSO.WM.get('wiki');
        if (win) win.setTitle('Wikipedia - ' + pageName);
    }

    /* ---- Markdown to HTML ---- */

    function mdToHTML(md) {
        // Remove YAML front matter
        md = md.replace(/^---[\s\S]*?---\n*/, '');

        // Process [[双链]] before line-based parsing
        // [[Page|Alias]] → link with alias
        // [[Page]] → link with page name
        md = md.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, function(_, page, alias) {
            return '<a class="wiki-link" href="#" data-page="' + escAttr(page.trim()) + '">' + esc(alias.trim()) + '</a>';
        });
        md = md.replace(/\[\[([^\]]+)\]\]/g, function(_, page) {
            return '<a class="wiki-link" href="#" data-page="' + escAttr(page.trim()) + '">' + esc(page.trim()) + '</a>';
        });

        var lines = md.split('\n');
        var html = '';
        var inList = false;
        var inBlockquote = false;
        var inParagraph = false;
        var listType = '';

        function closeParagraph() {
            if (inParagraph) { html += '</p>\n'; inParagraph = false; }
        }
        function closeList() {
            if (inList) { html += (listType === 'ol' ? '</ol>\n' : '</ul>\n'); inList = false; listType = ''; }
        }
        function closeBlockquote() {
            if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }
        }

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];

            // Empty line
            if (line.trim() === '') {
                closeParagraph();
                closeList();
                closeBlockquote();
                continue;
            }

            // Headings
            var hMatch = line.match(/^(#{1,6})\s+(.+)/);
            if (hMatch) {
                closeParagraph();
                closeList();
                closeBlockquote();
                var level = hMatch[1].length;
                html += '<h' + level + '>' + hMatch[2] + '</h' + level + '>\n';
                continue;
            }

            // Horizontal rule
            if (/^[-*_]{3,}\s*$/.test(line.trim())) {
                closeParagraph();
                closeList();
                closeBlockquote();
                html += '<hr>\n';
                continue;
            }

            // Blockquote
            var bqMatch = line.match(/^>\s?(.*)/);
            if (bqMatch) {
                closeParagraph();
                closeList();
                if (!inBlockquote) { html += '<blockquote>\n'; inBlockquote = true; }
                html += '<p>' + bqMatch[1] + '</p>\n';
                continue;
            }

            // Unordered list
            var ulMatch = line.match(/^(\s*)[-*+]\s+(.+)/);
            if (ulMatch) {
                closeParagraph();
                closeBlockquote();
                if (!inList || listType !== 'ul') {
                    closeList();
                    html += '<ul>\n';
                    inList = true;
                    listType = 'ul';
                }
                html += '<li>' + ulMatch[2] + '</li>\n';
                continue;
            }

            // Ordered list
            var olMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
            if (olMatch) {
                closeParagraph();
                closeBlockquote();
                if (!inList || listType !== 'ol') {
                    closeList();
                    html += '<ol>\n';
                    inList = true;
                    listType = 'ol';
                }
                html += '<li>' + olMatch[2] + '</li>\n';
                continue;
            }

            // Regular paragraph text
            closeList();
            closeBlockquote();
            if (!inParagraph) { html += '<p>'; inParagraph = true; }
            else { html += ' '; }
            html += line;
        }

        closeParagraph();
        closeList();
        closeBlockquote();

        // Inline formatting (bold, italic)
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');

        return '<div class="wiki-content">' + html + '</div>';
    }

    /* ---- Helpers ---- */

    function esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function escAttr(s) {
        return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    /* ---- Toolbar HTML ---- */

    function getToolbarHTML() {
        return '\
<style>\
.wiki-toolbar {\
    display: flex;\
    align-items: center;\
    gap: 3px;\
    padding: 4px 6px;\
    background: #e8e5dc;\
    border-bottom: 2px solid #c8c0b0;\
    flex-shrink: 0;\
    font-family: "Segoe UI", sans-serif;\
    font-size: 11px;\
}\
.wiki-toolbar button {\
    height: 26px;\
    padding: 2px 10px;\
    font-size: 11px;\
    font-family: inherit;\
    background: #f0ede5;\
    border: 1px solid #b0a890;\
    border-radius: 2px;\
    color: #333;\
    cursor: pointer;\
    white-space: nowrap;\
}\
.wiki-toolbar button:hover {\
    background: #faf8f2;\
    border-color: #8a7a60;\
}\
.wiki-toolbar button:active {\
    background: #ddd8cc;\
}\
.wiki-toolbar button:disabled {\
    opacity: 0.4;\
    cursor: default;\
}\
.wiki-toolbar button.wiki-btn-nebula {\
    margin-left: auto;\
    background: linear-gradient(135deg, #5e2ca5, #8a41ff);\
    color: #fff;\
    border-color: #3a1a7a;\
    font-weight: bold;\
}\
.wiki-toolbar button.wiki-btn-nebula:hover {\
    background: linear-gradient(135deg, #6e3cb5, #9a51ff);\
}\
.wiki-nav-title {\
    font-weight: bold;\
    color: #5e2ca5;\
    margin: 0 6px;\
    max-width: 200px;\
    overflow: hidden;\
    text-overflow: ellipsis;\
    white-space: nowrap;\
}\
.wiki-nav-sep {\
    color: #aaa;\
    margin: 0 3px;\
}\
.wiki-nav-status {\
    color: #888;\
    margin-left: auto;\
    margin-right: 6px;\
    font-size: 10px;\
    max-width: 250px;\
    overflow: hidden;\
    text-overflow: ellipsis;\
    white-space: nowrap;\
}\
/* Retro Wikipedia content styling */\
.wiki-content {\
    max-width: 720px;\
    margin: 0 auto;\
}\
.wiki-content h1 {\
    font-size: 24px;\
    font-weight: normal;\
    border-bottom: 1px solid #a2a9b1;\
    padding-bottom: 4px;\
    margin: 0 0 12px 0;\
    font-family: Georgia, "Times New Roman", serif;\
    color: #000;\
}\
.wiki-content h2 {\
    font-size: 19px;\
    font-weight: normal;\
    border-bottom: 1px solid #a2a9b1;\
    padding-bottom: 3px;\
    margin: 20px 0 8px 0;\
    color: #000;\
}\
.wiki-content h3 {\
    font-size: 16px;\
    font-weight: bold;\
    margin: 16px 0 6px 0;\
    color: #000;\
}\
.wiki-content h4, .wiki-content h5, .wiki-content h6 {\
    font-size: 14px;\
    font-weight: bold;\
    margin: 14px 0 4px 0;\
    color: #000;\
}\
.wiki-content p {\
    margin: 0 0 10px 0;\
}\
.wiki-content a.wiki-link {\
    color: #0645ad;\
    text-decoration: none;\
    cursor: pointer;\
}\
.wiki-content a.wiki-link:hover {\
    text-decoration: underline;\
}\
.wiki-content a.wiki-link:visited {\
    color: #0b0080;\
}\
.wiki-content ul, .wiki-content ol {\
    margin: 0 0 10px 0;\
    padding-left: 24px;\
}\
.wiki-content li {\
    margin-bottom: 2px;\
}\
.wiki-content blockquote {\
    margin: 0 0 10px 0;\
    padding: 4px 12px;\
    border-left: 3px solid #a2a9b1;\
    background: #faf8f2;\
    color: #444;\
}\
.wiki-content blockquote p {\
    margin: 0;\
}\
.wiki-content hr {\
    border: none;\
    border-top: 1px solid #a2a9b1;\
    margin: 16px 0;\
}\
.wiki-content strong {\
    font-weight: bold;\
}\
.wiki-content em {\
    font-style: italic;\
}\
.wiki-content code {\
    background: #f0ede5;\
    padding: 1px 4px;\
    border-radius: 2px;\
    font-family: "Courier New", monospace;\
    font-size: 13px;\
}\
</style>\
<div class="wiki-toolbar">\
    <button class="wiki-btn-back" disabled title="Back">\u25C0 Back</button>\
    <button class="wiki-btn-fwd" disabled title="Forward">Fwd \u25B6</button>\
    <span class="wiki-nav-sep">|</span>\
    <button class="wiki-btn-home" title="Home">\u2302 Home</button>\
    <span class="wiki-nav-title"></span>\
    <span class="wiki-nav-status"></span>\
    <button class="wiki-btn-nebula" title="打开知识图谱">\u2606 知识图谱</button>\
</div>';
    }

    /* ---- Public ---- */

    return { open: open };
})();

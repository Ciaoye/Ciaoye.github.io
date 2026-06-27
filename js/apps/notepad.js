/* ===== 俏也 OS — Notepad App ===== */

var OSO_Notepad = (function() {
    'use strict';

    var saveTimer = null;
    var currentFile = '';

    var currentWin = null;
    var currentTextarea = null;
    var currentStatusLabel = null;
    var currentTitleInput = null;

    // options: { content, filename, position }
    function open(options) {
        options = options || {};

        if (OSO.WM.get('notepad')) {
            var win = OSO.WM.get('notepad');
            OSO.WM.focus(win);
            // Load new content into existing window
            if (options.content !== undefined && currentTextarea) {
                currentTextarea.value = options.content;
                currentFile = options.filename || '/notepad/untitled.txt';
                var dname = currentFile.split('/').pop();
                if (currentTitleInput) currentTitleInput.value = dname.replace(/\.txt$/, '');
                win.setTitle(dname + ' - Notepad');
                if (currentStatusLabel) currentStatusLabel.textContent = 'Opened: ' + dname;
            }
            return;
        }

        var container = document.createElement('div');
        container.style.cssText = 'display:flex;flex-direction:column;height:100%;overflow:hidden;';

        container.innerHTML = getHTML();
        var win = OSO.WM.create('notepad', 'untitled - Notepad', 'assets/icons/image-12.png', container, {
            width: 520, height: 420, minWidth: 300, minHeight: 200,
            position: options.position || undefined
        });

        var textarea = container.querySelector('.np-textarea');
        var statusLabel = container.querySelector('.np-status');
        var titleInput = container.querySelector('.np-title-input');
        var menuFile = container.querySelector('.np-menu-file');

        // Save references for reuse
        currentWin = win;
        currentTextarea = textarea;
        currentStatusLabel = statusLabel;
        currentTitleInput = titleInput;

        // Use provided content or load from FS
        if (options.content !== undefined) {
            textarea.value = options.content;
            currentFile = options.filename || '/notepad/untitled.txt';
            var dname = currentFile.split('/').pop();
            if (dname !== 'untitled.txt') {
                titleInput.value = dname.replace(/\.txt$/, '');
                win.setTitle(dname + ' - Notepad');
            }
            statusLabel.textContent = 'Loaded: ' + dname;
        } else {
            currentFile = '/notepad/untitled.txt';
            OSO.FS.load(currentFile).then(function(record) {
                if (record && record.data) {
                    var content = typeof record.data === 'string' ? record.data : '';
                    textarea.value = content;
                    var name = currentFile.split('/').pop();
                    statusLabel.textContent = 'Loaded: ' + name;
                }
            }).catch(function() {
                statusLabel.textContent = 'New document';
            });
        }

        /* === File Menu === */
        var menuDropdown = container.querySelector('.np-menu-dropdown');

        menuFile.addEventListener('click', function(e) {
            e.stopPropagation();
            menuDropdown.classList.toggle('open');
        });

        document.addEventListener('click', function() {
            menuDropdown.classList.remove('open');
        });

        container.querySelector('.np-menu-new').addEventListener('click', function(e) {
            e.stopPropagation();
            if (textarea.value && !confirm('Discard unsaved changes?')) return;
            textarea.value = '';
            currentFile = '/notepad/untitled.txt';
            titleInput.value = '';
            statusLabel.textContent = 'New document';
            win.setTitle('untitled - Notepad');
            menuDropdown.classList.remove('open');
        });

        container.querySelector('.np-menu-open').addEventListener('click', function(e) {
            e.stopPropagation();
            showOpenDialog(container, textarea, win, statusLabel, titleInput, menuDropdown);
        });

        container.querySelector('.np-menu-save').addEventListener('click', function(e) {
            e.stopPropagation();
            saveDoc(win, textarea, statusLabel);
            menuDropdown.classList.remove('open');
        });

        /* === Save === */
        container.querySelector('.np-btn-save').addEventListener('click', function() {
            saveDoc(win, textarea, statusLabel);
        });

        /* === Download === */
        container.querySelector('.np-btn-export').addEventListener('click', function() {
            var text = textarea.value;
            var name = currentFile.split('/').pop() || 'untitled.txt';
            var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            win.setStatus('Downloaded: ' + name);
        });

        /* === New === */
        container.querySelector('.np-btn-new').addEventListener('click', function() {
            if (textarea.value && !confirm('Discard unsaved changes?')) return;
            textarea.value = '';
            currentFile = '/notepad/untitled.txt';
            titleInput.value = '';
            statusLabel.textContent = 'New document';
            win.setTitle('untitled - Notepad');
        });

        /* === Title input === */
        titleInput.addEventListener('change', function() {
            var name = (titleInput.value.trim() || 'untitled') + '.txt';
            currentFile = '/notepad/' + name;
            win.setTitle(name + ' - Notepad');
        });

        /* === Auto-save on input === */
        textarea.addEventListener('input', function() {
            if (saveTimer) clearTimeout(saveTimer);
            saveTimer = setTimeout(function() {
                saveDoc(win, textarea, statusLabel);
            }, 1500);
        });

        /* === Save on close === */
        OSO.WM.on('close', function(closedWin) {
            if (closedWin.id === 'notepad') {
                saveDoc(win, textarea, statusLabel);
            }
        });

        win.setStatus('File >  New / Open / Save');
    }

    /* ===== Open Dialog ===== */
    function showOpenDialog(container, textarea, win, statusLabel, titleInput, menuDropdown) {
        var oldOverlay = container.querySelector('.np-open-overlay');
        if (oldOverlay) oldOverlay.remove();

        var overlay = document.createElement('div');
        overlay.className = 'np-open-overlay';

        overlay.innerHTML = '\
<div class="np-open-dialog">\
    <div class="np-open-title">Open File</div>\
    <div class="np-open-list" style="max-height:200px;overflow-y:auto;margin:4px 0;">Loading...</div>\
    <div style="text-align:right;margin-top:8px;">\
        <button class="np-open-cancel">Cancel</button>\
    </div>\
</div>';

        container.appendChild(overlay);
        menuDropdown.classList.remove('open');

        overlay.querySelector('.np-open-cancel').addEventListener('click', function() {
            overlay.remove();
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.remove();
        });

        // Load text files
        OSO.FS.list().then(function(files) {
            var txtFiles = (files || []).filter(function(f) {
                var n = f.path.toLowerCase();
                return f.type === 'text' || n.endsWith('.txt') || f.type === 'json' || n.endsWith('.json');
            });
            var listEl = overlay.querySelector('.np-open-list');
            if (txtFiles.length === 0) {
                listEl.innerHTML = '<div style="padding:12px;color:#808080;text-align:center;">No text files found</div>';
                return;
            }
            listEl.innerHTML = '';
            txtFiles.forEach(function(f) {
                var item = document.createElement('div');
                item.className = 'np-open-item';
                item.textContent = f.path;
                item.addEventListener('click', function() {
                    var content = typeof f.data === 'string' ? f.data : JSON.stringify(f.data);
                    textarea.value = content;
                    currentFile = f.path;
                    var name = f.path.split('/').pop();
                    titleInput.value = name.replace(/\.\w+$/, '');
                    win.setTitle(name + ' - Notepad');
                    statusLabel.textContent = 'Opened: ' + name;
                    overlay.remove();
                });
                listEl.appendChild(item);
            });
        });

        win.setStatus('Select a file to open');
    }

    function saveDoc(win, textarea, statusLabel) {
        var text = textarea.value;
        if (!text) return;
        OSO.FS.save(currentFile, text, 'text').then(function() {
            var name = currentFile.split('/').pop();
            if (statusLabel) statusLabel.textContent = 'Saved: ' + name;
            if (win) win.setStatus('Saved: ' + name);
        }).catch(function(err) {
            if (win) win.setStatus('Save failed: ' + err.message);
        });
    }

    function getHTML() {
        return '\
<style>\
.np-toolbar { display:flex;align-items:center;gap:4px;padding:2px 6px;background:#c0c0c0;border-bottom:1px solid #808080;flex-shrink:0;flex-wrap:wrap;position:relative; }\
.np-toolbar button { font-size:11px;padding:3px 10px;font-family:inherit;cursor:pointer;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080; }\
.np-toolbar button:active { border-top:1px solid #808080;border-left:1px solid #808080;border-right:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf; }\
.np-toolbar .np-title-input { flex:1;padding:2px 6px;font-size:11px;font-family:inherit;background:#fff;border:1px solid #808080;border-right-color:#dfdfdf;border-bottom-color:#dfdfdf;min-width:80px; }\
.np-textarea { flex:1;padding:8px;font-size:12px;font-family:"Consolas","Courier New",monospace;line-height:1.5;border:none;outline:none;resize:none;background:#fff;border:1px solid #808080;border-right-color:#dfdfdf;border-bottom-color:#dfdfdf;margin:2px 4px; }\
.np-status-bar { display:flex;align-items:center;justify-content:space-between;padding:2px 6px;font-size:10px;background:#c0c0c0;border-top:1px solid #808080;flex-shrink:0;color:#000; }\
/* File Menu */\
.np-menu-file { position:relative;padding:3px 10px;font-size:11px;cursor:pointer;font-family:inherit;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080; }\
.np-menu-file:first-letter { text-decoration:underline; }\
.np-menu-file:hover { background:#e0e0e0; }\
.np-menu-dropdown { display:none;position:absolute;top:100%;left:0;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080;z-index:200;min-width:120px;box-shadow:2px 2px 4px rgba(0,0,0,0.2); }\
.np-menu-dropdown.open { display:block; }\
.np-menu-dropdown div { padding:4px 12px;font-size:11px;cursor:pointer;white-space:nowrap; }\
.np-menu-dropdown div:hover { background:#000080;color:#fff; }\
.np-menu-dropdown div:first-letter { text-decoration:underline; }\
.np-menu-sep { height:1px;background:#808080;border-bottom:1px solid #dfdfdf;margin:1px 0; }\
/* Open Dialog */\
.np-open-overlay { position:absolute;inset:0;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:150; }\
.np-open-dialog { background:#c0c0c0;border-top:2px solid #dfdfdf;border-left:2px solid #dfdfdf;border-right:2px solid #808080;border-bottom:2px solid #808080;padding:10px;min-width:280px;max-width:380px; }\
.np-open-title { font-size:12px;font-weight:bold;margin-bottom:4px; }\
.np-open-item { padding:4px 8px;font-size:11px;cursor:pointer;border-bottom:1px solid #a0a0a0; }\
.np-open-item:hover { background:#000080;color:#fff; }\
.np-open-cancel { font-size:11px;padding:3px 12px;cursor:pointer;font-family:inherit;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080; }\
</style>\
<div class="np-toolbar">\
    <button class="np-menu-file">File</button>\
    <div class="np-menu-dropdown">\
        <div class="np-menu-new">New</div>\
        <div class="np-menu-open">Open...</div>\
        <div class="np-menu-save">Save</div>\
    </div>\
    <input class="np-title-input" placeholder="untitled" maxlength="60" style="width:120px;" />\
    <button class="np-btn-save">Save</button>\
    <button class="np-btn-export">Download</button>\
    <button class="np-btn-new">New</button>\
</div>\
<textarea class="np-textarea" placeholder="Write here..." spellcheck="false"></textarea>\
<div class="np-status-bar">\
    <span class="np-status">Ready</span>\
    <span style="color:#808080;">ciao os Notepad</span>\
</div>';
    }

    return { open: open };
})();

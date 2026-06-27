/* ===== 俏也 OS — File Manager App ===== */

var OSO_FileManager = (function() {
    'use strict';

    function open(folderPath) {
        folderPath = folderPath || '/';

        if (OSO.WM.get('filemanager')) {
            OSO.WM.focus(OSO.WM.get('filemanager'));
            return;
        }

        var container = document.createElement('div');
        container.style.cssText = 'display:flex;flex-direction:column;height:100%;overflow:hidden;';

        container.innerHTML = getHTML();
        var win = OSO.WM.create('filemanager', 'File Manager', 'assets/icons/image-5.png', container, {
            width: 620, height: 460, minWidth: 400, minHeight: 300
        });

        var fileListEl = container.querySelector('.fm-file-list');
        var statusText = container.querySelector('.fm-status');
        var pathLabel = container.querySelector('.fm-path');

        function refresh() {
            fileListEl.innerHTML = '<div class="fm-empty">Loading...</div>';
            statusText.textContent = 'Refreshing...';

            OSO.FS.list().then(function(files) {
                renderFiles(files || []);
                var count = (files || []).length;
                statusText.textContent = count + ' file' + (count !== 1 ? 's' : '');
            }).catch(function(err) {
                fileListEl.innerHTML = '<div class="fm-empty">Failed to load files: ' + err.message + '</div>';
                statusText.textContent = 'Error';
            });
        }

        function renderFiles(files) {
            fileListEl.innerHTML = '';

            if (files.length === 0) {
                fileListEl.innerHTML = '<div class="fm-empty">No files yet.<br/><small>Files from Paint, Chat and other apps will appear here.</small></div>';
                return;
            }

            // Sort by updatedAt descending
            files.sort(function(a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });

            // Group by folder
            var folders = {};
            files.forEach(function(f) {
                var dir = f.path.lastIndexOf('/');
                var folder = dir > 0 ? f.path.substring(0, dir + 1) : '/';
                if (!folders[folder]) folders[folder] = [];
                folders[folder].push(f);
            });

            Object.keys(folders).sort().forEach(function(folder) {
                // Folder header
                var header = document.createElement('div');
                header.className = 'fm-folder-header';
                header.innerHTML = '<span class="fm-folder-icon">&#128193;</span> ' + escapeHTML(folder);
                fileListEl.appendChild(header);

                folders[folder].forEach(function(f) {
                    var row = createFileRow(f);
                    fileListEl.appendChild(row);
                });
            });
        }

        function createFileRow(file) {
            var row = document.createElement('div');
            row.className = 'fm-file-row';
            row.style.cursor = 'pointer';

            var name = file.path.split('/').pop();
            var typeIcon = getTypeIcon(file);
            var sizeStr = formatSize(file.data, file.type);
            var dateStr = file.updatedAt ? new Date(file.updatedAt).toLocaleString() : 'Unknown';

            row.innerHTML =
                '<span class="fm-file-icon">' + typeIcon + '</span>' +
                '<span class="fm-file-name" title="' + escapeHTML(file.path) + '">' + escapeHTML(name) + '</span>' +
                '<span class="fm-file-type">' + (file.type || 'blob') + '</span>' +
                '<span class="fm-file-size">' + sizeStr + '</span>' +
                '<span class="fm-file-date">' + dateStr + '</span>' +
                '<span class="fm-file-actions">' +
                    '<button class="fm-btn fm-btn-dl" title="Download">&#128229;</button>' +
                    '<button class="fm-btn fm-btn-del" title="Delete">&#128465;</button>' +
                '</span>';

            // Open / Preview on double-click
            row.addEventListener('dblclick', function() {
                openOrPreview(file);
            });

            // Download
            row.querySelector('.fm-btn-dl').addEventListener('click', function(e) {
                e.stopPropagation();
                downloadFile(file);
            });

            // Delete
            row.querySelector('.fm-btn-del').addEventListener('click', function(e) {
                e.stopPropagation();
                deleteFile(file, row);
            });

            return row;
        }

        function openOrPreview(file) {
            var name = file.path.toLowerCase();
            var content = file.data;

            // Text files → open in Notepad
            if (file.type === 'text' || file.type === 'json' || name.endsWith('.txt') || name.endsWith('.json') || name.endsWith('.md')) {
                var text = typeof content === 'string' ? content : JSON.stringify(content);
                OSO_Notepad.open({ content: text, filename: file.path });
                return;
            }

            // Image files → preview inline
            if (isImage(file)) {
                previewImage(file);
                return;
            }

            // Fallback: download
            downloadFile(file);
        }

        function isImage(file) {
            var n = file.path.toLowerCase();
            if (n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.gif') || n.endsWith('.webp')) return true;
            if (file.data instanceof Blob && file.data.type && file.data.type.startsWith('image/')) return true;
            return false;
        }

        function previewImage(file) {
            var blob;
            if (file.data instanceof Blob) {
                blob = file.data;
            } else if (typeof file.data === 'string') {
                blob = new Blob([file.data]);
            } else {
                return;
            }
            var url = URL.createObjectURL(blob);

            var overlay = document.createElement('div');
            overlay.className = 'fm-preview-overlay';
            overlay.innerHTML = '\
<div class="fm-preview-box">\
    <div class="fm-preview-header">\
        <span>' + escapeHTML(file.path.split('/').pop()) + '</span>\
        <button class="fm-preview-close">Close</button>\
    </div>\
    <div class="fm-preview-body">\
        <img src="' + url + '" alt="preview" style="max-width:100%;max-height:100%;object-fit:contain;"/>\
    </div>\
</div>';

            overlay.querySelector('.fm-preview-close').addEventListener('click', function() {
                overlay.remove();
                URL.revokeObjectURL(url);
            });
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    overlay.remove();
                    URL.revokeObjectURL(url);
                }
            });

            container.appendChild(overlay);
            win.setStatus('Preview: ' + file.path.split('/').pop());
        }

        function downloadFile(file) {
            var blob;
            if (file.data instanceof Blob) {
                blob = file.data;
            } else if (file.type === 'json' && typeof file.data === 'string') {
                blob = new Blob([file.data], { type: 'application/json' });
            } else if (typeof file.data === 'string') {
                blob = new Blob([file.data], { type: 'text/plain' });
            } else {
                blob = new Blob([JSON.stringify(file.data)], { type: 'application/json' });
            }

            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = file.path.split('/').pop();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            win.setStatus('Downloaded: ' + file.path.split('/').pop());
        }

        function deleteFile(file, row) {
            if (!confirm('Delete "' + file.path.split('/').pop() + '"?')) return;

            OSO.FS.delete(file.path).then(function() {
                if (row && row.parentNode) {
                    row.style.opacity = '0';
                    row.style.transform = 'translateX(20px)';
                    row.style.transition = 'all 0.2s';
                    setTimeout(function() {
                        refresh();
                    }, 250);
                }
                win.setStatus('Deleted: ' + file.path.split('/').pop());
            }).catch(function(err) {
                alert('Delete failed: ' + err.message);
            });
        }

        function getTypeIcon(file) {
            if (file.type === 'json') return '&#128196;'; // JSON
            if (file.type === 'blob') {
                // Check by extension
                var name = file.path.toLowerCase();
                if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.gif'))
                    return '&#128247;'; // Image
                return '&#128190;'; // Generic blob
            }
            return '&#128196;';
        }

        function formatSize(data, type) {
            if (!data) return '0 B';
            var bytes = 0;
            if (data instanceof Blob) {
                bytes = data.size;
            } else if (typeof data === 'string') {
                bytes = new Blob([data]).size;
            } else {
                bytes = new Blob([JSON.stringify(data)]).size;
            }
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }

        function escapeHTML(str) {
            var div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        // Toolbar events
        container.querySelector('.fm-btn-refresh').addEventListener('click', refresh);
        container.querySelector('.fm-btn-delete-all').addEventListener('click', function() {
            OSO.FS.list().then(function(files) {
                if (!files || files.length === 0) {
                    alert('No files to delete.');
                    return;
                }
                if (!confirm('Delete ALL ' + files.length + ' file(s)? This cannot be undone!')) return;

                var paths = files.map(function(f) { return f.path; });
                OSO.FS.deleteAll(paths).then(function() {
                    refresh();
                    win.setStatus('All files deleted.');
                }).catch(function(err) {
                    alert('Error deleting files: ' + err.message);
                });
            });
        });

        // Initial load
        refresh();
        win.setStatus('Ready');
    }

    function getHTML() {
        return '\
<style>\
.fm-toolbar { display:flex;align-items:center;gap:4px;padding:4px 6px;background:#c0c0c0;border-bottom:1px solid #808080;flex-shrink:0;flex-wrap:wrap; }\
.fm-toolbar button { font-size:11px;padding:3px 10px;font-family:inherit;cursor:pointer;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080;white-space:nowrap; }\
.fm-toolbar button:active { border-top:1px solid #808080;border-left:1px solid #808080;border-right:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf; }\
.fm-toolbar button:disabled { opacity:0.5; }\
.fm-toolbar .fm-path { flex:1;padding:2px 6px;font-size:11px;background:#fff;border:1px solid #808080;border-right-color:#dfdfdf;border-bottom-color:#dfdfdf;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;min-width:80px; }\
.fm-status-bar { display:flex;align-items:center;justify-content:space-between;padding:2px 6px;font-size:10px;background:#c0c0c0;border-top:1px solid #808080;flex-shrink:0;color:#000; }\
.fm-file-list { flex:1;overflow-y:auto;background:#fff;border:1px solid #808080;border-right-color:#dfdfdf;border-bottom-color:#dfdfdf;margin:2px 4px; }\
.fm-empty { text-align:center;padding:40px 20px;color:#808080;font-size:12px;line-height:1.8; }\
.fm-empty small { font-size:11px;color:#aaa; }\
.fm-folder-header { display:flex;align-items:center;gap:4px;padding:4px 8px;font-size:11px;font-weight:bold;color:#5e2ca5;background:#f0eaff;border-bottom:1px solid #d4bfff; }\
.fm-folder-icon { font-size:14px; }\
.fm-file-row { display:flex;align-items:center;gap:6px;padding:3px 8px;font-size:11px;border-bottom:1px solid #e0e0e0;cursor:default; }\
.fm-file-row:hover { background:#e8f0ff; }\
.fm-file-row:last-child { border-bottom:none; }\
.fm-file-icon { width:20px;text-align:center;flex-shrink:0;font-size:14px; }\
.fm-file-name { flex:2;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:bold; }\
.fm-file-type { flex:0.6;color:#808080;text-transform:uppercase;font-size:9px; }\
.fm-file-size { flex:0.6;text-align:right;color:#808080;font-size:10px; }\
.fm-file-date { flex:1.2;text-align:right;color:#808080;font-size:9px;white-space:nowrap; }\
.fm-file-actions { flex:0;display:flex;gap:2px;flex-shrink:0; }\
.fm-btn { width:22px;height:20px;font-size:12px;cursor:pointer;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080;background:#c0c0c0;display:flex;align-items:center;justify-content:center;padding:0;line-height:1; }\
.fm-btn:active { border-top:1px solid #808080;border-left:1px solid #808080;border-right:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf; }\
.fm-btn-dl:hover { background:#aaddff; }\
.fm-btn-del:hover { background:#ffaaaa; }\
/* Image Preview */\
.fm-preview-overlay { position:absolute;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:150; }\
.fm-preview-box { background:#c0c0c0;border-top:2px solid #dfdfdf;border-left:2px solid #dfdfdf;border-right:2px solid #808080;border-bottom:2px solid #808080;padding:6px;max-width:90%;max-height:90%;display:flex;flex-direction:column; }\
.fm-preview-header { display:flex;align-items:center;justify-content:space-between;padding:2px 6px;font-size:11px;font-weight:bold;margin-bottom:4px; }\
.fm-preview-header button { font-size:11px;padding:2px 10px;cursor:pointer;font-family:inherit;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080; }\
.fm-preview-body { flex:1;overflow:auto;background:#fff;border:1px solid #808080;border-right-color:#dfdfdf;border-bottom-color:#dfdfdf;padding:4px;display:flex;align-items:center;justify-content:center;min-width:200px;min-height:120px; }\
</style>\
<div class="fm-toolbar">\
    <span style="font-size:11px;font-weight:bold;white-space:nowrap;">&#128451; Files</span>\
    <span class="fm-path" style="display:none;">/</span>\
    <button class="fm-btn-refresh" title="Refresh">Refresh</button>\
    <button class="fm-btn-delete-all" title="Delete all files" style="color:#d12e7a;">Clear All</button>\
</div>\
<div class="fm-file-list"></div>\
<div class="fm-status-bar">\
    <span class="fm-status">Ready</span>\
    <span style="color:#808080;">ciao os File System</span>\
</div>';
    }

    return { open: open };
})();

/* ===== 俏也 OS — Paint App ===== */

var OSO_Paint = (function() {
    'use strict';

    var currentTool = 'pencil';
    var currentColor = '#000000';
    var brushSize = 2;
    var isDrawing = false;
    var undoStack = [];
    var redoStack = [];

    function open() {
        if (OSO.WM.get('paint')) {
            OSO.WM.focus(OSO.WM.get('paint'));
            return;
        }

        var container = document.createElement('div');
        container.style.cssText = 'display:flex;flex-direction:column;height:100%;overflow:hidden;';

        container.innerHTML = getPaintHTML();
        var win = OSO.WM.create('paint', 'untitled - Paint', 'assets/icons/image-4.png', container, {
            width: 600, height: 460, minWidth: 400, minHeight: 300
        });

        var canvas = container.querySelector('#paint-canvas');
        var ctx = canvas.getContext('2d');

        // Initialize canvas
        canvas.width = canvas.parentElement.clientWidth - 2;
        canvas.height = canvas.parentElement.clientHeight - 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        saveUndoState();

        // Tool selection
        container.querySelectorAll('.paint-tool-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                container.querySelectorAll('.paint-tool-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentTool = btn.dataset.tool;
                setCursor(canvas);
            });
        });

        // Color selection
        container.querySelectorAll('.paint-color-box').forEach(function(box) {
            box.addEventListener('click', function() {
                currentColor = box.dataset.color;
                container.querySelector('.paint-current-color').style.background = currentColor;
            });
        });

        // Brush size
        container.querySelector('#paint-brush-size').addEventListener('input', function() {
            brushSize = parseInt(this.value);
        });

        // Drawing events
        var startX, startY, snapshot;

        function syncCanvas() {
            var parent = canvas.parentElement;
            var w = parent.clientWidth - 4;
            var h = parent.clientHeight - 4;
            if (w < 100) w = 100;
            if (h < 100) h = 100;
            if (canvas.width === w && canvas.height === h) return;
            var oldData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            canvas.width = w;
            canvas.height = h;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.putImageData(oldData, 0, 0, 0, 0, Math.min(oldData.width, w), Math.min(oldData.height, h));
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            saveUndoState();
        }

        function getPos(e) {
            var rect = canvas.getBoundingClientRect();
            var scaleX = canvas.width / rect.width;
            var scaleY = canvas.height / rect.height;
            return {
                x: ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left) * scaleX,
                y: ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top) * scaleY
            };
        }

        new ResizeObserver(function() { syncCanvas(); }).observe(canvas.parentElement);

        canvas.addEventListener('mousedown', function(e) {
            isDrawing = true;
            var pos = getPos(e);
            startX = pos.x; startY = pos.y;

            if (currentTool === 'fill') {
                floodFill(ctx, Math.floor(pos.x), Math.floor(pos.y), hexToRgb(currentColor));
                saveUndoState();
                isDrawing = false;
                win.setStatus('填充完成');
                return;
            }

            snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        });

        canvas.addEventListener('mousemove', function(e) {
            if (!isDrawing) return;
            var pos = getPos(e);

            if (currentTool === 'eraser') {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = brushSize * 3;
            } else {
                ctx.strokeStyle = currentColor;
                ctx.lineWidth = brushSize;
            }

            if (currentTool === 'line' || currentTool === 'rect' || currentTool === 'circle') {
                ctx.putImageData(snapshot, 0, 0);
                ctx.beginPath();
                if (currentTool === 'rect') {
                    ctx.rect(startX, startY, pos.x - startX, pos.y - startY);
                } else if (currentTool === 'circle') {
                    var rx = (pos.x - startX) / 2;
                    var ry = (pos.y - startY) / 2;
                    ctx.ellipse(startX + rx, startY + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
                } else {
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(pos.x, pos.y);
                }
                ctx.stroke();
            } else {
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }
        });

        canvas.addEventListener('mouseup', function() {
            if (isDrawing) {
                isDrawing = false;
                ctx.closePath();
                saveUndoState();
            }
        });

        canvas.addEventListener('mouseleave', function() {
            if (isDrawing) {
                isDrawing = false;
                ctx.closePath();
                saveUndoState();
            }
        });

        // Touch support
        canvas.addEventListener('touchstart', function(e) { e.preventDefault(); canvas.dispatchEvent(new MouseEvent('mousedown', {clientX: e.touches[0].clientX, clientY: e.touches[0].clientY})); });
        canvas.addEventListener('touchmove', function(e) { e.preventDefault(); canvas.dispatchEvent(new MouseEvent('mousemove', {clientX: e.touches[0].clientX, clientY: e.touches[0].clientY})); });
        canvas.addEventListener('touchend', function(e) { e.preventDefault(); canvas.dispatchEvent(new MouseEvent('mouseup')); });

        // Buttons
        container.querySelector('#paint-clear').addEventListener('click', function() {
            if (confirm('确定清空画布？')) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                saveUndoState();
                win.setStatus('画布已清空');
            }
        });

        container.querySelector('#paint-undo').addEventListener('click', function() {
            if (undoStack.length > 1) {
                redoStack.push(undoStack.pop());
                var state = undoStack[undoStack.length - 1];
                ctx.putImageData(state, 0, 0);
                win.setStatus('撤销');
            }
        });

        container.querySelector('#paint-redo').addEventListener('click', function() {
            if (redoStack.length > 0) {
                var state = redoStack.pop();
                undoStack.push(state);
                ctx.putImageData(state, 0, 0);
                win.setStatus('重做');
            }
        });

        container.querySelector('#paint-save-db').addEventListener('click', function() {
            canvas.toBlob(function(blob) {
                var name = 'painting-' + Date.now() + '.png';
                OSO.FS.save('/paintings/' + name, blob, 'blob').then(function() {
                    win.setStatus('已保存到本地: ' + name);
                });
            });
        });

        container.querySelector('#paint-export').addEventListener('click', function() {
            var link = document.createElement('a');
            link.download = 'painting-' + Date.now() + '.png';
            link.href = canvas.toDataURL();
            link.click();
            win.setStatus('已导出 PNG');
        });

        // Set initial tool
        container.querySelector('.paint-tool-btn[data-tool="pencil"]').classList.add('active');
        setCursor(canvas);
        win.setStatus('Tools: 铅笔 橡皮 直线 矩形 圆形 填充 | 撤销 重做');
    }

    function saveUndoState() {
        var canvas = document.querySelector('#paint-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (undoStack.length > 30) undoStack.shift();
        redoStack = [];
    }

    function setCursor(canvas) {
        var cursors = { pencil:'crosshair', eraser:'cell', line:'crosshair', rect:'crosshair', circle:'crosshair', fill:'crosshair' };
        canvas.style.cursor = cursors[currentTool] || 'crosshair';
    }

    function hexToRgb(hex) {
        hex = hex.replace('#','');
        return {
            r: parseInt(hex.substring(0,2), 16),
            g: parseInt(hex.substring(2,4), 16),
            b: parseInt(hex.substring(4,6), 16)
        };
    }

    function floodFill(ctx, x, y, fillColor) {
        var imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        var data = imageData.data;
        var w = ctx.canvas.width;
        var h = ctx.canvas.height;
        var startIdx = (y * w + x) * 4;
        var startR = data[startIdx], startG = data[startIdx+1], startB = data[startIdx+2];

        if (startR === fillColor.r && startG === fillColor.g && startB === fillColor.b) return;

        var stack = [[x, y]];
        while (stack.length > 0) {
            var p = stack.pop();
            var px = p[0], py = p[1];
            if (px < 0 || px >= w || py < 0 || py >= h) continue;
            var idx = (py * w + px) * 4;
            if (data[idx] !== startR || data[idx+1] !== startG || data[idx+2] !== startB) continue;

            data[idx] = fillColor.r; data[idx+1] = fillColor.g; data[idx+2] = fillColor.b; data[idx+3] = 255;

            stack.push([px+1, py], [px-1, py], [px, py+1], [px, py-1]);
        }

        ctx.putImageData(imageData, 0, 0);
    }

    function getPaintHTML() {
        var colors = ['#000000','#808080','#c0c0c0','#ffffff','#800000','#ff0000','#808000','#ffff00',
                      '#008000','#00ff00','#008080','#00ffff','#000080','#0000ff','#800080','#ff00ff',
                      '#804000','#ff8800','#ffb8d9','#d12e7a','#5e2ca5','#8a41ff','#73d4ff','#7d5fff'];

        var html = '<div style="display:flex;height:100%;">';
        html += '<div class="paint-toolbar" style="width:50px;background:#c0c0c0;border-right:1px solid #808080;display:flex;flex-direction:column;gap:2px;padding:4px;">';
        var tools = [
            {id:'pencil', icon:'✏', title:'铅笔'},
            {id:'eraser', icon:'⬜', title:'橡皮'},
            {id:'line', icon:'╱', title:'直线'},
            {id:'rect', icon:'▭', title:'矩形'},
            {id:'circle', icon:'○', title:'圆形'},
            {id:'fill', icon:'🪣', title:'填充'}
        ];
        tools.forEach(function(t) {
            html += '<button class="paint-tool-btn" data-tool="'+t.id+'" title="'+t.title+'" ';
            html += 'style="width:40px;height:32px;font-size:16px;cursor:pointer;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080;">';
            html += t.icon + '</button>';
        });
        html += '</div>';

        html += '<div style="flex:1;display:flex;flex-direction:column;">';
        html += '<div style="flex:1;margin:2px;background:#fff;border:1px solid #808080;border-right-color:#dfdfdf;border-bottom-color:#dfdfdf;overflow:hidden;position:relative;">';
        html += '<canvas id="paint-canvas" style="width:100%;height:100%;display:block;"></canvas></div>';
        html += '<div style="display:flex;align-items:center;gap:6px;padding:4px;background:#c0c0c0;border-top:1px solid #808080;flex-wrap:wrap;">';

        // Color boxes
        html += '<div style="display:flex;flex-wrap:wrap;gap:2px;max-width:300px;">';
        colors.forEach(function(c) {
            html += '<div class="paint-color-box" data-color="'+c+'" style="width:16px;height:16px;background:'+c+';border:1px solid #808080;cursor:pointer;"></div>';
        });
        html += '</div>';

        // Current color
        html += '<div class="paint-current-color" style="width:24px;height:24px;background:#000;border:1px solid #808080;border-right-color:#dfdfdf;border-bottom-color:#dfdfdf;"></div>';

        // Brush size
        html += '<span style="font-size:10px;">Size:</span>';
        html += '<input id="paint-brush-size" type="range" min="1" max="20" value="2" style="width:60px;">';

        // Action buttons
        html += '<button id="paint-undo" style="font-size:10px;padding:2px 6px;font-family:inherit;cursor:pointer;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080;">撤销</button>';
        html += '<button id="paint-redo" style="font-size:10px;padding:2px 6px;font-family:inherit;cursor:pointer;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080;">重做</button>';
        html += '<button id="paint-clear" style="font-size:10px;padding:2px 6px;font-family:inherit;cursor:pointer;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080;">清空</button>';
        html += '<button id="paint-save-db" style="font-size:10px;padding:2px 6px;font-family:inherit;cursor:pointer;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080;">保存</button>';
        html += '<button id="paint-export" style="font-size:10px;padding:2px 6px;font-family:inherit;cursor:pointer;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080;">导出PNG</button>';

        html += '</div></div></div>';

        html += '<style>.paint-tool-btn.active{background:#000080!important;color:#fff;}</style>';
        return html;
    }

    return { open: open };
})();

/* ===== 俏也 OS — Minesweeper ===== */

var OSO_Minesweeper = (function() {
    'use strict';

    var rows, cols, mines, board, revealed, flagged, gameOver, started;
    var DIFFICULTY = {
        easy: {rows:9, cols:9, mines:10},
        medium: {rows:16, cols:16, mines:40},
        hard: {rows:16, cols:30, mines:99}
    };
    var isFlagMode = false;
    var currentDifficulty = 'easy';

    function open() {
        if (OSO.WM.get('minesweeper')) {
            OSO.WM.focus(OSO.WM.get('minesweeper'));
            return;
        }

        var container = document.createElement('div');
        container.style.cssText = 'height:100%;overflow:auto;background:#c0c0c0;padding:8px;';
        container.innerHTML = getHTML();

        var win = OSO.WM.create('minesweeper', '扫雷', null, container, {
            width: 520, height: 520, minWidth: 300, minHeight: 300, menu: false
        });

        initGame('easy');
        renderBoard(container);

        function resizeWindow() {
            // Responsive cell size
            var isMob = window.innerWidth <= 768;
            var maxGridW = isMob ? window.innerWidth - 24 : 560;
            var cellW = Math.max(20, Math.floor((maxGridW - (cols + 1) * 2) / cols));
            var w = cols * cellW + 36;
            var h = rows * cellW + 100;
            win._el.style.width = w + 'px';
            win._el.style.height = h + 'px';
            var maxLeft = window.innerWidth - w - 20;
            var maxTop = window.innerHeight - h - 40;
            if (win._el.offsetLeft > maxLeft) win._el.style.left = maxLeft + 'px';
            if (win._el.offsetTop > maxTop) win._el.style.top = maxTop + 'px';
        }
        resizeWindow();

        container.querySelector('#mine-btn-easy').addEventListener('click', function() {
            currentDifficulty = 'easy'; initGame('easy'); renderBoard(container); resizeWindow(); win.setStatus('难度: 初级 9×9');
        });
        container.querySelector('#mine-btn-medium').addEventListener('click', function() {
            currentDifficulty = 'medium'; initGame('medium'); renderBoard(container); resizeWindow(); win.setStatus('难度: 中级 16×16');
        });
        container.querySelector('#mine-btn-hard').addEventListener('click', function() {
            currentDifficulty = 'hard'; initGame('hard'); renderBoard(container); resizeWindow(); win.setStatus('难度: 高级 30×16');
        });
        container.querySelector('#mine-btn-new').addEventListener('click', function() {
            initGame(currentDifficulty); renderBoard(container); resizeWindow(); win.setStatus('新游戏');
        });
        container.querySelector('#mine-btn-flag').addEventListener('click', function() {
            isFlagMode = !isFlagMode;
            renderBoard(container);
            win.setStatus(isFlagMode ? '🚩 插旗模式 - 点击标记地雷' : '🔍 翻开模式 - 点击翻开格子');
        });

        win.setStatus('左键翻开 · 右键标记 · 难度: 初级');
    }

    function initGame(diff) {
        var d = DIFFICULTY[diff];
        rows = d.rows; cols = d.cols; mines = d.mines;
        board = [];
        revealed = [];
        flagged = [];
        started = false;
        gameOver = false;

        for (var r = 0; r < rows; r++) {
            board[r] = Array(cols).fill(0);
            revealed[r] = Array(cols).fill(false);
            flagged[r] = Array(cols).fill(false);
        }
    }

    function placeMines(safeR, safeC) {
        var placed = 0;
        while (placed < mines) {
            var r = Math.floor(Math.random() * rows);
            var c = Math.floor(Math.random() * cols);
            if (board[r][c] !== -1 && !(Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1)) {
                board[r][c] = -1;
                placed++;
                for (var dr = -1; dr <= 1; dr++)
                    for (var dc = -1; dc <= 1; dc++) {
                        var nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] !== -1)
                            board[nr][nc]++;
                    }
            }
        }
    }

    function reveal(r, c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return;
        if (revealed[r][c] || flagged[r][c]) return;

        if (!started) {
            started = true;
            placeMines(r, c);
        }

        revealed[r][c] = true;

        if (board[r][c] === -1) {
            gameOver = true;
            revealAll();
            return;
        }

        if (board[r][c] === 0) {
            for (var dr = -1; dr <= 1; dr++)
                for (var dc = -1; dc <= 1; dc++)
                    reveal(r + dr, c + dc);
        }
    }

    function revealAll() {
        for (var r = 0; r < rows; r++)
            for (var c = 0; c < cols; c++)
                if (board[r][c] === -1) revealed[r][c] = true;
    }

    function checkWin() {
        for (var r = 0; r < rows; r++)
            for (var c = 0; c < cols; c++)
                if (!revealed[r][c] && board[r][c] !== -1) return false;
        return true;
    }

    function renderBoard(container) {
        var gridEl = container.querySelector('#mine-grid');
        var statusEl = container.querySelector('#mine-status');
        var flagBtn = container.querySelector('#mine-btn-flag');
        if (!gridEl) return;

        var mineCount = mines;
        for (var r = 0; r < rows; r++)
            for (var c = 0; c < cols; c++)
                if (flagged[r][c]) mineCount--;
        container.querySelector('#mine-count').textContent = mineCount;

        // Update flag mode button appearance
        if (flagBtn) {
            flagBtn.textContent = isFlagMode ? '🚩插旗中' : '🔍翻开';
            flagBtn.style.background = isFlagMode ? '#ffaa00' : '#c0c0c0';
        }

        gridEl.innerHTML = '';

        // Responsive cell size: fit within container, min 20px
        var containerW = Math.min(container.offsetWidth - 16, window.innerWidth - 32, cols === 30 ? 620 : 400);
        var cellSize = Math.max(20, Math.floor((containerW - (cols + 1) * 2) / cols));
        gridEl.style.gridTemplateColumns = 'repeat(' + cols + ', ' + cellSize + 'px)';
        gridEl.style.gridTemplateRows = 'repeat(' + rows + ', ' + cellSize + 'px)';

        var digitColors = ['','#0000ff','#008000','#ff0000','#000080','#800000','#008080','#000000','#808080'];

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                (function(rr, cc) {
                    var cell = document.createElement('div');
                    cell.style.cssText = 'width:' + cellSize + 'px;height:' + cellSize + 'px;font-size:' + Math.max(8, cellSize * 0.55) + 'px;display:flex;align-items:center;justify-content:center;cursor:pointer;line-height:1;overflow:hidden;';

                    if (revealed[rr][cc]) {
                        if (board[rr][cc] === -1) {
                            cell.style.background = '#ff4444';
                            cell.textContent = '💣';
                        } else {
                            cell.style.background = '#ddd';
                            cell.style.border = '1px solid #bbb';
                            if (board[rr][cc] > 0) {
                                cell.textContent = board[rr][cc];
                                cell.style.color = digitColors[board[rr][cc]] || '#000';
                                cell.style.fontWeight = 'bold';
                            }
                        }
                    } else {
                        cell.className = 'win-outset';
                        if (flagged[rr][cc]) cell.textContent = '🚩';
                    }

                    cell.addEventListener('click', function() {
                        if (gameOver) return;
                        if (isFlagMode) {
                            // Flag mode: toggle flag
                            if (!revealed[rr][cc]) {
                                flagged[rr][cc] = !flagged[rr][cc];
                                renderBoard(container);
                            }
                        } else {
                            if (!flagged[rr][cc]) {
                                reveal(rr, cc);
                                if (checkWin() && !gameOver) {
                                    gameOver = true;
                                    if (statusEl) statusEl.textContent = '🎉 你赢了!';
                                }
                                renderBoard(container);
                            }
                        }
                    });

                    // Long-press always flags (works on desktop right-click and mobile long-press)
                    cell.addEventListener('contextmenu', function(e) {
                        e.preventDefault();
                        if (gameOver || revealed[rr][cc]) return;
                        flagged[rr][cc] = !flagged[rr][cc];
                        renderBoard(container);
                    });

                    gridEl.appendChild(cell);
                })(r, c);
            }
        }

        if (gameOver) {
            if (statusEl) {
                var lost = false;
                for (var r2 = 0; r2 < rows; r2++)
                    for (var c2 = 0; c2 < cols; c2++)
                        if (board[r2][c2] === -1 && revealed[r2][c2]) lost = true;
                statusEl.textContent = lost ? '💥 踩雷了!' : '🎉 你赢了!';
            }
        }
    }

    function getHTML() {
        return '\
<style>\
.mine-toolbar { display:flex;align-items:center;gap:6px;margin-bottom:8px; }\
.mine-toolbar button { font-size:10px;padding:2px 8px;cursor:pointer;font-family:inherit;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080; }\
.mine-toolbar button:active { border-top:1px solid #808080;border-left:1px solid #808080;border-right:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf; }\
#mine-grid { display:grid;gap:0px;background:#808080;padding:2px; }\
#mine-status { font-size:11px;margin-top:6px;text-align:center;color:#000; }\
</style>\
<div class="mine-toolbar">\
    <span style="font-size:11px;font-weight:bold;">💣 <span id="mine-count">10</span></span>\
    <button id="mine-btn-easy">初级</button>\
    <button id="mine-btn-medium">中级</button>\
    <button id="mine-btn-hard">高级</button>\
    <span style="flex:1;"></span>\
    <button id="mine-btn-flag">🔍翻开</button>\
    <button id="mine-btn-new">新游戏</button>\
</div>\
<div id="mine-grid"></div>\
<div id="mine-status"></div>\
<div style="font-size:9px;color:#666;text-align:center;margin-top:4px;">左键翻开 · 右键插旗</div>';
    }

    return { open: open };
})();

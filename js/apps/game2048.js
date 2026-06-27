/* ===== 俏也 OS — 2048 Game ===== */

var OSO_Game2048 = (function() {
    'use strict';

    var grid, score, gameOver;

    function open() {
        if (OSO.WM.get('2048')) {
            OSO.WM.focus(OSO.WM.get('2048'));
            return;
        }

        var container = document.createElement('div');
        container.style.cssText = 'display:flex;flex-direction:column;align-items:center;height:100%;overflow:hidden;background:#1a1a2e;';

        var win = OSO.WM.create('2048', '2048', 'assets/icons/image-6.png', container, {
            width: 460, height: 540, minWidth: 380, minHeight: 440, menu: false
        });

        grid = Array(4).fill().map(function() { return Array(4).fill(0); });
        score = 0;
        gameOver = false;

        container.innerHTML = get2048HTML();
        addRandom(); addRandom();
        render();

        document.addEventListener('keydown', handleKey);

        // New game button
        container.querySelector('#game2048-new').addEventListener('click', function() {
            grid = Array(4).fill().map(function() { return Array(4).fill(0); });
            score = 0; gameOver = false;
            addRandom(); addRandom();
            render();
            win.setStatus('新游戏');
        });

        win.setStatus('方向键操作 | 合并相同数字到 2048');
    }

    function handleKey(e) {
        var win = OSO.WM.get('2048');
        if (!win || win !== OSO.WM.getAll().slice(-1)[0]) return;
        if (gameOver) return;

        var moved = false;
        switch(e.key) {
            case 'ArrowLeft':  moved = moveLeft(); break;
            case 'ArrowRight': moved = moveRight(); break;
            case 'ArrowUp':    moved = moveUp(); break;
            case 'ArrowDown':  moved = moveDown(); break;
            default: return;
        }

        if (moved) {
            e.preventDefault();
            addRandom();
            render();
            checkGameOver();
        }
    }

    function moveLeft() {
        var moved = false;
        for (var r = 0; r < 4; r++) {
            var row = grid[r].filter(function(v) { return v !== 0; });
            for (var i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i+1]) {
                    row[i] *= 2;
                    score += row[i];
                    row.splice(i+1, 1);
                    moved = true;
                }
            }
            while (row.length < 4) row.push(0);
            if (row.join(',') !== grid[r].join(',')) moved = true;
            grid[r] = row;
        }
        return moved;
    }

    function moveRight() {
        var moved = false;
        for (var r = 0; r < 4; r++) {
            var row = grid[r].filter(function(v) { return v !== 0; });
            for (var i = row.length - 1; i > 0; i--) {
                if (row[i] === row[i-1]) {
                    row[i] *= 2;
                    score += row[i];
                    row.splice(i-1, 1);
                    i--;
                    moved = true;
                }
            }
            while (row.length < 4) row.unshift(0);
            if (row.join(',') !== grid[r].join(',')) moved = true;
            grid[r] = row;
        }
        return moved;
    }

    function moveUp() {
        var moved = false;
        for (var c = 0; c < 4; c++) {
            var col = [];
            for (var r = 0; r < 4; r++) if (grid[r][c] !== 0) col.push(grid[r][c]);
            for (var i = 0; i < col.length - 1; i++) {
                if (col[i] === col[i+1]) {
                    col[i] *= 2;
                    score += col[i];
                    col.splice(i+1, 1);
                    moved = true;
                }
            }
            while (col.length < 4) col.push(0);
            for (var r2 = 0; r2 < 4; r2++) {
                if (grid[r2][c] !== col[r2]) moved = true;
                grid[r2][c] = col[r2];
            }
        }
        return moved;
    }

    function moveDown() {
        var moved = false;
        for (var c = 0; c < 4; c++) {
            var col = [];
            for (var r = 0; r < 4; r++) if (grid[r][c] !== 0) col.push(grid[r][c]);
            for (var i = col.length - 1; i > 0; i--) {
                if (col[i] === col[i-1]) {
                    col[i] *= 2;
                    score += col[i];
                    col.splice(i-1, 1);
                    i--;
                    moved = true;
                }
            }
            while (col.length < 4) col.unshift(0);
            for (var r2 = 0; r2 < 4; r2++) {
                if (grid[r2][c] !== col[r2]) moved = true;
                grid[r2][c] = col[r2];
            }
        }
        return moved;
    }

    function addRandom() {
        var empty = [];
        for (var r = 0; r < 4; r++)
            for (var c = 0; c < 4; c++)
                if (grid[r][c] === 0) empty.push([r, c]);
        if (empty.length === 0) return;
        var pos = empty[Math.floor(Math.random() * empty.length)];
        grid[pos[0]][pos[1]] = Math.random() < 0.9 ? 2 : 4;
    }

    function checkGameOver() {
        var cont = document.querySelector('#game2048-container');
        if (!cont) return;
        for (var r = 0; r < 4; r++)
            for (var c = 0; c < 4; c++)
                if (grid[r][c] === 0) return;
        for (var r = 0; r < 4; r++)
            for (var c = 0; c < 4; c++) {
                if (c < 3 && grid[r][c] === grid[r][c+1]) return;
                if (r < 3 && grid[r][c] === grid[r+1][c]) return;
            }
        gameOver = true;
        cont.querySelector('.game2048-overlay').style.display = 'flex';
    }

    function render() {
        var cont = document.querySelector('#game2048-container');
        var scoreEl = document.querySelector('#game2048-score');
        if (!cont || !scoreEl) return;
        scoreEl.textContent = score;

        var gridEl = cont.querySelector('.game2048-grid');
        gridEl.innerHTML = '';

        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 4; c++) {
                var cell = document.createElement('div');
                cell.className = 'game2048-cell';
                var v = grid[r][c];
                cell.textContent = v || '';
                cell.style.background = getTileColor(v);
                cell.style.color = v > 4 ? '#fff' : '#776e65';
                cell.style.fontSize = v >= 1024 ? '22px' : v >= 128 ? '26px' : '30px';
                gridEl.appendChild(cell);
            }
        }
    }

    function getTileColor(v) {
        var colors = {
            0: '#2a2a4a', 2: '#3d3d6e', 4: '#5e2ca5', 8: '#7d5fff',
            16: '#8a41ff', 32: '#9d81ff', 64: '#b89eff', 128: '#73d4ff',
            256: '#5de3ff', 512: '#ffb8d9', 1024: '#ff88b7', 2048: '#ff55cc'
        };
        return colors[v] || '#ffee55';
    }

    function get2048HTML() {
        return '\
<style>\
#game2048-container { position:relative; width:340px; margin:12px auto; }\
.game2048-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:8px; }\
.game2048-title { font-size:28px;font-weight:bold;color:#b89eff; }\
.game2048-scores { display:flex;gap:4px; }\
.game2048-score-box { background:#2a2a4a;color:#fff;padding:4px 12px;border-radius:4px;text-align:center;border:1px solid #5e2ca5; }\
.game2048-score-label { font-size:9px;text-transform:uppercase; }\
.game2048-score-val { font-size:16px;font-weight:bold; }\
.game2048-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:#2a2a4a;padding:8px;border-radius:6px; }\
.game2048-cell { aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:30px;border-radius:4px;transition:all 0.1s; }\
.game2048-overlay { position:absolute;inset:0;background:rgba(26,26,46,0.85);display:flex;align-items:center;justify-content:center;border-radius:6px;display:none;flex-direction:column; }\
.game2048-overlay-text { font-size:28px;font-weight:bold;color:#b89eff;margin-bottom:12px; }\
#game2048-new { padding:8px 20px;font-size:13px;font-weight:bold;cursor:pointer;background:#5e2ca5;color:#fff;border:none;border-radius:4px;font-family:inherit; }\
#game2048-new:hover { background:#8a41ff; }\
</style>\
<div id="game2048-container">\
    <div class="game2048-header">\
        <div class="game2048-title">2048</div>\
        <div class="game2048-scores">\
            <div class="game2048-score-box">\
                <div class="game2048-score-label">分数</div>\
                <div class="game2048-score-val" id="game2048-score">0</div>\
            </div>\
        </div>\
    </div>\
    <div class="game2048-grid"></div>\
    <div class="game2048-overlay">\
        <div class="game2048-overlay-text">Game Over!</div>\
    </div>\
</div>\
<div style="text-align:center;margin-top:8px;">\
    <button id="game2048-new">新游戏</button>\
    <div style="font-size:10px;color:#999;margin-top:4px;">方向键操作</div>\
</div>';
    }

    return { open: open };
})();

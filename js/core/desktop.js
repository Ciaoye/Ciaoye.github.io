/* ===== 俏也 OS — Desktop ===== */

OSO.Desktop = (function() {
    'use strict';

    const appRegistry = [];
    let selectedIcon = null;

    function init() {
        renderIcons();
        document.addEventListener('click', function(e) {
            if (selectedIcon && !e.target.closest('.oso-desktop-icon')) {
                deselectAll();
            }
        });
    }

    function registerApp(id, name, icon, actionFn, menuName, tooltip) {
        appRegistry.push({
            id: id,
            name: name,
            icon: icon,
            action: actionFn,
            menuName: menuName || name,
            tooltip: tooltip || ''
        });
    }

    function renderIcons() {
        const grid = document.getElementById('oso-desktop-icons');
        if (!grid) return;

        grid.innerHTML = '';

        // Load saved positions or use 2-column layout
        var savedPos = {};
        try {
            savedPos = JSON.parse(localStorage.getItem('oso_icon_pos') || '{}');
        } catch(e) {}

        var colW = 88, rowH = 88;
        var startX = 12, startY = 12;

        appRegistry.forEach(function(app, i) {
            const iconEl = document.createElement('div');
            iconEl.className = 'oso-desktop-icon';
            iconEl.title = app.name;
            iconEl.dataset.appId = app.id;

            // Position: saved or 2-column grid
            var pos = savedPos[app.id];
            if (pos) {
                iconEl.style.left = pos.x + 'px';
                iconEl.style.top = pos.y + 'px';
            } else {
                var col = i % 2;
                var row = Math.floor(i / 2);
                iconEl.style.left = (startX + col * colW) + 'px';
                iconEl.style.top = (startY + row * rowH) + 'px';
            }

            const img = document.createElement('img');
            img.src = app.icon;
            img.alt = app.name;
            img.draggable = false;

            const span = document.createElement('span');
            span.textContent = app.name;

            iconEl.appendChild(img);
            iconEl.appendChild(span);

            // Tooltip
            if (app.tooltip) {
                var tip = document.createElement('div');
                tip.className = 'oso-icon-tooltip';
                tip.textContent = app.tooltip;
                iconEl.appendChild(tip);
            }

            iconEl.addEventListener('click', function(e) {
                selectIcon(iconEl);
            });

            iconEl.addEventListener('dblclick', function() {
                deselectAll();
                if (app.action) app.action();
            });

            // Drag support
            iconEl.addEventListener('mousedown', function(e) {
                if (e.button !== 0) return;
                e.preventDefault();
                var startX = e.clientX;
                var startY = e.clientY;
                var origLeft = parseInt(iconEl.style.left) || 0;
                var origTop = parseInt(iconEl.style.top) || 0;
                var dragged = false;

                function onMove(ev) {
                    var dx = ev.clientX - startX;
                    var dy = ev.clientY - startY;
                    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragged = true;
                    if (!dragged) return;
                    iconEl.classList.add('dragging');
                    iconEl.style.left = Math.max(0, origLeft + dx) + 'px';
                    iconEl.style.top = Math.max(0, origTop + dy) + 'px';
                }

                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    iconEl.classList.remove('dragging');
                    if (dragged) {
                        savePositions();
                    }
                }

                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });

            grid.appendChild(iconEl);
        });

        renderStartMenu();
    }

    function savePositions() {
        var pos = {};
        document.querySelectorAll('.oso-desktop-icon').forEach(function(el) {
            pos[el.dataset.appId] = {
                x: parseInt(el.style.left) || 0,
                y: parseInt(el.style.top) || 0
            };
        });
        localStorage.setItem('oso_icon_pos', JSON.stringify(pos));
    }

    function renderStartMenu() {
        const menu = document.getElementById('oso-start-menu-items');
        if (!menu) return;

        menu.innerHTML = '';
        appRegistry.forEach(function(app, i) {
            if (i > 0 && i % 8 === 0) {
                const divider = document.createElement('div');
                divider.className = 'oso-start-menu-divider';
                menu.appendChild(divider);
            }

            const item = document.createElement('div');
            item.className = 'oso-start-menu-item';

            const img = document.createElement('img');
            img.src = app.icon;
            img.alt = '';
            img.className = 'pixel-art';

            const span = document.createElement('span');
            span.textContent = app.menuName || app.name;

            item.appendChild(img);
            item.appendChild(span);

            item.addEventListener('click', function() {
                OSO.Taskbar.closeStartMenu();
                if (app.action) app.action();
            });

            menu.appendChild(item);
        });
    }

    function selectIcon(el) {
        deselectAll();
        el.classList.add('selected');
        selectedIcon = el;
    }

    function deselectAll() {
        document.querySelectorAll('.oso-desktop-icon').forEach(function(icon) {
            icon.classList.remove('selected');
        });
        selectedIcon = null;
    }

    function refresh() {
        renderIcons();
    }

    return {
        init: init,
        register: registerApp,
        refresh: refresh
    };
})();

window.OSO = OSO;

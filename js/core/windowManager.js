/* ===== 俏也 OS — Window Manager ===== */

const OSO = window.OSO || {};
OSO.Mobile = OSO.Mobile || (function() {
    'use strict';

    const query = window.matchMedia('(max-width: 768px)');

    function isMobile() {
        return query.matches;
    }

    function syncClass() {
        document.body.classList.toggle('oso-mobile', isMobile());
    }

    function init() {
        syncClass();
        if (query.addEventListener) {
            query.addEventListener('change', syncClass);
        } else if (query.addListener) {
            query.addListener(syncClass);
        }
    }

    return {
        init: init,
        isMobile: isMobile
    };
})();
OSO.Mobile.init();

OSO.WM = (function() {
    'use strict';

    let zIndexCounter = 100;
    let windowCount = 0;
    const instances = [];
    const callbacks = {
        onOpen: [],
        onClose: [],
        onFocus: []
    };

    function nextZIndex() {
        return ++zIndexCounter;
    }

    function setMaxZ(win) {
        win._el.style.zIndex = nextZIndex();
    }

    function cascadePosition() {
        const offset = windowCount * 28;
        return {
            x: 40 + offset % 400,
            y: 40 + offset % 300
        };
    }

    function isMobileMode() {
        return OSO.Mobile && OSO.Mobile.isMobile();
    }

    function mobileHeightCSS() {
        return 'calc(100dvh - var(--oso-taskbar-height, 28px))';
    }

    function applyMobileLayout(win) {
        if (!isMobileMode()) return;
        win._el.classList.add('oso-mobile-window');
        win._el.style.left = '0';
        win._el.style.top = '0';
        win._el.style.width = '100vw';
        win._el.style.height = mobileHeightCSS();
        win._maximized = true;
    }

    function createWindow(id, title, icon, content, options) {
        options = options || {};
        const mobile = isMobileMode();
        const pos = mobile ? { x: 0, y: 0 } : (options.position || cascadePosition());
        const w = mobile ? '100vw' : (options.width || 480);
        const h = mobile ? mobileHeightCSS() : (options.height || 380);
        const minW = options.minWidth || 280;
        const minH = options.minHeight || 140;
        const showMenu = options.menu === true;

        const el = document.createElement('div');
        el.className = 'oso-window win-outset animating' + (mobile ? ' oso-mobile-window' : '');

        el.style.left = pos.x + 'px';
        el.style.top = pos.y + 'px';
        el.style.width = typeof w === 'number' ? w + 'px' : w;
        el.style.height = typeof h === 'number' ? h + 'px' : h;
        el.style.zIndex = nextZIndex();

        const iconHTML = icon
            ? `<img class="oso-window-title-icon pixel-art" src="${icon}" alt=""/>`
            : '';

        const menuHTML = showMenu ? `
            <div class="oso-window-menu">
                <span>File</span><span>Edit</span><span>View</span><span>Help</span>
            </div>` : '';

        el.innerHTML = `
            <div class="oso-window-titlebar">
                <div class="oso-window-title-left">
                    ${iconHTML}<span class="oso-window-title-text">${escapeHTML(title)}</span>
                </div>
                <div class="oso-window-title-controls">
                    <div class="win-button oso-btn-minimize" title="Minimize">─</div>
                    <div class="win-button oso-btn-maximize" title="Maximize">□</div>
                    <div class="win-button oso-btn-close" title="Close">✕</div>
                </div>
            </div>
            ${menuHTML}
            <div class="oso-window-body"></div>
            <div class="oso-window-statusbar">
                <span class="statusbar-section">Ready</span>
            </div>
            <div class="oso-window-resize oso-window-resize-n"></div>
            <div class="oso-window-resize oso-window-resize-s"></div>
            <div class="oso-window-resize oso-window-resize-e"></div>
            <div class="oso-window-resize oso-window-resize-w"></div>
            <div class="oso-window-resize oso-window-resize-ne"></div>
            <div class="oso-window-resize oso-window-resize-nw"></div>
            <div class="oso-window-resize oso-window-resize-se"></div>
            <div class="oso-window-resize oso-window-resize-sw"></div>
        `;

        const bodyEl = el.querySelector('.oso-window-body');
        if (typeof content === 'string') {
            bodyEl.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            bodyEl.appendChild(content);
        }

        const win = {
            id: id,
            title: title,
            icon: icon,
            _el: el,
            _body: bodyEl,
            _minimized: false,
            _maximized: mobile,
            _prevState: null,
            _options: options,
            getBody: function() { return bodyEl; },
            getElement: function() { return el; },
            setContent: function(c) {
                bodyEl.innerHTML = '';
                if (typeof c === 'string') bodyEl.innerHTML = c;
                else if (c instanceof HTMLElement) bodyEl.appendChild(c);
            },
            setStatus: function(text) {
                const sb = el.querySelector('.statusbar-section');
                if (sb) sb.textContent = text;
            },
            focus: function() { focusWindow(win); },
            close: function() { closeWindow(win); },
            minimize: function() { minimizeWindow(win); },
            maximize: function() { maximizeWindow(win); },
            setTitle: function(t) {
                win.title = t;
                const titleEl = el.querySelector('.oso-window-title-text');
                if (titleEl) titleEl.textContent = t;
            }
        };

        document.getElementById('oso-desktop').appendChild(el);

        setTimeout(function() {
            el.classList.remove('animating');
        }, 150);

        attachWindowEvents(win);
        applyMobileLayout(win);
        focusWindow(win);
        windowCount++;
        instances.push(win);

        if (callbacks.onOpen) callbacks.onOpen.forEach(function(fn) { fn(win); });
        if (OSO.Taskbar) OSO.Taskbar.refresh();

        return win;
    }

    function attachWindowEvents(win) {
        const el = win._el;
        const titlebar = el.querySelector('.oso-window-titlebar');

        // Titlebar drag
        titlebar.addEventListener('mousedown', function(e) {
            if (e.target.closest('.oso-btn-minimize, .oso-btn-maximize, .oso-btn-close')) return;
            if (isMobileMode()) return;
            if (win._maximized) return;
            e.preventDefault();

            focusWindow(win);
            const rect = el.getBoundingClientRect();
            const shiftX = e.clientX - rect.left;
            const shiftY = e.clientY - rect.top;

            function onMove(ev) {
                let newX = ev.clientX - shiftX;
                let newY = ev.clientY - shiftY;
                // Keep titlebar accessible
                newX = Math.max(-el.offsetWidth + 60, Math.min(window.innerWidth - 60, newX));
                newY = Math.max(0, Math.min(window.innerHeight - 50, newY));
                el.style.left = newX + 'px';
                el.style.top = newY + 'px';
            }

            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                saveWindowPositions();
            }

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

        titlebar.addEventListener('dblclick', function(e) {
            if (e.target.closest('.oso-btn-minimize, .oso-btn-maximize, .oso-btn-close')) return;
            if (isMobileMode()) return;
            maximizeWindow(win);
        });

        // Click to focus anywhere on window
        el.addEventListener('mousedown', function() {
            focusWindow(win);
        });

        // Buttons
        el.querySelector('.oso-btn-minimize').addEventListener('click', function(e) {
            e.stopPropagation();
            minimizeWindow(win);
        });
        el.querySelector('.oso-btn-maximize').addEventListener('click', function(e) {
            e.stopPropagation();
            maximizeWindow(win);
        });
        el.querySelector('.oso-btn-close').addEventListener('click', function(e) {
            e.stopPropagation();
            closeWindow(win);
        });

        // Resize handles
        const handles = el.querySelectorAll('.oso-window-resize');
        handles.forEach(function(handle) {
            handle.addEventListener('mousedown', function(e) {
                if (isMobileMode()) return;
                if (win._maximized) return;
                e.preventDefault();
                e.stopPropagation();

                const startX = e.clientX;
                const startY = e.clientY;
                const startW = el.offsetWidth;
                const startH = el.offsetHeight;
                const startL = el.offsetLeft;
                const startT = el.offsetTop;
                const dirN = handle.classList.contains('oso-window-resize-n') ||
                              handle.classList.contains('oso-window-resize-ne') ||
                              handle.classList.contains('oso-window-resize-nw');
                const dirS = handle.classList.contains('oso-window-resize-s') ||
                              handle.classList.contains('oso-window-resize-se') ||
                              handle.classList.contains('oso-window-resize-sw');
                const dirE = handle.classList.contains('oso-window-resize-e') ||
                              handle.classList.contains('oso-window-resize-ne') ||
                              handle.classList.contains('oso-window-resize-se');
                const dirW = handle.classList.contains('oso-window-resize-w') ||
                              handle.classList.contains('oso-window-resize-nw') ||
                              handle.classList.contains('oso-window-resize-sw');

                function onMove(ev) {
                    const dx = ev.clientX - startX;
                    const dy = ev.clientY - startY;
                    const minW = win._options.minWidth || 280;
                    const minH = win._options.minHeight || 140;

                    let newW = startW + (dirE ? dx : 0) + (dirW ? -dx : 0);
                    let newH = startH + (dirS ? dy : 0) + (dirN ? -dy : 0);
                    let newL = startL + (dirW ? dx : 0);
                    let newT = startT + (dirN ? dy : 0);

                    if (newW < minW) { newW = minW; if (dirW) newL = startL + startW - minW; }
                    if (newH < minH) { newH = minH; if (dirN) newT = startT + startH - minH; }

                    el.style.width = newW + 'px';
                    el.style.height = newH + 'px';
                    el.style.left = newL + 'px';
                    el.style.top = newT + 'px';
                }

                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                }

                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        });
    }

    function focusWindow(win) {
        setMaxZ(win);
        instances.forEach(function(w) {
            w._el.classList.toggle('inactive', w !== win);
        });
        if (win._el.classList.contains('inactive')) {
            win._el.classList.remove('inactive');
        }
        // Update taskbar
        if (OSO.Taskbar) OSO.Taskbar.setActive(win.id);
        if (callbacks.onFocus) callbacks.onFocus.forEach(function(fn) { fn(win); });
    }

    function minimizeWindow(win) {
        if (win._minimized) {
            win._el.style.display = 'flex';
            win._minimized = false;
            applyMobileLayout(win);
            focusWindow(win);
        } else {
            win._el.style.display = 'none';
            win._minimized = true;
        }
        if (OSO.Taskbar) OSO.Taskbar.refresh();
    }

    function maximizeWindow(win) {
        if (isMobileMode()) {
            applyMobileLayout(win);
            return;
        }
        if (win._maximized) {
            // Restore
            const ps = win._prevState;
            win._el.style.left = ps.left + 'px';
            win._el.style.top = ps.top + 'px';
            win._el.style.width = ps.width + 'px';
            win._el.style.height = ps.height + 'px';
            win._el.classList.remove('maximized');
            win._maximized = false;
        } else {
            // Save state
            win._prevState = {
                left: win._el.offsetLeft,
                top: win._el.offsetTop,
                width: win._el.offsetWidth,
                height: win._el.offsetHeight
            };
            win._el.style.left = '0';
            win._el.style.top = '0';
            win._el.style.width = '100vw';
            win._el.style.height = 'calc(100vh - 28px)';
            win._el.classList.add('maximized');
            win._maximized = true;
        }
    }

    function closeWindow(win) {
        if (callbacks.onClose) callbacks.onClose.forEach(function(fn) { fn(win); });
        saveWindowPositions();
        win._el.remove();
        const idx = instances.indexOf(win);
        if (idx !== -1) instances.splice(idx, 1);
        if (OSO.Taskbar) OSO.Taskbar.refresh();
    }

    function saveWindowPositions() {
        if (isMobileMode()) return;
        var pos = {};
        instances.forEach(function(win) {
            if (win._maximized || win._minimized) return;
            if (win.id === 'chat' || win.id === 'notepad') {
                pos[win.id] = {
                    x: parseInt(win._el.style.left) || 0,
                    y: parseInt(win._el.style.top) || 0
                };
            }
        });
        localStorage.setItem('oso_win_pos', JSON.stringify(pos));
    }

    function loadWindowPositions() {
        try {
            return JSON.parse(localStorage.getItem('oso_win_pos') || '{}');
        } catch(e) { return {}; }
    }

    function getWindow(id) {
        for (let i = 0; i < instances.length; i++) {
            if (instances[i].id === id) return instances[i];
        }
        return null;
    }

    function getInstances() {
        return instances.slice();
    }

    function on(event, fn) {
        if (event === 'open') callbacks.onOpen.push(fn);
        else if (event === 'close') callbacks.onClose.push(fn);
        else if (event === 'focus') callbacks.onFocus.push(fn);
    }

    window.addEventListener('resize', function() {
        if (!isMobileMode()) return;
        instances.forEach(applyMobileLayout);
    });

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Public API
    return {
        create: createWindow,
        close: closeWindow,
        minimize: minimizeWindow,
        maximize: maximizeWindow,
        focus: focusWindow,
        get: getWindow,
        getAll: getInstances,
        on: on,
        savePositions: saveWindowPositions,
        loadPositions: loadWindowPositions
    };
})();

OSO.WM = OSO.WM;
window.OSO = OSO;

/* ===== 俏也 OS — Taskbar ===== */

OSO.Taskbar = (function() {
    'use strict';

    let startMenuOpen = false;
    let activeAppId = null;
    const taskApps = [];

    function init() {
        // Start button
        const startBtn = document.getElementById('oso-start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleStartMenu();
            });
        }

        // Clock update
        updateClock();
        setInterval(updateClock, 1000);

        // Close start menu on outside click
        document.addEventListener('click', function() {
            if (startMenuOpen) closeStartMenu();
        });
    }

    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours || 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        const el = document.getElementById('oso-clock');
        if (el) el.textContent = hours + ':' + minutes + ' ' + ampm;
    }

    function toggleStartMenu() {
        const menu = document.getElementById('oso-start-menu');
        if (!menu) return;
        if (startMenuOpen) {
            closeStartMenu();
        } else {
            menu.classList.add('open');
            startMenuOpen = true;
        }
    }

    function closeStartMenu() {
        const menu = document.getElementById('oso-start-menu');
        if (menu) menu.classList.remove('open');
        startMenuOpen = false;
    }

    function setActive(appId) {
        activeAppId = appId;
        refreshApps();
    }

    function refreshApps() {
        const appsEl = document.getElementById('oso-taskbar-apps');
        if (!appsEl) return;
        appsEl.innerHTML = '';

        const instances = OSO.WM.getAll();
        instances.forEach(function(win) {
            const appEl = document.createElement('div');
            appEl.className = 'oso-taskbar-app win-outset';
            if (win.id === activeAppId && !win._minimized) {
                appEl.classList.add('active');
            }

            if (win.icon) {
                const img = document.createElement('img');
                img.src = win.icon;
                img.className = 'pixel-art';
                appEl.appendChild(img);
            }

            const span = document.createElement('span');
            span.textContent = win.title;
            appEl.appendChild(span);

            appEl.addEventListener('click', function() {
                if (win._minimized) {
                    OSO.WM.minimize(win);
                }
                OSO.WM.focus(win);
                closeStartMenu();
            });

            appsEl.appendChild(appEl);
        });
    }

    function refresh() {
        refreshApps();
    }

    return {
        init: init,
        refresh: refresh,
        setActive: setActive,
        toggleStartMenu: toggleStartMenu,
        closeStartMenu: closeStartMenu
    };
})();

window.OSO = OSO;

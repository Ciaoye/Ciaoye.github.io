/* ===== 俏也 OS — Sound Effects (Web Audio API) ===== */
OSO.Sound = (function() {
    'use strict';

    var ctx = null;
    var enabled = true;

    function getCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function playTone(freq, duration, type, vol) {
        if (!enabled) return;
        try {
            var c = getCtx();
            var osc = c.createOscillator();
            var gain = c.createGain();
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, c.currentTime);
            gain.gain.setValueAtTime(vol || 0.04, c.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start(c.currentTime);
            osc.stop(c.currentTime + duration);
        } catch(e) {}
    }

    function click() {
        playTone(1000, 0.03, 'sine', 0.04);
    }

    function openWindow() {
        playTone(520, 0.04, 'sine', 0.03);
        setTimeout(function() { playTone(780, 0.05, 'sine', 0.025); }, 40);
    }

    function closeWindow() {
        playTone(520, 0.04, 'sine', 0.03);
        setTimeout(function() { playTone(350, 0.06, 'sine', 0.025); }, 40);
    }

    function startMenu() {
        playTone(660, 0.03, 'sine', 0.03);
        setTimeout(function() { playTone(880, 0.03, 'sine', 0.025); }, 35);
    }

    function toggle() {
        enabled = !enabled;
        return enabled;
    }

    function isEnabled() {
        return enabled;
    }

    return {
        click: click,
        open: openWindow,
        close: closeWindow,
        startMenu: startMenu,
        toggle: toggle,
        enabled: isEnabled
    };
})();

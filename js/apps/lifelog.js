/* ===== Ciao OS - Lifelog ===== */

var OSO_Lifelog = (function() {
    'use strict';

    var currentTab = 'timeline';
    var currentFrame = null;
    var btnTimeline = null;
    var btnReport = null;
    var btnMood = null;

    function open() {
        if (OSO.WM.get('lifelog')) {
            OSO.WM.focus(OSO.WM.get('lifelog'));
            return;
        }

        var container = document.createElement('div');
        container.style.cssText = 'display:flex;flex-direction:column;height:100%;overflow:hidden;';
        container.innerHTML = getHTML();

        var dw = window.innerWidth, dh = window.innerHeight;
        var win = OSO.WM.create('lifelog', 'Lifelog', 'assets/icons/image-20.png', container, {
            width: dw - 4, height: dh - 40, minWidth: 520, minHeight: 400,
            position: { x: 0, y: 0 }
        });

        // Content area
        var body = document.createElement('div');
        body.style.cssText = 'flex:1;overflow:auto;padding:20px 24px;background:#f6f6f0;font-family:Georgia,"Times New Roman",serif;font-size:14px;line-height:1.7;color:#202122;';
        container.appendChild(body);
        currentFrame = body;

        // Wire up tab buttons
        btnTimeline = container.querySelector('.lifelog-btn-timeline');
        btnReport = container.querySelector('.lifelog-btn-report');
        btnMood = container.querySelector('.lifelog-btn-mood');

        btnTimeline.addEventListener('click', function() { switchTab('timeline'); });
        btnReport.addEventListener('click', function() { switchTab('report'); });
        btnMood.addEventListener('click', function() { openMoodFullscreen(); });

        // Load default tab
        switchTab('timeline');
    }

    function switchTab(tab) {
        currentTab = tab;
        updateActiveButton();

        if (tab === 'timeline') {
            renderTimeline();
        } else if (tab === 'report') {
            renderReport();
        }
    }

    function updateActiveButton() {
        [btnTimeline, btnReport].forEach(function(b) { b.style.fontWeight = 'normal'; });
        if (currentTab === 'timeline' && btnTimeline) btnTimeline.style.fontWeight = 'bold';
        if (currentTab === 'report' && btnReport) btnReport.style.fontWeight = 'bold';
    }

    function openMoodFullscreen() {
        if (typeof OSO_MoodTracker !== 'undefined' && OSO_MoodTracker.open) {
            OSO_MoodTracker.open();
        }
    }

    function renderTimeline() {
        currentFrame.innerHTML =
            '<iframe src="data/chronicle/timeline.html" style="width:100%;height:100%;border:none;background:#fff;" scrolling="auto"></iframe>';
    }

    function renderReport() {
        currentFrame.innerHTML =
            '<iframe src="data/chronicle/report.html" style="width:100%;height:100%;border:none;background:#fff;" scrolling="auto"></iframe>';
    }

    function getHTML() {
        return '\
<style>\
.lifelog-toolbar {\
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
.lifelog-toolbar button {\
    height: 26px;\
    padding: 2px 14px;\
    font-size: 11px;\
    font-family: inherit;\
    background: #f0ede5;\
    border: 1px solid #b0a890;\
    border-radius: 2px;\
    color: #333;\
    cursor: pointer;\
    white-space: nowrap;\
}\
.lifelog-toolbar button:hover {\
    background: #faf8f2;\
    border-color: #8a7a60;\
}\
.lifelog-toolbar button:active {\
    background: #ddd8cc;\
}\
.lifelog-toolbar button.lifelog-btn-mood {\
    margin-left: auto;\
    background: linear-gradient(135deg, #5e2ca5, #8a41ff);\
    color: #fff;\
    border-color: #3a1a7a;\
    font-weight: bold;\
}\
.lifelog-toolbar button.lifelog-btn-mood:hover {\
    background: linear-gradient(135deg, #6e3cb5, #9a51ff);\
}\
.lifelog-content {\
    max-width: 720px;\
    margin: 0 auto;\
}\
.lifelog-content h1 {\
    font-size: 24px;\
    font-weight: normal;\
    border-bottom: 1px solid #a2a9b1;\
    padding-bottom: 4px;\
    margin: 0 0 8px 0;\
    font-family: Georgia, "Times New Roman", serif;\
    color: #000;\
}\
.lifelog-content h2 {\
    font-size: 19px;\
    font-weight: normal;\
    border-bottom: 1px solid #a2a9b1;\
    padding-bottom: 3px;\
    margin: 20px 0 8px 0;\
    color: #000;\
}\
.lifelog-content p {\
    margin: 0 0 10px 0;\
}\
.lifelog-content hr {\
    border: none;\
    border-top: 1px solid #a2a9b1;\
    margin: 12px 0;\
}\
</style>\
<div class="lifelog-toolbar">\
    <button class="lifelog-btn-timeline" style="font-weight:bold">\u25C6 时间轴</button>\
    <button class="lifelog-btn-report">\u25C6 报告</button>\
    <button class="lifelog-btn-mood" title="全屏打开情绪地图">\u2606 情绪地图</button>\
</div>';
    }

    return { open: open };
})();

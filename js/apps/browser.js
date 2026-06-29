/* ===== Ciao OS - life log (static) ===== */

var OSO_Browser = (function() {
    'use strict';

    function open() {
        if (OSO.WM.get('browser')) {
            OSO.WM.focus(OSO.WM.get('browser'));
            return;
        }

        var container = document.createElement('div');
        container.style.cssText = 'display:flex;flex-direction:column;height:100%;overflow:hidden;background:#c0c0c0;';
        container.innerHTML = getHTML();

        var win = OSO.WM.create('browser', 'life log', 'assets/icons/image-24.png', container, {
            width: 720, height: 520, minWidth: 480, minHeight: 340
        });

        var input = container.querySelector('.browser-address');
        var frame = container.querySelector('.browser-frame');
        var status = container.querySelector('.browser-status');

        function normalizeUrl(value) {
            var text = (value || '').trim();
            if (!text) return 'about:blank';
            if (text === 'nebula') return 'LLM_Wiki_知识星云.html';
            if (text === 'mood') return '情绪星云_交互可视化.html';
            if (/^(https?:|file:|about:)/i.test(text)) return text;
            if (/^[\w.-]+\.[a-z]{2,}/i.test(text)) return 'https://' + text;
            return text;
        }

        function go(value) {
            var url = normalizeUrl(value || input.value);
            input.value = url;
            frame.src = url;
            status.textContent = url;
            win.setStatus(url);
        }

        container.querySelector('.browser-go').addEventListener('click', function() {
            go();
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') go();
        });
        container.querySelectorAll('[data-url]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                go(btn.getAttribute('data-url'));
            });
        });

        go('LLM_Wiki_知识星云.html');
    }

    function getHTML() {
        return '\
<style>\
.browser-toolbar{display:flex;gap:4px;align-items:center;padding:5px;background:#c0c0c0;border-bottom:2px solid #808080;}\
.browser-address{flex:1;height:22px;padding:2px 6px;border-top:1px solid #808080;border-left:1px solid #808080;border-right:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;background:#fff;font-size:12px;font-family:inherit;}\
.browser-go,.browser-link{height:24px;padding:2px 8px;font-size:11px;font-family:inherit;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080;cursor:pointer;}\
.browser-go:active,.browser-link:active{border-top:1px solid #808080;border-left:1px solid #808080;border-right:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;}\
.browser-frame{flex:1;width:100%;border:none;background:#fff;}\
.browser-status{height:18px;padding:2px 6px;font-size:10px;color:#333;border-top:1px solid #808080;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}\
</style>\
<div class="browser-toolbar">\
    <button class="browser-link" data-url="LLM_Wiki_知识星云.html">知识图谱</button>\
    <button class="browser-link" data-url="情绪星云_交互可视化.html">Mood</button>\
    <input class="browser-address" type="text" value="LLM_Wiki_知识星云.html"/>\
    <button class="browser-go">Go</button>\
</div>\
<iframe class="browser-frame" title="Browser"></iframe>\
<div class="browser-status"></div>';
    }

    return { open: open };
})();

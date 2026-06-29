/* ===== 俏也 OS — 知识图谱 (全屏叠加) =====
 * 由 Wikipedia 应用 (wiki.js) 的知识图谱按钮调用
 * 展示 LLM Wiki 知识图谱的全屏可视化
 */

var OSO_WikiGraph = (function() {
    'use strict';

    function open() {
        var existing = document.getElementById('oso-fullscreen-wiki');
        if (existing) { existing.remove(); return; }

        var overlay = document.createElement('div');
        overlay.id = 'oso-fullscreen-wiki';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;';

        overlay.innerHTML = '\
<div style="display:flex;align-items:center;justify-content:space-between;height:20px;background:linear-gradient(90deg,#5e2ca5,#8a41ff);color:#fff;font-size:11px;padding:1px 3px;flex-shrink:0;border-bottom:1px solid #3a1a7a;">\
    <span style="display:flex;align-items:center;gap:4px;"><img src="assets/icons/image-24.png" style="width:14px;height:14px;" alt=""/>知识图谱</span>\
    <div style="display:flex;gap:2px;">\
        <div onclick="document.getElementById(\'oso-fullscreen-wiki\').remove()" style="cursor:pointer;width:16px;height:14px;display:flex;align-items:center;justify-content:center;background:#c0c0c0;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080;color:#000;font-size:8px;line-height:1;">✕</div>\
    </div>\
</div>\
<iframe id="oso-wiki-iframe" style="flex:1;width:100%;border:none;"></iframe>\
<div id="oso-wiki-loading" style="flex:1;display:flex;align-items:center;justify-content:center;color:#808080;font-size:12px;">Loading...</div>';

        document.body.appendChild(overlay);
        var iframe = document.getElementById('oso-wiki-iframe');
        var loading = document.getElementById('oso-wiki-loading');

        fetch('LLM_Wiki_知识星云.html')
            .then(function(res) { return res.text(); })
            .then(function(html) {
                iframe.srcdoc = html;
                loading.style.display = 'none';
                iframe.style.display = '';
            })
            .catch(function() {
                iframe.src = 'LLM_Wiki_知识星云.html';
                loading.style.display = 'none';
                iframe.style.display = '';
            });
    }

    return { open: open };
})();

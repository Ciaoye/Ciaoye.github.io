(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const escape = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pages=$$('.page');
for(const page of pages)for(const [i,h] of [...page.querySelectorAll('h1,h2,h3,h4')].entries())if(!h.id)h.id=page.id+'-auto-'+i;
// 照片只关联到它实际所属的案例；保留独立来源与原图入口。
const photos=JSON.parse($('#photo-data').textContent);
for(const p of photos){
 const root=document.getElementById(p.chapter);
 const h=[...root.querySelectorAll('h2,h3,h4')].find(h=>h.textContent.includes(p.heading));
 if(!h)continue;
 const f=document.createElement('figure');f.className='case-photo';
 f.innerHTML=`<a href="assets/${escape(p.file)}" target="_blank" aria-label="查看${escape(p.name)}原图"><img src="assets/${escape(p.file)}" alt="${escape(p.caption)}" loading="lazy" decoding="async"></a><figcaption><span><strong>${escape(p.name)}</strong> · ${escape(p.caption)}</span><a href="${escape(p.source)}" target="_blank" rel="noopener noreferrer">${escape(p.credit)} ↗</a></figcaption>`;
 h.after(f);
}
for(const page of pages){
 if(page.id==='overview')continue;
 const heads=[...page.querySelectorAll(':scope > h2,:scope > h3')];
 const contents=document.createElement('details');contents.className='mobile-toc';
 contents.innerHTML='<summary>本章目录 · 点此展开</summary><nav>'+heads.map(h=>`<a href="#${page.id}/${h.id}">${escape(h.textContent)}</a>`).join('')+'</nav>';
 page.querySelector('.chapter-header').after(contents);
 contents.querySelectorAll('a').forEach(a=>a.onclick=()=>contents.open=false);
}
function route(){
 const parts=decodeURIComponent(location.hash.slice(1)||'overview').split('/');
 let page=document.getElementById(parts[0]);
 if(!page?.classList.contains('page'))page=$('#overview');
 pages.forEach(p=>p.hidden=p!==page);
 $$('.sidebar nav a').forEach(a=>{const active=a.dataset.route===page.id;a.classList.toggle('active',active);active?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current');});
 $('#crumb').textContent=page.dataset.title;document.title=page.dataset.title+'｜地衣之家调研报告';
 const heads=[...page.querySelectorAll(':scope > h2,:scope > h3')];
 $('#chapter-links').innerHTML=heads.map(h=>`<a href="#${page.id}/${h.id}">${escape(h.textContent)}</a>`).join('');
 if(page.id==='overview')$('#chapter-links').innerHTML='<a href="#institution">机构与服务 →</a><a href="#options">七个备选剧本 →</a><a href="#budget">长沙预算试算 →</a><a href="#library">完整资料库 →</a>';
 $('#sidebar').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false');
 if(parts[1]){
  const target=document.getElementById(parts[1]);
  if(target&&page.contains(target)){
   for(let n=target;n&&n!==page;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;
   requestAnimationFrame(()=>{target.scrollIntoView({block:'start',behavior:'instant'});target.classList.add('target-flash');setTimeout(()=>target.classList.remove('target-flash'),1800)});
  }
 }else window.scrollTo({top:0,behavior:'instant'});
}
window.addEventListener('hashchange',route);
$('#menu-toggle').onclick=()=>{const open=$('#sidebar').classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open));};
document.addEventListener('click',e=>{if(!e.target.closest('#sidebar,#menu-toggle')){$('#sidebar').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false')}});
$('#font-toggle').onclick=()=>document.body.classList.toggle('large-type');
$('#print-report').onclick=async()=>{const imgs=$$('.page:not(#library) img');imgs.forEach(im=>im.loading='eager');await Promise.allSettled(imgs.map(im=>im.decode()));window.print();};
const dialog=$('#search-dialog');
$('#search-open').onclick=()=>{dialog.showModal();$('#report-search').focus()};
$('#search-close').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)&&!dialog.open){e.preventDefault();dialog.showModal();$('#report-search').focus()}if(e.key==='Escape'){$('#sidebar').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false')}});
const searchIndex=[];
for(const page of pages){
 let heading=page.dataset.title,anchor=page.id;
 for(const node of page.querySelectorAll('h1,h2,h3,h4,p,li,tr,summary,pre')){
  if(node.closest('.case-photo'))continue;
  if(/^H[1-4]$/.test(node.tagName)){heading=node.textContent;anchor=node.id;}
  const source=node.closest('.source-document');
  const text=node.textContent.replace(/\s+/g,' ').trim();
  if(text.length<4)continue;
  searchIndex.push({text,title:source?.querySelector('summary')?.textContent||heading,route:page.id,anchor:source?.id||anchor});
 }
}
let searchTimer;
$('#report-search').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(search,120)};
function search(){
 const q=$('#report-search').value.trim();
 if(!q){$('#search-results').innerHTML='';$('#search-status').textContent='搜索范围：报告正文与已存档报道。空间数据库可在资料库中单独筛选。';return;}
 const terms=q.toLowerCase().split(/\s+/),hits=[],seen=new Set();
 for(const item of searchIndex){
  if(terms.every(t=>item.text.toLowerCase().includes(t))){
   const key=item.route+item.anchor+item.text.slice(0,80);if(seen.has(key))continue;seen.add(key);hits.push(item);
  }
 }
 $('#search-status').textContent=`找到 ${hits.length} 处匹配${hits.length>60?'，先显示前 60 处，请增加关键词缩小范围':''}`;
 $('#search-results').innerHTML=hits.slice(0,60).map(item=>{
  const pos=item.text.toLowerCase().indexOf(terms[0]);let text=item.text.slice(Math.max(0,pos-45),pos+135);
  text=escape(text);for(const term of terms){const safe=escape(term).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');text=text.replace(new RegExp(safe,'ig'),m=>`<mark>${m}</mark>`)}
  return `<a class="search-hit" href="#${item.route}/${item.anchor}"><small>${escape(document.getElementById(item.route).dataset.title)}</small><div>${escape(item.title)}</div><p>…${text}…</p></a>`;
 }).join('')||'<p>没有匹配内容。可试试案例名称、城市或更短的关键词。</p>';
 $$('#search-results a').forEach(a=>a.onclick=()=>{dialog.close();if(location.hash===a.getAttribute('href'))route()});
}
const database=JSON.parse($('#database-data').textContent);
const cityKey='a836e841-7e66-4f7b-9d18-fbdba414b424',typeKey='21388fec-d9a6-4c88-88f4-bcd62ec04b9b';
function drawDatabase(){
 const q=$('#space-filter').value.trim().toLowerCase(),closed=$('#space-status').value==='closed';
 const rows=database.filter(x=>{const t=Object.values(x).join(' ');return (!q||t.toLowerCase().includes(q))&&(!closed||/已关闭|不再运营/.test(t))});
 $('#space-count').textContent=`${rows.length} / ${database.length} 条`;
 $('#space-rows').innerHTML=rows.map(x=>{
  const vals=Object.values(x).filter(v=>typeof v==='string'),links=[...new Set(vals.flatMap(v=>v.match(/https?:\/\/[^\s<>]+/g)||[]))];
  const known=new Set([x['名称'],x[cityKey],x[typeKey],x.mKMr,'‣']);
  const other=vals.filter(v=>!known.has(v)&&!links.includes(v));
  return `<div class="space-row"><header><b>${escape(x['名称'])}</b><span>${escape(x[cityKey]||'城市未录入')}</span></header><span class="tag">${escape(x[typeKey]||'类型未录入')}</span>${/已关闭|不再运营/.test(vals.join(' '))?'<span class="tag">历史关闭标记</span>':''}<p>${escape(x.mKMr||'原数据库未录入简介')}</p>${other.length?'<p>'+other.map(escape).join(' · ')+'</p>':''}${links.map((u,i)=>`<a href="${escape(u)}" target="_blank" rel="noopener noreferrer">原有链接 ${i+1} ↗</a>`).join(' · ')}</div>`;
 }).join('')||'<p>没有符合筛选条件的条目。</p>';
}
$('#space-filter').oninput=drawDatabase;$('#space-status').onchange=drawDatabase;
drawDatabase();
const defaults={rent:16000,people:14500,other:3000,days:30,cups:30,price:25,margin:67.5,tickets:300,ticketPrice:29.9,ticketCost:8,tours:6,tourSize:15,tourPrice:88,guide:60,events:8,eventSize:20,eventPrice:25,eventMargin:70,donations:0};
const inputs=[['rent','租金与物业（元/月）'],['people','人员与补贴（元/月）'],['other','水电网及其他（元/月）'],['days','营业天数（天/月）'],['cups','单独售卖饮品（杯/天）'],['price','单独饮品售价（元）'],['margin','饮品毛利率（%）'],['tickets','展览饮品套票（张/月）'],['ticketPrice','套票售价（元/张）'],['ticketCost','套票直接成本（元/张）'],['tours','散客导览（场/月）'],['tourSize','每场人数（人）'],['tourPrice','导览票价（元/人）'],['guide','主讲人分成（%）'],['events','其他活动（场/月）'],['eventSize','活动人数（人/场）'],['eventPrice','活动票价（元/人）'],['eventMargin','活动直接成本扣除后留用（%）'],['donations','已落实的可用资助（元/月）']];
$('#calculator').innerHTML=`<h2 id="budget-calculator">一张可以调整的月度账</h2><div class="calc-presets"><button data-preset="base">原规模情景</button><button data-preset="low">低租金情景</button><button data-preset="stress">销量减半情景</button><button id="calc-reset">恢复默认</button></div><div class="calc-grid"><div class="calc-controls"><h3>调整假设</h3>${inputs.map(([k,label])=>`<label for="calc-${k}"><span>${label}</span><input id="calc-${k}" type="number" min="${k==='days'?1:0}" ${['margin','guide','eventMargin'].includes(k)?'max="100"':''} step="${['price','margin','ticketPrice','ticketCost','tourPrice','eventPrice'].includes(k)?'0.1':'1'}" value="${defaults[k]}" inputmode="decimal"></label>`).join('')}</div><div><div class="calc-output" aria-live="polite" aria-atomic="true" id="calc-output"></div><p class="calc-help">单独售卖饮品不含套票饮品；导览和其他活动也按不同订单计数，避免重复。默认固定支出 33,500 元中，3,000 元只作为水电网及其他开支，饮品与活动直接成本另扣。</p><p class="calc-help">导览留用额还要承担培训、开发、陪同、保险及交通等未列成本。本表也未含押金、装修、设备采购、折旧、税费、借款偿还和额外救助支出；实际可用结余可能更低。资助只填可用于这些支出的已落实金额，不按月捐人数推算。</p></div></div><p class="calc-help">计算方式：单独饮品收入 × 毛利率 ＋ 套票张数 ×（票价－直接成本）＋ 导览票款 ×（1－主讲分成）＋ 其他活动收入 × 留用比例 ＋ 可用资助 － 固定支出。</p>`;
const money=n=>'¥ '+Math.round(n).toLocaleString('zh-CN');
function calculate(){
 const v={};for(const [k] of inputs){const input=$('#calc-'+k);let n=Number(input.value)||0;n=Math.max(k==='days'?1:0,n);if(['margin','guide','eventMargin'].includes(k))n=Math.min(100,n);v[k]=n;}
 const drink=v.days*v.cups*v.price,drinkNet=drink*v.margin/100,ticketNet=v.tickets*(v.ticketPrice-v.ticketCost),tourNet=v.tours*v.tourSize*v.tourPrice*(1-v.guide/100),eventNet=v.events*v.eventSize*v.eventPrice*v.eventMargin/100,fixed=v.rent+v.people+v.other,net=drinkNet+ticketNet+tourNet+eventNet+v.donations,remain=net-fixed;
 const required=v.days*v.price*v.margin>0?Math.ceil(Math.max(0,fixed-ticketNet-tourNet-eventNet-v.donations)/(v.days*v.price*v.margin/100)):null;
 $('#calc-output').innerHTML=`<h3>${remain>=0?'本情景月度余额':'本情景月度缺口'}</h3><strong class="calc-value">${money(Math.abs(remain))}</strong><span>扣除已列直接成本与固定支出之后</span><dl><div><dt>单独饮品净贡献</dt><dd>${money(drinkNet)}</dd></div><div><dt>套票净贡献</dt><dd>${money(ticketNet)}</dd></div><div><dt>导览留给机构</dt><dd>${money(tourNet)}</dd></div><div><dt>其他活动净贡献</dt><dd>${money(eventNet)}</dd></div><div><dt>可用资助</dt><dd>${money(v.donations)}</dd></div><div><dt>固定支出</dt><dd>${money(fixed)}</dd></div></dl><small>其他输入不变时，单独饮品约需 ${required===null?'无法计算':required+' 杯/天'} 才能覆盖本表已列成本（另有 ${Math.round(v.tickets)} 张/月套票）。这不是完整经营盈亏线。</small>`;
}
function setPreset(type){let p={...defaults};if(type==='low')p.rent=5000;if(type==='stress'){p.cups=15;p.tickets=150;p.tours=3;p.events=4}for(const [k] of inputs)$('#calc-'+k).value=p[k];calculate();}
$$('[data-preset]').forEach(b=>b.onclick=()=>setPreset(b.dataset.preset));$('#calc-reset').onclick=()=>setPreset('base');$$('#calculator input').forEach(i=>i.oninput=calculate);calculate();
route();
})();

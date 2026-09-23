import './style.css';
import {PDFReader} from './pdf.js';
import {renderFlow,downloadPNG,download} from './flow.js';
const $=s=>document.querySelector(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={explain:'解释',translate:'翻译',terms:'术语','paper-summary':'论文速览','experiment-flow':'实验流程',sentence:'句子解析',results:'解释结果'};
const state={pages:[],page:1,zoom:1,demo:false,selection:'',ready:false,busy:false,last:null,epoch:0};
$('#app').innerHTML=`<header><b>▣ PaperMate <small>论文伴读</small></b><span id="status">检查服务…</span><button id="settings">AI 设置</button><button id="upload">上传 PDF</button></header>
<section id="home"><h1>让论文更容易读懂</h1><p>语言理解 · 专业术语 · 实验流程</p><div id="drop"><h2>拖入论文 PDF</h2><p>可选择文字的 PDF，最多 40 MB / 300 页</p><button id="choose">选择 PDF</button><button id="demo">体验示例论文</button></div><p>PDF 在本机解析。使用真实 AI 时，选中文字与相关页面会发送至 DeepSeek API。</p></section>
<main hidden><nav><h3>论文导航</h3><p id="filename"></p><button data-action="paper-summary">论文速览</button><div id="outline"></div></nav><section id="reader"><div class="toolbar"><button id="prev">上一页</button><input id="page" type="number" min="1" aria-label="页码"><span id="total"></span><button id="next">下一页</button><button id="minus">−</button><span id="zoom"></span><button id="plus">＋</button><button id="fit">适应宽度</button></div><div id="paper"></div></section><aside><h3>AI 阅读助手</h3><p id="mode"></p><div class="actions">${Object.entries(labels).map(([key,label])=>`<button data-action="${key}">${label}</button>`).join('')}</div><div id="selection">选中 PDF 文字后，可直接解释或翻译。</div><div id="answers" aria-live="polite"></div><form id="questionForm"><textarea id="question" placeholder="问问这篇论文…" maxlength="2000" aria-label="论文问题"></textarea><button>发送</button></form></aside></main>
<footer id="tabs" hidden><button data-tab="reader">PDF</button><button data-tab="ai">AI</button><button data-tab="nav">导航</button></footer><div id="selectionTools" hidden>${['explain','translate','terms'].map(k=>`<button data-action="${k}">${labels[k]}</button>`).join('')}</div><p id="notice" role="status"></p><input id="file" type="file" accept="application/pdf" hidden><dialog id="config"><h2>DeepSeek 配置</h2><p>关闭 PaperMate 后，双击项目目录中的“配置 DeepSeek.cmd”，输入 API Key，再重新启动。</p><pre>DEEPSEEK_BASE_URL=https://api.deepseek.com\nDEEPSEEK_MODEL=deepseek-flash</pre><p>Key 只保存在本机项目的 .env.local，不会发送给浏览器。论文相关文本会发送到 DeepSeek API 进行分析。</p><button id="closeConfig">关闭</button></dialog>`;
const reader=new PDFReader($('#paper'));
function notice(text){$('#notice').textContent=text;}
async function apiStatus(){try{const s=await(await fetch('/api/status')).json();state.ready=s.ready;$('#status').textContent=s.ready?'AI 已配置':'本地阅读 · AI 未配置';}catch{notice('无法连接本地服务，请重新启动。');}}
apiStatus();
function updateControls(){ $('#page').value=state.page;$('#total').textContent=`/ ${state.pages.length}`;$('#page').max=state.pages.length;$('#zoom').textContent=`${Math.round(state.zoom*100)}%`;$('#prev').disabled=state.page===1;$('#next').disabled=state.page===state.pages.length;$('#mode').textContent=state.demo?'演示模式：虚构论文与预设答案':'真实 PDF · '+(state.ready?'已连接模型':'配置 AI 后可分析'); }
async function go(page){state.page=Math.max(1,Math.min(state.pages.length,Number(page)||1));state.selection='';$('#selectionTools').hidden=true;$('#selection').textContent='选中 PDF 文字后，可直接解释或翻译。';updateControls();try{await reader.render(state.page,state.zoom);}catch{notice('页面渲染失败，请重新打开 PDF。');}}
async function loadPDF(data,name,demo=false){
 state.epoch++;state.last=null;state.selection='';notice('正在读取 PDF…');$('#answers').replaceChildren();
 try{const result=await reader.load(data,(i,n)=>notice(`正在提取论文文本 ${i}/${n}…`));state.pages=result.pages;state.demo=demo;state.page=1;
 $('#home').hidden=true;$('main').hidden=false;$('#tabs').hidden=false;$('#filename').textContent=name;
 const headings=result.headings.length?result.headings:result.pages.map(p=>({title:`第 ${p.page} 页`,page:p.page}));
 $('#outline').innerHTML=headings.map(h=>`<button data-page="${h.page}">${escape(h.title)} <small>${h.page}</small></button>`).join('');
 await go(1);notice(result.pages.some(p=>p.text.trim())?'PDF 已读取，可翻页、缩放和选择文字。':'此 PDF 没有可提取文本，可能是扫描版。仍可查看页面，但不支持 AI 分析。');
 if(demo||state.ready)await ask('paper-summary');
 }catch(e){notice(e.name==='PasswordException'?'此 PDF 已加密，请使用解密后的文件。':'暂时无法读取这篇论文：'+e.message);}
}
async function upload(file){if(!file)return;if(!/\.pdf$/i.test(file.name)||file.size>40*1024*1024){notice('请选择不超过 40 MB 的 PDF。');return;}await loadPDF(new Uint8Array(await file.arrayBuffer()),file.name);$('#file').value='';}
$('#upload').onclick=$('#choose').onclick=()=>$('#file').click();$('#file').onchange=e=>upload(e.target.files[0]);
$('#drop').ondragover=e=>e.preventDefault();$('#drop').ondrop=e=>{e.preventDefault();upload(e.dataTransfer.files[0]);};
$('#demo').onclick=async()=>{try{const r=await fetch('/demo.pdf');if(!r.ok)throw Error();await loadPDF(new Uint8Array(await r.arrayBuffer()),'示例论文（虚构）',true);}catch{notice('示例文件读取失败。');}};
$('#settings').onclick=()=>$('#config').showModal();$('#closeConfig').onclick=()=>$('#config').close();
$('#prev').onclick=()=>go(state.page-1);$('#next').onclick=()=>go(state.page+1);$('#page').onchange=e=>go(e.target.value);
async function zoom(delta){state.zoom=Math.max(.4,Math.min(2.5,state.zoom+delta));await go(state.page);}
$('#plus').onclick=()=>zoom(.15);$('#minus').onclick=()=>zoom(-.15);$('#fit').onclick=async()=>{const p=await reader.doc.getPage(state.page);state.zoom=Math.max(.4,Math.min(2.5,($('#reader').clientWidth-40)/p.getViewport({scale:1}).width));go(state.page);};
document.addEventListener('mouseup',()=>{const s=window.getSelection();if(!s?.rangeCount||!$('#paper').contains(s.anchorNode)||!s.toString().trim())return;state.selection=s.toString().trim().slice(0,12000);$('#selection').textContent='已选：'+state.selection;const r=s.getRangeAt(0).getBoundingClientRect();const pop=$('#selectionTools');pop.hidden=false;pop.style.left=`${Math.max(8,Math.min(innerWidth-230,r.left))}px`;pop.style.top=`${Math.min(innerHeight-50,r.bottom+8)}px`;});
$('#selectionTools').onmousedown=e=>e.preventDefault();
document.addEventListener('click',e=>{const a=e.target.closest('[data-action]');if(a)ask(a.dataset.action);const p=e.target.closest('[data-page]');if(p)go(p.dataset.page);const tab=e.target.closest('[data-tab]');if(tab)document.body.dataset.tab=tab.dataset.tab;});
$('#questionForm').onsubmit=e=>{e.preventDefault();if($('#question').value.trim())ask('question');};
async function ask(action,depth='simple',complexity='标准版',saved=null){
 if(!state.pages.length){notice('请先上传 PDF 或打开示例论文。');return;}if(state.busy)return;
 const request=saved?{...saved,depth,complexity}:{demo:state.demo,pages:state.pages,page:state.page,selection:state.selection,question:$('#question').value.trim(),depth,complexity};
 state.last={action,request};state.busy=true;const epoch=state.epoch;$('#selectionTools').hidden=true;document.body.dataset.tab='ai';
 const box=document.createElement('article');box.className='answer';box.textContent=action==='experiment-flow'?'正在梳理实验流程…':'正在理解论文内容…';$('#answers').append(box);box.scrollIntoView({block:'nearest'});
 try{const res=await fetch('/api/ai/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(65000)});const data=await res.json();if(epoch!==state.epoch)return;if(!res.ok)throw new Error(data.error);await showAnswer(box,data,{action,request});$('#question').value='';}
 catch(e){box.textContent=e.name==='TimeoutError'?'请求超时，请重试。':e.message;const retry=document.createElement('button');retry.textContent='重试';retry.onclick=()=>ask(action,depth,complexity,request);box.append(retry);}
 finally{state.busy=false;}
}
async function showAnswer(box,data,snapshot){
 box.innerHTML=`<small>${data.mode==='demo'?'演示答案 · 不代表上传论文':'AI 回答 · 请核对原文'}</small><h3>${escape(data.title)}</h3>${snapshot.request.selection?`<details><summary>引用的选中文字</summary><p>${escape(snapshot.request.selection)}</p></details>`:''}<p>${escape(data.answer)}</p>`;
 for(const term of data.terms){const card=document.createElement('section');card.className='term';card.innerHTML=`<b>${escape(term.term)} · ${escape(term.translation)}</b><p>${escape(term.simple)}</p><details><summary>深入理解</summary><p>${escape(term.detail)}</p><details><summary>技术细节</summary><p>${escape(term.technical)}</p></details></details>`;for(const name of term.prerequisites){const b=document.createElement('button');b.textContent=name;b.onclick=()=>ask('question','simple','标准版',{...snapshot.request,question:'请解释前置概念：'+name});card.append(b);}box.append(card);}
 if(data.steps.length){const list=document.createElement('ol');for(const step of data.steps){const li=document.createElement('li');li.textContent=step;list.append(li);}box.append(list);}
 if(data.mermaid)await flowPanel(box,data.mermaid,snapshot);
 for(const [depth,label] of [['simple','再简单一点'],['detail','详细解释'],['example','举个例子']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>ask(snapshot.action,depth,snapshot.request.complexity,snapshot.request);box.append(b);}
}
async function flowPanel(box,code,snapshot){
 const wrap=document.createElement('section');wrap.innerHTML='<select aria-label="流程复杂度"><option>简洁版</option><option>标准版</option><option>详细版</option></select><div class="flow"></div><details><summary>编辑 Mermaid 流程</summary><textarea aria-label="Mermaid 源码"></textarea><button class="render">更新流程图</button></details><div class="flow-actions"></div><p class="flow-error"></p>';box.append(wrap);
 const host=wrap.querySelector('.flow'),editor=wrap.querySelector('textarea'),error=wrap.querySelector('.flow-error');editor.value=code;
 const draw=async()=>{try{await renderFlow(host,editor.value);error.textContent='';}catch{host.replaceChildren();error.textContent='流程代码有误，请修改后点击更新流程图。';}};
 wrap.querySelector('select').value=snapshot.request.complexity;wrap.querySelector('select').onchange=e=>ask('experiment-flow','simple',e.target.value,snapshot.request);wrap.querySelector('.render').onclick=draw;
 let scale=1;for(const [name,fn] of [['放大',()=>{scale+=.2;host.style.zoom=scale;}],['缩小',()=>{scale=Math.max(.4,scale-.2);host.style.zoom=scale;}],['复制 Mermaid',async()=>{await navigator.clipboard.writeText(editor.value);notice('已复制 Mermaid。');}],['下载 PNG',()=>downloadPNG(host)],['保存源码',()=>download(new Blob([editor.value],{type:'text/plain'}),'实验流程.mmd')]]){const b=document.createElement('button');b.textContent=name;b.onclick=async()=>{try{await fn();}catch(e){error.textContent='操作失败：'+e.message;}};wrap.querySelector('.flow-actions').append(b);}await draw();
}

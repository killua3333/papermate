import mermaid from 'mermaid';
mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'neutral',htmlLabels:false,flowchart:{htmlLabels:false},maxTextSize:15000});
let sequence=0;
export async function renderFlow(host,code){
 if(!/^flowchart\s+(TD|LR|TB)/.test(code.trim())||/%%\{|click\s|<|https?:/i.test(code))throw new Error('只支持不含链接或 HTML 的 Mermaid 流程图。');
 const {svg}=await mermaid.render(`flow-${++sequence}`,code);host.innerHTML=svg;
}
export function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function downloadPNG(host){
 const svg=host.querySelector('svg');if(!svg)throw new Error('请先生成有效流程图。');
 const clone=svg.cloneNode(true);const box=svg.viewBox.baseVal;clone.setAttribute('width',box.width);clone.setAttribute('height',box.height);
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));
 try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=box.width*2;canvas.height=box.height*2;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve));download(blob,'实验流程.png');}finally{URL.revokeObjectURL(url);}
}

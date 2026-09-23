import {getDocument,GlobalWorkerOptions,TextLayer} from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'pdfjs-dist/web/pdf_viewer.css';
GlobalWorkerOptions.workerSrc=worker;
export class PDFReader{
 constructor(container){this.container=container;this.version=0;}
 async load(data,onProgress){
  const doc=await getDocument({data,isEvalSupported:false}).promise;
  if(doc.numPages>300){await doc.destroy();throw new Error('当前最多支持 300 页 PDF。');}
  const pages=[];const headings=[];
  for(let i=1;i<=doc.numPages;i++){
   const page=await doc.getPage(i);const content=await page.getTextContent();
   const text=content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('');
   pages.push({page:i,text});onProgress(i,doc.numPages);
   for(const line of text.split('\n'))if(/^\s*(?:\d+(?:\.\d+)*\s+)?(?:abstract|introduction|related work|method\w*|experiment\w*|results|conclusion|references)\b/i.test(line)&&line.length<110)headings.push({title:line.trim(),page:i});
  }
  const outline=await doc.getOutline();
  if(outline){headings.length=0;const walk=async(items)=>{for(const item of items){let dest=typeof item.dest==='string'?await doc.getDestination(item.dest):item.dest;if(dest){const page=typeof dest[0]==='number'?dest[0]+1:(await doc.getPageIndex(dest[0]))+1;headings.push({title:item.title,page});}await walk(item.items||[]);}};await walk(outline);}
  if(this.doc)await this.doc.destroy();this.doc=doc;this.pages=pages;
  return {pages,headings};
 }
 async render(number,zoom){
  const version=++this.version;this.task?.cancel();this.layer?.cancel();
  const page=await this.doc.getPage(number);if(version!==this.version)return;
  const viewport=page.getViewport({scale:zoom});const host=document.createElement('div');host.className='pdf-page';
  host.style.cssText=`width:${viewport.width}px;height:${viewport.height}px;--scale-factor:${zoom}`;
  const canvas=document.createElement('canvas');const ratio=Math.min(devicePixelRatio,2);
  canvas.width=viewport.width*ratio;canvas.height=viewport.height*ratio;canvas.style.width='100%';canvas.style.height='100%';
  const text=document.createElement('div');text.className='textLayer';host.append(canvas,text);this.container.replaceChildren(host);
  this.task=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:[ratio,0,0,ratio,0,0]});
  try{await this.task.promise; if(version!==this.version)return;this.layer=new TextLayer({textContentSource:await page.getTextContent(),container:text,viewport});await this.layer.render();}catch(e){if(e.name!=='RenderingCancelledException'&&e.name!=='AbortException')throw e;}
 }
}

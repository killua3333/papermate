import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'vite';
import { requestSchema } from './lib/schema.mjs';
import { mockAnswer } from './lib/mock.mjs';
import { generateAnswer } from './lib/provider.mjs';
dotenv.config({path:'.env.local'});
const config={key:process.env.DEEPSEEK_API_KEY,base:process.env.DEEPSEEK_BASE_URL||'https://api.deepseek.com',model:process.env.DEEPSEEK_MODEL||'deepseek-flash'};
const ready=Boolean(config.key&&config.model);const app=express();
app.use(express.json({limit:'8mb'}));
app.get('/api/status',(_,res)=>res.json({ready,model:ready?config.model:null}));
app.post('/api/ai/:action',async(req,res)=>{
 const parsed=requestSchema.safeParse({...req.body,action:req.params.action});
 if(!parsed.success)return res.status(400).json({error:'请求内容无效或论文过大。'});
 const r=parsed.data;
 if(!r.demo&&!ready)return res.status(503).json({error:'真实论文分析尚未配置模型。PDF 阅读可正常使用，请按设置说明配置 .env.local 后重启。不会使用示例答案代替分析。'});
 if(!r.demo&&!r.pages.some(p=>p.text.trim()))return res.status(422).json({error:'论文没有可提取文本，可能是扫描版；请上传可选择文字的 PDF。'});
 try{res.json({mode:r.demo?'demo':'live',...await(r.demo?mockAnswer(r):generateAnswer(r,config))});}
 catch(e){res.status(502).json({error:e.name==='TimeoutError'?'理解内容超时，请稍后重试。':e.message});}
});
app.use((err,req,res,next)=>res.status(400).json({error:'请求过大或格式错误。'}));
if(process.argv.includes('--production'))app.use(express.static('dist'));
else app.use((await createServer({server:{middlewareMode:true},appType:'spa'})).middlewares);
const port=Number(process.env.PORT||4180);
const server=app.listen(port,'127.0.0.1',()=>console.log(`PaperMate: http://127.0.0.1:${port}`));
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'端口已占用，请关闭原服务或修改 PORT。':e.message);process.exit(1);});

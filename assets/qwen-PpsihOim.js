const h=[];function f(t,n){const s=new Date().toISOString();console.log(`[${s}] [Qwen] ${t}:`,n)}function g(t){return t.replace(/\b\d{11}\b/g,"[手机号码]").replace(/\b\d{18}\b/g,"[身份证号]").replace(/\b\w+@\w+\.\w+\b/g,"[邮箱地址]")}function w(t,n){const s=new Date().toISOString(),c=/https?:\/\/[^\s<>"{}|\\^`\[\]]+/g,u=(t.match(c)||[]).slice(0,5).map(r=>{let e="网络来源";try{const i=new URL(r).hostname;i.includes("sina")?e="新浪财经":i.includes("eastmoney")?e="东方财富":i.includes("xinhua")?e="新华网":i.includes("people")?e="人民网":i.includes("cctv")?e="央视网":i.includes("finance.sina")?e="新浪财经":i.includes("10jqka")?e="同花顺":i.includes("hexun")?e="和讯网":i.includes("cs")?e="中证网":i.includes("cnstock")?e="中国证券网":e=i.replace("www.","")}catch{e="网络来源"}return{url:r,title:`${n.join(" ")} - 相关报道`,channel:e}}),l=t.split(`
`).filter(r=>r.trim()),o=[];for(const r of l){const e=r.trim();if((e.startsWith("•")||e.startsWith("-")||e.startsWith("*")||/^\d+[.、]/.test(e))&&o.push(e),o.length>=5)break}if(o.length===0&&t.length>100){const r=t.split(/[。！？.!?]/).filter(e=>e.trim().length>10);o.push(...r.slice(0,3).map(e=>e.trim()+"。"))}let a=.75;return u.length>0&&(a+=.1),o.length>=3&&(a+=.05),t.length>200&&(a+=.05),a=Math.min(a,.95),{processDescription:t,acquisitionTime:s,sourceUrls:u,keyPoints:o,confidence:a}}async function p(t,n="你是一个专业的财经事件信息分析助手，负责根据用户提供的关键词，搜索并提供准确、全面的事件信息。",s=.7,c=2e3){throw new Error("千问API密钥未配置，请在环境变量中设置VITE_QWEN_API_KEY")}async function E(t){if(!t.trim())throw new Error("请输入要监控的事件关键词");f("开始监控事件",{keyword:t});const n=`你是一个专业的财经事件信息分析助手。你的任务是：
1. 根据用户提供的关键词，提供该事件的详细信息
2. 包括事件的背景、最新进展、影响分析
3. 尽可能提供信息来源网址
4. 总结关键要点

请按以下格式回复：
【事件概述】
简要描述事件背景和主要内容

【最新进展】
列出事件的最新动态和发展过程

【关键要点】
• 要点1
• 要点2
• 要点3

【信息来源】
列出相关的信息来源网址

【影响分析】
分析该事件可能带来的影响`,s=`请帮我查询关于"${t}"的最新信息，包括：
1. 事件的完整背景和发展过程
2. 最新的进展和动态
3. 相关的信息来源网址
4. 该事件的主要影响

请提供详细、准确的信息。`;try{const c=await p(s,n,.7,2e3),m=g(c),u=t.split(/[,，、\s]+/).filter(o=>o.trim()),l=w(m,u);return f("事件监控完成",{keyword:t,sourceCount:l.sourceUrls.length,keyPointsCount:l.keyPoints.length,confidence:l.confidence}),l}catch(c){throw f("事件监控失败",{keyword:t,error:c.message}),c}}async function d(t){const n="你是一个专业的财经事件摘要助手，负责将长文本内容压缩为简洁、准确的摘要。",s=`请为以下事件内容生成一个简洁的摘要（100字以内）：

${t}`;return await p(s,n,.5,200)}function S(){const n=Date.now()-60*1e3,s=h.filter(c=>c>n).length;return{configured:!1,rateLimit:{used:s,limit:30,remaining:30-s}}}export{d as a,S as g,E as m};

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ArmInput={l1:number;l2:number;m1:number;m2:number;payload:number;safety:number;voltage:number;targetRpm:number};
type TorqueResult={shoulderNm:number;elbowNm:number;shoulderKgCm:number;elbowKgCm:number};
type Motor={id:string;name:string;type:string;torqueNm:number;voltage:string;rpm:number;price:number;weight:number;fit:string[]};
type SavedProject={id:string;name:string;createdAt:string;input:ArmInput;result:TorqueResult};
type View="design"|"selector"|"bom"|"cases";
type Metrics=Record<string,number>;

const DEFAULT:ArmInput={l1:250,l2:250,m1:.35,m2:.28,payload:.5,safety:2,voltage:24,targetRpm:30};
const PRESETS=[
 {name:"轻型桌面臂",desc:"500 mm · 0.5 kg 负载",values:DEFAULT},
 {name:"教学机械臂",desc:"580 mm · 1 kg 负载",values:{...DEFAULT,l1:300,l2:280,m1:.55,m2:.42,payload:1,safety:2.2}},
 {name:"迷你机械臂",desc:"290 mm · 0.2 kg 负载",values:{...DEFAULT,l1:150,l2:140,m1:.18,m2:.14,payload:.2,safety:1.8,voltage:12}},
];
const MOTORS:Motor[]=[
 {id:"m1",name:"RoboDrive 42-20",type:"闭环步进电机",torqueNm:2,voltage:"24–48 V",rpm:300,price:268,weight:480,fit:["肘关节","轻载"]},
 {id:"m2",name:"Servo Pro 80",type:"总线舵机",torqueNm:8,voltage:"12–24 V",rpm:55,price:459,weight:390,fit:["肘关节","桌面机械臂"]},
 {id:"m3",name:"Planetary 60",type:"行星减速伺服",torqueNm:15,voltage:"24–48 V",rpm:80,price:880,weight:820,fit:["肩关节","教学机械臂"]},
 {id:"m4",name:"JointDrive 80",type:"一体化关节模组",torqueNm:28,voltage:"24–48 V",rpm:60,price:1680,weight:1150,fit:["肩关节","中型机械臂"]},
 {id:"m5",name:"MiniBus 35",type:"总线舵机",torqueNm:3.5,voltage:"9–12.6 V",rpm:70,price:198,weight:165,fit:["肘关节","迷你机械臂"]},
];
const CASES=[
 {name:"500 元桌面机械臂",meta:"4 DOF · 350 mm · 200 g",cost:"¥528",tag:"入门"},
 {name:"ROS2 视觉抓取机械臂",meta:"6 DOF · 550 mm · 500 g",cost:"¥4,280",tag:"热门"},
 {name:"教学型机械臂",meta:"5 DOF · 580 mm · 1 kg",cost:"¥3,680",tag:"教学"},
];
const ROADMAP=["真实电机数据库","URDF / Xacro 生成","ROS2 报错诊断","完整工程 PDF 报告"];

function calc(v:ArmInput):TorqueResult{const g=9.80665,l1=v.l1/1000,l2=v.l2/1000;const elbow=g*(v.m2*l2/2+v.payload*l2)*v.safety;const shoulder=g*(v.m1*l1/2+v.m2*(l1+l2/2)+v.payload*(l1+l2))*v.safety;return{shoulderNm:shoulder,elbowNm:elbow,shoulderKgCm:shoulder*10.1972,elbowKgCm:elbow*10.1972}}
const n=(x:number)=>Number.isFinite(x)?x.toFixed(2):"—";
const money=(x:number)=>new Intl.NumberFormat("zh-CN",{style:"currency",currency:"CNY",maximumFractionDigits:0}).format(x);

function track(event:string):Metrics{try{const key="re_events";const data=JSON.parse(localStorage.getItem(key)||"{}");data[event]=(data[event]||0)+1;localStorage.setItem(key,JSON.stringify(data));return data}catch{return {}}}
function download(name:string,data:string,type="application/json"){const blob=new Blob([data],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}

function NumField({label,unit,value,onChange,min=0,help}:{label:string;unit:string;value:number;onChange:(v:number)=>void;min?:number;help?:string}){
 return <label className="num-field"><span>{label}{help&&<small title={help}>?</small>}</span><div><input type="number" min={min} step="any" value={value} onChange={e=>onChange(Number(e.target.value))} required/><b>{unit}</b></div></label>
}

export default function Home(){
 const [view,setView]=useState<View>("design");const [input,setInput]=useState(DEFAULT);const [result,setResult]=useState<TorqueResult|null>(null);
 const [selected,setSelected]=useState<Record<string,string>>({});const [projects,setProjects]=useState<SavedProject[]>([]);const [notice,setNotice]=useState("");
 const [metrics,setMetrics]=useState<Metrics>({});const [adminOpen,setAdminOpen]=useState(false);const [welcome,setWelcome]=useState(false);
 const [roadmapVote,setRoadmapVote]=useState("");const [feedback,setFeedback]=useState("");const [email,setEmail]=useState("");
 useEffect(()=>{try{setProjects(JSON.parse(localStorage.getItem("re_projects")||"[]"));setMetrics(JSON.parse(localStorage.getItem("re_events")||"{}"));setRoadmapVote(localStorage.getItem("re_vote")||"");setWelcome(!localStorage.getItem("re_seen"))}catch{}},[]);
 const reach=input.l1+input.l2;
 const motorMatches=useMemo(()=>result?{shoulder:MOTORS.filter(m=>m.torqueNm>=result.shoulderNm).sort((a,b)=>a.price-b.price),elbow:MOTORS.filter(m=>m.torqueNm>=result.elbowNm).sort((a,b)=>a.price-b.price)}:null,[result]);
 const chosenMotors=Object.values(selected).map(id=>MOTORS.find(m=>m.id===id)).filter(Boolean) as Motor[];
 const bom=useMemo(()=>[
  {category:"结构",item:"PETG / 铝合金臂杆",qty:1,price:260,required:true},
  {category:"控制",item:"ESP32-S3 主控",qty:1,price:55,required:true},
  {category:"驱动",item:"双路电机驱动器",qty:1,price:128,required:true},
  {category:"电源",item:`${input.voltage} V 开关电源`,qty:1,price:168,required:true},
  {category:"传动",item:"轴承、联轴器与紧固件",qty:1,price:180,required:true},
  ...chosenMotors.map(m=>({category:"电机",item:m.name,qty:1,price:m.price,required:true}))
 ],[chosenMotors,input.voltage]);
 const bomTotal=bom.reduce((s,x)=>s+x.qty*x.price,0);
 const update=(key:keyof ArmInput,value:number)=>{setInput(v=>({...v,[key]:value}));setResult(null)};
 const showNotice=(text:string)=>{setNotice(text);setTimeout(()=>setNotice(""),2400)};
 const record=(event:string)=>setMetrics(track(event));
 const calculate=(e?:FormEvent)=>{e?.preventDefault();const r=calc(input);setResult(r);record("torque_calculated");setTimeout(()=>document.querySelector("#results")?.scrollIntoView({behavior:"smooth"}),50)};
 const changeView=(next:View)=>{setView(next);record("view_"+next);setTimeout(()=>document.querySelector("#workspace")?.scrollIntoView({behavior:"smooth"}),20)};
 const saveProject=()=>{if(!result)return;const project={id:crypto.randomUUID(),name:`${reach}mm 机械臂方案`,createdAt:new Date().toLocaleString("zh-CN"),input,result};const next=[project,...projects].slice(0,8);setProjects(next);localStorage.setItem("re_projects",JSON.stringify(next));showNotice("方案已保存到本机");record("project_saved")};
 const exportProject=()=>{if(!result)return;download(`RoboEngineer-${reach}mm方案.json`,JSON.stringify({product:"RoboEngineer AI",version:"1.1",createdAt:new Date().toISOString(),input,result,selectedMotors:chosenMotors,bom,total:bomTotal},null,2));record("project_exported")};
 const shareResult=async()=>{if(!result)return;const text=`RoboEngineer AI 机械臂方案：臂展 ${reach}mm，负载 ${input.payload}kg，J2 ≥ ${n(result.shoulderNm)}N·m，J3 ≥ ${n(result.elbowNm)}N·m。`;try{await navigator.clipboard.writeText(text);showNotice("分享文案已复制")}catch{download("RoboEngineer-分享文案.txt",text,"text/plain;charset=utf-8")}record("result_shared")};
 const vote=(item:string)=>{setRoadmapVote(item);localStorage.setItem("re_vote",item);record("roadmap_vote");showNotice("投票已记录")};
 const submitFeedback=(e:FormEvent)=>{e.preventDefault();if(!feedback.trim())return;const list=JSON.parse(localStorage.getItem("re_feedback")||"[]");list.unshift({feedback,email,createdAt:new Date().toISOString()});localStorage.setItem("re_feedback",JSON.stringify(list.slice(0,30)));setFeedback("");setEmail("");record("feedback_submitted");showNotice("反馈已保存在本机，可从运营看板导出")};
 const pricingInterest=(plan:string)=>{record("pricing_"+plan);showNotice("已记录你的方案偏好")};
 const dismissWelcome=()=>{localStorage.setItem("re_seen","1");setWelcome(false);record("onboarding_completed")};
 const applyPreset=(v:ArmInput)=>{setInput(v);setResult(null);setView("design")};

 return <main>
  {notice&&<div className="toast">✓ {notice}</div>}
  {welcome&&<div className="welcome"><div><span>第一次使用？</span><b>按 4 步完成你的第一份机械臂方案</b><small>输入参数 → 计算力矩 → 选择电机 → 导出 BOM</small></div><button onClick={()=>{dismissWelcome();changeView("design")}}>立即开始</button><button className="welcome-close" aria-label="关闭" onClick={dismissWelcome}>×</button></div>}
  {adminOpen&&<Dashboard metrics={metrics} projects={projects.length} close={()=>setAdminOpen(false)}/>}
  <header className="topbar"><div className="shell nav"><a className="brand" href="#top"><span>R</span>RoboEngineer <b>AI</b></a><nav><button onClick={()=>changeView("design")}>力矩计算</button><button onClick={()=>changeView("selector")}>电机选型</button><button onClick={()=>changeView("bom")}>BOM 清单</button><button onClick={()=>changeView("cases")}>项目案例</button><button onClick={()=>setAdminOpen(true)}>运营看板</button></nav><a className="nav-cta" href="#workspace">免费开始</a></div></header>

  <section className="hero shell" id="top"><div className="hero-copy"><div className="badge">机器人研发的一站式免费工具</div><h1>从需求到 BOM，<br/><em>30 秒生成机械臂方案</em></h1><p>工程公式负责计算，真实规则负责筛选。无需登录、无需安装专业软件，先验证你的机器人设计是否可行。</p><div className="hero-buttons"><button className="primary" onClick={()=>changeView("design")}>开始设计机械臂 <i>→</i></button><button className="ghost" onClick={()=>changeView("cases")}>查看公开案例</button></div><div className="proof"><span><b>5</b> 个核心步骤</span><span><b>100%</b> 浏览器本地计算</span><span><b>0</b> 注册门槛</span></div></div><div className="hero-panel"><div className="mini-top"><span>方案预览</span><b>LIVE</b></div><div className="robot-sketch"><i/><i/><i/><strong>{reach}<small> mm</small></strong></div><div className="mini-grid"><div><span>预计负载</span><b>{input.payload} kg</b></div><div><span>自由度建议</span><b>{input.payload>1?"6 DOF":"4–6 DOF"}</b></div><div><span>安全系数</span><b>{input.safety}×</b></div><div><span>预计成本</span><b>¥1,200+</b></div></div></div></section>

  <section className="tool-strip"><div className="shell">{(["design","selector","bom","cases"] as View[]).map((x,i)=><button key={x} className={view===x?"active":""} onClick={()=>changeView(x)}><span>0{i+1}</span><b>{["力矩计算器","电机选型器","BOM 生成器","项目案例库"][i]}</b><small>{["计算 J2 / J3","匹配额定力矩","估算采购成本","复用成熟方案"][i]}</small></button>)}</div></section>

  <section className="workspace shell" id="workspace">
   {view==="design"&&<div className="design-layout"><aside><span className="kicker">01 / 需求参数</span><h2>描述你的机械臂</h2><p>使用水平伸直的最不利姿态进行静态估算，快速得到关节选型底线。</p><div className="preset-list">{PRESETS.map(p=><button key={p.name} onClick={()=>applyPreset(p.values)}><b>{p.name}</b><small>{p.desc}</small><i>→</i></button>)}</div><div className="local-note">🔒 所有参数只保存在当前浏览器</div></aside><form className="input-card" onSubmit={calculate}><div className="card-title"><div><span>当前总臂展</span><strong>{reach}<small> mm</small></strong></div><b>参数可编辑</b></div><div className="fields"><NumField label="上臂长度 L1" unit="mm" value={input.l1} onChange={v=>update("l1",v)}/><NumField label="前臂长度 L2" unit="mm" value={input.l2} onChange={v=>update("l2",v)}/><NumField label="上臂质量 M1" unit="kg" value={input.m1} onChange={v=>update("m1",v)}/><NumField label="前臂质量 M2" unit="kg" value={input.m2} onChange={v=>update("m2",v)}/><NumField label="末端负载" unit="kg" value={input.payload} onChange={v=>update("payload",v)}/><NumField label="安全系数" unit="×" min={1} value={input.safety} onChange={v=>update("safety",v)} help="覆盖加速、摩擦及模型误差"/></div><button className="calculate" type="submit">计算关节力矩 <span>→</span></button></form></div>}

   {view==="selector"&&<div className="panel-view"><div className="view-heading"><span className="kicker">02 / 电机选型</span><h2>从计算结果筛选候选电机</h2><p>{result?"已根据额定力矩自动过滤不满足要求的型号。":"请先完成力矩计算，再进行电机匹配。"}</p></div>{!result?<Empty action={()=>changeView("design")} text="先计算 J2 / J3 所需力矩" button="前往力矩计算"/>:<div className="joint-columns">{(["shoulder","elbow"] as const).map((joint,index)=><div className="motor-group" key={joint}><div className="group-head"><div><span>J{index+2} · {index?"肘关节":"肩关节"}</span><b>≥ {n(index?result.elbowNm:result.shoulderNm)} N·m</b></div><small>{motorMatches?.[joint].length||0} 个候选</small></div>{motorMatches?.[joint].length?motorMatches[joint].slice(0,3).map((m,rank)=><label className={"motor-row "+(selected[joint]===m.id?"selected":"")} key={m.id}><input type="radio" name={joint} checked={selected[joint]===m.id} onChange={()=>{setSelected(s=>({...s,[joint]:m.id}));record("motor_selected")}}/><span className="rank">0{rank+1}</span><div><b>{m.name}</b><small>{m.type} · {m.voltage}</small></div><strong>{m.torqueNm} N·m</strong><em>{money(m.price)}</em></label>):<div className="no-match">当前数据库暂无满足力矩的型号，建议使用减速器或更高规格关节模组。</div>}</div>)}</div>}</div>}

   {view==="bom"&&<div className="panel-view"><div className="view-heading split"><div><span className="kicker">03 / BOM 生成器</span><h2>基础采购清单</h2><p>根据当前参数与已选电机生成，价格为早期估算。</p></div><div className="total"><span>预计合计</span><b>{money(bomTotal)}</b></div></div><div className="bom-table"><div className="bom-head"><span>类别</span><span>零部件</span><span>数量</span><span>单价</span><span>小计</span></div>{bom.map((x,i)=><div className="bom-row" key={i}><span><i>{x.category}</i></span><b>{x.item}</b><span>× {x.qty}</span><span>{money(x.price)}</span><strong>{money(x.qty*x.price)}</strong></div>)}</div><div className="bom-actions"><button className="ghost" onClick={()=>download("RoboEngineer-BOM.csv","类别,零部件,数量,单价,小计\n"+bom.map(x=>`${x.category},${x.item},${x.qty},${x.price},${x.qty*x.price}`).join("\n"),"text/csv;charset=utf-8")}>导出 CSV</button><button className="primary" onClick={()=>window.print()}>打印采购清单</button></div></div>}

   {view==="cases"&&<div className="panel-view"><div className="view-heading"><span className="kicker">04 / 项目案例</span><h2>从成熟方案开始修改</h2><p>一人公司先用案例验证搜索需求，再根据真实点击扩充工具。</p></div><div className="case-grid">{CASES.map((c,i)=><article key={c.name}><div className="case-art"><span>0{i+1}</span><i/><i/></div><em>{c.tag}</em><h3>{c.name}</h3><p>{c.meta}</p><div><b>{c.cost}</b><button onClick={()=>{applyPreset(PRESETS[Math.min(i,2)].values);showNotice("案例参数已载入")}}>基于此方案修改 →</button></div></article>)}</div>{projects.length>0&&<div className="saved"><h3>保存在本机的方案</h3>{projects.map(p=><button key={p.id} onClick={()=>{setInput(p.input);setResult(p.result);setView("design")}}><span><b>{p.name}</b><small>{p.createdAt}</small></span><strong>J2 {n(p.result.shoulderNm)} N·m</strong></button>)}</div>}</div>}
  </section>

  <section className="results" id="results"><div className="shell"><div className="results-heading"><div><span className="kicker">计算结果</span><h2>{result?"工程建议已生成":"结果将在这里显示"}</h2><p>{result?`已包含 ${input.safety}× 安全系数，可继续选择电机并生成 BOM。`:"输入参数后点击计算，页面会自动跳转到结果。"}</p></div>{result&&<div className="result-actions"><button onClick={saveProject}>保存到本机</button><button onClick={exportProject}>导出方案</button></div>}</div>{result?<div className="result-cards"><ResultCard joint="J2" title="肩关节最低推荐" nm={result.shoulderNm} kgcm={result.shoulderKgCm} light/><ResultCard joint="J3" title="肘关节最低推荐" nm={result.elbowNm} kgcm={result.elbowKgCm}/><article className="next-step"><span>下一步</span><h3>匹配电机并核算成本</h3><p>将力矩结果带入选型器，自动过滤额定力矩不足的型号。</p><button onClick={()=>changeView("selector")}>打开电机选型器 →</button></article></div>:<div className="result-empty"><span>J2</span><i/><span>J3</span><p>等待计算参数</p></div>}</div></section>

  <section className="principles shell"><div className="principle-title"><span className="kicker">为什么可信</span><h2>AI 理解需求，程序负责数字</h2></div><div className="principle-grid"><article><b>01</b><h3>最不利姿态</h3><p>两段机械臂水平伸直，按重力力矩最大的静态工况估算。</p></article><article><b>02</b><h3>质量与重心</h3><p>臂杆按均匀质量处理，重心位于每段臂长的中点。</p></article><article><b>03</b><h3>安全余量</h3><p>安全系数覆盖早期设计误差，但不替代完整动力学仿真。</p></article><article><b>04</b><h3>规则化选型</h3><p>候选器件必须满足额定力矩，再综合电压、转速和成本。</p></article></div></section>

  <section className="growth shell" id="pricing">
   <div className="growth-heading"><span className="kicker">商业验证</span><h2>先验证用户是否愿意付费</h2><p>按钮只记录兴趣，不会产生扣款。用真实点击决定是否开发会员功能。</p></div>
   <div className="pricing-grid"><article><span>Free</span><h3>免费版</h3><strong>¥0 <small>/ 永久</small></strong><p>力矩计算、基础电机筛选、基础 BOM、方案本机保存。</p><button className="ghost" onClick={()=>pricingInterest("free")}>继续免费使用</button></article><article className="featured"><em>需求验证中</em><span>Pro</span><h3>专业版</h3><strong>¥49 <small>/ 月</small></strong><p>完整电机数据库、无限项目、PDF 报告、URDF 与高级计算。</p><button className="primary" onClick={()=>pricingInterest("pro")}>我对 Pro 感兴趣</button></article><article><span>Team</span><h3>企业版</h3><strong>¥499 <small>/ 月起</small></strong><p>私有器件库、团队项目、内部知识库和工程 API。</p><button className="ghost" onClick={()=>pricingInterest("team")}>记录企业需求</button></article></div>
   <div className="validation-grid"><div className="roadmap"><span className="kicker">下一步做什么</span><h3>请投票选择最需要的功能</h3>{ROADMAP.map(item=><button key={item} className={roadmapVote===item?"selected":""} onClick={()=>vote(item)}><span>{roadmapVote===item?"✓":"○"}</span>{item}<i>投票</i></button>)}</div><form className="feedback" onSubmit={submitFeedback}><span className="kicker">用户反馈</span><h3>你现在最难解决的问题是什么？</h3><textarea required value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="例如：算出力矩后，不知道如何选择减速比和电机……"/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="邮箱（选填，仅用于后续联系）"/><button className="primary" type="submit">提交反馈 →</button><small>本地版不会自动上传；可在运营看板中导出反馈。</small></form></div>
  </section>
  <section className="cta"><div className="shell"><div><span>RoboEngineer AI · V1.1</span><h2>先让 100 个真实用户使用，<br/>再决定下一个功能。</h2></div><button className="primary" onClick={()=>changeView("design")}>免费生成方案 →</button></div></section>
  <footer className="shell footer"><a className="brand" href="#top"><span>R</span>RoboEngineer <b>AI</b></a><p>机器人研发，从一个真正有用的小工具开始。</p><small>本地计算版 · 数据不上传</small></footer>
 </main>
}

function Empty({action,text,button}:{action:()=>void;text:string;button:string}){return <div className="empty"><div>↗</div><h3>{text}</h3><button className="primary" onClick={action}>{button}</button></div>}
function ResultCard({joint,title,nm,kgcm,light=false}:{joint:string;title:string;nm:number;kgcm:number;light?:boolean}){return <article className={"result-card "+(light?"light":"")}><span>{joint}</span><small>{title}</small><strong>{n(nm)} <i>N·m</i></strong><p>≈ {n(kgcm)} kg·cm</p><div><i style={{width:Math.min(100,35+nm*3)+"%"}}/></div><em>选型时额定力矩不低于此值</em></article>}
function Dashboard({metrics,projects,close}:{metrics:Metrics;projects:number;close:()=>void}){
 const calculations=metrics.torque_calculated||0,selector=metrics.view_selector||0,bom=metrics.view_bom||0,exports=metrics.project_exported||0;
 const rate=(value:number)=>calculations?Math.round(value/calculations*100)+"%":"0%";
 const exportData=()=>{const feedback=JSON.parse(localStorage.getItem("re_feedback")||"[]");download("RoboEngineer-运营数据.json",JSON.stringify({exportedAt:new Date().toISOString(),metrics,projects,roadmapVote:localStorage.getItem("re_vote"),feedback},null,2))};
 return <div className="dashboard-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><section className="dashboard" role="dialog" aria-modal="true" aria-label="一人公司运营看板"><div className="dashboard-top"><div><span className="kicker">Founder Dashboard</span><h2>一人公司运营看板</h2><p>所有数据仅来自当前浏览器，用于本地验证漏斗。</p></div><button onClick={close}>×</button></div><div className="metric-grid"><article><span>成功计算</span><b>{calculations}</b><small>核心激活事件</small></article><article><span>进入选型</span><b>{selector}</b><small>计算后转化 {rate(selector)}</small></article><article><span>查看 BOM</span><b>{bom}</b><small>计算后转化 {rate(bom)}</small></article><article><span>导出方案</span><b>{exports}</b><small>计算后转化 {rate(exports)}</small></article><article><span>保存项目</span><b>{projects}</b><small>当前本机项目</small></article><article><span>付费意向</span><b>{(metrics.pricing_pro||0)+(metrics.pricing_team||0)}</b><small>Pro + 企业版点击</small></article></div><div className="funnel"><h3>最小验证漏斗</h3><div><span>计算</span><i style={{width:"100%"}}/><b>{calculations}</b></div><div><span>选型</span><i style={{width:Math.min(100,calculations?selector/calculations*100:0)+"%"}}/><b>{selector}</b></div><div><span>BOM</span><i style={{width:Math.min(100,calculations?bom/calculations*100:0)+"%"}}/><b>{bom}</b></div><div><span>导出</span><i style={{width:Math.min(100,calculations?exports/calculations*100:0)+"%"}}/><b>{exports}</b></div></div><div className="dashboard-actions"><button className="ghost" onClick={exportData}>导出运营数据</button><button className="primary" onClick={close}>返回产品</button></div></section></div>
}

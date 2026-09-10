const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const stickerPaths=Array.from({length:8},(_,index)=>`assets/sticker-${String(index+1).padStart(2,"0")}.png`);
const state={stickers:[],sampleMode:true,architecture:"story",customWireframeName:"",palette:[]};
const architectureOptions={
  story:{name:"故事推進型",outline:"Section 1：專題主張與問題情境。Section 2：解決方法、成果、貼圖與行動邀請。上下視覺份量約 60%：40%；Section 1 左右約 65%：35%，Section 2 左右約 40%：60%。"},
  data:{name:"資料說服型",outline:"Section 1：關鍵數據與問題發現。Section 2：解法、行動、成果與貼圖。上下視覺份量約 35%：65%；Section 1 左右約 35%：65%，Section 2 左右約 55%：45%。"},
  showcase:{name:"成果展示型",outline:"Section 1：大型主視覺與專題概述。Section 2：成果、製作過程、團隊與貼圖。上下視覺份量約 70%：30%；Section 1 左右約 60%：40%，Section 2 左右約 30%：70%。"},
  custom:{name:"自訂架構草圖",outline:"依照我另外上傳的草圖製作，但整理成且只能有兩個主要 Section。"}
};
const paletteRoles=["背景","文字","主色","輔色","強調色"];

function websitePrompt(){
  const title=$("#projectTitle").value.trim()||"我的專題";
  const problem=$("#projectProblem").value.trim()||"介紹專題想解決的問題";
  const audience=$("#projectAudience").value.trim()||"一般大眾";
  const sections=$("#projectSections").value.trim()||"專題主張、解決方法、成果與團隊介紹";
  const architecture=architectureOptions[state.architecture];
  const palette=state.palette.map((color,index)=>`${paletteRoles[index]}：${color.toUpperCase()}`).join("\n");
  const extraDirection=$("#designDirection").value.trim();
  return `請根據我已完成的設計決策，為學生專題製作一個完整的一頁式網站。不要自行改成另一種網站架構或配色。

專題名稱：${title}
要解決的問題：${problem}
主要讀者：${audience}
希望包含的內容：${sections}
架構選擇：${architecture.name}
段落順序：${architecture.outline}${state.architecture==="custom"?`\n自訂草圖檔名：${state.customWireframeName||"我會在送出提示詞時另外上傳"}`:""}

指定配色與用途：
${palette}
配色關係：${$("#colorHarmony option:checked").textContent}${extraDirection?`\n其他設計方向：${extraDirection}`:""}

請先理解專題內容，但必須遵守我選定的架構順序與色票用途。網站的主角是專題，不是貼圖；原創角色貼圖只是輔助視覺。

技術要求：
1. 只回傳一個完整的 HTML 程式碼區塊，必須包含 <!doctype html>、HTML、CSS 和需要的 JavaScript。
2. 這是一頁式網站，<main> 必須且只能有兩個直接子元素 <section>，不可增加第三個 Section。
3. 整份 HTML 只能出現這兩個 <section>；兩段內若要分組，請使用 <div> 或 <article>，不要使用巢狀 <section>。
4. 將上述希望包含的內容完整整理進這兩段，不可因為限制兩段就刪除內容。
5. 所有 CSS 與 JavaScript 都寫在同一個 HTML 裡，不使用 React、套件、CDN、外部字型或外部圖片。
6. 網站必須支援桌面與手機，文字不可重疊或超出畫面。
7. 使用有意義的標題、段落與按鈕，不要放 Lorem ipsum。
8. 不要設計登入、資料庫、表單送出或任何需要後端的功能。
9. 兩個 Section 各約一個瀏覽器畫面高，整個網站合計約兩個畫面；只保留整頁的一條主滾輪，每個 Section 內都不可出現獨立滾輪，不可使用 overflow: auto 或 overflow: scroll。
10. 每個 Section 最多一個主標題、一段短說明與三個重點。若內容放不下，請精簡文字與元件，不可裁切內容、縮成難讀小字或增加第三段。
11. 網站文字以我上方輸入的原文為準，保留專題名稱與問題敘述，不可自行改寫、延伸故事、虛構資料或增加未提供的事實。
12. 若版面需要短標籤或銜接語，所有由你新增、不是來自我輸入內容的中文字合計不得超過 50 字。

貼圖圖片要求：
- 我會同時上傳 01.png 到 08.png 八張透明貼圖，請先逐張分析角色的動作、表情與適合搭配的內容語境。
- 不要為了展示素材而全部放入。只選擇真正能幫助這個專題傳達資訊的貼圖，數量由你判斷，也可以重複使用合適的貼圖。
- 上傳檔名與網站相對路徑的對應如下：
${stickerPaths.map((path,index)=>`  ${String(index+1).padStart(2,"0")}.png → ${path}`).join("\n")}
- 只在 HTML 中引用你選中的相對路徑，並為每張圖片加入符合情境的 alt 文字。
- 圖片使用 object-fit: contain，不要裁掉角色。

輸出前自行檢查：語意化 HTML、手機版斷點、色彩對比、圖片不變形、沒有外部依賴。`;
}

function defaultHtml(){
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>嘉義砂鍋魚湯</title><style>*{box-sizing:border-box}body{margin:0;color:#171717;font-family:Arial,sans-serif;background:#fff9ed}header{display:flex;justify-content:space-between;padding:20px 6vw;border-bottom:3px solid #171717;font-weight:900}.hero,.story{height:100svh;overflow:hidden}.hero{display:grid;grid-template-columns:65fr 35fr;align-items:center;padding:60px 6vw;background:#e8462f}.hero h1{margin:0;color:white;font-size:clamp(3.5rem,9vw,8rem);line-height:.9}.hero p{max-width:620px;color:white;font-size:1.2rem;line-height:1.7}.hero img{width:100%;max-height:440px;object-fit:contain}.story{display:grid;grid-template-columns:40fr 60fr;align-items:center;gap:40px;padding:70px 6vw}.story h2{font-size:clamp(2.5rem,5vw,5rem)}.details{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.details article{padding:18px;border:3px solid #171717;background:white}.details img{width:100px;height:100px;object-fit:contain}@media(max-width:700px){.hero,.story{grid-template-columns:1fr;padding:36px 7vw}.hero h1{font-size:3.5rem}.details{grid-template-columns:repeat(3,1fr)}.details article{padding:10px}.details img{width:62px;height:62px}}</style></head><body><header><span>嘉義砂鍋魚湯</span><span>PROJECT</span></header><main><section class="hero"><div><h1>嘉義砂鍋魚湯</h1><p>讓其他地區的人看見嘉義獨特味道。</p></div><img src="assets/sticker-01.png" alt="嘉義砂鍋魚湯角色貼圖"></section><section class="story"><div><h2>嘉義砂鍋魚湯</h2><p>外地旅客與喜歡台灣地方美食的人</p></div><div class="details"><article><img src="assets/sticker-03.png" alt="角色貼圖"><h3>料理特色</h3></article><article><h3>在地故事</h3></article><article><img src="assets/sticker-06.png" alt="角色貼圖"><h3>品嚐資訊</h3></article></div></section></main></body></html>`;
}

function stripCodeFence(value){return value.trim().replace(/^```(?:html)?\s*/i,"").replace(/\s*```$/i,"");}
function ensureStickerGallery(html){
  return{html,injected:false,missing:0,used:countStickerPaths(html)};
}
function addPreviewSecurity(html){
  const policy=`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:; media-src data: blob:">`;
  const headOpen=html.toLowerCase().indexOf("<head>");
  return headOpen>=0?`${html.slice(0,headOpen+6)}${policy}${html.slice(headOpen+6)}`:`${policy}${html}`;
}
function currentHtml(){return stripCodeFence($("#htmlCode").value)||defaultHtml();}
function countStickerPaths(html){return stickerPaths.filter(path=>html.includes(path)).length;}
function inspectStructure(html){
  const documentCopy=new DOMParser().parseFromString(html,"text/html"),main=documentCopy.querySelector("main");
  const total=documentCopy.querySelectorAll("section").length;
  const direct=main?[...main.children].filter(element=>element.tagName==="SECTION").length:0;
  const complete=/<!doctype html>/i.test(html)&&/<html[\s>]/i.test(html)&&/<body[\s>]/i.test(html);
  return{total,direct,pass:complete&&total===2&&direct===2};
}
function previewHtml(){
  const completed=ensureStickerGallery(currentHtml());let html=completed.html;
  state.stickers.forEach((sticker,index)=>{html=html.split(stickerPaths[index]).join(sticker.dataUrl);});
  return{html:addPreviewSecurity(html),completed};
}
function updatePreview(){
  const source=currentHtml(),{html,completed}=previewHtml();$("#sitePreview").srcdoc=html;
  const structure=inspectStructure(source);
  $("#htmlCheck").classList.toggle("pass",structure.pass);$("#htmlCheck span").textContent=structure.pass?"完整 HTML｜2 個 Section":`目前 ${structure.total} 個 Section`;
  const found=countStickerPaths(source);$("#stickerCheck").classList.toggle("pass",found>0&&state.stickers.length===8);$("#stickerCheck span").textContent=state.sampleMode?`示範素材｜使用 ${found} 張`:`8 張已匯入｜使用 ${found} 張`;
  $("#injectionNote").textContent=found?`GPT 從八張素材中選用了 ${found} 張；工具不會自動補滿。`:`目前尚未使用貼圖，請 GPT 分析後至少選擇一張適合專題的圖片。`;
}
function toast(message){const element=$("#toast");element.textContent=message;element.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>element.classList.remove("show"),2300);}

function hexToRgb(hex){const value=parseInt(hex.slice(1),16);return{r:(value>>16)&255,g:(value>>8)&255,b:value&255};}
function rgbToHex({r,g,b}){return`#${[r,g,b].map(value=>Math.round(value).toString(16).padStart(2,"0")).join("")}`;}
function rgbToHsl({r,g,b}){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),light=(max+min)/2;let hue=0,saturation=0;if(max!==min){const delta=max-min;saturation=light>.5?delta/(2-max-min):delta/(max+min);if(max===r)hue=(g-b)/delta+(g<b?6:0);else if(max===g)hue=(b-r)/delta+2;else hue=(r-g)/delta+4;hue*=60;}return{h:hue,s:saturation*100,l:light*100};}
function hslToHex(h,s,l){h=((h%360)+360)%360;s/=100;l/=100;const chroma=(1-Math.abs(2*l-1))*s,x=chroma*(1-Math.abs((h/60)%2-1)),match=l-chroma/2;let rgb;if(h<60)rgb=[chroma,x,0];else if(h<120)rgb=[x,chroma,0];else if(h<180)rgb=[0,chroma,x];else if(h<240)rgb=[0,x,chroma];else if(h<300)rgb=[x,0,chroma];else rgb=[chroma,0,x];return rgbToHex({r:(rgb[0]+match)*255,g:(rgb[1]+match)*255,b:(rgb[2]+match)*255});}
function luminance(hex){const {r,g,b}=hexToRgb(hex);const values=[r,g,b].map(value=>{const channel=value/255;return channel<=.03928?channel/12.92:((channel+.055)/1.055)**2.4;});return .2126*values[0]+.7152*values[1]+.0722*values[2];}
function contrastRatio(first,second){const a=luminance(first),b=luminance(second);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
function wheelHarmonyPoints(hue,saturation){
  const harmony=$("#colorHarmony").value;
  if(harmony==="analogous")return[{h:hue,s:saturation},{h:hue+32,s:saturation},{h:hue-32,s:saturation}];
  if(harmony==="triadic")return[{h:hue,s:saturation},{h:hue+120,s:saturation},{h:hue+240,s:saturation}];
  if(harmony==="monochromatic")return[{h:hue,s:35},{h:hue,s:65},{h:hue,s:95}];
  return[{h:hue,s:saturation},{h:hue+180,s:saturation}];
}
function drawColorWheel(){
  const canvas=$("#colorWheel"),context=canvas.getContext("2d"),center=canvas.width/2,radius=center-12;
  context.clearRect(0,0,canvas.width,canvas.height);
  for(let degree=0;degree<360;degree+=1){const start=degree*Math.PI/180,end=(degree+1.5)*Math.PI/180;context.beginPath();context.moveTo(center,center);context.arc(center,center,radius,start,end);context.closePath();context.fillStyle=`hsl(${degree} 100% 50%)`;context.fill();}
  const fade=context.createRadialGradient(center,center,0,center,center,radius);fade.addColorStop(0,"rgba(255,255,255,1)");fade.addColorStop(.9,"rgba(255,255,255,0)");context.beginPath();context.arc(center,center,radius,0,Math.PI*2);context.fillStyle=fade;context.fill();
  context.beginPath();context.arc(center,center,radius,0,Math.PI*2);context.lineWidth=4;context.strokeStyle="#171717";context.stroke();
  const base=rgbToHsl(hexToRgb($("#baseColor").value)),points=wheelHarmonyPoints(base.h,base.s);
  const positions=points.map(point=>{const angle=point.h*Math.PI/180,distance=radius*Math.max(.08,point.s/100);return{x:center+Math.cos(angle)*distance,y:center+Math.sin(angle)*distance,point};});
  context.beginPath();positions.forEach((position,index)=>index?context.lineTo(position.x,position.y):context.moveTo(position.x,position.y));if(positions.length>2)context.closePath();context.lineWidth=3;context.strokeStyle="rgba(23,23,23,.72)";context.stroke();
  positions.forEach((position,index)=>{context.beginPath();context.arc(position.x,position.y,index===0?12:9,0,Math.PI*2);context.fillStyle=hslToHex(position.point.h,position.point.s,50);context.fill();context.lineWidth=index===0?5:3;context.strokeStyle=index===0?"#171717":"#ffffff";context.stroke();});
}
function chooseWheelColor(event){
  const canvas=$("#colorWheel"),bounds=canvas.getBoundingClientRect(),scaleX=canvas.width/bounds.width,scaleY=canvas.height/bounds.height,center=canvas.width/2,radius=center-12;
  let dx=(event.clientX-bounds.left)*scaleX-center,dy=(event.clientY-bounds.top)*scaleY-center,distance=Math.hypot(dx,dy);if(distance>radius){dx*=radius/distance;dy*=radius/distance;distance=radius;}
  const current=rgbToHsl(hexToRgb($("#baseColor").value)),hue=distance<4?current.h:(Math.atan2(dy,dx)*180/Math.PI+360)%360,saturation=Math.max(0,Math.min(100,distance/radius*100));
  $("#baseColor").value=hslToHex(hue,saturation,50);generatePalette();
}
function renderPalette(){
  $("#paletteSwatches").innerHTML=state.palette.map((color,index)=>`<label class="palette-color"><input type="color" value="${color}" data-palette-index="${index}" aria-label="${paletteRoles[index]}色"><span>${paletteRoles[index]}</span><code>${color}</code></label>`).join("");
  const ratio=contrastRatio(state.palette[0],state.palette[1]),result=$("#contrastResult");result.classList.toggle("good",ratio>=4.5);$("strong",result).textContent=`${ratio.toFixed(1)}:1`;$("small",result).textContent=ratio>=4.5?"一般文字通過 AA":"文字較難閱讀，請調整";
  $("#baseColorCode").textContent=$("#baseColor").value.toUpperCase();drawColorWheel();refreshPrompt();
}
function generatePalette(){
  const base=$("#baseColor").value,{h,s,l}=rgbToHsl(hexToRgb(base)),harmony=$("#colorHarmony").value;
  const offsets={complementary:[180,35],analogous:[32,-32],triadic:[120,240],monochromatic:[0,0]}[harmony];
  const accent=harmony==="monochromatic"?hslToHex(h,Math.max(25,s*.75),Math.min(68,l+20)):hslToHex(h+offsets[0],Math.max(48,s),Math.max(46,Math.min(62,l)));
  const highlight=harmony==="monochromatic"?hslToHex(h,Math.max(18,s*.45),88):hslToHex(h+offsets[1],Math.max(45,s*.8),78);
  state.palette=[hslToHex(h,Math.min(24,s*.35),96),hslToHex(h,Math.min(32,s*.45),12),base,accent,highlight];renderPalette();
}
async function copyPrompt(){const text=$("#websitePrompt").value;try{await navigator.clipboard.writeText(text);}catch{$("#websitePrompt").select();document.execCommand("copy");}toast("網站設計提示詞已複製");}
function refreshPrompt(){$("#websitePrompt").value=websitePrompt();}
[$("#projectTitle"),$("#projectProblem"),$("#projectAudience"),$("#projectSections")].forEach(input=>input.addEventListener("input",refreshPrompt));
$("#designDirection").addEventListener("input",refreshPrompt);$("#refreshWebsitePrompt").addEventListener("click",()=>{refreshPrompt();toast("提示詞已更新");});$("#copyWebsitePrompt").addEventListener("click",copyPrompt);
$("#openChatGPT").addEventListener("click",async()=>{await copyPrompt();window.open("https://chatgpt.com/","_blank","noopener,noreferrer");$("#promptStatus").textContent=state.architecture==="custom"?"已複製。請同時上傳架構草圖與 01.png 到 08.png，再貼上提示詞。":"已複製。請同時上傳 01.png 到 08.png，再貼上提示詞讓 GPT 挑選。";});

$("#wireframeOptions").addEventListener("click",event=>{const button=event.target.closest("[data-architecture]");if(!button)return;state.architecture=button.dataset.architecture;$$('.wireframe-card').forEach(card=>card.classList.toggle("active",card===button));refreshPrompt();});
$("#wireframeFile").addEventListener("change",event=>{const file=event.target.files[0];if(!file)return;state.architecture="custom";state.customWireframeName=file.name;const preview=$("#wireframePreview");preview.src=URL.createObjectURL(file);preview.style.display="block";$("#wireframeEmpty").style.display="none";$$('.wireframe-card').forEach(card=>card.classList.toggle("active",card.classList.contains("custom-wireframe")));refreshPrompt();toast("已選擇自訂架構草圖");});
$("#generatePalette").addEventListener("click",()=>{generatePalette();toast("已依色彩關係產生新色票");});
$("#baseColor").addEventListener("input",generatePalette);$("#colorHarmony").addEventListener("change",generatePalette);
$("#paletteSwatches").addEventListener("input",event=>{const input=event.target.closest("[data-palette-index]");if(!input)return;state.palette[Number(input.dataset.paletteIndex)]=input.value;renderPalette();});
let wheelDragging=false;
$("#colorWheel").addEventListener("pointerdown",event=>{wheelDragging=true;event.currentTarget.setPointerCapture(event.pointerId);chooseWheelColor(event);});
$("#colorWheel").addEventListener("pointermove",event=>{if(wheelDragging)chooseWheelColor(event);});
$("#colorWheel").addEventListener("pointerup",()=>{wheelDragging=false;});
$("#colorWheel").addEventListener("pointercancel",()=>{wheelDragging=false;});
$("#colorWheel").addEventListener("keydown",event=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key))return;event.preventDefault();const base=rgbToHsl(hexToRgb($("#baseColor").value));if(event.key==="ArrowLeft")base.h-=3;if(event.key==="ArrowRight")base.h+=3;if(event.key==="ArrowUp")base.s=Math.min(100,base.s+3);if(event.key==="ArrowDown")base.s=Math.max(0,base.s-3);$("#baseColor").value=hslToHex(base.h,base.s,50);generatePalette();});
$("#applyHtml").addEventListener("click",()=>{updatePreview();toast("本地預覽已更新");});
$("#htmlFile").addEventListener("change",async event=>{const file=event.target.files[0];if(!file)return;$("#htmlCode").value=await file.text();updatePreview();toast(`已載入 ${file.name}`);});

function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}
async function parseStickerZip(file){
  const bytes=new Uint8Array(await file.arrayBuffer()),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),decoder=new TextDecoder(),entries=[];let offset=0;
  while(offset+30<=bytes.length&&view.getUint32(offset,true)===0x04034b50){
    const flags=view.getUint16(offset+6,true),method=view.getUint16(offset+8,true),compressedSize=view.getUint32(offset+18,true),uncompressedSize=view.getUint32(offset+22,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true);
    if(flags&0x08)throw new Error("請先解壓縮，再選擇八張 PNG");
    const name=decoder.decode(bytes.slice(offset+30,offset+30+nameLength)),dataStart=offset+30+nameLength+extraLength,compressed=bytes.slice(dataStart,dataStart+compressedSize);let content;
    if(method===0)content=compressed;else if(method===8&&typeof DecompressionStream!=="undefined"){const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));content=new Uint8Array(await new Response(stream).arrayBuffer());if(uncompressedSize&&content.length!==uncompressedSize)throw new Error("ZIP 解壓縮失敗");}else throw new Error("請先解壓縮，再選擇八張 PNG");
    if(/(^|\/)\d{2}\.png$/i.test(name))entries.push(new File([content],name.split("/").pop(),{type:"image/png"}));offset=dataStart+compressedSize;
  }
  return entries.slice(0,8);
}
async function useStickerFiles(files){
  const pngFiles=files.filter(file=>file.type==="image/png"||file.name.toLowerCase().endsWith(".png")).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})).slice(0,8);
  if(pngFiles.length!==8)throw new Error("請選擇八張 PNG，或上一堂下載的 ZIP");
  state.stickers=await Promise.all(pngFiles.map(async file=>({name:file.name,blob:file,dataUrl:await blobToDataUrl(file)})));state.sampleMode=false;renderTray();updatePreview();$("#uploadStatus").textContent="八張貼圖已成為素材庫，網站只顯示 GPT 選中的圖片。";toast("貼圖素材庫已匯入");
}
function renderTray(){$("#stickerTray").innerHTML=state.stickers.map((sticker,index)=>`<img src="${sticker.dataUrl}" alt="第 ${index+1} 張貼圖">`).join("");}
$("#stickerFiles").addEventListener("change",async event=>{const files=[...event.target.files];if(!files.length)return;try{await useStickerFiles(files.length===1&&files[0].name.toLowerCase().endsWith(".zip")?await parseStickerZip(files[0]):files);}catch(error){$("#uploadStatus").textContent=error.message;toast(error.message);}});
$$('[data-viewport]').forEach(button=>button.addEventListener("click",()=>{$$('[data-viewport]').forEach(item=>item.classList.toggle("active",item===button));const mobile=button.dataset.viewport==="mobile";$("#previewStage").classList.toggle("mobile",mobile);if(mobile){$("#layoutCheck").classList.add("pass");$("#layoutCheck span").textContent="手機版已查看";}}));
$("#fullscreenPreview").addEventListener("click",async()=>{const stage=$("#previewStage");try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen();}catch{toast("瀏覽器未允許全螢幕，請改用新分頁預覽");}});
document.addEventListener("fullscreenchange",()=>{$("#fullscreenPreview span").textContent=document.fullscreenElement?"離開全螢幕":"全螢幕";});
$("#openPreviewTab").addEventListener("click",()=>{const blob=new Blob([previewHtml().html],{type:"text/html;charset=utf-8"}),url=URL.createObjectURL(blob),tab=window.open(url,"_blank");if(!tab)toast("瀏覽器阻擋新分頁，請允許彈出視窗");setTimeout(()=>URL.revokeObjectURL(url),60000);});

const crcTable=(()=>{const table=new Uint32Array(256);for(let index=0;index<256;index+=1){let value=index;for(let bit=0;bit<8;bit+=1)value=(value&1)?(0xedb88320^(value>>>1)):(value>>>1);table[index]=value>>>0;}return table;})();
function crc32(bytes){let value=0xffffffff;for(const byte of bytes)value=crcTable[(value^byte)&0xff]^(value>>>8);return(value^0xffffffff)>>>0;}
function createStoredZip(files){const encoder=new TextEncoder(),localParts=[],centralParts=[];let offset=0;files.forEach(({name,bytes})=>{const filename=encoder.encode(name),checksum=crc32(bytes),local=new Uint8Array(30+filename.length),lv=new DataView(local.buffer);lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x0800,true);lv.setUint32(14,checksum,true);lv.setUint32(18,bytes.length,true);lv.setUint32(22,bytes.length,true);lv.setUint16(26,filename.length,true);local.set(filename,30);localParts.push(local,bytes);const central=new Uint8Array(46+filename.length),cv=new DataView(central.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x0800,true);cv.setUint32(16,checksum,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);cv.setUint16(28,filename.length,true);cv.setUint32(42,offset,true);central.set(filename,46);centralParts.push(central);offset+=local.length+bytes.length;});const centralSize=centralParts.reduce((sum,part)=>sum+part.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);return new Blob([...localParts,...centralParts,end],{type:"application/zip"});}
function downloadBlob(blob,filename){const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);}
$("#downloadSite").addEventListener("click",async()=>{if(!state.stickers.length)return;const source=currentHtml();if(!inspectStructure(source).pass){updatePreview();toast("請先把網站調整成剛好兩個 Section");return;}const usedIndexes=stickerPaths.map((path,index)=>source.includes(path)?index:-1).filter(index=>index>=0);if(!usedIndexes.length){updatePreview();toast("請先讓 GPT 選擇至少一張適合的貼圖");return;}const button=$("#downloadSite");button.disabled=true;button.textContent="正在整理網站…";const completed=ensureStickerGallery(source),files=[{name:"index.html",bytes:new TextEncoder().encode(completed.html)}];for(const index of usedIndexes)files.push({name:stickerPaths[index],bytes:new Uint8Array(await state.stickers[index].blob.arrayBuffer())});files.push({name:"README.txt",bytes:new TextEncoder().encode(`這是 GPT 設計並在本地確認的一頁式網站，內容固定為兩個 Section，共使用 ${usedIndexes.length} 張貼圖。\n上架：前往 https://vercel.com/drop，拖入此 ZIP，命名後按 Deploy。\n`)});downloadBlob(createStoredZip(files),"gpt-project-website.zip");button.disabled=false;button.textContent="下載 GPT 網站 ZIP";toast("網站 ZIP 已完成，下一步到 Vercel Drop");});
async function loadSample(){state.stickers=await Promise.all(Array.from({length:8},async(_,index)=>{const name=`${String(index+1).padStart(2,"0")}.png`,response=await fetch(`/tutorial/line-sticker/assets/sample-stickers/${name}`),blob=await response.blob(),dataUrl=await blobToDataUrl(blob);return{name,blob,dataUrl};}));$("#htmlCode").value=defaultHtml();renderTray();refreshPrompt();updatePreview();}
generatePalette();
loadSample().catch(()=>{$("#htmlCode").value=defaultHtml();refreshPrompt();updatePreview();});

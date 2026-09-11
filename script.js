const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  drawing: null,
  gridImage: null,
  stickers: [],
  gridLines: {
    vertical: [1 / 3, 2 / 3],
    horizontal: [1 / 3, 2 / 3]
  },
  draggingLine: null,
  mainIndex: 0,
  tabIndex: 0
};
const promptBaselines = {};

const defaultActions = ["開心揮手", "大笑", "謝謝", "對不起", "加油", "驚訝", "生氣", "疲累", "比讚"];
const actionEditor = $("#actionEditor");

defaultActions.forEach((action, index) => {
  const label = document.createElement("label");
  label.className = "action-field";
  label.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><input type="text" value="${action}" aria-label="第 ${index + 1} 格動作" />`;
  actionEditor.append(label);
});

function characterPrompt() {
  const extra = $("#characterFeatures").value.trim();
  const style = $("#characterStyle").value;
  return `請根據我上傳的手繪草圖，整理成原創角色三視圖設定圖。

目標：產生同一角色的正面、側面與背面，三個視角並排，角色比例、服裝、髮型、道具與表情特徵必須一致。

必須保留：手繪草圖中的基礎形狀、輪廓、表情、五官、服裝、道具與手繪感。${extra ? `\n補充的重要外觀：${extra}` : ""}

視覺整理：${style}。

限制：不要重新設計成不同角色，不要改變頭身比例，不要增加草圖中沒有的不必要裝飾，不要加入文字或背景場景。不要模仿任何知名角色、品牌角色或特定插畫家風格。

版面：白色背景，正面、側面、背面完整呈現，角色不可互相重疊，四周保留空間。`;
}

function gridPrompt() {
  const actions = $$(".action-field input").map((input, index) => `${index + 1}. ${input.value.trim() || "自由動作"}`).join("\n");
  return `請參考我在這個對話中上傳的角色三視圖，產生一張 3 × 3 九宮格角色動作圖，共九個獨立畫面。

角色一致性：九格都是三視圖中的同一個原創角色，只改變動作與表情。完整保留頭身比例、輪廓、五官、髮型、服裝、配色與道具。

九個動作：
${actions}

版面限制：
- 正方形畫布，精準排列成等大的 3 × 3 九宮格。
- 每格只能有一個完整角色，角色置中且不可跨越格子。
- 每格四周保留足夠空白，任何身體或道具都不能被裁掉。
- 不要畫格線、邊框、編號、陰影、文字或說明。
- 九格使用相同的單一純白背景，方便後續自動去背。

角色限制：不要重新設計角色，不要改變頭身比例、五官、髮型、服裝、配色與道具。不要合併動作，不要新增其他角色。`;
}

function productPrompt() {
  return `請觀察我在這個對話中上傳的原創角色與 LINE 貼圖圖片，協助撰寫中英文商品名稱與介紹。

寫作要求：
- 中文名稱簡短好記，能看出角色或專題主題。
- 英文名稱自然易懂，不要只做生硬的逐字翻譯。
- 中文介紹簡潔說明角色特色、主題與適合使用的日常情境。
- 英文介紹與中文意思一致，但使用自然英文。
- 不要模仿、提及或暗示任何知名角色、品牌或作品。
- 不要加入未提供的人物背景、獎項、店家資訊或其他虛構設定。

只回傳以下四個欄位，不要加前言、編號或 Markdown：
中文貼圖名稱：
英文貼圖名稱：
中文介紹：
英文介紹：`;
}

function updatePrompts() {
  $("#characterPrompt").value = characterPrompt();
  $("#gridPrompt").value = gridPrompt();
  $("#productPrompt").value = productPrompt();
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 2400);
}

async function copyText(id) {
  const text = $(`#${id}`).value;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = $(`#${id}`);
    input.select();
    document.execCommand("copy");
  }
  toast("提示詞已複製");
}

function anonymousSessionId() {
  const key = "lineWorkshopAnonymousSession";
  try {
    let sessionId = sessionStorage.getItem(key);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(key, sessionId);
    }
    return sessionId;
  } catch {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function logPromptUse(promptId, action) {
  const prompt = $(`#${promptId}`)?.value;
  if (!prompt) return;

  fetch("/tutorial/line-sticker/api/log-prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      promptId,
      action,
      prompt,
      baselinePrompt: promptBaselines[promptId] || prompt,
      sessionId: anonymousSessionId(),
      pagePath: window.location.pathname
    }),
    keepalive: true
  }).catch(() => {});
}

$("#refreshCharacterPrompt").addEventListener("click", () => {
  $("#characterPrompt").value = characterPrompt();
  toast("角色提示詞已更新");
});
$("#refreshGridPrompt").addEventListener("click", () => {
  $("#gridPrompt").value = gridPrompt();
  toast("九宮格提示詞已更新");
});
$("#refreshProductPrompt").addEventListener("click", () => {
  $("#productPrompt").value = productPrompt();
  toast("商品文案提示詞已更新");
});
$("#characterFeatures").addEventListener("input", () => $("#characterPrompt").value = characterPrompt());
$("#characterStyle").addEventListener("change", () => $("#characterPrompt").value = characterPrompt());
actionEditor.addEventListener("input", () => $("#gridPrompt").value = gridPrompt());

$$('[data-copy]').forEach((button) => button.addEventListener("click", async () => {
  await copyText(button.dataset.copy);
  logPromptUse(button.dataset.copy, "copy");
}));
$$('.open-chatgpt').forEach((button) => button.addEventListener("click", async () => {
  await copyText(button.dataset.prompt);
  logPromptUse(button.dataset.prompt, "copy_open_chatgpt");
  window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
  const statusId = button.dataset.status || (button.dataset.prompt === "characterPrompt" ? "characterStatus" : "gridStatus");
  const status = $(`#${statusId}`);
  status.textContent = button.dataset.prompt === "productPrompt"
    ? "已複製。請在 ChatGPT 貼上提示詞並送出，再將內容填入四個欄位。"
    : "已複製。請在 ChatGPT 上傳參考圖片、貼上提示詞並送出。";
}));

$$('[data-jump]').forEach((button) => button.addEventListener("click", () => {
  $(`#${button.dataset.jump}`).scrollIntoView({ behavior: "smooth" });
}));

const observer = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  $$(".route").forEach((route) => route.classList.toggle("active", route.dataset.jump === visible.target.dataset.step));
}, { threshold: [0.25, 0.55] });
$$('[data-step]').forEach((section) => observer.observe(section));

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = reject;
    image.src = url;
  });
}

function loadImageUrl(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

$("#drawingInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  state.drawing = file;
  const preview = $("#drawingPreview");
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
  $("#drawingEmpty").style.display = "none";
  const reminder = $("#drawingReminder");
  reminder.classList.add("ready");
  reminder.textContent = `已選擇 ${file.name}。為保護圖片，網站不會自動傳給 ChatGPT，請在新分頁手動上傳。`;
});

const gridCanvas = $("#gridCanvas");
const gridContext = gridCanvas.getContext("2d");

$("#gridInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    state.gridImage = await loadImageFile(file);
    resetGridLines();
    drawGridPreview();
    gridCanvas.style.display = "block";
    $("#gridEmpty").style.display = "none";
    $("#gridGuide").hidden = false;
    $("#processGrid").disabled = false;
    $("#resetGridLines").disabled = false;
    toast(`已載入 ${file.name}`);
  } catch {
    toast("無法讀取這張圖片，請改用 PNG 或 JPG");
  }
});

async function loadExampleGrid() {
  state.gridImage = await loadImageUrl("/tutorial/line-sticker/assets/example-grid.png");
  resetGridLines();
  drawGridPreview();
  gridCanvas.style.display = "block";
  $("#gridEmpty").style.display = "none";
  $("#gridGuide").hidden = false;
  $("#processGrid").disabled = false;
  $("#resetGridLines").disabled = false;
}

function drawGridPreview() {
  if (!state.gridImage) return;
  const image = state.gridImage;
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sx = (image.naturalWidth - side) / 2;
  const sy = (image.naturalHeight - side) / 2;
  gridContext.clearRect(0, 0, 720, 720);
  gridContext.drawImage(image, sx, sy, side, side, 0, 0, 720, 720);
  const xBounds = [0, ...state.gridLines.vertical.map((value) => value * 720), 720];
  const yBounds = [0, ...state.gridLines.horizontal.map((value) => value * 720), 720];
  gridCanvas.dataset.verticalLines = state.gridLines.vertical.join(",");
  gridCanvas.dataset.horizontalLines = state.gridLines.horizontal.join(",");
  const insetPercent = Number($("#insetRange").value) / 100;

  gridContext.save();
  gridContext.strokeStyle = "#f8c52b";
  gridContext.lineWidth = 3;
  gridContext.setLineDash([10, 8]);
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const width = xBounds[column + 1] - xBounds[column];
      const height = yBounds[row + 1] - yBounds[row];
      const insetX = width * insetPercent;
      const insetY = height * insetPercent;
      gridContext.strokeRect(
        xBounds[column] + insetX,
        yBounds[row] + insetY,
        Math.max(1, width - insetX * 2),
        Math.max(1, height - insetY * 2)
      );
    }
  }

  gridContext.strokeStyle = "#df3b2f";
  gridContext.fillStyle = "#fffaf0";
  gridContext.lineWidth = 6;
  gridContext.setLineDash([]);
  state.gridLines.vertical.forEach((value) => {
    const x = value * 720;
    gridContext.beginPath(); gridContext.moveTo(x, 0); gridContext.lineTo(x, 720); gridContext.stroke();
    gridContext.fillRect(x - 10, 350, 20, 20);
    gridContext.strokeRect(x - 10, 350, 20, 20);
  });
  state.gridLines.horizontal.forEach((value) => {
    const y = value * 720;
    gridContext.beginPath(); gridContext.moveTo(0, y); gridContext.lineTo(720, y); gridContext.stroke();
    gridContext.fillRect(350, y - 10, 20, 20);
    gridContext.strokeRect(350, y - 10, 20, 20);
  });
  gridContext.restore();
}

function resetGridLines() {
  state.gridLines.vertical = [1 / 3, 2 / 3];
  state.gridLines.horizontal = [1 / 3, 2 / 3];
}

function canvasPoint(event) {
  const bounds = gridCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) * gridCanvas.width / bounds.width,
    y: (event.clientY - bounds.top) * gridCanvas.height / bounds.height,
    hitRadius: 18 * gridCanvas.width / bounds.width
  };
}

function findGridLine(point) {
  const candidates = [
    ...state.gridLines.vertical.map((value, index) => ({ axis: "vertical", index, distance: Math.abs(point.x - value * 720) })),
    ...state.gridLines.horizontal.map((value, index) => ({ axis: "horizontal", index, distance: Math.abs(point.y - value * 720) }))
  ].sort((a, b) => a.distance - b.distance);
  return candidates[0]?.distance <= point.hitRadius ? candidates[0] : null;
}

gridCanvas.addEventListener("pointerdown", (event) => {
  if (!state.gridImage) return;
  const line = findGridLine(canvasPoint(event));
  if (!line) return;
  event.preventDefault();
  state.draggingLine = line;
  gridCanvas.setPointerCapture(event.pointerId);
  gridCanvas.classList.add("is-adjusting");
});

gridCanvas.addEventListener("click", (event) => {
  if (state.gridImage) event.preventDefault();
});

gridCanvas.addEventListener("pointermove", (event) => {
  const point = canvasPoint(event);
  if (!state.draggingLine) {
    const line = findGridLine(point);
    gridCanvas.style.cursor = line ? (line.axis === "vertical" ? "col-resize" : "row-resize") : "crosshair";
    return;
  }

  const { axis, index } = state.draggingLine;
  const lines = state.gridLines[axis];
  const position = (axis === "vertical" ? point.x : point.y) / 720;
  const minimum = index === 0 ? 0.12 : lines[index - 1] + 0.12;
  const maximum = index === lines.length - 1 ? 0.88 : lines[index + 1] - 0.12;
  lines[index] = Math.min(maximum, Math.max(minimum, position));
  drawGridPreview();
});

function stopDragging(event) {
  if (!state.draggingLine) return;
  state.draggingLine = null;
  gridCanvas.classList.remove("is-adjusting");
  if (gridCanvas.hasPointerCapture(event.pointerId)) gridCanvas.releasePointerCapture(event.pointerId);
}

gridCanvas.addEventListener("pointerup", stopDragging);
gridCanvas.addEventListener("pointercancel", stopDragging);

$("#resetGridLines").addEventListener("click", () => {
  resetGridLines();
  drawGridPreview();
  toast("切割線已重設為平均九宮格");
});

$("#insetRange").addEventListener("input", (event) => {
  $("#insetValue").value = `${event.target.value}%`;
  drawGridPreview();
});
$("#toleranceRange").addEventListener("input", (event) => $("#toleranceValue").value = event.target.value);

function cropCell(image, index, insetPercent) {
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const startX = (image.naturalWidth - side) / 2;
  const startY = (image.naturalHeight - side) / 2;
  const row = Math.floor(index / 3);
  const column = index % 3;
  const xBounds = [0, ...state.gridLines.vertical, 1];
  const yBounds = [0, ...state.gridLines.horizontal, 1];
  const cellX = xBounds[column] * side;
  const cellY = yBounds[row] * side;
  const cellWidth = (xBounds[column + 1] - xBounds[column]) * side;
  const cellHeight = (yBounds[row + 1] - yBounds[row]) * side;
  const insetX = cellWidth * insetPercent / 100;
  const insetY = cellHeight * insetPercent / 100;
  const sourceWidth = Math.max(1, cellWidth - insetX * 2);
  const sourceHeight = Math.max(1, cellHeight - insetY * 2);
  const scale = Math.min(1, 600 / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(
    image,
    startX + cellX + insetX,
    startY + cellY + insetY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return canvas;
}

function removeEdgeBackground(canvas, tolerance) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
  const samples = corners.map(([x, y]) => {
    const offset = (y * width + x) * 4;
    return [data[offset], data[offset + 1], data[offset + 2]];
  });
  let head = 0;
  let tail = 0;

  const isBackground = (pixelIndex) => {
    const offset = pixelIndex * 4;
    if (data[offset + 3] < 16) return true;
    return samples.some(([r, g, b]) => Math.max(Math.abs(data[offset] - r), Math.abs(data[offset + 1] - g), Math.abs(data[offset + 2] - b)) <= tolerance);
  };
  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (visited[index] || !isBackground(index)) return;
    visited[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x += 1) { enqueue(x, 0); enqueue(x, height - 1); }
  for (let y = 0; y < height; y += 1) { enqueue(0, y); enqueue(width - 1, y); }
  while (head < tail) {
    const index = queue[head++];
    data[index * 4 + 3] = 0;
    const x = index % width;
    const y = Math.floor(index / width);
    enqueue(x + 1, y); enqueue(x - 1, y); enqueue(x, y + 1); enqueue(x, y - 1);
  }
  context.putImageData(imageData, 0, 0);
}

function fitForLine(source) {
  const canvas = document.createElement("canvas");
  canvas.width = 370;
  canvas.height = 320;
  const context = canvas.getContext("2d");
  const maxWidth = 350;
  const maxHeight = 300;
  const scale = Math.min(maxWidth / source.width, maxHeight / source.height);
  const width = Math.round(source.width * scale);
  const height = Math.round(source.height * scale);
  context.drawImage(source, Math.round((370 - width) / 2), Math.round((320 - height) / 2), width, height);
  return canvas;
}

function trimTransparentArea(source) {
  const context = source.getContext("2d", { willReadFrequently: true });
  const { data } = context.getImageData(0, 0, source.width, source.height);
  let left = source.width;
  let top = source.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      if (data[(y * source.width + x) * 4 + 3] <= 8) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) return source;
  const canvas = document.createElement("canvas");
  canvas.width = right - left + 1;
  canvas.height = bottom - top + 1;
  canvas.getContext("2d").drawImage(source, left, top, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function fitAsset(source, width, height, safeMargin) {
  const trimmedSource = trimTransparentArea(source);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const maxWidth = width - safeMargin * 2;
  const maxHeight = height - safeMargin * 2;
  const scale = Math.min(maxWidth / trimmedSource.width, maxHeight / trimmedSource.height);
  const outputWidth = Math.round(trimmedSource.width * scale);
  const outputHeight = Math.round(trimmedSource.height * scale);
  context.drawImage(trimmedSource, Math.round((width - outputWidth) / 2), Math.round((height - outputHeight) / 2), outputWidth, outputHeight);
  return canvas;
}

function drawAssetPreviews() {
  if (!state.stickers.length) return;
  const main = fitAsset(state.stickers[state.mainIndex].canvas, 240, 240, 10);
  const tab = fitAsset(state.stickers[state.tabIndex].canvas, 96, 74, 4);
  const mainPreview = $("#mainPreview");
  const tabPreview = $("#tabPreview");
  mainPreview.getContext("2d").clearRect(0, 0, 240, 240);
  mainPreview.getContext("2d").drawImage(main, 0, 0);
  tabPreview.getContext("2d").clearRect(0, 0, 96, 74);
  tabPreview.getContext("2d").drawImage(tab, 0, 0);
  $("#mainChoiceLabel").textContent = `使用第 ${String(state.mainIndex + 1).padStart(2, "0")} 張`;
  $("#tabChoiceLabel").textContent = `使用第 ${String(state.tabIndex + 1).padStart(2, "0")} 張`;
  $("#assetPicks").hidden = false;
}

function canvasBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function createStoredZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach(({ name, bytes }) => {
    const filename = encoder.encode(name);
    const checksum = crc32(bytes);
    const local = new Uint8Array(30 + filename.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, bytes.length, true);
    localView.setUint32(22, bytes.length, true);
    localView.setUint16(26, filename.length, true);
    local.set(filename, 30);
    localParts.push(local, bytes);

    const central = new Uint8Array(46 + filename.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, bytes.length, true);
    centralView.setUint32(24, bytes.length, true);
    centralView.setUint16(28, filename.length, true);
    centralView.setUint32(42, offset, true);
    central.set(filename, 46);
    centralParts.push(central);
    offset += local.length + bytes.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}

$("#processGrid").addEventListener("click", async () => {
  if (!state.gridImage) return;
  const button = $("#processGrid");
  button.disabled = true;
  button.textContent = "正在整理九個格子…";
  const inset = Number($("#insetRange").value);
  const tolerance = Number($("#toleranceRange").value);
  const shouldRemove = $("#removeBackground").checked;
  state.stickers = [];
  state.mainIndex = 0;
  state.tabIndex = 0;

  await new Promise((resolve) => requestAnimationFrame(resolve));
  for (let index = 0; index < 9; index += 1) {
    const crop = cropCell(state.gridImage, index, inset);
    if (shouldRemove) removeEdgeBackground(crop, tolerance);
    const canvas = fitForLine(crop);
    state.stickers.push({ canvas, selected: index < 8 });
  }
  renderStickers();
  button.disabled = false;
  button.textContent = "重新切割九張貼圖";
  toast("九張貼圖已完成，請選出八張");
});

function renderStickers() {
  const container = $("#stickerResults");
  container.innerHTML = "";
  state.stickers.forEach((sticker, index) => {
    const card = document.createElement("article");
    card.className = "sticker-card";
    const displayCanvas = sticker.canvas;
    const meta = document.createElement("div");
    meta.className = "sticker-meta";
    meta.innerHTML = `<label><input type="checkbox" ${sticker.selected ? "checked" : ""} data-select="${index}" /> 第 ${String(index + 1).padStart(2, "0")} 張</label><button class="download-one" type="button" data-download="${index}">PNG ↓</button><div class="asset-choice-buttons"><button type="button" data-asset="main" data-index="${index}">主圖</button><button type="button" data-asset="tab" data-index="${index}">小圖</button></div>`;
    card.append(displayCanvas, meta);
    container.append(card);
  });
  $("#downloadBar").hidden = false;
  updateAssetButtons();
  drawAssetPreviews();
  updateSelectedCount();
}

function updateAssetButtons() {
  $$('[data-asset="main"]', $("#stickerResults")).forEach((button) => button.classList.toggle("active", Number(button.dataset.index) === state.mainIndex));
  $$('[data-asset="tab"]', $("#stickerResults")).forEach((button) => button.classList.toggle("active", Number(button.dataset.index) === state.tabIndex));
}

function updateSelectedCount() {
  const count = state.stickers.filter((sticker) => sticker.selected).length;
  $("#selectedCount").textContent = count;
  $("#downloadZip").disabled = count !== 8;
}

$("#stickerResults").addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-select]");
  if (!checkbox) return;
  const index = Number(checkbox.dataset.select);
  const selectedCount = state.stickers.filter((sticker) => sticker.selected).length;
  if (checkbox.checked && selectedCount >= 8) {
    checkbox.checked = false;
    toast("LINE 貼圖組請選擇八張");
    return;
  }
  state.stickers[index].selected = checkbox.checked;
  updateSelectedCount();
});

function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

$("#stickerResults").addEventListener("click", async (event) => {
  const assetButton = event.target.closest("[data-asset]");
  if (assetButton) {
    const index = Number(assetButton.dataset.index);
    if (assetButton.dataset.asset === "main") state.mainIndex = index;
    if (assetButton.dataset.asset === "tab") state.tabIndex = index;
    updateAssetButtons();
    drawAssetPreviews();
    toast(`${assetButton.dataset.asset === "main" ? "主圖" : "小圖"}已改用第 ${String(index + 1).padStart(2, "0")} 張`);
    return;
  }
  const button = event.target.closest("[data-download]");
  if (!button) return;
  const index = Number(button.dataset.download);
  downloadBlob(await canvasBlob(state.stickers[index].canvas), `${String(index + 1).padStart(2, "0")}.png`);
});

$("#downloadMain").addEventListener("click", async () => {
  const canvas = fitAsset(state.stickers[state.mainIndex].canvas, 240, 240, 10);
  downloadBlob(await canvasBlob(canvas), "main.png");
});

$("#downloadTab").addEventListener("click", async () => {
  const canvas = fitAsset(state.stickers[state.tabIndex].canvas, 96, 74, 4);
  downloadBlob(await canvasBlob(canvas), "tab.png");
});

$("#downloadZip").addEventListener("click", async () => {
  const selected = state.stickers.filter((sticker) => sticker.selected);
  if (selected.length !== 8) return;
  const button = $("#downloadZip");
  button.disabled = true;
  button.textContent = "正在打包…";
  const files = [];
  for (let index = 0; index < selected.length; index += 1) {
    const blob = await canvasBlob(selected[index].canvas);
    files.push({ name: `${String(index + 1).padStart(2, "0")}.png`, bytes: new Uint8Array(await blob.arrayBuffer()) });
  }
  const mainBlob = await canvasBlob(fitAsset(state.stickers[state.mainIndex].canvas, 240, 240, 10));
  const tabBlob = await canvasBlob(fitAsset(state.stickers[state.tabIndex].canvas, 96, 74, 4));
  files.push({ name: "main.png", bytes: new Uint8Array(await mainBlob.arrayBuffer()) });
  files.push({ name: "tab.png", bytes: new Uint8Array(await tabBlob.arrayBuffer()) });
  files.push({
    name: "README.txt",
    bytes: new TextEncoder().encode("LINE 靜態貼圖\n8 張透明 PNG：01.png–08.png，每張 370 x 320 px\n主圖：main.png，240 x 240 px\n聊天室小圖：tab.png，96 x 74 px\n請在上架前再次確認角色沒有被裁切。\n")
  });
  downloadBlob(createStoredZip(files), "line-stickers-8.zip");
  button.disabled = false;
  button.textContent = "下載完整 LINE 貼圖 ZIP";
  toast("八張貼圖、主圖與小圖已打包完成");
});

updatePrompts();
for (const promptId of ["characterPrompt", "gridPrompt", "productPrompt"]) {
  promptBaselines[promptId] = $(`#${promptId}`).value;
}
loadExampleGrid().catch(() => toast("範例九宮格載入失敗，請改為上傳圖片"));

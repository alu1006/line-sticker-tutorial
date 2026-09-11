import { JWT } from "google-auth-library";
import { diffChars } from "diff";

const PROMPT_IDS = new Set(["characterPrompt", "gridPrompt", "productPrompt"]);
const ACTIONS = new Set(["copy", "copy_open_chatgpt"]);
const ALLOWED_HOSTS = new Set([
  "codinglu.tw",
  "www.codinglu.tw",
  "line-sticker-tutorial.vercel.app",
  "localhost:8790",
  "127.0.0.1:8790"
]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    return ALLOWED_HOSTS.has(new URL(origin).host);
  } catch {
    return false;
  }
}

function configuration() {
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!rawCredentials || !spreadsheetId) return null;

  const credentials = JSON.parse(rawCredentials);
  if (!credentials.client_email || !credentials.private_key) return null;

  const sheetId = Number(process.env.GOOGLE_SHEET_TAB_ID || 0);
  if (!Number.isInteger(sheetId) || sheetId < 0) return null;

  return {
    credentials,
    spreadsheetId,
    range: process.env.GOOGLE_SHEET_RANGE || "prompt_logs!A:F",
    sheetId
  };
}

export function changedTextFormatRuns(baseline, current) {
  let currentIndex = 0;
  const changedRanges = [];

  for (const part of diffChars(baseline, current)) {
    if (part.removed) continue;
    const start = currentIndex;
    currentIndex += part.value.length;
    if (part.added && currentIndex > start) changedRanges.push([start, currentIndex]);
  }

  if (!changedRanges.length) return [];

  const normal = {
    foregroundColorStyle: { rgbColor: { red: 0.09, green: 0.09, blue: 0.09 } },
    bold: false
  };
  const changed = {
    foregroundColorStyle: { rgbColor: { red: 0.86, green: 0.12, blue: 0.08 } },
    bold: true
  };
  const runs = [];
  if (changedRanges[0][0] > 0) runs.push({ startIndex: 0, format: normal });

  changedRanges.forEach(([start, end], index) => {
    runs.push({ startIndex: start, format: changed });
    const nextStart = changedRanges[index + 1]?.[0];
    if (end < current.length && end !== nextStart) runs.push({ startIndex: end, format: normal });
  });

  return runs;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!isAllowedOrigin(request.headers.origin)) {
    return response.status(403).json({ error: "Origin not allowed" });
  }

  const { promptId, action, prompt, baselinePrompt, sessionId, pagePath } = request.body || {};
  if (
    !PROMPT_IDS.has(promptId) ||
    !ACTIONS.has(action) ||
    typeof prompt !== "string" ||
    !prompt.trim() ||
    prompt.length > 20000 ||
    typeof baselinePrompt !== "string" ||
    baselinePrompt.length > 20000 ||
    typeof sessionId !== "string" ||
    !/^[a-zA-Z0-9-]{8,80}$/.test(sessionId) ||
    typeof pagePath !== "string" ||
    pagePath.length > 200
  ) {
    return response.status(400).json({ error: "Invalid prompt event" });
  }

  let config;
  try {
    config = configuration();
  } catch {
    return response.status(503).json({ error: "Prompt logging is not configured" });
  }
  if (!config) return response.status(503).json({ error: "Prompt logging is not configured" });

  try {
    const client = new JWT({
      email: config.credentials.client_email,
      key: config.credentials.private_key.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
    const range = encodeURIComponent(config.range);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/${range}:append`;

    const savedPrompt = prompt.trim();
    const appendResult = await client.request({
      url,
      method: "POST",
      params: { valueInputOption: "RAW", insertDataOption: "INSERT_ROWS" },
      data: {
        majorDimension: "ROWS",
        values: [[new Date().toISOString(), sessionId, promptId, action, savedPrompt, pagePath]]
      }
    });

    const textFormatRuns = changedTextFormatRuns(baselinePrompt.trim(), savedPrompt);
    const updatedRange = appendResult.data?.updates?.updatedRange || "";
    const rowMatch = updatedRange.match(/![A-Z]+(\d+):[A-Z]+\d+$/i);

    if (rowMatch) {
      const rowIndex = Number(rowMatch[1]) - 1;
      const requests = [{
        repeatCell: {
          range: {
            sheetId: config.sheetId,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1,
            startColumnIndex: 0,
            endColumnIndex: 6
          },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: { red: 1, green: 1, blue: 1 } },
              textFormat: {
                foregroundColorStyle: { rgbColor: { red: 0.09, green: 0.09, blue: 0.09 } },
                bold: false
              },
              verticalAlignment: "TOP",
              wrapStrategy: "WRAP"
            }
          },
          fields: "userEnteredFormat(backgroundColorStyle,textFormat,verticalAlignment,wrapStrategy)"
        }
      }];

      if (textFormatRuns.length) {
        requests.push({
          updateCells: {
            start: {
              sheetId: config.sheetId,
              rowIndex,
              columnIndex: 4
            },
            rows: [{
              values: [{
                userEnteredValue: { stringValue: savedPrompt },
                textFormatRuns
              }]
            }],
            fields: "userEnteredValue,textFormatRuns"
          }
        });
      }

      await client.request({
        url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}:batchUpdate`,
        method: "POST",
        data: { requests }
      });
    }

    return response.status(201).json({ saved: true, highlighted: textFormatRuns.length > 0 });
  } catch (error) {
    console.error("Prompt log append failed", error?.message || error);
    return response.status(502).json({ error: "Unable to save prompt event" });
  }
}

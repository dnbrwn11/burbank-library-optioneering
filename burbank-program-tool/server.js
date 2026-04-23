require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const client = new Anthropic({ apiKey: API_KEY });
const MODEL = 'claude-opus-4-5';

function assertKey(res) {
  if (!API_KEY) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not set. Add it to your environment variables.' });
    return false;
  }
  return true;
}

function friendlyError(err) {
  const msg = err?.message || 'Unknown error';
  const s = err?.status;
  if (s === 401 || /invalid.*api.*key|unauthorized/i.test(msg))
    return { status: 401, body: { error: 'Anthropic API key is invalid or expired.' } };
  if (s === 429 || /rate.*limit/i.test(msg))
    return { status: 429, body: { error: 'Rate limited by Anthropic API. Wait a moment and try again.' } };
  if (/timeout/i.test(msg))
    return { status: 504, body: { error: 'Claude API call timed out after 60 seconds.' } };
  return { status: 500, body: { error: msg } };
}

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const startArr = candidate.indexOf('[');
  let first = start === -1 ? startArr : startArr === -1 ? start : Math.min(start, startArr);
  if (first === -1) return null;
  const close = candidate[first] === '{' ? '}' : ']';
  const last = candidate.lastIndexOf(close);
  if (last === -1) return null;
  try { return JSON.parse(candidate.slice(first, last + 1)); } catch { return null; }
}

async function timedClaude(params) {
  return Promise.race([
    client.messages.create(params),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Claude API timeout after 60 seconds')), 60000)
    )
  ]);
}

app.get('/health',     (req, res) => res.json({ status: 'ok', model: MODEL, keyPresent: !!API_KEY }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', model: MODEL, keyPresent: !!API_KEY }));

app.post('/api/generate-program', async (req, res) => {
  if (!assertKey(res)) return;
  try {
    const { description, totalSF, budget, buildingType } = req.body || {};
    if (!description || !totalSF || !budget || !buildingType)
      return res.status(400).json({ error: 'Missing required fields: description, totalSF, budget, buildingType' });

    const response = await timedClaude({
      model: MODEL,
      max_tokens: 4096,
      system: 'You are a senior architectural programmer specializing in civic and institutional buildings. You generate realistic, detailed architectural programs for design-build projects. You always return strict, valid JSON.',
      messages: [{
        role: 'user',
        content: `Generate a detailed architectural program for:
Building Type: ${buildingType}
Target GSF: ${totalSF}
Budget: $${Number(budget).toLocaleString()}
Description: ${description}

Return ONLY valid JSON (no prose, no markdown fences):
{
  "spaces": [
    {
      "id": "s1",
      "category": "Public Spaces" | "Children & Teen" | "Staff & Operations" | "Special Facilities" | "Parking & Circulation" | "Support Spaces",
      "name": "Space Name",
      "qty": 1,
      "unitSF": 0,
      "unitCostMid": 0,
      "phase": "Phase 1" | "Phase 2" | "Optional" | "Alternate",
      "notes": "short rationale"
    }
  ]
}
Rules: 15-25 line items. unitCostLow = mid*0.85, unitCostHigh = mid*1.15 (UI calculates these). Non-parking spaces sum to ~65-75% of target GSF. Use current civic construction pricing. Short stable ids.`
      }]
    });

    const text = response.content?.map(b => b.text || '').join('') || '';
    const parsed = extractJson(text);
    if (!parsed || !Array.isArray(parsed.spaces))
      return res.status(502).json({ error: 'Model did not return valid program JSON', raw: text.slice(0, 500) });
    res.json({ program: parsed, model: MODEL });
  } catch (err) {
    console.error('generate-program:', err.message);
    const { status, body } = friendlyError(err);
    res.status(status).json(body);
  }
});

app.post('/api/suggest', async (req, res) => {
  if (!assertKey(res)) return;
  try {
    const { currentProgram, request } = req.body || {};
    if (!currentProgram || !request)
      return res.status(400).json({ error: 'Missing required fields: currentProgram, request' });

    const response = await timedClaude({
      model: MODEL,
      max_tokens: 2048,
      system: 'You are an expert architectural programmer helping a design-build team refine a civic building program. You make precise, minimal changes based on natural language requests. You always return strict, valid JSON.',
      messages: [{
        role: 'user',
        content: `Current program (JSON):
${JSON.stringify(currentProgram, null, 2)}

User request: "${request}"

Return ONLY valid JSON:
{
  "changes": [
    {
      "op": "add" | "modify" | "delete",
      "targetId": "existing-id-if-modify-or-delete",
      "space": { "id":"...", "category":"...", "name":"...", "qty":1, "unitSF":0, "unitCostMid":0, "phase":"Phase 1", "notes":"..." },
      "rationale": "one sentence"
    }
  ],
  "summary": "one sentence describing overall intent"
}
Rules: delete → targetId only, no space. modify → targetId + full updated space. add → fresh id like "new1", no targetId. Minimal changes only.`
      }]
    });

    const text = response.content?.map(b => b.text || '').join('') || '';
    const parsed = extractJson(text);
    if (!parsed || !Array.isArray(parsed.changes))
      return res.status(502).json({ error: 'Model did not return valid changes JSON', raw: text.slice(0, 500) });
    res.json({ ...parsed, model: MODEL });
  } catch (err) {
    console.error('suggest:', err.message);
    const { status, body } = friendlyError(err);
    res.status(status).json(body);
  }
});

app.post('/api/narrative', async (req, res) => {
  if (!assertKey(res)) return;
  try {
    const { program, scenarioName } = req.body || {};
    if (!program) return res.status(400).json({ error: 'Missing required field: program' });

    const response = await timedClaude({
      model: MODEL,
      max_tokens: 2048,
      system: 'You are a senior design-build preconstruction director writing for civic stakeholders (City Council, Library Board, community). Tone: professional, grounded, plainspoken. Never flowery.',
      messages: [{
        role: 'user',
        content: `Write a stakeholder program narrative for:
Scenario: ${scenarioName || 'Current Program'}
Program: ${JSON.stringify(program, null, 2)}

Structure with these markdown headings:
## Executive Summary
## Program Highlights
## Operational & Phasing Strategy
## Cost Position
## Risks & Considerations

Under 500 words. Return only the markdown text.`
      }]
    });

    const text = response.content?.map(b => b.text || '').join('') || '';
    res.json({ narrative: text, model: MODEL });
  } catch (err) {
    console.error('narrative:', err.message);
    const { status, body } = friendlyError(err);
    res.status(status).json(body);
  }
});

app.listen(PORT, () => {
  console.log(`PCL Architectural Program Tool → http://localhost:${PORT}`);
  console.log(`Model: ${MODEL} | Key loaded: ${!!API_KEY}`);
  if (!API_KEY) console.warn('WARN: ANTHROPIC_API_KEY missing — /api/* will return 500.');
});

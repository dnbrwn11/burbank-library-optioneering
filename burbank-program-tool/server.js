require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-opus-4-5';

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const startArr = candidate.indexOf('[');
  let first = -1;
  if (start === -1) first = startArr;
  else if (startArr === -1) first = start;
  else first = Math.min(start, startArr);
  if (first === -1) return null;
  const open = candidate[first];
  const close = open === '{' ? '}' : ']';
  const last = candidate.lastIndexOf(close);
  if (last === -1) return null;
  const slice = candidate.slice(first, last + 1);
  try {
    return JSON.parse(slice);
  } catch (e) {
    return null;
  }
}

app.post('/api/generate-program', async (req, res) => {
  try {
    const { description, totalSF, budget, buildingType } = req.body || {};
    if (!description || !totalSF || !budget || !buildingType) {
      return res.status(400).json({ error: 'Missing required fields: description, totalSF, budget, buildingType' });
    }

    const systemPrompt = `You are a senior architectural programmer specializing in civic and institutional buildings. You generate realistic, detailed architectural programs for design-build projects. You have deep knowledge of PLA (Public Library Association) standards, civic program benchmarks, and construction cost data. You always return strict, valid JSON.`;

    const userPrompt = `Generate a detailed architectural program for the following project:

Building Type: ${buildingType}
Target Total Gross Square Footage: ${totalSF} GSF
Budget: $${Number(budget).toLocaleString()}
Description / Special Requirements: ${description}

Return ONLY a valid JSON object (no prose, no markdown fences) with this exact structure:

{
  "spaces": [
    {
      "id": "unique-short-id",
      "category": "Public Spaces" | "Children & Teen" | "Staff & Operations" | "Special Facilities" | "Parking & Circulation" | "Support Spaces",
      "name": "Space Name",
      "qty": 1,
      "unitSF": 0,
      "unitCostLow": 0,
      "unitCostMid": 0,
      "unitCostHigh": 0,
      "phase": "Phase 1" | "Phase 2" | "Optional" | "Alternate",
      "notes": "short rationale"
    }
  ]
}

Rules:
- Include 15-25 individual line items covering realistic program components.
- unitSF is per-unit (multiply by qty in the UI).
- Unit costs are per SF in USD and should reflect current civic construction pricing in the project's region.
- Exclude site/plaza/parking from gross building SF calculations (categorize as "Parking & Circulation" with a note).
- Ensure the sum of (qty * unitSF) for non-parking/plaza spaces is roughly 65-75% of target GSF (the rest is gross-to-net overhead).
- Use short stable ids like "s1", "s2", etc.`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const text = response.content?.map(b => b.text || '').join('') || '';
    const parsed = extractJson(text);
    if (!parsed || !Array.isArray(parsed.spaces)) {
      return res.status(502).json({ error: 'Model did not return valid program JSON', raw: text });
    }
    res.json({ program: parsed, model: MODEL });
  } catch (err) {
    console.error('generate-program error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.post('/api/suggest', async (req, res) => {
  try {
    const { currentProgram, request } = req.body || {};
    if (!currentProgram || !request) {
      return res.status(400).json({ error: 'Missing required fields: currentProgram, request' });
    }

    const systemPrompt = `You are an expert architectural programmer helping a design-build team refine a civic building program. You make precise, surgical changes to a program based on the user's natural language request. You always return strict, valid JSON that lists only the changes (not the entire program).`;

    const userPrompt = `Here is the current program (JSON):
${JSON.stringify(currentProgram, null, 2)}

The user requests: "${request}"

Return ONLY a valid JSON object (no prose, no markdown fences) describing the changes:

{
  "changes": [
    {
      "op": "add" | "modify" | "delete",
      "targetId": "existing-id-if-modify-or-delete",
      "space": {
        "id": "new-or-existing-id",
        "category": "Public Spaces" | "Children & Teen" | "Staff & Operations" | "Special Facilities" | "Parking & Circulation" | "Support Spaces",
        "name": "Space Name",
        "qty": 1,
        "unitSF": 0,
        "unitCostLow": 0,
        "unitCostMid": 0,
        "unitCostHigh": 0,
        "phase": "Phase 1" | "Phase 2" | "Optional" | "Alternate",
        "notes": "short rationale for the change"
      },
      "rationale": "one sentence explaining this specific change"
    }
  ],
  "summary": "one sentence describing the overall intent"
}

Rules:
- For "delete", include targetId and omit "space" (or set to null).
- For "modify", include targetId AND the full updated "space" object.
- For "add", generate a fresh short id like "new1", "new2" and omit targetId.
- Use realistic civic construction cost ranges per SF.
- Make MINIMAL changes — only what the request explicitly asks for.`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const text = response.content?.map(b => b.text || '').join('') || '';
    const parsed = extractJson(text);
    if (!parsed || !Array.isArray(parsed.changes)) {
      return res.status(502).json({ error: 'Model did not return valid changes JSON', raw: text });
    }
    res.json({ ...parsed, model: MODEL });
  } catch (err) {
    console.error('suggest error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.post('/api/narrative', async (req, res) => {
  try {
    const { program, scenarioName } = req.body || {};
    if (!program) return res.status(400).json({ error: 'Missing required field: program' });

    const systemPrompt = `You are a senior design-build preconstruction director writing for civic stakeholders (City Council, Library Board, community). You write clear, confident, plainspoken narratives that translate architectural programs into a vision non-architects can rally behind. Tone: professional, grounded, construction-industry appropriate — never flowery.`;

    const userPrompt = `Write a stakeholder-ready program narrative for the following scenario.

Scenario Name: ${scenarioName || 'Current Program'}
Program (JSON):
${JSON.stringify(program, null, 2)}

Structure your response with these sections (use markdown headings):

## Executive Summary
2-3 sentences: total SF, total budget, and the strategic intent.

## Program Highlights
Bullet list of 5-7 signature spaces and why they matter to the community.

## Operational & Phasing Strategy
One paragraph on how Phase 1 vs Phase 2 / Alternates support the project.

## Cost Position
One paragraph referencing cost per GSF and value drivers.

## Risks & Considerations
3-4 bullets flagging schedule, cost, or programmatic risks a design-build team should watch.

Keep the whole narrative under 500 words. Return only the markdown text, no preamble.`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const text = response.content?.map(b => b.text || '').join('') || '';
    res.json({ narrative: text, model: MODEL });
  } catch (err) {
    console.error('narrative error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, model: MODEL, hasKey: !!process.env.ANTHROPIC_API_KEY });
});

app.listen(PORT, () => {
  console.log(`PCL Architectural Program Tool running on http://localhost:${PORT}`);
  console.log(`Model: ${MODEL}`);
  console.log(`ANTHROPIC_API_KEY loaded: ${!!process.env.ANTHROPIC_API_KEY}`);
});

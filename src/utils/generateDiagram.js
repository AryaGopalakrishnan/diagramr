const EDGE_FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagram-api`

const SYSTEM_PROMPT = `You are a process diagram generator. Return ONLY valid JSON, no markdown, no backticks, no explanation.

Output format:
{ "nodes": [{ "id": "1", "label": "Step name", "type": "start|end|process|decision|inputOutput", "position": { "x": 250, "y": 50 } }], "edges": [{ "id": "e1-2", "source": "1", "target": "2", "label": "" }] }

Rules:
- Every diagram needs exactly one start and one end node
- Use decision type for yes/no branching — label edges "Yes" / "No"
- Use inputOutput for data inputs or outputs
- Keep labels short (max 5 words)
- Space nodes: x 100–600, y increments of 120px
- Use 6–12 nodes`

const DECISION_TREE_PROMPT = `You are a decision tree diagram generator. Return ONLY valid JSON, no markdown, no backticks, no explanation.

Output format:
{ "nodes": [{ "id": "1", "label": "Question", "type": "start|end|process|decision", "position": { "x": 400, "y": 50 } }], "edges": [{ "id": "e1-2", "source": "1", "target": "2", "label": "Yes" }] }

Rules:
- Root node at x:400, y:50
- Use decision type for every branching question
- Label all edges from decision nodes with "Yes" or "No"
- Branch left (x-200) for "No", right (x+200) for "Yes"
- Each branch ends with an end node showing the outcome
- Use 8–14 nodes to show a meaningful tree`

const ROADMAP_PROMPT = `You are a roadmap diagram generator. Return ONLY valid JSON, no markdown, no backticks, no explanation.

Output format:
{ "nodes": [{ "id": "1", "label": "Phase name", "type": "start|end|process", "position": { "x": 50, "y": 50 } }], "edges": [{ "id": "e1-2", "source": "1", "target": "2", "label": "" }] }

Rules:
- Lay out phases LEFT TO RIGHT: x increments of 220px, y alternates between 50 and 170 for sub-items within a phase
- Group milestones under each phase
- Use process type for milestones and deliverables
- Start node is the project kickoff, end node is the final release/launch
- Use 10–16 nodes across 3–5 phases`

const PLANNING_PROMPT = `You are a sprint/project planning diagram generator. Return ONLY valid JSON, no markdown, no backticks, no explanation.

Output format:
{ "nodes": [{ "id": "1", "label": "Activity", "type": "start|end|process|decision", "position": { "x": 250, "y": 50 } }], "edges": [{ "id": "e1-2", "source": "1", "target": "2", "label": "" }] }

Rules:
- Show the planning cycle: kickoff → backlog → tasks → review → decision → next iteration or complete
- Use decision nodes for gates like "On Track?", "Goals Met?", "Approved?"
- Show feedback loops (e.g. retry or re-plan arrows going back up)
- Keep labels short and action-oriented
- Use 10–14 nodes`

const SWIMLANE_SYSTEM_PROMPT = `You are a swimlane diagram generation assistant.

Return ONLY raw JSON with no markdown, no code blocks, no explanation. Use this EXACT structure:
{
  "lanes": [
    { "id": "l0", "name": "RoleName", "color": "#3B82F6" }
  ],
  "nodes": [
    {
      "id": "1",
      "type": "start",
      "position": { "x": 50, "y": 90 },
      "data": { "label": "Start", "lane": "RoleName", "laneIndex": 0 }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "label": "" }
  ]
}

Lane colors in order: #3B82F6, #10B981, #F59E0B, #8B5CF6, #EF4444, #06B6D4

POSITIONING RULES (strictly follow these):
- LANE_WIDTH = 240px per lane
- Header zone: y = 0–60 (reserved — place NO nodes here)
- First nodes: y = 90
- Vertical gap between nodes in the same lane: 130px
- Node centering formulas:
  - process node (width 180): x = laneIndex * 240 + 30
  - start/end node (width 140): x = laneIndex * 240 + 50
  - decision node (width 130): x = laneIndex * 240 + 55
  - inputOutput node (width 170): x = laneIndex * 240 + 35
- Every node MUST have data.lane (string) and data.laneIndex (number)
- Decision nodes: label "Yes" edges and "No" edges on outgoing connections
- Use 2–6 lanes. Use 5+ lanes only if the process genuinely requires them.
- Identify all distinct roles/actors mentioned and create one lane per role`

async function postJson(path, body) {
  const response = await fetch(`${EDGE_FN_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || err?.error || `API error: ${response.status}`)
  }
  return response.json()
}

function parseDiagramText(text) {
  if (!text) throw new Error('Empty response from AI.')
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  const parsed = JSON.parse(cleaned)
  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error('Invalid diagram structure returned.')
  }
  // Normalise: Groq may return { id, label, type } instead of { id, type, data: { label } }
  const nodes = parsed.nodes.map((n) => ({
    ...n,
    data: n.data ?? { label: n.label ?? '' },
    position: n.position ?? { x: 250, y: 50 },
  }))
  // Normalise edges: ensure id exists
  const edges = parsed.edges.map((e, i) => ({
    ...e,
    id: e.id ?? `e${i}`,
    label: e.label ?? '',
  }))
  return { nodes, edges, lanes: parsed.lanes || [] }
}

function getSystemPrompt(diagramType) {
  switch (diagramType) {
    case 'swimlane':     return SWIMLANE_SYSTEM_PROMPT
    case 'decision tree': return DECISION_TREE_PROMPT
    case 'roadmap':      return ROADMAP_PROMPT
    case 'planning':     return PLANNING_PROMPT
    default:             return SYSTEM_PROMPT
  }
}

export async function generateDiagram(prompt, diagramType = 'decision tree') {
  const systemPrompt = getSystemPrompt(diagramType)
  const data = await postJson('/generate-diagram', { prompt, diagramType, systemPrompt })
  return parseDiagramText(data.content?.[0]?.text?.trim())
}

export async function detectDiagramType(text) {
  try {
    return await postJson('/detect-type', { text })
  } catch {
    return { type: 'Flowchart', confidence: 0.5, reason: 'Detection failed' }
  }
}

export async function refineDiagramWithDiff(currentDiagram, refinementRequest, diagramType, originalPrompt) {
  const data = await postJson('/refine-diagram', {
    currentDiagram,
    refinementRequest,
    diagramType,
    originalPrompt,
  })
  const raw = data.content?.[0]?.text?.trim()
  if (!raw) throw new Error('Empty refine response.')
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const parsed = JSON.parse(cleaned)
  return {
    nodes: parsed.diagram?.nodes || parsed.nodes || [],
    edges: parsed.diagram?.edges || parsed.edges || [],
    lanes: parsed.diagram?.lanes || parsed.lanes || [],
    changes: parsed.changes || [],
    suggestion: parsed.suggestion || '',
  }
}

export async function exportToConfluence({ baseUrl, email, apiToken, spaceKey, pageTitle, parentPage, nodes, edges }) {
  return postJson('/confluence-export', { baseUrl, email, apiToken, spaceKey, pageTitle, parentPage, nodes, edges })
}

export async function extractJiraTasks(nodes, edges) {
  const data = await postJson('/jira-extract-tasks', { nodes, edges })
  return data.tasks || []
}

export async function createJiraTickets({ baseUrl, email, apiToken, projectKey, tasks }) {
  return postJson('/jira-create-tickets', { baseUrl, email, apiToken, projectKey, tasks })
}

// Legacy — kept for backwards compat (RefinePanel previously called this)
export async function refineDiagram(originalPrompt, refineText, diagramType = 'decision tree') {
  const combinedPrompt = `${originalPrompt}\n\nRefinement request: ${refineText}`
  return generateDiagram(combinedPrompt, diagramType)
}

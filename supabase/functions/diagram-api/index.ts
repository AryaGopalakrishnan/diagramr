import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callGroq(
  system: string,
  userMessage: string,
  maxTokens = 2000
) {
  const apiKey = Deno.env.get("VITE_GROQ_API_KEY");
  if (!apiKey) {
    throw new Error("VITE_GROQ_API_KEY is not configured");
  }
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || `Groq API error: ${response.status}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/diagram-api/, "");

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json();

    if (path === "/generate-diagram" || path === "" || path === "/") {
      const { prompt, diagramType, systemPrompt } = body;
      const text = await callGroq(
        systemPrompt,
        `Create a ${diagramType} diagram for: ${prompt}`,
        2000
      );
      return jsonResponse({ content: [{ text }] });
    }

    if (path === "/detect-type") {
      const { text } = body;
      if (!text || text.trim().length < 5) {
        return jsonResponse({
          type: "Flowchart",
          confidence: 0.5,
          reason: "Too short",
        });
      }

      const system = `You are a diagram type classifier. Given a process description, return ONLY a JSON object with:
{ "type": "Flowchart"|"Process Flow"|"Decision Tree"|"Swimlane"|"Roadmap"|"Planning", "confidence": 0.0-1.0, "reason": "one sentence" }

Rules:
- Mentions roles, departments, "who does what" -> Swimlane
- Mentions phases, quarters, dates, milestones -> Roadmap
- Mentions yes/no, conditions, branching logic -> Decision Tree
- Mentions team rituals (retro, sprint, standup) -> Planning
- Mentions sequential steps with inputs/outputs -> Process Flow
- Default -> Flowchart
Return ONLY raw JSON, no markdown.`;

      const raw = await callGroq(system, text, 200);
      const cleaned = raw
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      return jsonResponse(JSON.parse(cleaned));
    }

    if (path === "/refine-diagram") {
      const { currentDiagram, refinementRequest, diagramType, originalPrompt } =
        body;

      const system = `You are a diagram refinement assistant. You receive a current diagram JSON and a refinement request.
Return ONLY raw JSON with this structure:
{
  "diagram": { "nodes": [...], "edges": [...] },
  "changes": [{ "type": "added"|"removed"|"modified", "nodeId": "...", "reason": "..." }],
  "suggestion": ""
}

Rules:
- Only modify what the user explicitly asked to change
- Preserve all existing nodes, labels, and connections unless asked to remove them
- Never rename existing nodes unless explicitly asked
- If the request is ambiguous, make the minimal change and put a clarifying question in "suggestion"
- Return full updated diagram JSON

Node types: start, end, process, decision, inputOutput
Position nodes with x: 100-700, y spaced ~120px apart.`;

      const userMsg = `Current diagram: ${JSON.stringify(currentDiagram)}

Original process: ${originalPrompt || "(not provided)"}
Diagram type: ${diagramType}
Refinement request: ${refinementRequest}`;

      const raw = await callGroq(system, userMsg, 3000);
      const cleaned = raw
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      return jsonResponse({ content: [{ text: JSON.stringify(parsed) }] });
    }

    if (path === "/jira-extract-tasks") {
      const { nodes, edges } = body;

      const system = `You are a task extraction assistant. Given a diagram JSON, extract actionable tasks.
Return ONLY raw JSON: { "tasks": [{ "nodeId": "...", "summary": "...", "description": "...", "priority": "High"|"Medium"|"Low", "suggested_type": "Task"|"Bug"|"Story" }] }

Rules:
- Only extract process and inputOutput nodes (not start, end, decision)
- Priority: High for early steps, Medium for middle, Low for later steps
- Description should mention what comes before and after the node in the flow
- Do NOT fabricate owners, dates, or details not in the diagram`;

      const raw = await callGroq(system, JSON.stringify({ nodes, edges }), 2000);
      const cleaned = raw
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      return jsonResponse(JSON.parse(cleaned));
    }

    if (path === "/confluence-export") {
      const {
        baseUrl,
        email,
        apiToken,
        spaceKey,
        pageTitle,
        parentPage,
        nodes,
        edges,
      } = body;

      const nodeStyles: Record<string, string> = {
        start:
          "ellipse;whiteSpace=wrap;html=1;fillColor=#22c55e;fontColor=#ffffff;strokeColor=#16a34a;",
        end: "ellipse;whiteSpace=wrap;html=1;fillColor=#ef4444;fontColor=#ffffff;strokeColor=#dc2626;",
        decision:
          "rhombus;whiteSpace=wrap;html=1;fillColor=#eab308;strokeColor=#ca8a04;",
        inputOutput:
          "parallelogram;whiteSpace=wrap;html=1;fillColor=#8b5cf6;fontColor=#ffffff;strokeColor=#7c3aed;",
        process:
          "rounded=1;whiteSpace=wrap;html=1;fillColor=#3b82f6;fontColor=#ffffff;strokeColor=#2563eb;",
      };

      const esc = (s: string) =>
        String(s || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

      const cells = nodes.map((n: any) => {
        const style = nodeStyles[n.type] || nodeStyles.process;
        const w = n.type === "decision" ? 140 : 160;
        const h = n.type === "decision" ? 80 : 60;
        return `<mxCell id="${esc(n.id)}" value="${esc(n.data?.label)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${n.position?.x || 0}" y="${n.position?.y || 0}" width="${w}" height="${h}" as="geometry"/></mxCell>`;
      });

      const edgeCells = edges.map((e: any) =>
        `<mxCell id="${esc(e.id)}" value="${esc(e.label)}" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" source="${esc(e.source)}" target="${esc(e.target)}" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>`
      );

      const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join("")}${edgeCells.join("")}</root></mxGraphModel>`;
      const xmlEncoded = btoa(xml);
      const pageBody = `<ac:structured-macro ac:name="drawio" ac:schema-version="1"><ac:parameter ac:name="diagramXml">${xmlEncoded}</ac:parameter></ac:structured-macro>`;

      const auth = btoa(`${email}:${apiToken}`);
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      };

      const searchUrl = `${baseUrl}/wiki/rest/api/content?title=${encodeURIComponent(pageTitle)}&spaceKey=${encodeURIComponent(spaceKey)}&expand=version`;
      const searchResp = await fetch(searchUrl, { headers });
      const searchData = await searchResp.json();
      const existing = searchData?.results?.[0];

      let pageUrl: string;
      if (existing) {
        const updateResp = await fetch(
          `${baseUrl}/wiki/rest/api/content/${existing.id}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({
              version: { number: (existing.version?.number || 0) + 1 },
              title: pageTitle,
              type: "page",
              body: {
                storage: { value: pageBody, representation: "storage" },
              },
            }),
          }
        );
        if (!updateResp.ok) {
          const e = await updateResp.json();
          return jsonResponse(
            { error: e?.message || "Failed to update Confluence page" },
            400
          );
        }
        const updated = await updateResp.json();
        pageUrl = `${baseUrl}/wiki${updated._links?.webui || ""}`;
      } else {
        const createBody: any = {
          type: "page",
          title: pageTitle,
          space: { key: spaceKey },
          body: { storage: { value: pageBody, representation: "storage" } },
        };
        if (parentPage) createBody.ancestors = [{ title: parentPage }];

        const createResp = await fetch(
          `${baseUrl}/wiki/rest/api/content`,
          { method: "POST", headers, body: JSON.stringify(createBody) }
        );
        if (!createResp.ok) {
          const e = await createResp.json();
          return jsonResponse(
            { error: e?.message || "Failed to create Confluence page" },
            400
          );
        }
        const created = await createResp.json();
        pageUrl = `${baseUrl}/wiki${created._links?.webui || ""}`;
      }

      return jsonResponse({ success: true, pageUrl });
    }

    if (path === "/jira-create-tickets") {
      const { baseUrl, email, apiToken, projectKey, tasks } = body;
      const auth = btoa(`${email}:${apiToken}`);
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      };

      const results: any[] = [];
      const errors: any[] = [];

      for (const task of tasks) {
        try {
          const resp = await fetch(`${baseUrl}/rest/api/3/issue`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              fields: {
                project: { key: projectKey },
                summary: task.summary,
                description: {
                  type: "doc",
                  version: 1,
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: task.description }],
                    },
                  ],
                },
                issuetype: {
                  name: task.issue_type || task.suggested_type || "Task",
                },
                priority: { name: task.priority || "Medium" },
              },
            }),
          });
          if (resp.ok) {
            const created = await resp.json();
            results.push({
              key: created.key,
              url: `${baseUrl}/browse/${created.key}`,
            });
          } else {
            const e = await resp.json();
            errors.push({
              summary: task.summary,
              error:
                e?.errors || e?.errorMessages?.join(", ") || "Unknown error",
            });
          }
        } catch (e: any) {
          errors.push({ summary: task.summary, error: e.message });
        }
      }

      return jsonResponse({
        created: results,
        errors,
        projectUrl: `${baseUrl}/jira/software/projects/${projectKey}`,
      });
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err: any) {
    console.error("Edge function error:", err);
    return jsonResponse({ error: err.message || "Internal server error" }, 500);
  }
});

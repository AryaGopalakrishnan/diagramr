import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function useRealApi() {
  return process.env.USE_REAL_API === 'true' && !!process.env.VITE_GROQ_API_KEY;
}

async function callClaude(system, userMessage, maxTokens = 2000) {
  const apiKey = process.env.VITE_GROQ_API_KEY;
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: userMessage },
      ],
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || `Groq API error: ${response.status}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ─── Mock helpers ────────────────────────────────────────────────────────────

function generateMockDiagram(prompt, diagramType) {
  const lower = prompt.toLowerCase();
  switch (diagramType) {
    case 'flowchart':      return generateFlowchart(lower);
    case 'process flow':   return generateProcessFlow(lower);
    case 'decision tree':  return generateDecisionTree(lower);
    case 'swimlane':       return generateSwimlane(lower);
    case 'roadmap':        return generateRoadmap(lower);
    case 'planning':       return generatePlanning(lower);
    default:               return generateFlowchart(lower);
  }
}

function detectTypeMock(text) {
  const lower = text.toLowerCase();
  if (/\b(role|department|swimlane|swim lane|who does|responsible|actor|lane)\b/.test(lower))
    return { type: 'Swimlane', confidence: 0.88, reason: 'Mentions roles or departments' };
  if (/\b(phase|quarter|q[1-4]|milestone|roadmap|timeline|deadline|release date)\b/.test(lower))
    return { type: 'Roadmap', confidence: 0.85, reason: 'Mentions phases or milestones' };
  if (/\b(if |yes.{0,20}no|condition|branch|criteria|whether|either.{0,20}or)\b/.test(lower))
    return { type: 'Decision Tree', confidence: 0.82, reason: 'Mentions conditions or branching logic' };
  if (/\b(retro|retrospective|sprint|standup|scrum|ceremony|agile|planning poker)\b/.test(lower))
    return { type: 'Planning', confidence: 0.87, reason: 'Mentions team rituals or agile ceremonies' };
  if (lower.length < 15)
    return { type: 'Flowchart', confidence: 0.52, reason: 'Text too short to determine type' };
  return { type: 'Flowchart', confidence: 0.75, reason: 'General process description' };
}

function refineMock(currentDiagram, request) {
  const lower = request.toLowerCase();
  const nodes = [...currentDiagram.nodes];
  const edges = [...currentDiagram.edges];
  const changes = [];

  if (/error|fail|exception|fallback|rollback/.test(lower)) {
    const lastNode = nodes[nodes.length - 1];
    const errId = `err-${Date.now()}`;
    const handlerId = `handler-${Date.now()}`;
    nodes.push({
      id: errId,
      type: 'decision',
      position: { x: (lastNode?.position?.x || 250) + 220, y: (lastNode?.position?.y || 300) },
      data: { label: 'Error?' },
    });
    nodes.push({
      id: handlerId,
      type: 'end',
      position: { x: (lastNode?.position?.x || 250) + 220, y: (lastNode?.position?.y || 300) + 130 },
      data: { label: 'Handle Error' },
    });
    edges.push({ id: `e-err-handler`, source: errId, target: handlerId, label: 'Yes' });
    changes.push({ type: 'added', nodeId: errId, reason: 'Added error decision node' });
    changes.push({ type: 'added', nodeId: handlerId, reason: 'Added error handler endpoint' });
  }

  return { diagram: { nodes, edges }, changes, suggestion: '' };
}

function toDrawioXml(nodes, edges) {
  const nodeStyles = {
    start:       'ellipse;whiteSpace=wrap;html=1;fillColor=#22c55e;fontColor=#ffffff;strokeColor=#16a34a;',
    end:         'ellipse;whiteSpace=wrap;html=1;fillColor=#ef4444;fontColor=#ffffff;strokeColor=#dc2626;',
    decision:    'rhombus;whiteSpace=wrap;html=1;fillColor=#eab308;strokeColor=#ca8a04;',
    inputOutput: 'parallelogram;whiteSpace=wrap;html=1;fillColor=#8b5cf6;fontColor=#ffffff;strokeColor=#7c3aed;',
    process:     'rounded=1;whiteSpace=wrap;html=1;fillColor=#3b82f6;fontColor=#ffffff;strokeColor=#2563eb;',
  };
  const escape = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const cells = nodes.map(n => {
    const style = nodeStyles[n.type] || nodeStyles.process;
    const w = n.type === 'decision' ? 140 : 160;
    const h = n.type === 'decision' ? 80 : 60;
    return `<mxCell id="${escape(n.id)}" value="${escape(n.data?.label)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${n.position?.x || 0}" y="${n.position?.y || 0}" width="${w}" height="${h}" as="geometry"/></mxCell>`;
  });
  const edgeCells = edges.map(e =>
    `<mxCell id="${escape(e.id)}" value="${escape(e.label)}" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" source="${escape(e.source)}" target="${escape(e.target)}" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>`
  );
  return `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join('')}${edgeCells.join('')}</root></mxGraphModel>`;
}

function extractTasksMock(nodes) {
  const actionTypes = ['process', 'inputOutput'];
  const actionNodes = nodes.filter(n => actionTypes.includes(n.type));
  return actionNodes.map((n, i) => ({
    nodeId: n.id,
    summary: n.data?.label || 'Untitled Task',
    description: `Task from diagram: ${n.data?.label}. This step is part of the process flow.`,
    priority: i < 2 ? 'High' : i < 4 ? 'Medium' : 'Low',
    suggested_type: 'Task',
  }));
}

// ─── Diagram generation mock functions ───────────────────────────────────────

function generateFlowchart(prompt) {
  if (prompt.includes('login') || prompt.includes('auth') || prompt.includes('sign in') || prompt.includes('password')) {
    return {
      nodes: [
        { id: '1', type: 'start',       position: { x: 250, y: 50  }, data: { label: 'User Visits Login Page' } },
        { id: '2', type: 'inputOutput',  position: { x: 250, y: 170 }, data: { label: 'Enter Email & Password' } },
        { id: '3', type: 'process',      position: { x: 250, y: 290 }, data: { label: 'Validate Input Format' } },
        { id: '4', type: 'decision',     position: { x: 250, y: 410 }, data: { label: 'Valid Format?' } },
        { id: '5', type: 'process',      position: { x: 450, y: 410 }, data: { label: 'Check Credentials' } },
        { id: '6', type: 'decision',     position: { x: 450, y: 530 }, data: { label: 'Credentials Match?' } },
        { id: '7', type: 'process',      position: { x: 450, y: 650 }, data: { label: 'Create Session Token' } },
        { id: '8', type: 'process',      position: { x: 250, y: 650 }, data: { label: 'Increment Fail Count' } },
        { id: '9', type: 'decision',     position: { x: 250, y: 770 }, data: { label: 'Attempts ≥ 5?' } },
        { id: '10', type: 'end',         position: { x: 450, y: 770 }, data: { label: 'Redirect to Dashboard' } },
        { id: '11', type: 'end',         position: { x: 50,  y: 770 }, data: { label: 'Lock Account' } },
        { id: '12', type: 'end',         position: { x: 50,  y: 410 }, data: { label: 'Show Validation Error' } },
      ],
      edges: [
        { id: 'e1-2',  source: '1',  target: '2',  label: '' },
        { id: 'e2-3',  source: '2',  target: '3',  label: '' },
        { id: 'e3-4',  source: '3',  target: '4',  label: '' },
        { id: 'e4-5',  source: '4',  target: '5',  label: 'Yes' },
        { id: 'e4-12', source: '4',  target: '12', label: 'No' },
        { id: 'e5-6',  source: '5',  target: '6',  label: '' },
        { id: 'e6-7',  source: '6',  target: '7',  label: 'Yes' },
        { id: 'e6-8',  source: '6',  target: '8',  label: 'No' },
        { id: 'e7-10', source: '7',  target: '10', label: '' },
        { id: 'e8-9',  source: '8',  target: '9',  label: '' },
        { id: 'e9-11', source: '9',  target: '11', label: 'Yes' },
        { id: 'e9-2',  source: '9',  target: '2',  label: 'No — Retry' },
      ],
    };
  }
  if (prompt.includes('order') || prompt.includes('checkout') || prompt.includes('purchase') || prompt.includes('shop') || prompt.includes('ecommerce')) {
    return {
      nodes: [
        { id: '1',  type: 'start',       position: { x: 250, y: 50  }, data: { label: 'Customer Adds to Cart' } },
        { id: '2',  type: 'process',     position: { x: 250, y: 170 }, data: { label: 'Review Cart' } },
        { id: '3',  type: 'inputOutput', position: { x: 250, y: 290 }, data: { label: 'Enter Shipping Details' } },
        { id: '4',  type: 'inputOutput', position: { x: 250, y: 410 }, data: { label: 'Enter Payment Info' } },
        { id: '5',  type: 'process',     position: { x: 250, y: 530 }, data: { label: 'Run Fraud Check' } },
        { id: '6',  type: 'decision',    position: { x: 250, y: 650 }, data: { label: 'Fraud Detected?' } },
        { id: '7',  type: 'process',     position: { x: 450, y: 650 }, data: { label: 'Charge Payment' } },
        { id: '8',  type: 'decision',    position: { x: 450, y: 770 }, data: { label: 'Payment Success?' } },
        { id: '9',  type: 'process',     position: { x: 450, y: 890 }, data: { label: 'Notify Warehouse' } },
        { id: '10', type: 'process',     position: { x: 450, y: 1010 }, data: { label: 'Send Confirmation Email' } },
        { id: '11', type: 'end',         position: { x: 450, y: 1130 }, data: { label: 'Order Complete' } },
        { id: '12', type: 'end',         position: { x: 50,  y: 650 }, data: { label: 'Flag & Cancel Order' } },
        { id: '13', type: 'end',         position: { x: 650, y: 770 }, data: { label: 'Prompt Retry Payment' } },
      ],
      edges: [
        { id: 'e1-2',   source: '1',  target: '2',  label: '' },
        { id: 'e2-3',   source: '2',  target: '3',  label: '' },
        { id: 'e3-4',   source: '3',  target: '4',  label: '' },
        { id: 'e4-5',   source: '4',  target: '5',  label: '' },
        { id: 'e5-6',   source: '5',  target: '6',  label: '' },
        { id: 'e6-7',   source: '6',  target: '7',  label: 'No' },
        { id: 'e6-12',  source: '6',  target: '12', label: 'Yes' },
        { id: 'e7-8',   source: '7',  target: '8',  label: '' },
        { id: 'e8-9',   source: '8',  target: '9',  label: 'Yes' },
        { id: 'e8-13',  source: '8',  target: '13', label: 'No' },
        { id: 'e9-10',  source: '9',  target: '10', label: '' },
        { id: 'e10-11', source: '10', target: '11', label: '' },
      ],
    };
  }
  // Default: CI/CD pipeline
  return {
    nodes: [
      { id: '1',  type: 'start',       position: { x: 250, y: 50  }, data: { label: 'Developer Pushes Code' } },
      { id: '2',  type: 'process',     position: { x: 250, y: 170 }, data: { label: 'Run Linter & Formatter' } },
      { id: '3',  type: 'process',     position: { x: 250, y: 290 }, data: { label: 'Run Unit Tests' } },
      { id: '4',  type: 'decision',    position: { x: 250, y: 410 }, data: { label: 'Tests Pass?' } },
      { id: '5',  type: 'process',     position: { x: 450, y: 410 }, data: { label: 'Build Docker Image' } },
      { id: '6',  type: 'process',     position: { x: 450, y: 530 }, data: { label: 'Push to Registry' } },
      { id: '7',  type: 'process',     position: { x: 450, y: 650 }, data: { label: 'Deploy to Staging' } },
      { id: '8',  type: 'process',     position: { x: 450, y: 770 }, data: { label: 'Run Integration Tests' } },
      { id: '9',  type: 'decision',    position: { x: 450, y: 890 }, data: { label: 'All Tests Green?' } },
      { id: '10', type: 'process',     position: { x: 450, y: 1010 }, data: { label: 'Deploy to Production' } },
      { id: '11', type: 'inputOutput', position: { x: 450, y: 1130 }, data: { label: 'Notify Team via Slack' } },
      { id: '12', type: 'end',         position: { x: 450, y: 1250 }, data: { label: 'Release Complete' } },
      { id: '13', type: 'end',         position: { x: 50,  y: 410  }, data: { label: 'Notify Developer' } },
      { id: '14', type: 'end',         position: { x: 650, y: 890  }, data: { label: 'Rollback & Alert' } },
    ],
    edges: [
      { id: 'e1-2',   source: '1',  target: '2',  label: '' },
      { id: 'e2-3',   source: '2',  target: '3',  label: '' },
      { id: 'e3-4',   source: '3',  target: '4',  label: '' },
      { id: 'e4-5',   source: '4',  target: '5',  label: 'Yes' },
      { id: 'e4-13',  source: '4',  target: '13', label: 'No' },
      { id: 'e5-6',   source: '5',  target: '6',  label: '' },
      { id: 'e6-7',   source: '6',  target: '7',  label: '' },
      { id: 'e7-8',   source: '7',  target: '8',  label: '' },
      { id: 'e8-9',   source: '8',  target: '9',  label: '' },
      { id: 'e9-10',  source: '9',  target: '10', label: 'Yes' },
      { id: 'e9-14',  source: '9',  target: '14', label: 'No' },
      { id: 'e10-11', source: '10', target: '11', label: '' },
      { id: 'e11-12', source: '11', target: '12', label: '' },
    ],
  };
}

function generateProcessFlow(prompt) {
  if (prompt && (prompt.includes('onboard') || prompt.includes('employee') || prompt.includes('hire') || prompt.includes('hr'))) {
    return {
      nodes: [
        { id: '1',  type: 'start',       position: { x: 250, y: 50  }, data: { label: 'Offer Accepted' } },
        { id: '2',  type: 'process',     position: { x: 250, y: 170 }, data: { label: 'Send Welcome Package' } },
        { id: '3',  type: 'inputOutput', position: { x: 250, y: 290 }, data: { label: 'Collect Documents' } },
        { id: '4',  type: 'process',     position: { x: 100, y: 410 }, data: { label: 'Set Up Accounts & Access' } },
        { id: '5',  type: 'process',     position: { x: 400, y: 410 }, data: { label: 'Provision Equipment' } },
        { id: '6',  type: 'process',     position: { x: 250, y: 530 }, data: { label: 'Schedule Orientation' } },
        { id: '7',  type: 'process',     position: { x: 250, y: 650 }, data: { label: 'Assign Buddy / Mentor' } },
        { id: '8',  type: 'decision',    position: { x: 250, y: 770 }, data: { label: '30-Day Check-in OK?' } },
        { id: '9',  type: 'process',     position: { x: 450, y: 770 }, data: { label: 'Complete Onboarding' } },
        { id: '10', type: 'process',     position: { x: 50,  y: 770 }, data: { label: 'Address Concerns' } },
        { id: '11', type: 'end',         position: { x: 450, y: 890 }, data: { label: 'Employee Active' } },
      ],
      edges: [
        { id: 'e1-2',  source: '1',  target: '2',  label: '' },
        { id: 'e2-3',  source: '2',  target: '3',  label: '' },
        { id: 'e3-4',  source: '3',  target: '4',  label: '' },
        { id: 'e3-5',  source: '3',  target: '5',  label: '' },
        { id: 'e4-6',  source: '4',  target: '6',  label: '' },
        { id: 'e5-6',  source: '5',  target: '6',  label: '' },
        { id: 'e6-7',  source: '6',  target: '7',  label: '' },
        { id: 'e7-8',  source: '7',  target: '8',  label: '' },
        { id: 'e8-9',  source: '8',  target: '9',  label: 'Yes' },
        { id: 'e8-10', source: '8',  target: '10', label: 'No' },
        { id: 'e10-6', source: '10', target: '6',  label: 'Re-schedule' },
        { id: 'e9-11', source: '9',  target: '11', label: '' },
      ],
    };
  }
  // Default: API data pipeline
  return {
    nodes: [
      { id: '1',  type: 'start',       position: { x: 250, y: 50   }, data: { label: 'Ingest Raw Data' } },
      { id: '2',  type: 'inputOutput', position: { x: 250, y: 170  }, data: { label: 'Parse & Deserialise' } },
      { id: '3',  type: 'process',     position: { x: 100, y: 290  }, data: { label: 'Schema Validation' } },
      { id: '4',  type: 'process',     position: { x: 400, y: 290  }, data: { label: 'Deduplicate Records' } },
      { id: '5',  type: 'decision',    position: { x: 250, y: 410  }, data: { label: 'Valid & Unique?' } },
      { id: '6',  type: 'process',     position: { x: 450, y: 410  }, data: { label: 'Enrich with Metadata' } },
      { id: '7',  type: 'process',     position: { x: 450, y: 530  }, data: { label: 'Transform to Target Schema' } },
      { id: '8',  type: 'inputOutput', position: { x: 450, y: 650  }, data: { label: 'Write to Data Warehouse' } },
      { id: '9',  type: 'process',     position: { x: 450, y: 770  }, data: { label: 'Trigger Downstream Jobs' } },
      { id: '10', type: 'end',         position: { x: 450, y: 890  }, data: { label: 'Pipeline Complete' } },
      { id: '11', type: 'inputOutput', position: { x: 50,  y: 410  }, data: { label: 'Send to Dead-Letter Queue' } },
    ],
    edges: [
      { id: 'e1-2',  source: '1',  target: '2',  label: '' },
      { id: 'e2-3',  source: '2',  target: '3',  label: '' },
      { id: 'e2-4',  source: '2',  target: '4',  label: '' },
      { id: 'e3-5',  source: '3',  target: '5',  label: '' },
      { id: 'e4-5',  source: '4',  target: '5',  label: '' },
      { id: 'e5-6',  source: '5',  target: '6',  label: 'Yes' },
      { id: 'e5-11', source: '5',  target: '11', label: 'No' },
      { id: 'e6-7',  source: '6',  target: '7',  label: '' },
      { id: 'e7-8',  source: '7',  target: '8',  label: '' },
      { id: 'e8-9',  source: '8',  target: '9',  label: '' },
      { id: 'e9-10', source: '9',  target: '10', label: '' },
    ],
  };
}

function generateDecisionTree() {
  return {
    nodes: [
      { id: '1',  type: 'start',    position: { x: 350, y: 50  }, data: { label: 'Support Ticket Received' } },
      { id: '2',  type: 'decision', position: { x: 350, y: 170 }, data: { label: 'Billing Issue?' } },
      { id: '3',  type: 'decision', position: { x: 100, y: 310 }, data: { label: 'Account Active?' } },
      { id: '4',  type: 'decision', position: { x: 600, y: 310 }, data: { label: 'Severity: High?' } },
      { id: '5',  type: 'process',  position: { x: 0,   y: 450 }, data: { label: 'Process Refund' } },
      { id: '6',  type: 'process',  position: { x: 200, y: 450 }, data: { label: 'Escalate to Finance' } },
      { id: '7',  type: 'process',  position: { x: 500, y: 450 }, data: { label: 'Page On-Call Engineer' } },
      { id: '8',  type: 'decision', position: { x: 700, y: 450 }, data: { label: 'Feature Request?' } },
      { id: '9',  type: 'end',      position: { x: 0,   y: 580 }, data: { label: 'Refund Issued' } },
      { id: '10', type: 'end',      position: { x: 200, y: 580 }, data: { label: 'Finance Team Notified' } },
      { id: '11', type: 'end',      position: { x: 500, y: 580 }, data: { label: 'Incident Created' } },
      { id: '12', type: 'end',      position: { x: 650, y: 580 }, data: { label: 'Add to Product Backlog' } },
      { id: '13', type: 'end',      position: { x: 800, y: 580 }, data: { label: 'Create Support Ticket' } },
    ],
    edges: [
      { id: 'e1-2',  source: '1',  target: '2',  label: '' },
      { id: 'e2-3',  source: '2',  target: '3',  label: 'Yes' },
      { id: 'e2-4',  source: '2',  target: '4',  label: 'No' },
      { id: 'e3-5',  source: '3',  target: '5',  label: 'Yes' },
      { id: 'e3-6',  source: '3',  target: '6',  label: 'No' },
      { id: 'e4-7',  source: '4',  target: '7',  label: 'Yes' },
      { id: 'e4-8',  source: '4',  target: '8',  label: 'No' },
      { id: 'e5-9',  source: '5',  target: '9',  label: '' },
      { id: 'e6-10', source: '6',  target: '10', label: '' },
      { id: 'e7-11', source: '7',  target: '11', label: '' },
      { id: 'e8-12', source: '8',  target: '12', label: 'Yes' },
      { id: 'e8-13', source: '8',  target: '13', label: 'No' },
    ],
  };
}

function generateSwimlane() {
  const SW = 240;
  const SH = 60;
  const SG = 130;

  const lanes = [
    { id: 'l0', name: 'Developer',   color: '#3B82F6' },
    { id: 'l1', name: 'QA Engineer', color: '#10B981' },
    { id: 'l2', name: 'DevOps',      color: '#F59E0B' },
    { id: 'l3', name: 'Stakeholder', color: '#8B5CF6' },
  ];

  function lx(laneIdx, type) {
    const w = type === 'decision' ? 130 : type === 'start' || type === 'end' ? 140 : 180;
    return laneIdx * SW + Math.floor((SW - w) / 2);
  }

  const y0 = SH + 30;
  const y1 = y0 + SG;
  const y2 = y1 + SG;
  const y3 = y2 + SG;
  const y4 = y3 + SG;
  const y5 = y4 + SG;

  const lc = (name, idx) => ({ lane: name, laneIndex: idx });

  return {
    lanes,
    nodes: [
      { id: '1',  type: 'start',    position: { x: lx(0,'start'),    y: y0 }, data: { label: 'Create Feature Branch',  ...lc('Developer', 0) } },
      { id: '2',  type: 'process',  position: { x: lx(0,'process'),  y: y1 }, data: { label: 'Write Code & Unit Tests', ...lc('Developer', 0) } },
      { id: '3',  type: 'process',  position: { x: lx(0,'process'),  y: y2 }, data: { label: 'Open Pull Request',       ...lc('Developer', 0) } },
      { id: '4',  type: 'process',  position: { x: lx(1,'process'),  y: y2 }, data: { label: 'Code Review & QA Testing', ...lc('QA Engineer', 1) } },
      { id: '5',  type: 'decision', position: { x: lx(1,'decision'), y: y3 }, data: { label: 'Tests Pass?',             ...lc('QA Engineer', 1) } },
      { id: '6',  type: 'process',  position: { x: lx(0,'process'),  y: y3 }, data: { label: 'Fix Reported Issues',     ...lc('Developer', 0) } },
      { id: '7',  type: 'process',  position: { x: lx(2,'process'),  y: y3 }, data: { label: 'Merge to Main & Build',   ...lc('DevOps', 2) } },
      { id: '8',  type: 'process',  position: { x: lx(2,'process'),  y: y4 }, data: { label: 'Deploy to Staging',       ...lc('DevOps', 2) } },
      { id: '9',  type: 'decision', position: { x: lx(3,'decision'), y: y4 }, data: { label: 'Approved?',               ...lc('Stakeholder', 3) } },
      { id: '10', type: 'process',  position: { x: lx(2,'process'),  y: y5 }, data: { label: 'Deploy to Production',    ...lc('DevOps', 2) } },
      { id: '11', type: 'end',      position: { x: lx(2,'end'),      y: y5 + SG }, data: { label: 'Released',           ...lc('DevOps', 2) } },
    ],
    edges: [
      { id: 'e1-2',  source: '1',  target: '2',  label: '' },
      { id: 'e2-3',  source: '2',  target: '3',  label: '' },
      { id: 'e3-4',  source: '3',  target: '4',  label: '' },
      { id: 'e4-5',  source: '4',  target: '5',  label: '' },
      { id: 'e5-6',  source: '5',  target: '6',  label: 'No' },
      { id: 'e6-3',  source: '6',  target: '3',  label: 'Re-submit' },
      { id: 'e5-7',  source: '5',  target: '7',  label: 'Yes' },
      { id: 'e7-8',  source: '7',  target: '8',  label: '' },
      { id: 'e8-9',  source: '8',  target: '9',  label: '' },
      { id: 'e9-10', source: '9',  target: '10', label: 'Yes' },
      { id: 'e9-8',  source: '9',  target: '8',  label: 'No — Fix & Redeploy' },
      { id: 'e10-11',source: '10', target: '11', label: '' },
    ],
  };
}

function generateRoadmap() {
  return {
    nodes: [
      { id: '1',  type: 'start',   position: { x: 50,  y: 50  }, data: { label: 'Kickoff' } },
      { id: '2',  type: 'process', position: { x: 50,  y: 170 }, data: { label: 'User Research & Interviews' } },
      { id: '3',  type: 'process', position: { x: 50,  y: 290 }, data: { label: 'Define MVP Scope' } },
      { id: '4',  type: 'process', position: { x: 50,  y: 410 }, data: { label: 'Q1 — Discovery Complete' } },
      { id: '5',  type: 'process', position: { x: 300, y: 50  }, data: { label: 'Wireframes & Prototypes' } },
      { id: '6',  type: 'process', position: { x: 300, y: 170 }, data: { label: 'Design System Setup' } },
      { id: '7',  type: 'process', position: { x: 300, y: 290 }, data: { label: 'Stakeholder Sign-off' } },
      { id: '8',  type: 'process', position: { x: 300, y: 410 }, data: { label: 'Q2 — Design Complete' } },
      { id: '9',  type: 'process', position: { x: 550, y: 50  }, data: { label: 'Core Feature Development' } },
      { id: '10', type: 'process', position: { x: 550, y: 170 }, data: { label: 'API Integration' } },
      { id: '11', type: 'process', position: { x: 550, y: 290 }, data: { label: 'Internal Beta Testing' } },
      { id: '12', type: 'process', position: { x: 550, y: 410 }, data: { label: 'Q3 — Beta Ready' } },
      { id: '13', type: 'process', position: { x: 800, y: 50  }, data: { label: 'Performance Optimisation' } },
      { id: '14', type: 'process', position: { x: 800, y: 170 }, data: { label: 'Security Audit' } },
      { id: '15', type: 'process', position: { x: 800, y: 290 }, data: { label: 'Public Launch' } },
      { id: '16', type: 'end',     position: { x: 800, y: 410 }, data: { label: 'Q4 — Live in Production' } },
    ],
    edges: [
      { id: 'e1-2',   source: '1',  target: '2',  label: '' },
      { id: 'e2-3',   source: '2',  target: '3',  label: '' },
      { id: 'e3-4',   source: '3',  target: '4',  label: '' },
      { id: 'e4-5',   source: '4',  target: '5',  label: '' },
      { id: 'e5-6',   source: '5',  target: '6',  label: '' },
      { id: 'e6-7',   source: '6',  target: '7',  label: '' },
      { id: 'e7-8',   source: '7',  target: '8',  label: '' },
      { id: 'e8-9',   source: '8',  target: '9',  label: '' },
      { id: 'e9-10',  source: '9',  target: '10', label: '' },
      { id: 'e10-11', source: '10', target: '11', label: '' },
      { id: 'e11-12', source: '11', target: '12', label: '' },
      { id: 'e12-13', source: '12', target: '13', label: '' },
      { id: 'e13-14', source: '13', target: '14', label: '' },
      { id: 'e14-15', source: '14', target: '15', label: '' },
      { id: 'e15-16', source: '15', target: '16', label: '' },
    ],
  };
}

function generatePlanning() {
  return {
    nodes: [
      { id: '1',  type: 'start',    position: { x: 250, y: 50  }, data: { label: 'Sprint Planning Meeting' } },
      { id: '2',  type: 'process',  position: { x: 100, y: 170 }, data: { label: 'Review Product Backlog' } },
      { id: '3',  type: 'process',  position: { x: 400, y: 170 }, data: { label: 'Estimate Story Points' } },
      { id: '4',  type: 'process',  position: { x: 100, y: 290 }, data: { label: 'Select Sprint Goal' } },
      { id: '5',  type: 'process',  position: { x: 400, y: 290 }, data: { label: 'Assign Tasks to Team' } },
      { id: '6',  type: 'process',  position: { x: 250, y: 410 }, data: { label: 'Daily Standups' } },
      { id: '7',  type: 'decision', position: { x: 250, y: 530 }, data: { label: 'Blockers Identified?' } },
      { id: '8',  type: 'process',  position: { x: 50,  y: 530 }, data: { label: 'Escalate Blockers' } },
      { id: '9',  type: 'process',  position: { x: 250, y: 650 }, data: { label: 'Sprint Review & Demo' } },
      { id: '10', type: 'decision', position: { x: 250, y: 770 }, data: { label: 'Goals Met?' } },
      { id: '11', type: 'process',  position: { x: 450, y: 770 }, data: { label: 'Sprint Retrospective' } },
      { id: '12', type: 'process',  position: { x: 50,  y: 770 }, data: { label: 'Carry Over Unfinished Work' } },
      { id: '13', type: 'end',      position: { x: 450, y: 890 }, data: { label: 'Sprint Complete' } },
    ],
    edges: [
      { id: 'e1-2',   source: '1',  target: '2',  label: '' },
      { id: 'e1-3',   source: '1',  target: '3',  label: '' },
      { id: 'e2-4',   source: '2',  target: '4',  label: '' },
      { id: 'e3-5',   source: '3',  target: '5',  label: '' },
      { id: 'e4-6',   source: '4',  target: '6',  label: '' },
      { id: 'e5-6',   source: '5',  target: '6',  label: '' },
      { id: 'e6-7',   source: '6',  target: '7',  label: '' },
      { id: 'e7-8',   source: '7',  target: '8',  label: 'Yes' },
      { id: 'e7-9',   source: '7',  target: '9',  label: 'No' },
      { id: 'e8-6',   source: '8',  target: '6',  label: 'Resolved' },
      { id: 'e9-10',  source: '9',  target: '10', label: '' },
      { id: 'e10-11', source: '10', target: '11', label: 'Yes' },
      { id: 'e10-12', source: '10', target: '12', label: 'No' },
      { id: 'e12-1',  source: '12', target: '1',  label: 'Next Sprint' },
      { id: 'e11-13', source: '11', target: '13', label: '' },
    ],
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// Generate diagram
app.post('/api/generate-diagram', async (req, res) => {
  try {
    const { prompt, diagramType, systemPrompt } = req.body;
    if (!useRealApi()) {
      console.log('✅ Mock diagram (development mode)');
      return res.json({ content: [{ text: JSON.stringify(generateMockDiagram(prompt, diagramType)) }] });
    }
    const text = await callClaude(systemPrompt, `Create a ${diagramType} diagram for: ${prompt}`, 2000);
    res.json({ content: [{ text }] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Detect diagram type
app.post('/api/detect-type', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 5) return res.json({ type: 'Flowchart', confidence: 0.5, reason: 'Too short' });

    if (!useRealApi()) {
      return res.json(detectTypeMock(text));
    }

    const system = `You are a diagram type classifier. Given a process description, return ONLY a JSON object with:
{ "type": "Flowchart"|"Process Flow"|"Decision Tree"|"Swimlane"|"Roadmap"|"Planning", "confidence": 0.0-1.0, "reason": "one sentence" }

Rules:
- Mentions roles, departments, "who does what" → Swimlane
- Mentions phases, quarters, dates, milestones → Roadmap
- Mentions yes/no, conditions, branching logic → Decision Tree
- Mentions team rituals (retro, sprint, standup) → Planning
- Mentions sequential steps with inputs/outputs → Process Flow
- Default → Flowchart
Return ONLY raw JSON, no markdown.`;

    const raw = await callClaude(system, text, 200);
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    res.json(JSON.parse(cleaned));
  } catch (err) {
    console.error('detect-type error:', err);
    res.json({ type: 'Flowchart', confidence: 0.6, reason: 'Detection failed, defaulting to Flowchart' });
  }
});

// Refine diagram
app.post('/api/refine-diagram', async (req, res) => {
  try {
    const { currentDiagram, refinementRequest, diagramType, originalPrompt } = req.body;

    if (!useRealApi()) {
      console.log('✅ Mock refine');
      const result = refineMock(currentDiagram, refinementRequest);
      return res.json({ content: [{ text: JSON.stringify(result) }] });
    }

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

Original process: ${originalPrompt || '(not provided)'}
Diagram type: ${diagramType}
Refinement request: ${refinementRequest}`;

    const raw = await callClaude(system, userMsg, 3000);
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    res.json({ content: [{ text: JSON.stringify(parsed) }] });
  } catch (err) {
    console.error('refine error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Confluence export
app.post('/api/confluence-export', async (req, res) => {
  try {
    const { baseUrl, email, apiToken, spaceKey, pageTitle, parentPage, nodes, edges } = req.body;
    const xml = toDrawioXml(nodes, edges);
    const xmlEncoded = Buffer.from(xml).toString('base64');
    const pageBody = `<ac:structured-macro ac:name="drawio" ac:schema-version="1"><ac:parameter ac:name="diagramXml">${xmlEncoded}</ac:parameter></ac:structured-macro>`;

    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` };

    // Try to find existing page first
    const searchUrl = `${baseUrl}/wiki/rest/api/content?title=${encodeURIComponent(pageTitle)}&spaceKey=${encodeURIComponent(spaceKey)}&expand=version`;
    const searchResp = await fetch(searchUrl, { headers });
    const searchData = await searchResp.json();
    const existing = searchData?.results?.[0];

    let pageUrl;
    if (existing) {
      // Update existing page
      const updateResp = await fetch(`${baseUrl}/wiki/rest/api/content/${existing.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          version: { number: (existing.version?.number || 0) + 1 },
          title: pageTitle,
          type: 'page',
          body: { storage: { value: pageBody, representation: 'storage' } },
        }),
      });
      if (!updateResp.ok) {
        const e = await updateResp.json();
        return res.status(400).json({ error: e?.message || 'Failed to update Confluence page' });
      }
      const updated = await updateResp.json();
      pageUrl = `${baseUrl}/wiki${updated._links?.webui || ''}`;
    } else {
      // Create new page
      const body = {
        type: 'page',
        title: pageTitle,
        space: { key: spaceKey },
        body: { storage: { value: pageBody, representation: 'storage' } },
      };
      if (parentPage) body.ancestors = [{ title: parentPage }];

      const createResp = await fetch(`${baseUrl}/wiki/rest/api/content`, {
        method: 'POST', headers,
        body: JSON.stringify(body),
      });
      if (!createResp.ok) {
        const e = await createResp.json();
        return res.status(400).json({ error: e?.message || 'Failed to create Confluence page' });
      }
      const created = await createResp.json();
      pageUrl = `${baseUrl}/wiki${created._links?.webui || ''}`;
    }

    res.json({ success: true, pageUrl });
  } catch (err) {
    console.error('confluence error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Jira: extract tasks from diagram
app.post('/api/jira-extract-tasks', async (req, res) => {
  try {
    const { nodes, edges } = req.body;

    if (!useRealApi()) {
      return res.json({ tasks: extractTasksMock(nodes) });
    }

    const system = `You are a task extraction assistant. Given a diagram JSON, extract actionable tasks.
Return ONLY raw JSON: { "tasks": [{ "nodeId": "...", "summary": "...", "description": "...", "priority": "High"|"Medium"|"Low", "suggested_type": "Task"|"Bug"|"Story" }] }

Rules:
- Only extract process and inputOutput nodes (not start, end, decision)
- Priority: High for early steps, Medium for middle, Low for later steps
- Description should mention what comes before and after the node in the flow
- Do NOT fabricate owners, dates, or details not in the diagram`;

    const raw = await callClaude(system, JSON.stringify({ nodes, edges }), 2000);
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    res.json(JSON.parse(cleaned));
  } catch (err) {
    console.error('jira-extract error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Jira: create tickets
app.post('/api/jira-create-tickets', async (req, res) => {
  try {
    const { baseUrl, email, apiToken, projectKey, tasks } = req.body;
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` };

    const results = [];
    const errors = [];

    for (const task of tasks) {
      try {
        const resp = await fetch(`${baseUrl}/rest/api/3/issue`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            fields: {
              project: { key: projectKey },
              summary: task.summary,
              description: {
                type: 'doc',
                version: 1,
                content: [{ type: 'paragraph', content: [{ type: 'text', text: task.description }] }],
              },
              issuetype: { name: task.issue_type || task.suggested_type || 'Task' },
              priority: { name: task.priority || 'Medium' },
            },
          }),
        });
        if (resp.ok) {
          const created = await resp.json();
          results.push({ key: created.key, url: `${baseUrl}/browse/${created.key}` });
        } else {
          const e = await resp.json();
          errors.push({ summary: task.summary, error: e?.errors || e?.errorMessages?.join(', ') || 'Unknown error' });
        }
      } catch (e) {
        errors.push({ summary: task.summary, error: e.message });
      }
    }

    res.json({ created: results, errors, projectUrl: `${baseUrl}/jira/software/projects/${projectKey}` });
  } catch (err) {
    console.error('jira-create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Serve frontend in production ────────────────────────────────────────────
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(join(distPath, 'index.html')));
}

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(useRealApi() ? '🤖 Real Claude API enabled' : '🔧 Mock diagrams enabled (set USE_REAL_API=true to use Claude)');
});

import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';
import type {
  AIAnalysis,
  ComplaintLocation,
  Department,
  IssueCategory,
  Severity,
} from '../src/types/complaint.ts';
import { buildDeterministicAnalysis, DEPARTMENTS } from '../src/lib/workflow.ts';

function getConfiguredApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === 'MY_GEMINI_API_KEY' || key.length < 10) {
    return null;
  }
  return key;
}

export function isGeminiConfigured(): boolean {
  return getConfiguredApiKey() !== null;
}

function resolveUploadedImageInlineData(photoUrl?: string): { mimeType: string; data: string } | null {
  if (!photoUrl) return null;

  if (photoUrl.startsWith('data:image/')) {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(photoUrl);
    if (match && !match[1].includes('svg')) {
      return { mimeType: match[1], data: match[2] };
    }
    return null;
  }

  if (photoUrl.startsWith('/uploads/')) {
    const safeName = path.basename(photoUrl);
    const fullPath = path.resolve(process.cwd(), 'uploads', safeName);
    if (fs.existsSync(fullPath)) {
      const ext = path.extname(safeName).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
      };
      const mimeType = mimeMap[ext];
      if (!mimeType) return null;
      const bytes = fs.readFileSync(fullPath);
      return { mimeType, data: bytes.toString('base64') };
    }
  }

  return null;
}

export async function analyzeComplaintWithAI(input: {
  category: IssueCategory;
  description: string;
  location: ComplaintLocation;
  photoUrl?: string;
}): Promise<AIAnalysis> {
  const apiKey = getConfiguredApiKey();
  const fallback = buildDeterministicAnalysis({
    category: input.category,
    description: input.description,
    location: input.location,
    hasPhoto: Boolean(input.photoUrl),
  });

  if (!apiKey) {
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const imageData = resolveUploadedImageInlineData(input.photoUrl);
    const promptText = [
      'You are NEXUS AI, a civic infrastructure triage assistant helping municipal teams review citizen reports.',
      'Analyze the submitted report (and attached photo if provided) concisely and factually.',
      `Selected Category: ${input.category}`,
      `Citizen Description: ${input.description || 'No text description provided.'}`,
      `Location: ${input.location.address} (Area: ${input.location.area}, Coordinates: ${input.location.lat.toFixed(4)}, ${input.location.lng.toFixed(4)})`,
      `Allowed Severities: Low, Medium, High, Critical`,
      `Allowed Departments: ${DEPARTMENTS.join(', ')}`,
      'Return structured JSON with short, clear, non-jargon municipal outputs.',
    ].join('\n');

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    if (imageData) {
      parts.push({ inlineData: imageData });
    }
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        systemInstruction:
          'Provide objective, concise municipal infrastructure triage recommendations. Keep each sentence under 26 words. Never fabricate field measurements that cannot be seen.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identifiedIssue: { type: Type.STRING },
            severity: { type: Type.STRING },
            summary: { type: Type.STRING },
            recommendedAction: { type: Type.STRING },
            department: { type: Type.STRING },
            detectionNote: { type: Type.STRING },
            severityNote: { type: Type.STRING },
            locationNote: { type: Type.STRING },
            departmentNote: { type: Type.STRING },
            responseNote: { type: Type.STRING },
          },
          required: [
            'identifiedIssue',
            'severity',
            'summary',
            'recommendedAction',
            'department',
            'detectionNote',
            'severityNote',
            'locationNote',
            'departmentNote',
            'responseNote',
          ],
        },
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      return fallback;
    }

    const parsed = JSON.parse(rawText) as {
      identifiedIssue?: string;
      severity?: string;
      summary?: string;
      recommendedAction?: string;
      department?: string;
      detectionNote?: string;
      severityNote?: string;
      locationNote?: string;
      departmentNote?: string;
      responseNote?: string;
    };

    const validSeverities: Severity[] = ['Low', 'Medium', 'High', 'Critical'];
    const severity: Severity = validSeverities.includes(parsed.severity as Severity)
      ? (parsed.severity as Severity)
      : fallback.severity;

    const department: Department = DEPARTMENTS.includes(parsed.department as Department)
      ? (parsed.department as Department)
      : fallback.department;

    const now = new Date().toISOString();

    return {
      mode: 'gemini',
      identifiedIssue: parsed.identifiedIssue || fallback.identifiedIssue,
      severity,
      summary: parsed.summary || fallback.summary,
      recommendedAction: parsed.recommendedAction || fallback.recommendedAction,
      department,
      confidence: null,
      analyzedAt: now,
      disclaimer: 'AI-assisted assessment — requires human review.',
      agents: [
        {
          id: 'detection',
          name: 'Detection Agent',
          status: 'completed',
          output: parsed.detectionNote || fallback.agents[0].output,
        },
        {
          id: 'severity',
          name: 'Severity Agent',
          status: 'completed',
          output: parsed.severityNote || fallback.agents[1].output,
        },
        {
          id: 'location',
          name: 'Location Agent',
          status: 'completed',
          output: parsed.locationNote || fallback.agents[2].output,
        },
        {
          id: 'department',
          name: 'Department Agent',
          status: 'completed',
          output: parsed.departmentNote || fallback.agents[3].output,
        },
        {
          id: 'response',
          name: 'Response Agent',
          status: 'completed',
          output: parsed.responseNote || fallback.agents[4].output,
        },
      ],
    };
  } catch (err) {
    console.warn('[NEXUS AI] Gemini analysis unavailable, using deterministic demo fallback:', err);
    return fallback;
  }
}

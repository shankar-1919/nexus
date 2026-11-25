import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import type {
  Complaint,
  ComplaintLocation,
  Department,
  IssueCategory,
  Severity,
  UserRole,
} from './src/types/complaint.ts';
import {
  CATEGORY_TO_DEPARTMENT,
  DEPARTMENTS,
  ISSUE_CATEGORIES,
  generateComplaintId,
} from './src/lib/workflow.ts';
import {
  getComplaintById,
  initDatabase,
  listComplaints,
  resetDemoDatabase,
  saveComplaint,
} from './server/db.ts';
import { analyzeComplaintWithAI, isGeminiConfigured } from './server/ai.ts';

const PORT = Number(process.env.PORT) || 3000;
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP, or GIF images are supported.'));
    }
  },
});

async function startServer() {
  initDatabase();

  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'NEXUS AI API',
      aiMode: isGeminiConfigured() ? 'gemini' : 'demo',
      timestamp: new Date().toISOString(),
    });
  });

  // Upload image
  app.post('/api/upload', (req, res) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Image upload failed.' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
      }
      return res.status(201).json({
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
        size: req.file.size,
      });
    });
  });

  // List complaints
  app.get('/api/complaints', (_req, res) => {
    try {
      const complaints = listComplaints();
      res.json({ complaints, aiMode: isGeminiConfigured() ? 'gemini' : 'demo' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to load complaints.' });
    }
  });

  // Get single complaint
  app.get('/api/complaints/:id', (req, res) => {
    const item = getComplaintById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }
    return res.json({ complaint: item });
  });

  // Create complaint + run AI/Demo analysis
  app.post('/api/complaints', async (req, res) => {
    try {
      const body = req.body as {
        category?: IssueCategory;
        description?: string;
        photoUrl?: string;
        location?: Partial<ComplaintLocation>;
        submittedBy?: string;
      };

      const category = body.category;
      if (!category || !ISSUE_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'Please select a valid problem category.' });
      }

      const description = (body.description ?? '').trim();
      const photoUrl = body.photoUrl?.trim() || undefined;
      if (!description && !photoUrl) {
        return res
          .status(400)
          .json({ error: 'Please add a description or attach a photograph of the issue.' });
      }

      const address = (body.location?.address ?? '').trim();
      if (!address) {
        return res.status(400).json({ error: 'Please provide the location address.' });
      }

      const lat = typeof body.location?.lat === 'number' ? body.location.lat : 17.4239;
      const lng = typeof body.location?.lng === 'number' ? body.location.lng : 78.4483;
      const area =
        (body.location?.area ?? '').trim() ||
        address.split(',')[1]?.trim() ||
        address.split(',')[0]?.trim() ||
        'Hyderabad';

      const location: ComplaintLocation = {
        address,
        area,
        lat,
        lng,
        source: body.location?.source ?? 'manual',
      };

      const existing = listComplaints();
      const id = generateComplaintId(existing.map((c) => c.id));
      const submittedAt = new Date().toISOString();
      const submittedBy = (body.submittedBy ?? '').trim() || 'Aarav Rao (Demo Citizen)';

      const aiAnalysis = await analyzeComplaintWithAI({
        category,
        description: description || `${category} reported with attached photo.`,
        location,
        photoUrl,
      });

      const analyzedAt = aiAnalysis.analyzedAt;
      const reviewAt = new Date(new Date(analyzedAt).getTime() + 1000).toISOString();

      const complaint: Complaint = {
        id,
        category,
        description: description || `${category} reported via photograph at ${address}.`,
        photoUrl,
        location,
        severity: aiAnalysis.severity,
        status: 'Awaiting Review',
        department: aiAnalysis.department || CATEGORY_TO_DEPARTMENT[category],
        submittedBy,
        submittedAt,
        updatedAt: reviewAt,
        isSeededDemo: false,
        aiAnalysis,
        timeline: [
          {
            id: `t-${id}-1`,
            stage: 'Submitted',
            status: 'Submitted',
            timestamp: submittedAt,
            description: `Citizen submitted a ${category.toLowerCase()} report at ${address}.`,
            actor: submittedBy,
          },
          {
            id: `t-${id}-2`,
            stage: 'AI Analysis Completed',
            status: 'AI Analysis Completed',
            timestamp: analyzedAt,
            description:
              aiAnalysis.mode === 'gemini'
                ? `AI-assisted analysis suggested ${aiAnalysis.severity} severity and ${aiAnalysis.department}.`
                : `Demo AI assessment suggested ${aiAnalysis.severity} severity and ${aiAnalysis.department}.`,
            actor: aiAnalysis.mode === 'gemini' ? 'NEXUS AI (Gemini)' : 'NEXUS AI (Demo Rules)',
          },
          {
            id: `t-${id}-3`,
            stage: 'Awaiting Review',
            status: 'Awaiting Review',
            timestamp: reviewAt,
            description: 'Queued for municipal administrator review and human approval.',
            actor: 'System',
          },
        ],
        notes: [],
      };

      saveComplaint(complaint);
      return res.status(201).json({ complaint });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Unable to submit complaint.' });
    }
  });

  // Re-run AI analysis
  app.post('/api/complaints/:id/analyze', async (req, res) => {
    const complaint = getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const aiAnalysis = await analyzeComplaintWithAI({
      category: complaint.category,
      description: complaint.description,
      location: complaint.location,
      photoUrl: complaint.photoUrl,
    });

    const updated: Complaint = {
      ...complaint,
      aiAnalysis,
      updatedAt: new Date().toISOString(),
    };
    saveComplaint(updated);
    return res.json({ complaint: updated });
  });

  // Patch complaint (priority, department, status, notes)
  app.patch('/api/complaints/:id', (req, res) => {
    const complaint = getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const body = req.body as {
      severity?: Severity;
      department?: Department;
      note?: string;
      author?: string;
      role?: UserRole;
      instructions?: string;
      dueDate?: string;
    };

    const now = new Date().toISOString();
    const updated: Complaint = { ...complaint, updatedAt: now };
    const timeline = [...complaint.timeline];
    const notes = [...complaint.notes];

    const validSeverities: Severity[] = ['Low', 'Medium', 'High', 'Critical'];
    if (body.severity && validSeverities.includes(body.severity) && body.severity !== complaint.severity) {
      updated.severity = body.severity;
      timeline.push({
        id: `t-${complaint.id}-${Date.now()}-sev`,
        stage: complaint.status,
        status: complaint.status,
        timestamp: now,
        description: `Priority updated from ${complaint.severity} to ${body.severity}.`,
        actor: body.author || 'Meera Iyer (Administrator)',
      });
    }

    if (body.department && DEPARTMENTS.includes(body.department) && body.department !== complaint.department) {
      updated.department = body.department;
      timeline.push({
        id: `t-${complaint.id}-${Date.now()}-dept`,
        stage: complaint.status,
        status: complaint.status,
        timestamp: now,
        description: `Department updated to ${body.department}.`,
        actor: body.author || 'Meera Iyer (Administrator)',
      });
    }

    if (typeof body.instructions === 'string') {
      updated.instructions = body.instructions.trim();
    }
    if (typeof body.dueDate === 'string') {
      updated.dueDate = body.dueDate.trim();
    }

    if (body.note && body.note.trim()) {
      const role = body.role ?? 'admin';
      const author =
        body.author ||
        (role === 'citizen'
          ? complaint.submittedBy
          : role === 'officer'
          ? complaint.assignedOfficer || 'Ravi Kumar (Field Officer)'
          : 'Meera Iyer (Administrator)');
      notes.push({
        id: `n-${complaint.id}-${Date.now()}`,
        author,
        role,
        text: body.note.trim(),
        timestamp: now,
      });
      if (role === 'citizen') {
        timeline.push({
          id: `t-${complaint.id}-${Date.now()}-info`,
          stage: complaint.status,
          status: complaint.status,
          timestamp: now,
          description: `Citizen added additional information: "${body.note.trim()}"`,
          actor: author,
        });
      }
    }

    updated.timeline = timeline;
    updated.notes = notes;
    saveComplaint(updated);
    return res.json({ complaint: updated });
  });

  // Approve complaint (Human Review)
  app.post('/api/complaints/:id/approve', (req, res) => {
    const complaint = getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const body = req.body as {
      severity?: Severity;
      department?: Department;
      note?: string;
      actor?: string;
    };

    const now = new Date().toISOString();
    const actor = body.actor || 'Meera Iyer (Administrator)';
    const severity = body.severity || complaint.severity;
    const department = body.department || complaint.department;

    const notes = [...complaint.notes];
    if (body.note?.trim()) {
      notes.push({
        id: `n-${complaint.id}-${Date.now()}`,
        author: actor,
        role: 'admin',
        text: body.note.trim(),
        timestamp: now,
      });
    }

    const updated: Complaint = {
      ...complaint,
      severity,
      department,
      status: 'Approved',
      updatedAt: now,
      notes,
      timeline: [
        ...complaint.timeline,
        {
          id: `t-${complaint.id}-${Date.now()}`,
          stage: 'Approved',
          status: 'Approved',
          timestamp: now,
          description: `Human review approved (${severity} priority, ${department}).${
            body.note?.trim() ? ` Note: ${body.note.trim()}` : ''
          }`,
          actor,
        },
      ],
    };

    saveComplaint(updated);
    return res.json({ complaint: updated });
  });

  // Reject complaint
  app.post('/api/complaints/:id/reject', (req, res) => {
    const complaint = getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const body = req.body as { reason?: string; actor?: string };
    const reason = (body.reason ?? '').trim() || 'Report did not meet municipal verification criteria.';
    const now = new Date().toISOString();
    const actor = body.actor || 'Meera Iyer (Administrator)';

    const updated: Complaint = {
      ...complaint,
      status: 'Rejected',
      updatedAt: now,
      notes: [
        ...complaint.notes,
        {
          id: `n-${complaint.id}-${Date.now()}`,
          author: actor,
          role: 'admin',
          text: `Rejected: ${reason}`,
          timestamp: now,
        },
      ],
      timeline: [
        ...complaint.timeline,
        {
          id: `t-${complaint.id}-${Date.now()}`,
          stage: 'Rejected',
          status: 'Rejected',
          timestamp: now,
          description: `Report rejected during human review. Reason: ${reason}`,
          actor,
        },
      ],
    };

    saveComplaint(updated);
    return res.json({ complaint: updated });
  });

  // Assign field officer & department
  app.post('/api/complaints/:id/assign', (req, res) => {
    const complaint = getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const body = req.body as {
      officer?: string;
      department?: Department;
      dueDate?: string;
      instructions?: string;
      actor?: string;
    };

    const officer = (body.officer ?? '').trim();
    if (!officer) {
      return res.status(400).json({ error: 'Please select a field officer to assign.' });
    }

    const now = new Date().toISOString();
    const actor = body.actor || 'Meera Iyer (Administrator)';
    const department = body.department || complaint.department;

    const updated: Complaint = {
      ...complaint,
      department,
      assignedOfficer: officer,
      dueDate: body.dueDate || complaint.dueDate || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      instructions:
        (body.instructions ?? '').trim() ||
        complaint.instructions ||
        complaint.aiAnalysis.recommendedAction,
      status: 'Assigned',
      updatedAt: now,
      timeline: [
        ...complaint.timeline,
        {
          id: `t-${complaint.id}-${Date.now()}`,
          stage: 'Assigned',
          status: 'Assigned',
          timestamp: now,
          description: `Assigned to Field Officer ${officer} (${department}).`,
          actor,
        },
      ],
    };

    saveComplaint(updated);
    return res.json({ complaint: updated });
  });

  // Field officer task status update (Accepted / In Progress)
  app.post('/api/complaints/:id/task-status', (req, res) => {
    const complaint = getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const body = req.body as {
      status?: 'Accepted' | 'In Progress';
      note?: string;
      actor?: string;
    };

    if (body.status !== 'Accepted' && body.status !== 'In Progress') {
      return res.status(400).json({ error: 'Invalid field task status.' });
    }

    const now = new Date().toISOString();
    const actor = body.actor || `${complaint.assignedOfficer || 'Ravi Kumar'} (Field Officer)`;
    const description =
      body.status === 'Accepted'
        ? `Field officer accepted task assignment.${body.note?.trim() ? ` ${body.note.trim()}` : ''}`
        : `Field repair work started on site.${body.note?.trim() ? ` ${body.note.trim()}` : ''}`;

    const updated: Complaint = {
      ...complaint,
      status: body.status,
      updatedAt: now,
      timeline: [
        ...complaint.timeline,
        {
          id: `t-${complaint.id}-${Date.now()}`,
          stage: body.status === 'Accepted' ? 'Accepted' : 'In Progress',
          status: body.status,
          timestamp: now,
          description,
          actor,
        },
      ],
    };

    saveComplaint(updated);
    return res.json({ complaint: updated });
  });

  // Resolve complaint with note and optional completion photo
  app.post('/api/complaints/:id/resolve', (req, res) => {
    const complaint = getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const body = req.body as {
      note?: string;
      completionPhotoUrl?: string;
      actor?: string;
    };

    const note = (body.note ?? '').trim();
    if (!note) {
      return res.status(400).json({ error: 'Please provide a resolution note before closing this task.' });
    }

    const now = new Date().toISOString();
    const resolvedBy = body.actor || complaint.assignedOfficer || 'Ravi Kumar';

    const updated: Complaint = {
      ...complaint,
      status: 'Resolved',
      updatedAt: now,
      resolution: {
        note,
        completionPhotoUrl: body.completionPhotoUrl?.trim() || undefined,
        resolvedBy,
        resolvedAt: now,
      },
      timeline: [
        ...complaint.timeline,
        {
          id: `t-${complaint.id}-${Date.now()}`,
          stage: 'Resolved',
          status: 'Resolved',
          timestamp: now,
          description: `Issue resolved by field team: ${note}`,
          actor: `${resolvedBy} (Field Officer)`,
        },
      ],
    };

    saveComplaint(updated);
    return res.json({ complaint: updated });
  });

  // Submit citizen feedback after resolution
  app.post('/api/complaints/:id/feedback', (req, res) => {
    const complaint = getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const body = req.body as { rating?: number; comment?: string };
    const rating = Number(body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Please choose a rating between 1 and 5.' });
    }

    const now = new Date().toISOString();
    const comment = (body.comment ?? '').trim();

    const updated: Complaint = {
      ...complaint,
      updatedAt: now,
      feedback: {
        rating,
        comment,
        submittedAt: now,
      },
      timeline: [
        ...complaint.timeline,
        {
          id: `t-${complaint.id}-${Date.now()}`,
          stage: 'Resolved',
          status: complaint.status,
          timestamp: now,
          description: `Citizen submitted ${rating}/5 resolution feedback${comment ? `: "${comment}"` : '.'}`,
          actor: complaint.submittedBy,
        },
      ],
    };

    saveComplaint(updated);
    return res.json({ complaint: updated });
  });

  // Reset demo data
  app.post('/api/demo/reset', (_req, res) => {
    const complaints = resetDemoDatabase();
    return res.json({ complaints });
  });

  // Vite dev middleware or static dist
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NEXUS AI running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start NEXUS AI server:', err);
  process.exit(1);
});

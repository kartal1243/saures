import type { Express, Request, Response } from 'express';
import type { CaseFile } from '../../src/types';
import { S, saveState } from '../context';
import { broadcast } from '../realtime';

export function registerCaseRoutes(app: Express): void {
  // ==========================================
  // 18c. DAVA DOSYALARI (Avukat / danışman)
  // ==========================================
  app.post('/api/cases', (req: Request, res: Response) => {
    const data = req.body || {};
    if (!data.fileNo || !String(data.fileNo).trim()) {
      return res.status(400).json({ error: 'Dosya No zorunludur.' });
    }
    if (!data.clientName || !String(data.clientName).trim()) {
      return res.status(400).json({ error: 'Müvekkil adı zorunludur.' });
    }
    const now = new Date().toISOString();
    const list = (S() as any).cases as CaseFile[];
    const hearings = Array.isArray(data.hearings)
      ? data.hearings
          .filter((h: any) => h && h.date)
          .map((h: any) => ({
            id: String(h.id || `hr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`),
            date: String(h.date),
            note: String(h.note || ''),
          }))
      : [];
    let file: CaseFile;
    if (data.id) {
      const idx = list.findIndex((c) => c.id === data.id);
      if (idx === -1) return res.status(404).json({ error: 'Dosya bulunamadı.' });
      file = {
        ...list[idx],
        fileNo: String(data.fileNo).trim(),
        clientName: String(data.clientName).trim(),
        customerId: data.customerId ? String(data.customerId) : undefined,
        court: String(data.court || ''),
        hearingDate: String(data.hearingDate || ''),
        hearings,
        consultancyHours: Number(data.consultancyHours) || 0,
        hourlyRate: data.hourlyRate !== undefined && data.hourlyRate !== '' ? Number(data.hourlyRate) : undefined,
        status: data.status === 'kapali' ? 'kapali' : 'acik',
        notes: String(data.notes || ''),
        updatedAt: now,
      };
      list[idx] = file;
    } else {
      file = {
        id: `case_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        fileNo: String(data.fileNo).trim(),
        clientName: String(data.clientName).trim(),
        customerId: data.customerId ? String(data.customerId) : undefined,
        court: String(data.court || ''),
        hearingDate: String(data.hearingDate || ''),
        hearings,
        consultancyHours: Number(data.consultancyHours) || 0,
        hourlyRate: data.hourlyRate !== undefined && data.hourlyRate !== '' ? Number(data.hourlyRate) : undefined,
        status: data.status === 'kapali' ? 'kapali' : 'acik',
        notes: String(data.notes || ''),
        createdAt: now,
        updatedAt: now,
      };
      list.unshift(file);
    }
    saveState();
    broadcast({ type: 'CASE_UPSERTED', payload: file });
    res.json({ success: true, case: file });
  });

  app.delete('/api/cases/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const list = (S() as any).cases as CaseFile[];
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Dosya bulunamadı.' });
    list.splice(idx, 1);
    saveState();
    broadcast({ type: 'CASE_DELETED', payload: { id } });
    res.json({ success: true });
  });
}

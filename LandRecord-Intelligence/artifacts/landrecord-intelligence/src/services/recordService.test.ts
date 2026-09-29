import { beforeEach, describe, expect, it } from 'vitest';
import { demoRecord } from '@/data/mockData';
import { recordService } from '@/services/recordService';

const grievanceInput = {
  caseId: 'LR-2026-01482',
  subject: 'Area shown on deed differs from register',
  citizen: 'Priya Kumari',
  village: 'Rampur, Darbhanga',
  priority: 'High' as const,
  concern: 'The deed area does not match the register entry.',
};

describe('recordService persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('generates sequential grievance IDs and makes the latest grievance available to the citizen view', async () => {
    const first = await recordService.createGrievance(grievanceInput);
    const second = await recordService.createGrievance({
      ...grievanceInput,
      concern: 'A second concern with the same case reference.',
    });

    expect(first.id).toMatch(/^GRV-\d{4}-\d{5}$/);
    expect(Number(second.id.slice(-5))).toBe(Number(first.id.slice(-5)) + 1);
    expect((await recordService.getCitizenGrievance())?.id).toBe(second.id);
    expect((await recordService.getGrievance(first.id))?.concern).toContain('does not match');
  });

  it('persists grievance status changes, remarks, and their audit events in order', async () => {
    const created = await recordService.createGrievance(grievanceInput);
    const submitted = await recordService.getGrievance(created.id);
    expect(submitted).toBeDefined();

    const inReview = await recordService.updateGrievanceStatus(created.id, 'In Review');
    const withRemark = await recordService.addGrievanceRemark(
      created.id,
      'Requested the original register extract for comparison.',
    );
    const reloaded = await recordService.getCitizenGrievance();

    expect(inReview.status).toBe('In Review');
    expect(withRemark.resolution).toBe('Requested the original register extract for comparison.');
    expect(reloaded?.id).toBe(created.id);
    expect(reloaded?.status).toBe('In Review');
    expect(reloaded?.resolution).toBe(withRemark.resolution);
    expect(reloaded?.audit.at(-2)).toContain('Status changed to In Review by Anita Kumari');
    expect(reloaded?.audit.at(-1)).toContain('Officer note saved by Anita Kumari');
    expect(reloaded?.audit.indexOf(reloaded.audit.at(-2)!)).toBeLessThan(
      reloaded.audit.indexOf(reloaded.audit.at(-1)!),
    );
  });

  it('persists the officer decision, derived status, remarks, officer, and audit ordering', async () => {
    const before = await recordService.getCase(demoRecord.id);
    expect(before).toBeDefined();

    const saved = await recordService.saveOfficerDecision(demoRecord.id, {
      action: 'verify',
      remarks: 'Verified after reviewing the deed and register comparison.',
    });
    const reloaded = await recordService.getCase(demoRecord.id);

    expect(saved.status).toBe('Verified');
    expect(saved.decision).toMatchObject({
      action: 'verify',
      remarks: 'Verified after reviewing the deed and register comparison.',
      officer: 'Anita Kumari',
    });
    expect(reloaded?.decision).toEqual(saved.decision);
    expect(reloaded?.auditTrail).toHaveLength((before?.auditTrail.length ?? 0) + 2);
    expect(reloaded?.auditTrail.at(-2)).toContain('Record verified · Anita Kumari');
    expect(reloaded?.auditTrail.at(-1)).toContain(
      'Officer remarks: Verified after reviewing the deed and register comparison.',
    );
    expect(reloaded?.auditTrail.indexOf(reloaded.auditTrail.at(-2)!)).toBeLessThan(
      reloaded.auditTrail.indexOf(reloaded.auditTrail.at(-1)!),
    );
  });
});
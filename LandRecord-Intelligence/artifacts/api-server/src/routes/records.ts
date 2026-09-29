import { Router, type IRouter } from "express";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db, grievanceNumberSequence, landRecordCaseAuditsTable, landRecordCasesTable, landRecordGrievanceAuditsTable, landRecordGrievancesTable } from "@workspace/db";
import {
  AddGrievanceRemarkBody,
  AddGrievanceRemarkParams,
  AddGrievanceRemarkResponse,
  CreateGrievanceBody,
  CreateGrievanceResponse,
  GetCaseParams,
  GetCaseResponse,
  GetGrievanceParams,
  GetGrievanceResponse,
  GetLatestCitizenGrievanceResponse,
  ListCasesResponse,
  ListGrievancesResponse,
  SaveOfficerDecisionBody,
  SaveOfficerDecisionParams,
  SaveOfficerDecisionResponse,
  UpdateGrievanceStatusBody,
  UpdateGrievanceStatusParams,
  UpdateGrievanceStatusResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_OFFICER = "Anita Kumari";
let seedPromise: Promise<void> | undefined;

const seedGrievances = [
  {
    id: "GRV-2026-00047", caseId: "LR-2026-01482", subject: "Area shown on deed differs from register",
    citizen: "Priya Kumari", village: "Rampur, Darbhanga", status: "Submitted", priority: "High",
    created: "06 Feb 2026, 14:41 IST", concern: "The registry document appears to show 2.40 acre, while the existing register shows 2.84 acre for survey 142/3A. Please review the discrepancy and the related ownership entry.", resolution: "",
  },
  {
    id: "GRV-2026-00042", caseId: "LR-2026-01391", subject: "Boundary marker not visible on site",
    citizen: "Amit Kumar", village: "Rampur, Darbhanga", status: "In Review", priority: "Urgent",
    created: "05 Feb 2026, 11:08 IST", concern: "The eastern marker referenced in the deed could not be located.", resolution: "",
  },
  {
    id: "GRV-2026-00031", caseId: "LR-2026-01288", subject: "Request for certified copy status",
    citizen: "Farida Khatoon", village: "Bahadurpur, Darbhanga", status: "Resolved", priority: "Normal",
    created: "03 Feb 2026, 09:12 IST", concern: "Please confirm when the certified copy can be collected.", resolution: "Copy made available at the registry counter on 04 Feb 2026.",
  },
] as const;

const seedGrievanceAudits = [
  ["GRV-2026-00047", "06 Feb 2026 · 14:41 — Concern submitted by citizen"],
  ["GRV-2026-00047", "06 Feb 2026 · 14:41 — Demo-generated draft edited and submitted"],
  ["GRV-2026-00042", "05 Feb 2026 · 11:08 — Concern submitted"],
  ["GRV-2026-00042", "05 Feb 2026 · 16:20 — Assigned to field survey team"],
  ["GRV-2026-00031", "03 Feb 2026 · 09:12 — Concern submitted"],
  ["GRV-2026-00031", "04 Feb 2026 · 12:04 — Resolved by Anita Kumari"],
] as const;

const seedCases = [
  { id: "LR-2026-01482", owner: "Ramesh Kumar", village: "Rampur", risk: 78, status: "Officer Review", priority: "Urgent" },
  { id: "LR-2026-01391", owner: "Amit Kumar", village: "Rampur", risk: 54, status: "Officer Review", priority: "High" },
  { id: "LR-2026-01476", owner: "Sunita Devi", village: "Keshopur", risk: 19, status: "Verified", priority: "Normal" },
] as const;

const seedCaseAudits = [
  ["LR-2026-01482", "06 Feb 2026 · 14:32 — Document received · System"],
  ["LR-2026-01482", "06 Feb 2026 · 14:33 — Structured fields extracted · Examination service"],
  ["LR-2026-01482", "06 Feb 2026 · 14:34 — Risk calculated · 78 / High · Decision support"],
] as const;

function auditTimestamp() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("day")} ${value("month")} ${value("year")} · ${value("hour")}:${value("minute")}`;
}

async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = db.transaction(async (tx) => {
      const [existingGrievance] = await tx.select({ id: landRecordGrievancesTable.id }).from(landRecordGrievancesTable).limit(1);
      if (!existingGrievance) {
        await tx.insert(landRecordGrievancesTable).values([...seedGrievances]);
        await tx.insert(landRecordGrievanceAuditsTable).values(seedGrievanceAudits.map(([grievanceId, event]) => ({ grievanceId, event })));
      }
      const [existingCase] = await tx.select({ id: landRecordCasesTable.id }).from(landRecordCasesTable).limit(1);
      if (!existingCase) {
        await tx.insert(landRecordCasesTable).values([...seedCases]);
        await tx.insert(landRecordCaseAuditsTable).values(seedCaseAudits.map(([caseId, event]) => ({ caseId, event })));
      }
    }).catch((error) => {
      seedPromise = undefined;
      throw error;
    });
  }
  await seedPromise;
}

async function grievanceResponse(id: string) {
  const [row] = await db.select().from(landRecordGrievancesTable).where(eq(landRecordGrievancesTable.id, id));
  if (!row) return undefined;
  const audits = await db.select({ event: landRecordGrievanceAuditsTable.event })
    .from(landRecordGrievanceAuditsTable)
    .where(eq(landRecordGrievanceAuditsTable.grievanceId, id))
    .orderBy(asc(landRecordGrievanceAuditsTable.id));
  return {
    id: row.id, caseId: row.caseId, subject: row.subject, citizen: row.citizen, village: row.village,
    status: row.status, priority: row.priority, created: row.created, concern: row.concern,
    resolution: row.resolution, audit: audits.map((audit) => audit.event),
  };
}

async function caseResponse(id: string) {
  const [row] = await db.select().from(landRecordCasesTable).where(eq(landRecordCasesTable.id, id));
  if (!row) return undefined;
  const audits = await db.select({ event: landRecordCaseAuditsTable.event })
    .from(landRecordCaseAuditsTable)
    .where(eq(landRecordCaseAuditsTable.caseId, id))
    .orderBy(asc(landRecordCaseAuditsTable.id));
  const decision = row.decisionAction && row.decisionRemarks && row.decisionTimestamp && row.decisionOfficer
    ? { action: row.decisionAction, remarks: row.decisionRemarks, timestamp: row.decisionTimestamp, officer: row.decisionOfficer }
    : null;
  return { id: row.id, owner: row.owner, village: row.village, risk: row.risk, status: row.status, priority: row.priority, decision, auditTrail: audits.map((audit) => audit.event) };
}

router.get("/grievances", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const rows = await db.select({ id: landRecordGrievancesTable.id }).from(landRecordGrievancesTable)
    .orderBy(desc(landRecordGrievancesTable.createdAt), desc(landRecordGrievancesTable.id));
  const data = await Promise.all(rows.map((row) => grievanceResponse(row.id)));
  res.json(ListGrievancesResponse.parse(data));
});

router.post("/grievances", async (req, res): Promise<void> => {
  const parsed = CreateGrievanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await ensureSeeded();
  const created = await db.transaction(async (tx) => {
    const sequenceResult = await tx.execute(sql<{ value: string }>`select nextval('land_record_grievance_number_seq') as value`);
    const sequence = Number(sequenceResult.rows[0]?.value);
    const timestamp = auditTimestamp();
    const grievance = {
      ...parsed.data,
      id: `GRV-${new Date().getFullYear()}-${String(sequence).padStart(5, "0")}`,
      status: "Submitted",
      created: `${timestamp} IST`,
      resolution: "",
      citizenCreated: true,
    };
    await tx.insert(landRecordGrievancesTable).values(grievance);
    await tx.insert(landRecordGrievanceAuditsTable).values([
      { grievanceId: grievance.id, event: `${timestamp} — Concern submitted by citizen` },
      { grievanceId: grievance.id, event: `${timestamp} — Demo-generated grievance ID created and submitted` },
    ]);
    return grievance.id;
  });
  const response = await grievanceResponse(created);
  res.status(201).json(CreateGrievanceResponse.parse(response));
});

router.get("/grievances/citizen-latest", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const [latest] = await db.select({ id: landRecordGrievancesTable.id }).from(landRecordGrievancesTable)
    .where(eq(landRecordGrievancesTable.citizenCreated, true))
    .orderBy(desc(landRecordGrievancesTable.createdAt), desc(landRecordGrievancesTable.id)).limit(1);
  const response = latest ? await grievanceResponse(latest.id) : null;
  res.json(GetLatestCitizenGrievanceResponse.parse(response));
});

router.get("/grievances/:id", async (req, res): Promise<void> => {
  const params = GetGrievanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await ensureSeeded();
  const response = await grievanceResponse(params.data.id);
  if (!response) {
    res.status(404).json({ error: "Grievance not found" });
    return;
  }
  res.json(GetGrievanceResponse.parse(response));
});

router.patch("/grievances/:id/status", async (req, res): Promise<void> => {
  const params = UpdateGrievanceStatusParams.safeParse(req.params);
  const body = UpdateGrievanceStatusBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  await ensureSeeded();
  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(landRecordGrievancesTable).where(eq(landRecordGrievancesTable.id, params.data.id)).for("update");
    if (!existing) return false;
    const timestamp = auditTimestamp();
    await tx.update(landRecordGrievancesTable).set({ status: body.data.status, updatedAt: new Date() }).where(eq(landRecordGrievancesTable.id, params.data.id));
    await tx.insert(landRecordGrievanceAuditsTable).values({ grievanceId: params.data.id, event: `${timestamp} — Status changed to ${body.data.status} by ${DEMO_OFFICER}` });
    return true;
  });
  if (!updated) {
    res.status(404).json({ error: "Grievance not found" });
    return;
  }
  res.json(UpdateGrievanceStatusResponse.parse(await grievanceResponse(params.data.id)));
});

router.patch("/grievances/:id/remark", async (req, res): Promise<void> => {
  const params = AddGrievanceRemarkParams.safeParse(req.params);
  const body = AddGrievanceRemarkBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  await ensureSeeded();
  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: landRecordGrievancesTable.id }).from(landRecordGrievancesTable).where(eq(landRecordGrievancesTable.id, params.data.id)).for("update");
    if (!existing) return false;
    const timestamp = auditTimestamp();
    await tx.update(landRecordGrievancesTable).set({ resolution: body.data.note, updatedAt: new Date() }).where(eq(landRecordGrievancesTable.id, params.data.id));
    await tx.insert(landRecordGrievanceAuditsTable).values({ grievanceId: params.data.id, event: `${timestamp} — Officer note saved by ${DEMO_OFFICER}` });
    return true;
  });
  if (!updated) {
    res.status(404).json({ error: "Grievance not found" });
    return;
  }
  res.json(AddGrievanceRemarkResponse.parse(await grievanceResponse(params.data.id)));
});

router.get("/cases", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const rows = await db.select({ id: landRecordCasesTable.id }).from(landRecordCasesTable).orderBy(asc(landRecordCasesTable.createdAt));
  const data = await Promise.all(rows.map((row) => caseResponse(row.id)));
  res.json(ListCasesResponse.parse(data));
});

router.get("/cases/:id", async (req, res): Promise<void> => {
  const params = GetCaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await ensureSeeded();
  const response = await caseResponse(params.data.id);
  if (!response) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  res.json(GetCaseResponse.parse(response));
});

router.post("/cases/:id/decision", async (req, res): Promise<void> => {
  const params = SaveOfficerDecisionParams.safeParse(req.params);
  const body = SaveOfficerDecisionBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  await ensureSeeded();
  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(landRecordCasesTable).where(eq(landRecordCasesTable.id, params.data.id)).for("update");
    if (!existing) return false;
    const timestamp = auditTimestamp();
    const event = body.data.action === "verify" ? "Record verified" : body.data.action === "return" ? "Returned for correction" : "Escalated to senior officer";
    const status = body.data.action === "verify" ? "Verified" : body.data.action === "return" ? "Correction requested" : "Senior officer review";
    await tx.update(landRecordCasesTable).set({
      status, decisionAction: body.data.action, decisionRemarks: body.data.remarks,
      decisionTimestamp: timestamp, decisionOfficer: DEMO_OFFICER, updatedAt: new Date(),
    }).where(eq(landRecordCasesTable.id, params.data.id));
    await tx.insert(landRecordCaseAuditsTable).values([
      { caseId: params.data.id, event: `${timestamp} — ${event} · ${DEMO_OFFICER}` },
      { caseId: params.data.id, event: `${timestamp} — Officer remarks: ${body.data.remarks}` },
    ]);
    return true;
  });
  if (!updated) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  res.json(SaveOfficerDecisionResponse.parse(await caseResponse(params.data.id)));
});

export default router;
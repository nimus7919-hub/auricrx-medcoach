/**
 * Pre-visit intake persistence.
 * Memory store is used in tests. Neon store is used in production (see migrate-previsit-intake.sql).
 * The migration file is not run by this module.
 */

const { isRawChatExpired } = require('./previsit-intake-lib');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createMemoryStore({ now = () => new Date() } = {}) {
  const intakes = new Map();
  const turnsByIntake = new Map();

  return {
    name: 'memory',
    async insertIntake(row) {
      intakes.set(row.id, clone(row));
      turnsByIntake.set(row.id, []);
      return clone(row);
    },
    async updateIntake(id, patch) {
      const current = intakes.get(id);
      if (!current) return null;
      const next = { ...current, ...patch, updatedAt: (patch && patch.updatedAt) || now().toISOString() };
      intakes.set(id, next);
      return clone(next);
    },
    async getIntake(id) {
      const row = intakes.get(id);
      return row ? clone(row) : null;
    },
    async deleteIntake(id) {
      intakes.delete(id);
      turnsByIntake.delete(id);
    },
    async listIntakes(filter = {}) {
      let rows = [...intakes.values()];
      if (filter.patientId) rows = rows.filter((r) => r.patientId === filter.patientId);
      if (filter.doctorId) rows = rows.filter((r) => r.doctorId === filter.doctorId);
      if (filter.appointmentId) rows = rows.filter((r) => r.appointmentId === filter.appointmentId);
      if (filter.status) rows = rows.filter((r) => r.status === filter.status);
      rows.sort((a, b) => String(b.sharedAt || b.updatedAt).localeCompare(String(a.sharedAt || a.updatedAt)));
      return rows.map(clone);
    },
    async appendTurn(turn) {
      const list = turnsByIntake.get(turn.intakeId) || [];
      list.push(clone(turn));
      turnsByIntake.set(turn.intakeId, list);
      return clone(turn);
    },
    async listTurns(intakeId) {
      return (turnsByIntake.get(intakeId) || []).map(clone);
    },
    async deleteTurns(intakeId) {
      turnsByIntake.set(intakeId, []);
    },
    async purgeExpiredTurns(at = now()) {
      let purged = 0;
      for (const row of intakes.values()) {
        if (row.status !== 'confirmed' || row.rawChatDeletedAt) continue;
        if (!isRawChatExpired(row.rawChatDeleteAt, at)) continue;
        turnsByIntake.set(row.id, []);
        row.rawChatDeletedAt = at.toISOString();
        row.updatedAt = at.toISOString();
        intakes.set(row.id, row);
        purged += 1;
      }
      return { purged };
    },
  };
}

function mapIntakeRow(r) {
  if (!r) return null;
  return {
    id: r.id,
    patientId: r.patient_id,
    doctorId: r.doctor_id,
    doctorDisplayName: r.doctor_display_name,
    appointmentId: r.appointment_id,
    appointmentStartIso: r.appointment_start_iso instanceof Date
      ? r.appointment_start_iso.toISOString()
      : r.appointment_start_iso,
    appointmentRequestId: r.appointment_request_id || null,
    locale: r.locale,
    status: r.status,
    consent: typeof r.consent === 'string' ? JSON.parse(r.consent) : r.consent,
    followUpsAsked: Number(r.follow_ups_asked) || 0,
    summary: r.summary == null ? null : typeof r.summary === 'string' ? JSON.parse(r.summary) : r.summary,
    patientComment: r.patient_comment,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
    sharedAt: r.shared_at instanceof Date ? r.shared_at.toISOString() : r.shared_at,
    rawChatDeleteAt: r.raw_chat_delete_at instanceof Date ? r.raw_chat_delete_at.toISOString() : r.raw_chat_delete_at,
    rawChatDeletedAt: r.raw_chat_deleted_at instanceof Date ? r.raw_chat_deleted_at.toISOString() : r.raw_chat_deleted_at,
  };
}

function mapTurnRow(r) {
  return {
    id: r.id,
    intakeId: r.intake_id,
    role: r.role,
    text: r.text,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  };
}

function createNeonStore({ sql, now = () => new Date() } = {}) {
  if (!sql) throw new Error('neon_sql_required');
  return {
    name: 'neon',
    async insertIntake(row) {
      await sql`
        INSERT INTO pre_visit_intakes (
          id, patient_id, doctor_id, doctor_display_name,
          appointment_id, appointment_start_iso, appointment_request_id,
          locale, status, consent, follow_ups_asked, summary, patient_comment,
          created_at, updated_at, shared_at, raw_chat_delete_at, raw_chat_deleted_at
        ) VALUES (
          ${row.id}, ${row.patientId}, ${row.doctorId}, ${row.doctorDisplayName},
          ${row.appointmentId}, ${row.appointmentStartIso}, ${row.appointmentRequestId || null},
          ${row.locale}, ${row.status}, ${JSON.stringify(row.consent)}::jsonb,
          ${row.followUpsAsked}, ${row.summary ? JSON.stringify(row.summary) : null}::jsonb,
          ${row.patientComment},
          ${row.createdAt}, ${row.updatedAt}, ${row.sharedAt},
          ${row.rawChatDeleteAt}, ${row.rawChatDeletedAt}
        )
      `;
      return row;
    },
    async updateIntake(id, patch) {
      const current = await this.getIntake(id);
      if (!current) return null;
      const next = { ...current, ...patch, updatedAt: patch.updatedAt || now().toISOString() };
      await sql`
        UPDATE pre_visit_intakes SET
          status = ${next.status},
          follow_ups_asked = ${next.followUpsAsked},
          summary = ${next.summary ? JSON.stringify(next.summary) : null}::jsonb,
          patient_comment = ${next.patientComment},
          updated_at = ${next.updatedAt},
          shared_at = ${next.sharedAt},
          raw_chat_deleted_at = ${next.rawChatDeletedAt},
          doctor_display_name = ${next.doctorDisplayName}
        WHERE id = ${id}
      `;
      return next;
    },
    async getIntake(id) {
      const rows = await sql`SELECT * FROM pre_visit_intakes WHERE id = ${id} LIMIT 1`;
      return mapIntakeRow(rows[0]);
    },
    async deleteIntake(id) {
      await sql`DELETE FROM pre_visit_turns WHERE intake_id = ${id}`;
      await sql`DELETE FROM pre_visit_intakes WHERE id = ${id}`;
    },
    async listIntakes(filter = {}) {
      const rows = await sql`
        SELECT * FROM pre_visit_intakes
        WHERE (${filter.patientId || null}::text IS NULL OR patient_id = ${filter.patientId || null})
          AND (${filter.doctorId || null}::text IS NULL OR doctor_id = ${filter.doctorId || null})
          AND (${filter.appointmentId || null}::text IS NULL OR appointment_id = ${filter.appointmentId || null})
          AND (${filter.status || null}::text IS NULL OR status = ${filter.status || null})
        ORDER BY COALESCE(shared_at, updated_at) DESC
      `;
      return (rows || []).map(mapIntakeRow);
    },
    async appendTurn(turn) {
      await sql`
        INSERT INTO pre_visit_turns (id, intake_id, role, text, created_at)
        VALUES (${turn.id}, ${turn.intakeId}, ${turn.role}, ${turn.text}, ${turn.createdAt})
      `;
      return turn;
    },
    async listTurns(intakeId) {
      const rows = await sql`
        SELECT * FROM pre_visit_turns WHERE intake_id = ${intakeId} ORDER BY created_at ASC
      `;
      return (rows || []).map(mapTurnRow);
    },
    async deleteTurns(intakeId) {
      await sql`DELETE FROM pre_visit_turns WHERE intake_id = ${intakeId}`;
    },
    async purgeExpiredTurns(at = now()) {
      const iso = at.toISOString();
      const due = await sql`
        SELECT id FROM pre_visit_intakes
        WHERE status = 'confirmed'
          AND raw_chat_deleted_at IS NULL
          AND raw_chat_delete_at <= ${iso}
      `;
      const ids = (due || []).map((r) => r.id);
      if (!ids.length) return { purged: 0 };
      for (const id of ids) {
        await sql`DELETE FROM pre_visit_turns WHERE intake_id = ${id}`;
        await sql`
          UPDATE pre_visit_intakes
          SET raw_chat_deleted_at = ${iso}, updated_at = ${iso}
          WHERE id = ${id}
        `;
      }
      return { purged: ids.length };
    },
  };
}

function createStore(opts = {}) {
  if (opts.sql) return createNeonStore(opts);
  return createMemoryStore(opts);
}

module.exports = { createMemoryStore, createNeonStore, createStore };

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

const rulesPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../firestore.rules');
const rules = readFileSync(rulesPath, 'utf8');

const falseConsent = {
  bloodPressure: false,
  glucose: false,
  weight: false,
  symptoms: false,
  medicationList: false,
  reminderAdherence: false,
};
const bpConsent = { ...falseConsent, bloodPressure: true };

function iso(day = '01') {
  return `2026-01-${day}T00:00:00.000Z`;
}

function readyProfile(uid, extra = {}) {
  return {
    uid,
    displayName: 'Dr Ready',
    specialty: 'IM',
    cedulaNumber: '1234567',
    verificationStatus: 'verified',
    doctorPlan: true,
    createdAt: iso(),
    updatedAt: iso(),
    ...extra,
  };
}

function accessDoc(doctorId, patientId, extra = {}) {
  return {
    accessId: `${doctorId}_${patientId}`,
    doctorId,
    patientId,
    linkId: 'link_1',
    status: 'active',
    consent: bpConsent,
    updatedAt: iso(),
    ...extra,
  };
}

function bpEntry(patientId, id = 'e1') {
  return {
    id,
    patientId,
    type: 'blood_pressure',
    timestamp: iso('02'),
    systolic: 120,
    diastolic: 80,
    pulse: 70,
    createdAt: iso('02'),
    updatedAt: iso('02'),
    source: 'bitacora',
  };
}

let testEnv;

function authed(uid, claims = {}) {
  return testEnv.authenticatedContext(uid, claims).firestore();
}

/** Doctor context with MFA-issued token claims (sign_in_second_factor). */
function doctorAuthed(uid) {
  return authed(uid, {
    email: `${uid}@example.com`,
    email_verified: true,
    firebase: {
      sign_in_provider: 'password',
      sign_in_second_factor: 'totp',
      identities: { email: [`${uid}@example.com`] },
    },
  });
}

async function seed(writer) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await writer(ctx.firestore());
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-auricrx-rules',
    firestore: { rules },
  });
});

after(async () => {
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('users (live patient compatibility, owner-only)', () => {
  it('owner can read and write their users doc; others cannot', async () => {
    const db = authed('pat');
    await assertSucceeds(setDoc(doc(db, 'users', 'pat'), { name: 'P' }));
    await assertSucceeds(getDoc(doc(db, 'users', 'pat')));
    await assertFails(getDoc(doc(db, 'users', 'someone-else')));
    await assertFails(setDoc(doc(db, 'users', 'someone-else'), { name: 'nope' }));
  });
});

describe('bitacora ownership and doctor reads', () => {
  it('patients can write their own readings; doctors cannot write them', async () => {
    const pat = authed('pat');
    await assertSucceeds(setDoc(doc(pat, 'bitacora', 'pat', 'entries', 'e1'), bpEntry('pat')));
    const docDb = doctorAuthed('doc');
    await assertFails(setDoc(doc(docDb, 'bitacora', 'pat', 'entries', 'e2'), bpEntry('pat', 'e2')));
    await assertFails(updateDoc(doc(docDb, 'bitacora', 'pat', 'entries', 'e1'), { systolic: 180 }));
  });

  it('a ready doctor with an active consented link can read that category only', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc'));
      await setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat'));
      await setDoc(doc(db, 'bitacora', 'pat', 'entries', 'bp'), bpEntry('pat', 'bp'));
      await setDoc(doc(db, 'bitacora', 'pat', 'entries', 'glu'), {
        ...bpEntry('pat', 'glu'),
        type: 'glucose',
        glucoseMgDl: 100,
      });
    });
    const docDb = doctorAuthed('doc');
    await assertSucceeds(getDoc(doc(docDb, 'bitacora', 'pat', 'entries', 'bp')));
    await assertFails(getDoc(doc(docDb, 'bitacora', 'pat', 'entries', 'glu')));
  });

  it('revoked links lose access immediately', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc'));
      await setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat', { status: 'revoked' }));
      await setDoc(doc(db, 'bitacora', 'pat', 'entries', 'e1'), bpEntry('pat'));
    });
    await assertFails(getDoc(doc(doctorAuthed('doc'), 'bitacora', 'pat', 'entries', 'e1')));
  });

  it('an unlinked doctor cannot read patient readings', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc'));
      await setDoc(doc(db, 'bitacora', 'pat', 'entries', 'e1'), bpEntry('pat'));
    });
    await assertFails(getDoc(doc(doctorAuthed('doc'), 'bitacora', 'pat', 'entries', 'e1')));
  });

  it('an unverified doctor cannot read even with an access doc', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc', { verificationStatus: 'pending' }));
      await setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat'));
      await setDoc(doc(db, 'bitacora', 'pat', 'entries', 'e1'), bpEntry('pat'));
    });
    await assertFails(getDoc(doc(doctorAuthed('doc'), 'bitacora', 'pat', 'entries', 'e1')));
  });

  it('a doctor without a paid plan cannot read', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc', { doctorPlan: false }));
      await setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat'));
      await setDoc(doc(db, 'bitacora', 'pat', 'entries', 'e1'), bpEntry('pat'));
    });
    await assertFails(getDoc(doc(doctorAuthed('doc'), 'bitacora', 'pat', 'entries', 'e1')));
  });
});

describe('self-promotion and access-mirror writes', () => {
  it('a doctor cannot set verified or doctorPlan on their own profile', async () => {
    const db = doctorAuthed('doc');
    await assertSucceeds(
      setDoc(doc(db, 'doctorProfiles', 'doc'), {
        uid: 'doc',
        displayName: 'Dr',
        specialty: 'IM',
        cedulaNumber: '1234',
        verificationStatus: 'unverified',
        doctorPlan: false,
        createdAt: iso(),
        updatedAt: iso(),
      })
    );
    await assertFails(updateDoc(doc(db, 'doctorProfiles', 'doc'), { verificationStatus: 'verified' }));
    await assertFails(updateDoc(doc(db, 'doctorProfiles', 'doc'), { doctorPlan: true }));
    await assertSucceeds(updateDoc(doc(db, 'doctorProfiles', 'doc'), { verificationStatus: 'pending', updatedAt: iso('03') }));
  });

  it('a doctor cannot grant themselves consent through the access mirror', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc'));
    });
    const db = doctorAuthed('doc');
    await assertFails(
      setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat', { consent: bpConsent }))
    );
    await assertSucceeds(
      setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat', { consent: { ...falseConsent } }))
    );
    await assertFails(
      updateDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), { consent: bpConsent })
    );
  });

  it('the patient can grant consent and later revoke it', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc'));
      await setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat', { consent: { ...falseConsent } }));
      await setDoc(doc(db, 'bitacora', 'pat', 'entries', 'e1'), bpEntry('pat'));
    });
    const pat = authed('pat');
    await assertSucceeds(updateDoc(doc(pat, 'doctorPatientAccess', 'doc_pat'), { consent: bpConsent }));
    await assertSucceeds(getDoc(doc(doctorAuthed('doc'), 'bitacora', 'pat', 'entries', 'e1')));
    await assertSucceeds(updateDoc(doc(pat, 'doctorPatientAccess', 'doc_pat'), { status: 'revoked' }));
    await assertFails(getDoc(doc(doctorAuthed('doc'), 'bitacora', 'pat', 'entries', 'e1')));
  });
});

describe('links, invites, shared data, audit logs', () => {
  it('doctors cannot turn on consent on a link they created', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc'));
    });
    const db = doctorAuthed('doc');
    const link = {
      id: 'link_1',
      patientId: 'pat',
      doctorId: 'doc',
      status: 'active',
      consent: { ...falseConsent },
      createdAt: iso(),
      updatedAt: iso(),
    };
    await assertSucceeds(setDoc(doc(db, 'doctorLinks', 'link_1'), link));
    await assertFails(updateDoc(doc(db, 'doctorLinks', 'link_1'), { consent: bpConsent }));
  });

  it('invite list is denied to non-owners; expired invites cannot be consumed', async () => {
    const now = Timestamp.now();
    const future = Timestamp.fromMillis(Date.now() + 30 * 60 * 1000);
    const past = Timestamp.fromMillis(Date.now() - 60 * 1000);
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorInvites', 'DRABCDEFGH'), {
        code: 'DRABCDEFGH',
        createdBy: 'doc',
        role: 'doctor',
        expiresAt: future,
        createdAt: iso(),
        consumed: false,
      });
      await setDoc(doc(db, 'doctorInvites', 'DREXPIREDX'), {
        code: 'DREXPIREDX',
        createdBy: 'doc',
        role: 'doctor',
        expiresAt: past,
        createdAt: iso(),
        consumed: false,
      });
    });
    const pat = authed('pat');
    await assertSucceeds(getDoc(doc(pat, 'doctorInvites', 'DRABCDEFGH')));
    await assertFails(getDocs(query(collection(pat, 'doctorInvites'), where('createdBy', '==', 'doc'))));
    await assertSucceeds(getDocs(query(collection(doctorAuthed('doc'), 'doctorInvites'), where('createdBy', '==', 'doc'))));
    await assertFails(
      updateDoc(doc(pat, 'doctorInvites', 'DREXPIREDX'), {
        consumed: true,
        consumedBy: 'pat',
        consumedAt: now,
      })
    );
    await assertSucceeds(
      updateDoc(doc(pat, 'doctorInvites', 'DRABCDEFGH'), {
        consumed: true,
        consumedBy: 'pat',
        consumedAt: now,
      })
    );
  });

  it('shared meds require medicationList consent', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc'));
      await setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat', { consent: bpConsent }));
      await setDoc(doc(db, 'patientSharedMeds', 'pat'), { medications: [{ name: 'Metformin' }] });
    });
    await assertFails(getDoc(doc(doctorAuthed('doc'), 'patientSharedMeds', 'pat')));
    await seed(async (db) => {
      await setDoc(
        doc(db, 'doctorPatientAccess', 'doc_pat'),
        accessDoc('doc', 'pat', { consent: { ...falseConsent, medicationList: true } })
      );
    });
    await assertSucceeds(getDoc(doc(doctorAuthed('doc'), 'patientSharedMeds', 'pat')));
  });

  it('audit logs are append-only and cannot be edited or deleted', async () => {
    const pat = authed('pat');
    const entry = {
      id: 'audit_1',
      actorId: 'pat',
      actorRole: 'patient',
      action: 'consent_updated',
      patientId: 'pat',
      doctorId: 'doc',
      createdAt: iso(),
    };
    await assertSucceeds(setDoc(doc(pat, 'doctorAuditLogs', 'audit_1'), entry));
    await assertFails(updateDoc(doc(pat, 'doctorAuditLogs', 'audit_1'), { detail: 'tamper' }));
    await assertFails(deleteDoc(doc(pat, 'doctorAuditLogs', 'audit_1')));
  });
});

describe('doctor profile office-hours visibility', () => {
  it('linked patients can read the doctor profile for office hours; strangers cannot', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc', {
        officeHours: {
          timeZone: 'America/Mexico_City',
          messagingPaused: false,
          windowsByDay: { '1': [{ startMinutes: 540, endMinutes: 1080 }] },
        },
      }));
      await setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat'));
    });
    await assertSucceeds(getDoc(doc(authed('pat'), 'doctorProfiles', 'doc')));
    await assertFails(getDoc(doc(authed('stranger'), 'doctorProfiles', 'doc')));
  });
});

describe('doctorPatientMessages (secure in-app messaging)', () => {
  function messageDoc(over = {}) {
    return {
      id: 'msg_1',
      linkId: 'link_1',
      doctorId: 'doc',
      patientId: 'pat',
      direction: 'patient_to_doctor',
      requestType: 'refill',
      body: 'Necesito surtir mi medicamento',
      status: 'pending_doctor',
      createdAt: iso('02'),
      visibleToDoctorAt: iso('02'),
      updatedAt: iso('02'),
      ...over,
    };
  }

  it('only the linked pair can read; outsiders and revoked links cannot', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc'));
      await setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat'));
      await setDoc(doc(db, 'doctorPatientMessages', 'msg_1'), messageDoc());
    });
    await assertSucceeds(getDoc(doc(authed('pat'), 'doctorPatientMessages', 'msg_1')));
    await assertSucceeds(getDoc(doc(doctorAuthed('doc'), 'doctorPatientMessages', 'msg_1')));
    await assertFails(getDoc(doc(authed('other'), 'doctorPatientMessages', 'msg_1')));

    await seed(async (db) => {
      await setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat', { status: 'revoked' }));
    });
    await assertFails(getDoc(doc(doctorAuthed('doc'), 'doctorPatientMessages', 'msg_1')));
    await assertFails(getDoc(doc(authed('pat'), 'doctorPatientMessages', 'msg_1')));
  });

  it('patient can create a structured request when link is active; doctor cannot create as patient', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc'));
      await setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat'));
    });
    await assertSucceeds(setDoc(doc(authed('pat'), 'doctorPatientMessages', 'msg_1'), messageDoc()));
    await assertFails(
      setDoc(doc(doctorAuthed('doc'), 'doctorPatientMessages', 'msg_2'), messageDoc({ id: 'msg_2' }))
    );
    await assertFails(
      setDoc(doc(authed('pat'), 'doctorPatientMessages', 'msg_3'), messageDoc({ id: 'msg_3', body: '' }))
    );
  });

  it('doctor can apply a quick reply; patient cannot edit the request body after send', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc'));
      await setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat'));
      await setDoc(doc(db, 'doctorPatientMessages', 'msg_1'), messageDoc());
    });
    await assertSucceeds(
      updateDoc(doc(doctorAuthed('doc'), 'doctorPatientMessages', 'msg_1'), {
        status: 'answered',
        doctorAction: 'approve_refill',
        doctorReplyText: 'OK',
        answeredAt: iso('03'),
        updatedAt: iso('03'),
      })
    );
    await assertFails(
      updateDoc(doc(authed('pat'), 'doctorPatientMessages', 'msg_1'), {
        body: 'changed',
        updatedAt: iso('04'),
      })
    );
  });

  it('revocation blocks doctor replies', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc'));
      await setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat', { status: 'revoked' }));
      await setDoc(doc(db, 'doctorPatientMessages', 'msg_1'), messageDoc());
    });
    await assertFails(
      updateDoc(doc(doctorAuthed('doc'), 'doctorPatientMessages', 'msg_1'), {
        status: 'answered',
        doctorAction: 'seen',
        updatedAt: iso('03'),
      })
    );
  });
});

describe('doctor MFA (sign_in_second_factor)', () => {
  it('a ready doctor without MFA cannot read patient data; with MFA can', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'doctorProfiles', 'doc'), readyProfile('doc'));
      await setDoc(doc(db, 'doctorPatientAccess', 'doc_pat'), accessDoc('doc', 'pat'));
      await setDoc(doc(db, 'bitacora', 'pat', 'entries', 'bp'), bpEntry('pat', 'bp'));
      await setDoc(doc(db, 'doctorPatientMessages', 'msg_1'), {
        id: 'msg_1',
        linkId: 'link_1',
        doctorId: 'doc',
        patientId: 'pat',
        direction: 'patient_to_doctor',
        requestType: 'general',
        body: 'hello',
        status: 'pending_doctor',
        createdAt: iso(),
        visibleToDoctorAt: iso(),
        updatedAt: iso(),
      });
      await setDoc(doc(db, 'doctorMfaRecovery', 'doc'), { uid: 'doc', salt: 'x', codes: [] });
    });

    const noMfa = authed('doc', {
      email: 'doc@example.com',
      firebase: { sign_in_provider: 'password', identities: { email: ['doc@example.com'] } },
    });
    await assertFails(getDoc(doc(noMfa, 'bitacora', 'pat', 'entries', 'bp')));
    await assertFails(getDoc(doc(noMfa, 'doctorPatientMessages', 'msg_1')));

    await assertSucceeds(getDoc(doc(doctorAuthed('doc'), 'bitacora', 'pat', 'entries', 'bp')));
    await assertSucceeds(getDoc(doc(doctorAuthed('doc'), 'doctorPatientMessages', 'msg_1')));

    // Patients still read without MFA; recovery hashes are never client-readable.
    await assertSucceeds(getDoc(doc(authed('pat'), 'bitacora', 'pat', 'entries', 'bp')));
    await assertFails(getDoc(doc(doctorAuthed('doc'), 'doctorMfaRecovery', 'doc')));
    await assertFails(getDoc(doc(authed('pat'), 'doctorMfaRecovery', 'doc')));
  });
});

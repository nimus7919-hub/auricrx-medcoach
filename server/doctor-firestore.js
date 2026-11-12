/**
 * The live Firebase project has a single named Firestore database:
 * auricrxmedcoach. There is no (default) database. Admin and client
 * SDKs must target this id or they will miss all production data.
 */
const admin = require('./firebase-admin');

const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'auricrxmedcoach';

function getDoctorFirestore() {
  if (!admin.apps.length) {
    throw new Error('firebase_admin_unavailable');
  }
  const { getFirestore } = require('firebase-admin/firestore');
  return getFirestore(admin.app(), FIRESTORE_DATABASE_ID);
}

module.exports = { getDoctorFirestore, FIRESTORE_DATABASE_ID };

// Firebase web SDK only; session is kept in memory and never stored on this page.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { getAuth, setPersistence, inMemoryPersistence, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';

const response = await fetch('/account-deletion-config');
const firebase = initializeApp(await response.json());
const auth = getAuth(firebase);
await setPersistence(auth, inMemoryPersistence);
const status = document.getElementById('status');
const buttons = [document.getElementById('submit'), document.getElementById('google')];
async function deleteVerifiedAccount(signIn) {
  if (!document.getElementById('confirm').checked) {
    status.textContent = 'Confirma la eliminación primero. / Confirm deletion first.';
    return;
  }
  buttons.forEach(button => { button.disabled = true; });
  try {
    const credential = await signIn();
    const token = await credential.user.getIdToken();
    document.getElementById('password').value = '';
    const result = await fetch('/api/account', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!result.ok) throw new Error('DELETION_INCOMPLETE');
    status.textContent = 'Cuenta y datos eliminados. / Account and data deleted.';
    document.getElementById('deletion').reset();
  } catch {
    status.textContent = 'No se completó la solicitud. Verifica tus datos y vuelve a intentar. / Request did not complete. Verify your credentials and retry.';
  } finally {
    await signOut(auth);
    buttons.forEach(button => { button.disabled = false; });
  }
}
document.getElementById('deletion').addEventListener('submit', event => {
  event.preventDefault();
  deleteVerifiedAccount(() => signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value));
});
document.getElementById('google').addEventListener('click', () => deleteVerifiedAccount(() => signInWithPopup(auth, new GoogleAuthProvider())));

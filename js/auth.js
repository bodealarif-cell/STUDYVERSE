import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { showToast, showLoading } from './ui.js';

export async function signup(email, password, name) {
    if (!email || !password || !name) { showToast('يرجى ملء جميع الحقول', 'error'); return false; }
    if (password.length < 6) { showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error'); return false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { showToast('البريد الإلكتروني غير صالح', 'error'); return false; }
    showLoading(true);
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), { uid: cred.user.uid, name, email, friends: [], createdAt: serverTimestamp() });
        showToast('تم إنشاء الحساب بنجاح! 🎉', 'success');
        return true;
    } catch (error) { showToast(error.message, 'error'); return false; }
    finally { showLoading(false); }
}

export async function login(email, password) {
    if (!email || !password) { showToast('يرجى إدخال البريد وكلمة المرور', 'error'); return false; }
    showLoading(true);
    try { await signInWithEmailAndPassword(auth, email, password); showToast('تم تسجيل الدخول بنجاح', 'success'); return true; }
    catch (error) { showToast('فشل تسجيل الدخول: ' + error.message, 'error'); return false; }
    finally { showLoading(false); }
}

export async function logout() {
    showLoading(true);
    try { await signOut(auth); showToast('تم تسجيل الخروج', 'info'); }
    catch (error) { showToast('خطأ في تسجيل الخروج', 'error'); }
    finally { showLoading(false); }
}

export function onAuth(callback) { return onAuthStateChanged(auth, callback); }

export async function getCurrentUserName(uid) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data().name : 'مستخدم';
}

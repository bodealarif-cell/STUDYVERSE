import { db, storage } from './firebase.js';
import { collection, query, orderBy, addDoc, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { showToast, showLoading, escapeHTML, formatTimestamp } from './ui.js';

let unsubscribe = null;
let currentUser = null;
export function setCurrentUser(user) { currentUser = user; }

export async function uploadReel(file, caption) {
    if (!file) { showToast('اختر فيديو أولاً', 'warning'); return false; }
    showLoading(true);
    try {
        const storageRef = ref(storage, `reels/${currentUser.uid}/${Date.now()}_reel.mp4`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        await addDoc(collection(db, "reels"), { userId: currentUser.uid, videoUrl: url, caption: caption || '', likes: [], createdAt: serverTimestamp() });
        showToast('تم نشر الريلز بنجاح! 🎬', 'success');
        return true;
    } catch (error) { showToast('خطأ في رفع الريلز', 'error'); return false; }
    finally { showLoading(false); }
}

export function loadReelsFeed(container) {
    if (unsubscribe) unsubscribe();
    const q = query(collection(db, "reels"), orderBy("createdAt", "desc"));
    unsubscribe = onSnapshot(q, (snap) => {
        container.innerHTML = '';
        if (snap.empty) { container.innerHTML = '<div class="text-center text-slate-400 text-sm">لا توجد ريلز بعد، كن أول من يرفع!</div>'; return; }
        snap.forEach(docSnap => {
            const reel = docSnap.data();
            const div = document.createElement('div');
            div.className = 'glass-edge rounded-2xl p-3';
            div.innerHTML = `<video src="${reel.videoUrl}" controls class="w-full rounded-xl max-h-64" preload="metadata"></video><p class="mt-2 text-sm">${escapeHTML(reel.caption || '')}</p><div class="flex gap-2 mt-1 text-slate-400 text-xs"><i class="far fa-heart"></i> ${reel.likes?.length || 0}<span class="mx-1">•</span><i class="far fa-clock"></i> ${formatTimestamp(reel.createdAt)}</div>`;
            container.appendChild(div);
        });
    });
    return () => { if (unsubscribe) unsubscribe(); };
}

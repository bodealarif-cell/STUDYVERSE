import { db, storage } from './firebase.js';
import { collection, query, where, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { showToast, showLoading } from './ui.js';

let unsubscribe = null;
let currentUser = null;
export function setCurrentUser(user) { currentUser = user; }

export async function uploadStory(file) {
    if (!file) { showToast('اختر صورة أو فيديو أولاً', 'warning'); return false; }
    showLoading(true);
    try {
        const storageRef = ref(storage, `stories/${currentUser.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        await addDoc(collection(db, "stories"), { userId: currentUser.uid, mediaUrl: url, type: file.type.startsWith("video") ? "video" : "image", expiresAt: new Date(Date.now() + 24*3600*1000), createdAt: serverTimestamp() });
        showToast('تمت إضافة القصة بنجاح! 📸', 'success');
        return true;
    } catch (error) { showToast('خطأ في رفع القصة', 'error'); return false; }
    finally { showLoading(false); }
}

export function loadStoriesFeed(container) {
    if (unsubscribe) unsubscribe();
    const now = new Date();
    const q = query(collection(db, "stories"), where("expiresAt", ">", now));
    unsubscribe = onSnapshot(q, (snap) => {
        container.innerHTML = '';
        if (snap.empty) { container.innerHTML = '<span class="text-xs text-slate-400">لا توجد قصص حالياً</span>'; return; }
        snap.forEach(docSnap => {
            const story = docSnap.data();
            const div = document.createElement('div');
            div.className = 'story-ring w-16 h-16 rounded-full mx-1 flex-shrink-0 cursor-pointer hover:scale-105 transition';
            div.onclick = () => showStory(story);
            div.innerHTML = `<div class="story-ring-inner w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-black">${story.type === 'video' ? `<video src="${story.mediaUrl}" class="w-full h-full object-cover" muted></video>` : `<img src="${story.mediaUrl}" class="w-full h-full object-cover" loading="lazy">`}</div>`;
            container.appendChild(div);
        });
    });
    return () => { if (unsubscribe) unsubscribe(); };
}

function showStory(story) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/90 z-50 flex items-center justify-center cursor-pointer';
    modal.onclick = () => modal.remove();
    modal.innerHTML = `<div class="max-w-lg max-h-screen p-4">${story.type === 'video' ? `<video src="${story.mediaUrl}" controls autoplay class="max-w-full max-h-screen rounded-xl"></video>` : `<img src="${story.mediaUrl}" class="max-w-full max-h-screen rounded-xl">`}</div>`;
    document.body.appendChild(modal);
}

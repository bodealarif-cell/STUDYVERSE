import { db } from './firebase.js';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, arrayUnion, writeBatch, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast, showLoading, escapeHTML } from './ui.js';

let currentUser = null;
let unsubscribe = null;
export function setCurrentUser(user) { currentUser = user; }

export async function searchAndAddFriend(email) {
    if (!email) { showToast('يرجى إدخال البريد الإلكتروني', 'warning'); return; }
    showLoading(true);
    try {
        const q = query(collection(db, "users"), where("email", "==", email));
        const snap = await getDocs(q);
        if (snap.empty) { showToast('لا يوجد مستخدم بهذا البريد', 'error'); return; }
        snap.forEach(async (docSnap) => {
            const friendData = docSnap.data();
            const friendId = friendData.uid;
            if (friendId === currentUser.uid) { showToast('لا يمكنك إضافة نفسك', 'warning'); return; }
            const existingReq = query(collection(db, "friendRequests"), where("from", "==", currentUser.uid), where("to", "==", friendId));
            const existingSnap = await getDocs(existingReq);
            if (!existingSnap.empty) { showToast('تم إرسال طلب صداقة مسبقاً', 'warning'); return; }
            await addDoc(collection(db, "friendRequests"), { from: currentUser.uid, fromName: currentUser.displayName || 'مستخدم', to: friendId, toName: friendData.name, status: "pending", createdAt: serverTimestamp() });
            showToast(`تم إرسال طلب صداقة إلى ${friendData.name}`, 'success');
        });
    } catch (error) { showToast('خطأ في البحث', 'error'); }
    finally { showLoading(false); }
}

export function loadFriendRequests(container) {
    if (!currentUser) return;
    if (unsubscribe) unsubscribe();
    const q = query(collection(db, "friendRequests"), where("to", "==", currentUser.uid), where("status", "==", "pending"));
    unsubscribe = onSnapshot(q, (snap) => {
        container.innerHTML = '';
        if (snap.empty) { container.innerHTML = '<div class="text-center text-slate-400 text-xs">لا توجد طلبات صداقة</div>'; return; }
        snap.forEach(docSnap => {
            const req = docSnap.data();
            const div = document.createElement('div');
            div.className = 'bg-white/10 p-2 rounded-lg flex justify-between items-center';
            div.innerHTML = `<span class="text-xs">${escapeHTML(req.fromName || 'مستخدم')}</span><button class="text-cyan-300 text-xs hover:text-cyan-200 transition accept-request" data-id="${docSnap.id}" data-from="${req.from}">قبول</button>`;
            container.appendChild(div);
        });
        container.querySelectorAll('.accept-request').forEach(btn => { btn.onclick = () => acceptFriendRequest(btn.dataset.id, btn.dataset.from); });
    });
    return unsubscribe;
}

async function acceptFriendRequest(requestId, fromId) {
    showLoading(true);
    try {
        const batch = writeBatch(db);
        batch.update(doc(db, "friendRequests", requestId), { status: "accepted" });
        batch.update(doc(db, "users", currentUser.uid), { friends: arrayUnion(fromId) });
        batch.update(doc(db, "users", fromId), { friends: arrayUnion(currentUser.uid) });
        await batch.commit();
        showToast('تمت إضافة الصديق بنجاح! 🎉', 'success');
    } catch (error) { showToast('خطأ في قبول الطلب', 'error'); }
    finally { showLoading(false); }
}

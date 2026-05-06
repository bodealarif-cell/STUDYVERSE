import { db, auth } from './firebase.js';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, arrayUnion, writeBatch, serverTimestamp } from 'firebase/firestore';
import { showToast } from './ui.js';

let currentUser = null;
let requestsUnsubscribe = null;

export function setCurrentUser(user) {
    currentUser = user;
}

export async function searchAndAddFriend(email) {
    if (!email) {
        showToast('يرجى إدخال البريد الإلكتروني', 'warning');
        return;
    }
    
    showLoading(true);
    try {
        const q = query(collection(db, "users"), where("email", "==", email));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            showToast('لا يوجد مستخدم بهذا البريد', 'error');
            return;
        }
        
        snap.forEach(async (docSnap) => {
            const friendData = docSnap.data();
            const friendId = friendData.uid;
            
            if (friendId === currentUser.uid) {
                showToast('لا يمكنك إضافة نفسك', 'warning');
                return;
            }
            
            // Check if request already exists
            const existingReq = query(collection(db, "friendRequests"), 
                where("from", "==", currentUser.uid), 
                where("to", "==", friendId));
            const existingSnap = await getDocs(existingReq);
            
            if (!existingSnap.empty) {
                showToast('تم إرسال طلب صداقة مسبقاً', 'warning');
                return;
            }
            
            await addDoc(collection(db, "friendRequests"), { 
                from: currentUser.uid, 
                fromName: currentUser.displayName || 'مستخدم',
                to: friendId, 
                toName: friendData.name,
                status: "pending", 
                createdAt: serverTimestamp() 
            });
            showToast(`تم إرسال طلب صداقة إلى ${friendData.name}`, 'success');
        });
    } catch (error) {
        showToast('خطأ في البحث', 'error');
    } finally {
        showLoading(false);
    }
}

export function loadFriendRequests(container) {
    if (!currentUser) return;
    
    if (requestsUnsubscribe) {
        requestsUnsubscribe();
    }
    
    const q = query(collection(db, "friendRequests"), 
        where("to", "==", currentUser.uid), 
        where("status", "==", "pending"));
    
    const unsubscribe = onSnapshot(q, (snap) => {
        container.innerHTML = '';
        if (snap.empty) {
            container.innerHTML = '<div class="text-center text-slate-400 text-xs">لا توجد طلبات صداقة</div>';
            return;
        }
        
        snap.forEach(docSnap => {
            const req = docSnap.data();
            const requestDiv = document.createElement('div');
            requestDiv.className = 'bg-white/10 p-2 rounded-lg flex justify-between items-center';
            requestDiv.innerHTML = `
                <span class="text-xs">${escapeHTML(req.fromName || 'مستخدم')}</span>
                <button class="text-cyan-300 text-xs hover:text-cyan-200 transition accept-request" data-id="${docSnap.id}" data-from="${req.from}">
                    قبول
                </button>
            `;
            container.appendChild(requestDiv);
        });
        
        // Attach accept listeners
        container.querySelectorAll('.accept-request').forEach(btn => {
            btn.onclick = () => acceptFriendRequest(btn.dataset.id, btn.dataset.from);
        });
    });
    
    return unsubscribe;
}

export async function acceptFriendRequest(requestId, fromId) {
    showLoading(true);
    try {
        const batch = writeBatch(db);
        const requestRef = doc(db, "friendRequests", requestId);
        batch.update(requestRef, { status: "accepted" });
        
        const userRef = doc(db, "users", currentUser.uid);
        batch.update(userRef, { friends: arrayUnion(fromId) });
        
        const friendRef = doc(db, "users", fromId);
        batch.update(friendRef, { friends: arrayUnion(currentUser.uid) });
        
        await batch.commit();
        showToast('تمت إضافة الصديق بنجاح! 🎉', 'success');
    } catch (error) {
        showToast('خطأ في قبول الطلب', 'error');
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

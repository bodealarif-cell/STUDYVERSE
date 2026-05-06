import { db, auth } from './firebase.js';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { showToast } from './ui.js';

let currentUser = null;

export function setCurrentUser(user) {
    currentUser = user;
}

export async function loadUserCommunities(container, onSelectCommunity) {
    if (!currentUser) return;
    
    const q = query(collection(db, "communities"), where("members", "array-contains", currentUser.uid));
    const snapshot = await getDocs(q);
    container.innerHTML = '';
    
    snapshot.forEach(docSnap => {
        const comm = docSnap.data();
        const div = document.createElement('div');
        div.className = 'sidebar-icon flex items-center gap-2 p-2 rounded-full cursor-pointer hover:bg-white/10 transition w-full justify-center';
        div.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-700 flex items-center justify-center">
                <i class="fas fa-layer-group text-white"></i>
            </div>
            <span class="channel-name text-sm">${escapeHTML(comm.name)}</span>
        `;
        div.onclick = () => onSelectCommunity(docSnap.id, comm.name);
        container.appendChild(div);
    });
    
    // Create community button
    const addBtn = document.createElement('div');
    addBtn.className = 'sidebar-icon flex items-center gap-2 p-2 rounded-full cursor-pointer hover:bg-white/10 mt-4 w-full justify-center';
    addBtn.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center">
            <i class="fas fa-plus text-emerald-300"></i>
        </div>
        <span class="channel-name text-sm">إنشاء مجتمع</span>
    `;
    addBtn.onclick = () => createCommunity();
    container.appendChild(addBtn);
}

async function createCommunity() {
    if (!currentUser) return;
    const name = prompt("اسم المجتمع (مثل: مجتمع الفيزياء):");
    if (!name) return;
    const desc = prompt("وصف قصير (اختياري):");
    
    showLoading(true);
    try {
        await addDoc(collection(db, "communities"), {
            name: name.trim(),
            description: desc || "",
            ownerId: currentUser.uid,
            members: [currentUser.uid],
            createdAt: serverTimestamp()
        });
        showToast(`تم إنشاء المجتمع "${name}" بنجاح!`, 'success');
        // Reload communities will be handled by caller
    } catch (error) {
        showToast('خطأ في إنشاء المجتمع', 'error');
    } finally {
        showLoading(false);
    }
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

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

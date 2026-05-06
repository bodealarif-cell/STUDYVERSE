import { db, storage } from './firebase.js';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, startAfter, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { showToast, showLoading, escapeHTML, formatTimestamp, createSkeleton } from './ui.js';

let currentUser = null;
let currentCommunityId = null;
let lastDoc = null;

export function setCurrentUser(user) { currentUser = user; }
export function setCurrentCommunity(communityId) { currentCommunityId = communityId; lastDoc = null; }

export async function loadPosts(container, loadMoreBtn, communityId, reset = true) {
    if (!currentUser || !communityId) return;
    if (reset) { lastDoc = null; container.innerHTML = ''; for (let i = 0; i < 3; i++) container.appendChild(createSkeleton()); }
    let q;
    if (lastDoc && !reset) q = query(collection(db, "posts"), where("communityId", "==", communityId), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(10));
    else q = query(collection(db, "posts"), where("communityId", "==", communityId), orderBy("createdAt", "desc"), limit(10));
    try {
        const snapshot = await getDocs(q);
        if (reset) container.innerHTML = '';
        if (snapshot.empty && reset) { container.innerHTML = '<div class="glass-edge p-6 text-center text-slate-400"><i class="fas fa-newspaper text-3xl mb-2 block"></i>لا توجد منشورات بعد. كن أول من يشارك! 📝</div>'; loadMoreBtn.classList.add('hidden'); return; }
        const fragment = document.createDocumentFragment();
        snapshot.forEach(docSnap => { fragment.appendChild(createPostElement(docSnap.id, docSnap.data())); });
        container.appendChild(fragment);
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        loadMoreBtn.classList.toggle('hidden', snapshot.size < 10);
        attachLikeListeners(container);
    } catch (error) { showToast('خطأ في تحميل المنشورات', 'error'); }
}

function createPostElement(postId, post) {
    const likeCount = post.likes?.length || 0;
    const isLiked = post.likes?.includes(currentUser?.uid);
    const div = document.createElement('div');
    div.className = 'glass-edge rounded-2xl p-4 mb-4 transition hover:shadow-lg';
    div.innerHTML = `
        <div class="flex justify-between items-center"><span class="text-cyan-300 font-bold"><i class="fas fa-user-graduate"></i> ${escapeHTML(post.authorName || "طالب")}</span><small class="text-slate-400">${formatTimestamp(post.createdAt)}</small></div>
        <p class="mt-2">${escapeHTML(post.content)}</p>
        ${post.imageUrl ? `<img src="${post.imageUrl}" loading="lazy" class="mt-2 rounded-xl max-h-64 object-cover">` : ''}
        <div class="flex gap-4 mt-3 text-slate-300">
            <button class="like-post-btn flex items-center gap-1 hover:text-pink-400 transition" data-id="${postId}">
                <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart text-pink-500 like-icon"></i> <span class="like-count">${likeCount}</span>
            </button>
            <button class="comment-post-btn flex items-center gap-1 opacity-50 cursor-not-allowed" disabled><i class="far fa-comment"></i> تعليق (قريباً)</button>
        </div>
    `;
    return div;
}

function attachLikeListeners(container) {
    container.querySelectorAll('.like-post-btn').forEach(btn => { btn.onclick = () => handleLikeClick(btn); });
}

async function handleLikeClick(btn) {
    const postId = btn.dataset.id;
    if (!postId || !currentUser) return;
    const icon = btn.querySelector('.like-icon');
    icon.style.animation = 'none'; icon.offsetHeight; icon.style.animation = 'heartPop 0.3s ease-in-out';
    try {
        const postRef = doc(db, "posts", postId);
        const snap = await getDoc(postRef);
        const currentLikes = snap.data().likes || [];
        const isLiked = currentLikes.includes(currentUser.uid);
        if (isLiked) { await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) }); icon.classList.replace('fa-solid', 'fa-regular'); const span = btn.querySelector('.like-count'); span.textContent = parseInt(span.textContent) - 1; }
        else { await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) }); icon.classList.replace('fa-regular', 'fa-solid'); const span = btn.querySelector('.like-count'); span.textContent = parseInt(span.textContent) + 1; }
    } catch (error) { showToast('حدث خطأ', 'error'); }
}

export async function publishPost(content, imageFile, onSuccess) {
    if (!currentCommunityId) { showToast('اختر مجتمعاً أولاً من الشريط الجانبي', 'warning'); return false; }
    if (!content.trim() && !imageFile) { showToast('اكتب محتوى المنشور أو أضف صورة', 'warning'); return false; }
    showLoading(true);
    try {
        let imageUrl = null;
        if (imageFile) { const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}_${imageFile.name}`); await uploadBytes(storageRef, imageFile); imageUrl = await getDownloadURL(storageRef); }
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userName = userDoc.exists() ? userDoc.data().name : "مستخدم";
        await addDoc(collection(db, "posts"), { communityId: currentCommunityId, authorId: currentUser.uid, authorName: userName, content: content.trim(), imageUrl, likes: [], createdAt: serverTimestamp() });
        showToast('تم نشر المنشور بنجاح!', 'success');
        if (onSuccess) onSuccess();
        return true;
    } catch (error) { showToast('خطأ في نشر المنشور', 'error'); return false; }
    finally { showLoading(false); }
}

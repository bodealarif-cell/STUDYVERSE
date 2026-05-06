import { onAuth, signup, login, logout } from './auth.js';
import { setCurrentUser as setAuthUser } from './auth.js';
import { setCurrentUser as setCommunitiesUser, loadUserCommunities } from './communities.js';
import { setCurrentUser as setPostsUser, setCurrentCommunity, loadPosts, publishPost } from './posts.js';
import { setCurrentUser as setFriendsUser, searchAndAddFriend, loadFriendRequests } from './friends.js';
import { setCurrentUser as setStoriesUser, uploadStory, loadStoriesFeed } from './stories.js';
import { setCurrentUser as setReelsUser, uploadReel, loadReelsFeed } from './reels.js';

// DOM elements
const authScreen = document.getElementById('authScreen');
const mainApp = document.getElementById('mainApp');
const communitiesList = document.getElementById('communitiesList');
const communityHeader = document.getElementById('communityHeader');
const communityPosts = document.getElementById('communityPosts');
const loadMoreBtn = document.getElementById('loadMorePostsBtn');
const friendsRequestsList = document.getElementById('friendsRequestsList');
const storiesContainer = document.getElementById('storiesContainer');
const reelsFeed = document.getElementById('reelsFeed');
const newPostContent = document.getElementById('newPostContent');
const postImage = document.getElementById('postImage');
const postImagePreview = document.getElementById('postImagePreview');
const previewImg = document.getElementById('previewImg');
const removeImagePreview = document.getElementById('removeImagePreview');

let currentUser = null;
let currentCommunityId = null;
let currentImageFile = null;
let storiesCleanup = null, reelsCleanup = null, friendsCleanup = null;

onAuth(async (user) => {
    currentUser = user;
    setAuthUser(user); setCommunitiesUser(user); setPostsUser(user); setFriendsUser(user); setStoriesUser(user); setReelsUser(user);
    if (user) {
        authScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        await loadUserCommunities(communitiesList, selectCommunity);
        if (storiesCleanup) storiesCleanup();
        storiesCleanup = loadStoriesFeed(storiesContainer);
        if (reelsCleanup) reelsCleanup();
        reelsCleanup = loadReelsFeed(reelsFeed);
        if (friendsCleanup) friendsCleanup();
        friendsCleanup = loadFriendRequests(friendsRequestsList);
    } else {
        authScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
        currentCommunityId = null;
        if (storiesCleanup) storiesCleanup();
        if (reelsCleanup) reelsCleanup();
        if (friendsCleanup) friendsCleanup();
    }
});

async function selectCommunity(communityId, name) {
    currentCommunityId = communityId;
    setCurrentCommunity(communityId);
    communityHeader.innerHTML = `# ${escapeHTML(name)} <span class="text-xs text-cyan-400">(أنشئ منشورك)</span>`;
    await loadPosts(communityPosts, loadMoreBtn, communityId, true);
}

loadMoreBtn.addEventListener('click', async () => { if (currentCommunityId) await loadPosts(communityPosts, loadMoreBtn, currentCommunityId, false); });

document.getElementById('publishPostBtn').addEventListener('click', async () => {
    await publishPost(newPostContent.value, currentImageFile, () => {
        newPostContent.value = '';
        currentImageFile = null;
        postImage.value = '';
        postImagePreview.classList.add('hidden');
        if (currentCommunityId) loadPosts(communityPosts, loadMoreBtn, currentCommunityId, true);
    });
});

postImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        currentImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => { previewImg.src = e.target.result; postImagePreview.classList.remove('hidden'); };
        reader.readAsDataURL(file);
    }
});
removeImagePreview.addEventListener('click', () => { currentImageFile = null; postImage.value = ''; postImagePreview.classList.add('hidden'); });

document.getElementById('uploadStoryBtn').addEventListener('click', async () => {
    await uploadStory(document.getElementById('storyFile').files[0]);
    document.getElementById('storyFile').value = '';
});
document.getElementById('uploadReelBtn').addEventListener('click', async () => {
    await uploadReel(document.getElementById('reelFile').files[0], document.getElementById('reelCaption').value);
    document.getElementById('reelFile').value = '';
    document.getElementById('reelCaption').value = '';
    document.getElementById('reelPreview').classList.add('hidden');
});
document.getElementById('reelFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) { document.getElementById('reelPreviewVideo').src = URL.createObjectURL(file); document.getElementById('reelPreview').classList.remove('hidden'); }
});
document.getElementById('searchUserBtn').addEventListener('click', async () => { const email = prompt("أدخل البريد الإلكتروني للصديق:"); if (email) await searchAndAddFriend(email); });
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('signupBtn').addEventListener('click', async () => { await signup(document.getElementById('signupEmail').value, document.getElementById('signupPass').value, document.getElementById('signupName').value); });
document.getElementById('loginBtn').addEventListener('click', async () => { await login(document.getElementById('loginEmail').value, document.getElementById('loginPass').value); });

function escapeHTML(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])); }

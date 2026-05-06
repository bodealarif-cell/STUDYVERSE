// Main orchestrator
import { auth } from './firebase.js';
import { onAuth, signup, login, logout, getCurrentUserName } from './auth.js';
import { setCurrentUser as setAuthUser } from './auth.js';
import { setCurrentUser as setCommunitiesUser, loadUserCommunities } from './communities.js';
import { setCurrentUser as setPostsUser, setCurrentCommunity, loadPosts, publishPost } from './posts.js';
import { setCurrentUser as setFriendsUser, searchAndAddFriend, loadFriendRequests } from './friends.js';
import { setCurrentUser as setStoriesUser, uploadStory, loadStoriesFeed } from './stories.js';
import { setCurrentUser as setReelsUser, uploadReel, loadReelsFeed } from './reels.js';
import { showToast, showLoading } from './ui.js';

// DOM Elements
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

// State
let currentUser = null;
let currentCommunityId = null;
let currentImageFile = null;
let storiesCleanup = null;
let reelsCleanup = null;
let friendsCleanup = null;

// Initialize app
onAuth(async (user) => {
    currentUser = user;
    
    // Update module users
    setAuthUser(user);
    setCommunitiesUser(user);
    setPostsUser(user);
    setFriendsUser(user);
    setStoriesUser(user);
    setReelsUser(user);
    
    if (user) {
        // Show main app
        authScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        // Load communities
        await loadUserCommunities(communitiesList, selectCommunity);
        
        // Load feeds
        if (storiesCleanup) storiesCleanup();
        storiesCleanup = loadStoriesFeed(storiesContainer);
        
        if (reelsCleanup) reelsCleanup();
        reelsCleanup = loadReelsFeed(reelsFeed);
        
        if (friendsCleanup) friendsCleanup();
        friendsCleanup = loadFriendRequests(friendsRequestsList);
        
    } else {
        // Show auth screen
        authScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
        currentCommunityId = null;
        
        // Cleanup listeners
        if (storiesCleanup) storiesCleanup();
        if (reelsCleanup) reelsCleanup();
        if (friendsCleanup) friendsCleanup();
    }
});

// Select community
async function selectCommunity(communityId, name) {
    currentCommunityId = communityId;
    setCurrentCommunity(communityId);
    communityHeader.innerHTML = `# ${escapeHTML(name)} <span class="text-xs text-cyan-400">(أنشئ منشورك)</span>`;
    await loadPosts(communityPosts, loadMoreBtn, communityId, true);
}

// Load more posts
loadMoreBtn.addEventListener('click', async () => {
    if (currentCommunityId) {
        await loadPosts(communityPosts, loadMoreBtn, currentCommunityId, false);
    }
});

// Publish post
document.getElementById('publishPostBtn').addEventListener('click', async () => {
    const content = newPostContent.value;
    await publishPost(content, currentImageFile, () => {
        newPostContent.value = '';
        currentImageFile = null;
        postImage.value = '';
        postImagePreview.classList.add('hidden');
        if (currentCommunityId) {
            loadPosts(communityPosts, loadMoreBtn, currentCommunityId, true);
        }
    });
});

// Image preview for posts
postImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        currentImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            postImagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

removeImagePreview.addEventListener('click', () => {
    currentImageFile = null;
    postImage.value = '';
    postImagePreview.classList.add('hidden');
});

// Story upload
document.getElementById('uploadStoryBtn').addEventListener('click', async () => {
    const file = document.getElementById('storyFile').files[0];
    await uploadStory(file);
    document.getElementById('storyFile').value = '';
});

// Reel upload
document.getElementById('uploadReelBtn').addEventListener('click', async () => {
    const file = document.getElementById('reelFile').files[0];
    const caption = document.getElementById('reelCaption').value;
    await uploadReel(file, caption);
    document.getElementById('reelFile').value = '';
    document.getElementById('reelCaption').value = '';
    document.getElementById('reelPreview').classList.add('hidden');
});

// Reel preview
document.getElementById('reelFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const video = document.getElementById('reelPreviewVideo');
        video.src = URL.createObjectURL(file);
        document.getElementById('reelPreview').classList.remove('hidden');
    }
});

// Friend search
document.getElementById('searchUserBtn').addEventListener('click', async () => {
    const email = prompt("أدخل البريد الإلكتروني للصديق:");
    if (email) await searchAndAddFriend(email);
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', logout);

// Auth buttons
document.getElementById('signupBtn').addEventListener('click', async () => {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const pass = document.getElementById('signupPass').value;
    await signup(email, pass, name);
});

document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    await login(email, pass);
});

// Helper function
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

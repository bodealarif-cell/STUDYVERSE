export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-yellow-500' };
    const toast = document.createElement('div');
    toast.className = `toast ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${escapeHTML(message)}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, 3000);
}

export function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

export function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

export function formatTimestamp(timestamp) {
    if (!timestamp?.toDate) return 'الآن';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return date.toLocaleDateString('ar');
}

export function createSkeleton() {
    const div = document.createElement('div');
    div.className = 'glass-edge rounded-2xl p-4 mb-4 animate-pulse';
    div.innerHTML = `<div class="flex justify-between"><div class="h-4 bg-white/20 rounded w-24"></div><div class="h-3 bg-white/20 rounded w-16"></div></div><div class="mt-2 h-16 bg-white/20 rounded"></div>`;
    return div;
}

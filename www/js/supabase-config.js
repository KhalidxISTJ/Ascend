const SUPABASE_URL = 'https://cmjvwciwnfeaipzreagu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BcbmSgqBI5r9sbcl_WcdAw_1t0cnNvO';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const googleSignINBtn = document.getElementById("google-signin-btn");

if (googleSignINBtn) {
    googleSignINBtn.addEventListener('click', async () => {
        const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

        if (isNative) {
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: 'com.khalid.ascend://auth-callback',
                    skipBrowserRedirect: true
                }
            });
            if (error) {
                console.error('Sign-in error:', error.message);
                return;
            }
            await window.Capacitor.Plugins.Browser.open({ url: data.url });
        } else {
            const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
            const { error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + basePath + 'syncing.html'
                }
            });
            if (error) {
                console.error('Sign-in error:', error.message);
            }
        }
    });
}

// ---- SYNC LOGIC ----
const SYNC_FEATURES = {
    quests: 'savedQuests',
    skillTree: 'skillTree',
    codexDecks: 'deckList',
    playerData: 'playerData',
    questSections: 'questSections',
    questCategories: 'questCategories',
    library: 'ascendLibrary',
    lastResetDate: 'lastResetDate',
    motivation: 'motivationEntries',
};

function getPrefix() {
    const email = localStorage.getItem('currentUserEmail');
    return email ? `${email}_` : 'null_';
}

function safeParse(raw) {
    try {
        return JSON.parse(raw);
    } catch {
        return raw; // not JSON — just a plain string, use as-is
    }
}

function collectLocalData() {
    const prefix = getPrefix();
    const bundle = {};
    bundle.username = localStorage.getItem('username');
    for (const [label, key] of Object.entries(SYNC_FEATURES)) {
        const raw = localStorage.getItem(prefix + key);
        bundle[label] = raw ? safeParse(raw) : null;
        const modifiedAt = localStorage.getItem(prefix + key + '_modifiedAt');
        bundle[label + '_modifiedAt'] = modifiedAt ? parseInt(modifiedAt, 10) : 0;
    }
    return bundle;
}

function applyRemoteData(bundle) {
    if (bundle.username) {
        localStorage.setItem('username', bundle.username);
    }
    const prefix = getPrefix();
    const changedLabels = [];

    for (const [label, key] of Object.entries(SYNC_FEATURES)) {
        if (bundle[label] !== undefined && bundle[label] !== null) {
            const remoteModified = bundle[label + '_modifiedAt'] || 0;
            const localModifiedRaw = localStorage.getItem(prefix + key + '_modifiedAt');
            const localModified = localModifiedRaw ? parseInt(localModifiedRaw, 10) : 0;
            const localHasValue = localStorage.getItem(prefix + key) !== null;

            const value = bundle[label];
            // Newer cloud wins. Also load it if this device has never had this feature at all.
            if (remoteModified > localModified || !localHasValue) {
                changedLabels.push(label);
                localStorage.setItem(prefix + key, typeof value === 'string' ? value : JSON.stringify(value));
                if (bundle[label + '_modifiedAt']) {
                    localStorage.setItem(prefix + key + '_modifiedAt', String(bundle[label + '_modifiedAt']));
                }
            }
        }
    }

    if (typeof loadQuests === 'function' && typeof renderQuests === 'function') {
        loadQuests();
        renderQuests();
    }

    // Tell pages which features changed so they can reload themselves
    if (changedLabels.length > 0) {
        document.dispatchEvent(new CustomEvent('dataPulled', { detail: { changed: changedLabels } }));
    }
    return changedLabels;
}

window.hasPulledSuccessfully = false;
let currentSyncState = "Waiting"
function setSyncStatus(state) {
    currentSyncState = state
    const syncState = document.getElementById("sync-status")
    if (syncState === null) { return }
    if (state === "syncing") {
        syncState.textContent = "🔄"
    } else if (state === "synced") {
        syncState.textContent = "✅"
    } else if (state === "error") {
        syncState.textContent = "⚠️"
    } else {
        syncState.textContent = "⏳"
    }
}
document.addEventListener("navLoaded", () => { setSyncStatus(currentSyncState) })

async function pullFromSupabase(userId, event) {
    setSyncStatus("syncing");                          // NEW (1)
    const { data: row, error } = await supabaseClient
        .from('user_data')
        .select('data, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error('Pull error:', error.message);
        setSyncStatus("error");                        // NEW (2)
        window.hasPulledSuccessfully = true;
        window.syncReady = true;
        window.dispatchEvent(new Event('syncReady'));
        return;
    }

    if (row) {
        applyRemoteData(row.data);
        console.log('Pulled synced data from Supabase');
    } else {
        console.log('No synced row yet — pushing local data as the first sync');
    }

    // Mark the pull as resolved before the first-sync push below, so that
    // push isn't blocked by the very gate it needs to pass.
    window.hasPulledSuccessfully = true;
    setSyncStatus("synced");                           // NEW (3)
    startRealtime(userId);

    if (!row) {
        await pushToSupabase(userId);
    }

    window.syncReady = true;
    window.dispatchEvent(new Event('syncReady'));

    if (window.location.pathname.endsWith('syncing.html')) {
        window.location.href = 'index.html';
    }
}

async function pushToSupabase(userId) {
    if (!window.hasPulledSuccessfully) {
        console.log('Skipping push — this device has not confirmed cloud data yet');
        return;
    }

    const bundle = collectLocalData();
    setSyncStatus("syncing");
    const { error } = await supabaseClient
        .from('user_data')
        .upsert({
            user_id: userId,
            data: bundle,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error) {
        console.error('Push error:', error.message);
        setSyncStatus("error");
    } else {
        console.log('Pushed local data to Supabase');
        setSyncStatus("synced");
    }
}

// Shared by every page (loads before index.js/quests.js/library.js): runs
// `callback` once Supabase's pull has genuinely finished (window.syncReady),
// or after a 6s fallback if signed out/offline/slow. Was previously copied
// into each page with its own local flag — call this instead of rolling a
// new copy.
function whenSyncReady(callback) {
    let ran = false;
    function run() {
        if (ran) return;
        ran = true;
        callback();
    }
    if (window.syncReady) {
        run();
    } else {
        window.addEventListener('syncReady', run, { once: true });
        setTimeout(run, 6000);
    }
}

// Fetch the cloud copy again and apply anything newer. quiet = don't flash the sync icon.
let refreshing = false;
async function refreshFromCloud(quiet) {
    const userId = localStorage.getItem('currentUserId');
    if (!userId || !window.hasPulledSuccessfully || refreshing) { return; }
    refreshing = true;
    if (!quiet) { setSyncStatus("syncing"); }
    const { data: row, error } = await supabaseClient
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .maybeSingle();
    refreshing = false;
    if (error) {
        console.error('Refresh error:', error.message);
        if (!quiet) { setSyncStatus("error"); }
        return;
    }
    if (row) { applyRemoteData(row.data); }
    if (!quiet) { setSyncStatus("synced"); }
}

// Coming back to the app/tab, or getting internet back, refreshes from the cloud
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { refreshFromCloud(false); }
});
window.addEventListener('online', () => { refreshFromCloud(false); });

// Realtime: when the cloud row changes, refetch it. We refetch instead of reading
// the event payload because the row is large and realtime payloads can be truncated.
let realtimeChannel = null;
let realtimeTimer = null;
function startRealtime(userId) {
    if (realtimeChannel) { return; }
    realtimeChannel = supabaseClient
        .channel('user-data-' + userId)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'user_data', filter: 'user_id=eq.' + userId },
            () => {
                clearTimeout(realtimeTimer);
                realtimeTimer = setTimeout(() => { refreshFromCloud(true); }, 500);
            })
        .subscribe();
}

let syncTimer = null;
function syncPush() {
    setSyncStatus("waiting");
    clearTimeout(syncTimer);
    const userId = localStorage.getItem('currentUserId');
    syncTimer = setTimeout(() => {
        if (userId) {
            pushToSupabase(userId);
        }
    }, 800);
}

// Run this on page load: checks if someone's signed in, and if so, syncs
let hasPulledOnce = false;

supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('AUTH EVENT:', event);
    if (session && session.user) {
        localStorage.setItem('currentUserId', session.user.id);
        localStorage.setItem('currentUserEmail', session.user.email);
        if (!hasPulledOnce) {
            hasPulledOnce = true;
            setTimeout(() => {
                pullFromSupabase(session.user.id, event);
            }, 0);
        }
    }
});

// Native app only: catch the redirect Android sends back after Google sign-in
if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    window.Capacitor.Plugins.App.addListener('appUrlOpen', async ({ url }) => {
        if (url.includes('auth-callback')) {
            const hashPart = url.split('#')[1];
            if (hashPart) {
                const params = new URLSearchParams(hashPart);
                const access_token = params.get('access_token');
                const refresh_token = params.get('refresh_token');
                if (access_token && refresh_token) {
                    const { error } = await supabaseClient.auth.setSession({ access_token, refresh_token });
                    if (error) {
                        console.error('setSession error:', error.message);
                    }
                }
            }
            await window.Capacitor.Plugins.Browser.close();
            window.location.href = 'syncing.html';
        }
    });
}
document.addEventListener("dataPulled", (e) => {
    // Quests and Codex already refresh themselves
    const handled = [];
    if (document.getElementById("questList")) handled.push("quests");
    if (document.getElementById("deck-list")) handled.push("codexDecks");
    const needsReload = e.detail.changed.some((label) => !handled.includes(label));
    if (!needsReload) return;


    // Safety: never reload more than once every 10 seconds
    const last = Number(sessionStorage.getItem("lastDataReload") || 0);
    if (Date.now() - last < 10000) return;
    sessionStorage.setItem("lastDataReload", Date.now());

    location.reload();
});
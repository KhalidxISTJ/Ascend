const SUPABASE_URL = 'https://cmjvwciwnfeaipzreagu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BcbmSgqBI5r9sbcl_WcdAw_1t0cnNvO';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const googleSignINBtn = document.getElementById("google-signin-btn");

if (googleSignINBtn) {
    googleSignINBtn.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/syncing.html'
            }
        });
        if (error) {
            console.error('Sign-in error:', error.message);
        }
    });
}

// ---- SYNC LOGIC ----

const SYNC_FEATURES = {
    quests: 'savedQuests',
    skillTree: 'skillTree',
    codexData: 'codexData',
    playerData: 'savedPlayerData',
    questSections: 'savedQuestSections',
    questCategories: 'questCategories',
    lastResetDate: 'lastResetDate'
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
    }
    return bundle;
}

function applyRemoteData(bundle) {
    if (bundle.username) {
        localStorage.setItem('username', bundle.username);
    }
    const prefix = getPrefix();
    for (const [label, key] of Object.entries(SYNC_FEATURES)) {
        if (bundle[label] !== undefined && bundle[label] !== null) {
            localStorage.setItem(prefix + key, JSON.stringify(bundle[label]));
        }
    }
}

async function pullFromSupabase(userId, event) {
    const { data: row, error } = await supabaseClient
        .from('user_data')
        .select('data, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error('Pull error:', error.message);
        window.syncReady = true;
        window.dispatchEvent(new Event('syncReady'));
        return;
    }

    if (row) {
        applyRemoteData(row.data);
        console.log('Pulled synced data from Supabase');
    } else {
        console.log('No synced row yet — pushing local data as the first sync');
        await pushToSupabase(userId);
    }

    window.syncReady = true;
    window.dispatchEvent(new Event('syncReady'));

    if (window.location.pathname.endsWith('syncing.html')) {
        window.location.href = 'index.html';
    }
}

async function pushToSupabase(userId) {
    const bundle = collectLocalData();
    const { error } = await supabaseClient
        .from('user_data')
        .upsert({
            user_id: userId,
            data: bundle,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error) {
        console.error('Push error:', error.message);
    } else {
        console.log('Pushed local data to Supabase');
    }
}

function syncPush() {
    const userId = localStorage.getItem('currentUserId');
    if (userId) {
        pushToSupabase(userId);
    }
}

// Run this on page load: checks if someone's signed in, and if so, syncs
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    console.log('AUTH EVENT:', event);
    if (session && session.user) {
        localStorage.setItem('currentUserId', session.user.id);
        localStorage.setItem('currentUserEmail', session.user.email);
        // await pullFromSupabase(session.user.id, event);
    }
});
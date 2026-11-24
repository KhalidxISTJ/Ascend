// =====================================================
// SETTINGS PAGE: notifications, backup / restore, account
// =====================================================
(function () {
    const byId = (id) => document.getElementById(id);
    const currentUser = () => localStorage.getItem("currentUserEmail");

    // =====================
    // NOTIFICATION SETTINGS
    // =====================
    // Same keys and defaults as defaultNotifSettings in quests.js. Keep the two in sync.
    // Saved on this device only, in <user>_notifSettings.

    const NOTIF_DEFAULTS = {
        enabled: true,
        resendEnabled: true,
        resendFirstMinutes: 15,
        resendSecondMinutes: 30,
        snoozeMinutes: 10,
        quietEnabled: true,
        quietStart: "23:00",
        quietEnd: "07:00",
        anytimeEnabled: true,
        anytimeTimes: ["12:00", "17:00", "21:00"],
    };

    function notifSettingsKey() {
        return currentUser() + "_notifSettings";
    }

    function readNotifSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem(notifSettingsKey()));
            return { ...NOTIF_DEFAULTS, ...(saved || {}) };
        } catch (error) {
            return { ...NOTIF_DEFAULTS };
        }
    }

    function getLocalNotifications() {
        if (typeof Capacitor === "undefined" || !Capacitor.Plugins) return null;
        return Capacitor.Plugins.LocalNotifications || null;
    }

    // This page can't rebuild reminders (quests.js does that when Home or Quests opens),
    // but it can switch them off right away.
    // Quest reminders are ids 100000+, Anytime summaries are 90100-90199 (see quests.js)
    const isSummaryId = (id) => Number(id) >= 90100 && Number(id) < 90200;

    async function cancelQuestRemindersDirectly(onlySummaries) {
        const notifier = getLocalNotifications();
        if (!notifier) return;
        try {
            const pending = await notifier.getPending();
            const ours = (pending.notifications || [])
                .filter((item) => isSummaryId(item.id) || (!onlySummaries && Number(item.id) >= 100000))
                .map((item) => ({ id: item.id }));
            if (ours.length) await notifier.cancel({ notifications: ours });
        } catch (error) {
            console.log("Could not cancel quest reminders:", error);
        }
    }

    function initNotificationSettings() {
        const enabledBox = byId("set-enabled");
        const resendBox = byId("set-resend");
        const resend1 = byId("set-resend-1");
        const resend2 = byId("set-resend-2");
        const snooze = byId("set-snooze");
        const quietBox = byId("set-quiet");
        const quietStart = byId("set-quiet-start");
        const quietEnd = byId("set-quiet-end");
        const anytimeBox = byId("set-anytime");
        const anytimeInputs = [byId("set-anytime-1"), byId("set-anytime-2"), byId("set-anytime-3")];
        const hint = byId("notif-hint");

        function setHint(text) {
            hint.textContent = text;
        }

        function setGroup(groupId, inputs, off) {
            byId(groupId).classList.toggle("off", off);
            inputs.forEach((input) => { input.disabled = off; });
        }

        function render() {
            const s = readNotifSettings();
            enabledBox.checked = s.enabled;
            resendBox.checked = s.resendEnabled;
            resend1.value = s.resendFirstMinutes;
            resend2.value = s.resendSecondMinutes;
            snooze.value = s.snoozeMinutes;
            quietBox.checked = s.quietEnabled;
            quietStart.value = s.quietStart;
            quietEnd.value = s.quietEnd;
            anytimeBox.checked = s.anytimeEnabled;
            anytimeInputs.forEach((input, i) => { input.value = s.anytimeTimes[i]; });

            setGroup("notif-details", [resendBox, snooze, quietBox, anytimeBox], !s.enabled);
            setGroup("resend-details", [resend1, resend2], !s.enabled || !s.resendEnabled);
            setGroup("quiet-details", [quietStart, quietEnd], !s.enabled || !s.quietEnabled);
            setGroup("anytime-details", anytimeInputs, !s.enabled || !s.anytimeEnabled);
        }

        function apply(s) {
            if (!getLocalNotifications()) {
                setHint("Saved. Reminders only work in the Android app.");
            } else if (!s.enabled) {
                cancelQuestRemindersDirectly().then(() => setHint("Saved. Reminders turned off."));
            } else {
                if (!s.anytimeEnabled) cancelQuestRemindersDirectly(true);
                setHint("Saved. Reminders update when you go back to Home or Quests.");
            }
        }

        function save(patch) {
            const s = { ...readNotifSettings(), ...patch };
            localStorage.setItem(notifSettingsKey(), JSON.stringify(s));
            render();
            apply(s);
        }

        function saveMinutes(input, field) {
            const value = Math.round(Number(input.value));
            if (!Number.isFinite(value) || value < 1 || value > 120) {
                setHint("Enter a number from 1 to 120.");
                render(); // put the last good value back
                return;
            }
            save({ [field]: value });
        }

        function saveTime(input, field) {
            if (!input.value) {
                setHint("Pick a time.");
                render();
                return;
            }
            save({ [field]: input.value });
        }

        function saveAnytimeTimes() {
            if (anytimeInputs.some((input) => !input.value)) {
                setHint("Pick a time.");
                render();
                return;
            }
            save({ anytimeTimes: anytimeInputs.map((input) => input.value) });
        }

        enabledBox.addEventListener("change", () => save({ enabled: enabledBox.checked }));
        anytimeBox.addEventListener("change", () => save({ anytimeEnabled: anytimeBox.checked }));
        anytimeInputs.forEach((input) => input.addEventListener("change", saveAnytimeTimes));
        resendBox.addEventListener("change", () => save({ resendEnabled: resendBox.checked }));
        resend1.addEventListener("change", () => saveMinutes(resend1, "resendFirstMinutes"));
        resend2.addEventListener("change", () => saveMinutes(resend2, "resendSecondMinutes"));
        snooze.addEventListener("change", () => saveMinutes(snooze, "snoozeMinutes"));
        quietBox.addEventListener("change", () => save({ quietEnabled: quietBox.checked }));
        quietStart.addEventListener("change", () => saveTime(quietStart, "quietStart"));
        quietEnd.addEventListener("change", () => saveTime(quietEnd, "quietEnd"));

        render();
        if (!getLocalNotifications()) setHint("Reminders only work in the Android app.");
    }

    // =====================
    // BACKUP (export)
    // =====================
    // The backup holds EVERYTHING saved under "<user>_", except the things below.
    // (The old export used a fixed list with some wrong names, and missed data.)

    const BACKUP_VERSION = 2;

    // Short-lived or device-only data that doesn't belong in a backup
    const BACKUP_SKIP = new Set([
        "focusSession",     // a running Focus Timer on this device
        "reminderSkips",    // today's skips from notifications
        "reminderSnoozes",  // pending snoozes from notifications
        "skippedToday",     // today's skip order on Home
        "lastBackupAt",     // when the last backup was made
    ]);

    // Names the OLD export used, mapped to the keys the app really reads
    const LEGACY_NAMES = {
        savedQuestSections: "questSections",
        savedPlayerData: "playerData",
    };

    function shouldBackUp(name) {
        return !name.endsWith("_modifiedAt") && !BACKUP_SKIP.has(name);
    }

    function collectBackupData() {
        const prefix = currentUser() + "_";
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(prefix)) continue;
            const name = key.slice(prefix.length);
            if (shouldBackUp(name)) data[name] = localStorage.getItem(key);
        }
        return data;
    }

    function backupFileName() {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        return `ascend-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
    }

    // Gets the file to the person: Android share sheet if the plugins exist, then the
    // browser share sheet, then a normal download. Returns "shared", "downloaded" or "cancelled".
    async function deliverBackup(fileName, text) {
        const plugins = (typeof Capacitor !== "undefined" && Capacitor.Plugins) || {};

        if (plugins.Filesystem && plugins.Share) {
            try {
                const written = await plugins.Filesystem.writeFile({
                    path: fileName,
                    data: text,
                    directory: "CACHE",
                    encoding: "utf8",
                });
                await plugins.Share.share({
                    title: "Ascend backup",
                    url: written.uri,
                    dialogTitle: "Save your Ascend backup",
                });
                return "shared";
            } catch (error) {
                if (/cancel/i.test(String(error && (error.message || error)))) return "cancelled";
                console.log("Share plugin failed, trying another way:", error);
            }
        }

        try {
            const file = new File([text], fileName, { type: "application/json" });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: "Ascend backup" });
                return "shared";
            }
        } catch (error) {
            if (error && error.name === "AbortError") return "cancelled";
            console.log("Browser share failed, downloading instead:", error);
        }

        const blob = new Blob([text], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return "downloaded";
    }

    function showLastBackup() {
        const raw = Number(localStorage.getItem(currentUser() + "_lastBackupAt"));
        const label = byId("last-backup");
        if (!raw) {
            label.textContent = "Last backup: never.";
            return;
        }
        label.textContent = "Last backup: " + new Date(raw).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    }

    async function exportBackup() {
        const hint = byId("backup-hint");
        const backup = {
            app: "Ascend",
            version: BACKUP_VERSION,
            username: currentUser(),
            exportedAt: new Date().toISOString(),
            data: collectBackupData(),
        };
        const text = JSON.stringify(backup, null, 2);
        const result = await deliverBackup(backupFileName(), text);

        if (result === "cancelled") {
            hint.textContent = "Backup cancelled.";
            return;
        }
        localStorage.setItem(currentUser() + "_lastBackupAt", String(Date.now()));
        showLastBackup();
        hint.textContent = result === "shared"
            ? "✅ Backup created. Check where you saved or sent it."
            : "✅ Backup downloaded.";
    }

    // =====================
    // RESTORE (import)
    // =====================

    function handleImport(event) {
        const importFile = event.target;
        const file = importFile.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function () {
            try {
                const backup = JSON.parse(reader.result);

                if (backup.app !== "Ascend") {
                    alert("❌ Invalid file. This isn't an Ascend backup.");
                    return;
                }
                if (!backup.data || typeof backup.data !== "object") {
                    alert("❌ No data found in the backup.");
                    return;
                }

                // Work out what to write (old backups used a few different names)
                const isOld = !backup.version || backup.version < 2;
                const entries = {};
                Object.keys(backup.data).forEach((rawName) => {
                    const value = backup.data[rawName];
                    if (value === null || value === undefined) return;
                    const name = isOld && LEGACY_NAMES[rawName] ? LEGACY_NAMES[rawName] : rawName;
                    if (!shouldBackUp(name)) return;
                    entries[name] = typeof value === "string" ? value : JSON.stringify(value);
                });

                const count = Object.keys(entries).length;
                if (count === 0) {
                    alert("❌ The backup is empty.");
                    return;
                }

                const when = backup.exportedAt ? new Date(backup.exportedAt).toLocaleString() : "an unknown date";
                const other = backup.username && backup.username !== currentUser()
                    ? `\n\n⚠️ This backup is from a different account (${backup.username}).`
                    : "";
                const confirmed = confirm(
                    `⚠️ Restoring will REPLACE the matching data on this account with the backup from ${when} (${count} items).\n\nAnything you've added since then will be lost.${other}\n\nContinue?`,
                );
                if (!confirmed) return;

                const prefix = currentUser() + "_";
                const now = Date.now();
                Object.keys(entries).forEach((name) => {
                    localStorage.setItem(prefix + name, entries[name]);
                    localStorage.setItem(prefix + name + "_modifiedAt", now);
                });

                const userId = localStorage.getItem("currentUserId");
                if (userId && typeof pushToSupabase === "function") {
                    await pushToSupabase(userId);
                }

                alert("✅ Restore complete! Reloading...");
                window.location.reload();
            } catch (error) {
                console.error("Import error:", error);
                alert("❌ Failed to restore. The file might be corrupted.");
            } finally {
                importFile.value = "";
            }
        };
        reader.readAsText(file);
    }

    // =====================
    // ACCOUNT / ABOUT
    // =====================

    async function logout() {
        await supabaseClient.auth.signOut();
        localStorage.removeItem("username");
        localStorage.removeItem("currentUserEmail");
        localStorage.removeItem("currentUserId");
        window.location.href = "splash.html";
    }

    // =====================
    // START
    // =====================

    initNotificationSettings();
    showLastBackup();
    byId("account-email").textContent = currentUser() || "—";
    byId("settings-version").textContent = typeof APP_VERSION !== "undefined" ? APP_VERSION : "—";

    byId("export-btn").addEventListener("click", exportBackup);
    byId("import-btn").addEventListener("click", () => byId("import-file").click());
    byId("import-file").addEventListener("change", handleImport);
    byId("settings-logout-btn").addEventListener("click", logout);
})();
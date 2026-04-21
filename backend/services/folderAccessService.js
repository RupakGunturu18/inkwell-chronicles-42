const ACCESS_TTL_MS = 30 * 60 * 1000;
const unlockedFoldersByUser = new Map();

function normalizeId(value) {
    return value ? value.toString() : '';
}

function clearExpiredAccess(userId) {
    const normalizedUserId = normalizeId(userId);
    const userAccess = unlockedFoldersByUser.get(normalizedUserId);

    if (!userAccess) {
        return;
    }

    const now = Date.now();
    for (const [folderId, expiresAt] of userAccess.entries()) {
        if (expiresAt <= now) {
            userAccess.delete(folderId);
        }
    }

    if (userAccess.size === 0) {
        unlockedFoldersByUser.delete(normalizedUserId);
    }
}

function grantFolderAccess(userId, folderId) {
    const normalizedUserId = normalizeId(userId);
    const normalizedFolderId = normalizeId(folderId);
    if (!normalizedUserId || !normalizedFolderId) {
        return;
    }

    clearExpiredAccess(normalizedUserId);

    const userAccess = unlockedFoldersByUser.get(normalizedUserId) || new Map();
    userAccess.set(normalizedFolderId, Date.now() + ACCESS_TTL_MS);
    unlockedFoldersByUser.set(normalizedUserId, userAccess);
}

function revokeFolderAccess(userId, folderId) {
    const normalizedUserId = normalizeId(userId);
    const normalizedFolderId = normalizeId(folderId);
    if (!normalizedUserId || !normalizedFolderId) {
        return;
    }

    const userAccess = unlockedFoldersByUser.get(normalizedUserId);
    if (!userAccess) {
        return;
    }

    userAccess.delete(normalizedFolderId);

    if (userAccess.size === 0) {
        unlockedFoldersByUser.delete(normalizedUserId);
    }
}

function hasFolderAccess(userId, folderId) {
    const normalizedUserId = normalizeId(userId);
    const normalizedFolderId = normalizeId(folderId);
    if (!normalizedUserId || !normalizedFolderId) {
        return false;
    }

    clearExpiredAccess(normalizedUserId);

    const userAccess = unlockedFoldersByUser.get(normalizedUserId);
    if (!userAccess) {
        return false;
    }

    const expiresAt = userAccess.get(normalizedFolderId);
    if (!expiresAt) {
        return false;
    }

    if (expiresAt <= Date.now()) {
        userAccess.delete(normalizedFolderId);
        return false;
    }

    return true;
}

module.exports = {
    grantFolderAccess,
    hasFolderAccess,
    revokeFolderAccess
};

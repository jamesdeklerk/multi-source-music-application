/**
 * Local backend: removes the Firebase/AngularFire dependency to restore the
 * functionality of the original project.
 *
 * The original Firebase backend no longer exists, so this file implements just the
 * small part of the Firebase API that the app uses (database push/set/update/
 * remove/once and email+password auth) and stores everything in the browser's
 * localStorage. This lets the app run unchanged, with no server.
 *
 * Demo account: demo@example.com / demo123
 */
(function () {
    'use strict';

    var DB_KEY = 'contour-demo-db';
    var USERS_KEY = 'contour-demo-auth-users';
    var SESSION_KEY = 'contour-demo-auth-session';
    var NOTICE_KEY = 'contour-demo-notice-dismissed';

    // ---------------------------------------------------------------------
    // Storage helpers (localStorage may be unavailable, fall back to memory)
    // ---------------------------------------------------------------------
    var memory = {};
    function read(key) {
        try {
            var raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : undefined;
        } catch (e) {
            return memory[key] ? JSON.parse(memory[key]) : undefined;
        }
    }
    function write(key, value) {
        var raw = JSON.stringify(value);
        try { window.localStorage.setItem(key, raw); } catch (e) { memory[key] = raw; }
    }

    // ---------------------------------------------------------------------
    // Database
    // ---------------------------------------------------------------------
    var db = read(DB_KEY) || {};
    var users = read(USERS_KEY) || {};

    // Like Firebase: null/undefined values and empty objects/arrays are not stored.
    function clean(value) {
        if (value === null || value === undefined) { return undefined; }
        if (typeof value !== 'object') { return value; }
        var out = {};
        var count = 0;
        Object.keys(value).forEach(function (k) {
            var c = clean(value[k]);
            if (c !== undefined) { out[k] = c; count++; }
        });
        return count ? out : undefined;
    }
    function copy(value) {
        return value === undefined ? null : JSON.parse(JSON.stringify(value));
    }

    var lastPushTime = 0, pushCounter = 0;
    function pushId() {
        var now = Date.now();
        pushCounter = (now === lastPushTime) ? pushCounter + 1 : 0;
        lastPushTime = now;
        var rand = Math.random().toString(36).slice(2, 8);
        // Sortable by creation time, like Firebase push ids.
        return '-L' + now.toString(36) + ('0' + pushCounter.toString(36)).slice(-2) + rand;
    }

    function getAt(path) {
        var node = db;
        for (var i = 0; i < path.length; i++) {
            if (node === null || typeof node !== 'object' || !(path[i] in node)) { return undefined; }
            node = node[path[i]];
        }
        return node;
    }
    function setAt(path, value) {
        value = clean(value);
        if (!path.length) { db = value || {}; write(DB_KEY, db); return; }
        var node = db;
        for (var i = 0; i < path.length - 1; i++) {
            if (node[path[i]] === null || typeof node[path[i]] !== 'object') {
                if (value === undefined) { return; }
                node[path[i]] = {};
            }
            node = node[path[i]];
        }
        var last = path[path.length - 1];
        if (value === undefined) { delete node[last]; } else { node[last] = value; }
        // Remove parents that became empty.
        for (var depth = path.length - 1; depth > 0; depth--) {
            var parent = getAt(path.slice(0, depth));
            if (parent && Object.keys(parent).length === 0) {
                var grand = getAt(path.slice(0, depth - 1)) || db;
                delete grand[path[depth - 1]];
            } else { break; }
        }
        write(DB_KEY, db);
    }

    function Snapshot(key, value) {
        this.key = key;
        this._value = value;
    }
    Snapshot.prototype.val = function () { return copy(this._value); };
    Snapshot.prototype.exists = function () { return this._value !== undefined; };

    function Reference(path) {
        this._path = path;
        this.key = path.length ? path[path.length - 1] : null;
    }
    Reference.prototype.child = function (name) {
        return new Reference(this._path.concat(String(name).split('/').filter(Boolean)));
    };
    Reference.prototype.once = function () {
        var self = this;
        return Promise.resolve(new Snapshot(self.key, getAt(self._path)));
    };
    Reference.prototype.set = function (value) {
        setAt(this._path, copy(value));
        return Promise.resolve();
    };
    Reference.prototype.update = function (values) {
        var self = this;
        Object.keys(values || {}).forEach(function (k) {
            setAt(self._path.concat(k.split('/')), copy(values[k]));
        });
        return Promise.resolve();
    };
    Reference.prototype.remove = function () {
        setAt(this._path, undefined);
        return Promise.resolve();
    };
    Reference.prototype.push = function (value) {
        var ref = this.child(pushId());
        // Like Firebase, the returned reference is also a promise. It must resolve
        // with a plain (non-thenable) reference, or the promise would wait on itself.
        var promise = value === undefined ? Promise.resolve(ref) : ref.set(value).then(function () { return ref; });
        var thenable = new Reference(ref._path);
        thenable.then = promise.then.bind(promise);
        thenable.catch = promise.catch.bind(promise);
        return thenable;
    };

    // ---------------------------------------------------------------------
    // Auth
    // ---------------------------------------------------------------------
    var authListeners = [];
    var currentUser = null;
    var session = read(SESSION_KEY);
    if (session && users[session.email]) {
        currentUser = { uid: users[session.email].uid, email: session.email };
    }

    function fail(code, message) {
        var error = new Error(message);
        error.code = code;
        return Promise.reject(error);
    }
    function notify() {
        authListeners.forEach(function (cb) { setTimeout(function () { cb(currentUser); }, 0); });
    }
    function setSession(user) {
        currentUser = user;
        write(SESSION_KEY, user ? { email: user.email } : undefined);
        notify();
    }

    var auth = {
        onAuthStateChanged: function (cb) {
            authListeners.push(cb);
            setTimeout(function () { cb(currentUser); }, 0);
        },
        signInWithEmailAndPassword: function (email, password) {
            email = String(email || '').trim().toLowerCase();
            var record = users[email];
            if (!record) { return fail('auth/user-not-found', 'There is no user record corresponding to this identifier.'); }
            if (record.password !== password) { return fail('auth/wrong-password', 'The password is invalid or the user does not exist.'); }
            var user = { uid: record.uid, email: email };
            return new Promise(function (resolve) {
                setTimeout(function () { setSession(user); resolve(user); }, 0);
            });
        },
        createUserWithEmailAndPassword: function (email, password) {
            email = String(email || '').trim().toLowerCase();
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { return fail('auth/invalid-email', 'The email address is badly formatted.'); }
            if (!password || password.length < 6) { return fail('auth/weak-password', 'The password must be 6 characters long or more.'); }
            if (users[email]) { return fail('auth/email-already-in-use', 'The email address is already in use by another account.'); }
            var user = { uid: 'user-' + pushId(), email: email };
            users[email] = { uid: user.uid, password: password };
            write(USERS_KEY, users);
            return new Promise(function (resolve) {
                setTimeout(function () { setSession(user); resolve(user); }, 0);
            });
        },
        signOut: function () {
            return new Promise(function (resolve) {
                setTimeout(function () { setSession(null); resolve(); }, 0);
            });
        },
    };

    window.firebase = {
        initializeApp: function () { },
        database: function () { return { ref: function () { return new Reference([]); } }; },
        auth: function () { return auth; },
    };

    // The app depends on AngularFire's module, but only injects (never uses) these.
    if (window.angular) {
        window.angular.module('firebase', [])
            .factory('$firebaseObject', function () { return function () { }; })
            .factory('$firebaseArray', function () { return function () { }; });
    }

    // ---------------------------------------------------------------------
    // SoundCloud guard: removes a dead-service dependency to restore the original
    // behaviour. The app asks SoundCloud to resolve the (often empty) SoundCloud URL
    // when saving a track and expects a failure if it isn't valid. SoundCloud's old
    // API no longer answers, which would leave that promise pending forever, so
    // fail fast on empty URLs and time out otherwise.
    // ---------------------------------------------------------------------
    window.addEventListener('load', function () {
        if (!window.SC || typeof window.SC.resolve !== 'function') { return; }
        var originalResolve = window.SC.resolve;
        window.SC.resolve = function (url) {
            if (!url || !String(url).trim()) { return Promise.reject(new Error('No URL')); }
            var args = arguments;
            return Promise.race([
                new Promise(function (resolve, reject) { originalResolve.apply(window.SC, args).then(resolve, reject); }),
                new Promise(function (resolve, reject) { setTimeout(function () { reject(new Error('Timed out')); }, 4000); }),
            ]);
        };
    });

    // ---------------------------------------------------------------------
    // Demo account + sample data (created once)
    // ---------------------------------------------------------------------
    function seed() {
        var email = 'demo@example.com';
        if (users[email]) { return; }

        var uid = 'demo-user';
        users[email] = { uid: uid, password: 'demo123' };
        write(USERS_KEY, users);

        var root = new Reference([]);
        var now = Date.now();
        var libraryId = 'demo-library';
        var playlistId = 'demo-playlist-classics';

        var samples = [
            ['Never Gonna Give You Up', 'Rick Astley', 'dQw4w9WgXcQ'],
            ['Bohemian Rhapsody', 'Queen', 'fJ9rUzIMcZQ'],
            ['Take On Me', 'a-ha', 'djV11Xbc914'],
            ['Africa', 'Toto', 'FTQbiNvZqaY'],
            ['Don\'t Stop Believin\'', 'Journey', '1k8craCGpgs'],
        ];

        root.child('users').child(uid).set({ details: { email: email }, library: libraryId });
        root.child('playlists-details').child(libraryId).set({ name: 'Library', owner: uid, uuid: libraryId });
        root.child('playlists-details').child(playlistId).set({ name: 'Classics', owner: uid, uuid: playlistId });
        root.child('users').child(uid).child('playlists').push(playlistId);

        samples.forEach(function (s, i) {
            var trackId = 'demo-track-' + (i + 1);
            root.child('tracks').child(trackId).set({
                uuid: trackId,
                owner: uid,
                title: s[0],
                artist: s[1],
                dateAdded: now + i,
                services: { YouTube: { videoId: s[2] } },
            });
            root.child('playlists-tracks').child(libraryId).push(trackId);
            if (i < 3) { root.child('playlists-tracks').child(playlistId).push(trackId); }
        });
    }
    seed();

    // ---------------------------------------------------------------------
    // Dismissible notice
    // ---------------------------------------------------------------------
    function showNotice() {
        try { if (window.localStorage.getItem(NOTICE_KEY)) { return; } } catch (e) { }

        var box = document.createElement('div');
        box.setAttribute('role', 'dialog');
        box.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:100000;' +
            'max-width:460px;width:calc(100% - 32px);box-sizing:border-box;padding:16px 16px 12px;border-radius:4px;' +
            'background:#fff;color:#212121;box-shadow:0 4px 20px rgba(0,0,0,.35);border-top:4px solid #F44336;' +
            'font:14px/1.45 Roboto,Helvetica,Arial,sans-serif;';
        box.innerHTML =
            '<strong style="font-size:16px">Welcome to Contour (showcase)</strong>' +
            '<p style="margin:8px 0">This project no longer has a backend. It\'s here to showcase the original app, ' +
            'so everything you do is saved only in this browser.</p>' +
            '<p style="margin:8px 0">Sign in with the demo account:<br>' +
            '<code>demo@example.com</code> / <code>demo123</code></p>' +
            '<p style="margin:8px 0;color:#757575;font-size:12px">Some features that relied on outside services ' +
            '(like track title lookup and SoundCloud) may not work.</p>' +
            '<div style="text-align:right"><button type="button" style="border:0;background:none;color:#F44336;' +
            'font:inherit;font-weight:500;text-transform:uppercase;padding:8px;cursor:pointer">Got it</button></div>';
        box.querySelector('button').onclick = function () {
            try { window.localStorage.setItem(NOTICE_KEY, '1'); } catch (e) { }
            box.parentNode.removeChild(box);
        };
        document.body.appendChild(box);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showNotice);
    } else {
        showNotice();
    }
})();

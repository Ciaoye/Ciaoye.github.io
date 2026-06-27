/* ===== 俏也 OS — Virtual File System (IndexedDB) ===== */

OSO.FS = (function() {
    'use strict';

    const DB_NAME = 'oso-filesystem';
    const DB_VERSION = 1;
    let db = null;

    function open() {
        return new Promise(function(resolve, reject) {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = function(e) {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files', { keyPath: 'path' });
                }
            };
            req.onsuccess = function(e) {
                db = e.target.result;
                resolve(db);
            };
            req.onerror = function() {
                reject(new Error('Failed to open IndexedDB'));
            };
        });
    }

    function saveFile(path, data, type) {
        return open().then(function() {
            return new Promise(function(resolve, reject) {
                const tx = db.transaction('files', 'readwrite');
                const store = tx.objectStore('files');
                const record = {
                    path: path,
                    data: data,
                    type: type || 'blob',
                    updatedAt: Date.now()
                };
                store.put(record);
                tx.oncomplete = function() { resolve(); };
                tx.onerror = function() { reject(tx.error); };
            });
        });
    }

    function loadFile(path) {
        return open().then(function() {
            return new Promise(function(resolve, reject) {
                const tx = db.transaction('files', 'readonly');
                const store = tx.objectStore('files');
                const req = store.get(path);
                req.onsuccess = function() { resolve(req.result); };
                req.onerror = function() { reject(req.error); };
            });
        });
    }

    function listFiles() {
        return open().then(function() {
            return new Promise(function(resolve, reject) {
                const tx = db.transaction('files', 'readonly');
                const store = tx.objectStore('files');
                const req = store.getAll();
                req.onsuccess = function() { resolve(req.result); };
                req.onerror = function() { reject(req.error); };
            });
        });
    }

    function deleteFile(path) {
        return open().then(function() {
            return new Promise(function(resolve, reject) {
                const tx = db.transaction('files', 'readwrite');
                const store = tx.objectStore('files');
                store.delete(path);
                tx.oncomplete = function() { resolve(); };
                tx.onerror = function() { reject(tx.error); };
            });
        });
    }

    function deleteFiles(paths) {
        return open().then(function() {
            return new Promise(function(resolve, reject) {
                const tx = db.transaction('files', 'readwrite');
                const store = tx.objectStore('files');
                paths.forEach(function(path) {
                    store.delete(path);
                });
                tx.oncomplete = function() { resolve(); };
                tx.onerror = function() { reject(tx.error); };
            });
        });
    }

    return {
        save: saveFile,
        load: loadFile,
        list: listFiles,
        delete: deleteFile,
        deleteAll: deleteFiles,
        open: open
    };
})();

window.OSO = OSO;

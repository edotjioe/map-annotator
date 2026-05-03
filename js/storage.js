const Storage = (() => {
  const ANNOTATIONS_KEY = 'cdmt_annotations';
  const MAP_SRC_KEY = 'cdmt_map_src';
  let autoSaveTimer = null;

  function save(annotationStore) {
    try {
      localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(annotationStore));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded — annotations may not be saved.');
      }
    }
  }

  function load() {
    const raw = localStorage.getItem(ANNOTATIONS_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function scheduleAutoSave(annotationStore) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => save(annotationStore), 1000);
  }

  function saveMapSrc(src) {
    try {
      localStorage.setItem(MAP_SRC_KEY, src);
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded — map image not cached. It will need to be reloaded next session.');
      }
    }
  }

  function loadMapSrc() {
    return localStorage.getItem(MAP_SRC_KEY);
  }

  function exportJSON(annotationStore) {
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(annotationStore, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cdmt-export-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (typeof data !== 'object' || !Array.isArray(data.annotations)) {
          alert('Invalid annotation file.');
          return;
        }
        callback(data);
      } catch {
        alert('Failed to parse annotation file.');
      }
    };
    reader.readAsText(file);
  }

  function clearAll() {
    localStorage.removeItem(ANNOTATIONS_KEY);
  }

  return { save, load, scheduleAutoSave, saveMapSrc, loadMapSrc, exportJSON, importJSON, clearAll };
})();

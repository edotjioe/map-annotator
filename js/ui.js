const UI = (() => {
  let pendingMarkerLatLng = null;
  let editingAnnotation = null;
  let editingMarker = null;

  function init() {
    renderCategoryList();
    wireButtons();
  }

  function renderCategoryList() {
    const list = document.getElementById('category-list');
    if (!list) return;
    list.innerHTML = '';
    CATEGORIES.forEach(cat => {
      const item = document.createElement('div');
      item.className = 'category-item';
      item.dataset.categoryId = cat.id;
      item.innerHTML = `
        <label class="category-label">
          <input type="checkbox" class="category-toggle" data-category-id="${cat.id}" checked>
          <span class="category-dot" style="background:${cat.color}"></span>
          <span class="category-emoji">${cat.emoji}</span>
          <span class="category-name">${cat.label}</span>
        </label>
        <button class="category-select-btn" data-category-id="${cat.id}" title="Use for drawing/markers">✓</button>
      `;
      list.appendChild(item);
    });

    // Visibility toggles
    list.addEventListener('change', e => {
      if (e.target.classList.contains('category-toggle')) {
        const id = e.target.dataset.categoryId;
        const visible = e.target.checked;
        Drawing.setCategoryVisible(id, visible);
        Markers.setCategoryVisible(id, visible);
      }
    });

    // Category selection for active tool
    list.addEventListener('click', e => {
      const btn = e.target.closest('.category-select-btn');
      if (btn) {
        Toolbar.setActiveCategory(btn.dataset.categoryId);
      }
    });

    // Default selection
    Toolbar.setActiveCategory('custom');
  }

  function wireButtons() {
    // Load map image
    const mapFileInput = document.getElementById('map-file');
    if (mapFileInput) {
      mapFileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const objectURL = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          MapSetup.init(objectURL, img.naturalWidth, img.naturalHeight);
          Drawing.syncCanvas();
          // Persist for next session — skip if image is too large for localStorage
          const reader = new FileReader();
          reader.onload = ev => Storage.saveMapSrc(ev.target.result);
          reader.readAsDataURL(file);
          e.target.value = '';
        };
        img.onerror = () => alert('Failed to load image. Please try a different file.');
        img.src = objectURL;
      });
    }

    // Export
    document.getElementById('btn-export')?.addEventListener('click', () => {
      Storage.exportJSON(window._annotationStore);
    });

    // Import
    const importFileInput = document.getElementById('import-file');
    if (importFileInput) {
      importFileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        Storage.importJSON(file, data => {
          const choice = confirm('Replace all current annotations with the imported data?\n\nOK = Replace, Cancel = Merge');
          if (choice) {
            // Replace
            window._annotationStore.annotations = data.annotations;
          } else {
            // Merge — skip duplicates by id
            const existingIds = new Set(window._annotationStore.annotations.map(a => a.id));
            data.annotations.forEach(a => {
              if (!existingIds.has(a.id)) window._annotationStore.annotations.push(a);
            });
          }
          Storage.save(window._annotationStore);
          // Reload all annotations visually
          location.reload();
        });
        e.target.value = '';
      });
    }

    // Clear all
    document.getElementById('btn-clear')?.addEventListener('click', () => {
      if (confirm('Clear ALL annotations? This cannot be undone.')) {
        window._annotationStore.annotations = [];
        Storage.clearAll();
        location.reload();
      }
    });

    // Modal close on backdrop click
    document.getElementById('modal-overlay')?.addEventListener('click', e => {
      if (e.target === document.getElementById('modal-overlay')) closeModal();
    });

    // Marker placement modal confirm
    document.getElementById('modal-place-btn')?.addEventListener('click', confirmPlaceMarker);
    document.getElementById('modal-cancel-btn')?.addEventListener('click', closeModal);
    document.getElementById('modal-label')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') confirmPlaceMarker();
    });

    // Edit modal confirm
    document.getElementById('modal-edit-place-btn')?.addEventListener('click', confirmEditMarker);
    document.getElementById('modal-edit-cancel-btn')?.addEventListener('click', closeModal);
  }

  // ---------- Marker placement modal ----------

  function openPlaceMarkerModal(latlng) {
    pendingMarkerLatLng = latlng;
    const cat = getCategoryById(Toolbar.getActiveCategory());
    document.getElementById('modal-title').textContent = `Place Marker — ${cat.emoji} ${cat.label}`;
    document.getElementById('modal-label').value = '';
    document.getElementById('modal-notes').value = '';
    showModal('modal-place');
    setTimeout(() => document.getElementById('modal-label')?.focus(), 50);
  }

  function confirmPlaceMarker() {
    const label = document.getElementById('modal-label').value.trim();
    if (!label) {
      document.getElementById('modal-label').focus();
      return;
    }
    const notes = document.getElementById('modal-notes').value.trim();
    Markers.place(pendingMarkerLatLng, Toolbar.getActiveCategory(), label, notes);
    closeModal();
    pendingMarkerLatLng = null;
  }

  // ---------- Edit marker modal ----------

  function openEditMarkerModal(annotation, marker) {
    editingAnnotation = annotation;
    editingMarker = marker;
    const cat = getCategoryById(annotation.categoryId);
    document.getElementById('modal-edit-title').textContent = `Edit Marker — ${cat.emoji} ${cat.label}`;
    document.getElementById('modal-edit-label').value = annotation.label;
    document.getElementById('modal-edit-notes').value = annotation.notes || '';
    showModal('modal-edit');
    setTimeout(() => document.getElementById('modal-edit-label')?.focus(), 50);
  }

  function confirmEditMarker() {
    const label = document.getElementById('modal-edit-label').value.trim();
    if (!label) {
      document.getElementById('modal-edit-label').focus();
      return;
    }
    editingAnnotation.label = label;
    editingAnnotation.notes = document.getElementById('modal-edit-notes').value.trim();
    Markers.updateAnnotation(editingAnnotation);
    closeModal();
  }

  // ---------- Modal helpers ----------

  function showModal(which) {
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('modal-place').style.display = (which === 'modal-place') ? 'block' : 'none';
    document.getElementById('modal-edit').style.display = (which === 'modal-edit') ? 'block' : 'none';
  }

  function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    pendingMarkerLatLng = null;
    editingAnnotation = null;
    editingMarker = null;
  }

  return { init, openPlaceMarkerModal, openEditMarkerModal };
})();

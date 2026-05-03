const Markers = (() => {
  let map = null;
  let annotationStore = null;
  // id -> L.Marker
  const markerMap = {};
  const visibilityMap = {};

  function init(leafletMap, store) {
    map = leafletMap;
    annotationStore = store;
    initPopupDelegation();
  }

  function createIcon(cat) {
    return L.divIcon({
      className: '',
      html: `<div class="map-marker" style="background:${cat.color}" title="${cat.label}">
               <span class="marker-emoji">${cat.emoji}</span>
             </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -22],
    });
  }

  function place(latlng, categoryId, label, notes) {
    const cat = getCategoryById(categoryId);
    const annotation = {
      id: `marker_${Date.now()}_${Object.keys(markerMap).length}`,
      type: 'marker',
      categoryId,
      latlng: [latlng.lat, latlng.lng],
      label,
      notes: notes || '',
    };
    annotationStore.annotations.push(annotation);
    Storage.scheduleAutoSave(annotationStore);
    addMarkerToMap(annotation);
    return annotation;
  }

  function addMarkerToMap(annotation) {
    const cat = getCategoryById(annotation.categoryId);
    const latlng = L.latLng(annotation.latlng[0], annotation.latlng[1]);
    const marker = L.marker(latlng, { icon: createIcon(cat) }).addTo(map);
    bindPopup(marker, annotation);
    markerMap[annotation.id] = marker;

    if (visibilityMap[annotation.categoryId] === false) {
      marker.setOpacity(0);
      // also remove from map interaction
      marker.getElement() && (marker.getElement().style.pointerEvents = 'none');
    }
  }

  function bindPopup(marker, annotation) {
    const cat = getCategoryById(annotation.categoryId);
    const notes = annotation.notes
      ? `<p class="popup-notes">${escapeHtml(annotation.notes)}</p>`
      : '';
    marker.bindPopup(`
      <div class="popup-content">
        <span class="popup-badge" style="background:${cat.color}">${cat.emoji} ${cat.label}</span>
        <strong class="popup-label">${escapeHtml(annotation.label)}</strong>
        ${notes}
        <div class="popup-actions">
          <button class="popup-btn popup-edit" data-id="${annotation.id}">Edit</button>
          <button class="popup-btn popup-delete" data-id="${annotation.id}">Delete</button>
        </div>
      </div>
    `, { maxWidth: 260 });
  }

  // Global delegated click handler for popup buttons — avoids duplicate listeners on re-edit
  function initPopupDelegation() {
    document.addEventListener('click', e => {
      const editBtn = e.target.closest('.popup-edit');
      const deleteBtn = e.target.closest('.popup-delete');
      if (editBtn) {
        const id = editBtn.dataset.id;
        const ann = annotationStore.annotations.find(a => a.id === id);
        if (ann) UI.openEditMarkerModal(ann, markerMap[id]);
      }
      if (deleteBtn) {
        remove(deleteBtn.dataset.id);
      }
    });
  }

  function updateAnnotation(annotation) {
    const marker = markerMap[annotation.id];
    if (!marker) return;
    marker.closePopup();
    bindPopup(marker, annotation);
    Storage.scheduleAutoSave(annotationStore);
  }

  function remove(id) {
    const marker = markerMap[id];
    if (marker) {
      marker.closePopup();
      marker.remove();
      delete markerMap[id];
    }
    annotationStore.annotations = annotationStore.annotations.filter(a => a.id !== id);
    Storage.scheduleAutoSave(annotationStore);
  }

  function restoreAll(store) {
    annotationStore = store;
    const markerAnnotations = store.annotations.filter(a => a.type === 'marker');
    markerAnnotations.forEach(addMarkerToMap);
  }

  function setCategoryVisible(categoryId, visible) {
    visibilityMap[categoryId] = visible;
    Object.values(markerMap).forEach(marker => {
      // find annotation for this marker
      const id = Object.keys(markerMap).find(k => markerMap[k] === marker);
      const ann = annotationStore.annotations.find(a => a.id === id);
      if (ann && ann.categoryId === categoryId) {
        marker.setOpacity(visible ? 1 : 0);
        const el = marker.getElement();
        if (el) el.style.pointerEvents = visible ? '' : 'none';
      }
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { init, place, remove, restoreAll, setCategoryVisible, updateAnnotation };
})();

document.addEventListener('DOMContentLoaded', () => {
  // 1. Build empty annotation store
  const annotationStore = { version: 1, annotations: [] };
  window._annotationStore = annotationStore;

  // 2. Init UI (category list, button wiring)
  UI.init();

  // 3. Determine map image source
  const savedSrc = Storage.loadMapSrc();
  const mapSrc = savedSrc || 'assets/map.jpg';

  // 4. Load image to get natural dimensions, then init Leaflet
  const img = new Image();
  img.onload = () => {
    const W = img.naturalWidth || 1024;
    const H = img.naturalHeight || 1024;

    const map = MapSetup.init(mapSrc, W, H);

    // 5. Init drawing canvas overlay
    const canvas = document.getElementById('draw-canvas');
    Drawing.init(map, canvas, annotationStore);

    // 6. Init markers module
    Markers.init(map, annotationStore);

    // 7. Init toolbar (needs map for dragging enable/disable)
    Toolbar.init(map);

    // 8. Restore saved annotations
    const saved = Storage.load();
    if (saved && Array.isArray(saved.annotations)) {
      annotationStore.annotations = saved.annotations;
      Drawing.restoreAll(annotationStore);
      Markers.restoreAll(annotationStore);
      Drawing.syncCanvas();
    }

    // 9. Wire map events
    map.on('zoom moveend', () => Drawing.syncCanvas());

    // 10. Map click → marker placement or ignore
    map.on('click', e => {
      if (Toolbar.getActiveTool() === 'marker') {
        UI.openPlaceMarkerModal(e.latlng);
      }
    });

    // 11. If no saved map src, show a hint
    if (!savedSrc) {
      const hint = document.getElementById('map-hint');
      if (hint) hint.style.display = 'block';
    }
  };

  img.onerror = () => {
    // Fallback: create a blank 1024×1024 canvas as the map image
    const fc = document.createElement('canvas');
    fc.width = 1024; fc.height = 1024;
    const fctx = fc.getContext('2d');
    fctx.fillStyle = '#2c3e50';
    fctx.fillRect(0, 0, 1024, 1024);
    fctx.fillStyle = '#34495e';
    for (let x = 0; x < 1024; x += 64)
      fctx.fillRect(x, 0, 1, 1024);
    for (let y = 0; y < 1024; y += 64)
      fctx.fillRect(0, y, 1024, 1);
    fctx.fillStyle = '#7f8c8d';
    fctx.font = 'bold 24px sans-serif';
    fctx.textAlign = 'center';
    fctx.fillText('Load your Crimson Desert map', 512, 490);
    fctx.fillText('using the button in the sidebar →', 512, 524);

    img.src = fc.toDataURL();
  };

  img.src = mapSrc;
});

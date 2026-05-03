const Drawing = (() => {
  let map = null;
  let canvas = null;
  let ctx = null;
  let isDrawing = false;
  let currentPoints = []; // pixel points accumulated during active stroke
  let strokes = [];       // StrokeAnnotation[]
  let annotationStore = null;
  let eraserActive = false;
  let eraserRadius = 15;

  function init(leafletMap, canvasEl, store) {
    map = leafletMap;
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    annotationStore = store;

    sizeCanvas();

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    const ro = new ResizeObserver(() => {
      sizeCanvas();
      syncCanvas();
    });
    ro.observe(canvas.parentElement);
  }

  function sizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function getTouchPos(touch) {
    const rect = canvas.getBoundingClientRect();
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  // ---------- Pen tool ----------

  function onMouseDown(e) {
    if (eraserActive) {
      eraseAt(getPos(e));
      return;
    }
    isDrawing = true;
    currentPoints = [];
    const pos = getPos(e);
    currentPoints.push(pos);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    applyStrokeStyle();
  }

  function onMouseMove(e) {
    if (eraserActive && e.buttons === 1) {
      eraseAt(getPos(e));
      return;
    }
    if (!isDrawing) return;
    const pos = getPos(e);
    currentPoints.push(pos);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function onMouseUp() {
    if (!isDrawing) return;
    isDrawing = false;
    commitStroke();
  }

  function onTouchStart(e) {
    e.preventDefault();
    if (eraserActive) return;
    isDrawing = true;
    currentPoints = [];
    const pos = getTouchPos(e.touches[0]);
    currentPoints.push(pos);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    applyStrokeStyle();
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getTouchPos(e.touches[0]);
    currentPoints.push(pos);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function onTouchEnd(e) {
    e.preventDefault();
    if (!isDrawing) return;
    isDrawing = false;
    commitStroke();
  }

  function applyStrokeStyle() {
    const cat = getCategoryById(Toolbar.getActiveCategory());
    ctx.strokeStyle = cat.color;
    ctx.lineWidth = Toolbar.getStrokeWidth();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function commitStroke() {
    if (currentPoints.length < 2) {
      syncCanvas();
      return;
    }
    const cat = getCategoryById(Toolbar.getActiveCategory());
    const points = currentPoints.map(p => {
      const ll = map.containerPointToLatLng(L.point(p.x, p.y));
      return [ll.lat, ll.lng];
    });
    const stroke = {
      id: `stroke_${Date.now()}_${strokes.length}`,
      type: 'stroke',
      categoryId: cat.id,
      color: cat.color,
      width: Toolbar.getStrokeWidth(),
      points,
    };
    strokes.push(stroke);
    annotationStore.annotations.push(stroke);
    Storage.scheduleAutoSave(annotationStore);
    syncCanvas();
  }

  // ---------- Eraser ----------

  function eraseAt(pos) {
    const radius = eraserRadius;
    let changed = false;
    strokes = strokes.filter(stroke => {
      const hit = stroke.points.some(([lat, lng]) => {
        const pt = map.latLngToContainerPoint(L.latLng(lat, lng));
        const dx = pt.x - pos.x;
        const dy = pt.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) <= radius;
      });
      if (hit) {
        annotationStore.annotations = annotationStore.annotations.filter(a => a.id !== stroke.id);
        changed = true;
        return false;
      }
      return true;
    });
    if (changed) {
      Storage.scheduleAutoSave(annotationStore);
      syncCanvas();
    }
  }

  // ---------- Sync / render ----------

  function syncCanvas() {
    sizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw eraser cursor hint is handled by CSS cursor style

    for (const stroke of strokes) {
      if (!isCategoryVisible(stroke.categoryId)) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      let first = true;
      for (const [lat, lng] of stroke.points) {
        const pt = map.latLngToContainerPoint(L.latLng(lat, lng));
        if (first) { ctx.moveTo(pt.x, pt.y); first = false; }
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }
  }

  // ---------- Visibility ----------

  const visibilityMap = {};

  function setCategoryVisible(categoryId, visible) {
    visibilityMap[categoryId] = visible;
    syncCanvas();
  }

  function isCategoryVisible(categoryId) {
    return visibilityMap[categoryId] !== false;
  }

  // ---------- Restore from storage ----------

  function restoreAll(store) {
    annotationStore = store;
    strokes = store.annotations.filter(a => a.type === 'stroke');
  }

  // ---------- Enable / disable ----------

  function enable(isEraser) {
    eraserActive = !!isEraser;
    canvas.style.pointerEvents = 'all';
  }

  function disable() {
    canvas.style.pointerEvents = 'none';
    isDrawing = false;
  }

  function setEraserRadius(r) {
    eraserRadius = r;
  }

  return {
    init,
    syncCanvas,
    enable,
    disable,
    restoreAll,
    setCategoryVisible,
    setEraserRadius,
  };
})();

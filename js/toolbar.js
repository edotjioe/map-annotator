const Toolbar = (() => {
  let activeTool = 'pan';
  let activeCategory = 'custom';
  let strokeWidth = 3;
  let map = null;

  const TOOLS = ['pan', 'pen', 'marker', 'eraser'];

  function init(leafletMap) {
    map = leafletMap;

    TOOLS.forEach(tool => {
      const btn = document.getElementById(`tool-${tool}`);
      if (btn) btn.addEventListener('click', () => setActiveTool(tool));
    });

    const widthSlider = document.getElementById('stroke-width');
    if (widthSlider) {
      widthSlider.addEventListener('input', e => {
        strokeWidth = parseInt(e.target.value, 10);
        document.getElementById('stroke-width-val').textContent = strokeWidth;
      });
    }

    setActiveTool('pan');
  }

  function setActiveTool(tool) {
    activeTool = tool;

    // Update button active states
    TOOLS.forEach(t => {
      const btn = document.getElementById(`tool-${t}`);
      if (btn) btn.classList.toggle('active', t === tool);
    });

    // Show/hide pen settings
    const penSettings = document.getElementById('pen-settings');
    if (penSettings) penSettings.style.display = (tool === 'pen') ? 'block' : 'none';

    const mapEl = document.getElementById('map-container');

    switch (tool) {
      case 'pan':
        Drawing.disable();
        map.dragging.enable();
        mapEl.dataset.tool = 'pan';
        break;
      case 'pen':
        Drawing.enable(false);
        map.dragging.disable();
        mapEl.dataset.tool = 'pen';
        break;
      case 'marker':
        Drawing.disable();
        map.dragging.disable();
        mapEl.dataset.tool = 'marker';
        break;
      case 'eraser':
        Drawing.enable(true);
        map.dragging.disable();
        mapEl.dataset.tool = 'eraser';
        break;
    }

    document.dispatchEvent(new CustomEvent('toolchange', { detail: { tool } }));
  }

  function setActiveCategory(categoryId) {
    activeCategory = categoryId;

    // Update sidebar category button highlights
    document.querySelectorAll('.category-item').forEach(el => {
      el.classList.toggle('category-selected', el.dataset.categoryId === categoryId);
    });

    // Update pen color swatch
    const swatch = document.getElementById('pen-color-swatch');
    if (swatch) {
      const cat = getCategoryById(categoryId);
      swatch.style.background = cat.color;
    }
  }

  function getActiveTool() { return activeTool; }
  function getActiveCategory() { return activeCategory; }
  function getStrokeWidth() { return strokeWidth; }

  return { init, setActiveTool, setActiveCategory, getActiveTool, getActiveCategory, getStrokeWidth };
})();

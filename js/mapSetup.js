const MapSetup = (() => {
  let map = null;
  let imageOverlay = null;
  let currentBounds = null;

  function init(src, W, H) {
    // [[south, west], [north, east]] in CRS.Simple = [[0,0], [height, width]]
    currentBounds = [[0, 0], [H, W]];

    if (map) {
      // Re-init with new image
      imageOverlay.setBounds(currentBounds);
      imageOverlay.setUrl(src);
      map.setMaxBounds(L.latLngBounds(currentBounds).pad(0.2));
      map.fitBounds(currentBounds);
      return map;
    }

    map = L.map('map', {
      crs: L.CRS.Simple,
      minZoom: -4,
      maxZoom: 5,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      attributionControl: false,
      zoomControl: true,
    });

    imageOverlay = L.imageOverlay(src, currentBounds).addTo(map);
    map.setMaxBounds(L.latLngBounds(currentBounds).pad(0.2));
    map.fitBounds(currentBounds);

    return map;
  }

  function getMap() {
    return map;
  }

  function getBounds() {
    return currentBounds;
  }

  return { init, getMap, getBounds };
})();

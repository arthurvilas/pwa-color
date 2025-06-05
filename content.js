function applyThemeColor(color, urlOrigin) {
  // Check if the current page's origin matches the stored URL origin
  if (window.location.origin !== urlOrigin) {
    return; // Don't apply if it's not the right site (e.g., navigating within the same tab to a different origin)
  }

  // Remove all existing theme-color meta tags
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((tag) => tag.remove());

  // Create a new meta tag for theme-color
  metaThemeColor = document.createElement('meta');
  metaThemeColor.setAttribute('name', 'theme-color');

  // Get current color scheme preference
  const prefersDarkScheme = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches;

  // Set media attribute based on color scheme
  metaThemeColor.setAttribute(
    'media',
    prefersDarkScheme
      ? '(prefers-color-scheme: dark)'
      : '(prefers-color-scheme: light)'
  );

  document.head.appendChild(metaThemeColor);
  metaThemeColor.setAttribute('content', color);
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'applyColor') {
    applyThemeColor(request.color, request.url);
    sendResponse({ status: 'COLOR_APPLIED' });
  }
});

// Apply saved theme color on page load
chrome.storage.sync.get(null, (items) => {
  // Get all stored items
  const currentOrigin = window.location.origin;
  if (items[currentOrigin]) {
    applyThemeColor(items[currentOrigin], currentOrigin);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const colorPicker = document.getElementById('colorPicker');
  const colorValue = document.getElementById('colorValue');
  const saveBtn = document.getElementById('saveBtn');
  const removeBtn = document.getElementById('removeBtn');
  const status = document.getElementById('status');
  const pwaStatus = document.getElementById('pwaStatus');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  let currentUrl = null;
  let currentTabId = null;

  // Get current tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      currentUrl = new URL(tabs[0].url).origin;
      currentTabId = tabs[0].id;

      chrome.storage.sync.get([currentUrl], (result) => {
        if (result[currentUrl]) {
          colorPicker.value = result[currentUrl];
          updatePwaStatus(true, result[currentUrl]);
        } else {
          updatePwaStatus(false);
          removeBtn.disabled = true;
        }
      });
    } else {
      showStatus('Could not retrieve the current tab URL.', 'error');
      saveBtn.disabled = true;
      removeBtn.disabled = true;
      colorPicker.disabled = true;
    }
  });

  saveBtn.addEventListener('click', () => {
    if (!currentUrl || !currentTabId) {
      showStatus('No active tab found to apply the color.', 'error');
      return;
    }

    const color = colorPicker.value;
    // Send message to the content script
    chrome.tabs.sendMessage(
      currentTabId,
      {
        action: 'applyColor',
        color: color,
        url: currentUrl,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          showStatus('Error applying color', 'error');
          return;
        }
        if (response && response.status === 'COLOR_APPLIED') {
          // Save the color in storage
          chrome.storage.sync.set({ [currentUrl]: color }, () => {
            showStatus('Theme color saved successfully!', 'success');
            updatePwaStatus(true, color);
            removeBtn.disabled = false;
          });
        } else {
          showStatus('Failed to apply theme color.', 'error');
        }
      }
    );

    // Visual feedback
    saveBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      saveBtn.style.transform = '';
    }, 150);
  });

  removeBtn.addEventListener('click', () => {
    if (!currentUrl) return;
    chrome.storage.sync.remove([currentUrl], () => {
      showStatus(
        'Theme color removed successfully, reload the page to apply.',
        'success'
      );
      updatePwaStatus(false);
      removeBtn.disabled = true;
      statusText.textContent = 'Reload the page';
    });
  });

  colorPicker.addEventListener('input', function () {
    colorValue.textContent = this.value.toUpperCase();
  });

  // Update PWA status display
  function updatePwaStatus(hasColor, savedColor = null) {
    hasSavedColor = hasColor;

    if (hasColor) {
      pwaStatus.className = 'pwa-status has-color';
      statusDot.className = 'status-dot active';
      statusText.textContent = 'Theme color active';

      if (savedColor) {
        colorPicker.value = savedColor;
        colorValue.textContent = savedColor.toUpperCase();
      }
    } else {
      pwaStatus.className = 'pwa-status no-color';
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'No theme color set for this site';
    }
  }

  // Show status message
  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status show ${type}`;
    setTimeout(() => {
      status.classList.remove('show');
    }, 3000);
  }
});

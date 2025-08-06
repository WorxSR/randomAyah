document.addEventListener('DOMContentLoaded', () => {
  const intervalInput = document.getElementById('interval');
  const autoplayCheckbox = document.getElementById('autoplay');
  const optOutLocalStorageCheckbox = document.getElementById('optOutLocalStorage');
  const saveButton = document.getElementById('save');
  const errorMessage = document.getElementById('error-message');

  if (!intervalInput || !autoplayCheckbox || !optOutLocalStorageCheckbox || !saveButton || !errorMessage) {
    console.error('Options DOM elements missing at', new Date().toISOString(), {
      intervalInput: !!intervalInput,
      autoplayCheckbox: !!autoplayCheckbox,
      optOutLocalStorageCheckbox: !!optOutLocalStorageCheckbox,
      saveButton: !!saveButton,
      errorMessage: !!errorMessage
    });
    if (errorMessage) errorMessage.textContent = 'Some settings elements are missing.';
    return;
  }

  if (typeof chrome.storage === 'undefined') {
    if (errorMessage) errorMessage.textContent = 'Storage API unavailable.';
    console.error('Options storage API error at', new Date().toISOString());
    return;
  }

  chrome.storage.sync.get(['interval', 'autoplayAudio', 'optOutLocalStorage'], (result) => {
    if (chrome.runtime.lastError) {
      if (errorMessage) errorMessage.textContent = 'Error loading settings: ' + chrome.runtime.lastError.message;
      console.error('Options load error at', new Date().toISOString(), ':', chrome.runtime.lastError);
      return;
    }
    intervalInput.value = result.interval || 60;
    autoplayCheckbox.checked = result.autoplayAudio || false;
    optOutLocalStorageCheckbox.checked = result.optOutLocalStorage || false;
  });

  saveButton.addEventListener('click', () => {
    const interval = parseInt(intervalInput.value);
    if (isNaN(interval) || interval < 1) {
      if (errorMessage) errorMessage.textContent = 'Please enter a valid interval (minimum 1 minute).';
      return;
    }
    const autoplayAudio = autoplayCheckbox.checked;
    const optOutLocalStorage = optOutLocalStorageCheckbox.checked;
    chrome.storage.sync.set({ interval: interval, autoplayAudio: autoplayAudio, optOutLocalStorage: optOutLocalStorage }, () => {
      if (chrome.runtime.lastError) {
        if (errorMessage) errorMessage.textContent = 'Error saving settings: ' + chrome.runtime.lastError.message;
        console.error('Options save error at', new Date().toISOString(), ':', chrome.runtime.lastError);
      } else {
        if (errorMessage) errorMessage.textContent = '';
        alert('Settings saved!');
        window.close();
      }
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const intervalInput = document.getElementById('interval');
  const autoplayCheckbox = document.getElementById('autoplay');
  const optOutLocalStorageCheckbox = document.getElementById('optOutLocalStorage');
  const tafseerSourceInput = document.getElementById('tafseerSource');
  const saveButton = document.getElementById('save');
  const errorMessage = document.getElementById('error-message');
  const ayahReciterInput = document.getElementById('ayahReciter');
  if (!intervalInput || !autoplayCheckbox || !ayahReciterInput || !optOutLocalStorageCheckbox || !tafseerSourceInput || !saveButton || !errorMessage) {
    console.error('Options DOM elements missing at', new Date().toISOString(), {
      intervalInput: !!intervalInput,
      autoplayCheckbox: !!autoplayCheckbox,
      ayahReciter: !!ayahReciterInput,
      optOutLocalStorageCheckbox: !!optOutLocalStorageCheckbox,
      tafseerSourceInput: !!tafseerSourceInput,
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

  chrome.storage.sync.get(['interval', 'autoplayAudio', 'optOutLocalStorage','tafseerSource'], (result) => {
    if (chrome.runtime.lastError) {
      if (errorMessage) errorMessage.textContent = 'Error loading settings: ' + chrome.runtime.lastError.message;
      console.error('Options load error at', new Date().toISOString(), ':', chrome.runtime.lastError);
      return;
    }
    intervalInput.value = result.interval || 60;
    autoplayCheckbox.checked = result.autoplayAudio || false;
    optOutLocalStorageCheckbox.checked = result.optOutLocalStorage || false;
    ayahReciterInput.value = result.ayahReciter || 'ar.husary';
    tafseerSourceInput.value = result.tafseerSource || 4;
  });

  saveButton.addEventListener('click', () => {
    const interval = parseInt(intervalInput.value);
    if (isNaN(interval) || interval < 1) {
      if (errorMessage) errorMessage.textContent = 'Please enter a valid interval (minimum 1 minute).';
      return;
    }
    const autoplayAudio = autoplayCheckbox.checked;
    const optOutLocalStorage = optOutLocalStorageCheckbox.checked;
    const ayahReciter = ayahReciterInput.value;
    const tafseerSource = parseInt(tafseerSourceInput.value);
    chrome.storage.sync.set({ interval: interval, autoplayAudio: autoplayAudio, optOutLocalStorage: optOutLocalStorage ,tafseerSource:tafseerSource}, () => {
      if (chrome.runtime.lastError) {
        if (errorMessage) errorMessage.textContent = 'Error saving settings: ' + chrome.runtime.lastError.message;
        console.error('Options save error at', new Date().toISOString(), ':', chrome.runtime.lastError);
      } else {
        if (errorMessage) errorMessage.textContent = '';
              console.log("Tafseer saved as",interval | tafseerSource | autoplayAudio |optOutLocalStorage );
        alert('Settings saved!');
       // window.close();
      }
    });
  });
});

document.getElementById('interval').addEventListener('change', (e) => {
  const interval = parseInt(e.target.value);

  chrome.storage.sync.set({ interval }, () => {
    console.log("Interval saved as", interval);

    // Reset alarm
    chrome.runtime.sendMessage({ action: "update-alarm", interval });
  });
});

// tafseer source store value
document.getElementById('tafseerSource').addEventListener('change', (e) => {
 const tafseerSource = parseInt(e.target.value);
  chrome.storage.sync.set({ tafseerSource},() => {
      console.log("Tafseer saved as", tafseerSource);
  });
});

// tafseer source store value
document.getElementById('ayahReciter').addEventListener('change', (e) => {
 const ayahReciter = e.target.value;
  chrome.storage.sync.set({ ayahReciter},() => {
      console.log("reciter saved as", ayahReciter);
});
});



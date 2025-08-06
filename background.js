chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'fetchNewAyah') {
    console.log('Background alarm triggered at', new Date().toISOString());
    fetchRandomAyah();
  }
});

chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'newAyah' || notificationId === 'newAyahFallback') {
    chrome.windows.create({
      url: chrome.runtime.getURL('window.html'),
      type: 'popup',
      width: 320,
      height: 400
    });
  }
});

function isValidAyahData(ayahData) {
  const isValid = ayahData &&
         typeof ayahData.arabic === 'string' && ayahData.arabic.length > 0 &&
         typeof ayahData.translation === 'string' && ayahData.translation.length > 0 &&
         typeof ayahData.surahName === 'string' && ayahData.surahName.length > 0 &&
         typeof ayahData.surahNumber === 'number' && ayahData.surahNumber > 0 &&
         typeof ayahData.ayahNumber === 'number' && ayahData.ayahNumber > 0 &&
         typeof ayahData.audioUrl === 'string';
  console.log('Background isValidAyahData at', new Date().toISOString(), ':', isValid, JSON.stringify(ayahData, null, 2));
  return isValid;
}

function fetchRandomAyah() {
  chrome.storage.sync.get(['interval', 'optOutLocalStorage'], (result) => {
    const interval = result.interval || 60;
    chrome.alarms.create('fetchNewAyah', { periodInMinutes: interval });

    const totalAyahs = 6236;
    const randomAyahNumber = Math.floor(Math.random() * totalAyahs) + 1;
    console.log('Background fetching ayah number at', new Date().toISOString(), ':', randomAyahNumber);

    fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/ar.husary`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Background ar.husary response at', new Date().toISOString(), ':', JSON.stringify(data, null, 2));
        console.log('Background audio field at', new Date().toISOString(), ':', data.data?.audio);
        if (data.code === 200 && data.data && typeof data.data.text === 'string' && data.data.surah) {
          const ayahData = {
            arabic: data.data.text,
            surahName: data.data.surah.englishName || 'Unknown',
            surahNumber: data.data.surah.number || 0,
            ayahNumber: data.data.numberInSurah || 0,
            audioUrl: typeof data.data.audio === 'string' ? data.data.audio : ''
          };

          fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/en.sahih`)
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
              }
              return response.json();
            })
            .then((transData) => {
              console.log('Background en.sahih response at', new Date().toISOString(), ':', JSON.stringify(transData, null, 2));
              if (transData.code === 200 && transData.data && typeof transData.data.text === 'string') {
                ayahData.translation = transData.data.text;
                if (isValidAyahData(ayahData)) {
                  if (!result.optOutLocalStorage) {
                    chrome.storage.local.set({ ayahData }, () => {
                      console.log('Background saved ayahData at', new Date().toISOString(), ':', JSON.stringify(ayahData, null, 2));
                    });
                  } else {
                    console.log('Background skipped local storage due to opt-out at', new Date().toISOString());
                  }
                  chrome.notifications.create('newAyah', {
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('q128.png'),
                    title: 'آية قرآنية جديدة',
                    message: ayahData.arabic,
                    priority: 2
                  }, (notificationId) => {
                    if (chrome.runtime.lastError) {
                      console.error('Background notification error at', new Date().toISOString(), ':', chrome.runtime.lastError.message);
                      chrome.notifications.create('newAyahFallback', {
                        type: 'basic',
                        title: 'آية قرآنية جديدة',
                        message: ayahData.arabic,
                        priority: 2
                      }, () => {
                        if (chrome.runtime.lastError) {
                          console.error('Background fallback notification error at', new Date().toISOString(), ':', chrome.runtime.lastError.message);
                        }
                      });
                    }
                  });
                } else {
                  console.error('Background invalid ayahData at', new Date().toISOString(), ':', JSON.stringify(ayahData, null, 2));
                }
              } else {
                console.error('Background invalid translation data at', new Date().toISOString(), ':', JSON.stringify(transData, null, 2));
              }
            })
            .catch((err) => {
              console.error('Background translation fetch error at', new Date().toISOString(), ':', err);
            });
        } else {
          console.error('Background invalid ar.husary data at', new Date().toISOString(), ':', JSON.stringify(data, null, 2));
        }
      })
      .catch((err) => {
        console.error('Background ar.husary fetch error at', new Date().toISOString(), ':', err);
      });
  });
}



chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'fetchNewAyah') {
    console.log('[Alarm Triggered]', new Date().toISOString());
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

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "update-alarm") {
    chrome.alarms.clear("fetchNewAyah", () => {
      chrome.alarms.create("fetchNewAyah", {
        periodInMinutes: message.interval || 60
      });
    });
  }
});

// Create default alarm on install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('interval', (data) => {
    const interval = data.interval || 60;
    chrome.alarms.create("fetchNewAyah", { periodInMinutes: interval });
    console.log(`[Setup] Alarm created: ${interval} minutes`);
  });
});

  //default Ayah
  const defaultAyah = {
    arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
    surahName: 'Al-Fatiha',
    surahNumber: 1,
    ayahNumber: 1,
    ayahTafseer: 'Not Available Currently',
    audioUrl: 'https://cdn.alquran.cloud/media/audio/ayah/ar.husary/1.mp3'
  };
 

function isValidAyahData(ayahData) {
  const isValid =
    ayahData &&
    typeof ayahData.arabic === 'string' && ayahData.arabic.length > 0 &&
    typeof ayahData.translation === 'string' && ayahData.translation.length > 0 &&
    typeof ayahData.surahName === 'string' && ayahData.surahName.length > 0 &&
    typeof ayahData.surahNumber === 'number' && ayahData.surahNumber > 0 &&
    typeof ayahData.ayahNumber === 'number' && ayahData.ayahNumber > 0 &&
    typeof ayahData.audioUrl === 'string';
  console.log('[isValidAyahData]', isValid, ayahData);
  return isValid;
}

function fetchRandomAyah() {

  chrome.storage.sync.get(['optOutLocalStorage', 'tafseerSource','ayahReciter'], (settings) => {
    const tafseerSource = settings.tafseerSource || 1;
    const ayahReciter= settings.ayahReciter||'ar.husary';
    const totalAyahs = 6236;
    const randomAyahNumber = Math.floor(Math.random() * totalAyahs) + 1;

    console.log('[Fetch Start] Ayah #', randomAyahNumber);

    // Step 1: Arabic
    fetch(`http://api.alquran.cloud/v1/ayah/${randomAyahNumber}/${ayahReciter}`)
      .then(res => {
        if (!res.ok) throw new Error(`Arabic fetch error ${res.status}`);
        return res.json();
      })
      .then(arData => {
        const ayahData = {
          arabic: arData.data.text,
          surahName: arData.data.surah.name || 'Unknown',
          surahNumber: arData.data.surah.number || 0,
          ayahNumber: arData.data.numberInSurah || 0,
          audioUrl: typeof arData.data.audio === 'string' ? arData.data.audio : ''
        }; 

        // Step 2: Translation
        return fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/en.sahih`)
          .then(res => {
            if (!res.ok) throw new Error(`Translation fetch error ${res.status}`);
            return res.json();
          })
          .then(transData => {
            ayahData.translation = transData.data.text;
            return ayahData;
          });
      })
      // Step 3: Tafseer
      .then(ayahData => {
        return fetch(`http://api.quran-tafseer.com/tafseer/${tafseerSource}/${ayahData.surahNumber}/${ayahData.ayahNumber}`)
          .then(res => {
            if (!res.ok) throw new Error(`Tafseer fetch error ${res.status}`);
            return res.json();
          })
          .then(tafseerData => {
            if (tafseerData && tafseerData.text) {
              ayahData.tafseer = `${tafseerData.tafseer_name}: ${tafseerData.text}`;
            } else {
              ayahData.tafseer = 'No Tafseer available.';
            }
            return ayahData;
          })
          .catch(err => {
            console.error('[Tafseer Error]', err);
            ayahData.tafseer = 'Error fetching Tafseer.';
            return ayahData;
          });
      })
      // Step 4: Save & Notify
      .then(ayahData => {
               if (isValidAyahData(ayahData)) {
                  if (!settings.optOutLocalStorage) {
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
      });


      });


}


/* to replace optout if needed
              chrome.storage.local.set({ ayahData }, () => {
              console.log('[Saved AyahData]', ayahData);
            });
          }
          chrome.notifications.create('newAyah', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('q128.png'),
            title: 'آية قرآنية جديدة',
            message: ayahData.arabic,
            priority: 2
          }, () => {
            if (chrome.runtime.lastError) {
              console.error('[Notification Error]', chrome.runtime.lastError.message);
              chrome.notifications.create('newAyahFallback', {
                type: 'basic',
                title: 'آية قرآنية جديدة',
                message: ayahData.arabic,
                priority: 2
              });
            }
          });
*/

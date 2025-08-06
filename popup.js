document.addEventListener('DOMContentLoaded', () => {
  const ayahArabic = document.getElementById('ayah-arabic');
  const ayahTranslation = document.getElementById('ayah-translation');
  const ayahReference = document.getElementById('ayah-reference');
  const playButton = document.getElementById('play-audio');
  const audioElement = document.getElementById('ayah-audio');
  const errorMessage = document.getElementById('error-message');

  if (!ayahArabic || !ayahTranslation || !ayahReference || !playButton || !audioElement || !errorMessage) {
    console.error('Popup DOM elements missing at', new Date().toISOString(), {
      ayahArabic: !!ayahArabic,
      ayahTranslation: !!ayahTranslation,
      ayahReference: !!ayahReference,
      playButton: !!playButton,
      audioElement: !!audioElement,
      errorMessage: !!errorMessage
    });
    return;
  }

  const defaultAyah = {
    arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
    surahName: 'Al-Fatiha',
    surahNumber: 1,
    ayahNumber: 1,
    audioUrl: 'https://cdn.alquran.cloud/media/audio/ayah/ar.husary/1.mp3'
  };

  chrome.storage.sync.get(['optOutLocalStorage'], (result) => {
    if (!result.optOutLocalStorage) {
      chrome.storage.local.get(['ayahData'], (localResult) => {
        console.log('Popup stored ayahData at', new Date().toISOString(), ':', JSON.stringify(localResult.ayahData, null, 2));
        if (localResult.ayahData && isValidAyahData(localResult.ayahData)) {
          displayAyah(localResult.ayahData);
        } else {
          setErrorMessage('لا توجد بيانات آية صالحة في التخزين');
          console.log('Popup no valid ayah data, fetching new ayah');
          fetchRandomAyah().catch((err) => {
            setErrorMessage('خطأ في جلب الآية: ' + err.message);
            console.error('Popup fetchRandomAyah error at', new Date().toISOString(), ':', err);
            displayAyah(defaultAyah);
          });
        }
      });
    } else {
      setErrorMessage('Local storage opted out, fetching new ayah');
      console.log('Popup local storage opted out, fetching new ayah');
      fetchRandomAyah().catch((err) => {
        setErrorMessage('خطأ في جلب الآية: ' + err.message);
        console.error('Popup fetchRandomAyah error at', new Date().toISOString(), ':', err);
        displayAyah(defaultAyah);
      });
    }
  });

  playButton.addEventListener('click', () => {
    if (audioElement.src && audioElement.src !== '') {
      audioElement.play().catch((err) => {
        setErrorMessage('خطأ في تشغيل الصوت: ' + err.message);
        console.error('Popup audio playback error at', new Date().toISOString(), ':', err);
      });
    } else {
      setErrorMessage('لا يوجد صوت متاح للتشغيل');
      console.log('Popup no valid audio URL at', new Date().toISOString());
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
    console.log('Popup isValidAyahData at', new Date().toISOString(), ':', isValid, JSON.stringify(ayahData, null, 2));
    return isValid;
  }

  async function fetchRandomAyah() {
    const totalAyahs = 6236;
    const randomAyahNumber = Math.floor(Math.random() * totalAyahs) + 1;
    console.log('Popup fetching ayah number at', new Date().toISOString(), ':', randomAyahNumber);

    try {
      const arResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/ar.husary`);
      if (!arResponse.ok) {
        throw new Error(`HTTP error ${arResponse.status}`);
      }
      const data = await arResponse.json();
      console.log('Popup ar.husary response at', new Date().toISOString(), ':', JSON.stringify(data, null, 2));
      console.log('Popup audio field at', new Date().toISOString(), ':', data.data?.audio);

      if (data.code === 200 && data.data && typeof data.data.text === 'string' && data.data.surah) {
        const ayahData = {
          arabic: data.data.text,
          surahName: data.data.surah.englishName || 'Unknown',
          surahNumber: data.data.surah.number || 0,
          ayahNumber: data.data.numberInSurah || 0,
          audioUrl: typeof data.data.audio === 'string' ? data.data.audio : ''
        };

        const transResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/en.sahih`);
        if (!transResponse.ok) {
          throw new Error(`HTTP error ${transResponse.status}`);
        }
        const transData = await transResponse.json();
        console.log('Popup en.sahih response at', new Date().toISOString(), ':', JSON.stringify(transData, null, 2));

        if (transData.code === 200 && transData.data && typeof transData.data.text === 'string') {
          ayahData.translation = transData.data.text;
          if (isValidAyahData(ayahData)) {
            if (!chrome.storage.sync.get(['optOutLocalStorage'], (result) => result.optOutLocalStorage)) {
              await new Promise((resolve) => {
                chrome.storage.local.set({ ayahData }, () => {
                  console.log('Popup saved ayahData at', new Date().toISOString(), ':', JSON.stringify(ayahData, null, 2));
                  resolve();
                });
              });
            }
            displayAyah(ayahData);
          } else {
            setErrorMessage('بيانات الآية غير صالحة بعد الجلب');
            console.error('Popup invalid ayahData at', new Date().toISOString(), ':', JSON.stringify(ayahData, null, 2));
            displayAyah(defaultAyah);
          }
        } else {
          setErrorMessage('خطأ في جلب الترجمة: بيانات غير صالحة');
          console.error('Popup invalid translation data at', new Date().toISOString(), ':', JSON.stringify(transData, null, 2));
          displayAyah(defaultAyah);
        }
      } else {
        setErrorMessage('خطأ في جلب الآية أو الصوت: بيانات غير صالحة');
        console.error('Popup invalid ar.husary data at', new Date().toISOString(), ':', JSON.stringify(data, null, 2));
        displayAyah(defaultAyah);
      }
    } catch (err) {
      setErrorMessage('خطأ في جلب الآية: ' + err.message);
      console.error('Popup fetchRandomAyah error at', new Date().toISOString(), ':', err);
      displayAyah(defaultAyah);
    }
  }

  function displayAyah(ayahData) {
    try {
      if (!isValidAyahData(ayahData)) {
        throw new Error('بيانات الآية غير صالحة');
      }
      ayahArabic.textContent = ayahData.arabic;
      ayahTranslation.textContent = ayahData.translation;
      ayahReference.textContent = `Surah ${ayahData.surahName} (${ayahData.surahNumber}:${ayahData.ayahNumber})`;
      audioElement.src = ayahData.audioUrl || '';
      playButton.disabled = !ayahData.audioUrl;
      setErrorMessage(ayahData.audioUrl ? '' : 'لا يوجد رابط صوتي متاح');
      console.log('Popup displayed ayah at', new Date().toISOString(), ':', JSON.stringify(ayahData, null, 2));

      chrome.storage.sync.get(['autoplayAudio'], (result) => {
        if (result.autoplayAudio) {
          audioElement.play().catch((err) => {
            setErrorMessage('خطأ في تشغيل الصوت التلقائي: ' + err.message);
            console.error('Popup autoplay error at', new Date().toISOString(), ':', err);
          });
        }
      });
    } catch (err) {
      setErrorMessage('خطأ في عرض الآية: ' + err.message);
      console.error('Popup displayAyah error at', new Date().toISOString(), ':', err, JSON.stringify(ayahData, null, 2));
    }
  }

  function setErrorMessage(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
    } else {
      console.error('Error message element not found at', new Date().toISOString(), ': Attempted to set', message);
    }
  }
});

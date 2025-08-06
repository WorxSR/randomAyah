document.addEventListener('DOMContentLoaded', () => {
  const ayahArabic = document.getElementById('ayah-arabic');
  const ayahTranslation = document.getElementById('ayah-translation');
  const ayahReference = document.getElementById('ayah-reference');
  const playButton = document.getElementById('play-audio');
  const audioElement = document.getElementById('ayah-audio');
  const errorMessage = document.getElementById('error-message');

  if (!ayahArabic || !ayahTranslation || !ayahReference || !playButton || !audioElement || !errorMessage) {
    console.error('Window DOM elements missing at', new Date().toISOString(), {
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
        console.log('Window stored ayahData at', new Date().toISOString(), ':', JSON.stringify(localResult.ayahData, null, 2));
        if (localResult.ayahData && isValidAyahData(localResult.ayahData)) {
          displayAyah(localResult.ayahData);
        } else {
          setErrorMessage('لا توجد بيانات آية صالحة في التخزين');
          console.log('Window no valid ayah data, using default');
          displayAyah(defaultAyah);
        }
      });
    } else {
      setErrorMessage('Local storage opted out, using default ayah');
      console.log('Window local storage opted out, using default ayah');
      displayAyah(defaultAyah);
    }
  });

  playButton.addEventListener('click', () => {
    if (audioElement.src && audioElement.src !== '') {
      audioElement.play().catch((err) => {
        setErrorMessage('خطأ في تشغيل الصوت: ' + err.message);
        console.error('Window audio playback error at', new Date().toISOString(), ':', err);
      });
    } else {
      setErrorMessage('لا يوجد صوت متاح للتشغيل');
      console.log('Window no valid audio URL at', new Date().toISOString());
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
    console.log('Window isValidAyahData at', new Date().toISOString(), ':', isValid, JSON.stringify(ayahData, null, 2));
    return isValid;
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
      console.log('Window displayed ayah at', new Date().toISOString(), ':', JSON.stringify(ayahData, null, 2));

      chrome.storage.sync.get(['autoplayAudio'], (result) => {
        if (result.autoplayAudio) {
          audioElement.play().catch((err) => {
            setErrorMessage('خطأ في تشغيل الصوت التلقائي: ' + err.message);
            console.error('Window autoplay error at', new Date().toISOString(), ':', err);
          });
        }
      });
    } catch (err) {
      setErrorMessage('خطأ في عرض الآية: ' + err.message);
      console.error('Window displayAyah error at', new Date().toISOString(), ':', err, JSON.stringify(ayahData, null, 2));
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

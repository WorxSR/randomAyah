 document.addEventListener('DOMContentLoaded', () => {
  
  const ayahArabic = document.getElementById('ayah-arabic');
  const ayahTranslation = document.getElementById('ayah-translation');
  const ayahReference = document.getElementById('ayah-reference');
  const ayahTafseer = document.getElementById('ayah-tafseer');
  const playButton = document.getElementById('play-audio');
  const audioElement = document.getElementById('ayah-audio');
  const errorMessage = document.getElementById('error-message');
  const surahSelect = document.getElementById("surahSelect");
  const ayahSelect = document.getElementById("ayahSelect");
  const goBtn = document.getElementById("goBtn");

  const BASE_URL = "https://api.alquran.cloud/v1";
  const totalAyahs = 6236;
  const randomAyahNumber= Math.floor(Math.random() * totalAyahs) + 1;

 
  if (!ayahArabic || !ayahTranslation || !ayahReference || !ayahTafseer || !playButton || !audioElement || !errorMessage) {
    console.error('Popup DOM elements missing at', new Date().toISOString(), {
      ayahArabic: !!ayahArabic,
      ayahTranslation: !!ayahTranslation,
      ayahReference: !!ayahReference,
      ayahTafseer: !!ayahTafseer,
      playButton: !!playButton,
      audioElement: !!audioElement,
      errorMessage: !!errorMessage
    });
    return;
  }

  // chk optoutstorage and default Ayah
  const defaultAyah = {
    arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
    surahName: 'Al-Fatiha',
    surahNumber: 1,
    ayahNumber: 1,
    ayahTafseer: 'Not Available Currently',
    audioUrl: 'https://cdn.alquran.cloud/media/audio/ayah/ar.husary/1.mp3'
  };
  
    chrome.storage.sync.get(['optOutLocalStorage'], (result) => {
    if (!result.optOutLocalStorage) {
      chrome.storage.local.get(['ayahData'], (localResult) => {
    //    console.log('window stored ayahData at', new Date().toISOString(), ':', JSON.stringify(localResult.ayahData, null, 2));
        if (localResult.ayahData) {
         // setErrorMessage(result.optOutLocalStorage);
          displayAyah(localResult.ayahData);
        } else {
                  displayAyah(ayahData);
       //   setErrorMessage('لا توجد بيانات آية صالحة في التخزين');
      //    console.log('window no valid ayah data, fetching new ayah');
      //     fetchRandomAyahAndDisplay().catch((err) => {
       //     setErrorMessage('خطأ في جلب الآية: ' + err.message);
      //      console.error('Popup fetchRandomAyahAndDisplay error at', new Date().toISOString(), ':', err);
        //    displayAyah(defaultAyah);
         // });
        }
      });
    } else {
      //setErrorMessage('Local storage opted out, fetching new ayah');
     // console.log('Popup local storage opted out, fetching new ayah');
     // alert('لا يسمح بحفظ الآيه بالحافظة المحلية،سنجلب آيه جديدة');
     
      fetchRandomAyahAndDisplay().catch((err) => {
        setErrorMessage('خطأ في جلب الآية: ' + err.message);
        console.error('Popup fetchRandomAyahAndDisplay error at', new Date().toISOString(), ':', err);
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

async function getTafseer(ayahData) {
  try {
    // Get user-selected Tafseer source
    const rs = await new Promise((resolve) => chrome.storage.sync.get('tafseerSource', resolve));
    const tafseerSource = rs.tafseerSource || 4;

    // Fetch Tafseer
    const tafseerRes = await fetch(`http://api.quran-tafseer.com/tafseer/${tafseerSource}/${ayahData.surahNumber}/${ayahData.ayahNumber}`);
    if (!tafseerRes.ok) throw new Error(`Tafseer fetch error ${tafseerRes.status}`);

    const tafseerData = await tafseerRes.json();

    if (tafseerData && tafseerData.text) {
      ayahData.tafseer = `${tafseerData.tafseer_name}: ${tafseerData.text}`;
    } else {
      ayahData.tafseer = "No Tafseer available.";
    }
  } catch (err) {
    console.error("Error fetching Tafseer:", err);
    ayahData.tafseer = "Error fetching Tafseer.";
  }
}  
  
async function fetchRandomAyahAndDisplay() {
  try {
       //get Reciter
    const rec = await new Promise((resolve) => chrome.storage.sync.get('ayahReciter', resolve));
    const ayahReciter = rec.ayahReciter || 'ar.husary';
    // Get saved ayah data first (in case of reload)
    let ayahData = await new Promise((resolve) => chrome.storage.local.get("ayahData", (res) => resolve(res.ayahData || {})));

    // If ayahData missing, fetch it fresh
    if (!ayahData || !ayahData.arabic) {

      // Fetch Arabic
      const arRes = await fetch(`${BASE_URL}/ayah/${randomAyahNumber}/${ayahReciter}`);
      if (!arRes.ok) throw new Error(`Arabic fetch error ${arRes.status}`);
      const arData = await arRes.json();

      // Basic ayahData structure
      ayahData = {
        arabic: arData.data.text,
        surahName: arData.data.surah.name,
        surahNumber: arData.data.surah.number,
        ayahNumber: arData.data.numberInSurah,
        audioUrl: arData.data.audio || ""
      };

      // Fetch translation
      const enRes = await fetch(`${BASE_URL}/ayah/${randomAyahNumber}/en.sahih`);
      if (!enRes.ok) throw new Error(`Translation fetch error ${enRes.status}`);
      const enData = await enRes.json();
      ayahData.translation = enData.data.text;
    }

    // Always fetch Tafseer before showing
    await getTafseer(ayahData);

    // Save updated ayahData (with tafseer)
    await new Promise((resolve) => chrome.storage.local.set({ ayahData }, resolve));

    // Display
    displayAyah(ayahData);

  } 
  catch (err) {
    console.error("Error in fetchRandomAyahAndDisplay:", err);
  }
}

// Call on window load
document.addEventListener("DOMContentLoaded", fetchRandomAyahAndDisplay);

   function displayAyah(ayahData) {
    
      ayahArabic.textContent = ayahData.arabic;
      ayahTranslation.textContent = ayahData.translation;
      ayahReference.textContent = `${ayahData.surahName} (${ayahData.ayahNumber}:${ayahData.surahNumber})`;
      audioElement.src = ayahData.audioUrl || '';
      playButton.disabled = !ayahData.audioUrl;
      ayahTafseer.textContent = ayahData.tafseer;      
      //setErrorMessage(ayahData.audioUrl ? '' : 'لا يوجد رابط صوتي متاح');
      console.log('window displayed ayah at', new Date().toISOString(), ':', JSON.stringify(ayahData, null, 2));

      chrome.storage.sync.get(['autoplayAudio'], (result) => {
        if (result.autoplayAudio) {
          audioElement.play().catch((err) => {
            setErrorMessage('خطأ في تشغيل الصوت التلقائي: ' + err.message);
            console.error('Popup autoplay error at', new Date().toISOString(), ':', err);
          });
        }
      });

  }


/*
function displayAyah(ayahData) {
  document.getElementById('ayah-arabic').textContent = ayahData.arabic || '';
  document.getElementById('ayah-translation').textContent = ayahData.translation || '';
  document.getElementById('ayah-tafseer').textContent = ayahData.tafseer || '';
  document.getElementById('ayah-reference').textContent =
    `${ayahData.surahName || ''} (${ayahData.surahNumber || ''}:${ayahData.ayahNumber || ''})`;
  document.getElementById('ayah-audio').src = ayahData.audioUrl || '';

}
*/
// Load initial
chrome.storage.local.get('ayahData', (result) => {
  if (result.ayahData) {
    displayAyah(result.ayahData);
  }
});

// Listen for updates from background
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.ayahData && changes.ayahData.newValue) {
    displayAyah(changes.ayahData.newValue);
  }
});


//--
//const ayahText = document.getElementById("ayahText");
//const ayahAudio = document.getElementById("ayahAudio");


// Load random ayah initially
/*fetch(`${BASE_URL}/ayah/random/ar.alafasy`)
  .then(res => res.json())
  .then(data => showAyah(data.data));

function showAyah(ayah) {
  ayahText.textContent = `${ayah.surah.englishName} (${ayah.surah.englishNameTranslation}) [${ayah.surah.number}:${ayah.numberInSurah}]
  ${ayah.text}`;
  ayahAudio.src = ayah.audio;
}
*/
// Populate Surah list
fetch(`${BASE_URL}/surah`)
  .then(res => res.json())
  .then(data => {
    data.data.forEach(surah => {
      let option = document.createElement("option");
      option.value = surah.number;
      option.textContent = `${surah.number}. ${surah.name}`;
      option.dataset.ayahs = surah.numberOfAyahs;
      surahSelect.appendChild(option);
    });

    updateAyahDropdown();
  });

surahSelect.addEventListener("change", updateAyahDropdown);

function updateAyahDropdown() {
  ayahSelect.innerHTML = "";
  let selected = surahSelect.options[surahSelect.selectedIndex];
  let ayahsCount = selected.dataset.ayahs;

  for (let i = 1; i <= ayahsCount; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    ayahSelect.appendChild(option);
  }
}

goBtn.addEventListener("click", async () => {
 
  let surah = surahSelect.value;
  let ayah = ayahSelect.value;
  let selectedAyahNumber = await getGlobalAyahNumber(surah, ayah);
  
//  alert(selectedAyahNumber);
//  chrome.storage.local.clear();
    
// --get settectedAyah
      // Fetch Arabic
      const arRes = await fetch(`${BASE_URL}/ayah/${selectedAyahNumber}/ar.minshawi`);
      if (!arRes.ok) throw new Error(`Arabic fetch error ${arRes.status}`);
      const arData = await arRes.json();

      // Basic ayahData structure
      ayahData = {
        arabic: arData.data.text,
        surahName: arData.data.surah.name,
        surahNumber: arData.data.surah.number,
        ayahNumber: arData.data.numberInSurah,
        audioUrl: arData.data.audio || ""
      };

      // Fetch translation
      const enRes = await fetch(`${BASE_URL}/ayah/${selectedAyahNumber}/en.sahih`);
      if (!enRes.ok) throw new Error(`Translation fetch error ${enRes.status}`);
      const enData = await enRes.json();
      ayahData.translation = enData.data.text;
    

    // Always fetch Tafseer before showing
    await getTafseer(ayahData);

    // Save updated ayahData (with tafseer)
    await new Promise((resolve) => chrome.storage.local.set({ ayahData }, resolve));

    // Display
    displayAyah(ayahData);
//-- end selectedAyah
  
});

 async function getGlobalAyahNumber(surah, ayah) {
  const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}`);
  const data = await res.json();
  return data.data.number; // global ayah index
}

  function setErrorMessage(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
    } else {
      console.error('Error message element not found at', new Date().toISOString(), ': Attempted to set', message);
    }
  }

});

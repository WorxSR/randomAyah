<img width="100" height="100" alt="image" src="ayah.png" style=" border-radius: 45px;
  border: 2px solid #73AD21;"/>
# Quran Random Ayah Chrome Extension

A minimal and respectful Chrome extension that displays a random Quranic verse (ayah) using the public [Alquran.cloud API](https://alquran.cloud/api). It’s designed to provide daily spiritual insight in a lightweight and non-intrusive way.

---

## 🕌 Features

- Fetches and displays a **random Quran ayah** on click or at intervals
- Uses the [Alquran.cloud API](https://alquran.cloud/api) for reliable verse sourcing
- Stores ayahs **locally** in Chrome extension storage for better performance
- **No personal data collection**
- <strike>Users can **opt out** of local storage via the Options page</strike> **Note**: Opt out local storage cause a bugs in not displaying Ayah in popup windows as read content from local storage that not saved and replace by a new random ayah instead of one shown in the notification alert.
- **New features added in 28 Aug 2025**
- in pop up windows we add Ayah tafseer - **تفسير الآية** from 8 sources as (Tabary, Ben Katheer,...etc.), selecting any of these sources can be selected from options page.
- in popup windows we added a dropdown list to select any Surah / Ayah and diplay it along with its tafseer as well.
- Now from option page you can select desired Reciter - قارئ - from a dropdown list who has a quran audio files in **mp3** format with biterate 128.

---

## 🔐 Privacy Policy

We respect your privacy. This extension does **not collect**, transmit, or sell any personal data.

Read the full policy here:  
👉 [Privacy Policy](https://worxsr.github.io/randomAyah/privacy.html)

---

## ⚙️ How to Install (Manual)

1. Clone or download this repository
2. Go to `chrome://extensions` in your Chrome browser
3. Enable **Developer Mode** (top right)
4. Click **“Load unpacked”** and select the extension folder
you might run it locally in your chrome browser or any compatible browser as "Brave".
---

## 📁 Folder Structure

/quran-extension/
├── manifest.json
├── background.js
├── popup.html
├── popup.js
├── options.html
├── options.js
├── fonts/
│ └── kfgqpchafs.ttf
| └── Amiri.ttf
├── docs/
|  └──privacy.html
|  └──Random Quran Ayah-User Data Privacy.pdf
|  └── README.md


---

## 🧠 Acknowledgments

- Quran API powered by [Alquran.cloud](https://alquran.cloud/)
- Inspired by the need for mindful and meaningful browser experiences
- this extension is open source you can download and installed freely without any license required.

---

## 📬 Contact

For suggestions or support, please use the worx.sw@gmail.com

---



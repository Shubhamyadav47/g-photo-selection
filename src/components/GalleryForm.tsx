import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Camera, Image as ImageIcon, Shield, Plus, Key, Phone, CheckCircle, Smartphone, HelpCircle, Coins, Trash2 } from 'lucide-react';

interface GalleryFormProps {
  userProfile: UserProfile | null;
  onCreditsUpdated: (newCredits: number) => void;
  onGalleryCompiled: () => void;
}

interface ImageFile {
  name: string;
  dataUrl: string;
}

export default function GalleryForm({ userProfile, onCreditsUpdated, onGalleryCompiled }: GalleryFormProps) {
  const [title, setTitle] = useState('My Client Selection Shoot');
  const [password, setPassword] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);
  const [compiledHTML, setCompiledHTML] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag-and-drop state
  const [isDragOver, setIsDragOver] = useState(false);

  // File loading processor
  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    setLoadingFiles(true);
    setFileProgress(0);
    setError(null);

    let loadedCount = 0;
    const totalFiles = fileArray.length;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // Clean file name to remove typical size suffixes
        const name = file.name.replace(/\s*\([^)]*\)(?=\.[^.]+$)/i, '');

        setImages((prev) => {
          // Avoid duplicates by name
          if (prev.some((img) => img.name === name)) return prev;
          return [...prev, { name, dataUrl }];
        });

        loadedCount++;
        setFileProgress(Math.round((loadedCount / totalFiles) * 105));

        if (loadedCount === totalFiles) {
          setTimeout(() => {
            setLoadingFiles(false);
            setFileProgress(100);
          }, 400);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearAllSelectedImages = () => {
    setImages([]);
    setCompiledHTML('');
    setSuccessMsg(null);
    setError(null);
  };

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Compile full SaaS HTML self-contained layout as requested by photographer
  const handleCompileAndDownload = async () => {
    setError(null);
    setSuccessMsg(null);

    if (!userProfile) {
      setError('Please authenticate to generate galleries.');
      return;
    }

    if (images.length === 0) {
      setError('Please upload at least one image to compile.');
      return;
    }

    if (userProfile.credits < 1) {
      setError('Insufficient Credit Balance! Please buy credits from the Top Up menu to generate.');
      return;
    }

    try {
      const cleanWa = whatsappNumber.replace(/[^0-9]/g, '');
      const escapedTitle = escapeHtml(title.trim() || 'My Selection Gallery');
      const escapedPassJs = password.trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"');

      // 1. Build Client-Side Photo Cards HTML
      const imageTags = images.map(({ name, dataUrl }) => {
        const escapedName = escapeHtml(name);
        const jsSafeName = escapedName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return `
        <div class="photo-card" data-name="${jsSafeName}" onclick="toggleSelection(this)">
            <div class="image-wrapper">
                <div class="fallback-placeholder">${escapedName}</div>
                <button class="zoom-btn" onclick="event.stopPropagation(); openZoom(this.closest('.photo-card').querySelector('img').src)">🔍</button>
                <img src="${dataUrl}" alt="${escapedName}" loading="lazy">
            </div>
            <div class="photo-name">${escapedName}</div>
        </div>`;
      }).join('');

      // Password modules configuration inside compiled file
      const loginHTML = password.trim() ? `
      <div id="loginScreen" class="login-screen">
          <div class="login-card">
              <div class="lock-icon">🔒</div>
              <h2>Private Client Portal</h2>
              <p>Enter private passcode authorized by ${userProfile.displayName || ' your photographer'} to unlock client selections.</p>
              <input type="password" id="passwordInput" placeholder="Enter Access Code">
              <button class="btn-primary" onclick="checkPassword()">Unlock Gallery</button>
              <div id="loginError" class="login-error">Incorrect passcode. Contact photographer for credentials.</div>
          </div>
      </div>` : '';

      const passwordScript = password.trim() ? `
      <script>
      const correctPassword = "${escapedPassJs}";
      function checkPassword() {
          const entered = document.getElementById("passwordInput").value;
          const errorDiv = document.getElementById("loginError");
          if (entered === correctPassword) {
              document.getElementById("loginScreen").style.display = "none";
              document.getElementById("galleryContent").style.display = "block";
          } else {
              errorDiv.style.opacity = "1";
              setTimeout(() => { errorDiv.style.opacity = "0"; }, 3000);
          }
      }
      document.getElementById("passwordInput")?.addEventListener("keyup", function(event) {
          if (event.key === "Enter") { checkPassword(); }
      });
      <\/script>` : '';

      // Final embedded HTML output
      const generatedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapedTitle}</title>
    <style>
        :root {
            --primary: #111827;
            --primary-hover: #1F2937;
            --accent: #4F46E5;
            --accent-hover: #4338CA;
            --success: #10B981;
            --success-hover: #059669;
            --bg-main: #F9FAFB;
            --bg-card: #FFFFFF;
            --text-title: #111827;
            --text-body: #4B5563;
            --border-color: #E5E7EB;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-main);
            color: var(--text-title);
            line-height: 1.5;
            padding-bottom: 100px;
        }
        .gallery-header {
            background-color: var(--bg-card);
            border-bottom: 1px solid var(--border-color);
            padding: 40px 20px;
            text-align: center;
        }
        .gallery-header h1 { font-size: 26px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.025em; color: var(--primary); }
        .gallery-header p { color: var(--text-body); font-size: 14px; max-width: 600px; margin: 0 auto; }
        .gallery-container { max-width: 1400px; margin: 0 auto; padding: 30px 20px; }
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
        .photo-card {
            background-color: var(--bg-card);
            border: 2px solid transparent;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.01);
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }
        .photo-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); }
        .image-wrapper {
            position: relative;
            width: 100%;
            background-color: #F3F4F6;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            min-height: 250px;
        }
        .fallback-placeholder {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background-color: #E5E7EB; color: #6B7280;
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: 600; padding: 16px;
            text-align: center; box-sizing: border-box; word-break: break-all; z-index: 1;
        }
        .photo-card img {
            position: relative; max-width: 100%; max-height: 60vh;
            width: auto; height: auto; object-fit: contain; display: block;
            transition: transform 0.4s ease; z-index: 2; border-radius: 8px;
        }
        .photo-name {
            padding: 12px 16px; font-size: 13px; font-weight: 700; color: #374151;
            text-align: center; border-top: 1px solid var(--border-color);
            background-color: var(--bg-card); white-space: nowrap;
            text-overflow: ellipsis; overflow: hidden;
        }
        .photo-card.selected { border-color: var(--success); transform: scale(0.98); }
        .photo-card.selected::after {
            content: "✓ Selected"; position: absolute; top: 12px; right: 12px;
            background-color: var(--success); color: white; padding: 4px 10px;
            font-size: 10px; font-weight: 700; border-radius: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-transform: uppercase;
            letter-spacing: 0.05em; z-index: 10;
        }
        .action-bar {
            position: fixed; bottom: 0; left: 0; right: 0;
            background-color: rgba(255,255,255,0.96); backdrop-filter: blur(14px);
            border-top: 1px solid var(--border-color); padding: 18px 24px;
            box-shadow: 0 -10px 15px -3px rgba(0,0,0,0.03);
            display: flex; justify-content: space-between; align-items: center; z-index: 999;
        }
        .action-bar .info-wrap { display: flex; flex-direction: column; }
        .action-bar span.counter { font-size: 18px; font-weight: 850; color: var(--primary); }
        .action-bar p.help-text { font-size: 12px; color: var(--text-body); }
        .action-buttons { display: flex; gap: 12px; }
        .action-btn {
            padding: 12px 20px; font-size: 14px; font-weight: 700;
            border-radius: 8px; border: none; cursor: pointer;
            transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-copy { background-color: #E5E7EB; color: #374151; }
        .btn-copy:hover { background-color: #D1D5DB; }
        .btn-send-wa { background-color: var(--success); color: white; }
        .btn-send-wa:hover { background-color: var(--success-hover); }
        .login-screen {
            height: 100vh; width: 100vw;
            display: flex; justify-content: center; align-items: center;
            background-color: var(--bg-main); position: fixed; top: 0; left: 0; z-index: 10000;
        }
        .login-card {
            background-color: var(--bg-card); border: 1px solid var(--border-color);
            padding: 40px; max-width: 420px; width: 100%; border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); text-align: center;
        }
        .lock-icon { font-size: 40px; margin-bottom: 16px; }
        .login-card h2 { font-size: 22px; font-weight: 800; margin-bottom: 8px; }
        .login-card p { font-size: 14px; color: var(--text-body); margin-bottom: 24px; }
        .login-card input {
            width: 100%; padding: 12px; border: 1px solid var(--border-color);
            border-radius: 8px; margin-bottom: 16px; font-size: 15px;
            text-align: center; background-color: #F9FAFB;
        }
        .login-card input:focus { outline: none; border-color: var(--accent); background-color: #FFF; }
        .btn-primary {
            width: 100%; padding: 12px; background-color: var(--primary); color: white;
            border: none; border-radius: 8px; font-weight: 700; cursor: pointer;
            font-size: 15px; transition: all 0.2s ease;
        }
        .btn-primary:hover { background-color: var(--primary-hover); }
        .login-error { color: #EF4444; font-size: 13px; margin-top: 12px; font-weight: 600; opacity: 0; transition: opacity 0.2s ease; }
        .toast-notify {
            position: fixed; bottom: 105px; left: 50%;
            transform: translateX(-50%) translateY(100px);
            background-color: #1F2937; color: #FFFFFF;
            padding: 12px 24px; border-radius: 50px; font-size: 14px; font-weight: 500;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);
            transition: transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275);
            z-index: 1000; pointer-events: none; opacity: 0;
        }
        .toast-notify.show { transform: translateX(-50%) translateY(0); opacity: 1; }
        #galleryContent { display: ${password.trim() ? "none" : "block"}; }
        @media(max-width: 640px) {
            .action-bar { flex-direction: column; gap: 12px; padding: 12px; }
            .action-buttons { width: 100%; }
            .action-btn { flex: 1; justify-content: center; }
        }
        .zoom-btn {
            position: absolute; top: 12px; left: 12px;
            width: 38px; height: 38px; border: none; border-radius: 50%;
            background: rgba(0,0,0,0.7); color: white; font-size: 18px;
            cursor: pointer; z-index: 20; display: flex; align-items: center;
            justify-content: center; backdrop-filter: blur(6px); transition: all 0.2s ease;
        }
        .zoom-btn:hover { transform: scale(1.1); background: rgba(0,0,0,0.9); }
        .zoom-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.95);
            display: none; justify-content: center; align-items: center;
            z-index: 99999; padding: 20px;
        }
        .zoom-overlay img { max-width: 96%; max-height: 96%; object-fit: contain; border-radius: 12px; }
    </style>
</head>
<body>

${loginHTML}

<div id="galleryContent">
    <header class="gallery-header">
        <h1>${escapedTitle}</h1>
        <p>Photographs provided by ${userProfile.displayName || ' your photographer'}. Click/tap favorites to select, then click bottom panel to submit favorites.</p>
    </header>

    <div class="gallery-container">
        <div class="gallery-grid">
            ${imageTags}
        </div>
    </div>

    <div class="action-bar">
        <div class="info-wrap">
            <span class="counter" id="count">0 Selected</span>
            <p class="help-text">Select photos to notify photographer</p>
        </div>
        <div class="action-buttons">
            <button class="action-btn btn-copy" onclick="copyListToClipboard()">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                Copy Selection
            </button>
            ${cleanWa ? `
            <button class="action-btn btn-send-wa" onclick="sendToWhatsApp()">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.052-4.144c1.6.95 3.177 1.45 4.809 1.451 5.485 0 9.947-4.46 9.951-9.948.002-2.66-1.019-5.162-2.87-7.017C16.141 2.488 13.64 1.47 11.002 1.47c-5.489 0-9.952 4.461-9.955 9.95-.001 1.724.47 3.413 1.365 4.907L1.442 20.89l4.667-1.034zM18.22 15c-.29-.146-1.713-.846-1.977-.942-.265-.096-.458-.145-.65.146-.193.29-.747.942-.916 1.135-.169.193-.338.217-.628.072-2.902-1.45-4.004-2.522-5.495-5.078-.393-.675.393-.627 1.125-2.088.13-.25.065-.47-.033-.664-.096-.193-.747-1.802-1.024-2.47-.27-.648-.544-.56-.747-.57l-.634-.012c-.217 0-.57.081-.868.41-.298.328-1.135 1.109-1.135 2.701 0 1.593 1.157 3.131 1.317 3.348.16.217 2.278 3.48 5.517 4.881 2.695 1.166 3.242.934 3.822.879.578-.055 1.714-.7 1.955-1.378.24-.678.24-1.259.169-1.378-.071-.12-.264-.193-.554-.339z"/></svg>
                Send via WhatsApp
            </button>` : ''}
        </div>
    </div>
</div>

<div id="toast" class="toast-notify">Selection Copied!</div>

<script>
    let selectedPhotos = new Set();
    const myWhatsAppNumber = "${cleanWa}";

    function toggleSelection(element) {
        const photoName = element.getAttribute('data-name');
        if (selectedPhotos.has(photoName)) {
            selectedPhotos.delete(photoName);
            element.classList.remove('selected');
        } else {
            selectedPhotos.add(photoName);
            element.classList.add('selected');
        }
        document.getElementById('count').innerText = selectedPhotos.size + " Selected";
    }

    function showToast(text) {
        const toast = document.getElementById("toast");
        toast.innerText = text;
        toast.classList.add("show");
        setTimeout(() => { toast.classList.remove("show"); }, 2500);
    }

    function getFormattedText() {
        if (selectedPhotos.size === 0) return "";
        return Array.from(selectedPhotos)
            .map(name => name.replace(/\\s*\\([^)]*\\)(?=\\.[^.]+$)/i, '').replace(/\\.[^/.]+$/, ".JPG"))
            .join(" OR ");
    }

    function copyListToClipboard() {
        if (selectedPhotos.size === 0) { showToast("Select photos first!"); return; }
        const textToCopy = getFormattedText();
        const tempTextarea = document.createElement("textarea");
        tempTextarea.value = textToCopy;
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        try { document.execCommand('copy'); showToast("Copied list to clipboard!"); }
        catch (err) { showToast("Failed to copy."); }
        document.body.removeChild(tempTextarea);
    }

    function sendToWhatsApp() {
        if (selectedPhotos.size === 0) { showToast("Select photos first!"); return; }
        const textToCopy = getFormattedText();
        const message = encodeURIComponent("Selection completed: " + textToCopy);
        window.open("https://wa.me/" + myWhatsAppNumber + "?text=" + message, '_blank');
    }

    function openZoom(src) {
        document.getElementById("zoomedImage").src = src;
        document.getElementById("zoomOverlay").style.display = "flex";
        document.body.style.overflow = "hidden";
    }

    function closeZoom() {
        document.getElementById("zoomOverlay").style.display = "none";
        document.body.style.overflow = "auto";
    }
<\/script>

${passwordScript}

<div class="zoom-overlay" id="zoomOverlay" onclick="closeZoom()">
    <img id="zoomedImage" src="">
</div>

</body>
</html>`;

      // 2. Perform Atomic Multi-Doc Secure Operation to Firestore decrementing user profile credit
      const batch = writeBatch(db);
      const galleryId = 'gal-' + Math.random().toString(36).substring(2, 11);
      const galleryRef = doc(collection(db, 'users', userProfile.uid, 'galleries'), galleryId);

      const galleryPayload = {
        id: galleryId,
        title: title.trim() || 'My Selection Gallery',
        imagesCount: images.length,
        whatsappNumber: cleanWa,
        hasPassword: !!password.trim(),
        createdAt: serverTimestamp()
      };

      batch.set(galleryRef, galleryPayload);

      // Decrement balance of photographer exactly -1 credit
      const userRef = doc(db, 'users', userProfile.uid);
      const newCredits = userProfile.credits - 1;
      batch.update(userRef, {
        credits: newCredits,
        updatedAt: serverTimestamp()
      });

      // Commit transaction
      await batch.commit();

      // Trigger state updates
      onCreditsUpdated(newCredits);
      setCompiledHTML(generatedHTML);
      setSuccessMsg('Interactive Gallery generated successfully! Consumed 1 Gallery Credit.');

      // Automatically download files as requested
      const blob = new Blob([generatedHTML], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${title.trim().toLowerCase().replace(/\s+/g, '-')}-selection.html`;
      link.click();

      onGalleryCompiled();
    } catch (err: any) {
      console.error(err);
      setError('Generation failed: ' + err.message);
      handleFirestoreError(err, OperationType.WRITE, `users/${userProfile?.uid}/galleries`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      
      <div>
        <h3 className="font-extrabold text-slate-900 text-lg tracking-tight flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-600" />
          <span>Gallery Configuration Portal</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">Customize client titles, access codes, and upload photograph sets.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* Input Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <span>Project Shoot Title</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Visible on client header banner." />
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800 bg-slate-50/50"
            placeholder="e.g. Shubhda Studios Wedding Selection"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <span>Passcode Authentication (Optional)</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Forces clients to authenticate before viewing." />
          </label>
          <div className="relative">
            <Key className="absolute left-2.5 top-2 px-0.5 w-4 h-4 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs py-2 pl-9 pr-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800 bg-slate-50/50"
              placeholder="Blank for open access"
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <span>Photographer WhatsApp Sync Number (Optional)</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Includes country code (e.g. 919876543210 for India)" />
          </label>
          <div className="relative">
            <Phone className="absolute left-2.5 top-2.5 px-0.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full text-xs py-2 pl-9 pr-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-800 bg-slate-50/50"
              placeholder="e.g. 919876543210 (without + or 00)"
            />
          </div>
        </div>
      </div>

      {/* UPLOAD ZONE */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">Upload Client Photographs</label>
        
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragOver 
              ? 'border-indigo-600 bg-indigo-50/30' 
              : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50/30'
          }`}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Drag & drop files here, or click to browse</p>
          <p className="text-[11px] text-slate-400 mt-1">Supports JPG, PNG, WEBP — images are compiled directly into a single HTML file</p>
        </div>

        {/* Loading progress */}
        {loadingFiles && (
          <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-2">
              <span>Optimizing files locally…</span>
              <span>{fileProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${fileProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* THUMBNAILS PREVIEW ZONE */}
      {images.length > 0 && (
        <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold text-indigo-700">{images.length} images uploaded & optimized</p>
            <button
              onClick={clearAllSelectedImages}
              className="text-xs font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Grid</span>
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1 bg-white border border-slate-200/60 rounded-lg">
            {images.map((img, index) => (
              <div key={index} className="aspect-square bg-slate-100 rounded overflow-hidden relative border border-slate-100 group">
                <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[8px] truncate px-1 py-0.5 leading-none font-medium">
                  {img.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBMIT COMPILE TRIGGER */}
      <div className="pt-2">
        {userProfile && userProfile.credits < 1 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-900 mb-4 items-start">
            <Coins className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold">Your Wallet Balance is Empty (0 Credits Left)</p>
              <p className="text-[11px] text-amber-800 mt-0.5">Please purchase credits to deploy and compile photo selection portals for your shoots.</p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-indigo-50 border border-indigo-100/50 rounded-xl flex items-center justify-between text-indigo-950 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-700">Cost: <span className="font-bold text-indigo-700">1 Credit</span> (₹25 value)</span>
            </div>
            <span className="font-bold text-indigo-600">Balance: {userProfile?.credits || 0} left</span>
          </div>
        )}

        <button
          onClick={handleCompileAndDownload}
          disabled={images.length === 0 || (userProfile !== null && userProfile.credits < 1)}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold rounded-xl transition duration-150 text-sm cursor-pointer shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2.5"
        >
          <Camera className="w-4 h-4" />
          <span>Compile & Download Selection Gallery</span>
        </button>
      </div>

    </div>
  );
}

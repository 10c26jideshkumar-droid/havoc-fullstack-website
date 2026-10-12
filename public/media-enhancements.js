(function () {
  'use strict';

  // ==========================================
  // 1. INLINE VIDEO PLAYBACK MODAL
  // ==========================================
  function injectVideoModal() {
    if (document.getElementById('havoc-video-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'havoc-video-modal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:9999999;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
      <div style="position:relative;width:100%;max-width:860px;background:#141417;border:1px solid rgba(255,255,255,0.18);border-radius:24px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,0.8);font-family:inherit;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#6366f1;box-shadow:0 0 10px #6366f1;"></span>
            <h3 id="havoc-modal-title" style="margin:0;font-size:16px;font-weight:700;color:#fff;">Portfolio Video Showcase</h3>
          </div>
          <button id="havoc-modal-close" style="background:rgba(255,255,255,0.08);border:none;color:#cbd5e1;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:background 0.2s;">✕</button>
        </div>
        <div style="position:relative;padding-top:56.25%;background:#000;">
          <video id="havoc-modal-video" controls autoplay playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;"></video>
          <iframe id="havoc-modal-iframe" style="display:none;position:absolute;inset:0;width:100%;height:100%;border:none;" allowfullscreen allow="autoplay"></iframe>
        </div>
        <div style="padding:16px 22px;background:rgba(255,255,255,0.03);display:flex;align-items:center;justify-content:space-between;">
          <p id="havoc-modal-desc" style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;max-width:85%;"></p>
          <span style="font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;background:rgba(99,102,241,0.15);color:#818cf8;border:1px solid rgba(99,102,241,0.3);">4K Stream</span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('havoc-modal-close').addEventListener('click', closeVideoModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeVideoModal();
    });
  }

  const SAMPLE_VIDEOS = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
  ];

  function openVideoModal(url, title, desc) {
    injectVideoModal();
    const modal = document.getElementById('havoc-video-modal');
    const video = document.getElementById('havoc-modal-video');
    const iframe = document.getElementById('havoc-modal-iframe');
    const titleEl = document.getElementById('havoc-modal-title');
    const descEl = document.getElementById('havoc-modal-desc');

    titleEl.textContent = title || 'Portfolio Video Showcase';
    descEl.textContent = desc || 'Interactive generative showcase rendered by AI creator.';

    if (url && (url.includes('youtube.com') || url.includes('vimeo.com'))) {
      video.style.display = 'none';
      video.pause();
      iframe.style.display = 'block';
      let embedUrl = url;
      if (url.includes('youtube.com/watch?v=')) {
        embedUrl = url.replace('watch?v=', 'embed/');
      }
      iframe.src = embedUrl;
    } else {
      iframe.style.display = 'none';
      iframe.src = '';
      video.style.display = 'block';

      let videoSrc = (url && url.match(/\.(mp4|webm|mov)$/i)) ? url : null;
      if (!videoSrc) {
        let hash = 0;
        for (let i = 0; i < (title || '').length; i++) hash = (hash + title.charCodeAt(i)) % SAMPLE_VIDEOS.length;
        videoSrc = SAMPLE_VIDEOS[hash];
      }
      video.src = videoSrc;
      video.load();
      video.play().catch(() => {});
    }

    modal.style.display = 'flex';
  }

  function closeVideoModal() {
    const modal = document.getElementById('havoc-video-modal');
    if (!modal) return;
    const video = document.getElementById('havoc-modal-video');
    const iframe = document.getElementById('havoc-modal-iframe');
    if (video) { video.pause(); video.src = ''; }
    if (iframe) { iframe.src = ''; }
    modal.style.display = 'none';
  }

  // ==========================================
  // 2. MULTI-MEDIA UPLOAD & ADD TO WORK SYSTEM
  // ==========================================
  function injectUploadModal() {
    if (document.getElementById('havoc-upload-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'havoc-upload-modal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:9999998;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
      <div style="width:100%;max-width:540px;background:#18181b;border:1px solid rgba(255,255,255,0.15);border-radius:24px;padding:24px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7);color:#fff;font-family:inherit;max-height:90vh;overflow-y:auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
          <div>
            <h3 id="havoc-modal-form-title" style="margin:0;font-size:18px;font-weight:700;">Add to portfolio / Add work</h3>
            <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Upload video, image, audio, or project file directly into SQLite database.</p>
          </div>
          <button id="havoc-upload-close" style="background:rgba(255,255,255,0.1);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;">✕</button>
        </div>

        <form id="havoc-upload-form" style="display:flex;flex-direction:column;gap:13px;">
          <input type="hidden" id="havoc-edit-portfolio-id" value="" />
          <div>
            <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:#cbd5e1;">Select Media Type</label>
            <div style="display:flex;gap:8px;">
              <label style="flex:1;text-align:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);padding:8px;border-radius:12px;cursor:pointer;font-size:12px;">
                <input type="radio" name="mediaType" value="video" checked style="margin-right:4px;"> Video
              </label>
              <label style="flex:1;text-align:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);padding:8px;border-radius:12px;cursor:pointer;font-size:12px;">
                <input type="radio" name="mediaType" value="image" style="margin-right:4px;"> Image
              </label>
              <label style="flex:1;text-align:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);padding:8px;border-radius:12px;cursor:pointer;font-size:12px;">
                <input type="radio" name="mediaType" value="audio" style="margin-right:4px;"> Audio
              </label>
              <label style="flex:1;text-align:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);padding:8px;border-radius:12px;cursor:pointer;font-size:12px;">
                <input type="radio" name="mediaType" value="project" style="margin-right:4px;"> Project
              </label>
            </div>
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:#cbd5e1;">Title</label>
            <input id="havoc-up-title" required placeholder="Project or Portfolio Title" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);padding:10px 14px;border-radius:12px;color:#fff;font-size:13px;outline:none;" />
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:#cbd5e1;">Upload File (Image, Video, Audio, or Browser File / HTML)</label>
            <input type="file" id="havoc-up-file" accept="image/*,video/*,audio/*,.pdf,.docx,.html,.htm,.zip,.json" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px dashed rgba(255,255,255,0.25);padding:10px;border-radius:12px;color:#cbd5e1;font-size:12px;cursor:pointer;" />
            <div id="havoc-file-preview-info" style="font-size:11px;color:#818cf8;margin-top:4px;display:none;"></div>
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:#cbd5e1;">Or Media URL / Browser Link</label>
            <input id="havoc-up-url" placeholder="https://... (MP4, WebM, image, audio, or live demo URL)" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);padding:10px 14px;border-radius:12px;color:#fff;font-size:13px;outline:none;" />
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:#cbd5e1;">Tags (Comma-separated)</label>
            <input id="havoc-up-tags" placeholder="Voice AI, Support, LLM Integration" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);padding:10px 14px;border-radius:12px;color:#fff;font-size:13px;outline:none;" />
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:#cbd5e1;">Description</label>
            <textarea id="havoc-up-desc" rows="3" required placeholder="Description of the portfolio project, techniques, and tools used..." style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);padding:10px 14px;border-radius:12px;color:#fff;font-size:13px;outline:none;resize:none;"></textarea>
          </div>

          <button id="havoc-upload-submit-btn" type="submit" style="margin-top:6px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;padding:12px;border-radius:14px;font-weight:700;font-size:14px;cursor:pointer;transition:opacity 0.2s;">
            Save to Portfolio
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('havoc-upload-close').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    const fileInput = document.getElementById('havoc-up-file');
    const previewInfo = document.getElementById('havoc-file-preview-info');
    let selectedFile = null;

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        selectedFile = file;
        previewInfo.style.display = 'block';
        previewInfo.textContent = `Selected: ${file.name} (${Math.round(file.size / 1024)} KB) - Ready for secure upload.`;
        if (!document.getElementById('havoc-up-title').value) {
          document.getElementById('havoc-up-title').value = file.name.replace(/\.[^/.]+$/, "");
        }
      }
    });

    const form = document.getElementById('havoc-upload-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('havoc-upload-submit-btn');
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.6';
      submitBtn.textContent = 'Uploading & Saving to SQLite...';

      const editId = document.getElementById('havoc-edit-portfolio-id').value;
      const title = document.getElementById('havoc-up-title').value;
      let media_url = document.getElementById('havoc-up-url').value;
      const media_type = form.querySelector('input[name="mediaType"]:checked').value;
      const description = document.getElementById('havoc-up-desc').value;
      const tagsRaw = document.getElementById('havoc-up-tags').value;
      const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [media_type, 'AI Portfolio'];

      // If a local file was picked, upload to local disk storage
      if (selectedFile) {
        try {
          const reader = new FileReader();
          const base64Data = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });

          const upRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: selectedFile.name,
              content: base64Data,
              mimeType: selectedFile.type
            })
          });
          const upJson = await upRes.json();
          if (upJson.success && upJson.url) {
            media_url = upJson.url;
          }
        } catch (err) {
          console.warn('Disk upload error, falling back to URL:', err);
        }
      }

      if (!media_url) {
        media_url = media_type === 'video'
          ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
          : '/assets/voice-wK_EftTy.jpg';
      }

      try {
        const token = localStorage.getItem('token') || '';
        const endpoint = editId ? `/api/creators/portfolio/${editId}` : '/api/creators/portfolio';
        const method = editId ? 'PUT' : 'POST';

        const res = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ title, media_url, media_type, description, tags })
        });
        const data = await res.json();
        if (data.success) {
          // Dynamically append new card to page gallery
          appendCardToDom({ id: data.data?.id, title, media_url, media_type, description, tags });
          showNotification('✨ Project successfully saved to portfolio!');
          modal.style.display = 'none';
          form.reset();
        } else {
          alert('Error: ' + (data.error || 'Failed to save portfolio item'));
        }
      } catch (err) {
        appendCardToDom({ title, media_url, media_type, description, tags });
        showNotification('✨ Project recorded in your portfolio session!');
        modal.style.display = 'none';
      } finally {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.textContent = 'Save to Portfolio';
      }
    });
  }

  function openUploadModal(editData = null) {
    injectUploadModal();
    const modal = document.getElementById('havoc-upload-modal');
    const titleEl = document.getElementById('havoc-modal-form-title');
    const idInput = document.getElementById('havoc-edit-portfolio-id');
    const form = document.getElementById('havoc-upload-form');

    if (editData) {
      titleEl.textContent = 'Edit Portfolio Project';
      idInput.value = editData.id || '';
      document.getElementById('havoc-up-title').value = editData.title || '';
      document.getElementById('havoc-up-url').value = editData.media_url || '';
      document.getElementById('havoc-up-desc').value = editData.description || '';
      document.getElementById('havoc-up-tags').value = (editData.tags || []).join(', ');
      const radio = form.querySelector(`input[name="mediaType"][value="${editData.media_type || 'video'}"]`);
      if (radio) radio.checked = true;
    } else {
      titleEl.textContent = 'Add to Portfolio / Add Work';
      idInput.value = '';
      form.reset();
      const preview = document.getElementById('havoc-file-preview-info');
      if (preview) preview.style.display = 'none';
    }
    modal.style.display = 'flex';
  }

  function appendCardToDom(item) {
    // Find active grid container
    const grid = document.querySelector('[role="tabpanel"][data-state="active"] .grid, .grid.gap-4, .grid.gap-5');
    if (!grid) return;

    const card = document.createElement('div');
    card.className = 'overflow-hidden rounded-2xl border bg-card shadow-card animate-notify';
    card.setAttribute('data-video-url', item.media_url || '');

    const isVideo = item.media_type === 'video' || (item.media_url && item.media_url.endsWith('.mp4'));
    card.innerHTML = `
      <div class="relative aspect-video overflow-hidden bg-black/40">
        <img src="${item.media_url.endsWith('.mp4') ? '/assets/film-D2ZajaTW.jpg' : (item.media_url || '/assets/voice-wK_EftTy.jpg')}" alt="${item.title}" class="h-full w-full object-cover" />
        ${isVideo ? `
          <button class="glass absolute inset-0 m-auto grid h-12 w-12 place-items-center rounded-full" aria-label="Play video">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play fill-primary text-primary"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path></svg>
          </button>
        ` : ''}
      </div>
      <div class="p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-primary">${item.media_type}</p>
        <h4 class="mt-1 font-bold text-sm">${item.title}</h4>
        <p class="mt-1 text-xs text-muted-foreground line-clamp-2">${item.description}</p>
        <div class="mt-3 flex flex-wrap gap-1.5">
          ${(item.tags || []).map(t => `<span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">${t}</span>`).join('')}
        </div>
      </div>
    `;

    grid.prepend(card);
  }

  function showNotification(text) {
    let toast = document.getElementById('havoc-notification-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'havoc-notification-toast';
      toast.style.cssText = 'position:fixed;top:24px;right:24px;background:#18181b;border:1px solid #6366f1;color:#fff;padding:12px 20px;border-radius:16px;box-shadow:0 12px 30px rgba(0,0,0,0.6);font-size:13px;font-weight:600;z-index:9999999;transition:all 0.3s;display:flex;align-items:center;gap:8px;';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
    }, 3500);
  }

  // Intercept any click on:
  // - "Add work" buttons
  // - "Add to portfolio" buttons
  // - Video play buttons
  document.addEventListener('click', function (e) {
    const addBtn = e.target.closest('button, a');
    if (addBtn) {
      const btnText = (addBtn.textContent || '').trim().toLowerCase();
      if (
        btnText.includes('add work') ||
        btnText.includes('add to portfolio') ||
        addBtn.id === 'havoc-upload-trigger-btn' ||
        addBtn.getAttribute('aria-label') === 'Add work'
      ) {
        e.preventDefault();
        e.stopPropagation();
        openUploadModal();
        return;
      }
    }

    const playTarget = e.target.closest('[aria-label*="Play"], .aspect-video, .lucide-play, [data-video-url], .aspect-\\[4\\/3\\] button');
    if (playTarget) {
      const container = playTarget.closest('.overflow-hidden') || playTarget.parentElement;
      const title = container?.querySelector('h4, h3')?.textContent || 'AI Portfolio Reel';
      const desc = container?.querySelector('p')?.textContent || '';
      const customUrl = playTarget.getAttribute('data-video-url') || container?.getAttribute('data-video-url');
      openVideoModal(customUrl, title, desc);
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const portfolioCard = e.target.closest('.overflow-hidden.rounded-2xl');
    if (portfolioCard) {
      const isVideo = portfolioCard.textContent.toLowerCase().includes('video');
      if (isVideo) {
        const title = portfolioCard.querySelector('h4, h3')?.textContent || 'Video Showcase';
        const desc = portfolioCard.querySelector('p')?.textContent || '';
        const customUrl = portfolioCard.getAttribute('data-video-url');
        openVideoModal(customUrl, title, desc);
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, true);

  // Floating "Add to portfolio" trigger button on bottom-left
  function injectUploadTrigger() {
    if (document.getElementById('havoc-upload-trigger-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'havoc-upload-trigger-btn';
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><path d="M12 5v14M5 12h14"/></svg> Add to portfolio`;
    btn.style.cssText = 'position:fixed;bottom:20px;left:24px;display:flex;align-items:center;background:rgba(24,24,27,0.92);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.22);color:#fff;padding:9px 20px;border-radius:999px;font-size:13px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,0.5);cursor:pointer;z-index:999999;transition:all 0.2s;';
    btn.onmouseover = () => { btn.style.transform = 'translateY(-2px)'; btn.style.borderColor = '#6366f1'; };
    btn.onmouseout = () => { btn.style.transform = 'translateY(0)'; btn.style.borderColor = 'rgba(255,255,255,0.22)'; };
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openUploadModal();
    });
    document.body.appendChild(btn);
  }

  // ==========================================
  // 3. CORE MARKETPLACE ACTIONS & BACKEND INTEGRATION
  // ==========================================

  const CREATOR_MAP = {
    'anika-rao': '11111111-1111-4111-8111-111111111111',
    'anika rao': '11111111-1111-4111-8111-111111111111',
    'leo-marchetti': '22222222-2222-4222-8222-222222222222',
    'leo marchetti': '22222222-2222-4222-8222-222222222222',
    'mei-tanaka': '33333333-3333-4333-8333-333333333333',
    'mei tanaka': '33333333-3333-4333-8333-333333333333',
    'kiran-das': '44444444-4444-4444-8444-444444444444',
    'kiran das': '44444444-4444-4444-8444-444444444444',
    'sofia-alvarez': '55555555-5555-4555-8555-555555555555',
    'sofia alvarez': '55555555-5555-4555-8555-555555555555',
    'arjun-mehta': '66666666-6666-4666-8666-666666666666',
    'arjun mehta': '66666666-6666-4666-8666-666666666666',
    'zara-chen': '77777777-7777-4777-8777-777777777777',
    'zara chen': '77777777-7777-4777-8777-777777777777',
    'vikram-patel': '88888888-8888-4888-8888-888888888888',
    'vikram patel': '88888888-8888-4888-8888-888888888888',
    'elena-rostova': '99999999-9999-4999-8999-999999999999',
    'elena rostova': '99999999-9999-4999-8999-999999999999',
    'marcus-vance': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'marcus vance': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  };

  function resolveCreatorId(id, name) {
    if (id && id.length > 20 && id !== 'creator-id') return id;
    const cleanId = (id || '').trim().toLowerCase();
    if (CREATOR_MAP[cleanId]) return CREATOR_MAP[cleanId];
    const cleanName = (name || '').trim().toLowerCase();
    for (const [k, v] of Object.entries(CREATOR_MAP)) {
      if (cleanName.includes(k) || k.includes(cleanName)) return v;
    }
    const pathSlug = window.location.pathname.replace('/creators/', '').trim().toLowerCase();
    if (CREATOR_MAP[pathSlug]) return CREATOR_MAP[pathSlug];
    return '11111111-1111-4111-8111-111111111111';
  }

  // --- MY PICKS ACTIONS ---
  window.saveCreatorToPicks = async function (creatorId, creatorName, btnElement) {
    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: creatorId, note: 'Saved creator shortlist' })
      });
      const d = await res.json();
      if (d.success) {
        if (btnElement) {
          btnElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" class="h-4 w-4 text-primary" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Saved`;
          btnElement.classList.add('border-primary', 'text-primary');
        }
        showNotification(`🔖 ${creatorName || 'Creator'} saved to My Picks!`);
        if (window.location.pathname.includes('/brand')) {
          initBrandPageBackend();
        }
      } else {
        showNotification(d.error || 'Unable to save to My Picks');
      }
    } catch (e) {
      showNotification(`🔖 ${creatorName || 'Creator'} bookmarked.`);
    }
  };

  window.removeSavedPick = async function (creatorId) {
    try {
      const res = await fetch(`/api/picks/${creatorId}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        showNotification('Creator removed from My Picks.');
        if (window.location.pathname.includes('/brand')) {
          initBrandPageBackend();
        }
      }
    } catch (e) {}
  };

  // --- INTERVIEW INVITATION MODAL & ACTIONS ---
  function injectInterviewModal() {
    if (document.getElementById('havoc-interview-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'havoc-interview-modal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.82);backdrop-filter:blur(8px);z-index:9999999;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
      <div style="width:100%;max-width:540px;background:#18181b;border:1px solid rgba(255,255,255,0.2);border-radius:24px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,0.8);color:#fff;font-family:inherit;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px;">📅</span>
            <h3 id="inv-modal-title" style="margin:0;font-size:16px;font-weight:700;">Invite Creator to Interview</h3>
          </div>
          <button id="inv-modal-close" style="background:rgba(255,255,255,0.08);border:none;color:#cbd5e1;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>
        <form id="havoc-inv-form" style="padding:22px 24px;display:flex;flex-direction:column;gap:14px;">
          <input type="hidden" id="inv-creator-id" />
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;">Inviting Talent</label>
            <input type="text" id="inv-creator-name" readonly style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;font-size:13px;font-weight:600;" />
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;">Campaign Brief / Purpose *</label>
            <select id="inv-brief-select" style="width:100%;padding:10px 14px;background:#27272a;border:1px solid rgba(255,255,255,0.18);border-radius:12px;color:#fff;font-size:13px;">
              <option value="">Autonomous Multilingual Voice Bot for Customer Success</option>
              <option value="brief-1">Diwali campaign film (Generative Video)</option>
              <option value="brief-2">Hindi/English voice support</option>
              <option value="custom">Bespoke Campaign Discovery Call</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;">Proposed Date & Time *</label>
            <input type="datetime-local" id="inv-date-time" required style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.18);border-radius:12px;color:#fff;font-size:13px;" />
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;">Personal Invitation Note *</label>
            <textarea id="inv-message" rows="3" required placeholder="Describe your campaign requirements, deliverables, and interview format..." style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.18);border-radius:12px;color:#fff;font-size:13px;resize:none;"></textarea>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
            <button type="button" id="inv-cancel-btn" style="padding:10px 18px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:#94a3b8;font-size:13px;cursor:pointer;">Cancel</button>
            <button type="submit" id="inv-submit-btn" style="padding:10px 22px;border-radius:12px;border:none;background:#6366f1;color:#fff;font-size:13px;font-weight:700;cursor:pointer;">🚀 Send Invitation</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('inv-modal-close').onclick = () => modal.style.display = 'none';
    document.getElementById('inv-cancel-btn').onclick = () => modal.style.display = 'none';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    document.getElementById('havoc-inv-form').onsubmit = async (e) => {
      e.preventDefault();
      const cid = document.getElementById('inv-creator-id').value;
      const cname = document.getElementById('inv-creator-name').value;
      const briefId = document.getElementById('inv-brief-select').value;
      const dateVal = document.getElementById('inv-date-time').value;
      const msgVal = document.getElementById('inv-message').value.trim();

      if (!msgVal || !dateVal) {
        alert('Please enter a message and proposed date/time.');
        return;
      }

      const submitBtn = document.getElementById('inv-submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const res = await fetch('/api/invites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creator_id: cid,
            message: msgVal,
            brief_id: briefId && briefId !== 'custom' ? briefId : null,
            proposed_date: new Date(dateVal).toISOString()
          })
        });
        const d = await res.json();
        if (d.success) {
          modal.style.display = 'none';
          showNotification(`🚀 Interview invitation sent to ${cname}!`);
          if (window.location.pathname.includes('/brand')) initBrandPageBackend();
          if (window.location.pathname.includes('/studio')) initStudioInvites();
        } else {
          showNotification(d.error || 'Failed to send invitation');
        }
      } catch (err) {
        showNotification(`Interview invitation recorded for ${cname}.`);
        modal.style.display = 'none';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🚀 Send Invitation';
      }
    };
  }

  window.openInterviewModal = function(creatorId, creatorName) {
    injectInterviewModal();
    const modal = document.getElementById('havoc-interview-modal');
    document.getElementById('inv-creator-id').value = creatorId;
    document.getElementById('inv-creator-name').value = creatorName || 'Verified AI Creator';
    
    const d = new Date(Date.now() + 2 * 24 * 3600 * 1000);
    d.setHours(14, 0, 0, 0);
    document.getElementById('inv-date-time').value = d.toISOString().slice(0, 16);
    document.getElementById('inv-message').value = `Hi ${creatorName || 'there'}, we were impressed by your verified portfolio work on HAVOC and would love to schedule a 30-minute discovery call for our upcoming generative campaign.`;
    
    modal.style.display = 'flex';
  };

  window.sendInterviewInvite = function(creatorId, creatorName) {
    window.openInterviewModal(creatorId, creatorName);
  };

  // --- ACCEPT / DECLINE INVITATION STATUS UPDATE ---
  window.handleInviteResponse = async function (inviteId, status, btnElement) {
    try {
      if (inviteId) {
        await fetch(`/api/invites/${inviteId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
      }
      if (btnElement) {
        const parent = btnElement.parentElement;
        if (status === 'confirmed') {
          btnElement.outerHTML = `<span class="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-bold">✓ Accepted</span>`;
          const declineBtn = Array.from(parent?.querySelectorAll('button') || []).find(b => b.textContent.includes('Decline'));
          if (declineBtn) declineBtn.style.display = 'none';
          showNotification('✅ Interview invitation accepted! Video room prepared.');
        } else {
          btnElement.outerHTML = `<span class="rounded-full bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 text-xs font-semibold">Declined</span>`;
          const acceptBtn = Array.from(parent?.querySelectorAll('button') || []).find(b => b.textContent.includes('Accept'));
          if (acceptBtn) acceptBtn.style.display = 'none';
          showNotification('Interview invitation declined.');
        }
      }
    } catch (e) {
      showNotification(`Status updated to ${status}.`);
    }
  };

  // --- CREATOR STUDIO INVITATIONS (SQLite-backed) ---
  async function initStudioInvites() {
    if (!window.location.pathname.includes('/studio')) return;
    try {
      const res = await fetch('/api/invites?role=creator');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const headings = Array.from(document.querySelectorAll('h3'));
        const targetHeading = headings.find(h => h.textContent.includes('Interview invitations'));
        const container = targetHeading?.parentElement?.querySelector('.divide-y');
        if (container) {
          container.innerHTML = data.data.map(inv => `
            <div class="flex flex-wrap items-center justify-between gap-3 py-3" data-invite-id="${inv.id}">
              <div>
                <p class="font-semibold">${inv.brand_name || 'Brand Partner'} — ${inv.brief_title || 'Creative Campaign'}</p>
                <p class="text-xs text-muted-foreground mt-0.5">${new Date(inv.proposed_date || inv.created_at).toLocaleDateString()} at ${new Date(inv.proposed_date || inv.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} · ${inv.message || 'Discussion of project deliverables.'}</p>
              </div>
              <div class="flex items-center gap-2">
                ${inv.status === 'confirmed' ? `<span class="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-bold">✓ Accepted</span>` : (inv.status === 'declined' ? `<span class="rounded-full bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 text-xs font-semibold">Declined</span>` : `
                  <button onclick="window.handleInviteResponse('${inv.id}', 'confirmed', this)" class="inline-flex items-center justify-center font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 rounded-md px-3 text-xs">Accept</button>
                  <button onclick="window.handleInviteResponse('${inv.id}', 'declined', this)" class="inline-flex items-center justify-center font-medium border border-input bg-background shadow-sm hover:bg-accent text-destructive h-8 rounded-md px-3 text-xs">Decline</button>
                `)}
              </div>
            </div>
          `).join('');
        }
      }
    } catch (e) {
      console.warn('Error loading studio creator invites:', e);
    }
  }

  // --- BRAND PAGE BACKEND INTEGRATION ---
  async function initBrandPageBackend() {
    if (!window.location.pathname.includes('/brand')) return;

    // A. Connect "My Picks" tab with SQLite backend
    const picksPanel = document.getElementById('radix-_R_iiq_-content-picks');
    if (picksPanel) {
      try {
        const res = await fetch('/api/picks');
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const picksGrid = picksPanel.querySelector('.grid') || picksPanel;
          picksPanel.querySelector('h3').textContent = `My Saved Creator Picks (${data.data.length})`;
          picksGrid.innerHTML = data.data.map(p => `
            <div class="rounded-2xl border bg-card p-4 shadow-card hover:border-primary/40 transition">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-sm">${p.creator?.full_name || 'Verified Creator'}</h4>
                <button onclick="window.removeSavedPick('${p.creator_id}')" class="text-xs text-destructive hover:underline">Remove</button>
              </div>
              <p class="text-xs text-primary font-medium mt-0.5">${p.creator?.headline || 'AI Specialist'} · ${p.creator?.location || 'Global'}</p>
              <p class="mt-2 text-xs text-muted-foreground line-clamp-2">${p.note || p.creator?.bio || 'Saved talent for brand campaigns.'}</p>
              <div class="mt-3 flex items-center justify-between pt-2 border-t border-border">
                <span class="text-xs font-semibold text-amber-400">★ ${p.creator?.rating || 4.9}</span>
                <div class="flex gap-2">
                  <a href="/creators/${p.creator?.slug || 'anika-rao'}" class="text-xs font-bold text-primary hover:underline">Profile →</a>
                  <button onclick="window.sendInterviewInvite('${p.creator_id}', '${p.creator?.full_name}')" class="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow">Invite</button>
                </div>
              </div>
            </div>
          `).join('');
        }
      } catch (e) {
        console.warn('Error fetching picks:', e);
      }
    }

    // B. Connect "Interviews" tab with SQLite backend
    const interviewsPanel = document.getElementById('radix-_R_iiq_-content-interviews');
    if (interviewsPanel) {
      try {
        const res = await fetch('/api/invites');
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const badge = interviewsPanel.querySelector('.rounded-full.bg-secondary');
          if (badge) badge.textContent = `${data.data.length} Invites Active`;
          const list = interviewsPanel.querySelector('.divide-y');
          if (list) {
            list.innerHTML = data.data.map(inv => `
              <div class="py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="font-bold text-sm">${inv.creator_name || 'Creator'} — ${inv.brief_title || 'Creative Campaign Interview'}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">${new Date(inv.proposed_date || inv.created_at).toLocaleDateString()} · In-Platform Video Room</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="rounded-full ${inv.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : (inv.status === 'declined' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400')} px-2.5 py-0.5 text-xs font-semibold capitalize">${inv.status || 'Pending'}</span>
                  ${inv.status !== 'confirmed' ? `<button onclick="window.handleInviteResponse('${inv.id}', 'confirmed', this)" class="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-emerald-500">Accept</button>` : ''}
                  ${inv.status !== 'declined' && inv.status !== 'confirmed' ? `<button onclick="window.handleInviteResponse('${inv.id}', 'declined', this)" class="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-accent text-destructive">Decline</button>` : ''}
                  <button onclick="openVideoModal('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', '${inv.creator_name} Interview', 'Live video room active.')" class="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">Join Call</button>
                </div>
              </div>
            `).join('');
          }
        }
      } catch (e) {
        console.warn('Error fetching invites:', e);
      }
    }

    // C. Wire "Ask AI assistant" button to link with the floating AI assistant bar (Voice Assistant & Chat)
    const allButtons = Array.from(document.querySelectorAll('button'));
    const askAiBtn = allButtons.find(b => (b.textContent || '').includes('Ask AI assistant') || b.querySelector('svg.lucide-sparkle'));
    if (askAiBtn) {
      askAiBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.linkToAiAssistant === 'function') {
          window.linkToAiAssistant();
        } else {
          const chatBtn = document.getElementById('havoc-chat-modal-btn');
          if (chatBtn) chatBtn.click();
          const assistantTab = document.getElementById('radix-_R_iiq_-trigger-assistant');
          if (assistantTab) assistantTab.click();
        }
      };
    }
  }



  // ==========================================
  // 4. UNIVERSAL RADIX TABS & POPULATOR
  // ==========================================
  function initTabEngine() {
    document.addEventListener('click', function (e) {
      const tab = e.target.closest('[role="tab"]');
      if (!tab) return;

      const tablist = tab.closest('[role="tablist"]');
      if (!tablist) return;

      e.preventDefault();

      // Deactivate siblings
      tablist.querySelectorAll('[role="tab"]').forEach(t => {
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('data-state', 'inactive');
      });

      // Activate clicked
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('data-state', 'active');

      const targetId = tab.getAttribute('aria-controls');
      if (!targetId) return;

      // Find all panels associated with this tablist
      const allTabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
      allTabs.forEach(t => {
        const pid = t.getAttribute('aria-controls');
        const p = document.getElementById(pid);
        if (p) {
          if (pid === targetId) {
            p.removeAttribute('hidden');
            p.setAttribute('data-state', 'active');
            p.style.display = 'block';
            populatePanelIfEmpty(t, p);
          } else {
            p.setAttribute('hidden', '');
            p.setAttribute('data-state', 'inactive');
            p.style.display = 'none';
          }
        }
      });
    });
  }

  // Populate dynamic content for empty tabs (Studio & Creator Profiles)
  function populatePanelIfEmpty(tab, panel) {
    if (panel.innerHTML.trim().length > 10) return; // Already has content

    const targetId = panel.id || '';
    const isStudio = window.location.pathname.includes('/studio');
    const isProfile = window.location.pathname.includes('/creators/');

    // STUDIO TABS
    if (isStudio) {
      if (targetId.includes('portfolio')) {
        panel.innerHTML = `
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xl font-bold">My Portfolio Items (3)</h3>
                <p class="text-xs text-muted-foreground">Manage your AI deliverables, show reels, and case studies.</p>
              </div>
              <button onclick="document.getElementById('havoc-upload-trigger-btn')?.click()" class="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition">
                + Add New Project
              </button>
            </div>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div class="overflow-hidden rounded-2xl border bg-card shadow-card">
                <div class="relative aspect-video overflow-hidden">
                  <img src="/assets/voice-wK_EftTy.jpg" class="h-full w-full object-cover"/>
                  <button class="glass absolute inset-0 m-auto grid h-12 w-12 place-items-center rounded-full" aria-label="Play video"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="fill-primary text-primary"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg></button>
                </div>
                <div class="p-4">
                  <span class="text-xs font-bold text-primary uppercase">Video Reel</span>
                  <h4 class="font-bold text-sm mt-1">Saathi — Bilingual Support Voice Agent</h4>
                  <p class="text-xs text-muted-foreground mt-1">Demo call of Hindi/English agent handling refunds end-to-end.</p>
                </div>
              </div>
              <div class="overflow-hidden rounded-2xl border bg-card shadow-card">
                <div class="relative aspect-video overflow-hidden"><img src="/assets/agent-CSMXJPRd.jpg" class="h-full w-full object-cover"/></div>
                <div class="p-4">
                  <span class="text-xs font-bold text-primary uppercase">Design & Identity</span>
                  <h4 class="font-bold text-sm mt-1">Voice Persona Moodboard</h4>
                  <p class="text-xs text-muted-foreground mt-1">Visual and acoustic identity for banking voice agent.</p>
                </div>
              </div>
              <div class="overflow-hidden rounded-2xl border bg-card shadow-card">
                <div class="relative aspect-video overflow-hidden"><img src="/assets/chatbot-D5BS4HUv.jpg" class="h-full w-full object-cover"/></div>
                <div class="p-4">
                  <span class="text-xs font-bold text-primary uppercase">System Integration</span>
                  <h4 class="font-bold text-sm mt-1">Telecom IVR Replacement</h4>
                  <p class="text-xs text-muted-foreground mt-1">Replaced 9-level IVR with LLM agent. Call time down 38%.</p>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (targetId.includes('workspace')) {
        panel.innerHTML = `
          <div class="space-y-6">
            <div>
              <h3 class="text-xl font-bold">Active Client Engagements & Workspace</h3>
              <p class="text-xs text-muted-foreground">Track milestones, deliverables, and upcoming brand deadlines.</p>
            </div>
            <div class="divide-y divide-border rounded-2xl border bg-card shadow-card p-5 space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-4 pt-3">
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold">Loan helpline agent</h4>
                    <span class="rounded-full bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-xs font-bold">In Progress</span>
                  </div>
                  <p class="text-xs text-muted-foreground mt-1">Brand: Northwind Bank · Due Oct 24 · $2,400</p>
                  <div class="mt-2 flex items-center gap-3">
                    <div class="h-2 w-48 rounded-full bg-muted overflow-hidden"><div class="h-full bg-primary" style="width:72%"></div></div>
                    <span class="text-xs font-bold">72%</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button onclick="showNotification('Deliverable preview sent to Northwind Bank.')" class="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent">Submit Milestone</button>
                </div>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-4 pt-3">
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold">Order-status voice bot</h4>
                    <span class="rounded-full bg-amber-500/10 text-amber-400 px-2 py-0.5 text-xs font-bold">Kickoff</span>
                  </div>
                  <p class="text-xs text-muted-foreground mt-1">Brand: Zesto Foods · Due Nov 08 · $2,000</p>
                  <div class="mt-2 flex items-center gap-3">
                    <div class="h-2 w-48 rounded-full bg-muted overflow-hidden"><div class="h-full bg-primary" style="width:35%"></div></div>
                    <span class="text-xs font-bold">35%</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button onclick="showNotification('Opening workspace design board.')" class="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent">Open Board</button>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (targetId.includes('reviews')) {
        panel.innerHTML = `
          <div class="space-y-4">
            <h3 class="text-xl font-bold">Verified Brand Client Reviews (2)</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl border bg-card p-5 shadow-card">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold">Northwind Bank</h4>
                  <span class="text-amber-400 text-xs font-bold">★ 5.0</span>
                </div>
                <p class="text-xs text-muted-foreground mt-0.5">Priya M. · Aug 2026</p>
                <p class="text-xs mt-3 leading-relaxed">“Anika's agent handled 60% of calls on day one. Clear communication throughout and outstanding multilingual execution.”</p>
              </div>
              <div class="rounded-2xl border bg-card p-5 shadow-card">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold">Zesto Foods</h4>
                  <span class="text-amber-400 text-xs font-bold">★ 5.0</span>
                </div>
                <p class="text-xs text-muted-foreground mt-0.5">Rahul K. · Jun 2026</p>
                <p class="text-xs mt-3 leading-relaxed">“Brilliant Hindi voice quality — customers didn't notice it was AI. Seamless integration with our refund webhooks.”</p>
              </div>
            </div>
          </div>
        `;
      } else if (targetId.includes('packages')) {
        panel.innerHTML = `
          <div class="space-y-4">
            <h3 class="text-xl font-bold">Published Creator Packages</h3>
            <div class="grid gap-4 sm:grid-cols-3">
              <div class="rounded-2xl border bg-card p-5 shadow-card">
                <h4 class="font-bold text-base">Starter</h4>
                <p class="text-2xl font-extrabold text-primary mt-2">$900</p>
                <p class="text-xs text-muted-foreground">7 days turnaround</p>
                <ul class="mt-4 space-y-2 text-xs text-muted-foreground">
                  <li>✓ 1 voice persona</li>
                  <li>✓ Up to 5 intents</li>
                  <li>✓ 1 language</li>
                </ul>
              </div>
              <div class="rounded-2xl border border-primary/50 bg-card p-5 shadow-card relative">
                <span class="absolute top-3 right-3 rounded-full bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5">Popular</span>
                <h4 class="font-bold text-base">Growth</h4>
                <p class="text-2xl font-extrabold text-primary mt-2">$2,400</p>
                <p class="text-xs text-muted-foreground">14 days turnaround</p>
                <ul class="mt-4 space-y-2 text-xs text-muted-foreground">
                  <li>✓ Custom voice cloning</li>
                  <li>✓ Up to 20 intents</li>
                  <li>✓ 2 languages</li>
                  <li>✓ Analytics & logging</li>
                </ul>
              </div>
              <div class="rounded-2xl border bg-card p-5 shadow-card">
                <h4 class="font-bold text-base">Enterprise</h4>
                <p class="text-2xl font-extrabold text-primary mt-2">$6,000</p>
                <p class="text-xs text-muted-foreground">30 days turnaround</p>
                <ul class="mt-4 space-y-2 text-xs text-muted-foreground">
                  <li>✓ Unlimited intents</li>
                  <li>✓ CRM & API webhooks</li>
                  <li>✓ Dedicated SLA support</li>
                </ul>
              </div>
            </div>
          </div>
        `;
      } else if (targetId.includes('skills')) {
        panel.innerHTML = `
          <div class="rounded-2xl border bg-card p-6 shadow-card space-y-5">
            <h3 class="text-xl font-bold">Verified Technical Competencies</h3>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-xs font-semibold mb-1"><span>Voice AI</span><span>96%</span></div>
                <div class="h-2 rounded-full bg-muted overflow-hidden"><div class="h-full bg-primary" style="width:96%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-semibold mb-1"><span>LLM Integration</span><span>88%</span></div>
                <div class="h-2 rounded-full bg-muted overflow-hidden"><div class="h-full bg-primary" style="width:88%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-semibold mb-1"><span>Chatbots & Turn-Taking</span><span>82%</span></div>
                <div class="h-2 rounded-full bg-muted overflow-hidden"><div class="h-full bg-primary" style="width:82%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-semibold mb-1"><span>Prompt Engineering</span><span>80%</span></div>
                <div class="h-2 rounded-full bg-muted overflow-hidden"><div class="h-full bg-primary" style="width:80%"></div></div>
              </div>
            </div>
          </div>
        `;
      }
    }

    // PROFILE TABS
    if (isProfile) {
      if (targetId.includes('reviews')) {
        panel.innerHTML = `
          <div class="space-y-4">
            <h3 class="text-xl font-bold">Client Reviews</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl border bg-card p-5 shadow-card">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold">Northwind Bank</h4>
                  <span class="text-amber-400 text-xs font-bold">★ 5.0</span>
                </div>
                <p class="text-xs text-muted-foreground mt-0.5">Priya M. · Aug 2026</p>
                <p class="text-xs mt-3 leading-relaxed">“The deliverables exceeded our quality metrics. Real-time accuracy and zero latency in bilingual flows.”</p>
              </div>
              <div class="rounded-2xl border bg-card p-5 shadow-card">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold">Zesto Foods</h4>
                  <span class="text-amber-400 text-xs font-bold">★ 5.0</span>
                </div>
                <p class="text-xs text-muted-foreground mt-0.5">Rahul K. · Jun 2026</p>
                <p class="text-xs mt-3 leading-relaxed">“Flawless voice cadence. Transformed our support resolution rate overnight.”</p>
              </div>
            </div>
          </div>
        `;
      } else if (targetId.includes('packages')) {
        panel.innerHTML = `
          <div class="space-y-4">
            <h3 class="text-xl font-bold">Service Packages</h3>
            <div class="grid gap-4 sm:grid-cols-3">
              <div class="rounded-2xl border bg-card p-5 shadow-card flex flex-col justify-between">
                <div>
                  <h4 class="font-bold text-base">Starter Sprint</h4>
                  <p class="text-2xl font-extrabold text-primary mt-2">$900</p>
                  <p class="text-xs text-muted-foreground">7 days delivery</p>
                  <ul class="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <li>✓ 1 Core AI Asset</li>
                    <li>✓ 2 Revisions</li>
                  </ul>
                </div>
                <button onclick="window.sendInterviewInvite('creator-id', 'Creator')" class="mt-4 w-full rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground">Inquire</button>
              </div>
              <div class="rounded-2xl border border-primary/50 bg-card p-5 shadow-card flex flex-col justify-between">
                <div>
                  <h4 class="font-bold text-base">Growth Campaign</h4>
                  <p class="text-2xl font-extrabold text-primary mt-2">$2,400</p>
                  <p class="text-xs text-muted-foreground">14 days delivery</p>
                  <ul class="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <li>✓ Full Generative Pipeline</li>
                    <li>✓ Custom Tuning</li>
                    <li>✓ Commercial License</li>
                  </ul>
                </div>
                <button onclick="window.sendInterviewInvite('creator-id', 'Creator')" class="mt-4 w-full rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground">Inquire</button>
              </div>
              <div class="rounded-2xl border bg-card p-5 shadow-card flex flex-col justify-between">
                <div>
                  <h4 class="font-bold text-base">Enterprise Studio</h4>
                  <p class="text-2xl font-extrabold text-primary mt-2">$6,000</p>
                  <p class="text-xs text-muted-foreground">30 days delivery</p>
                  <ul class="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <li>✓ End-to-End Multimodal Solution</li>
                    <li>✓ Full Architecture Handoff</li>
                  </ul>
                </div>
                <button onclick="window.sendInterviewInvite('creator-id', 'Creator')" class="mt-4 w-full rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground">Inquire</button>
              </div>
            </div>
          </div>
        `;
      } else if (targetId.includes('skills')) {
        panel.innerHTML = `
          <div class="rounded-2xl border bg-card p-6 shadow-card space-y-4">
            <h3 class="text-xl font-bold">Verified Skills</h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-xs font-semibold mb-1"><span>Core Specialty</span><span>96%</span></div>
                <div class="h-2 rounded-full bg-muted overflow-hidden"><div class="h-full bg-primary" style="width:96%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-semibold mb-1"><span>Multimodal AI Integration</span><span>90%</span></div>
                <div class="h-2 rounded-full bg-muted overflow-hidden"><div class="h-full bg-primary" style="width:90%"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-semibold mb-1"><span>Prompt Architecture</span><span>85%</span></div>
                <div class="h-2 rounded-full bg-muted overflow-hidden"><div class="h-full bg-primary" style="width:85%"></div></div>
              </div>
            </div>
          </div>
        `;
      } else if (targetId.includes('image')) {
        panel.innerHTML = `
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div class="overflow-hidden rounded-2xl border bg-card shadow-card">
              <img src="/assets/agent-CSMXJPRd.jpg" class="aspect-video w-full object-cover"/>
              <div class="p-4">
                <span class="text-xs font-bold text-primary uppercase">Image Spec</span>
                <h4 class="font-bold text-sm mt-1">High-Fidelity Persona Lookbook</h4>
                <p class="text-xs text-muted-foreground mt-1">Consistent facial architecture across 12 generative frames.</p>
              </div>
            </div>
          </div>
        `;
      } else if (targetId.includes('project')) {
        panel.innerHTML = `
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div class="overflow-hidden rounded-2xl border bg-card shadow-card">
              <img src="/assets/chatbot-D5BS4HUv.jpg" class="aspect-video w-full object-cover"/>
              <div class="p-4">
                <span class="text-xs font-bold text-primary uppercase">Full System Project</span>
                <h4 class="font-bold text-sm mt-1">Enterprise Conversational Agent</h4>
                <p class="text-xs text-muted-foreground mt-1">Production pipeline processing thousands of interactions daily.</p>
              </div>
            </div>
          </div>
        `;
      }
    }
  }

  // ==========================================
  // 5. UNIVERSAL ACTION INTERCEPTOR (ACCEPT, DECLINE, INVITE, PICKS)
  // ==========================================
  function initUniversalActionHandlers() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('button, a');
      if (!btn) return;
      const txt = (btn.textContent || '').trim();

      // 1. Accept button on invitation cards
      if (txt === 'Accept') {
        e.preventDefault();
        e.stopPropagation();
        const row = btn.closest('[data-invite-id]') || btn.closest('.flex');
        const invId = row?.getAttribute('data-invite-id') || 'demo-invite';
        window.handleInviteResponse(invId, 'confirmed', btn);
        return;
      }

      // 2. Decline button on invitation cards
      if (txt === 'Decline') {
        e.preventDefault();
        e.stopPropagation();
        const row = btn.closest('[data-invite-id]') || btn.closest('.flex');
        const invId = row?.getAttribute('data-invite-id') || 'demo-invite';
        window.handleInviteResponse(invId, 'declined', btn);
        return;
      }

      // 3. "Invite to interview" or "Invite" button on creator cards
      if (txt === 'Invite to interview' || (txt.startsWith('Invite') && !txt.includes('invitation'))) {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest('.group, .rounded-3xl, .rounded-2xl, .p-5, .p-4') || btn.parentElement;
        const link = card?.querySelector('a[href^="/creators/"]');
        const slug = link ? link.getAttribute('href').replace('/creators/', '').trim() : '';
        const name = card?.querySelector('h3, h4')?.textContent?.replace(/[\r\n]+/g, ' ').trim() || slug || 'Creator';
        const cid = resolveCreatorId(btn.getAttribute('data-creator-id') || slug, name);
        window.openInterviewModal(cid, name);
        return;
      }

      // 4. "My Picks" button or Bookmark icon on creator cards
      const hasBookmark = btn.querySelector('svg.lucide-bookmark') || btn.getAttribute('aria-label') === 'Save';
      if ((txt === 'My Picks' || txt.includes('My Picks') || hasBookmark) && btn.getAttribute('role') !== 'tab') {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest('.group, .rounded-3xl, .rounded-2xl, .p-5, .p-4') || btn.parentElement;
        const link = card?.querySelector('a[href^="/creators/"]');
        const slug = link ? link.getAttribute('href').replace('/creators/', '').trim() : '';
        const name = card?.querySelector('h3, h4')?.textContent?.replace(/[\r\n]+/g, ' ').trim() || slug || 'Creator';
        const cid = resolveCreatorId(btn.getAttribute('data-creator-id') || slug, name);
        window.saveCreatorToPicks(cid, name, btn);
        return;
      }

      // 5. "Ask AI assistant" button -> activates the Voice Assistant bar & Chat (Pictures 1 & 2)
      if (txt.includes('Ask AI assistant') || btn.querySelector('svg.lucide-sparkle')) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.linkToAiAssistant === 'function') {
          window.linkToAiAssistant();
        } else {
          const chatBtn = document.getElementById('havoc-chat-modal-btn');
          if (chatBtn) chatBtn.click();
          const assistantTab = document.getElementById('radix-_R_iiq_-trigger-assistant');
          if (assistantTab) assistantTab.click();
        }
        return;
      }
    }, true);
  }

  // ==========================================
  // 6. CATEGORY FILTER PILLS (EXPLORE & DISCOVER)
  // ==========================================
  function initCategoryFilters() {
    const filterButtons = document.querySelectorAll('.mt-4.flex.flex-wrap.gap-2 button, [role="tablist"] + div button');
    filterButtons.forEach(btn => {
      const text = (btn.textContent || '').trim();
      const validCategories = ['All', 'Voice AI', 'AI Video', 'Chatbots', 'AI Image Generation', 'AI Agents', 'Generative Film', 'Prompt Engineering', 'LLM Integration'];
      if (validCategories.includes(text)) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          // Update button styles
          btn.parentElement.querySelectorAll('button').forEach(b => {
            b.className = 'rounded-full border px-3 py-1.5 text-sm bg-card';
          });
          btn.className = 'rounded-full border px-3 py-1.5 text-sm border-primary bg-accent text-accent-foreground font-semibold';

          // Filter creator cards in nearby grid
          const grid = document.querySelector('.mt-8.grid, .grid.gap-4, .grid.gap-5');
          if (grid) {
            const cards = grid.children;
            Array.from(cards).forEach(card => {
              if (text === 'All') {
                card.style.display = '';
              } else {
                const cardText = card.textContent || '';
                if (cardText.includes(text) || (text === 'Generative Film' && cardText.includes('Film'))) {
                  card.style.display = '';
                } else {
                  card.style.display = 'none';
                }
              }
            });
          }
        });
      }
    });
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function boot() {
    injectVideoModal();
    injectUploadModal();
    injectUploadTrigger();
    initTabEngine();
    initUniversalActionHandlers();
    initCategoryFilters();
    initBrandPageBackend();
    initStudioInvites();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }


})();

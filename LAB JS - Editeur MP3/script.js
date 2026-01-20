
/* Audio Visualizer & Exporter - Vanilla JS (UI initiale + fonctions avancées)
 * Ajouts: Zoom & scroll, grille tempo (snap), régions + export batch, FFT & spectrogramme live,
 * normalisation dBFS, raccourcis étendus, aide modale.
 */
(() => {
  // DOM refs
  const $ = (s) => document.querySelector(s);
  const fileInput = $('#fileInput');
  const fileInfo = $('#fileInfo');
  const canvas = $('#waveform');
  const ctx2d = canvas.getContext('2d');
  const selStartEl = $('#selStart');
  const selEndEl = $('#selEnd');
  const selDurEl = $('#selDur');

  const playBtn = $('#playBtn');
  const pauseBtn = $('#pauseBtn');
  const stopBtn = $('#stopBtn');
  const loopSel = $('#loopSel');
  const clearSelBtn = $('#clearSelBtn');
  const addRegionBtn = $('#addRegionBtn');

  const muteL = $('#muteL');
  const muteR = $('#muteR');
  const gainL = $('#gainL');
  const gainR = $('#gainR');
  const centerReduce = $('#centerReduce');
  const centerReduceVal = $('#centerReduceVal');

  const formatSelect = $('#formatSelect');
  const contentSelect = $('#contentSelect');
  const mp3Bitrate = $('#mp3Bitrate');
  const normalizeChk = $('#normalizeChk');
  const targetDb = $('#targetDb');
  const exportBtn = $('#exportBtn');
  const exportStatus = $('#exportStatus');

  const zoomInBtn = $('#zoomInBtn');
  const zoomOutBtn = $('#zoomOutBtn');
  const zoomResetBtn = $('#zoomResetBtn');

  const showGrid = $('#showGrid');
  const snapGrid = $('#snapGrid');
  const bpmInput = $('#bpmInput');
  const timeSigSel = $('#timesig');

  const spectrumCanvas = $('#spectrum');
  const spectrumCtx = spectrumCanvas.getContext('2d');
  const spectrogramCanvas = $('#spectrogram');
  const spectrogramCtx = spectrogramCanvas.getContext('2d');

  const regionsListEl = $('#regionsList');
  const exportRegionsBtn = $('#exportRegionsBtn');

  const helpBtn = $('#helpBtn');
  const helpModal = $('#helpModal');
  const helpClose = $('#helpClose');

  // State
  let audioCtx = null;
  let mainSource = null;
  let masterGain = null;
  let analyser = null;
  let playing = false;

  let audioBuffer = null;
  let duration = 0;
  let selection = { start: 0, end: 0, active: false };

  // View (zoom & scroll)
  let view = { start: 0, end: 1, minLen: 0.05 };
  let lastMouseTime = 0;

  // Regions
  let regions = []; // {id, name, start, end, color, enabled}

  // For live mixing
  let split = null;
  let merge = null;
  let gLL = null, gLR = null, gRR = null, gRL = null;
  let volL = null, volR = null;

  // Interaction
  let isDragging = false;
  let dragStartX = 0;

  // Visualization loop
  let vizRAF = null;

  function ensureAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 1;

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyser.minDecibels = -100;
      analyser.maxDecibels = -30;
    }
  }

  // -------- Load file --------
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await loadFile(file);
  });

  async function loadFile(file) {
    ensureAudioContext();
    stopPlayback();

    fileInfo.textContent = `Chargement de “${file.name}”…`;
    const arrayBuf = await file.arrayBuffer();

    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
    } catch (err) {
      console.error(err);
      fileInfo.textContent = `Échec du décodage audio (${err?.message || err}).`;
      return;
    }

    duration = audioBuffer.duration;
    view.start = 0; view.end = duration || 1;
    selection = { start: 0, end: 0, active: false };
    regions = [];
    updateRegionsList();

    const sr = audioBuffer.sampleRate;
    fileInfo.textContent = `Fichier: ${file.name} • ${formatTime(duration)} • ${audioBuffer.numberOfChannels} canaux • ${sr} Hz`;
    updateSelectionUI();
    redraw();

    [playBtn, pauseBtn, stopBtn, clearSelBtn, addRegionBtn, exportBtn, exportRegionsBtn].forEach(b => b.disabled = false);

    if (typeof window.lamejs === 'undefined') {
      formatSelect.value = 'wav';
      [...formatSelect.options].forEach(opt => {
        if (opt.value === 'mp3') opt.textContent = 'MP3 (lamejs non chargé)';
      });
    }
  }

  // -------- Drawing --------
  function redraw() {
    drawWaveform();
  }

  function drawWaveform() {
    const w = canvas.width;
    const h = canvas.height;
    const t1 = view.start;
    const t2 = view.end;

    // bg
    ctx2d.clearRect(0,0,w,h);
    ctx2d.fillStyle = '#0c1130';
    ctx2d.fillRect(0,0,w,h);

    // tempo grid
    if (showGrid.checked && audioBuffer) drawTempoGrid(ctx2d, w, h, t1, t2);

    // waveform
    if (audioBuffer) {
      drawPeaksWindow(audioBuffer, t1, t2, w, h);

      // regions overlay
      drawRegionsOverlay(ctx2d, w, h, t1, t2);
      // selection overlay
      drawSelectionOverlay(ctx2d, w, h, t1, t2);
      // axis labels
      drawAxisLabels(ctx2d, w, t1, t2);
    }
  }

  function drawTempoGrid(ctx, w, h, t1, t2) {
    const bpm = parseFloat(bpmInput.value) || 120;
    const sig = timeSigSel.value || '4/4';
    const [num] = sig.split('/').map(n => parseInt(n, 10));
    const spb = 60 / bpm;

    ctx.save();
    const firstBeat = Math.floor(t1 / spb);
    const lastBeat = Math.ceil(t2 / spb);
    for (let i = firstBeat; i <= lastBeat; i++) {
      const t = i * spb;
      const x = timeToX(t, t1, t2, w) + 0.5;
      const isBar = (i % num) === 0;
      ctx.strokeStyle = isBar ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)';
      ctx.lineWidth = isBar ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    ctx.restore();
  }

  function drawPeaksWindow(buffer, t1, t2, w, h) {
    const startSample = Math.floor(t1 * buffer.sampleRate);
    const endSample = Math.min(buffer.length, Math.ceil(t2 * buffer.sampleRate));
    const samples = Math.max(1, endSample - startSample);
    const blockSize = Math.max(1, Math.floor(samples / w));
    const channels = Math.min(2, buffer.numberOfChannels);
    const amp = h * 0.4;

    const drawChannel = (ch, color, yCenter, flip = false) => {
      const data = buffer.getChannelData(ch);
      ctx2d.beginPath();
      ctx2d.strokeStyle = color;
      ctx2d.lineWidth = 1;
      let x = 0;
      let first = true;
      for (let i = startSample; i < endSample; i += blockSize) {
        let mn = 1.0, mx = -1.0;
        const e = Math.min(endSample, i + blockSize);
        for (let j = i; j < e; j++) {
          const v = data[j];
          if (v < mn) mn = v;
          if (v > mx) mx = v;
        }
        const v = (mn + mx) * 0.5;
        const y = yCenter + (flip ? -1 : 1) * v * amp;
        if (first) { ctx2d.moveTo(0.5, y); first = false; }
        else ctx2d.lineTo(x + 0.5, y);
        x++;
      }
      ctx2d.stroke();
    };

    drawChannel(0, '#5ac8fa', h * 0.33, false);
    if (channels > 1) drawChannel(1, '#89d185', h * 0.67, true);
  }

  function drawSelectionOverlay(ctx, w, h, t1, t2) {
    if (!(selection.active && selection.end > selection.start)) return;
    const x1 = timeToX(selection.start, t1, t2, w);
    const x2 = timeToX(selection.end, t1, t2, w);
    if (x2 <= 0 || x1 >= w) return;
    const a = Math.max(0, Math.min(w, x1));
    const b = Math.max(0, Math.min(w, x2));
    ctx.fillStyle = 'rgba(90,200,250,0.15)';
    ctx.fillRect(a, 0, Math.max(1, b - a), h);
    ctx.strokeStyle = '#5ac8fa';
    ctx.lineWidth = 2;
    ctx.strokeRect(a + 0.5, 0.5, Math.max(1, b - a) - 1, h - 1);
  }

  function drawRegionsOverlay(ctx, w, h, t1, t2) {
    regions.forEach(r => {
      const x1 = timeToX(r.start, t1, t2, w);
      const x2 = timeToX(r.end, t1, t2, w);
      if (x2 <= 0 || x1 >= w) return;
      const a = Math.max(0, Math.min(w, x1));
      const b = Math.max(0, Math.min(w, x2));
      ctx.fillStyle = hexToRgba(r.color || '#ffcc00', 0.15);
      ctx.fillRect(a, 0, Math.max(1, b - a), h);
      ctx.fillStyle = hexToRgba(r.color || '#ffcc00', 0.35);
      ctx.fillRect(a, 0, Math.max(1, b - a), 6);
      ctx.fillStyle = '#ffffffaa';
      ctx.font = '12px ui-sans-serif, system-ui';
      ctx.textBaseline = 'top';
      ctx.fillText(`${r.name || r.id}`, a + 4, 8);
    });
  }

  function drawAxisLabels(ctx, w, t1, t2) {
    const h = canvas.height;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '11px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const span = t2 - t1;
    const approxLabels = Math.min(12, Math.max(4, Math.floor(w / 100)));
    const step = niceTimeStep(span / approxLabels);
    const start = Math.ceil(t1 / step) * step;
    for (let t = start; t <= t2; t += step) {
      const x = timeToX(t, t1, t2, w);
      ctx.fillText(formatSec(t), x, 4);
    }
    ctx.strokeStyle = '#2a3157';
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  function niceTimeStep(raw) {
    const steps = [0.1,0.2,0.5,1,2,5,10,20,30,60,120,300];
    for (const s of steps) if (raw <= s) return s;
    return steps[steps.length - 1];
  }

  function timeToX(t, t1, t2, w) {
    return Math.floor(((t - t1) / (t2 - t1)) * w);
  }
  function xToTimeOnView(x) {
    const rect = canvas.getBoundingClientRect();
    const relX = Math.min(Math.max(0, x - rect.left), rect.width);
    return view.start + (relX / rect.width) * (view.end - view.start);
  }

  function updateSelectionUI() {
    const s = selection.start || 0;
    const e = selection.end || 0;
    const d = Math.max(0, e - s);
    selStartEl.textContent = `${s.toFixed(3)} s`;
    selEndEl.textContent = `${e.toFixed(3)} s`;
    selDurEl.textContent = `${d.toFixed(3)} s`;
  }

  // -------- Canvas interactions --------
  canvas.addEventListener('mousedown', (ev) => {
    if (!audioBuffer) return;
    isDragging = true;
    dragStartX = ev.clientX;
    const t = snapIfNeeded(xToTimeOnView(ev.clientX));
    selection.start = t;
    selection.end = t;
    selection.active = false;
    updateSelectionUI();
    redraw();
  });

  window.addEventListener('mousemove', (ev) => {
    if (!audioBuffer) return;
    lastMouseTime = clamp(snapIfNeeded(xToTimeOnView(ev.clientX)), 0, duration);
    if (isDragging) {
      const t = snapIfNeeded(xToTimeOnView(ev.clientX));
      const s = snapIfNeeded(xToTimeOnView(dragStartX));
      selection.start = Math.max(0, Math.min(s, t));
      selection.end = Math.min(duration, Math.max(s, t));
      selection.active = (selection.end - selection.start) > 0.005;
      updateSelectionUI();
      redraw();
    }
  });
  window.addEventListener('mouseup', () => { isDragging = false; });

  // Scroll & zoom (wheel)
  canvas.addEventListener('wheel', (ev) => {
    if (!audioBuffer) return;
    ev.preventDefault();
    const cursorTime = xToTimeOnView(ev.clientX);
    if (ev.altKey) {
      const factor = ev.deltaY > 0 ? 1.15 : 1/1.15;
      zoomAt(cursorTime, factor);
    } else {
      pan((view.end - view.start) * (ev.deltaY > 0 ? 0.1 : -0.1));
    }
  }, { passive: false });

  function pan(dt) {
    const span = view.end - view.start;
    let ns = clamp(view.start + dt, 0, Math.max(0, duration - span));
    let ne = ns + span;
    if (ne > duration) { ne = duration; ns = ne - span; }
    view.start = ns; view.end = ne;
    redraw();
  }

  function zoomAt(centerTime, factor) {
    const span = clamp((view.end - view.start) * factor, view.minLen, duration || 1);
    let ns = clamp(centerTime - span/2, 0, Math.max(0, duration - span));
    let ne = ns + span;
    view.start = ns; view.end = ne;
    redraw();
  }
  zoomInBtn.addEventListener('click', () => zoomAt((view.start+view.end)/2, 1/1.25));
  zoomOutBtn.addEventListener('click', () => zoomAt((view.start+view.end)/2, 1.25));
  zoomResetBtn.addEventListener('click', () => { view.start = 0; view.end = duration || 1; redraw(); });

  // -------- Playback & mixing --------
  playBtn.addEventListener('click', async () => {
    if (!audioBuffer) return;
    ensureAudioContext();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    startPlayback();
  });
  pauseBtn.addEventListener('click', async () => { if (audioBuffer && audioCtx) await audioCtx.suspend(); });
  stopBtn.addEventListener('click', () => stopPlayback());

  function buildLiveGraph() {
    [gLL, gLR, gRR, gRL, volL, volR, split, merge].forEach(n => { try { n && n.disconnect(); } catch {} });
    split = audioCtx.createChannelSplitter(2);
    merge = audioCtx.createChannelMerger(2);
    gLL = audioCtx.createGain(); gLR = audioCtx.createGain();
    gRR = audioCtx.createGain(); gRL = audioCtx.createGain();
    volL = audioCtx.createGain(); volR = audioCtx.createGain();

    split.connect(gLL, 0);
    split.connect(gRL, 0);
    split.connect(gLR, 1);
    split.connect(gRR, 1);

    gLL.connect(volL);
    gLR.connect(volL);
    volL.connect(merge, 0, 0);

    gRR.connect(volR);
    gRL.connect(volR);
    volR.connect(merge, 0, 1);

    merge.connect(masterGain);
    try { merge.connect(analyser); } catch {}
    masterGain.connect(audioCtx.destination);

    applyMatrixFromUI();
  }

  function startPlayback() {
    stopPlayback();
    mainSource = audioCtx.createBufferSource();
    mainSource.buffer = audioBuffer;
    buildLiveGraph();
    mainSource.connect(split);

    const hasSel = selection.active && (selection.end > selection.start);
    mainSource.loop = loopSel.checked && hasSel;
    if (mainSource.loop) {
      mainSource.loopStart = selection.start;
      mainSource.loopEnd = selection.end;
    }
    mainSource.start(0, hasSel ? selection.start : 0);
    playing = true;
    mainSource.onended = () => { playing = false; };
    startVizLoop();
  }

  function stopPlayback() {
    if (mainSource) { try { mainSource.stop(0); } catch {} try { mainSource.disconnect(); } catch {} }
    mainSource = null; playing = false;
    cancelAnimationFrame(vizRAF);
  }

  function applyMatrixFromUI() {
    const gl = parseFloat(gainL.value);
    const gr = parseFloat(gainR.value);
    const muteLeft = muteL.checked;
    const muteRight = muteR.checked;
    const cr = parseFloat(centerReduce.value);
    centerReduceVal.textContent = `${Math.round(cr * 100)}%`;

    const main = 1, cross = -cr;
    if (gLL) gLL.gain.value = muteLeft ? 0 : main * gl;
    if (gLR) gLR.gain.value = muteLeft ? 0 : cross * gl;
    if (gRR) gRR.gain.value = muteRight ? 0 : main * gr;
    if (gRL) gRL.gain.value = muteRight ? 0 : cross * gr;
    if (volL) volL.gain.value = 1;
    if (volR) volR.gain.value = 1;
  }
  [muteL, muteR, gainL, gainR, centerReduce].forEach(el => el.addEventListener('input', applyMatrixFromUI));

  // -------- FFT + Spectrogram (live) --------
  function startVizLoop() {
    cancelAnimationFrame(vizRAF);
    const freqBins = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(freqBins);

    function draw() {
      if (!analyser) return;
      analyser.getByteFrequencyData(dataArray);

      // spectrum
      const specW = spectrumCanvas.width, specH = spectrumCanvas.height;
      spectrumCtx.fillStyle = '#0e1331';
      spectrumCtx.fillRect(0, 0, specW, specH);
      const barCount = Math.min(128, freqBins);
      const step = Math.floor(freqBins / barCount);
      const barWidth = specW / barCount;
      for (let i = 0; i < barCount; i++) {
        let v = 0; for (let j = 0; j < step; j++) v += dataArray[i*step + j];
        v /= step;
        const h = (v/255) * (specH - 4);
        spectrumCtx.fillStyle = '#5ac8fa';
        spectrumCtx.fillRect(i * barWidth, specH - h, barWidth - 1, h);
      }

      // spectrogram: shift left, draw column at right
      const spgW = spectrogramCanvas.width, spgH = spectrogramCanvas.height;
      const img = spectrogramCtx.getImageData(1, 0, spgW - 1, spgH);
      spectrogramCtx.putImageData(img, 0, 0);
      for (let y = 0; y < spgH; y++) {
        const t = 1 - y / spgH;
        const bin = Math.min(freqBins - 1, Math.floor(Math.pow(t, 2) * freqBins));
        const val = dataArray[bin] / 255;
        spectrogramCtx.fillStyle = heatColor(val);
        spectrogramCtx.fillRect(spgW - 1, y, 1, 1);
      }

      vizRAF = requestAnimationFrame(draw);
    }
    draw();
  }
  function heatColor(v) {
    const r = Math.floor(255 * Math.max(0, Math.min(1, (v - 0.5) * 2)));
    const g = Math.floor(255 * Math.min(1, v * 2));
    const b = Math.floor(255 * (1 - v));
    return `rgb(${r},${g},${b})`;
  }

  // -------- Regions --------
  addRegionBtn.addEventListener('click', () => {
    if (!(selection.active && selection.end > selection.start)) return;
    const id = `R${regions.length + 1}`;
    const color = pickColor(regions.length);
    const region = { id, name: id, start: selection.start, end: selection.end, color, enabled: true };
    regions.push(region);
    updateRegionsList();
    redraw();
  });

  exportRegionsBtn.addEventListener('click', async () => {
    if (!audioBuffer) return;
    const toExport = regions.filter(r => r.enabled);
    if (!toExport.length) { exportStatus.textContent = 'Aucune région active à exporter.'; return; }
    exportStatus.textContent = `Export des régions (${toExport.length})…`;
    exportBtn.disabled = true; exportRegionsBtn.disabled = true;

    const fmt = formatSelect.value;
    if (fmt === 'mp3' && typeof window.lamejs === 'undefined') {
      exportStatus.textContent = 'MP3 indisponible (lamejs non chargé). Choisis WAV.';
      exportBtn.disabled = false; exportRegionsBtn.disabled = false;
      return;
    }

    try {
      for (let i = 0; i < toExport.length; i++) {
        const r = toExport[i];
        exportStatus.textContent = `Export ${i + 1}/${toExport.length}: ${r.name}…`;
        const rendered = await renderOffline(r.start, r.end, 'stereo');
        const scale = normalizeChk.checked ? computeNormalizeScale(rendered, parseFloat(targetDb.value || '-1')) : 1;

        if (fmt === 'wav') {
          const blob = audioBufferToWavBlob(rendered, scale);
          downloadBlob(blob, makeFileName(`${r.name}`, 'wav'));
        } else {
          const kbps = parseInt(mp3Bitrate.value, 10) || 192;
          const blob = audioBufferToMp3Blob(rendered, kbps, scale);
          downloadBlob(blob, makeFileName(`${r.name}`, 'mp3'));
        }
        await new Promise(r => setTimeout(r, 10));
      }
      exportStatus.textContent = `Export des régions terminé ✅`;
    } catch (err) {
      console.error(err);
      exportStatus.textContent = `Erreur export régions: ${err?.message || err}`;
    } finally {
      exportBtn.disabled = false; exportRegionsBtn.disabled = false;
    }
  });

  function updateRegionsList() {
    if (!regions.length) {
      regionsListEl.classList.add('empty');
      regionsListEl.innerHTML = 'Aucune région. Crée-en une depuis la sélection (bouton “➕ Ajouter région”).';
      exportRegionsBtn.disabled = true;
      return;
    }
    regionsListEl.classList.remove('empty');
    regionsListEl.innerHTML = '';
    regions.forEach((r, idx) => {
      const row = document.createElement('div');
      row.className = 'region-item';
      row.innerHTML = `
        <input type="text" value="${escapeHtml(r.name)}" title="Nom" />
        <div class="mini">[${formatSec(r.start)} – ${formatSec(r.end)}]</div>
        <label class="mini"><input type="checkbox" ${r.enabled ? 'checked' : ''} /> Actif</label>
        <input type="color" value="${r.color}"/>
        <div class="btns">
          <button class="btn-secondary" data-act="select">Sélectionner</button>
          <button class="btn-secondary" data-act="delete">Suppr</button>
        </div>
      `;
      const [nameInput, , enabledWrap, colorInput, btns] = row.children;

      nameInput.addEventListener('change', () => { r.name = nameInput.value; redraw(); });
      const enabledChk = enabledWrap.querySelector('input[type="checkbox"]');
      enabledChk.addEventListener('change', () => { r.enabled = enabledChk.checked; });

      colorInput.addEventListener('input', () => { r.color = colorInput.value; redraw(); });
      btns.querySelector('[data-act="select"]').addEventListener('click', () => {
        selection = { start: r.start, end: r.end, active: true };
        ensureViewCovers(selection.start, selection.end);
        updateSelectionUI(); redraw();
      });
      btns.querySelector('[data-act="delete"]').addEventListener('click', () => {
        regions.splice(idx, 1);
        updateRegionsList(); redraw();
      });

      regionsListEl.appendChild(row);
    });
    exportRegionsBtn.disabled = false;
  }

  function ensureViewCovers(s, e) {
    const margin = 0.05 * (view.end - view.start);
    if (s >= view.start + margin && e <= view.end - margin) return;
    const center = (s + e) / 2;
    const span = Math.max(e - s, view.minLen) * 1.5;
    view.start = clamp(center - span / 2, 0, Math.max(0, duration - span));
    view.end = view.start + span;
  }

  function pickColor(i) {
    const palette = ['#ffcc00', '#ff7f50', '#7fffd4', '#89d185', '#5ac8fa', '#d98cff', '#ff6b6b', '#00d1b2'];
    return palette[i % palette.length];
  }

  // -------- Grid snapping --------
  function snapIfNeeded(t) {
    if (!snapGrid.checked) return t;
    const bpm = parseFloat(bpmInput.value) || 120;
    const spb = 60 / bpm;
    const beatIndex = Math.round(t / spb);
    return beatIndex * spb;
  }

  // -------- Export single --------
  exportBtn.addEventListener('click', async () => {
    try {
      if (!audioBuffer) return;
      exportStatus.textContent = 'Export en cours…';
      exportBtn.disabled = true;

      const fmt = formatSelect.value; // wav | mp3
      if (fmt === 'mp3' && typeof window.lamejs === 'undefined') {
        exportStatus.textContent = 'MP3 indisponible (lamejs non chargé). Choisis WAV.';
        exportBtn.disabled = false;
        return;
      }

      const content = contentSelect.value;
      const hasSel = selection.active && (selection.end > selection.start);
      const range = (content.startsWith('selection') && hasSel)
        ? [selection.start, selection.end]
        : [0, duration];

      const channelsMode =
        content === 'left-mono' ? 'left-mono'
        : content === 'right-mono' ? 'right-mono'
        : 'stereo';

      const rendered = await renderOffline(range[0], range[1], channelsMode);
      const scale = normalizeChk.checked ? computeNormalizeScale(rendered, parseFloat(targetDb.value || '-1')) : 1;

      if (fmt === 'wav') {
        const blob = audioBufferToWavBlob(rendered, scale);
        downloadBlob(blob, makeFileName(content, 'wav'));
        exportStatus.textContent = 'Export WAV terminé ✅';
      } else {
        const kbps = parseInt(mp3Bitrate.value, 10) || 192;
        const blob = audioBufferToMp3Blob(rendered, kbps, scale);
        downloadBlob(blob, makeFileName(content, 'mp3'));
        exportStatus.textContent = 'Export MP3 terminé ✅';
      }
    } catch (err) {
      console.error(err);
      exportStatus.textContent = `Erreur export: ${err?.message || err}`;
    } finally {
      exportBtn.disabled = false;
    }
  });

  function makeFileName(tag, ext) {
    const base = (fileInput.files?.[0]?.name || 'audio').replace(/\.[^.]+$/, '');
    const safe = String(tag || '').replace(/[^a-z0-9\-]+/gi, '_');
    return `${base}-${safe}.${ext}`;
  }

  async function renderOffline(tStart, tEnd, channelsMode) {
    const sr = audioBuffer.sampleRate;
    const lenSec = Math.max(0, Math.min(duration, tEnd) - Math.max(0, tStart));
    const frameCount = Math.max(1, Math.floor(lenSec * sr));
    const outCh = channelsMode === 'stereo' ? 2 : 1;

    const oac = new OfflineAudioContext({ numberOfChannels: outCh, length: frameCount, sampleRate: sr });
    const src = oac.createBufferSource();
    src.buffer = audioBuffer;

    if (channelsMode === 'stereo') {
      const splitO = oac.createChannelSplitter(2);
      const mergeO = oac.createChannelMerger(2);
      const _gLL = oac.createGain(), _gLR = oac.createGain();
      const _gRR = oac.createGain(), _gRL = oac.createGain();
      const _volL = oac.createGain(), _volR = oac.createGain();

      const gl = parseFloat(gainL.value);
      const gr = parseFloat(gainR.value);
      const muteLeft = muteL.checked;
      const muteRight = muteR.checked;
      const cr = parseFloat(centerReduce.value);
      const main = 1, cross = -cr;

      _gLL.gain.value = muteLeft ? 0 : main * gl;
      _gLR.gain.value = muteLeft ? 0 : cross * gl;
      _gRR.gain.value = muteRight ? 0 : main * gr;
      _gRL.gain.value = muteRight ? 0 : cross * gr;
      _volL.gain.value = 1; _volR.gain.value = 1;

      src.connect(splitO);
      splitO.connect(_gLL, 0);
      splitO.connect(_gRL, 0);
      splitO.connect(_gLR, 1);
      splitO.connect(_gRR, 1);

      _gLL.connect(_volL);
      _gLR.connect(_volL);
      _volL.connect(mergeO, 0, 0);

      _gRR.connect(_volR);
      _gRL.connect(_volR);
      _volR.connect(mergeO, 0, 1);

      mergeO.connect(oac.destination);
    } else {
      // mono export from left or right
      const pickLeft = channelsMode === 'left-mono';
      const splitter = oac.createChannelSplitter(2);
      const merger1 = oac.createChannelMerger(1);
      const gn = oac.createGain(); gn.gain.value = 1;
      src.connect(splitter);
      const chIndex = pickLeft ? 0 : 1;
      splitter.connect(gn, chIndex);
      gn.connect(merger1, 0, 0);
      merger1.connect(oac.destination);
    }

    if (tStart > 0 || tEnd < duration) src.start(0, tStart, tEnd - tStart);
    else src.start();

    const rendered = await oac.startRendering();
    return rendered;
  }

  // -------- Normalization --------
  function computeNormalizeScale(buf, targetDb = -1.0) {
    const targetLin = dbToLin(targetDb);
    let peak = 0;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < data.length; i++) {
        const a = Math.abs(data[i]);
        if (a > peak) peak = a;
      }
    }
    if (peak <= 0) return 1;
    return Math.min(8, targetLin / peak); // limite de sécurité du gain
  }
  function dbToLin(db) { return Math.pow(10, db / 20); }

  function audioBufferToWavBlob(buf, scale = 1) {
    const numCh = buf.numberOfChannels;
    const sampleRate = buf.sampleRate;
    const length = buf.length;
    const bytesPerSample = 2;
    const blockAlign = numCh * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeAscii(view, 8, 'WAVE');

    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numCh, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);

    writeAscii(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const chans = [];
    for (let ch = 0; ch < numCh; ch++) chans.push(buf.getChannelData(ch));
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numCh; ch++) {
        let s = (chans[ch][i] || 0) * scale;
        s = Math.max(-1, Math.min(1, s));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      }
    }
    return new Blob([buffer], { type: 'audio/wav' });

    function writeAscii(dv, pos, str) {
      for (let i = 0; i < str.length; i++) dv.setUint8(pos + i, str.charCodeAt(i));
    }
  }

  function audioBufferToMp3Blob(buf, kbps = 192, scale = 1) {
    const lamejs = window.lamejs;
    const numCh = buf.numberOfChannels;
    const sampleRate = buf.sampleRate;

    const mp3enc = new lamejs.Mp3Encoder(numCh, sampleRate, kbps);
    const samples = buf.length;

    const left = buf.getChannelData(0);
    const right = numCh > 1 ? buf.getChannelData(1) : null;

    const blockSize = 1152;
    const mp3Data = [];

    const floatTo16 = (f32, offset, len) => {
      const out = new Int16Array(len);
      for (let i = 0; i < len; i++) {
        let s = (f32[offset + i] || 0) * scale;
        s = Math.max(-1, Math.min(1, s));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return out;
    };

    for (let i = 0; i < samples; i += blockSize) {
      const l = Math.min(blockSize, samples - i);
      const l16 = floatTo16(left, i, l);
      let bufMP3;
      if (numCh === 2 && right) {
        const r16 = floatTo16(right, i, l);
        bufMP3 = mp3enc.encodeBuffer(l16, r16);
      } else {
        bufMP3 = mp3enc.encodeBuffer(l16);
      }
      if (bufMP3.length > 0) mp3Data.push(bufMP3);
    }
    const enc = mp3enc.flush();
    if (enc.length > 0) mp3Data.push(enc);

    return new Blob(mp3Data, { type: 'audio/mpeg' });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = t - m * 60;
    return `${m}:${s.toFixed(3).padStart(6, '0')}`;
  }
  function formatSec(t) {
    if (t >= 60) {
      const m = Math.floor(t / 60);
      const s = (t - m * 60).toFixed(2).padStart(5, '0');
      return `${m}:${s}`;
    }
    return `${t.toFixed(2)}s`;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function escapeHtml(s) { return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function hexToRgba(hex, alpha) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return `rgba(255,204,0,${alpha})`;
    const r = parseInt(m[1],16), g = parseInt(m[2],16), b = parseInt(m[3],16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // -------- Selection helpers --------
  clearSelBtn.addEventListener('click', () => {
    selection = { start: 0, end: 0, active: false };
    updateSelectionUI();
    redraw();
  });

  // -------- Keyboard shortcuts --------
  window.addEventListener('keydown', (e) => {
    if (!audioBuffer) return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (!playing) startPlayback(); else stopPlayback();
    }

    if (e.key === 'i' || e.key === 'I') {
      selection.start = snapIfNeeded(lastMouseTime);
      if (!selection.active) selection.end = selection.start;
      selection.active = (selection.end - selection.start) > 0.005;
      updateSelectionUI(); redraw();
    }
    if (e.key === 'o' || e.key === 'O') {
      selection.end = snapIfNeeded(lastMouseTime);
      if (!selection.active) selection.start = selection.end;
      if (selection.end < selection.start) [selection.start, selection.end] = [selection.end, selection.start];
      selection.active = (selection.end - selection.start) > 0.005;
      updateSelectionUI(); redraw();
    }
    if (e.key === 'l' || e.key === 'L') {
      loopSel.checked = !loopSel.checked;
    }
    if (e.key === 'm' || e.key === 'M') {
      addRegionBtn.click();
    }
    if (e.key === 'Delete') {
      clearSelBtn.click();
    }
    if (e.key === 'a' || e.key === 'A') zoomAt(lastMouseTime, 1/1.25);
    if (e.key === 'z' || e.key === 'Z') zoomAt(lastMouseTime, 1.25);
    if (e.key === 'r' || e.key === 'R') { view.start = 0; view.end = duration || 1; redraw(); }

    // nudge edge near cursor
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if (!selection.active) return;
      const step = e.shiftKey ? 0.5 : 0.05;
      const dir = (e.key === 'ArrowLeft') ? -1 : 1;
      const dS = Math.abs(lastMouseTime - selection.start);
      const dE = Math.abs(lastMouseTime - selection.end);
      if (dS <= dE) {
        selection.start = snapIfNeeded(clamp(selection.start + dir * step, 0, selection.end - 0.001));
      } else {
        selection.end = snapIfNeeded(clamp(selection.end + dir * step, selection.start + 0.001, duration));
      }
      updateSelectionUI(); redraw();
    }
    // snap start/end
    if (e.key === ',' || e.key === ';') {
      selection.start = snapIfNeeded(selection.start);
      selection.active = (selection.end - selection.start) > 0.005;
      updateSelectionUI(); redraw();
    }
    if (e.key === '.' || e.key === ':') {
      selection.end = snapIfNeeded(selection.end);
      if (selection.end < selection.start) selection.end = selection.start + 0.001;
      selection.active = (selection.end - selection.start) > 0.005;
      updateSelectionUI(); redraw();
    }
  });

  // -------- Help modal --------
  helpBtn.addEventListener('click', () => { helpModal.classList.remove('hidden'); helpModal.setAttribute('aria-hidden', 'false'); });
  helpClose?.addEventListener('click', () => { helpModal.classList.add('hidden'); helpModal.setAttribute('aria-hidden', 'true'); });
  helpModal.addEventListener('click', (e) => { if (e.target === helpModal) helpClose.click(); });

  // -------- Resize handling --------
  const ro = new ResizeObserver(() => {
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.max(600, Math.floor(rect.width * scale));
    canvas.height = Math.floor(280 * scale);

    const sr1 = spectrumCanvas.getBoundingClientRect();
    spectrumCanvas.width = Math.max(400, Math.floor(sr1.width * scale));
    spectrumCanvas.height = Math.floor(140 * scale);

    const sr2 = spectrogramCanvas.getBoundingClientRect();
    spectrogramCanvas.width = Math.max(400, Math.floor(sr2.width * scale));
    spectrogramCanvas.height = Math.floor(140 * scale);

    redraw();
  });
  ro.observe(canvas);
  ro.observe(spectrumCanvas);
  ro.observe(spectrogramCanvas);

  // -------- Utils --------
  function formatSec(t) {
    if (t >= 60) {
      const m = Math.floor(t / 60);
      const s = (t - m * 60).toFixed(2).padStart(5, '0');
      return `${m}:${s}`;
    }
    return `${t.toFixed(2)}s`;
  }

})();

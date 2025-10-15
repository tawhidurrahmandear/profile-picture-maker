// Profile Picture Maker
// developed by Tawhidur Rahman Dear, https://www.tawhidurrahmandear.com
// Live Preview available at https://www.devilhunter.net/p/profile-picture-maker.html

   // --- Elements ---
  const fileInput = document.getElementById('fileInput');
  const previewCanvas = document.getElementById('previewCanvas');
  const pctx = previewCanvas.getContext('2d');
  const zoomEl = document.getElementById('zoom');
  const zoomVal = document.getElementById('zoomVal');
  const GenerateOutputs = document.getElementById('GenerateOutputs');
  const resetBtn = document.getElementById('resetBtn');

  const outSquare = document.getElementById('outSquare');
  const outCircle = document.getElementById('outCircle');
  const outRounded = document.getElementById('outRounded');

  const downloadSquare = document.getElementById('downloadSquare');
  const downloadCircle = document.getElementById('downloadCircle');
  const downloadRounded = document.getElementById('downloadRounded');

  // Image state
  let img = new Image();
  let imgLoaded = false;
  let imgScale = 1;
  let imgOffset = {x:0,y:0};
  let isDragging = false;
  let lastPos = {x:0,y:0};
  let originalFileName = 'image';

  const PREVIEW_SIZE = 800;
  previewCanvas.width = PREVIEW_SIZE;
  previewCanvas.height = PREVIEW_SIZE;

  function resetState() {
    if (!imgLoaded) return;
    // scale to cover preview
    const ratioW = PREVIEW_SIZE / img.width;
    const ratioH = PREVIEW_SIZE / img.height;
    imgScale = Math.max(ratioW, ratioH);
    imgOffset = {x: (PREVIEW_SIZE - img.width*imgScale)/2, y: (PREVIEW_SIZE - img.height*imgScale)/2};
    zoomEl.value = imgScale;
    zoomVal.textContent = Math.round(imgScale*100) + "%";
  }

  function drawPreview() {
    pctx.clearRect(0,0,PREVIEW_SIZE,PREVIEW_SIZE);

    if (!imgLoaded) {
      pctx.fillStyle = '#f0f0f0';
      pctx.fillRect(0,0,PREVIEW_SIZE,PREVIEW_SIZE);
      pctx.fillStyle = '#999';
      pctx.font = '18px sans-serif';
      pctx.fillText('No image selected', 20, 30);
      return;
    }

    const scaledW = img.width * imgScale;
    const scaledH = img.height * imgScale;

    // keep offsets (if not set, center)
    if (typeof imgOffset.x !== 'number' || typeof imgOffset.y !== 'number') {
      imgOffset = {x: (PREVIEW_SIZE - scaledW)/2, y: (PREVIEW_SIZE - scaledH)/2};
    }
    pctx.drawImage(img, imgOffset.x, imgOffset.y, scaledW, scaledH);

    // visual crop frame
    pctx.save();
    pctx.strokeStyle = 'rgba(0,0,0,0.25)';
    pctx.lineWidth = 2;
    pctx.setLineDash([6,6]);
    pctx.strokeRect(1,1,PREVIEW_SIZE-2,PREVIEW_SIZE-2);
    pctx.restore();
  }

  fileInput.addEventListener('change', (e)=>{
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    // derive filename without extension
    originalFileName = (f.name || 'image').replace(/\.[^/.]+$/, "");
    const url = URL.createObjectURL(f);
    img = new Image();
    img.onload = ()=>{
      imgLoaded = true;
      resetState();
      drawPreview();
      URL.revokeObjectURL(url);
    };
    img.onerror = ()=>{ alert('Could not load image.'); };
    img.src = url;
  });

  // Zoom handling
  zoomEl.addEventListener('input', ()=>{
    if (!imgLoaded) return;
    const prev = imgScale;
    imgScale = parseFloat(zoomEl.value);
    zoomVal.textContent = Math.round(imgScale*100) + "%";
    // scale relative to center
    const cx = PREVIEW_SIZE/2, cy = PREVIEW_SIZE/2;
    imgOffset.x = cx - ((cx - imgOffset.x) * (imgScale/prev));
    imgOffset.y = cy - ((cy - imgOffset.y) * (imgScale/prev));
    drawPreview();
  });

  // Mouse drag
  previewCanvas.addEventListener('mousedown', (e)=>{
    if (!imgLoaded) return;
    isDragging = true;
    lastPos = {x: e.clientX, y: e.clientY};
    previewCanvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e)=>{
    if (!isDragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    lastPos = {x: e.clientX, y: e.clientY};
    // account for CSS scaling of canvas
    imgOffset.x += dx * (previewCanvas.width / previewCanvas.getBoundingClientRect().width);
    imgOffset.y += dy * (previewCanvas.height / previewCanvas.getBoundingClientRect().height);
    drawPreview();
  });
  window.addEventListener('mouseup', ()=>{ isDragging=false; previewCanvas.style.cursor='default'; });

  // Touch support
  previewCanvas.addEventListener('touchstart', (ev)=>{ if (!imgLoaded) return; if (ev.touches.length===1){ isDragging=true; const t=ev.touches[0]; lastPos={x:t.clientX,y:t.clientY}; } }, {passive:false});
  previewCanvas.addEventListener('touchmove', (ev)=>{ if(!isDragging) return; ev.preventDefault(); const t=ev.touches[0]; const dx=t.clientX-lastPos.x; const dy=t.clientY-lastPos.y; lastPos={x:t.clientX,y:t.clientY}; imgOffset.x += dx * (previewCanvas.width / previewCanvas.getBoundingClientRect().width); imgOffset.y += dy * (previewCanvas.height / previewCanvas.getBoundingClientRect().height); drawPreview(); }, {passive:false});
  previewCanvas.addEventListener('touchend', ()=>{ isDragging=false; });

  resetBtn.addEventListener('click', ()=>{ if (!imgLoaded) return; resetState(); drawPreview(); });

  // Utility: create offscreen canvas containing the cropped 1:1 area at given size
  function createCroppedCanvas(size=512) {
    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const ctx = off.getContext('2d');
    ctx.clearRect(0,0,size,size);
    const ratio = size / PREVIEW_SIZE;
    ctx.drawImage(
      img,
      0,0, img.width, img.height,
      imgOffset.x * ratio,
      imgOffset.y * ratio,
      img.width * imgScale * ratio,
      img.height * imgScale * ratio
    );
    return off;
  }

  function roundedRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    const radius = Math.max(0, Math.min(r, Math.min(w,h)/2));
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function createAllOutputs() {
    if (!imgLoaded) { alert('Please select an image first.'); return; }
    const size = 512;
    const base = createCroppedCanvas(size);

    // Square
    const sctx = outSquare.getContext('2d');
    outSquare.width = size; outSquare.height = size;
    sctx.clearRect(0,0,size,size);
    sctx.drawImage(base,0,0);

    // Circle
    const cctx = outCircle.getContext('2d');
    outCircle.width = size; outCircle.height = size;
    cctx.clearRect(0,0,size,size);
    cctx.save();
    cctx.beginPath();
    cctx.arc(size/2,size/2,size/2,0,Math.PI*2);
    cctx.closePath();
    cctx.clip();
    cctx.drawImage(base,0,0);
    cctx.restore();

    // Rounded 10px
    const rctx = outRounded.getContext('2d');
    outRounded.width = size; outRounded.height = size;
    rctx.clearRect(0,0,size,size);
    rctx.save();
    roundedRectPath(rctx, 0, 0, size, size, 10);
    rctx.clip();
    rctx.drawImage(base,0,0);
    rctx.restore();

    // Wire up download buttons with filenames derived from original file name
    downloadSquare.onclick = ()=>downloadCanvas(outSquare, `${sanitizeFilename(originalFileName)}-square.png`);
    downloadCircle.onclick = ()=>downloadCanvas(outCircle, `${sanitizeFilename(originalFileName)}-circle.png`);
    downloadRounded.onclick = ()=>downloadCanvas(outRounded, `${sanitizeFilename(originalFileName)}-rounded.png`);
  }

  function sanitizeFilename(name) {
    return name.replace(/[\/\\?%*:|"<>]/g, '-');
  }

  function downloadCanvas(canvas, filename) {
    // Try to use anchor download; fallback to open in new tab if blocked
    try {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      // fallback: open in new tab so user can save manually
      const url = canvas.toDataURL('image/png');
      const w = window.open('about:blank', '_blank');
      if (w) {
        const imgEl = w.document.createElement('img');
        imgEl.src = url;
        imgEl.alt = filename;
        imgEl.style.maxWidth = '100%';
        w.document.title = filename;
        w.document.body.style.margin = '12px';
        w.document.body.appendChild(imgEl);
      } else {
        alert('Cannot download automatically; please allow popups or use a modern browser.');
      }
    }
  }

  GenerateOutputs.addEventListener('click', createAllOutputs);

  // initial draw
  drawPreview();
(async function () {
  const video = document.getElementById("video");
  const captureBtn = document.getElementById("captureBtn");
  const thumbs = document.getElementById("thumbs");
  const hiddenCanvas = document.getElementById("hiddenCanvas");
  const stripBtn = document.getElementById("stripBtn");
  const clearBtn = document.getElementById("clearBtn");

  // store dataURLs of captures
  const captures = [];

  // 1) Request camera
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1024 },
        height: { ideal: 768 },
        aspectRatio: 16 / 9,
      },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    console.error("Camera error:", err);
    alert(
      "Could not access camera. Make sure you are on HTTPS and gave permission."
    );
    return;
  }

  // 2) Capture single frame
  captureBtn.addEventListener("click", () => {
    // // size canvas to video size (preserve aspect)
    // const aspectW = 16;
    // const aspectH = 9;

    // const screenW = window.innerWidth;
    // const screenH = window.innerHeight;

    // let wi = screenW;
    // let he = (screenW / aspectW) * aspectH;

    // if (he > screenH) {
    //   he = screenH;
    //   wi = (screenH / aspectH) * aspectW;
    // }

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    const targetH = (vw / 16) * 9;
    const targetW = vw;
    const sy = (vh - targetH) / 2;

    hiddenCanvas.width = targetW;
    hiddenCanvas.height = targetH;
    const ctx = hiddenCanvas.getContext("2d");

    // optional: draw a simple overlay (white border)
    ctx.drawImage(video, 0, sy, targetW, targetH, 0, 0, targetW, targetH);
    ctx.lineWidth = 80;
    ctx.strokeStyle = "#F7F4EA";
    ctx.strokeRect(0, 0, targetW, targetH);

    // if (captures.length === 0) {
    //   ctx.strokeRect(0, -20, vw, vh);
    //   ctx.font = `56px Helvetica`;
    //   ctx.fillStyle = "white";
    //   ctx.fillText("prizzajeff", 10, vh - 10);
    // }

    if (captures.length >= 2) {
      stripBtn.style.display = "flex";
      clearBtn.style.display = "flex";
    }

    if (captures.length >= 3) {
      return;
    }

    // convert to data URL (PNG)
    const dataUrl = hiddenCanvas.toDataURL("image/png");
    captures.push(dataUrl);
    addThumbnail(dataUrl);
  });

  // create thumbnail + download link
  function addThumbnail(dataUrl) {
    const wrap = document.createElement("div");
    wrap.className = "thumb";

    const img = document.createElement("img");
    img.src = dataUrl;
    img.alt = "capture";

    const meta = document.createElement("div");
    meta.className = "meta";

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy to clipboard";
    copyBtn.addEventListener("click", async () => {
      try {
        const blob = dataURLToBlob(dataUrl);
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
        alert("Image copied to clipboard (may require secure context).");
      } catch (err) {
        alert("Copy failed: " + (err && err.message));
      }
    });

    wrap.appendChild(img);
    wrap.appendChild(meta);
    thumbs.prepend(wrap);
  }

  // helper: convert dataURL to Blob
  function dataURLToBlob(dataurl) {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8 = new Uint8Array(n);
    while (n--) {
      u8[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8], { type: mime });
  }

  // 3) Combine captures into a vertical strip and download as one image
  stripBtn.addEventListener("click", () => {
    if (captures.length !== 3) {
      alert("No captures yet.");
      return;
    }

    // create images and wait until all loaded
    const imgs = captures.reverse().map((src) => {
      const i = new Image();
      i.src = src;
      return i;
    });

    Promise.all(
      imgs.map(
        (img) =>
          new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          })
      )
    ).then(() => {
      // width = max width, height = sum heights
      const width = Math.max(...imgs.map((i) => i.width));
      const height = imgs.reduce((s, i) => s + i.height, 0);

      const stripCanvas = document.createElement("canvas");
      stripCanvas.width = width;
      stripCanvas.height = height;
      const ctx = stripCanvas.getContext("2d");

      // draw each image one under another
      let y = 0;
      imgs.forEach((img) => {
        // if widths differ, scale to fit width preserving aspect ratio
        if (img.width !== width) {
          const h = Math.round(img.height * (width / img.width));
          ctx.drawImage(img, 0, y, width, h);
          y += h;
        } else {
          ctx.drawImage(img, 0, y);
          y += img.height;
        }
      });

      stripCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `strip-${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }, "image/png");
    });
  });

  clearBtn.addEventListener("click", () => {
    captures.length = 0;
    thumbs.innerHTML = "";
    clearBtn.style.display = "none";
    stripBtn.style.display = "none";
  });
})();

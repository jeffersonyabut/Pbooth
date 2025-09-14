(async function () {
  const cameraSelect = document.getElementById("CamSelect");
  const video = document.getElementById("video");
  const captureBtn = document.getElementById("captureBtn");
  const thumbs = document.getElementById("thumbs");
  const hiddenCanvas = document.getElementById("hiddenCanvas");
  const stripBtn = document.getElementById("stripBtn");
  const clearBtn = document.getElementById("clearBtn");

  // store dataURLs of captures
  const captures = [];
  let currentStream;

  async function startStream(deviceId) {
    stopStream();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: deviceId },
      },
      audio: false,
    });
    currentStream = stream;
    video.srcObject = stream;
    invert(deviceId);
  }

  let invertImg = 0;

  function invert(deviceId) {
    const camera = cameras.find((c) => c.deviceId === deviceId);
    if (!camera) return;

    if (/front|user/i.test(camera.label)) {
      video.style.transform = "scaleX(-1)";
      invertImg = 1;
    }

    if (/back|rear|environment/i.test(camera.label)) {
      video.style.transform = "scaleX(1)";
      invertImg = 0;
    }
  }

  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");

    console.log(devices);

    cameraSelect.innerHTML = "";
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.text = camera.label || `Camera ${cameraSelect.length + 1}`;
      cameraSelect.appendChild(option);
    });

    if (cameras.length > 0) {
      startStream(cameras[0].deviceId);
    }

    cameraSelect.addEventListener("change", () => {
      startStream(cameraSelect.value);
    });
  } catch (err) {
    console.error("Error initializing cameras:", err);
    alert(
      "Could not access camera. Please check permissions or device settings."
    );
  }

  // await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

  // const devices = await navigator.mediaDevices.enumerateDevices();
  // const cameras = devices.filter((device) => device.kind === "videoinput");

  // console.log(devices);

  // cameraSelect.innerHTML = "";
  // cameras.forEach((camera) => {
  //   const option = document.createElement("option");
  //   option.value = camera.deviceId;
  //   option.text = camera.label || `Camera ${cameraSelect.length + 1}`;
  //   cameraSelect.appendChild(option);
  // });

  // if (cameras.length > 0) {
  //   startStream(cameras[0].deviceId);
  // }

  // cameraSelect.addEventListener("change", () => {
  //   startStream(cameraSelect.value);
  // });

  function stopStream() {
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
    }
  }

  // async function startStream(deviceId) {
  //   stopStream();
  //   const stream = await navigator.mediaDevices.getUserMedia({
  //     video: {
  //       deviceId: { exact: deviceId },
  //     },
  //     audio: false,
  //   });
  //   currentStream = stream;
  //   video.srcObject = stream;
  //   invert(deviceId);
  // }

  // let invertImg = 0;

  // function invert(deviceId) {
  //   const camera = cameras.find((c) => c.deviceId === deviceId);
  //   if (!camera) return;

  //   if (/front|user/i.test(camera.label)) {
  //     video.style.transform = "scaleX(-1)";
  //     invertImg = 1;
  //   }

  //   if (/back|rear|environment/i.test(camera.label)) {
  //     video.style.transform = "scaleX(1)";
  //     invertImg = 0;
  //   }
  // }

  // if (cameras.length > 0) {
  //   startStream(cameras[0].deviceId);
  // }

  // cameraSelect.addEventListener("change", () => {
  //   startStream(cameraSelect.value);
  // });

  // 2) Capture single frame
  async function captureFrame() {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    console.log(vw, vh);

    const targetH = (vw / 16) * 9;
    const targetW = vw;
    const sy = (vh - targetH) / 2;
    console.log(targetH, targetW, sy);
    hiddenCanvas.width = targetW;
    hiddenCanvas.height = targetH + 10;
    const ctx = hiddenCanvas.getContext("2d");

    // captured image manipulation

    ctx.save();
    console.log(invertImg);

    if (invertImg) {
      ctx.scale(-1, 1);
      ctx.drawImage(
        video,
        0,
        sy,
        targetW,
        targetH,
        -targetW,
        0,
        targetW,
        targetH
      );
      console.log("inverted photo");
    }

    ctx.drawImage(video, 0, sy, targetW, targetH, 0, 0, targetW, targetH);

    ctx.restore();
    // ctx.fillRect(0, 0, targetW, targetH - 50);
    // ctx.lineWidth = 60;
    // ctx.fillStyle = "#F7F4EA";
    // ctx.clearRect(0, targetH - 10, targetW, targetH);

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
  }

  captureBtn.addEventListener("click", () => {
    let seconds = document.getElementById("secSelect").value;
    document.getElementById("second").textContent = seconds;

    let timer = setInterval(() => {
      seconds--;
      document.getElementById("second").textContent = seconds;

      if (seconds <= 0) {
        clearInterval(timer);
        document.getElementById("second").textContent = 0;
        captureFrame();
      }
    }, 1000);
  });

  // preview images
  function addThumbnail(dataUrl) {
    const wrap = document.createElement("div");
    wrap.className = "thumb";

    const img = document.createElement("img");
    img.src = dataUrl;
    img.alt = "capture";

    const meta = document.createElement("div");
    meta.className = "meta";

    // const copyBtn = document.createElement("button");
    // copyBtn.textContent = "Copy to clipboard";
    // copyBtn.addEventListener("click", async () => {
    //   try {
    //     const blob = dataURLToBlob(dataUrl);
    //     await navigator.clipboard.write([
    //       new ClipboardItem({ [blob.type]: blob }),
    //     ]);
    //     alert("Image copied to clipboard (may require secure context).");
    //   } catch (err) {
    //     alert("Copy failed: " + (err && err.message));
    //   }
    // });

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
      const stripW = width + 60;
      const stripH = height + 250;

      console.log(stripW, stripH);
      const stripCanvas = document.createElement("canvas");
      stripCanvas.width = stripW;
      stripCanvas.height = stripH;
      const ctx = stripCanvas.getContext("2d");

      ctx.fillStyle = "#F7F4EA";
      ctx.fillRect(0, 0, stripW, stripH);
      // draw each image one under another

      const x = (stripW - width) / 2;
      let y = 0;
      imgs.forEach((img) => {
        // force to fit with aspect ratio
        if (img.width !== width) {
          const h = Math.round(img.height * (width / img.width));
          ctx.drawImage(img, x, y + 30, width, h);
          y += h;
        } else {
          ctx.drawImage(img, x, y + 30);
          y += img.height;
        }
      });

      stripCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `jeffsphotobooth.png`;
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

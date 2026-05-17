document.addEventListener("DOMContentLoaded", function () {
  const cake = document.querySelector(".cake");
  const candleCountDisplay = document.getElementById("candleCount");
  let candles = [];
  let audioContext;
  let analyser;
  let microphone;
  let blowInterval;
  let speechRecognition;
  let speechRecognitionActive = false;

  // Heart animation background - DIHAPUS untuk performa
  // const container = document.querySelector(".container");
  // for (let i = 1; i <= 100; i++) {
  //   const hearts = document.createElement("div");
  //   hearts.classList.add("heart");
  //   container.appendChild(hearts);
  // }

  // function animateHearts() {
  //   anime({
  //     targets: ".heart",
  //     translateX: function () {
  //       return anime.random(-700, 700);
  //     },
  //     translateY: function () {
  //       return anime.random(-500, 500);
  //     },
  //     rotate: 45,
  //     scale: function () {
  //       return anime.random(1, 5);
  //     },
  //     easing: "easeInOutBack",
  //     duration: 3000,
  //     delay: anime.stagger(10),
  //     complete: animateHearts,
  //   });
  // }
  // animateHearts();

  function updateCandleCount() {
    candleCountDisplay.textContent = candles.length;
  }

  function addCandle(left, top) {
    const candle = document.createElement("div");
    candle.className = "candle";
    candle.style.left = left + "px";
    candle.style.top = top + "px";

    const flame = document.createElement("div");
    flame.className = "flame";
    candle.appendChild(flame);

    cake.appendChild(candle);
    candles.push(candle);
    updateCandleCount();
  }

  cake.addEventListener("click", function (event) {
    const rect = cake.getBoundingClientRect();
    const left = event.clientX - rect.left;
    const top = event.clientY - rect.top;
    addCandle(left, top);
  });

  function isBlowing() {
    if (!analyser) return false;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    let average = sum / bufferLength;

    return average > 25; // Lebih sensitive dari 40 ke 25
  }

  function blowOutCandles() {
    if (isBlowing() && candles.length > 0) {
      candles.forEach((candle) => {
        if (!candle.classList.contains("out")) {
          candle.classList.add("out");
        }
      });
      updateCandleCount();

      // Confetti effect
      if (window.confetti) {
        confetti({
          particleCount: 40,
          spread: 60,
          colors: ["#FF69B4", "#FF1493", "#FFD700"],
        });
      }
    }
  }

  // Modal handling
  const modal = document.getElementById("cake-instructions");
  const startBtn = document.getElementById("cake-start-btn");
  const speechIndicator = document.getElementById("speech-indicator");

  function hideModal() {
    modal.setAttribute("aria-hidden", "true");
  }

  function updateSpeechIndicator(message, color = "#330026") {
    if (!speechIndicator) return;
    speechIndicator.textContent = message;
    speechIndicator.style.color = color;
  }

  startBtn.addEventListener("click", async () => {
    hideModal();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 256;
      blowInterval = setInterval(blowOutCandles, 100); // Lebih sering check dari 200ms ke 100ms

      // Start speech recognition after mic is granted
      startSpeechRecognition();
    } catch (err) {
      console.log("Unable to access microphone: " + err);
    }
  });

  function startSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognition = new SpeechRecognition();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = true;
      speechRecognition.lang = "id-ID";
      speechRecognition.maxAlternatives = 3;
      speechRecognitionActive = true;

      speechRecognition.onstart = function () {
        console.log(
          "Voice recognition started. Try speaking into the microphone.",
        );
        updateSpeechIndicator(
          "Mikrofon aktif. Silakan ucapkan 'sayang' sekarang.",
          "#1a1a1a",
        );
      };

      speechRecognition.onerror = function (event) {
        console.error("Speech recognition error detected: " + event.error);
        updateSpeechIndicator("Error microphone: " + event.error, "#ad031f");
      };

      speechRecognition.onresult = function (event) {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase();
          console.log("Kata yang diucapkan: " + transcript);

          // Lebih toleran di mobile: anggap kata "sayang" cukup untuk lanjut
          const hasSayang =
            /\bsayang\b/.test(transcript) ||
            transcript.includes("sayaang") ||
            transcript.includes("sayangg");
          const hasAya = /\b(aya|ayil|ayl|ay)\b/.test(transcript);

          if (
            hasSayang &&
            (hasAya || transcript.trim().split(/\s+/).length === 1)
          ) {
            console.log("Keyword detected! Navigating to Galaxy Love page...");
            speechRecognitionActive = false;
            try {
              speechRecognition.stop();
            } catch (e) {}
            window.location.href = "../Galaxy-love-main/index.html";
            break;
          }
        }
      };

      speechRecognition.onend = function () {
        if (speechRecognitionActive) {
          console.log("Speech recognition ended, restarting...");
          updateSpeechIndicator("Mencoba ulang deteksi suara...", "#6b2750");
          try {
            speechRecognition.start();
          } catch (e) {
            console.error("Unable to restart speech recognition:", e);
            updateSpeechIndicator("Tidak dapat restart microphone.", "#ad031f");
          }
        }
      };

      speechRecognition.start();
    } else {
      console.log("Speech Recognition Not Supported");
    }
  }

  // Show modal on first load
  setTimeout(() => {
    modal.setAttribute("aria-hidden", "false");
  }, 250);

  // Cleanup on unload
  window.addEventListener("beforeunload", () => {
    speechRecognitionActive = false;
    if (blowInterval) clearInterval(blowInterval);
    if (speechRecognition) {
      try {
        speechRecognition.stop();
      } catch (e) {}
    }
    if (microphone && microphone.disconnect) microphone.disconnect();
    if (audioContext) {
      try {
        audioContext.close();
      } catch (e) {}
    }
  });
});

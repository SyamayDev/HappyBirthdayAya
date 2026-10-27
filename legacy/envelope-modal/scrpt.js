$(document).ready(function () {
  // Envelope langsung muncul + confetti heboh kiri-kanan
  $(".envlope-wrapper").addClass("visible");

  var envelope = $("#envelope");
  var letter = $(".letter");
  var modal = $("#modal");

  // Klik envelope → buka flap
  envelope.click(function () {
    openEnvelope();
  });

  // Klik letter → buka modal (dengan delay biar smooth)
  letter.click(function () {
    setTimeout(function () {
      modal.addClass("show");
    }, 500);
  });

  // Tutup modal
  $("#close-modal").click(function () {
    modal.removeClass("show");
    closeEnvelope();
  });
  modal.click(function (e) {
    if (e.target === modal[0]) {
      modal.removeClass("show");
      closeEnvelope();
    }
  });

  function openEnvelope() {
    envelope.addClass("open").removeClass("close");
  }
  function closeEnvelope() {
    envelope.addClass("close").removeClass("open");
  }

  // === CONFETTI HEBOH SEPERTI CONTOH DI ATAS (lebih panjang + lebih banyak partikel) ===
  setTimeout(function () {
    const duration = 5500; // lebih lama biar lebih heboh
    const end = Date.now() + duration;
    const colors = ["#FF69B4", "#FF1493", "#FFD700", "#00FF00", "#FF0000", "#00FFFF", "#FF00FF"];

    // Burst awal di tengah biar langsung wow
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 }
    });

    (function frame() {
      confetti({
        particleCount: 12,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 12,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, 400);
});
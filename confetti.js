// Hand rolled confetti on a full screen canvas that only exists while pieces are falling.
const confetti = (() => {
  const COLORS = ["#ffb04a", "#ffe7a3", "#f5f6f8", "#a3a6ad", "#ff8a7a", "#8de6f6"];
  const GRAVITY = 0.32;
  const DRAG = 0.985;

  let canvas = null;
  let ctx = null;
  let pieces = [];

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function prefersCalm() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function mountCanvas() {
    canvas = document.createElement("canvas");
    canvas.className = "confetti";
    canvas.setAttribute("aria-hidden", "true");
    document.body.append(canvas);
    ctx = canvas.getContext("2d");
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);
  }

  function unmountCanvas() {
    window.removeEventListener("resize", sizeCanvas);
    canvas.remove();
    canvas = null;
    ctx = null;
  }

  function sizeCanvas() {
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * pixelRatio;
    canvas.height = window.innerHeight * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function createPiece(originX, originY, lean) {
    return {
      x: originX,
      y: originY,
      velocityX: randomBetween(-9, 9) + lean * 9,
      velocityY: randomBetween(-22, -8),
      width: randomBetween(7, 13),
      height: randomBetween(4, 8),
      angle: randomBetween(0, Math.PI * 2),
      angleSpeed: randomBetween(-0.3, 0.3),
      flip: randomBetween(0, Math.PI * 2),
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
  }

  function movePiece(piece) {
    piece.velocityX *= DRAG;
    piece.velocityY = piece.velocityY * DRAG + GRAVITY;
    piece.x += piece.velocityX;
    piece.y += piece.velocityY;
    piece.angle += piece.angleSpeed;
    piece.flip += 0.12;
  }

  function drawPiece(piece) {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.angle);

    // Squashing the height over time fakes a paper strip tumbling in 3D.
    ctx.scale(1, Math.cos(piece.flip));
    ctx.fillStyle = piece.color;
    ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
    ctx.restore();
  }

  function frame() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    pieces.forEach(movePiece);
    pieces = pieces.filter((piece) => piece.y < window.innerHeight + 40);
    pieces.forEach(drawPiece);

    if (pieces.length > 0) {
      requestAnimationFrame(frame);
    } else {
      unmountCanvas();
    }
  }

  // x and y are fractions of the viewport; lean pushes the spray left (-1) or right (1).
  function burst({ count = 120, x = 0.5, y = 0.45, lean = 0 } = {}) {
    if (prefersCalm()) {
      return;
    }

    const isIdle = !canvas;

    if (isIdle) {
      mountCanvas();
    }

    for (let index = 0; index < count; index++) {
      pieces.push(createPiece(window.innerWidth * x, window.innerHeight * y, lean));
    }

    if (isIdle) {
      requestAnimationFrame(frame);
    }
  }

  function jackpot() {
    burst({ count: 260 });
    setTimeout(() => burst({ count: 160, x: 0, y: 0.95, lean: 1 }), 350);
    setTimeout(() => burst({ count: 160, x: 1, y: 0.95, lean: -1 }), 700);
    setTimeout(() => burst({ count: 220, y: 0.2 }), 1200);
  }

  return { burst, jackpot };
})();

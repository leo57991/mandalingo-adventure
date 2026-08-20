export function resolveJoystickVector(clientX, clientY, rect) {
  const max = rect.width * 0.29;
  if (!Number.isFinite(max) || max <= 0) return { pixelX: 0, pixelY: 0, x: 0, y: 0 };

  let pixelX = clientX - rect.left - rect.width / 2;
  let pixelY = clientY - rect.top - rect.height / 2;
  const length = Math.hypot(pixelX, pixelY);
  if (length > max) {
    pixelX = pixelX / length * max;
    pixelY = pixelY / length * max;
  }

  return { pixelX, pixelY, x: pixelX / max, y: pixelY / max };
}

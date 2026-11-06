import * as THREE from 'three';

// Cache textures by key to avoid re-creating them
const textureCache = new Map<string, THREE.Texture>();

function makeProcedural(
  key: string,
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 256
): THREE.Texture {
  if (textureCache.has(key)) return textureCache.get(key)!;

  // Ensure canvas is created in DOM environment (or fallback in tests)
  if (typeof document === 'undefined') {
    const tex = new THREE.Texture();
    textureCache.set(key, tex);
    return tex;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawFn(ctx, size);
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      textureCache.set(key, tex);
      return tex;
    }
  } catch {
    // In headless test environments like jsdom where getContext is not implemented
  }

  const fallback = new THREE.Texture();
  textureCache.set(key, fallback);
  return fallback;
}

export function getCardboardTexture(): THREE.Texture {
  return makeProcedural('cardboard', (ctx, s) => {
    // Base neutral white for perfect color tinting
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, s, s);
    // Horizontal corrugation lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < s; y += 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(s, y);
      ctx.stroke();
    }
    // Subtle texture noise
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.08})`;
      ctx.fillRect(x, y, 2, 2);
    }
  });
}

export function getWoodTexture(): THREE.Texture {
  return makeProcedural('wood', (ctx, s) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, s, s);
    // Wood grain lines (curved)
    for (let i = 0; i < 30; i++) {
      const y = (i / 30) * s;
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.1 + Math.random() * 0.18})`;
      ctx.lineWidth = 0.8 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < s; x += 10) {
        ctx.lineTo(x, y + Math.sin(x * 0.08 + i) * 4);
      }
      ctx.stroke();
    }
  });
}

export function getAcrylicTexture(): THREE.Texture {
  return makeProcedural('acrylic', (ctx, s) => {
    // Gradient glass-like
    const grad = ctx.createLinearGradient(0, 0, s, s);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // Specular highlight band
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(s * 0.3, 0, s * 0.15, s);
  });
}

export function getSteelTexture(): THREE.Texture {
  return makeProcedural('steel', (ctx, s) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, s, s);
    // Brushed metal streaks
    for (let i = 0; i < 80; i++) {
      const y = Math.random() * s;
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.05 + Math.random() * 0.12})`;
      ctx.lineWidth = 0.5 + Math.random();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(s, y + Math.random() * 4 - 2);
      ctx.stroke();
    }
    // Specular scratches
    for (let i = 0; i < 30; i++) {
      const y = Math.random() * s;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(s, y);
      ctx.stroke();
    }
  });
}

export function get3DPrintTexture(): THREE.Texture {
  return makeProcedural('3dprint', (ctx, s) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, s, s);
    // FDM layer lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.lineWidth = 1;
    for (let y = 0; y < s; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(s, y);
      ctx.stroke();
    }
    // Fine stippling
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function getCustomTexture(color: string): THREE.Texture {
  return makeProcedural('custom-' + color, (ctx, s) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, s, s);
  });
}

"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Valid blur sizes supported by Tailwind CSS.
 */
export type BlurSize = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

/**
 * @typedef {Object} HellBackgroundProps
 * @property {BlurSize} [backdropBlurAmount] - The size of the backdrop blur to apply.
 * @property {string} [className] - Additional CSS classes to apply to the container div.
 */
interface HellBackgroundProps {
  backdropBlurAmount?: string;
  className?: string;
}

/**
 * A mapping from simplified blur size names to full Tailwind CSS backdrop-blur classes.
 */
const blurClassMap: Record<BlurSize, string> = {
  none: "backdrop-blur-none",
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
  "2xl": "backdrop-blur-2xl",
  "3xl": "backdrop-blur-3xl",
};

const vertexShaderSource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

const fragmentShaderSource = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 iResolution;
uniform float iTime;

float cosRange(float amt, float range, float minimum) {
  return (((1.0 + cos(radians(amt))) * 0.5) * range) + minimum;
}

void main() {
  const float brightness = 0.975;
  float time = iTime * 0.35;
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p  = (2.0 * gl_FragCoord.xy - iResolution.xy) / max(iResolution.x, iResolution.y);
  float ct = cosRange(time * 5.0, 3.0, 1.1);
  float xBoost = cosRange(time * 0.2, 5.0, 5.0);
  float yBoost = cosRange(time * 0.1, 10.0, 5.0);
  float fScale = cosRange(time * 15.5, 1.25, 0.5);

  for (int i = 1; i < 20; i++) {
    float _i = float(i);
    vec2 newp = p;
    newp.x += 0.25 / _i * sin(_i * p.y + time * cos(ct) * 0.5 / 20.0 + 0.005 * _i) * fScale + xBoost;
    newp.y += 0.25 / _i * sin(_i * p.x + time * ct * 0.3 / 40.0 + 0.03 * (_i + 15.0)) * fScale + yBoost;
    p = newp;
  }

  // --- Dynamic Brand Aesthetics Color Interpolation ---
  float w1 = 0.5 * sin(p.x * 2.0 + time * 0.3) + 0.5;
  float w2 = 0.5 * sin(p.y * 2.5 - time * 0.2) + 0.5;
  float w3 = 0.5 * cos((p.x + p.y) * 1.5 + time * 0.15) + 0.5;

  // Premium Palette Colors:
  vec3 brandOrange = vec3(1.0, 0.416, 0.0);    // #FF6A00 - Brand Orange
  vec3 softPeach   = vec3(0.941, 0.67, 0.407);  // #F0AB68 - Soft Peach Orange
  vec3 warmIvory   = vec3(0.898, 0.847, 0.788);  // #E5D8C9 - Warm Ivory
  vec3 indigoGlow  = vec3(0.247, 0.224, 0.796);  // #3F39CB - Fresh indigo contrast

  // Smooth, organic blending of colors
  vec3 col = mix(brandOrange, softPeach, w1);
  col = mix(col, indigoGlow, w2 * 0.65);
  col = mix(col, warmIvory, w3 * 0.25);

  col *= brightness;

  float vigAmt = 5.0;
  float vignette = (1. - vigAmt * (uv.y - 0.5) * (uv.y - 0.5)) * (1. - vigAmt * (uv.x - 0.5) * (uv.x - 0.5));
  float alpha = clamp(vignette, 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
}
`;

/** Minimum interval between frames (~30fps) */
const FRAME_INTERVAL_MS = 33;

function GradientBackground({
  backdropBlurAmount = "none",
  className = "",
}: HellBackgroundProps): React.ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafIdRef = useRef<number>(0);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Request WebGL context with low-power preference and no antialiasing
    const gl = canvas.getContext("webgl", {
      alpha: true,
      powerPreference: "low-power",
      antialias: false,
    });
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program linking error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");

    const startTime = Date.now();
    let lastFrameTime = 0;

    // Set transparent WebGL clear color buffer
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    const render = (timestamp: number) => {
      // Skip frame if not visible (IntersectionObserver sets this)
      if (!isVisibleRef.current) {
        rafIdRef.current = requestAnimationFrame(render);
        return;
      }

      // Throttle to ~30fps: skip if less than 33ms elapsed
      if (timestamp - lastFrameTime < FRAME_INTERVAL_MS) {
        rafIdRef.current = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = timestamp;

      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      gl.clear(gl.COLOR_BUFFER_BIT);

      const currentTime = (Date.now() - startTime) / 1000;
      gl.uniform2f(iResolutionLocation, width, height);
      gl.uniform1f(iTimeLocation, currentTime);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    // IntersectionObserver: pause rendering when canvas is not in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisibleRef.current = entry.isIntersecting;
        }
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    // Cleanup: cancel rAF, disconnect observer, delete all WebGL resources
    return () => {
      cancelAnimationFrame(rafIdRef.current);
      observer.disconnect();

      gl.useProgram(null);

      if (positionBuffer) {
        gl.deleteBuffer(positionBuffer);
      }
      if (program) {
        gl.detachShader(program, vertexShader);
        gl.detachShader(program, fragmentShader);
        gl.deleteProgram(program);
      }
      if (vertexShader) {
        gl.deleteShader(vertexShader);
      }
      if (fragmentShader) {
        gl.deleteShader(fragmentShader);
      }
    };
  }, []);

  const finalBlurClass = blurClassMap[backdropBlurAmount as BlurSize] || blurClassMap["sm"];

  return (
    <div className={`w-full max-w-full h-full overflow-hidden relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full max-w-full h-full overflow-hidden"
        style={{ display: "block" }}
      />
      <div className={`absolute inset-0 ${finalBlurClass}`} />
    </div>
  );
}

export default GradientBackground;


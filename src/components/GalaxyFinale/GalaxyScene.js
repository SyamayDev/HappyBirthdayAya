/*
 * The three.js "galaxy of memories" — loaded lazily, only after the final
 * surprise is unlocked. Rebuilt from the legacy Galaxy-love page in the new
 * palette, with the legacy bugs fixed: one time-based render loop, pooled
 * shooting stars, bounded textures, no per-frame allocations, full disposal,
 * pause when hidden/off-screen, and page scrolling left alone on phones
 * until the visitor chooses to explore.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const PALETTE = {
  core: new THREE.Color('#fff4cc'),
  inner: new THREE.Color('#9cc8ff'),
  outer: new THREE.Color('#7f8ae6'),
  ring: '#ffffff',
  ringGlow: '#9fc7ff',
  atmosphere: new THREE.Color('#9fc7ff'),
}

// Camera beats from the original intro, now in seconds and eased.
const INTRO_POINTS = [
  new THREE.Vector3(0, 20, 30),
  new THREE.Vector3(6, 3, 34),
  new THREE.Vector3(10, 10, 95),
  new THREE.Vector3(-14, 34, 118),
  new THREE.Vector3(-30, 24, 74),
]
const INTRO_SECONDS = 6.5
const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10)

function budget(width, height) {
  const small = Math.min(width, height) < 600
  const weak = (navigator.hardwareConcurrency ?? 8) <= 4
  return small || weak
    ? { galaxy: 8000, perPhoto: 45, stars: 2500, nebulae: 5 }
    : { galaxy: 20000, perPhoto: 95, stars: 6500, nebulae: 7 }
}

/* ── Geometry builders ─────────────────────────────────────── */

function spiralPoint(radius, branch, branches, spin, randomness, ySpread, target) {
  const branchAngle = (branch / branches) * Math.PI * 2
  const spinAngle = radius * spin * 0.05
  const jitter = () => Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * randomness * radius
  target.set(
    Math.cos(branchAngle + spinAngle) * radius + jitter(),
    jitter() * ySpread,
    Math.sin(branchAngle + spinAngle) * radius + jitter(),
  )
  return target
}

function softPointMaterial({ size, opacity = 1 }) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { uSize: { value: size }, uPixelRatio: { value: 1 }, uOpacity: { value: opacity } },
    vertexShader: /* glsl */ `
      uniform float uSize;
      uniform float uPixelRatio;
      attribute float aScale;
      varying vec3 vColor;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * aScale * uPixelRatio * (60.0 / -mv.z);
        vColor = color;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float strength = pow(1.0 - smoothstep(0.0, 0.5, d), 2.2);
        gl_FragColor = vec4(vColor, strength * uOpacity);
      }
    `,
  })
}

function createGalaxy(count) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  const point = new THREE.Vector3()
  const color = new THREE.Color()
  const innerRadius = 13
  const outerRadius = 100
  for (let i = 0; i < count; i += 1) {
    const t = Math.pow(Math.random(), 1.6)
    const radius = innerRadius + t * (outerRadius - innerRadius)
    spiralPoint(radius, i % 6, 6, 0.5, 0.2, 1.2, point)
    positions.set([point.x, point.y, point.z], i * 3)
    const mix = (radius - innerRadius) / (outerRadius - innerRadius)
    color.copy(PALETTE.core).lerp(mix < 0.35 ? PALETTE.inner : PALETTE.outer, mix < 0.35 ? mix / 0.35 : (mix - 0.35) / 0.65)
    color.multiplyScalar(0.75 + Math.random() * 0.25)
    colors.set([color.r, color.g, color.b], i * 3)
    scales[i] = 0.4 + Math.random() * 0.9
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
  return new THREE.Points(geometry, softPointMaterial({ size: 7 }))
}

function createStarfield(count) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  const color = new THREE.Color()
  for (let i = 0; i < count; i += 1) {
    const radius = 280 + Math.random() * 520
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions.set([radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)], i * 3)
    color.setHSL(0.58 + Math.random() * 0.1, 0.6, 0.8 + Math.random() * 0.2)
    colors.set([color.r, color.g, color.b], i * 3)
    scales[i] = 0.5 + Math.random() * 1.2
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
  return new THREE.Points(geometry, softPointMaterial({ size: 9, opacity: 0.9 }))
}

function createPlanet() {
  const group = new THREE.Group()
  const planetMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uA: { value: new THREE.Color('#2f6cc8') },
      uB: { value: new THREE.Color('#8fc4fb') },
      uC: { value: new THREE.Color('#c5cbff') },
      uD: { value: new THREE.Color('#ffffff') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uD;
      varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
      void main() {
        vec2 p = vUv * vec2(6.0, 3.0);
        float t = uTime * 0.25;
        float swirl = sin(p.x + sin(p.y * 2.0 + t) * 1.6 + t) * 0.5 + 0.5;
        float bands = sin(p.y * 5.0 + swirl * 2.5 - t * 0.6) * 0.5 + 0.5;
        vec3 color = mix(uA, uB, swirl);
        color = mix(color, uC, bands * 0.45);
        float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.5);
        color = mix(color, uD, rim * 0.8);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  })
  const planet = new THREE.Mesh(new THREE.SphereGeometry(10, 64, 64), planetMaterial)
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(11.6, 48, 48),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: PALETTE.atmosphere } },
      vertexShader: /* glsl */ `
        varying float vIntensity;
        void main() {
          vec3 n = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vIntensity = pow(0.75 - dot(n, normalize(-mv.xyz)), 3.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vIntensity;
        void main() { gl_FragColor = vec4(uColor, clamp(vIntensity, 0.0, 1.0)); }
      `,
    }),
  )
  group.add(planet, atmosphere)
  return { group, planetMaterial }
}

function textTexture(text, fontFamily) {
  const height = 128
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const font = `italic 600 78px ${fontFamily}`
  context.font = font
  const segment = `${text}   ✦   `
  const width = Math.min(2048, Math.ceil(context.measureText(segment).width))
  canvas.width = width
  canvas.height = height
  context.font = font
  context.textBaseline = 'middle'
  context.fillStyle = PALETTE.ring
  context.shadowColor = PALETTE.ringGlow
  context.shadowBlur = 16
  context.lineWidth = 3
  context.strokeStyle = 'rgba(159, 199, 255, 0.55)'
  context.strokeText(segment, 0, height / 2 + 4)
  context.fillText(segment, 0, height / 2 + 4)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.anisotropy = 4
  return { texture, aspect: width / height }
}

function createRings(texts, fontFamily) {
  const group = new THREE.Group()
  const rings = texts.map((text, index) => {
    const radius = 16 + index * 5.8
    const height = 3.6
    const { texture, aspect } = textTexture(text, fontFamily)
    const circumference = 2 * Math.PI * radius
    texture.repeat.set(Math.max(1, Math.round(circumference / height / aspect)), 1)
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 160, 1, true)
    const front = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.FrontSide, depthWrite: false }))
    const back = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.BackSide, depthWrite: false, opacity: 0.28 }))
    const ring = new THREE.Group()
    ring.add(back, front)
    ring.rotation.x = 0.12 + index * 0.1
    ring.rotation.z = (index % 2 === 0 ? 1 : -1) * (Math.PI / 6) * 0.45
    ring.userData.speed = (index % 2 === 0 ? 1 : -1) * (0.12 + index * 0.025)
    group.add(ring)
    return ring
  })
  return { group, rings }
}

function photoTexture(image, focus) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  const radius = 26
  const border = 12
  context.beginPath()
  context.roundRect(0, 0, size, size, radius)
  context.fillStyle = '#fdfdff'
  context.fill()
  const inner = size - border * 2
  const [fx, fy] = (focus ?? '50% 50%').split(' ').map((value) => parseFloat(value) / 100)
  const scale = Math.max(inner / image.width, inner / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  context.save()
  context.beginPath()
  context.roundRect(border, border, inner, inner, radius - border / 2)
  context.clip()
  context.drawImage(image, border - (drawWidth - inner) * fx, border - (drawHeight - inner) * fy, drawWidth, drawHeight)
  context.restore()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createPhotoCluster(texture, count) {
  const positions = new Float32Array(count * 3)
  const point = new THREE.Vector3()
  for (let i = 0; i < count; i += 1) {
    const radius = 32 + Math.pow(Math.random(), 0.8) * 66
    spiralPoint(radius, i % 6, 6, 0.5, 0.2, 0.5, point)
    positions.set([point.x, point.y, point.z], i * 3)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({ size: 3, map: texture, transparent: true, alphaTest: 0.1, depthWrite: false, sizeAttenuation: true })
  return new THREE.Points(geometry, material)
}

function nebulaTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.35)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createShootingStars(pool) {
  const group = new THREE.Group()
  const stars = Array.from({ length: pool }, () => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array([1, 1, 1, 1, 0.62, 0.78, 1, 0]), 4))
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
    line.visible = false
    line.userData = { active: false, progress: 0, duration: 1, from: new THREE.Vector3(), to: new THREE.Vector3(), wait: 2 + Math.random() * 6 }
    group.add(line)
    return line
  })
  return { group, stars }
}

/* ── Public API ─────────────────────────────────────────────── */

/**
 * @param {HTMLElement} container element that receives the canvas
 * @param {{ photos: Array<{thumb: string, focus?: string}>, rings: string[], fontFamily: string,
 *           onIntroEnd?: () => void, onContextLost?: () => void }} options
 */
export function createGalaxyScene(container, { photos, rings, fontFamily, onIntroEnd, onContextLost }) {
  const canvas = document.createElement('canvas')
  canvas.className = 'galaxy-canvas'
  canvas.style.touchAction = 'pan-y'
  container.appendChild(canvas)

  const width = container.clientWidth || 800
  const height = container.clientHeight || 600
  const limits = budget(width, height)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.setSize(width, height, false)
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000)
  camera.position.copy(INTRO_POINTS[0])
  camera.lookAt(0, 0, 0)

  const disposables = new Set()
  const track = (...items) => items.forEach((item) => disposables.add(item))

  const galaxy = createGalaxy(limits.galaxy)
  const starfield = createStarfield(limits.stars)
  const { group: planetGroup, planetMaterial } = createPlanet()
  scene.add(galaxy, starfield, planetGroup)

  const glowTexture = nebulaTexture()
  track(glowTexture)
  const nebulaColors = ['#7fb2f2', '#8f98ee', '#a9d0fb', '#6f86e0', '#b9c6ff', '#86c5f0', '#9aa6f4']
  for (let i = 0; i < limits.nebulae; i += 1) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: nebulaColors[i % nebulaColors.length], transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }))
    const angle = (i / limits.nebulae) * Math.PI * 2
    sprite.position.set(Math.cos(angle) * (40 + i * 9), (Math.random() - 0.5) * 18, Math.sin(angle) * (40 + i * 9))
    sprite.scale.setScalar(70 + Math.random() * 60)
    scene.add(sprite)
  }
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: '#fff1c8', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }))
  core.scale.setScalar(46)
  scene.add(core)

  const shooting = createShootingStars(3)
  scene.add(shooting.group)

  let ringState = null
  let disposed = false

  // Rings need the web font; photos need decoded images. Both arrive later.
  document.fonts?.load(`italic 600 78px ${fontFamily}`).catch(() => {}).finally(() => {
    if (disposed) return
    ringState = createRings(rings, fontFamily)
    scene.add(ringState.group)
  })

  photos.forEach((photo) => {
    const image = new Image()
    image.decoding = 'async'
    image.src = photo.thumb
    image
      .decode()
      .then(() => {
        if (disposed) return
        const texture = photoTexture(image, photo.focus)
        track(texture)
        scene.add(createPhotoCluster(texture, limits.perPhoto))
      })
      .catch(() => {
        if (import.meta.env.DEV) console.warn(`[GalaxyScene] photo skipped: ${photo.thumb}`)
      })
  })

  const controls = new OrbitControls(camera, canvas)
  canvas.style.touchAction = 'pan-y' // OrbitControls sets 'none'; keep page scrolling until "explore"
  controls.enabled = false
  controls.enableDamping = true
  controls.enablePan = false
  controls.rotateSpeed = 0.35
  controls.zoomSpeed = 0.5
  controls.minDistance = 15
  controls.maxDistance = 300
  controls.autoRotate = false
  controls.autoRotateSpeed = 0.5

  const introCurve = new THREE.CatmullRomCurve3(INTRO_POINTS)
  let introTime = 0
  let introDone = false
  let elapsed = 0
  let last = performance.now()
  let running = false
  let pageVisible = !document.hidden
  let onScreen = true

  function finishIntro() {
    if (introDone) return
    introDone = true
    camera.position.copy(INTRO_POINTS[INTRO_POINTS.length - 1])
    camera.lookAt(0, 0, 0)
    controls.target.set(0, 0, 0)
    controls.autoRotate = true
    controls.update()
    onIntroEnd?.()
  }

  const scratch = new THREE.Vector3()

  function updateShootingStars(dt) {
    for (const line of shooting.stars) {
      const data = line.userData
      if (!data.active) {
        data.wait -= dt
        if (data.wait <= 0) {
          data.active = true
          data.progress = 0
          data.duration = 1.1 + Math.random() * 0.8
          const y = 40 + Math.random() * 120
          data.from.set(-260 + Math.random() * 80, y, -200 + Math.random() * 400)
          data.to.set(data.from.x + 220 + Math.random() * 120, y - 60 - Math.random() * 60, data.from.z + (Math.random() - 0.5) * 80)
          line.visible = true
        }
        continue
      }
      data.progress += dt / data.duration
      if (data.progress >= 1) {
        data.active = false
        data.wait = 3 + Math.random() * 7
        line.visible = false
        continue
      }
      const head = data.progress
      const tail = Math.max(0, head - 0.18)
      const position = line.geometry.attributes.position
      scratch.lerpVectors(data.from, data.to, head)
      position.setXYZ(0, scratch.x, scratch.y, scratch.z)
      scratch.lerpVectors(data.from, data.to, tail)
      position.setXYZ(1, scratch.x, scratch.y, scratch.z)
      position.needsUpdate = true
      line.material.opacity = Math.sin(head * Math.PI)
    }
  }

  function frame(now) {
    // rAF timestamps can precede the performance.now() taken when the loop
    // (re)started, so clamp to a sane, non-negative step.
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
    last = Math.max(last, now)
    elapsed += dt

    if (!introDone) {
      introTime += dt
      const t = Math.min(1, Math.max(0, introTime / INTRO_SECONDS))
      introCurve.getPointAt(smootherstep(t), camera.position)
      camera.lookAt(0, 0, 0)
      if (t >= 1) finishIntro()
    } else {
      controls.update(dt)
    }

    planetMaterial.uniforms.uTime.value = elapsed
    planetGroup.rotation.y += dt * 0.08
    galaxy.rotation.y += dt * 0.012
    if (ringState) ringState.rings.forEach((ring) => (ring.rotation.y += ring.userData.speed * dt))
    updateShootingStars(dt)
    renderer.render(scene, camera)
  }

  function syncLoop() {
    const shouldRun = !disposed && pageVisible && onScreen
    if (shouldRun === running) return
    running = shouldRun
    if (running) last = performance.now()
    renderer.setAnimationLoop(running ? frame : null)
  }

  function resize() {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = camera.aspect < 0.8 ? 75 : 60
    camera.updateProjectionMatrix()
    const ratio = renderer.getPixelRatio()
    scene.traverse((object) => {
      if (object.material?.uniforms?.uPixelRatio) object.material.uniforms.uPixelRatio.value = ratio
    })
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)
  const intersection = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    syncLoop()
  })
  intersection.observe(container)
  const onVisibility = () => {
    pageVisible = !document.hidden
    syncLoop()
  }
  document.addEventListener('visibilitychange', onVisibility)
  const onLost = (event) => {
    event.preventDefault()
    onContextLost?.()
  }
  canvas.addEventListener('webglcontextlost', onLost)

  resize()
  syncLoop()

  return {
    skipIntro: finishIntro,
    setInteractive(value) {
      controls.enabled = value
      canvas.style.touchAction = value ? 'none' : 'pan-y'
      if (value) finishIntro()
    },
    dispose() {
      disposed = true
      renderer.setAnimationLoop(null)
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onLost)
      controls.dispose()
      scene.traverse((object) => {
        object.geometry?.dispose()
        const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : []
        materials.forEach((material) => {
          material.map?.dispose()
          material.dispose()
        })
      })
      disposables.forEach((item) => item.dispose?.())
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}

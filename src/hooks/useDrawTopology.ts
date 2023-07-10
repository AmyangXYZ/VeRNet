import { watch } from 'vue'
import { Network, SelectedNode, SignalEditTopology, SignalResetCamera } from './useStates'
import { ADDR, PKT_TYPES } from '@/networks/TSCH/typedefs'

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'
import * as TWEEN from '@tweenjs/tween.js'

export function useDrawTopology(dom: HTMLElement) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  const controls = new OrbitControls(camera, renderer.domElement)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.setPixelRatio(window.devicePixelRatio)

  dom.appendChild(renderer.domElement)
  const objectsToDrag: any = []

  const setCamera = () => {
    camera.position.x = 0
    camera.position.y = 88
    camera.position.z = 72
    camera.lookAt(new THREE.Vector3(0, 0, 0))
  }
  const addLights = () => {
    const ambientLight = new THREE.AmbientLight(0x404040, 30)
    scene.add(ambientLight)

    const spotLight = new THREE.SpotLight(0xffffff, 30, 320, Math.PI / 4, 0.1) // adjust angle and penumbra as needed
    spotLight.position.set(80, 140, 100)
    spotLight.shadow.mapSize.width = 4096
    spotLight.shadow.mapSize.height = 4096
    spotLight.castShadow = true
    scene.add(spotLight)
  }

  const drawGround = () => {
    const geometry = new THREE.PlaneGeometry(
      Network.TopoConfig.value.grid_size + 50,
      Network.TopoConfig.value.grid_size + 50,
      64,
      64
    )
    const textureLoader = new THREE.TextureLoader()
    const texture = textureLoader.load('/texture.jpeg', function (texture) {
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy() // Anisotropic filtering
    })
    const material = new THREE.MeshLambertMaterial({
      map: texture,
      color: '#423655',
      side: THREE.DoubleSide
    })
    const plane = new THREE.Mesh(geometry, material)
    plane.receiveShadow = true
    plane.rotation.x = -Math.PI / 2
    plane.userData.name = 'ground'
    scene.add(plane)
  }

  let drawnNodes: any = []
  const drawTSCHNodes = () => {
    // GLTF Loader
    const loader = new GLTFLoader()
    loader.load(
      'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf',
      function (gltf: any) {
        const model = gltf.scene
        model.scale.set(0.2, 0.2, 0.2)

        // Compute the bounding box of the model
        const box = new THREE.Box3().setFromObject(model)
        model.position.y = -box.min.y
        model.traverse(function (object: any) {
          if (object.isMesh) {
            object.castShadow = true // enable shadow casting
            object.receiveShadow = true
            object.material.color = new THREE.Color('#aaa')
          }
        })
        // scene.add(model)

        for (const node of Network.Nodes.value) {
          if (node.id == 0) continue
          const clonedModel = model.clone()
          clonedModel.node_id = node.id
          clonedModel.traverse(function (object: any) {
            if (object.isMesh) {
              object.userData.node_id = node.id
            }
          })
          clonedModel.position.x = node.pos[0]
          clonedModel.position.z = node.pos[1]
          scene.add(clonedModel)
          drawnNodes.push(clonedModel)
          // objectsToDrag.push(clonedModel)
        }
      }
    )
  }
  const clearTSCHNodes = () => {
    for (const model of drawnNodes) {
      scene.remove(model)
    }
    drawnNodes = []
  }

  // Set up drag controls
  const dragControls = new DragControls(objectsToDrag, camera, renderer.domElement)

  dragControls.addEventListener('dragstart', function () {
    // Cancel orbit controls when dragging
    controls.enabled = false
  })

  dragControls.addEventListener('dragend', function () {
    // Re-enable orbit controls when dragging stops
    controls.enabled = true
  })

  const drawnLinks: any = {}
  const drawLinks = () => {
    for (const n of Network.Nodes.value) {
      for (const nn of n.neighbors) {
        const linkName = n.id < nn ? `${n.id}-${nn}` : `${nn}-${n.id}`
        if (drawnLinks[linkName] == undefined) {
          drawnLinks[linkName] = true
          drawLink(n.id, nn)
        }
      }
    }
  }

  const drawLink = (src: number, dst: number) => {
    const p1 = new THREE.Vector3(
      Network.Nodes.value[src].pos[0],
      5,
      Network.Nodes.value[src].pos[1]
    )
    const p3 = new THREE.Vector3(
      Network.Nodes.value[dst].pos[0],
      5,
      Network.Nodes.value[dst].pos[1]
    )

    const x2 = (p1.x + p3.x) / 2
    const z2 = (p1.z + p3.z) / 2
    const h = 9
    const p2 = new THREE.Vector3(x2, h, z2)

    const curve = new THREE.QuadraticBezierCurve3(p1, p2, p3)
    const points = curve.getPoints(64)
    const link = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 'white' })
    )
    scene.add(link)
  }

  let PacketObjectsUnicast: any = []
  let PacketObjectsBeacon: any = []
  const drawPackets = () => {
    time = 0
    for (const pkt of Network.PacketsCurrent.value) {
      if (pkt.type != PKT_TYPES.ACK && pkt.dst != ADDR.BROADCAST) {
        // for trail
        const geometry = new THREE.BufferGeometry()
        const material = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color(0xffffff) }
          },
          vertexShader: `
            attribute float size;
            varying vec3 vColor;
            void main() {
              vColor = color;
              vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
              gl_PointSize = size * ( 300.0 / -mvPosition.z );
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            uniform vec3 color;
            uniform sampler2D pointTexture;
            varying vec3 vColor;
            void main() {
              gl_FragColor = vec4( color * vColor, 1.0 );
              gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
            }
          `,
          blending: THREE.AdditiveBlending,
          depthTest: false,
          transparent: true,
          vertexColors: true
        })

        const mesh = new THREE.Points(geometry, material)
        scene.add(mesh)

        const p1 = new THREE.Vector3(
          Network.Nodes.value[pkt.src].pos[0],
          5,
          Network.Nodes.value[pkt.src].pos[1]
        )
        const p3 = new THREE.Vector3(
          Network.Nodes.value[pkt.dst].pos[0],
          5,
          Network.Nodes.value[pkt.dst].pos[1]
        )
        const x2 = (p1.x + p3.x) / 2
        const z2 = (p1.z + p3.z) / 2
        const h = 9
        const p2 = new THREE.Vector3(x2, h, z2)
        const curve = new THREE.QuadraticBezierCurve3(p1, p2, p3)

        const positions: any = []
        PacketObjectsUnicast.push({ mesh, curve, positions })
      } else if (pkt.type == PKT_TYPES.BEACON) {
        const geometry = new THREE.TorusGeometry(Network.TopoConfig.value.tx_range, 0.1, 16, 64)
        const material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.rotation.x = Math.PI / 2
        mesh.position.set(
          Network.Nodes.value[pkt.src].pos[0],
          5,
          Network.Nodes.value[pkt.src].pos[1]
        )
        scene.add(mesh)

        PacketObjectsBeacon.push({ mesh })
      }
    }
  }
  const clearPackets = () => {
    if (PacketObjectsUnicast.length > 0) {
      for (const u of PacketObjectsUnicast) {
        scene.remove(u.mesh)
        u.mesh.geometry.dispose()
        u.mesh.material.dispose()
      }
      PacketObjectsUnicast = []
    }
    if (PacketObjectsBeacon.length > 0) {
      for (const b of PacketObjectsBeacon) {
        scene.remove(b.mesh)
        b.mesh.geometry.dispose()
        b.mesh.material.dispose()
      }
      PacketObjectsBeacon = []
    }
  }

  const animateCameraPosition = (targetPosition: any, duration: any) => {
    const position = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    new TWEEN.Tween(position)
      .to(targetPosition, duration)
      .onUpdate(() => {
        camera.position.set(position.x, position.y, position.z)
        camera.lookAt(new THREE.Vector3(0, 0, 0))
      })
      .easing(TWEEN.Easing.Quadratic.Out)
      .start()
  }

  const animatePanPosition = (targetPosition: any, duration: any) => {
    const position = { x: controls.target.x, y: controls.target.y, z: controls.target.z }
    new TWEEN.Tween(position)
      .to(targetPosition, duration)
      .onUpdate(() => {
        controls.target.set(position.x, position.y, position.z)
      })
      .easing(TWEEN.Easing.Quadratic.Out)
      .start()
  }

  function easeInOutSine(t: number) {
    return -(Math.cos(Math.PI * t) - 1) / 2
  }

  const clock = new THREE.Clock()
  let time = 0
  const speed = 1000 / Network.SlotDuration.value // Speed of the packet movement, adjust as needed
  const animate = () => {
    const delta = clock.getDelta()
    time += speed * delta
    time = time >= 1 ? 0 : time

    for (const u of PacketObjectsUnicast) {
      if (time == 0) {
        u.positions = []
      }
      const point = u.curve.getPoint(time)

      // make it dense
      if (u.positions.length > 0) {
        const lastPosition = u.positions[0]
        for (let t = 0.1; t < 1; t += 0.1) {
          const interpolatedPosition = new THREE.Vector3().lerpVectors(lastPosition, point, t)
          u.positions.unshift(interpolatedPosition)
        }
      }
      u.positions.unshift(point)

      while (u.positions.length > 40) {
        u.positions.pop()
      }
      u.mesh.geometry.setFromPoints(u.positions)

      const sizes = []
      for (let i = 0; i < u.positions.length; i++) {
        sizes[i] = (1 - i / u.positions.length) * 1.5
      }
      u.mesh.geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
    }
    const scale = easeInOutSine(time)
    for (const b of PacketObjectsBeacon) {
      b.mesh.scale.set(scale, scale, scale)
      b.mesh.position.y = 5 * time + 4
    }

    requestAnimationFrame(animate)
    TWEEN.update()
    controls.update()
    renderer.render(scene, camera)
  }

  setCamera()
  addLights()
  drawGround()
  drawTSCHNodes()
  animate()

  watch(Network.SlotDone, () => {
    if (Network.SlotDone.value) {
      drawLinks()
      drawPackets()
    } else {
      clearPackets()
    }
  })
  watch(Network.SignalReset, () => {
    clearTSCHNodes()
    drawTSCHNodes()
  })
  watch(SignalResetCamera, () => {
    animateCameraPosition({ x: 0, y: 88, z: 72 }, 800)
    animatePanPosition({ x: 0, y: 0, z: 0 }, 800)
  })
  watch(SignalEditTopology, () => {})

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  window.addEventListener(
    'click',
    (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObjects(scene.children, true)

      if (intersects.length > 0) {
        if (intersects[0].object.userData.node_id != undefined)
          SelectedNode.value = intersects[0].object.userData.node_id
      }
    },
    false
  )
}

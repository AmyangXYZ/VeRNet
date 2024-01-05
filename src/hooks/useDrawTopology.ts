import { nextTick, watch } from 'vue'
import {
  Logs,
  Network,
  SelectedNode,
  SignalEditTopology,
  SignalResetCamera,
  SignalUpdateTopology
} from './useStates'

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'
import Stats from 'three/examples/jsm/libs/stats.module'
import * as TWEEN from '@tweenjs/tween.js'
import { type Node, NODE_TYPE, ADDR, type Packet, type Link, LINK_TYPE } from '@/core/typedefs'

export function useDrawTopology(dom: HTMLElement) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.layers.enableAll()
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  const controls = new OrbitControls(camera, renderer.domElement)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.setPixelRatio(window.devicePixelRatio)
  dom.appendChild(renderer.domElement)
  const objectsToDrag: any = []

  const stats = new Stats()
  stats.dom.style.position = 'fixed'
  stats.dom.style.right = '16px'
  stats.dom.style.top = '16px'
  stats.dom.style.left = ''
  document.body.appendChild(stats.dom)

  const setCamera = () => {
    camera.position.x = 0
    camera.position.y = 70
    camera.position.z = 80
    camera.lookAt(new THREE.Vector3(0, 0, 0))
  }
  const addLights = () => {
    const ambientLight = new THREE.AmbientLight(0x404040, 25)
    scene.add(ambientLight)

    const spotLight = new THREE.SpotLight(0xffffff, 40, 320, Math.PI / 4, 0.1) // adjust angle and penumbra as needed
    spotLight.position.set(80, 140, 100)
    spotLight.shadow.mapSize.width = 4096
    spotLight.shadow.mapSize.height = 4096
    spotLight.castShadow = true
    scene.add(spotLight)
  }

  const drawGround = () => {
    const geometry = new THREE.PlaneGeometry(
      Network.Config.value.grid_size + 50,
      Network.Config.value.grid_size + 50,
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
      color: '#423655'
    })
    const plane = new THREE.Mesh(geometry, material)
    plane.receiveShadow = true
    plane.rotation.x = -Math.PI / 2
    plane.userData.name = 'ground'
    scene.add(plane)
  }

  const LABEL_LAYER = new THREE.Layers()
  LABEL_LAYER.set(1)
  const createLabel = (value: string): THREE.Sprite => {
    const canvas = document.createElement('canvas')
    const padding = 10
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Unable to get 2D context')
    }

    context.font = '144px Arial'

    // Measure text and resize canvas
    const metrics = context.measureText(value)
    canvas.width = metrics.width + padding * 2
    canvas.height = 144 + padding * 2

    // Redefine font after resizing canvas
    context.font = '144px Arial'
    context.textBaseline = 'top'
    context.fillStyle = '#bbb'

    // Write text on the canvas with padding
    context.fillText(value, padding, padding)

    const texture = new THREE.CanvasTexture(canvas)
    texture.generateMipmaps = false
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false, // add this line
      transparent: true
    })
    const sprite = new THREE.Sprite(spriteMaterial)

    // Scale down sprite to match your scene
    sprite.layers.set(1)
    sprite.scale.set(canvas.width / 108, canvas.height / 108, 1)
    return sprite
  }

  const loadingManager = new THREE.LoadingManager()
  loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
    // console.log(
    //   'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.'
    // )
    Logs.value.unshift('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.')
  }

  loadingManager.onLoad = function () {
    // console.log('Loading complete!')
    Logs.value.unshift('Loading complete!')
  }

  loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    // console.log(
    //   'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.'
    // )
    // Logs.value.unshift( 'Loading file: '  + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.')
  }

  const modelTemplates: { [type: number]: any } = {}
  const loadGLTFModels = async () => {
    const loader = new GLTFLoader(loadingManager)
    const loadModel = async (
      type: number,
      modelPath: string,
      scale: [number, number, number],
      rotationY: number
    ) => {
      const gltf: any = await new Promise((resolve) => {
        loader.load(modelPath, (gltf: any) => resolve(gltf))
      })

      const modelTemplate = gltf.scene
      modelTemplate.scale.set(...scale)
      modelTemplate.rotation.y = rotationY
      modelTemplate.traverse((object: any) => {
        if (object.isMesh) {
          object.castShadow = true
          object.receiveShadow = true
          object.material.color = new THREE.Color('#999')
        }
      })
      modelTemplates[type] = modelTemplate
    }

    await loadModel(
      NODE_TYPE.TSCH,
      '/models/wi-fi_router/scene.gltf',
      [1.6, 1.6, 1.6],
      -Math.PI / 2
    )
    await loadModel(NODE_TYPE.TSN, '/models/switch/scene.gltf', [7, 7, 7], 0)
    await loadModel(NODE_TYPE.FIVE_G_BS, '/models/5g_tower/scene.gltf', [6, 6, 6], 0)
    await loadModel(NODE_TYPE.FIVE_G_UE, '/models/5g_ue/scene.gltf', [0.5, 0.5, 0.5], -Math.PI / 2)
    await loadModel(
      NODE_TYPE.END_SYSTEM_SERVER,
      '/models/server/scene.gltf',
      [1.5, 1.5, 1.5],
      Math.PI / 2
    )
    await loadModel(
      NODE_TYPE.END_SYSTEM_SENSOR,
      '/models/sensor/scene.glb',
      [2, 2, 2],
      -Math.PI / 3
    )
    await loadModel(
      NODE_TYPE.END_SYSTEM_ROBOTIC_ARM,
      '/models/robotic_arm/scene.gltf',
      [0.004, 0.004, 0.004],
      -Math.PI / 2
    )
  }

  let drawnNodes: { [id: number]: any } = {}
  const drawNodes = async () => {
    if (Object.values(modelTemplates).length == 0) {
      await loadGLTFModels()
    }
    for (const node of Network.Nodes.value) {
      if (node.id == 0 || drawnNodes[node.id] != undefined) continue
      drawNode(node)
    }
  }
  const drawNode = (node: Node) => {
    const modelTemplate = modelTemplates[node.type]
    const model = modelTemplate.clone()

    model.position.x = node.pos[0]
    model.position.z = node.pos[1]
    model.position.y = 0
    model.traverse(function (object: any) {
      if (object.isMesh) {
        object.userData.type = NODE_TYPE[node.type]
        object.userData.node_id = node.id
      }
    })
    scene.add(model)

    const box = new THREE.Box3().setFromObject(model)
    const size = new THREE.Vector3()
    box.getSize(size)

    const label = createLabel(`${NODE_TYPE[node.type]}-${node.id}`)
    label.position.set(model.position.x, size.y + 1, model.position.z) // Adjust the position as needed
    scene.add(label)

    // dragbox and helper
    const dragBox = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    )
    dragBox.geometry.translate(0, size.y / 2, 0)
    dragBox.position.copy(model.position)
    dragBox.userData.type = NODE_TYPE[node.type]
    dragBox.userData.node_id = node.id
    dragBox.castShadow = false
    dragBox.visible = false
    scene.add(dragBox)
    objectsToDrag.push(dragBox)

    const dragBoxHelper = new THREE.BoxHelper(model, 'skyblue')
    dragBoxHelper.castShadow = false
    dragBoxHelper.visible = SignalEditTopology.value
    scene.add(dragBoxHelper)

    drawnNodes[node.id] = {
      model,
      label,
      dragBox,
      dragBoxHelper
    }
  }
  const clearNodes = () => {
    for (const node of Object.values(drawnNodes)) {
      scene.remove(node.model)
      scene.remove(node.label)
      scene.remove(node.dragBox)
      scene.remove(node.dragBoxHelper)
    }
    drawnNodes = {}
  }

  let drawnLinks: { [uid: number]: { mesh: any; link: Link } } = {}
  const drawLinks = () => {
    for (const l of Object.values(Network.Links.value)) {
      if (drawnLinks[l.uid] == undefined) {
        drawLink(l)
      }
    }
  }
  const drawLink = (l: Link) => {
    const p1 = new THREE.Vector3(
      Network.Nodes.value[l.v1].pos[0],
      1.6,
      Network.Nodes.value[l.v1].pos[1]
    )

    const p3 = new THREE.Vector3(
      Network.Nodes.value[l.v2].pos[0],
      1.6,
      Network.Nodes.value[l.v2].pos[1]
    )

    const x2 = (p1.x + p3.x) / 2
    const z2 = (p1.z + p3.z) / 2
    const h = 5
    const p2 = new THREE.Vector3(x2, h, z2)

    const curve = new THREE.QuadraticBezierCurve3(p1, p2, p3)
    const points = curve.getPoints(64)
    let mesh: any
    if (l.type == LINK_TYPE.WIRELESS) {
      mesh = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineDashedMaterial({
          color: 'white',
          scale: 2,
          dashSize: 1,
          gapSize: 1
        })
      )
      mesh.computeLineDistances()
    } else {
      mesh = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: 'white'
        })
      )
    }
    scene.add(mesh)
    drawnLinks[l.uid] = { mesh, link: l }
  }
  const clearLink = (uid: number) => {
    scene.remove(drawnLinks[uid].mesh)
    drawnLinks[uid].mesh.geometry.dispose()
    drawnLinks[uid].mesh.material.dispose()
    delete drawnLinks[uid]
  }
  const clearLinks = () => {
    for (const l of Object.values(drawnLinks)) {
      scene.remove(l.mesh)
      l.mesh.geometry.dispose()
      l.mesh.material.dispose()
    }
    drawnLinks = {}
  }

  let drawnUnicastPackets: { [uid: number]: any } = {}
  let drawnBeaconPackets: { [uid: number]: any } = {}
  const drawPackets = () => {
    time = 0 // reset animation timer
    for (const pkt of Network.PacketsCurrent.value) {
      if (pkt.mac_dst != ADDR.BROADCAST) {
        drawUnicastPacket(pkt)
      } else {
        //if (Network.Type == NETWORK_TYPE.TSCH && pkt.type == TSCH_PKT_TYPE.BEACON) {
        drawBeaconPacket(pkt)
      }
    }
  }
  const drawUnicastPacket = (pkt: Packet) => {
    const geometry = new THREE.BufferGeometry()
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color('white') }
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
      Network.Nodes.value[pkt.mac_src].pos[0],
      1.6,
      Network.Nodes.value[pkt.mac_src].pos[1]
    )

    const p3 = new THREE.Vector3(
      Network.Nodes.value[pkt.mac_dst].pos[0],
      1.6,
      Network.Nodes.value[pkt.mac_dst].pos[1]
    )

    const x2 = (p1.x + p3.x) / 2
    const z2 = (p1.z + p3.z) / 2
    const h = 5
    const p2 = new THREE.Vector3(x2, h, z2)

    drawnUnicastPackets[pkt.uid] = {
      mesh,
      curve: new THREE.QuadraticBezierCurve3(p1, p2, p3),
      positions: [],
      uid: pkt.uid,
      mac_src: pkt.mac_src,
      mac_dst: pkt.mac_dst
    }
  }
  const drawBeaconPacket = (pkt: Packet) => {
    const geometry = new THREE.SphereGeometry(
      Network.Config.value.tx_range,
      32,
      32,
      0,
      Math.PI,
      0,
      -Math.PI
    )
    const material = new THREE.MeshBasicMaterial({
      color: 'skyblue',
      opacity: 0.33,
      transparent: true,
      // map: texture, To-do: add texture
      side: THREE.DoubleSide
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = Math.PI / 2
    mesh.position.set(
      Network.Nodes.value[pkt.mac_src].pos[0],
      0.5,
      Network.Nodes.value[pkt.mac_src].pos[1]
    )
    scene.add(mesh)
    drawnBeaconPackets[pkt.uid] = { mesh, uid: pkt.uid, mac_src: pkt.mac_dst, mac_dst: pkt.mac_dst }
  }
  const clearPacket = (uid: number) => {
    if (drawnUnicastPackets[uid] != undefined) {
      scene.remove(drawnUnicastPackets[uid].mesh)
      drawnUnicastPackets[uid].mesh.geometry.dispose()
      drawnUnicastPackets[uid].mesh.material.dispose()
    }

    if (drawnBeaconPackets[uid] != undefined) {
      scene.remove(drawnBeaconPackets[uid].mesh)
      drawnBeaconPackets[uid].mesh.geometry.dispose()
      drawnBeaconPackets[uid].mesh.material.dispose()
    }
  }

  const clearPackets = () => {
    for (const u of Object.values(drawnUnicastPackets)) {
      scene.remove(u.mesh)
      u.mesh.geometry.dispose()
      u.mesh.material.dispose()
    }
    drawnUnicastPackets = {}

    for (const b of Object.values(drawnBeaconPackets)) {
      scene.remove(b.mesh)
      b.mesh.geometry.dispose()
      b.mesh.material.dispose()
    }
    drawnBeaconPackets = []
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

  const clock = new THREE.Clock()
  let time = 0
  const speed = 1000 / Network.SlotDuration.value // Speed of the packet movement, adjust as needed
  const animate = () => {
    // packet animation
    const delta = clock.getDelta()
    time += speed * delta
    time = time >= 1 ? 0 : time

    // unicast
    for (const u of Object.values(drawnUnicastPackets)) {
      if (time == 0) {
        u.positions = []
      }
      const point = u.curve.getPoint(time)

      if (u.positions.length > 0) {
        const lastPosition = u.positions[0]
        for (let t = 0.1; t < 1; t += 0.1) {
          const interpolatedPosition = new THREE.Vector3().lerpVectors(lastPosition, point, t)
          u.positions.unshift(interpolatedPosition)
        }
      }
      u.positions.unshift(point)

      while (u.positions.length > 36) {
        u.positions.pop()
      }
      u.mesh.geometry.setFromPoints(u.positions)

      const sizes: number[] = []
      for (let i = 0; i < u.positions.length; i++) {
        sizes[i] = (1 - i / u.positions.length) * 1.5
      }
      u.mesh.geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
    }

    // beacon
    const scale = -(Math.cos(Math.PI * time) - 1) / 2
    for (const b of Object.values(drawnBeaconPackets)) {
      b.mesh.scale.set(scale, scale, scale)
    }

    requestAnimationFrame(animate)
    TWEEN.update()
    controls.update()
    renderer.render(scene, camera)
    stats.update()
  }

  // main
  setCamera()
  addLights()
  drawGround()
  drawNodes()
  drawLinks()
  animate()

  watch(SignalUpdateTopology, () => {
    drawNodes()
    clearLinks()
    drawLinks()
  })

  watch(Network.SlotDone, () => {
    if (Network.SlotDone.value) {
      drawPackets()
    } else {
      clearPackets()
    }
  })
  watch(Network.SignalReset, () => {
    clearNodes()
    clearLinks()
    clearPackets()
    drawNodes()
  })
  watch(SignalResetCamera, () => {
    animateCameraPosition({ x: 0, y: 70, z: 80 }, 1000)
    animatePanPosition({ x: 0, y: 0, z: 0 }, 1000)
  })
  watch(SignalEditTopology, () => {
    if (SignalEditTopology.value) {
      dragControls.activate()
    } else {
      dragControls.deactivate()
    }
    for (const node of Object.values(drawnNodes)) {
      node.dragBox.visible = !node.dragBoxHelper.visible
      node.dragBoxHelper.visible = !node.dragBoxHelper.visible
    }
  })

  // onClick
  const raycaster = new THREE.Raycaster()
  raycaster.layers.set(0)
  const mouse = new THREE.Vector2()
  window.addEventListener(
    'click',
    (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObjects(scene.children)
      for (const o of intersects) {
        if (o.object.userData.node_id != undefined) {
          SelectedNode.value = o.object.userData.node_id
          break
        }
      }
    },
    false
  )

  // onDrag
  const dragControls = new DragControls(objectsToDrag, camera, renderer.domElement)
  let relatedLinks: any = []
  let relatedUnicastPackets: any = []
  let relatedBeaconPacket: any = undefined
  dragControls.deactivate()
  dragControls.addEventListener('dragstart', function (event) {
    if (NODE_TYPE[event.object.userData.type] != undefined) {
      const node = event.object.userData.node_id
      for (const l of Object.values(drawnLinks)) {
        if (l.link.v1 == node || l.link.v2 == node) {
          relatedLinks.push(l)
        }
      }
      for (const u of Object.values(drawnUnicastPackets)) {
        if (u.mac_src == node || u.mac_dst == node) {
          relatedUnicastPackets.push(u)
        }
      }
      for (const b of Object.values(drawnBeaconPackets)) {
        if (b.mac_src == node) {
          relatedBeaconPacket = b
          break
        }
      }
    }
    controls.enabled = false
  })
  dragControls.addEventListener('dragend', function () {
    relatedLinks = []
    relatedUnicastPackets = []
    relatedBeaconPacket = undefined
    controls.enabled = true
  })
  dragControls.addEventListener('drag', function (event) {
    // snap to ground
    event.object.position.y = 0

    if (NODE_TYPE[event.object.userData.type] != undefined) {
      Network.Nodes.value[event.object.userData.node_id].pos = [
        event.object.position.x,
        event.object.position.z
      ]

      for (const l of relatedLinks) {
        clearLink(l.link.uid)
        drawLink(l.link)
      }
      for (const pkt of relatedUnicastPackets) {
        clearPacket(pkt.uid)
        drawUnicastPacket(pkt)
      }
      if (relatedBeaconPacket != undefined) {
        clearPacket(relatedBeaconPacket.uid)
        drawBeaconPacket(relatedBeaconPacket)
      }
    }

    // update dragbox and model
    for (const node of Object.values(drawnNodes)) {
      node.model.position.copy(node.dragBox.position)
      node.dragBoxHelper.update()
      if (node.label != undefined) {
        node.label.position.set(
          node.dragBox.position.x,
          node.label.position.y,
          node.dragBox.position.z
        )
      }
    }
  })
}

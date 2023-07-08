import { watch } from 'vue'
import { Network, SelectedNode } from './useStates'
import { ADDR, PKT_TYPES } from '@/networks/TSCH/typedefs'

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'

export function useDrawTopology(dom: HTMLElement) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000)
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  const controls = new OrbitControls(camera, renderer.domElement)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.setPixelRatio(window.devicePixelRatio)

  dom.appendChild(renderer.domElement)
  const objectsToDrag: any = []

  const setCamera = () => {
    camera.position.z = 57 // Move the camera back
    camera.position.y = 100 // Move the camera up
    camera.lookAt(new THREE.Vector3(0, 0, 0))
  }
  const addLights = () => {
    const ambientLight = new THREE.AmbientLight(0x404040, 20)
    scene.add(ambientLight)

    const spotLight = new THREE.SpotLight(0xffffff, 10, 420, Math.PI / 4, 0.2) // adjust angle and penumbra as needed
    spotLight.position.set(50, 120, 90) // x, y, z coordinates
    spotLight.shadow.mapSize.width = 2048 // default is 512
    spotLight.shadow.mapSize.height = 2048
    spotLight.castShadow = true
    scene.add(spotLight)
  }

  const drawGround = () => {
    const geometry = new THREE.PlaneGeometry(130, 130, 64, 64)
    const textureLoader = new THREE.TextureLoader()
    const texture = textureLoader.load('/texture.jpeg', function (texture) {
      texture.minFilter = THREE.LinearFilter // Minification filter
      texture.magFilter = THREE.LinearFilter // Magnification filter
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy() // Anisotropic filtering
    })
    const material = new THREE.MeshLambertMaterial({
      map: texture,
      color: '#648',
      side: THREE.DoubleSide
    })
    const plane = new THREE.Mesh(geometry, material)
    plane.receiveShadow = true
    plane.rotation.x = Math.PI / 2
    plane.userData.name = 'ground'
    scene.add(plane)
  }

  const drawTSCHNodes = () => {
    // draw TSCH node
    let model: THREE.Group
    // GLTF Loader
    const loader = new GLTFLoader()
    loader.load(
      'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf',
      function (gltf: any) {
        model = gltf.scene
        model.scale.set(0.2, 0.2, 0.2)

        // color of the model
        const color = new THREE.Color('#8393c9')

        // Compute the bounding box of the model
        const box = new THREE.Box3().setFromObject(model)
        model.position.y = -box.min.y
        model.traverse(function (object: any) {
          if (object.isMesh) {
            object.castShadow = true // enable shadow casting
            object.receiveShadow = true
            object.material.color = color
          }
        })
        // scene.add(model)

        for (const node of Network.Nodes.value) {
          if (node.id == 0) continue
          const clonedModel = model.clone()
          clonedModel.name = `${node.id}`
          clonedModel.traverse(function (object: any) {
            if (object.isMesh) {
              object.userData.name = `${node.id}`
            }
          })
          clonedModel.position.x = node.pos[0]
          clonedModel.position.z = node.pos[1]
          scene.add(clonedModel)
          // objectsToDrag.push(clonedModel)
        }
      }
    )
  }

  let PacketObjectsUnicast: any = []
  let PacketObjectsBeacon: any = []

  // Use clock to get time delta
  const clock = new THREE.Clock()
  let time = 0
  const speed = 1000 / Network.SlotDuration.value // Speed of the movement, adjust as needed

  const animate = () => {
    const delta = clock.getDelta()
    time += speed * delta
    // Reset time if it exceeds 1
    time = time >= 1 ? 0 : time

    for (const u of PacketObjectsUnicast) {
      const point = u.curve.getPoint(time)
      u.mesh.position.copy(point)
    }
    for (const b of PacketObjectsBeacon) {
      b.mesh.scale.set(time, time, time)
      b.mesh.position.y = 5 * time + 4
    }

    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
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
    const h = 10
    const p2 = new THREE.Vector3(x2, h, z2)

    const curve = new THREE.QuadraticBezierCurve3(p1, p2, p3)
    const points = curve.getPoints(128)
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)

    const lineMaterial = new THREE.LineBasicMaterial({ color: 'white' })
    const link = new THREE.Line(lineGeometry, lineMaterial)
    scene.add(link)
  }

  const drawPackets = () => {
    time = 0
    for (const pkt of Network.PacketsCurrent.value) {
      if (pkt.type != PKT_TYPES.ACK && pkt.dst != ADDR.BROADCAST) {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 16, 16),
          new THREE.MeshNormalMaterial()
        )
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
        const h = 10
        const p2 = new THREE.Vector3(x2, h, z2)
        const curve = new THREE.QuadraticBezierCurve3(p1, p2, p3)

        PacketObjectsUnicast.push({ mesh, curve })
      } else if (pkt.type == PKT_TYPES.BEACON) {
        const geometry = new THREE.RingGeometry(Network.TopoConfig.value.tx_range-.1, Network.TopoConfig.value.tx_range, 64,64)
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
        mesh.scale.set(0, 0, 0)
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

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  function onClick(event: any) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(scene.children, true)

    if (intersects.length > 0) {
      if (intersects[0].object.userData.name != 'ground')
        SelectedNode.value = parseInt(intersects[0].object.userData.name)
    }
  }
  window.addEventListener('click', onClick, false)
}

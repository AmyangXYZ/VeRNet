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

  // Ground plane
  const geometry = new THREE.PlaneGeometry(100, 100, 64, 64)
  const textureLoader = new THREE.TextureLoader()
  const texture = textureLoader.load('/texture.jpeg') // Replace with the path to your image
  const material = new THREE.MeshLambertMaterial({
    map: texture,
    color: '#336',
    side: THREE.DoubleSide
  })
  const plane = new THREE.Mesh(geometry, material)
  plane.receiveShadow = true
  plane.rotation.x = Math.PI / 2
  plane.userData.name = 'ground'
  scene.add(plane)

  // lights
  const ambientLight = new THREE.AmbientLight(0x404040, 20)
  scene.add(ambientLight)
  /*
  const pointLight = new THREE.PointLight(0xffffff, 10, 200)
  pointLight.position.set(20, 50, 25)
  // Configure the shadow map resolution
  pointLight.shadow.mapSize.width = 2048 // default is 512
  pointLight.shadow.mapSize.height = 2048 // default is 512
  // Configure the shadow map bias
  pointLight.shadow.bias = -0.001 // default is 0, you can adjust this value based on your scene
  pointLight.castShadow = true
  scene.add(pointLight)
  */
  const spotLight = new THREE.SpotLight(0xffffff, 10, 400, Math.PI / 4, 0.2) // adjust angle and penumbra as needed
  spotLight.position.set(0, 100, 0) // x, y, z coordinates
  spotLight.castShadow = true
  scene.add(spotLight)

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

  // set camera
  camera.position.z = 80 // Move the camera back
  camera.position.y = 60 // Move the camera up
  camera.lookAt(new THREE.Vector3(0, 0, 0))

  let PacketCurves: any = []
  // Use clock to get time delta
  const clock = new THREE.Clock()
  let time = 0
  const speed = 2 // Speed of the movement, adjust as needed
  const animate = function () {
    const delta = clock.getDelta()
    time += speed * delta

    for (const p of PacketCurves) {
      // Reset time if it exceeds 1
      time = time >= 1 ? 0 : time;

      // Get point at time
      const point = p.curve.getPoint(time)

      // Update object position
      p.mesh.position.copy(point)
    }

    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

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
  function drawLinks() {
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

  function drawLink(src: number, dst: number) {
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
    const h = 15
    const p2 = new THREE.Vector3(x2, h, z2)

    const curve = new THREE.QuadraticBezierCurve3(p1, p2, p3)
    const points = curve.getPoints(50)
    const geometry1 = new THREE.BufferGeometry().setFromPoints(points)

    const material1 = new THREE.LineBasicMaterial({ color: 'white' })
    const curveObject = new THREE.Line(geometry1, material1)
    scene.add(curveObject)
  }

  function drawPackets() {
    for (const pkt of Network.PacketsCurrent.value) {
      if (pkt.type != PKT_TYPES.ACK && pkt.dst != ADDR.BROADCAST) {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(.5, 16, 16),
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
        const h = 15
        const p2 = new THREE.Vector3(x2, h, z2)
    
        const curve = new THREE.QuadraticBezierCurve3(p1, p2, p3)

        PacketCurves.push({ mesh, curve })
      }
    }
  }

  watch(Network.SlotDone, () => {
    if (Network.SlotDone.value) {
    drawLinks()
    drawPackets()
    } else {
      for (const p of PacketCurves) {
        scene.remove(p.mesh)
      }
      time = 0
      PacketCurves = []
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

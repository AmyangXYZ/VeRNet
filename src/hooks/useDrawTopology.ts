import { watch } from 'vue'
import { Network, SelectedNode, SignalEditTopology, SignalResetCamera } from './useStates'
import { ADDR, PKT_TYPES } from '@/networks/TSCH/typedefs'

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'
import Stats from 'three/examples/jsm/libs/stats.module'
import * as TWEEN from '@tweenjs/tween.js'
import { NODE_TYPE, NetworkType } from '@/networks/common'

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

  const stats = new Stats()
  stats.dom.style.position = 'fixed'
  stats.dom.style.right = '16px'
  stats.dom.style.top = '16px'
  stats.dom.style.left = null
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
      color: '#423655'
    })
    const plane = new THREE.Mesh(geometry, material)
    plane.receiveShadow = true
    plane.rotation.x = -Math.PI / 2
    plane.userData.name = 'ground'
    scene.add(plane)
  }

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
    sprite.scale.set(canvas.width / 108, canvas.height / 108, 1)
    return sprite
  }

  let drawnNodes: any = []
  const drawNodes = () => {
    switch (Network.Type) {
      case NetworkType.TSCH:
        drawTSCHNodes()
        break
      case NetworkType.TSN:
        drawTSNNodes()
        break
      case NetworkType.FiveG:
        drawFiveGBS()
        drawFiveGUE()
        break
    }

    drawEndSystems()
  }
  const clearNodes = () => {
    for (const i in drawnNodes) {
      scene.remove(drawnNodes[i].model)
      scene.remove(drawnNodes[i].label)
      scene.remove(drawnNodes[i].dragBox)
      scene.remove(drawnNodes[i].boxHelper)
    }
    drawnNodes = {}
  }
  const drawTSCHNodes = () => {
    // GLTF Loader
    const loader = new GLTFLoader()
    loader.load('/models/wi-fi_router/scene.gltf', function (gltf: any) {
      const modelTemplate = gltf.scene

      modelTemplate.scale.set(1.6, 1.6, 1.6)
      modelTemplate.rotation.y = -Math.PI / 2
      modelTemplate.traverse(function (object: any) {
        if (object.isMesh) {
          object.castShadow = true // enable shadow casting
          object.receiveShadow = true
          object.material.color = new THREE.Color('#999')
        }
      })

      const box = new THREE.Box3().setFromObject(modelTemplate)
      const size = new THREE.Vector3()
      box.getSize(size)

      for (const node of Network.Nodes.value) {
        if (node.id == 0 || node.type != NODE_TYPE.TSCH) continue
        let modelGroup: any = {}

        const model = modelTemplate.clone()
        model.position.x = node.pos[0]
        model.position.z = node.pos[1]
        model.position.y = 0
        modelGroup = model
        model.traverse(function (object: any) {
          if (object.isMesh) {
            object.userData.type = NODE_TYPE[node.type]
            object.userData.node_id = node.id
          }
        })
        scene.add(model)

        const label = createLabel(`${NODE_TYPE[node.type]}-${node.id}`)
        label.position.set(model.position.x, 3.5, model.position.z) // Adjust the position as needed
        scene.add(label)

        const dragBox = new THREE.Mesh(
          new THREE.BoxGeometry(size.x, size.y, size.z),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
        )
        dragBox.geometry.translate(0, size.y / 2, 0)
        dragBox.position.copy(model.position)
        dragBox.userData.type = NODE_TYPE[node.type]
        dragBox.userData.node_id = node.id
        dragBox.castShadow = false
        scene.add(dragBox)
        objectsToDrag.push(dragBox)

        const boxHelper = new THREE.BoxHelper(dragBox, 'skyblue')
        boxHelper.visible = false
        boxHelper.castShadow = false
        scene.add(boxHelper)
        drawnNodes[`${NODE_TYPE[node.type]}-${node.id}`] = {
          model,
          label,
          modelGroup,
          dragBox,
          boxHelper
        }
      }
    })
  }
  const drawTSNNodes = () => {
    // GLTF Loader
    const loader = new GLTFLoader()
    loader.load('/models/wi-fi_router/scene.gltf', function (gltf: any) {
      const modelTemplate = gltf.scene

      modelTemplate.scale.set(1.6, 1.6, 1.6)
      modelTemplate.rotation.y = -Math.PI / 2
      modelTemplate.traverse(function (object: any) {
        if (object.isMesh) {
          object.castShadow = true // enable shadow casting
          object.receiveShadow = true
          object.material.color = new THREE.Color('#999')
        }
      })

      const box = new THREE.Box3().setFromObject(modelTemplate)
      const size = new THREE.Vector3()
      box.getSize(size)

      for (const node of Network.Nodes.value) {
        if (node.id == 0 || node.type != NODE_TYPE.TSN) continue
        let modelGroup: any = {}

        const model = modelTemplate.clone()
        model.position.x = node.pos[0]
        model.position.z = node.pos[1]
        model.position.y = 0
        modelGroup = model
        model.traverse(function (object: any) {
          if (object.isMesh) {
            object.userData.type = NODE_TYPE[node.type]
            object.userData.node_id = node.id
          }
        })
        scene.add(model)

        const label = createLabel(`${NODE_TYPE[node.type]}-${node.id}`)
        label.position.set(model.position.x, 3.5, model.position.z) // Adjust the position as needed
        scene.add(label)

        const dragBox = new THREE.Mesh(
          new THREE.BoxGeometry(size.x, size.y, size.z),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
        )
        dragBox.geometry.translate(0, size.y / 2, 0)
        dragBox.position.copy(model.position)
        dragBox.userData.type = NODE_TYPE[node.type]
        dragBox.userData.node_id = node.id
        dragBox.castShadow = false
        scene.add(dragBox)
        objectsToDrag.push(dragBox)

        const boxHelper = new THREE.BoxHelper(dragBox, 'skyblue')
        boxHelper.visible = false
        boxHelper.castShadow = false
        scene.add(boxHelper)
        drawnNodes[`${NODE_TYPE[node.type]}-${node.id}`] = {
          model,
          label,
          modelGroup,
          dragBox,
          boxHelper
        }
      }
    })
  }

  const drawFiveGBS = () => {
    if (Network.Nodes.value.length == 0) {
      return
    }
    const node = Network.Nodes.value[0]
    // GLTF Loader
    const loader = new GLTFLoader()
    loader.load('/models/5_five_g_tower/scene.gltf', function (gltf: any) {
      let modelGroup: any = {}
      const model = gltf.scene
      model.scale.set(6, 6, 6)
      model.traverse(function (object: any) {
        if (object instanceof THREE.Group) {
          modelGroup = object
        }
        if (object.isMesh) {
          object.castShadow = true // enable shadow casting
          object.receiveShadow = true
          object.material.color = new THREE.Color('#666')
          object.userData.type = NODE_TYPE[node.type]
          object.userData.node_id = 0
        }
      })
      model.position.x = node.pos[0]
      model.position.z = node.pos[1]
      scene.add(model)

      const box = new THREE.Box3().setFromObject(model)
      const size = new THREE.Vector3()
      box.getSize(size)

      const label = createLabel(`5G-BS-1`)
      label.position.set(model.position.x, size.y + 1, model.position.z) // Adjust the position as needed
      scene.add(label)

      const dragBox = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y, size.z),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
      )
      dragBox.geometry.translate(0, size.y / 2, 0)
      dragBox.position.copy(modelGroup.position)
      dragBox.userData.type = NODE_TYPE[node.type]
      dragBox.userData.node_id = node.id
      scene.add(dragBox)
      objectsToDrag.push(dragBox)

      const boxHelper = new THREE.BoxHelper(dragBox, 'skyblue')
      boxHelper.visible = false
      boxHelper.castShadow = false
      scene.add(boxHelper)
      drawnNodes[`${NODE_TYPE[node.type]}-${node.id}`] = {
        model,
        label,
        modelGroup,
        dragBox,
        boxHelper
      }
    })
  }

  const drawFiveGUE = () => {
    // GLTF Loader
    const loader = new GLTFLoader()
    loader.load('/models/wi-fi_router/scene.gltf', function (gltf: any) {
      const modelTemplate = gltf.scene

      modelTemplate.scale.set(1.6, 1.6, 1.6)
      modelTemplate.rotation.y = -Math.PI / 2
      modelTemplate.traverse(function (object: any) {
        if (object.isMesh) {
          object.castShadow = true // enable shadow casting
          object.receiveShadow = true
          object.material.color = new THREE.Color('#999')
        }
      })

      const box = new THREE.Box3().setFromObject(modelTemplate)
      const size = new THREE.Vector3()
      box.getSize(size)

      for (const node of Network.Nodes.value) {
        if (node.id == 0 || node.type != NODE_TYPE.FiveGUE) continue
        let modelGroup: any = {}

        const model = modelTemplate.clone()
        model.position.x = node.pos[0]
        model.position.z = node.pos[1]
        model.position.y = 0
        modelGroup = model
        model.traverse(function (object: any) {
          if (object.isMesh) {
            object.userData.type = NODE_TYPE[node.type]
            object.userData.node_id = node.id
          }
        })
        scene.add(model)

        const label = createLabel(`UE-${node.id}`)
        label.position.set(model.position.x, 3.5, model.position.z) // Adjust the position as needed
        scene.add(label)

        const dragBox = new THREE.Mesh(
          new THREE.BoxGeometry(size.x, size.y, size.z),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
        )
        dragBox.geometry.translate(0, size.y / 2, 0)
        dragBox.position.copy(model.position)
        dragBox.userData.type = NODE_TYPE[node.type]
        dragBox.userData.node_id = node.id
        dragBox.castShadow = false
        scene.add(dragBox)
        objectsToDrag.push(dragBox)

        const boxHelper = new THREE.BoxHelper(dragBox, 'skyblue')
        boxHelper.visible = false
        boxHelper.castShadow = false
        scene.add(boxHelper)
        drawnNodes[`${NODE_TYPE[node.type]}-${node.id}`] = {
          model,
          label,
          modelGroup,
          dragBox,
          boxHelper
        }
      }
    })
  }

  const drawEndSystems = () => {
    const loader = new GLTFLoader()
    // TODO: we will need as many load() calls as there are end system types - one for each model
    loader.load('/models/server_rack/scene.gltf', function (gltf: any) {
      const modelTemplate = gltf.scene

      // mess around with scale and rotation
      modelTemplate.scale.set(3, 3, 3)
      modelTemplate.rotation.y = -Math.PI / 2
      modelTemplate.traverse(function (object: any) {
        if (object.isMesh) {
          object.castShadow = true
          object.receiveShadow = true
          object.material.color = new THREE.Color('#999')
        }
      })

      const box = new THREE.Box3().setFromObject(modelTemplate)
      const size = new THREE.Vector3()
      box.getSize(size)

      for (const es of Network.EndSystems.value) {
        let modelGroup: any = {}

        const model = modelTemplate.clone()
        model.position.x = es.pos[0]
        model.position.z = es.pos[1]
        model.position.y = size.y / 2 // for this specific gltf
        modelGroup = model
        model.traverse(function (object: any) {
          if (object.isMesh) {
            object.userData.type = NODE_TYPE[4] // EndSystem
            object.userData.node_id = es.id
          }
        })
        scene.add(model)

        const label = createLabel(`${NODE_TYPE[4]}-${es.id}`) // EndSystem-{ID}
        label.position.set(model.position.x, 7, model.position.z) // adjust as needed
        scene.add(label)

        const dragBox = new THREE.Mesh(
          new THREE.BoxGeometry(size.x, size.y, size.z),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
        )
        dragBox.geometry.translate(0, size.y / 2, 0)
        dragBox.position.copy(model.position)
        dragBox.userData.type = NODE_TYPE[4] // EndSystem
        dragBox.userData.node_id = es.id
        dragBox.castShadow = false
        scene.add(dragBox)
        objectsToDrag.push(dragBox)

        const boxHelper = new THREE.BoxHelper(dragBox, 'skyblue')
        boxHelper.visible = false
        boxHelper.castShadow = false
        scene.add(boxHelper)
        drawnNodes[`${NODE_TYPE[4]}-${es.id}`] = {
          model,
          label,
          modelGroup,
          dragBox,
          boxHelper
        }
      }
    })
  }

  let drawnLinks: any = {}
  const drawLinks = () => {
    for (const n of Network.Nodes.value) {
      for (const nn of n.neighbors) {
        const linkName = n.id < nn ? `${n.id}-${nn}` : `${nn}-${n.id}`
        if (drawnLinks[linkName] == undefined) {
          drawLink(n.id, nn, linkName)
        }
      }
    }
  }
  const drawLink = (src: number, dst: number, name: string) => {
    const p1 = new THREE.Vector3(
      Network.Nodes.value[src].pos[0],
      1.6,
      Network.Nodes.value[src].pos[1]
    )
    const p3 = new THREE.Vector3(
      Network.Nodes.value[dst].pos[0],
      1.6,
      Network.Nodes.value[dst].pos[1]
    )

    const x2 = (p1.x + p3.x) / 2
    const z2 = (p1.z + p3.z) / 2
    const h = 5
    const p2 = new THREE.Vector3(x2, h, z2)

    const curve = new THREE.QuadraticBezierCurve3(p1, p2, p3)
    const points = curve.getPoints(64)
    const mesh = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 'white' })
    )
    scene.add(mesh)
    drawnLinks[name] = { mesh, src, dst }
  }
  const clearLinks = () => {
    for (const i in drawnLinks) {
      scene.remove(drawnLinks[i].mesh)
      drawnLinks[i].mesh.geometry.dispose()
      drawnLinks[i].mesh.material.dispose()
    }
    drawnLinks = {}
  }

  let drawnUnicastPackets: any = []
  let drawnBeaconPackets: any = []
  const drawPackets = () => {
    time = 0
    for (const pkt of Network.PacketsCurrent.value) {
      if (pkt.type != PKT_TYPES.ACK && pkt.dst != ADDR.BROADCAST) {
        // for trail
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
          Network.Nodes.value[pkt.src].pos[0],
          1.6,
          Network.Nodes.value[pkt.src].pos[1]
        )
        const p3 = new THREE.Vector3(
          Network.Nodes.value[pkt.dst].pos[0],
          1.6,
          Network.Nodes.value[pkt.dst].pos[1]
        )
        const x2 = (p1.x + p3.x) / 2
        const z2 = (p1.z + p3.z) / 2
        const h = 5
        const p2 = new THREE.Vector3(x2, h, z2)
        const curve = new THREE.QuadraticBezierCurve3(p1, p2, p3)

        const positions: any = []
        drawnUnicastPackets.push({ mesh, curve, positions, src: pkt.src, dst: pkt.dst })
      } else if (pkt.type == PKT_TYPES.BEACON) {
        const geometry = new THREE.TorusGeometry(Network.TopoConfig.value.tx_range, 0.08, 16, 64)
        const material = new THREE.MeshBasicMaterial({
          color: 'white',
          side: THREE.DoubleSide
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.rotation.x = Math.PI / 2
        mesh.position.set(
          Network.Nodes.value[pkt.src].pos[0],
          1.6,
          Network.Nodes.value[pkt.src].pos[1]
        )
        scene.add(mesh)

        drawnBeaconPackets.push({ mesh, src: pkt.src, dst: pkt.dst })
      }
    }
  }
  const clearPackets = () => {
    if (drawnUnicastPackets.length > 0) {
      for (const u of drawnUnicastPackets) {
        scene.remove(u.mesh)
        u.mesh.geometry.dispose()
        u.mesh.material.dispose()
      }
      drawnUnicastPackets = []
    }
    if (drawnBeaconPackets.length > 0) {
      for (const b of drawnBeaconPackets) {
        scene.remove(b.mesh)
        b.mesh.geometry.dispose()
        b.mesh.material.dispose()
      }
      drawnBeaconPackets = []
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

  const clock = new THREE.Clock()
  let time = 0
  const speed = 1000 / Network.SlotDuration.value // Speed of the packet movement, adjust as needed
  const animate = () => {
    // packet animation
    const delta = clock.getDelta()
    time += speed * delta
    time = time >= 1 ? 0 : time
    for (const u of drawnUnicastPackets) {
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

      while (u.positions.length > 36) {
        u.positions.pop()
      }
      u.mesh.geometry.setFromPoints(u.positions)

      const sizes = []
      for (let i = 0; i < u.positions.length; i++) {
        sizes[i] = (1 - i / u.positions.length) * 1.2
      }
      u.mesh.geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
    }
    const scale = -(Math.cos(Math.PI * time) - 1) / 2
    for (const b of drawnBeaconPackets) {
      b.mesh.scale.set(scale, scale, scale)
      b.mesh.position.y = 5 * time + 1.6
    }

    if (SignalEditTopology.value) {
      for (const i in drawnNodes) {
        const node = drawnNodes[i]
        node.modelGroup.position.copy(node.dragBox.position)
        node.boxHelper.update()
        if (node.label != undefined) {
          node.label.position.set(
            node.dragBox.position.x,
            node.label.position.y,
            node.dragBox.position.z
          )
        }
      }
    }

    requestAnimationFrame(animate)
    TWEEN.update()
    controls.update()
    renderer.render(scene, camera)
    stats.update()
  }

  setCamera()
  addLights()
  drawGround()
  drawNodes()
//   draw5GTower()
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
    for (const i in drawnNodes) {
      const node = drawnNodes[i]
      node.boxHelper.visible = !node.boxHelper.visible
    }
  })

  // onClick
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
        if (
          intersects[0].object.userData.node_id != undefined &&
          intersects[0].object.userData.type == 'TSCH'
        )
          SelectedNode.value = intersects[0].object.userData.node_id
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
    if (event.object.userData.type == 'TSCH') {
      const node = event.object.userData.node_id
      for (const i in drawnLinks) {
        if (drawnLinks[i].src == node || drawnLinks[i].dst == node) {
          relatedLinks.push(drawnLinks[i])
        }
      }
      for (const i in drawnUnicastPackets) {
        if (drawnUnicastPackets[i].src == node || drawnUnicastPackets[i].dst == node) {
          relatedUnicastPackets.push(drawnBeaconPackets[i])
        }
      }
      for (const i in drawnBeaconPackets) {
        if (drawnBeaconPackets[i].src == node) {
          relatedBeaconPacket = drawnBeaconPackets[i]
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
    event.object.position.y = 0
    if (event.object.userData.type == 'TSCH') {
      Network.Nodes.value[event.object.userData.node_id].pos = [
        event.object.position.x,
        event.object.position.z
      ]
      // Todo: update position of related unicast packets and links
      // for (const link of relatedLinks) {
      //   link.mesh.geometry.attributes.position.array[0] = event.object.position.x;
      //   link.mesh.geometry.attributes.position.array[1] = event.object.position.y;
      //   link.mesh.geometry.attributes.position.array[2] = event.object.position.z;
      //   link.mesh.geometry.attributes.position.needsUpdate = true;
      // }
      if (relatedBeaconPacket != undefined) {
        relatedBeaconPacket.mesh.position.x = event.object.position.x
        relatedBeaconPacket.mesh.position.z = event.object.position.z
      }
    }
  })
}

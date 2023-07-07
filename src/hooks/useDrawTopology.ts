import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'
import { Network } from './useStates'

export function useDrawTopology(dom: HTMLElement) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000)
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  const controls = new OrbitControls(camera, renderer.domElement)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  dom.appendChild(renderer.domElement)
  const objectsToDrag: any = []

  // Ground plane
  const geometry = new THREE.PlaneGeometry(100, 100, 64, 64)
  const textureLoader = new THREE.TextureLoader()
  const texture = textureLoader.load('/src/assets/texture.jpeg') // Replace with the path to your image
  const material = new THREE.MeshLambertMaterial({
    map: texture,
    color: '#779',
    side: THREE.DoubleSide
  })
  const plane = new THREE.Mesh(geometry, material)
  plane.receiveShadow = true
  plane.rotation.x = Math.PI / 2
  scene.add(plane)

  // lights
  const ambientLight = new THREE.AmbientLight(0x404040, 20)
  scene.add(ambientLight)

  const pointLight = new THREE.PointLight(0xffffff, 10, 200)
  pointLight.position.set(20, 50, 25)
  // Configure the shadow map resolution
  pointLight.shadow.mapSize.width = 2048 // default is 512
  pointLight.shadow.mapSize.height = 2048 // default is 512
  // Configure the shadow map bias
  pointLight.shadow.bias = -0.001 // default is 0, you can adjust this value based on your scene
  pointLight.castShadow = true
  scene.add(pointLight)

  // draw TSCH node
  let model: THREE.Group
  // GLTF Loader
  const loader = new GLTFLoader()
  loader.load(
    'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf',
    function (gltf: any) {
      model = gltf.scene
      model.name = '1'
      model.scale.set(0.25, 0.25, 0.25)

      // Compute the bounding box of the model
      const box = new THREE.Box3().setFromObject(model)
      model.position.y = -box.min.y
      model.traverse(function (object: any) {
        if (object.isMesh) {
          object.castShadow = true // enable shadow casting
          object.receiveShadow = true
        }
      })
      // model.rotation.x = (60 * Math.PI) / 180
      // scene.add(model)
      for (const node of Network.Nodes.value) {
        const clonedModel = model.clone()
        clonedModel.name = `${node.id}`
        clonedModel.position.x = node.pos[0] - 50
        clonedModel.position.z = node.pos[1] - 50
        scene.add(clonedModel)
      }
    }
  )

  // set camera
  camera.position.z = 80 // Move the camera back
  camera.position.y = 60 // Move the camera up
  camera.lookAt(new THREE.Vector3(0, 0, 0))
  const animate = function () {
    requestAnimationFrame(animate)
    // if (model) {
    //   model.rotation.z += 0.01
    // }
    controls.update()
    renderer.render(scene, camera)
  }

  animate()

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  function onClick(event: any) {
    event.preventDefault()

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(scene.children, true)

    if (intersects.length > 0) {
      console.log('Intersection:', intersects[0])
    }
  }

  // window.addEventListener('click', onClick, false)

  // Set up drag controls
  const dragControls = new DragControls(objectsToDrag, camera, renderer.domElement)

  dragControls.addEventListener('dragstart', function (event) {
    // Cancel orbit controls when dragging
    controls.enabled = false
  })

  dragControls.addEventListener('dragend', function (event) {
    // Re-enable orbit controls when dragging stops
    controls.enabled = true
  })
}

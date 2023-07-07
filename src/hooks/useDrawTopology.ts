import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'

export function useDrawTopology(dom: HTMLElement) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  const controls = new OrbitControls(camera, renderer.domElement)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  dom.appendChild(renderer.domElement)
  let objectsToDrag = [];

  // Ground plane
  const geometry = new THREE.PlaneGeometry(100, 100, 64, 64)
  const textureLoader = new THREE.TextureLoader()
  const texture = textureLoader.load('/src/assets/texture.jpeg') // Replace with the path to your image
  const material = new THREE.MeshLambertMaterial({
    map: texture,
    // color: '#00f',
    side: THREE.DoubleSide
  })
  const plane = new THREE.Mesh(geometry, material)
  plane.receiveShadow = true
  plane.rotation.x = (-30 * Math.PI) / 180
  // plane.position.y = 10
  scene.add(plane)

  const ambientLight = new THREE.AmbientLight(0x404040, 10)
  scene.add(ambientLight)

  const pointLight = new THREE.PointLight(0xffffff, 5, 100)
  pointLight.position.set(0, 50, 10)
  pointLight.castShadow = true
  scene.add(pointLight)

  let model: THREE.Group
  // GLTF Loader
  const loader = new GLTFLoader()
  loader.load(
    'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf',
    function (gltf: any) {
      model = gltf.scene
      model.name = '1'
      model.scale.set(0.25, 0.25, 0.25)
      model.position.z = 0.5
      objectsToDrag.push(model);
      model.traverse(function (object: any) {
        if (object.isMesh) {
          object.castShadow = true // enable shadow casting
        }
      })
      model.rotation.x = (60 * Math.PI) / 180
      scene.add(model)

      const clonedModel = model.clone()
      clonedModel.name = '2'
      clonedModel.position.x += 10
      scene.add(clonedModel)
    }
  )

  camera.position.z = 50

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

  window.addEventListener('click', onClick, false)

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

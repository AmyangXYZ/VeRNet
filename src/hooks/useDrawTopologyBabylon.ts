import {
  Engine,
  ArcRotateCamera,
  Scene,
  SceneLoader,
  Vector3,
  StandardMaterial,
  MeshBuilder,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  AbstractMesh,
  Texture,
  BackgroundMaterial,
  Curve3,
  ParticleSystem,
  type Nullable
} from '@babylonjs/core'
import '@babylonjs/loaders'
import { FPS, Network } from './useStates'
import { NODE_TYPE, type Link } from '@/core/typedefs'
import { number } from 'echarts'

export async function useDrawTopology(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas, true, {}, true)
  const scene = new Scene(engine)
  scene.clearColor = new Color4(0.12, 0.1, 0.18, 1)

  const camera = new ArcRotateCamera('ArcRotateCamera', 0, 0, 45, new Vector3(0, 0, 0), scene)
  camera.setPosition(new Vector3(0, 70, 80))
  camera.attachControl(canvas, false)
  camera.inertia = 0.8
  camera.speed = 10

  const hemisphericLight = new HemisphericLight('HemisphericLight', new Vector3(0, 1, 0), scene)
  hemisphericLight.intensity = 0.4
  hemisphericLight.specular = new Color3(0, 0, 0)
  hemisphericLight.groundColor = new Color3(1, 1, 1)

  const directionalLight = new DirectionalLight('DirectionalLight', new Vector3(8, -15, 10), scene)
  directionalLight.intensity = 0.8

  const shadowGenerator = new ShadowGenerator(1024, directionalLight, true)
  shadowGenerator.usePercentageCloserFiltering = true
  shadowGenerator.forceBackFacesOnly = true
  shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_MEDIUM
  shadowGenerator.frustumEdgeFalloff = 0.1
  shadowGenerator.transparencyShadow = true

  const backgroundMaterial = new BackgroundMaterial('backgroundMaterial', scene)
  backgroundMaterial.diffuseTexture = new Texture('/texture.jpeg', scene)
  backgroundMaterial.diffuseTexture.hasAlpha = true
  // backgroundMaterial.opacityFresnel = false
  backgroundMaterial.shadowLevel = 0.4
  backgroundMaterial.useRGBColor = false
  backgroundMaterial.primaryColor = Color3.White()
  const ground = MeshBuilder.CreateGround('Ground', {
    width: Network.Config.value.grid_size + 25,
    height: Network.Config.value.grid_size + 25,
    subdivisions: 2,
    updatable: false
  })
  ground.material = backgroundMaterial
  ground.receiveShadows = true
  ground.renderingGroupId = 0

  const modelMaterial = new StandardMaterial('modelMaterial', scene)
  modelMaterial.ambientColor = new Color3(1, 1, 1)

  const modelTemplate: { [type: number]: AbstractMesh } = {}

  for (const [t] of Object.entries(NODE_TYPE)) {
    if (!isNaN(Number(t))) {
      await SceneLoader.ImportMeshAsync(undefined, `/models/${NODE_TYPE[Number(t)]}/`, 'scene.gltf', scene).then(
        (result) => {
          const mesh = result.meshes[0]
          modelTemplate[Number(t)] = mesh
          switch (Number(t)) {
            case NODE_TYPE.FIVE_G_GNB:
              mesh.scaling = new Vector3(5, 5, 5)
              break
            case NODE_TYPE.ROBOTIC_ARM:
              mesh.scaling = new Vector3(0.005, 0.005, 0.005)
              break
            case NODE_TYPE.TSCH:
              mesh.scaling = new Vector3(2, 2, 2)
              mesh.rotation.y -= Math.PI / 2
              break
            case NODE_TYPE.TSN:
              mesh.scaling = new Vector3(5, 5, 5)
              mesh.rotation.y -= Math.PI / 2
              break
            case NODE_TYPE.SERVER:
              mesh.rotation.y = -Math.PI / 2
              break
          }
          scene.removeMesh(mesh, true)
        }
      )
    }
  }

  const drawnNodes: { [id: number]: AbstractMesh } = {}
  const drawNodes = async () => {
    for (const node of Network.Nodes.value) {
      if (node.id == 0 || drawnNodes[node.id] != undefined) continue
      if (modelTemplate[node.type] != undefined) {
        const mesh = modelTemplate[node.type].clone('', null, false)
        if (mesh != undefined) {
          drawnNodes[node.id] = mesh
          mesh.position = new Vector3(-node.pos[0], 0, node.pos[1])
        }
      }
    }
  }

  const drawnLinks: { [uid: number]: { mesh: any; link: Link } } = {}
  const drawLinks = () => {
    for (const l of Object.values(Network.Links.value)) {
      if (drawnLinks[l.uid] == undefined) {
        const startPoint = drawnNodes[l.v1].position
        const endPoint = drawnNodes[l.v2].position
        const controlPoint = new Vector3((startPoint.x + endPoint.x) / 2, 10, (startPoint.z + endPoint.z) / 2)

        const curve = Curve3.CreateQuadraticBezier(startPoint, controlPoint, endPoint, 50)
        const lineMesh = MeshBuilder.CreateLines('curve', { points: curve.getPoints() }, scene)
        lineMesh.color = Color3.Teal()
        lineMesh.renderingGroupId = 1
      }
    }
  }

  const particleSystem = new ParticleSystem('particles', 2000, scene)
  particleSystem.particleTexture = new Texture('textures/flare.png', scene)
  particleSystem.renderingGroupId = 1
  const drawPackets = () => {
    particleSystem.emitter = new Vector3(0, 10, 0)
    // particleSystem.minSize = 0.1
    // particleSystem.maxSize = 0.1
    particleSystem.color1 = new Color4(0, 1, 0, 1) // Green color
    particleSystem.start()
  }

  await Network.LoadTopology()
  await drawNodes()
  Network.EstablishConnection()
  drawLinks()
  Network.ConstructRoutingGraph()
  Network.AddFlows(3)
  Network.StartWebWorkers()
  drawPackets()

  let t = 0
  // scene.registerBeforeRender(() => {
  //   // Interpolate the particle position along the curve
  //   const startPoint = new Vector3(0, 0, 0)
  //   const endPoint = new Vector3(20, 0, 20)
  //   const controlPoint = new Vector3((startPoint.x + endPoint.x) / 2, 10, (startPoint.z + endPoint.z) / 2)

  //   const curve = Curve3.CreateQuadraticBezier(startPoint, controlPoint, endPoint, 50)

  //   // const points = curve.getPoints()
  //   // particleSystem.emitter.position = points[Math.floor(t * points.length)]

  //   // Increment the interpolation parameter
  //   t += 0.005
  //   if (t > 1) {
  //     t = 0
  //   }
  // })

  engine.runRenderLoop(() => {
    FPS.value = Math.round(engine.getFps())
    engine.resize()
    scene.render()
  })
}

import {
  Engine,
  ArcRotateCamera,
  Scene,
  SceneLoader,
  Vector3,
  StandardMaterial,
  Mesh,
  MeshBuilder,
  Color3,
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  PhysicsShapeType,
  PhysicsAggregate,
  PhysicsViewer,
  AbstractMesh,
  Texture,
  PointerDragBehavior,
  BackgroundMaterial
} from '@babylonjs/core'
import '@babylonjs/loaders'
import { FPS, Network } from './useStates'
import { NODE_TYPE } from '@/core/typedefs'

export async function useDrawTopology(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas, true, {}, true)
  const scene = new Scene(engine)
  const camera = new ArcRotateCamera('ArcRotateCamera', 0, 0, 45, new Vector3(0, 12, 0), scene)
  camera.setPosition(new Vector3(0, 22, -25))
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
  backgroundMaterial.opacityFresnel = false
  backgroundMaterial.shadowLevel = 0.4
  backgroundMaterial.useRGBColor = false
  backgroundMaterial.primaryColor = Color3.White()
  const ground = MeshBuilder.CreateGround('Ground', {
    width: Network.Config.value.grid_size + 20,
    height: Network.Config.value.grid_size + 20,
    subdivisions: 2,
    updatable: false
  })
  ground.material = backgroundMaterial
  ground.receiveShadows = true

  const modelMaterial = new StandardMaterial('modelMaterial', scene)
  modelMaterial.ambientColor = new Color3(1, 1, 1)

  const drawNodes = () => {
    const drawnNodes: { [id: number]: any } = {}
    for (const node of Network.Nodes.value) {
      if (node.id == 0 || drawnNodes[node.id] != undefined) continue
      console.log(node.type, NODE_TYPE[node.type])
      SceneLoader.ImportMesh(undefined, `/models/FIVE_G_GNB/`, 'scene.gltf', scene, (meshes: Mesh[]) => {
        meshes.forEach((mesh: Mesh) => {
          mesh.position = new Vector3(node.pos[0], 0, node.pos[1])
          //   mesh.scaling = new Vector3(0.1, 0.1, 0.1)

          mesh.material = modelMaterial
          //   const dragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 1, 0) })
          //   //   dragBehavior.useObjectOrientationForDragging = false
          //   mesh.addBehavior(dragBehavior)
        })
      })
    }
  }

  engine.runRenderLoop(() => {
    FPS.value = Math.round(engine.getFps())
    engine.resize()
    scene.render()
  })

  await Network.LoadTopology()
  drawNodes()
}

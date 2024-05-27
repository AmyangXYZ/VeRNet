<template>
    <canvas ref="bjsCanvas" width="1000" height="1000"/>
</template>
<script setup lang="ts">
import {ref, onMounted} from "@vue/runtime-core"
import { Engine, Scene, Vector3, MeshBuilder, StandardMaterial, Color3, HemisphericLight, ArcRotateCamera, SceneLoader, PointerDragBehavior } from "@babylonjs/core"
import "@babylonjs/loaders"

const createScene = (canvas: HTMLCanvasElement | null) => {
  const engine = new Engine(canvas)
  const scene = new Scene(engine)

  const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2, 10, new Vector3(0, 0, -5), scene)
  camera.attachControl(canvas, true)

  new HemisphericLight("light", Vector3.Up(), scene)

  const ground = MeshBuilder.CreateGround("ground", { width: 50, height: 50, subdivisions: 10 }, scene)
  const gridMaterial = new StandardMaterial("gridMaterial", scene)
  gridMaterial.wireframe = true // Render the ground as wireframe
  gridMaterial.diffuseColor = new Color3(0.25, 0.75, 0.75) // custom color
  gridMaterial.alpha = 0.5 // Adjust transparency
  ground.material = gridMaterial

  SceneLoader.ImportMesh("", "../../public/models/5g_tower/", "scene.gltf", scene, (meshes) => {
    meshes.forEach((mesh) => {
      mesh.position = new Vector3(0, 0, -5)

      // Create a drag behavior instance for each mesh
      const dragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 1, 0) })
      dragBehavior.useObjectOrientationForDragging = false
      mesh.addBehavior(dragBehavior)

      // Event listener for drag behavior
      dragBehavior.onDragStartObservable.add(() => {
        console.log('Drag started')
      })
      dragBehavior.onDragObservable.add((event) => {
        console.log('Dragging', event.delta)
      })
      dragBehavior.onDragEndObservable.add(() => {
        console.log('Drag ended')
      })
    })
  })

  engine.runRenderLoop(() => {
    scene.render()
  })
}

const bjsCanvas = ref<HTMLCanvasElement | null>(null)
onMounted(() => {
  if (bjsCanvas.value) {
    createScene(bjsCanvas.value)
  }
})
</script>
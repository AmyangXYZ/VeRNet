# VeRNet: Vue.js Real-time Network Emulator

<img height="120" src="./logo.png"/>

[VeRNet](https://vernet.app) is an open-source wireless network emulator built with Vue.js+TypeScript. It offers high-fidelity real-time network simulations with smooth animations.


<img src="./screenshot.png"/>


<!-- ## Features 

- Real distributed network: each network node is an isolated Web worker
- 3D topology with packet animations and support online editting (draggable nodes)
- Packet sniffer and filtering
- Communication schedule construction and execution -->

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

# VeRNet Development Guide

## Overview and Functions
VeRNet offers a variety of user functions. It serves as a real-time network emulator, and can model a variety of network types. There are a handful of presets to choose from, each of which display a different three-dimensional network topology on the screen.

From there, the network can be manipulated to fit the user's specific requirements. Any nodes, end systems, flows and connections can be added, and then the packet simulation is started. 

During the simulation, packets can be seen flowing from node to node, and there is a packet tracking table to show packet-specific details, like source, destination and type. 

## Project Layout
The project's logic is housed in the `src` directory, with `core` containing the core elements of the network simulation - the `network` object and the `node` objects that make it up. This is also where the node and network types are defined.

Most of the project's visuals are contained in the `components` directory. Each Vue file is its own component, e.g. the panel on screen that shows a mini-map of the network. This is combined with the `views` directory, which contains the base views that hold these components.

The `utils` and `hooks` directories hold TypeScript files that serve as "helpers" for the Vue components and core classes. As an example, `useDrawTopology.ts` holds all the ThreeJS logic to draw the network topologies and builds objects that are used by other classes.

The `assets` and `toplogies` directories hold image/vector assets and JSON topology layouts respectively. These are not logical in and of themselves, but hold static information that's used in the directories mentioned above.

Finally, the 3D models that are used to represent nodes in the network simulation are stored as `.gltf` files in the `public/models` directory. They are stored in `public` rather than `src` due to the scope of the files that ThreeJS can read.

## Backend Logic and Execution Process
This is the sequence of actions that takes place in the `main` section of `useDrawTopology` when the site is accessed and a preset is loaded:

- `setCamera()` - sets the camera's position and view angle to their defaults, where it's looking at the scene from above.
- `addLights()` - adds ambient lighting and a shadow-casting spotlight effect from above.
- `drawGround()` - draws the `ThreeJS` plane with size proportional to the preset network grid. This allows objects to be placed on a surface.
- `animate()` - calculates the positions and timings of the packets that will be sent from node to node, and adds them to the plane. The animation will play when the use starts the simulation.
- `await loadGLTFModels()` - There are 11 different 3D models that need to be loaded into the scene. This asynchronous function fetches the `.gltf` files, rotates and scales them, and adds them to the `modelTemplates` list. 
- `Network.LoadTopology()` - this is called on `Network`, our instance of the `NetworkHub` class. Depending on which topology is selected (random or preset), the function generates/fetches the positions and types of every node in the network, and adds them to the `Nodes` collection to be used later.
- `drawNodes()` - traverses the `modelTemplates` list, and adds a label and drag box to each template before placing them into the scene.
- `createDragControls()` - gives the user the ability to drag the nodes to any position on the plane they wish. It also has event listeners that will update the links and packets based on the nodes' new positions.
- `Network.EstablishConnection()` - establishes links and connections between nodes based on node type (TSCH, TSN, 5G) using a K-D Tree and K-nearest neighbors.
- `drawLinks()` - draws an arc-shaped line between any two nodes that share a link established in the previous function call. Based on the link type, the line is either dashed (wireless) or solid (wired).
- `Network.ConstructRoutingGraph()` - builds an adjacency list of nodes based on the current state of the network's links. This will be useful for future functions.
- `Network.AddFlows(3)` - Generates a specified number of random flows between end systems in the network, to be displayed in the Flows panel (source node, destination node, path between them, etc.). 
- `Network.StartWebWorkers()` - starts a web worker (background process) for each node in the network, to collect real-time packet and flow data to be displayed.


## Tutorial for Protocol Design and Evaluation


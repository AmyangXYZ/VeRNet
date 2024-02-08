# VeRNet: Vue.js Real-time Network Emulator

<img height="120" src="./logo.png"/>

[VeRNet](https://vernet.app) is an open-source wireless network emulator built with Vue.js+TypeScript. It offers high-fidelity real-time network emulations with smooth animations.


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

From there, the network can be manipulated to fit the user's specific requirements. Any nodes, end systems, flows and connections can be added, and then the packet emulation is started. 

During the emulation, packets can be seen flowing from node to node, and there is a packet tracking table to show packet-specific details, like source, destination and type. 

## Project Layout
The project's logic is housed in the `src` directory, with `core` containing the core elements of the network emulation - the `network` object and the `node` objects that make it up. This is also where the node and network types are defined.

Most of the project's visuals are contained in the `components` directory. Each Vue file is its own component, e.g. the panel on screen that shows a mini-map of the network. This is combined with the `views` directory, which contains the base views that hold these components.

The `utils` and `hooks` directories hold TypeScript files that serve as "helpers" for the Vue components and core classes. As an example, `useDrawTopology.ts` holds all the ThreeJS logic to draw the network topologies and builds objects that are used by other classes.

The `assets` and `toplogies` directories hold image/vector assets and JSON topology layouts respectively. These are not logical in and of themselves, but hold static information that's used in the directories mentioned above.

Finally, the 3D models that are used to represent nodes in the network emulation are stored as `.gltf` files in the `public/models` directory. They are stored in `public` rather than `src` due to the scope of the files that ThreeJS can read.

## Backend Logic and Execution Process
`Node` class
- `constructor()` - registers message handlers for each different type of message.
- `Run()` - when information is received, its type (message or packet) is determined and the information is added to the queue of message handlers or packet handlers accordingly.
- Handlers - each of the methods below work with a different type of message/packet. They add the messages/packets to their respective queues and post messages with any payloads.
  - `registerMsgHandler(type: number, handler: MsgHandler)`
  - `registerPktHandler(type: number, handler: MsgHandler)`
  - `initMsgHandler(msg: Message)`
  - `routingMsgHandler(msg: Message)`
  - `statsSubscribeHandler(msg: Message)`
  - `asnMsgHandler(msg: Message)`
  - `dataPktHandler(pkt: Packet)`
- `action()` - when called, pops the first packet available from the queue, posts its message, and increments a packet counter.

`NetworkHub` class
- `constructor()` - initializes instance data (i.e. lists of nodes/flows, K-D Trees), loads `.json` topologies into a list, and has several `watch()` calls to wait for the user to perform certain actions.
- `handleMsg(msg: Message)` - handles messages from each node on the control plane, whether it's a `DONE` confirmation or a status report.
- `handlePkt(pkt: Packet)` - assigns each packet a protocol type and places each one in the corresponding collection.
- `clearNodes()` - Terminates all nodes' web workers, and clears the lists of links and nodes.
- `LoadTopology()` - Depending on which topology is selected (random or preset), the function generates/fetches the positions and types of every node in the network, and adds them to the `Nodes` collection to be used later.
- `EstablishConnection()` - establishes links and connections between nodes based on node type (TSCH, TSN, 5G) using a K-D Tree and K-nearest neighbors.
- `connect(v1: number, v2: number)` - unlike `EstablichConnection`, adds a link between two user-specified nodes. The user can override the typical constraints placed on different node types.
- `StartWebWorkers()` - starts a web worker (background process) for each node in the network, to collect real-time packet and flow data to be displayed.
- `AddNode(type: number)` - adds a randomly positioned node to the list of nodes.
- `AddLink(v1: number, v2: number)` - creates a wired or wireless link between two nodes and adds the link object to the list of links.
- `ConstructRoutingGraph()` - builds an adjacency list of nodes based on the current state of the network's links. This will be useful for future functions.
- `findPath(srcId: number, dstId: number)` - uses Dijkstra's Algorithm to find the shortest path in the network between the two specified nodes, assuming their IDs are valid.
- `AddFlows(num_flows: number)` - Generates a specified number of random flows between end systems in the network, to be displayed in the Flows panel (source node, destination node, path between them, etc.). 
- `Run()` - starts the emulation and starts the ASN timer.
- `Step()` - increments the ASN value while logging the result.
- `Pause()` - pauses the emulation by setting `this.Running` to `false`.
- `Reset()` - clears all timers and packets from the emulation.

This is the sequence of actions that takes place in the `main` section of `useDrawTopology` when the site is accessed and a preset is loaded:
- `setCamera()` - sets the camera's position and view angle to their defaults, where it's looking at the scene from above.
- `addLights()` - adds ambient lighting and a shadow-casting spotlight effect from above.
- `drawGround()` - draws the `ThreeJS` plane with size proportional to the preset network grid. This allows objects to be placed on a surface.
- `animate()` - calculates the positions and timings of the packets that will be sent from node to node, and adds them to the plane. The animation will play when the use starts the emulation.
- `await loadGLTFModels()` - There are 11 different 3D models that need to be loaded into the scene. This asynchronous function fetches the `.gltf` files, rotates and scales them, and adds them to the `modelTemplates` list. 
- `Network.LoadTopology()` - this is called on `Network`, our instance of the `NetworkHub` class. 
- `drawNodes()` - traverses the `modelTemplates` list, and adds a label and drag box to each template before placing them into the scene.
- `createDragControls()` - gives the user the ability to drag the nodes to any position on the plane they wish. It also has event listeners that will update the links and packets based on the nodes' new positions.
- `Network.EstablishConnection()`
- `drawLinks()` - draws an arc-shaped line between any two nodes that share a link established in the previous function call. Based on the link type, the line is either dashed (wireless) or solid (wired).
- `Network.ConstructRoutingGraph()`
- `Network.AddFlows(num_flows: number)`
- `Network.StartWebWorkers()`


## Tutorial for Protocol Design and Evaluation
Here's how you can add your own protocol to VeRNet with node types and network constraints:
In `public/models/`, add a new folder that has a `.gltf` model with any required textures/shading for the new protocol. Name the folder the same as the name of the protocol.

In `src/core/nodes/`:
1. Create a new file, and name it `[name of protocol].ts`.
2. Inside that `.ts` file, add the following code, replacing the bracketed text with the name of the protocol:
  ```
  import { Node } from '../node'

  class [name of protocol]Node extends Node {
    constructor() {
      super()
    }
  }

  new [name of protocol]Node().Run()
  ```

In `src/core/typedefs/index.ts`:
1. Add the new protocol to `PROTOCOL_TYPE`.

In `src/core/typedefs/node.ts`:
1. Add the new node type to the `NODE_TYPE` enum.
2. Add the desired display name to the `NODE_TYPE_DISPLAY_NAME` map.

In `src/core/network.ts`:
1. Declare a new `KDTree` object for the new node type before the constructor, and name it accordingly (e.g. the `TSCH` node's tree is `kdTreeTSCH`).
2. In the `constructor()` method, instantiate the new K-D Tree: `this.[name] = new KDTree()`.
3. In `handlePkt(pkt: Packet)`:
  - Check if the type of the packet's MAC source or destination is equal to the new protocol's node type. If it is, set the packet's protocol type to the new protocol. See the tests for TSCH and TSN as an example.
  - Add a case for `PROTOCOL_TYPE.[protocol name]`. Inside it, set `isValid` to `true`.
4. In `EstablishConnection()`:
  - Re-instantiate the K-D Tree for the new protocol (same code as step 2).
  - In the first `for` loop's `switch` statement, add a case for the new protocol. Inside the case, write `this.[KDTree name].Insert(new KDNode(n.id, n.pos))`
  - In the second `for` loop's `switch` statement, add a case for the new protocol. Inside the case, use `KDTree.FindKNearest()` to find the appropriate neighbors for the new protocol's nodes. Tweak the arguments based on the number of desired neghbors and the desired range. Be sure to add curly braces around the code block in the switch statement to avoid linter errors.
5. In `StartWebWorkers()`, add a new case in the `switch` statement for the new protocol. Inside the case, create a new `WebWorker` as follows: `n.w = new Worker(new URL('@/core/nodes/[protocol name].ts', import.meta.url), { type: 'module' })`.


In `src/hooks/useDrawTopology.ts`:
1. Inside `loadGLTFModels()`, add the following line to the section where the rest of the models are loaded: `await loadModel(NODE_TYPE.[node name], '/models/[protocol name]/scene.gltf', scale, rotation)`.
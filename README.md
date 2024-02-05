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

Finally, the 3D models that are used to represent nodes in the network simulation are stored as `.gltf` files in the `public/models` directory. The reason they are stored in `public` rather than `src` is due to the scope of the files that ThreeJS can read.

## Backend Logic and Execution Process


## Tutorial for Protocol Design and Evaluation


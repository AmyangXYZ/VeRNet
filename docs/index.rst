.. vernet documentation master file, created by
   sphinx-quickstart on Mon Mar  4 14:00:42 2024.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

VeRNet: Vue.js Real-time Network Emulator
===========================================

.. image:: ../logo.png
   :height: 120
   :target: https://vernet.app

VeRNet is an open-source wireless network emulator built with Vue.js+TypeScript. It offers high-fidelity real-time network emulations with smooth animations.

.. image:: ../screenshot.png

Project Setup
-------------

.. code-block:: shell

   npm install

Compile and Hot-Reload for Development
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: shell

   npm run dev

Type-Check, Compile and Minify for Production
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: shell

   npm run build

Lint with `ESLint <https://eslint.org/>`_
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: shell

   npm run lint

VeRNet Development Guide
-------------------------

Overview and Functions
~~~~~~~~~~~~~~~~~~~~~~

VeRNet offers a variety of user functions. It serves as a real-time network emulator, and can model a variety of network types. There are a handful of presets to choose from, each of which display a different three-dimensional network topology on the screen.

From there, the network can be manipulated to fit the user's specific requirements. Any nodes, end systems, flows and connections can be added, and then the packet emulation is started.

During the emulation, packets can be seen flowing from node to node, and there is a packet tracking table to show packet-specific details, like source, destination and type.

Project Layout
~~~~~~~~~~~~~~

The project's logic is housed in the ``src`` directory, with ``core`` containing the core elements of the network emulation - the ``network`` object and the ``node`` objects that make it up. This is also where the node and network types are defined.

Most of the project's visuals are contained in the ``components`` directory. Each Vue file is its own component, e.g. the panel on screen that shows a mini-map of the network. This is combined with the ``views`` directory, which contains the base views that hold these components.

The ``utils`` and ``hooks`` directories hold TypeScript files that serve as "helpers" for the Vue components and core classes. As an example, ``useDrawTopology.ts`` holds all the ThreeJS logic to draw the network topologies and builds objects that are used by other classes.

The ``assets`` and ``topologies`` directories hold image/vector assets and JSON topology layouts respectively. These are not logical in and of themselves, but hold static information that's used in the directories mentioned above.

Finally, the 3D models that are used to represent nodes in the network emulation are stored as ``.gltf`` files in the ``public/models`` directory. They are stored in ``public`` rather than ``src`` due to the scope of the files that ThreeJS can read.

Backend Logic and Execution Process
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Node`` class
+++++++++++++++ 

- ``constructor()`` - registers message handlers for each different type of message.
- ``Run()`` - when information is received, its type (message or packet) is determined and the information is added to the queue of message handlers or packet handlers accordingly.
- Handlers - each of the methods below work with a different type of message/packet. They add the messages/packets to their respective queues and post messages with any payloads.
  - ``registerMsgHandler(type: number, handler: MsgHandler)``
  - ``registerPktHandler(type: number, handler: MsgHandler)``
  - ``initMsgHandler(msg: Message)``
  - ``routingMsgHandler(msg: Message)``
  - ``statsSubscribeHandler(msg: Message)``
  - ``asnMsgHandler(msg: Message)``
  - ``dataPktHandler(pkt: Packet)``
- ``action()`` - when called, pops the first packet available from the queue, posts its message, and increments a packet counter.

``NetworkHub`` class
+++++++++++++++++++++ 

- ``constructor()`` - initializes instance data (i.e. lists of nodes/flows, K-D Trees), loads `.json` topologies into a list, and has several `watch()` calls to wait for the user to perform certain actions.
- ``handleMsg(msg: Message)`` - handles messages from each node on the control plane, whether it's a `DONE` confirmation or a status report.
- ``handlePkt(pkt: Packet)`` - assigns each packet a protocol type and places each one in the corresponding collection.
- ``clearNodes()`` - Terminates all nodes' web workers, and clears the lists of links and nodes.
- ``LoadTopology()`` - Depending on which topology is selected (random or preset), the function generates/fetches the positions and types of every node in the network, and adds them to the ``Nodes`` collection to be used later.
- ``EstablishConnection()`` - establishes links and connections between nodes based on node type (TSCH, TSN, 5G) using a K-D Tree and K-nearest neighbors.
- ``connect(v1: number, v2: number)`` - unlike ``EstablichConnection``, adds a link between two user-specified nodes. The user can override the typical constraints placed on different node types.
- ``StartWebWorkers()`` - starts a web worker (background process) for each node in the network, to collect real-time packet and flow data to be displayed.
- ``AddNode(type: number)`` - adds a randomly positioned node to the list of nodes.
- ``AddLink(v1: number, v2: number)`` - creates a wired or wireless link between two nodes and adds the link object to the list of links.
- ``ConstructRoutingGraph()`` - builds an adjacency list of nodes based on the current state of the network's links. This will be useful for future functions.
- ``findPath(srcId: number, dstId: number)`` - uses Dijkstra's Algorithm to find the shortest path in the network between the two specified nodes, assuming their IDs are valid.
- ``AddFlows(num_flows: number)`` - Generates a specified number of random flows between end systems in the network, to be displayed in the Flows panel (source node, destination node, path between them, etc.).
- ``Run()`` - starts the emulation and starts the ASN timer.
- ``Step()`` - increments the ASN value while logging the result.
- ``Pause()`` - pauses the emulation by setting ``this.Running`` to ``false``.
- ``Reset()`` - clears all timers and packets from the emulation.

This is the sequence of actions that takes place in the ``main`` section of ``useDrawTopology`` when the site is accessed and a preset is loaded:
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ 
- ``setCamera()`` - sets the camera's position and view angle to their defaults, where it's looking at the scene from above.
- ``addLights()`` - adds ambient lighting and a shadow-casting spotlight effect from above.
- ``drawGround()`` - draws the ``ThreeJS`` plane with size proportional to the preset network grid. This allows objects to be placed on a surface.
- ``animate()`` - calculates the positions and timings of the packets that will be sent from node to node, and adds them to the plane. The animation will play when the use starts the emulation.
- ``await loadGLTFModels()``


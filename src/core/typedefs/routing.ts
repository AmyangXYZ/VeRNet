export interface RoutingGraph {
  [id: number]: number[]
}

export interface RoutingTable {
  [id: number]: number
}

export enum ADDR {
  BROADCAST = -1
}

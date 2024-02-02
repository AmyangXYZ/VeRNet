// the global network schedule
export interface Cell {
  slot: number
  type: number
  mac_src: number
  mac_dst: number
  flow_id: number
  flow_k: number
  flow_h: number
}

export enum CELL_TYPE {
  DATA,
  MGMT
}

export interface Link {
  // undirected for visualization
  uid: number // cantor pairing, uid=0.5*(v1+v2)*(v1+v2+1)+v2
  v1: number
  v2: number
  type: number
}

export enum LINK_TYPE {
  WIRED,
  WIRELESS
}

// Packet is transfered among nodes, at data-link layer
export interface Packet {
  uid: number
  protocol: string
  type: number
  e2e_src: number
  e2e_dst: number
  mac_src: number
  mac_dst: number
  asn: number
  len: number
  payload: any

  // for display on packet sniffer
  id: number
  children: any
}

export type PktHandler = (pkt: Packet) => void

export enum PKT_TYPE {
  DATA
}

import type { Flow } from './flow'
import type { RoutingTable } from './routing'
import type { NodeStats } from './stats'

// Message is used for direct communication (debug, cmd, stats) between nodes and controller
export interface Message {
  type: number
  payload: any
}

export type MsgHandler = (msg: Message) => void

export enum MSG_TYPE {
  INIT,
  ASN,
  DONE, // finished all activities of the current slot
  ROUTING,
  FLOW, // install periodic flow
  STATS_SUBSCRIBE,
  STATS_REPORT
}

export interface InitMsgPayload {
  id: number
  neighbors: number[]
}

export interface ASNMsgPayload {
  asn: number
}

export type RoutingMsgPayload = RoutingTable

export interface FlowMsgPayload {
  flows: Flow[]
}

export interface StatsSubscribePayload {
  flag: boolean // start or end
}

export type StatsReportPayload = NodeStats

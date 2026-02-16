export type OracleNodeId = "A" | "B" | "C";

export type NodeStatus = "online" | "offline" | "stale" | "outlier";

export type OracleNode = {
  id: OracleNodeId;
  name: string;
  source: string;
  price: number;
  status: NodeStatus;
  timestamp?: string;
  deviation?: number | null;
};

export type HeatCellStatus = "good" | "warn" | "bad" | "offline";

export type HeatmapCell = {
  nodeId: OracleNodeId;
  /** 1..N where 1 = latest cycle (T-1) */
  cycle: number;
  deviationPct: number;
  status: HeatCellStatus;
};

export type AuditEntry = {
  time: string;
  finalPrice: number;
  txHash: string;
  gasFee: string;
};

export type ConfidenceLevel = "high" | "medium" | "low" | "critical" | "none";

export type OracleConfidence = {
  score: number;
  level: ConfidenceLevel;
};

export type OracleConsensus = {
  reached: boolean;
  onlineNodes: number;
  totalNodes: number;
  threshold: number;
};

export type OracleMetadata = {
  confidence: OracleConfidence;
  consensus: OracleConsensus;
  latency: number;
  staleThresholdMs: number;
  deviationThreshold: number;
};

export type OracleState = {
  nodes: OracleNode[];
  aggregatedPrice: number;
  onChainPrice: number;
  isSynced: boolean;
  updatedAt: Date;
  cycles: HeatmapCell[];
  audit: AuditEntry[];
  oracle?: OracleMetadata;
};

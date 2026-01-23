export type OracleNodeId = "A" | "B" | "C";

export type OracleNode = {
  id: OracleNodeId;
  name: string;
  source: string;
  price: number;
  status: "online" | "offline";
};

export type HeatCellStatus = "good" | "warn" | "bad";

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

export type OracleState = {
  nodes: OracleNode[];
  aggregatedPrice: number;
  onChainPrice: number;
  isSynced: boolean;
  updatedAt: Date;
  cycles: HeatmapCell[];
  audit: AuditEntry[];
};

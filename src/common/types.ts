export interface IMPInputs {
  gridCI: number;
  memCoeff: number;
  netCoeff: number;
  data: PluginParams[];
}

export interface SystemInfo {
  'cpu/thermal-design-power': number;
  'cpu/cores': number;
  duration: number;
}

export type PluginParams = {
  [key: string]: string | number;
};

// Define types for your metrics
export interface CarbonMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  network: number;
  netCoeff: number;
  memCoeff: number;
  memEnergy: number;
  netEnergy: number;
  'cpu/factor': number;
  cores: number;
  cpu_tdp: number;
  'cpu/energy/Ws': number;
  'gpu/energy/Ws': null | number;
  cpuEnergy: number;
  gpuEnergy: null | number;
  energy_kWh: number;
  op_carbon_gCO2eq: number;
}

export type PrometheusSeries = {
  metric: Record<string, string>; // metadata about the metric
  values: [timestamp: string, value: string][];
};

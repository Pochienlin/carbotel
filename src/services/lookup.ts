// This includes a lookup function to find cpu name, tdp (using sqlite db in ../db), grid ci
import * as si from 'systeminformation';
import { getTDP, getCountryGridCI } from '../db/dbService';
import { common } from '../common/formatter';

export class StatFinder {
  cpu_model: string;
  gpu_model: string | null;
  total_cores: number;
  vcpus_allocated: number;
  cpu_tdp: number | null;
  gridCI: number | null;

  static async create(): Promise<StatFinder> {
    const finder = new StatFinder();
    await finder.getProcessors();
    return finder;
  }

  private constructor() {
    this.cpu_model = 'unknown';
    this.gpu_model = 'unknown';
    this.total_cores = 4;
    this.vcpus_allocated = 4;
    this.cpu_tdp = null;
    this.gridCI = null;
  }
  // Currently usage is only retrievable for Nvidia GPUs through otel-prom. Since it already has wattage estimation, we will not estimate ourselves.
  async getProcessors(): Promise<void> {
    try {
      const cpu_data = await si.cpu();
      if (cpu_data) {
        console.log(`------- cpu model: ${JSON.stringify(cpu_data)}------`);

        if (common.cpu_model) {
          this.cpu_model = common.cpu_model;
        } else {
          this.cpu_model =
            this.normalize(cpu_data.model) ||
            this.normalize(`${cpu_data.vendor} ${cpu_data.brand}`);
        }
        // console.log(`-----------cpu model: ${this.cpu_model} backup ${`${cpu_data.vendor} ${cpu_data.brand}`}----------`)
        this.cpu_tdp = getTDP(this.cpu_model) ?? 65;

        if (!common.gridCI) {
          common.gridCI = getCountryGridCI(common.location) ?? 500;
        }

        this.total_cores = cpu_data.physicalCores ?? this.total_cores;
        this.vcpus_allocated = cpu_data.performanceCores ?? this.total_cores;
      }
      const gpu_data = await si.graphics();
      // console.log(gpu_data)
      const controller = gpu_data.controllers[0] ?? null;
      if (controller) {
        const normalizedModel = this.normalize(controller.model);
        const searchPattern = `%${normalizedModel}%`;
        // console.log(searchPattern);
        this.gpu_model = searchPattern;
      }
    } catch (error) {
      console.error('Error fetching processor info:', error);
    }
  }

  normalize(str: string): string {
    return str
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }
}

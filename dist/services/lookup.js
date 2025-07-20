"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatFinder = void 0;
// This includes a lookup function to find cpu name, tdp (using sqlite db in ../db), grid ci
const si = __importStar(require("systeminformation"));
const dbService_1 = require("../db/dbService");
const formatter_1 = require("../common/formatter");
class StatFinder {
    static async create() {
        const finder = new StatFinder();
        await finder.getProcessors();
        return finder;
    }
    constructor() {
        this.cpu_model = 'unknown';
        this.gpu_model = 'unknown';
        this.total_cores = 4;
        this.vcpus_allocated = 4;
        this.cpu_tdp = null;
        this.gridCI = null;
    }
    // Currently usage is only retrievable for Nvidia GPUs through otel-prom. Since it already has wattage estimation, we will not estimate ourselves.
    async getProcessors() {
        try {
            const cpu_data = await si.cpu();
            if (cpu_data) {
                console.log(`------- cpu model: ${JSON.stringify(cpu_data)}------`);
                if (formatter_1.common.cpu_model) {
                    this.cpu_model = formatter_1.common.cpu_model;
                }
                else {
                    this.cpu_model =
                        this.normalize(cpu_data.model) ||
                            this.normalize(`${cpu_data.vendor} ${cpu_data.brand}`);
                }
                // console.log(`-----------cpu model: ${this.cpu_model} backup ${`${cpu_data.vendor} ${cpu_data.brand}`}----------`)
                this.cpu_tdp = (0, dbService_1.getTDP)(this.cpu_model) ?? 65;
                if (!formatter_1.common.gridCI) {
                    formatter_1.common.gridCI = (0, dbService_1.getCountryGridCI)(formatter_1.common.location) ?? 500;
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
        }
        catch (error) {
            console.error('Error fetching processor info:', error);
        }
    }
    normalize(str) {
        return str
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9]/g, '');
    }
}
exports.StatFinder = StatFinder;

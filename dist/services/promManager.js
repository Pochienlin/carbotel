"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsageMetrcis = getUsageMetrcis;
exports.pushToProm = pushToProm;
const axios_1 = __importDefault(require("axios"));
const formatter_1 = require("../common/formatter");
const pushgateway_url = formatter_1.common.pushgatewayURL;
// QUERIES
//      TO DO: replace path with env set so that prom port can become configurable
const endpoint = `${formatter_1.common.prometheusURL}/api/v1/query_range?query=`;
// query for CPU% used between the given time interval, aggregated by step where step >5m
const getCPU = (startTime, endTime, step) => {
    const query = `avg by(instance) (1 - rate(system_cpu_time_seconds_total{state="idle"}[${step}]))`;
    return `${endpoint}${encodeURIComponent(query)}&start=${startTime}&end=${endTime}&step=${step}`;
};
// query for network bytes in and out between time interval, aggregated by step where step>5m
const getNetwork = (startTime, endTime, step) => {
    const query = `sum(increase(system_network_io_bytes_total[${step}]))`;
    return `${endpoint}${encodeURIComponent(query)}&start=${startTime}&end=${endTime}&step=${step}`;
};
// query for snapshot of memory usage within time period, aggregated by step where step>5m
const getMemory = (startTime, endTime, step) => {
    const query = 'system_memory_usage_bytes';
    return `${endpoint}${encodeURIComponent(query)}&start=${startTime}&end=${endTime}&step=${step}`;
};
const getGPU = (startTime, endTime, step) => {
    const query = `avg by (gpu) (rate(nvidia_gpu_power_usage_watts[${step}]))`;
    return `${endpoint}${encodeURIComponent(query)}&start=${startTime}&end=${endTime}&step=${step}`;
};
// axios call abstraction
async function fetchMetric(query) {
    const response = await axios_1.default.get(query);
    if (response.data.status === 'success') {
        return response.data.data.result;
    }
    else {
        throw new Error('Prometheus query failed');
    }
}
function mergeMetrics(cpuData, memData, netData, gpuData) {
    const mergedMap = new Map();
    const addToMap = (data, key) => {
        for (const series of data) {
            for (const [timestamp, value] of series.values) {
                const ts = new Date(Number(timestamp) * 1000).toISOString(); // convert to ISO timestamp
                const existing = mergedMap.get(ts) || { timestamp: ts };
                existing[key] = parseFloat(value);
                mergedMap.set(ts, existing);
            }
        }
    };
    addToMap(cpuData, 'cpu');
    addToMap(memData, 'memory');
    addToMap(netData, 'network');
    addToMap(gpuData, 'gpuWatts');
    // Convert Map to sorted array
    return Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
/* NOTE: CPU result is an average among all cores.
        TO GET CPU ENERGY:
            1. put through Spline interpolation to map through power consumpion curve (% TDP)
            2. multiply by TDP (kWh) to get average energy per core (kWh/core)
            3. multiply by number of cores (kWh)
    Memory is in bytes. TO GET MEM ENERGY multiply by 10^-9 to get GB, then multiply by coefficient avg kWh/GB to get kWh energy spent
    Network is also in bytes. TO GET NET ENERGY multiply by 10^-9 to get GB, then multiply by coefficient avg kWh/GB to get kWh energy spent
*/
async function getUsageMetrcis(startTime, endTime, step) {
    const CPU_res = await fetchMetric(getCPU(startTime, endTime, step));
    const mem_res = await fetchMetric(getMemory(startTime, endTime, step));
    const net_res = await fetchMetric(getNetwork(startTime, endTime, step));
    const gpu_res = await fetchMetric(getGPU(startTime, endTime, step));
    // map the output to cpu, memory and network attribuets
    // console.log(`
    // CPU result: ${JSON.stringify(CPU_res,null,2)}
    // memory result: ${JSON.stringify(mem_res,null,2)}
    // network result: ${JSON.stringify(net_res,null,2)}
    // `)
    return mergeMetrics(CPU_res, mem_res, net_res, gpu_res);
}
// ^^ This function is meant to be used by the impWriter to populate the template and run the child process.
// Putting it here because it feels that impWriter should be focused on read/ write, more of a controller/ orchestrator than system logic?
// It do be somewhat weird to call between service layers. Alternative, which actually feels more sensible, is to let index handle metrics and pass to impWriter so services don't need to import each other
/** CREDIT: the following is written with the help of Claude AI
 * Pushes metrics to Prometheus Pushgateway
 * @param metrics Array of carbon metrics to push to Prometheus
 * @param jobName Name of the job these metrics are associated with
 * @param instance Instance identifier (e.g., hostname, container ID)
 * @param pushgatewayUrl URL of the Prometheus Pushgateway
 */
async function pushCarbonMetric(metrics, jobName, instance, pushgatewayUrl = 'http://localhost:9091') {
    // if (!metrics.length) {
    //   console.warn('No metrics to push');
    //   return;
    // }
    // for (let i=0; i<metrics.length; ++i){
    //     // We'll use the latest metrics for this example
    //     const current = metrics[i];
    // Format metrics in Prometheus exposition format
    // See: https://prometheus.io/docs/instrumenting/exposition_formats/
    let prometheusData = '';
    // Energy metrics
    prometheusData += `# HELP carbon_energy_kwh Total energy usage in kWh\n`;
    prometheusData += `# TYPE carbon_energy_kwh gauge\n`;
    prometheusData += `carbon_energy_kwh{source="memory"} ${metrics.memEnergy}\n`;
    prometheusData += `carbon_energy_kwh{source="network"} ${metrics.netEnergy}\n`;
    prometheusData += `carbon_energy_kwh{source="cpu"} ${metrics.cpuEnergy ?? 0}\n`;
    prometheusData += `carbon_energy_kwh{source="gpu"} ${metrics.gpuEnergy ?? 0}\n`;
    prometheusData += `carbon_energy_kwh{source="total"} ${metrics.energy_kWh}\n`;
    // Carbon emissions
    prometheusData += `# HELP carbon_emissions_gco2eq Carbon emissions in gCO2eq\n`;
    prometheusData += `# TYPE carbon_emissions_gco2eq gauge\n`;
    prometheusData += `carbon_emissions_gco2eq ${metrics.op_carbon_gCO2eq}\n`;
    // Resource utilization metrics that can be useful for correlation
    prometheusData += `# HELP carbon_resource_utilization Resource utilization metrics\n`;
    prometheusData += `# TYPE carbon_resource_utilization gauge\n`;
    prometheusData += `carbon_resource_utilization{resource="cpu"} ${metrics.cpu}\n`;
    prometheusData += `carbon_resource_utilization{resource="memory_bytes"} ${metrics.memory}\n`;
    prometheusData += `carbon_resource_utilization{resource="network_bytes"} ${metrics.network}\n`;
    try {
        // Push to the Pushgateway
        const url = `${pushgatewayUrl}/metrics/job/${encodeURIComponent(jobName)}/instance/${encodeURIComponent(instance)}`;
        const response = await axios_1.default.post(url, prometheusData, {
            headers: {
                'Content-Type': 'text/plain',
            },
        });
        console.log(`Metric pushed successfully. Status: ${response.status}`);
    }
    catch (error) {
        console.error('Failed to push metrics to Pushgateway:', error);
        throw error;
    }
}
async function pushToProm(metrics) {
    // Example metrics data (your actual data)
    try {
        const data = metrics;
        await pushCarbonMetric(data, 'carbon_metrics', // Job name
        'node1', // Instance name
        pushgateway_url);
        return metrics;
    }
    catch (error) {
        console.error('Error in main function:', error);
    }
}

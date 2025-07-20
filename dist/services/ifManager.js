"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runIFbyMaps = runIFbyMaps;
// run impact framework builtin as a function for interpolation. Cannot get childprocess method to work nor handle error meaningfully
const interpolation_1 = require("@grnsft/if/build/if-run/builtins/interpolation");
const config_cpu = {
    method: 'spline',
    x: [0, 0.1, 0.5, 1],
    y: [0.12, 0.32, 0.75, 1.02],
    'input-parameter': 'cpu',
    'output-parameter': 'cpu/factor',
};
const parametersMetadata = {};
// ---- Not sure what's missing but I can't coerce ): ------
// const parametersMetadata = {
//     inputs: {
//         description: 'The average CPU utilized at timeblock represented',
//         unit: 'Decimal of CPU (0 to 1 inclusive)',
//         'aggregation-method': {time: 'avg', component: 'avg'}
//     }, outputs: {
//         description: 'The proportion of maximum power output of a CPU core in Watts per core. e.g. 0.75 would mean 0.75 of the cores worth of power',
//         unit: 'cores',
//         'aggregation-method': {time: 'avg', component: 'avg'}
//     }} as PluginParametersMetadata
// ;
const interpolationPlugin_CPU = (0, interpolation_1.Interpolation)(config_cpu, parametersMetadata, {});
async function runProcessorInterpolation(data) {
    try {
        const res_cpu = await interpolationPlugin_CPU.execute(data);
        // const res_gpu = await interpolationPlugin_GPU.execute(res_cpu)
        return res_cpu;
    }
    catch (error) {
        console.error(error);
    }
}
const sumArray = (arr) => {
    const cleaned = arr.filter((val) => val > 0);
    const initVal = 0;
    return cleaned.reduce((a, b) => a + (b ?? 0), initVal);
};
async function runIFbyMaps(inputs) {
    const data = inputs.data;
    const output = (await runProcessorInterpolation(data)) ?? [];
    // Note that memory coefficient is in kWh/GBh, while net energy is in kWh/GB, so we have to * duration in seconds/ 3600 seconds to convert to kWh
    return output
        .map((e) => ({
        timestamp: e.timestamp,
        cpu: e.cpu,
        memory: e.memory,
        network: e.network,
        netCoeff: inputs.netCoeff,
        memCoeff: inputs.memCoeff,
        memEnergy: (((inputs.memCoeff * e.memory) / 1000000000) * e.duration) / 3600,
        netEnergy: (inputs.netCoeff * e.network) / 1000000000,
        'cpu/factor': e['cpu/factor'],
        cores: e['cpu/cores'],
        cpu_tdp: e['cpu/thermal-design-power'],
        'cpu/energy/Ws': e['cpu/factor'] *
            e['cpu/cores'] *
            e['cpu/thermal-design-power'] *
            e['duration'],
        'gpu/energy/Ws': e['gpuWatts'] * e['duration'],
    }))
        .map((e) => ({
        ...e,
        cpuEnergy: e['cpu/energy/Ws'] / (3600 * 1000),
        gpuEnergy: e['gpu/energy/Ws'] / (3600 * 1000),
    }))
        .map((e) => ({
        ...e,
        energy_kWh: sumArray([
            e.cpuEnergy,
            e.memEnergy,
            e.netEnergy,
            e.gpuEnergy,
        ]),
    }))
        .map((e) => ({
        ...e,
        op_carbon_gCO2eq: e.energy_kWh * inputs.gridCI,
    }));
}

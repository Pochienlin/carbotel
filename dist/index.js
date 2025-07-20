"use strict";
// validate data with zod (optional), output to prom manager
Object.defineProperty(exports, "__esModule", { value: true });
const formatter_1 = require("./common/formatter");
const lookup_1 = require("./services/lookup");
const promManager_1 = require("./services/promManager");
const ifManager_1 = require("./services/ifManager");
const main = async () => {
    const finder = await lookup_1.StatFinder.create();
    formatter_1.common.gridCI = finder.gridCI ?? formatter_1.common.gridCI;
    formatter_1.common.startTime = formatter_1.common.startTime ?? formatter_1.timestamps.startTime;
    formatter_1.common.endTime = formatter_1.common.endTime ?? formatter_1.timestamps.endTime;
    const padding = {
        'cpu/cores': finder.vcpus_allocated,
        'cpu/thermal-design-power': finder.cpu_tdp ?? 100,
        duration: (0, formatter_1.stepToSeconds)(formatter_1.common.step),
    };
    let data = await (0, promManager_1.getUsageMetrcis)(formatter_1.common.startTime, formatter_1.common.endTime, formatter_1.common.step);
    data = (0, formatter_1.padInputs)(data, padding);
    const input_imp = {
        gridCI: formatter_1.common.gridCI,
        memCoeff: formatter_1.common.memCoeff,
        netCoeff: formatter_1.common.netCoeff,
        data: data,
    };
    try {
        const res = await (0, ifManager_1.runIFbyMaps)(input_imp);
        await (0, promManager_1.pushToProm)(res[res.length - 1]);
        return res[res.length - 1];
    }
    catch (error) {
        console.error(error);
        throw error;
    }
};
// const sleep = (ms:number) => new Promise(res => setTimeout(res, ms));
const current_time = new Date();
const start_time = new Date();
start_time.setSeconds(-(0, formatter_1.stepToSeconds)(formatter_1.common.step));
const runOnce = async () => {
    console.log(await main());
    console.log(`Last ran on: ${current_time.toUTCString()}, starting from ${start_time.toUTCString()}`);
};
runOnce();

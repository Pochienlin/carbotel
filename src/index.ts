// validate data with zod (optional), output to prom manager

import {
  common,
  timestamps,
  stepToSeconds,
  padInputs,
} from './common/formatter';
import { StatFinder } from './services/lookup';
import { IMPInputs, SystemInfo } from './common/types';
import { getUsageMetrcis, pushToProm } from './services/promManager';
import { runIFbyMaps } from './services/ifManager';

const main = async () => {
  const finder = await StatFinder.create();
  common.gridCI = finder.gridCI ?? common.gridCI;
  common.startTime = common.startTime ?? timestamps.startTime;
  common.endTime = common.endTime ?? timestamps.endTime;

  const padding: SystemInfo = {
    'cpu/cores': finder.vcpus_allocated,
    'cpu/thermal-design-power': finder.cpu_tdp ?? 100,
    duration: stepToSeconds(common.step),
  };

  let data = await getUsageMetrcis(
    common.startTime,
    common.endTime,
    common.step,
  );
  data = padInputs(data, padding);
  const input_imp: IMPInputs = {
    gridCI: common.gridCI,
    memCoeff: common.memCoeff,
    netCoeff: common.netCoeff,
    data: data,
  };
  try {
    const res = await runIFbyMaps(input_imp);
    await pushToProm(res[res.length - 1]);
    return res[res.length - 1];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// const sleep = (ms:number) => new Promise(res => setTimeout(res, ms));
const current_time = new Date();
const start_time = new Date();
start_time.setSeconds(-stepToSeconds(common.step));

const runOnce = async () => {
  console.log(await main());
  console.log(
    `Last ran on: ${current_time.toUTCString()}, starting from ${start_time.toUTCString()}`,
  );
};

runOnce();

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { PluginParams } from './types';
import { SystemInfo } from './types';
export const formatTimeseries = (timeseries: PluginParams[]): string => {
  // turns JSON object into bulleted list for YAML input
  let outstring = '';
  if (timeseries) {
    timeseries.forEach((item) => {
      let skip = 1;
      for (const key in item) {
        if (skip == 1) {
          outstring += `\n        - ${key}: ${item[key]}`;
          ++skip;
        } else {
          outstring += `\n          ${key}: ${item[key]}`;
        }
      }
    });
  } else {
    console.error(`No timeseries provided`);
  }
  // console.log(outstring)
  return outstring;
};
// This dude reads "step" argument, and then spits out the time interval in seconds

export function stepToSeconds(step: string): number {
  const match = step.match(/^(\d+)(ms|s|m|h|d|w|y)$/);
  if (!match) {
    throw new Error(`Invalid step format: ${step}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: { [unit: string]: number } = {
    ms: 1 / 1000,
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
    w: 60 * 60 * 24 * 7,
    y: 60 * 60 * 24 * 365, // assuming non-leap year
  };

  return value * multipliers[unit];
}

// this boi stores config values so that we don't need to keep configuring.
//      Logic here is that we'll have a default config file that we read from. This is a default config file
//      If the user mounts us onto a folder with an overriding config file, we'll replace with those values instead

interface CommonVals {
  step: string;
  location: string;
  gridCI: number;
  memCoeff: number;
  netCoeff: number;
  cpu_model: string;
  startTime?: string;
  endTime?: string;
  prometheusURL?: string;
  pushgatewayURL?: string;
}
export var common = yaml.load(
  fs.readFileSync('carbotel-config.yaml', 'utf-8'),
) as CommonVals;
if (!common.pushgatewayURL) {
  common.pushgatewayURL =
    process.env.PUSHGATEWAY_URL || 'http://localhost:9091';
}

if (!common.prometheusURL) {
  common.prometheusURL = process.env.PROMETHEUS_URL || 'http://localhost:9090';
}

console.log(JSON.stringify(common));
const time_stamp = new Date();
const nowStamp = time_stamp.toISOString();
time_stamp.setMinutes(-10);
const pastStamp = time_stamp.toISOString();
export var timestamps = {
  startTime: pastStamp,
  endTime: nowStamp,
};

export function padInputs(
  timeseries: PluginParams[],
  padding: SystemInfo,
): PluginParams[] {
  return timeseries.map((e) => ({
    cpu: 0,
    memory: 0,
    network: 0,
    ...e,
    ...padding,
  }));
}

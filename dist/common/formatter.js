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
exports.timestamps = exports.common = exports.formatTimeseries = void 0;
exports.stepToSeconds = stepToSeconds;
exports.padInputs = padInputs;
const yaml = __importStar(require("js-yaml"));
const fs = __importStar(require("fs"));
const formatTimeseries = (timeseries) => {
    // turns JSON object into bulleted list for YAML input
    let outstring = '';
    if (timeseries) {
        timeseries.forEach((item) => {
            let skip = 1;
            for (const key in item) {
                if (skip == 1) {
                    outstring += `\n        - ${key}: ${item[key]}`;
                    ++skip;
                }
                else {
                    outstring += `\n          ${key}: ${item[key]}`;
                }
            }
        });
    }
    else {
        console.error(`No timeseries provided`);
    }
    // console.log(outstring)
    return outstring;
};
exports.formatTimeseries = formatTimeseries;
// This dude reads "step" argument, and then spits out the time interval in seconds
function stepToSeconds(step) {
    const match = step.match(/^(\d+)(ms|s|m|h|d|w|y)$/);
    if (!match) {
        throw new Error(`Invalid step format: ${step}`);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = {
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
exports.common = yaml.load(fs.readFileSync('carbotel-config.yaml', 'utf-8'));
if (!exports.common.pushgatewayURL) {
    exports.common.pushgatewayURL =
        process.env.PUSHGATEWAY_URL || 'http://localhost:9091';
}
if (!exports.common.prometheusURL) {
    exports.common.prometheusURL = process.env.PROMETHEUS_URL || 'http://localhost:9090';
}
console.log(JSON.stringify(exports.common));
const time_stamp = new Date();
const nowStamp = time_stamp.toISOString();
time_stamp.setMinutes(-10);
const pastStamp = time_stamp.toISOString();
exports.timestamps = {
    startTime: pastStamp,
    endTime: nowStamp,
};
function padInputs(timeseries, padding) {
    return timeseries.map((e) => ({
        cpu: 0,
        memory: 0,
        network: 0,
        ...e,
        ...padding,
    }));
}

'use strict';
// this manages Impact Framework files,
//      First: Writes out from template the whole pipeline, adds input in
//      Second: Reads output file, returns timeseries json
Object.defineProperty(exports, '__esModule', { value: true });
exports.padInputs = padInputs;
// populates prerequisites before piping through the pipeline
function padInputs(timeseries, padding) {
  return timeseries.map((e) => ({
    cpu: 0,
    memory: 0,
    network: 0,
    ...e,
    ...padding,
  }));
}
// DEFUNCT: not running via impact framework cli anymore-------
// export const writeTemplate = (timeseries: IMPInputs) => {
//     const parsedString: Buffer = fs.readFileSync('./template.yaml')
//     const yamlConfigs = parsedString.toString().replace('%%gridCI%%', timeseries.gridCI.toString())
//         .replace('%%memoryCoefficient%%', timeseries.memCoeff.toString())
//         .replace('%%networkCoefficient%%', timeseries.netCoeff.toString())
//         .replace('%%step%%', stepToSeconds(common.step).toString())
//     const inputData: string = formatTimeseries(timeseries.data)
//     fs.writeFileSync(`input.yaml`, yamlConfigs + inputData)
// }

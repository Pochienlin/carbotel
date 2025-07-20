import { StatFinder } from './services/lookup';
import { getUsageMetrcis } from './services/promManager';

const sysinfo_test = async () => {
  const finder = await StatFinder.create();
  console.log('CPU:', finder.cpu_model);
  console.log('GPU:', finder.gpu_model);
  console.log('Cores:', finder.total_cores);
  console.log('vCPUs:', finder.vcpus_allocated);
};

const getMetricsFromProm = async () => {
  const timeNow = new Date();
  const now_str = timeNow.toISOString();
  timeNow.setMinutes(-10);
  const past_str = timeNow.toISOString();
  const result = await getUsageMetrcis(past_str, now_str, '5m');

  console.log(`
    ---------------
    metrics result
    ---------------
    ${JSON.stringify(result ?? 'No results', null, 2)}
    `);
};

const run_test = () => {
  sysinfo_test();
  getMetricsFromProm();
};

run_test();

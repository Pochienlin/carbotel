import { StatFinder } from "./services/lookup";

const sysinfo_test = async () => {
    const finder = await StatFinder.create();
    console.log("CPU:", finder.cpu_model);
    console.log("GPU:", finder.gpu_model);
    console.log("Cores:", finder.total_cores);
    console.log("vCPUs:", finder.vcpus_allocated);
};

const run_test = () => {
    sysinfo_test(); // ← you were missing these parentheses
};

run_test();

// This includes a lookup function to find cpu name, tdp (using sqlite db in ../db), grid ci
import * as si from 'systeminformation'

export class StatFinder {
    cpu_model: string;
    gpu_model: string | null;
    total_cores: number;
    vcpus_allocated: number;
    static async create(): Promise<StatFinder> {
        const finder = new StatFinder();
        await finder.getProcessors();
        return finder;
    }

    private constructor() {
        this.cpu_model = 'unknown';
        this.gpu_model = 'unknown';
        this.total_cores = 4;
        this.vcpus_allocated = 4;
    }
    
    // constructor() {
    //     this.cpu_model = 'unknown';
    //     this.gpu_model = 'unknown';
    //     this.total_cores = 4;
    //     this.vcpus_allocated = 4;
    //     this.getProcessors();
    // }    

    async getProcessors(): Promise<void>{
        try{
            const cpu_data = await si.cpu()
            if(cpu_data){
                const normalizedVendor = this.normalize(cpu_data.vendor);
                const normalizedBrand = this.normalize(cpu_data.brand);
                const searchPattern = `%${normalizedVendor}%${normalizedBrand}%`;
                console.log(searchPattern);
                this.cpu_model=searchPattern;
                this.total_cores=cpu_data.physicalCores ?? this.total_cores;
                this.vcpus_allocated=cpu_data.performanceCores ?? this.total_cores
                console.log(
                    `cpu model: ${this.cpu_model}
                    total cores: ${this.total_cores}
                    vcpus: ${this.vcpus_allocated}
                    `
                )
            }
            const gpu_data = await si.graphics()
            console.log(gpu_data)
            const controller = gpu_data.controllers[0] ?? null;
            if(controller){
                const normalizedModel = this.normalize(controller.model);
                const searchPattern = `%${normalizedModel}%`;
                console.log(searchPattern);
                this.gpu_model=searchPattern;
            }
        }catch(error){
            console.error("Error fetching processor info:", error);
        }
    }

    normalize(str: string): string {
        return str.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    }

}

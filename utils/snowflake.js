/**
 * 使用方式
 * const snowflake = new Snowflake(device_id);
 * const uid = snowflake.next_id();
 * timestamp 41位，从 2024-01-01 开始运行，能使用69年;
 * device_id 18位，最大支持 262144 个设备;
 * sequence 4位，仓位人工操作，并发数不高，每毫秒16次能够满足需求;
*/

class Snowflake {
    constructor(device_id) {
        this.device_id = device_id;
        this.sequence = 0;
        this.timestamp = 0;
        this.last_timestamp = -1;
    }
    
    next_id() {
        let current_time = Date.now();
        if (current_time < this.last_timestamp) {
            throw new Error('Clock moved backwards!');
        }
        if (current_time === this.last_timestamp) {
            this.sequence = (this.sequence + 1) & 0xF;
            if (this.sequence === 0) {
                current_time = this.wait_next_millis();
            }
        } else {
            this.sequence = 0;
        }
        this.last_timestamp = current_time;  
        const id = (BigInt(current_time - 1704067200000) << 22n) | (BigInt(this.device_id) << 4n) | BigInt(this.sequence);
        return id.toString();
    }
    
    wait_next_millis() {
        let current_time = Date.now();
        while (current_time <= this.last_timestamp) {
            current_time = Date.now();
        }
        return current_time;
    }
}

export default Snowflake
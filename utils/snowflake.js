/**
 * 从 2024-01-01 开始运行
 * 使用方式
 * const snowflake = new Snowflake(device_id);
 * const uid = snowflake.next_id();
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
            this.sequence = (this.sequence + 1) & 0xFFF;
            if (this.sequence === 0) {
                current_time = this.wait_next_millis();
            }
        } else {
            this.sequence = 0;
        }
        this.last_timestamp = current_time;  
        const id = (BigInt(current_time - 1704067200000) << 22n) | (BigInt(this.device_id) << 12n) | BigInt(this.sequence);
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
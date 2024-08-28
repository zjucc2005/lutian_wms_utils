const dev_mode = true;
const logger = {
    dev: (...args) => {
        if (dev_mode) {
            console.log(...args)
        }   
    },
    info: (...args) => {
        console.log(...args)
    }
}
export default logger
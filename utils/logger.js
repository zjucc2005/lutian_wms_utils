import config from "@/config"
const logger = {
    dev: (...args) => {
        // if (config.env == 'dev') {
            console.log(...args)
        // }   
    },
    info: (...args) => {
        console.log(...args)
    }
}
export default logger
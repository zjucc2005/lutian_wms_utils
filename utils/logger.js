import config from "@/config"
const logger = {
    info: (...args) => {
        if (config.log) console.info(...args)
    },
    warn: (...args) => {
        if (config.log) console.warn(...args)
    },
    error: (...args) => {
        if (config.log) console.error(...args)
    }
}
export default logger
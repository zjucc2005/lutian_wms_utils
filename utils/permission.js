/**
 * 获取系统角色
 * @param operator_group:Array
 * @return { String }
 */
const get_system_role = (operator_group=[]) => {
    // return 'wh_admin' // 开发调试
    let wh_admin_list = ['000'] // 绿田库存管理组，成品组
    for (let item of wh_admin_list) {
        if (operator_group.includes(item)) return 'wh_admin'
    }
    let nrj_admin_list = ['112'] // 内燃机库存组，原料组
    for (let item of nrj_admin_list) {
        if (operator_group.includes(item)) return 'nrj_admin'
    }
    let nrj_qm_list = ['106']
    for (let item of nrj_qm_list) {
        if (operator_group.includes(item)) return 'nrj_qm'
    }
    return 'none'
}

export default {
    get_system_role
}
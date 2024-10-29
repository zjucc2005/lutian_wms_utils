/**
 * 获取系统角色
 * @param operator_group:Array
 * @return { String }
 */
const get_system_role = (operator_group=[]) => {
    // return 'wh_admin' // 开发调试
    // == wh_admin ==
    let wh_admin_list = ['绿田仓管组']
    for (let item of wh_admin_list) {
        if (operator_group.includes(item)) return 'wh_admin'
    }
    // == wh_staff ==
    let wh_staff_list = ['绿田库存管理组']
    for (let item of wh_staff_list) {
        if (operator_group.includes(item)) return 'wh_staff'
    }
    // == nrj_admin ==
    let nrj_admin_list = ['内燃机库存组']
    for (let item of nrj_admin_list) {
        if (operator_group.includes(item)) return 'nrj_admin'
    }
    return ''
}

export default {
    get_system_role
}
/**
 * 获取系统角色
 * @param operator_group:Array
 * @return { String }
 */
const get_system_role = (operator_group=[]) => {
    return 'wh_admin' // dev
    // == wh_admin ==
    let wh_admin_list = ['绿田仓管组']
    for (let i in wh_admin_list) {
        if (operator_group.includes(wh_admin_list[i])) return 'wh_admin'
    }
    // == wh_staff ==
    let wh_staff_list = ['绿田库存管理组']
    for (let i in wh_staff_list) {
        if (operator_group.includes(wh_staff_list[i])) return 'wh_staff'
    }
    return ''
}

export default {
    get_system_role
}
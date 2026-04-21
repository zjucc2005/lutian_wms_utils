/**
 * 获取系统角色
 * @param operator_group:Array
 * @return { String }
 */
const get_system_role = (operator_group=[]) => {
    // return 'nrj_admin' // 开发调试
    let role_map = {
        '000': 'wh_admin',  // 绿田库存管理组，成品组
        '102': 'wh_nx',     // 内销组
        '112': 'nrj_admin', // 内燃机库存组，原料组
        '106': 'nrj_qm',    // 内燃机质检组
        '109': 'nrj_pln',   // 内燃机计划组
    }
    for (let k of Object.keys(role_map)) {
        if (operator_group.includes(k)) return role_map[k]
    }
    // let wh_admin_list = ['000'] // 绿田库存管理组，成品组
    // for (let item of wh_admin_list) {
    //     if (operator_group.includes(item)) return 'wh_admin'
    // }
    // if (operator_group.includes('112')) return 'nrj_admin' // 内燃机库存组，原料组
    // if (operator_group.includes('106')) return 'nrj_qm' // 内燃机质检组
    // if (operator_group.includes('102')) return 'wh_nx'  // 内销组
    return 'none'
}

export default {
    get_system_role
}
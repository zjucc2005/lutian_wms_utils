/**
 * 枚举值
 */
class Enum {
    constructor() {}
    
    // BD_物料属性
    static bd_material_properties = {
        1: '外购', 2: '自制', 3: '委外', 4: '特征', 5: '虚拟', 6: '服务', 7: '一次性', 
        9: '配置',10: '资产', 11: '费用', 12: '模型', 13: '产品系列'
    }
    
    // 各仓库库区
    static depot_areas = {
        // 3-材料库
        3539739: [
            { text: '变频机零件区', value: '3LM-BP' },
            { text: '柴油机零件区', value: '3LM-CY' },
            { text: '汽油机零件区', value: '3LM-QY' },
            { text: '包材零件区', value: '3LM-BC' },
            { text: '铝制零件区', value: '3LM-LZ' },
            { text: '面板零件区', value: '3LM-MB' },
            { text: '喷塑零件区', value: '3LM-PS' },
        ],
        // 3-半成品库
        3539741: [
            { text: '机架半成品区', value: '3WIP-JJ' },
            { text: '机架焊接半成品区', value: '3WIP-JH' },
            { text: '面板半成品区', value: '3WIP-MB' },
            { text: '电机半成品区', value: '3WIP-DJ' },
            { text: '喷塑半成品区', value: '3WIP-PS' },
            { text: '喷漆半成品区', value: '3WIP-PQ' },
            { text: '汽油动力半成品区', value: '3WIP-QD' },
            { text: '柴油动力半成品区', value: '3WIP-CD' },
        ],
    }
    static get_area_options (stock_id) {
        return (stock_id && this.depot_areas[stock_id]) ? this.depot_areas[stock_id] : []
    }
}

export default Enum
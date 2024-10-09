import store from '@/store';
import K3CloudApi from '@/utils/k3cloudapi';

/**
 * 前端库存模型
 */
class Inv {
    constructor() {
        
    }
    
    /**
     * 获取库存列表
     * @param options:Hash 参数集
     *   @field FID:Integer 主键ID
     *   @field FStockId:Integer 仓库
     *   @field FStockLocId.FNumber:String 库位号
     *   @field FBatchNo:String 批次号
     *   @field FMaterialId.FNumber:String 物料编码
     *   @field FMaterialId.FNumber_in:Array 物料编码IN
     *   @field FQty_gt:Integer 库存数大于
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static query(options={}, meta={}) {
        const data = {
            FormId: "PAEZ_C_INV",
            FilterString: []
        }
        if (options.FID) {
            data.FilterString.push({ Left: "", FieldName: "FID", Compare: "67", Value: options.FID, Right: "", Logic: 0 })
        }
        if (options.FStockId) {
            data.FilterString.push({ Left: "", FieldName: "FStockId", Compare: "67", Value: options.FStockId, Right: "", Logic: 0 })
        }
        if (options['FStockLocId.FNumber']){
            data.FilterString.push({ Left: "", FieldName: "FStockLocId.FNumber", Compare: "67", Value: options['FStockLocId.FNumber'], Right: "", Logic: 0 })
        }
        if (options.FBatchNo) {
            data.FilterString.push({ Left: "", FieldName: "FBatchNo", Compare: "67", Value: options.FBatchNo, Right: "", Logic: 0 })
        }
        if (options['FMaterialId.FNumber']) {
            data.FilterString.push({ Left: "", FieldName: "FMaterialId.FNumber", Compare: "67", Value: options['FMaterialId.FNumber'], Right: "", Logic: 0 })
        }
        if (options['FMaterialId.FNumber_in']) {
            data.FilterString.push({ Left: "", FieldName: "FMaterialId.FNumber", Compare: "338", Value: options['FMaterialId.FNumber_in'].join(','), Right: "", Logic: 0 })
        }
        if (options['FQty_gt'] || options['FQty_gt'] === 0) {
            data.FilterString.push({ Left: "", FieldName: "FQty", Compare: "21", Value: options['FQty_gt'], Right: "", Logic: 0 })
        }
        if (meta.per_page) {
            data.Limit = meta.per_page
            if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
        }
        if (meta.order) data.OrderString = meta.order
        return K3CloudApi.bill_query(data)
    }
    
    static find(id) {
        return this.query({ FID: id }, { limit: 1 })
    }
    
    /**
     * 获取全部库存列表数据
     * @param options:Hash 参数
     *   @field FStockId:Integer 仓库
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static async get_all(options={}, meta={}) {
        let _meta = { page: 1, per_page: 10000, order: 'FMaterialId.FNumber ASC, FCreateTime ASC', ...meta }
        let sum_data = []
        sum_data = await this._get_all_recurse(options, _meta, sum_data)
        return sum_data
    }
    static async _get_all_recurse(options={}, meta={}, sum_data=[]) {
        const data = {
            FormId: "PAEZ_C_INV",
            // FieldKeys: '',
            FilterString: []
        }
        if (options.FStockId) {
            data.FilterString.push({ Left: "", FieldName: "FStockId", Compare: "67", Value: options.FStockId, Right: "", Logic: 0 })
        }
        data.FilterString.push({ Left: "", FieldName: "FQty", Compare: "21", Value: 0, Right: "", Logic: 0 })
        if (meta.per_page) {
            data.Limit = meta.per_page
            if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
        }
        if (meta.order) data.OrderString = meta.order
        let res = await K3CloudApi.bill_query(data)
        sum_data = sum_data.concat(res.data)
        if (res.data.length === meta.per_page) {
            meta.page += 1 // 翻页
            return this._get_all_recurse(options, meta, sum_data)
        } else {
            return sum_data 
        }
    }
    
}

export default Inv
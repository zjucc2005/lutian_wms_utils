import K3CloudApi from '@/utils/k3cloudapi'

/**
 * 前端库存模型
 */
class Inv {
    constructor() {
        
    }
    
    /**
     * 批量删除
     * @param ids:Array[Integer]
     * @return {Hash} Promise
     */
    static async delete(ids=[]) {
        const data = {
            Ids: ids.join(',')
        }
        return K3CloudApi.delete('PAEZ_C_INV', data)
    }
    
    /**
     * 获取库存列表
     * @param options:Hash 参数集
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static query(options={}, meta={}) {
        const data = {
            FormId: "PAEZ_C_INV",
            FilterString: K3CloudApi.query_filter(options)
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
        const fields = ['FID', 'FStockLocId', 'FStockLocId.FNumber', 'FMaterialId', 'FMaterialId.FNumber', 
                        'FMaterialId.FName', 'FMaterialId.FSpecification', 'FMaterialId.FImageFileServer',
                        'FQty', 'FStockUnitId', 'FStockUnitId.FName', 'FBatchNo', 'FCreateTime']
        const data = {
            FormId: "PAEZ_C_INV",
            FieldKeys: fields.join(','),
            FilterString: K3CloudApi.query_filter({ FQty_gt: 0, ...options })
        }
        if (meta.per_page) {
            data.Limit = meta.per_page
            if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
        }
        if (meta.order) data.OrderString = meta.order
        // API请求只返回value，减少网络传输数据量
        let res = await K3CloudApi.execute_bill_query(data)
        // 本地重新组装成键值对，方便使用
        let res_data_kv = res.data.map(x => {
            let obj = {}
            for (let i = 0; i < fields.length; i++) obj[fields[i]] = x[i]
            return obj
        })
        sum_data = sum_data.concat(res_data_kv)
        if (res.data.length === meta.per_page) {
            meta.page += 1 // 翻页
            return this._get_all_recurse(options, meta, sum_data)
        } else {
            return sum_data 
        }
    }
    
}

export default Inv
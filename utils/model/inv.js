import store from '@/store'
import K3CloudApi from '@/utils/k3cloudapi'

/**
 * 前端库存模型
 */
class Inv {
    static form_id = 'PAEZ_C_INV'
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
        return K3CloudApi.delete(this.form_id, data)
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
        const fields = ['FID', 'FQty','FBatchNo', 'FCreateTime',
                        'FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FMaterialId.FImageFileServer',
                        'FStockLocId', 'FStockLocId.FNumber', 'FStockLocId.FGroup', 'FStockLocId.FPosX', 'FStockLocId.FPosY',
                        'FStockUnitId', 'FStockUnitId.FName',
                        'FSupplierId', 'FSupplierId.FName']
        const data = {
            FormId: this.form_id,
            FieldKeys: fields.join(','),
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
     * 获取当前仓库/库区的所有库存数据
     * @return {Array[Hash]}
     */
    static async get_all(options={}, meta={}) {
        let data = [] // 返回数据
        
        options.FStockId = store.state.cur_stock.FStockId
        if (store.state.cur_area?.value) options['FStockLocId.FNumber_sw'] = store.state.cur_area.value
        let filter_string = K3CloudApi.query_filter({ FQty_gt: 0, ...options })
        let fields = ['FID', 'FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FMaterialId.FImageFileServer',
                      'FQty', 'FStockUnitId', 'FStockUnitId.FName', 'FStockLocId', 'FStockLocId.FNumber', 'FStockLocId.FGroup',
                      'FBatchNo', 'FSupplierId', 'FSupplierId.FName', 'FCreateTime']
        
        let response = null
        let page = 1
        let per_page = 10000
        while (!response || response.data.length === per_page) {
            let params = {
                FormId: this.form_id,
                FieldKeys: fields.join(','),
                FilterString: filter_string,
                StartRow: (page - 1) * per_page,
                Limit: per_page,
                OrderString: 'FMaterialId.FNumber ASC, FCreateTime ASC'
            }
            if (meta.order) params.OrderString = meta.order
            response = await K3CloudApi.execute_bill_query(params)
            // 本地重新组装成键值对，方便使用
            for (let d of response.data) {
                let obj = {}
                for (let i = 0; i < fields.length; i++) obj[fields[i]] = d[i]
                data.push(obj)
            }
            page++
        }
        return data
    }
    
    
    // static async get_all(options={}, meta={}) {
    //     let _meta = { page: 1, per_page: 10000, order: 'FMaterialId.FNumber ASC, FCreateTime ASC', ...meta }
    //     let sum_data = []
    //     sum_data = await this._get_all_recurse(options, _meta, sum_data)
    //     return sum_data
    // }
    // static async _get_all_recurse(options={}, meta={}, sum_data=[]) {
    //     let fields = ['FID', 'FQty','FBatchNo', 'FCreateTime',
    //                     'FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FMaterialId.FImageFileServer',
    //                     'FStockLocId', 'FStockLocId.FNumber', 'FStockLocId.FGroup', 'FStockLocId.FPosX', 'FStockLocId.FPosY',
    //                     'FStockUnitId', 'FStockUnitId.FName',
    //                     'FSupplierId', 'FSupplierId.FName']
    //     const data = {
    //         FormId: "PAEZ_C_INV",
    //         FieldKeys: fields.join(','),
    //         FilterString: K3CloudApi.query_filter({ FQty_gt: 0, ...options })
    //     }
    //     if (meta.per_page) {
    //         data.Limit = meta.per_page
    //         if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
    //     }
    //     if (meta.order) data.OrderString = meta.order
    //     // API请求只返回value，减少网络传输数据量
    //     let res = await K3CloudApi.execute_bill_query(data)
    //     // 本地重新组装成键值对，方便使用
    //     let res_data_kv = res.data.map(x => {
    //         let obj = {}
    //         for (let i = 0; i < fields.length; i++) obj[fields[i]] = x[i]
    //         return obj
    //     })
    //     sum_data = sum_data.concat(res_data_kv)
    //     if (res.data.length === meta.per_page) {
    //         meta.page += 1 // 翻页
    //         return this._get_all_recurse(options, meta, sum_data)
    //     } else {
    //         return sum_data 
    //     }
    // }
    
}

export default Inv
import store from '@/store';
import K3CloudApi from '@/utils/k3cloudapi';

/**
 * 生产订单模型
 */
class PrdMo {
    static form_id = 'PRD_MO'
    constructor() {
        
    }

    static FStatusEnum = {
        '1': '计划',
        '2': '计划确认',
        '3': '下达',
        '4': '开工',
        '5': '完工',
        '6': '结案',
        '7': '结算'
    }
    
    /**
     * 获取生产订单列表
     * @param options:Hash 参数集
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static query(options={}, meta={}) {
        let fields = ['FID', 'FDate', 'FBillNo', 'FSaleOrderNo', 'FStatus', 'FPrdOrgId.FName', 
                      'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FUnitId.FName', 
                      'FQty', 'FStockInQuaAuxQty', 'FNoStockInQty', 'FPickMtrlStatus', 'FPlanStartDate', 'FStartDate',
                      'FWorkShopID.FName', 'F_LT_CX.FName', 'F_PAEZ_JHXH']
        if (meta.fields) fields = meta.fields
        const data = {
            FormId: this.form_id,
            FieldKeys: fields.join(','),
            FilterString: K3CloudApi.query_filter(options),
            Limit: 10000
        }
        if (meta.per_page) {
            data.Limit = meta.per_page
            if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
        }
        if (meta.order) data.OrderString = meta.order
        return meta.return === 'array' ? K3CloudApi.execute_bill_query(data) : K3CloudApi.bill_query(data)
    }
    
    /**
     * 获取全部数据
     * @param options:Hash 参数
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static async get_all(options={}, meta={}) {
        let _meta = { page: 1, per_page: 10000, ...meta }
        let sum_data = []
        sum_data = await this._get_all_recurse(options, _meta, sum_data)
        return sum_data
    }
    static async _get_all_recurse(options={}, meta={}, sum_data=[]) {
        let fields = ['FID', 'F_PAEZ_JHXH', 'FSaleOrderNo', 'FBillNo', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification',
                      'FUnitId.FName', 'FQty', 'FStockInQuaAuxQty', 'FNoStockInQty', 'FWorkShopID.FName', 'FPickMtrlStatus', 'FStartDate']
        if (meta.fields) {
            if (meta.replace_fields) {
                fields = meta.fields
            } else {
                fields = fields.concat(meta.fields)
            }
        }
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
    
    static find(id) {
        return this.query({ FID: id }, { limit: 1 })
    }
    
    static view(id) {
        if (typeof(id) == 'number') {
            return K3CloudApi.view(this.form_id, { Id: id })
        } else {
            return K3CloudApi.view(this.form_id, { Number: id })
        }
    }
    
}

export default PrdMo
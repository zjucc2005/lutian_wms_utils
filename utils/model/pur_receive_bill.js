import K3CloudApi from '@/utils/k3cloudapi'

class PurReceiveBill {
    static form_id = 'PUR_ReceiveBill'
    constructor() {
        
    }

    static async update(id, options={}) {
        const data = {
            model: {
                FID: id,
                ...options
            }
        }
        return K3CloudApi.save(this.form_id, data)
    }
    
    /** 
     * 搜索物料基础数据(模糊匹配)
     * @param options:Hash 参数集
     * @param meta:Hash 
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static async query (options={}, meta={}) {
        let fields = ['FID', 'FBillNo', 'FCreateDate', 
                      'FSupplierId', 'FSupplierId.FName', 'FPurchaserId', 'FPurchaserId.FName',
                      'FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification',
                      'FActReceiveQty', 'FUnitId', 'FUnitId.FName', 
                      'F_PAEZ_Text']
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
    
    static async find(id) {
        return this.query({ FID: id }, { limit: 1 })
    }
    
    static async view(id) {
        return K3CloudApi.view(this.form_id, { Id: id })
    }
}

export default PurReceiveBill
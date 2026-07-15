import K3CloudApi from '@/utils/k3cloudapi'

class PurPurchaseOrder {
    static form_id = 'PUR_PurchaseOrder'
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
    
    static async batch_update(options=[]) {
        const data = {
            IsDeleteEntry: false, // NOTE!! 是否删除已存在的分录
            model: options
        }
        return K3CloudApi.batch_save(this.form_id, data)
    }
    
    /** 
     * @param options:Hash 参数集
     * @param meta:Hash 
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static async query (options={}, meta={}) {
        let fields = ['FID', 'FBillNo', 'FSupplierId', 'FSupplierId.FName', 'FDemandBillNo', 
                      'FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification',
                      'FQty','FRemainReceiveQty', 'FUnitId', 'FUnitId.FName', 
                      'FDate', 'FDeliveryDate', 'FPurchaserId', 'FPurchaserId.FName']
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
    
    static async find(id) {
        return this.query({ FID: id }, { limit: 1 })
    }
    
    static async view(id) {
        if (typeof(id) == 'number') {
            return K3CloudApi.view(this.form_id, { Id: id })
        } else {
            return K3CloudApi.view(this.form_id, { Number: id })
        }
    }
}

export default PurPurchaseOrder
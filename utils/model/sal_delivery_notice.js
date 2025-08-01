import K3CloudApi from '@/utils/k3cloudapi'

class SalDeliveryNotice {
    static form_id = 'SAL_DELIVERYNOTICE'
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
     * @param options:Hash 参数集
     * @param meta:Hash 
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static async query (options={}, meta={}) {
        let fields = ['FID', 'FDate', 'FBillNo', 'FCloseStatus', 'F_PAEZ_Text', 'FDeliveryOrgId', 'FDeliveryOrgId.FName']
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

export default SalDeliveryNotice
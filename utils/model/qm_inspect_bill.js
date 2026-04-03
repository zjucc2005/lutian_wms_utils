import K3CloudApi from '@/utils/k3cloudapi'

class QmInspectBill {
    static form_id = 'QM_InspectBill'
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
     * @param ids:Array[Integer]
     * @return {Hash} Promise
     */
    static async submit(ids=[]) {
        const data = {
            Ids: ids.join(',')
        }
        return K3CloudApi.submit(this.form_id, data)
    }
    
    /**
     * @param ids:Array[Integer]
     * @return {Hash} Promise
     */
    static async audit(ids=[]) {
        const data = {
            Ids: ids.join(',')
        }
        return K3CloudApi.audit(this.form_id, data)
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
        let fields = ['FID', 'FBillNo', 'FDocumentStatus', 'FBillTypeId.FName', 'FCreateDate', 'FInspectorId.FName']
        if (meta.fields) {
            fields = fields.concat(meta.fields)
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
        return K3CloudApi.bill_query(data)
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

export default QmInspectBill
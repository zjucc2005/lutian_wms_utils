import store from '@/store'
import K3CloudApi from '@/utils/k3cloudapi'
import { response_with_existence } from '../api/helper'

/**
 * 前端库位模型
 * options = {
 *   FStockId: 1,
 *   FNumber: 'A-B-1'
 * }
 */
class StockLoc {
    static form_id = 'PAEZ_C_STOCK_LOC'
    constructor(options={}) {
        if (options.FID) this.FID = options.FID
        this.FStockId = {
            FStockId: options.FStockId
        }
        this.FNumber = options.FNumber
        this.FName = options.FNumber
        this.FGroup = options.FGroup
        this.FPosX = options.FPosX
        this.FPosY = options.FPosY
        if (options.FRemark) this.FRemark = options.FRemark
        if (options.FPalletSpace) this.FPalletSpace = options.FPalletSpace
    }
    
    /**
     * 保存库位（到数据库）
     * @return {Hash} Promise
     */
    async save() {
        const data = {
            model: this
        }
        return K3CloudApi.save(this.form_id, data)
    }
    
    /**
     * 批量保存库位（到数据库）
     * @param stock_locs:Array[StockLoc]
     * @return {Hash} Promise
     */
    static async batch_save(stock_locs=[]) {
        const data = {
            model: stock_locs,
            // ValidateRepeatJson: true
        }
        return K3CloudApi.batch_save(this.form_id, data)
    }
    
    /**
     * 批量提交库位（到数据库）
     * @param numbers:Array[String]
     * @return {Hash} Promise
     */
    static async submit(numbers=[]) {
        const data = {
            Numbers: numbers
        }
        return K3CloudApi.submit(this.form_id, data)
    }
    
    /**
     * 批量审核库位（到数据库）
     * @param numbers:Array[String]
     * @return {Hash} Promise
     */
    static async audit(numbers=[]) {
        const data = {
            Numbers: numbers
        }
        return K3CloudApi.audit(this.form_id, data)
    }
    
    /**
     * 批量禁用库位（到数据库）
     * @param numbers:Array[String]
     * @return {Hash} Promise
     */
    static async forbid(numbers=[]) {
        const data = {
            Numbers: numbers
        }
        return K3CloudApi.forbid(this.form_id, data)
    }
    
    /**
     * 批量反禁用库位（到数据库）
     * @param numbers:Array[String]
     * @return {Hash} Promise
     */
    static async enable(numbers=[]) {
        const data = {
            Numbers: numbers
        }
        return K3CloudApi.enable(this.form_id, data)
    }
    
    /** 
     * 批量删除库位
     * @param ids:Array 
     * @return {Hash} Promise
     */
    static async delete(ids=[]) {
        const data = {
            Ids: ids.join(',')
        }
        return K3CloudApi.delete(this.form_id, data)
    }
    
    /**
     * 获取库位列表
     * @param options:Hash 参数集
     *   @field FStockId:Integer 仓库
     *   @field FNumber:String 库位号/编码
     *   @field FNumber_in:Array[String]
     *   @field FForbidStatus:String 禁用状态
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */    
    static async query(options={}, meta={}) {
        let fields = ['FID', 'FStockId', 'FNumber','FGroup', 'FPosX', 'FPosY', 'FRemark', 'FPalletSpace', 'FDocumentStatus', 'FForbidStatus']
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
        return K3CloudApi.execute_bill_query(data).then(res => {            
            res.data = res.data.map(x => {
                let obj = {}
                for (let i = 0; i < fields.length; i++) obj[fields[i]] = x[i]
                return obj
            })
            return res
        })
    }
    
    /** 
     * 获取库位号存在性
     * @param loc_nos:Array 库位号
     * @return {Hash} Promise { status: -1/0/1/, msg: '网络异常/不存在/已存在', data: [] }
     */
    static async exist_loc_nos(loc_nos) {
        return this.query({ FNumber_in: loc_nos }).then(res => {
            return Promise.resolve(response_with_existence(res, '库位号', 'FNumber'))
        })
    }
    
    /**
     * 获取当前仓库/库区的所有库位数据
     * @return {Array[Hash]}
     */
    static async get_all(options={}) {
        let data = [] // 返回数据
        
        options.FStockId = store.state.cur_stock.FStockId
        if (store.state.cur_area?.value) options['FNumber_sw'] = store.state.cur_area.value
        let filter_string = K3CloudApi.query_filter(options)
        let fields = ['FID', 'FStockId', 'FNumber','FGroup', 'FPosX', 'FPosY', 'FRemark', 'FPalletSpace', 'FDocumentStatus', 'FForbidStatus']
        
        let response = null
        let page = 1
        let per_page = 10000
        while (!response || response.data.length === per_page) {
            response = await K3CloudApi.execute_bill_query({
                FormId: this.form_id,
                FieldKeys: fields.join(','),
                FilterString: filter_string,
                StartRow: (page - 1) * per_page,
                Limit: per_page
            })
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
    
}

export default StockLoc
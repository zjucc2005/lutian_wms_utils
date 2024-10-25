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
    constructor(options={}) {
        this.FStockId = {
            FStockId: options.FStockId
        }
        this.FNumber = options.FNumber
        this.FName = options.FNumber
    }
    
    /**
     * 保存库位（到数据库）
     * @return {Hash} Promise
     */
    async save() {
        const data = {
            model: this
        }
        return K3CloudApi.save('PAEZ_C_STOCK_LOC', data)
    }
    
    /**
     * 批量保存库位（到数据库）
     * @param stock_locs:Array[StockLoc]
     * @return {Hash} Promise
     */
    static async batch_save(stock_locs=[]) {
        const data = {
            model: stock_locs,
            ValidateRepeatJson: true
        }
        return K3CloudApi.batch_save('PAEZ_C_STOCK_LOC', data)
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
        return K3CloudApi.submit('PAEZ_C_STOCK_LOC', data)
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
        return K3CloudApi.audit('PAEZ_C_STOCK_LOC', data)
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
        return K3CloudApi.forbid('PAEZ_C_STOCK_LOC', data)
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
        return K3CloudApi.enable('PAEZ_C_STOCK_LOC', data)
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
        return K3CloudApi.delete('PAEZ_C_STOCK_LOC', data)
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
        let fields = ['FNumber', 'FDocumentStatus', 'FForbidStatus', 'FStockId']
        const data = {
            FormId: "PAEZ_C_STOCK_LOC",
            FieldKeys: fields.join(','),
            FilterString: [],
            Limit: 10000
        }
        if (options.FStockId) {
            data.FilterString.push({ Left: "", FieldName: "FStockId", Compare: "67", Value: options.FStockId, Right: "", Logic: 0 })
        }
        if (options.FNumber) {
            data.FilterString.push({ Left: "", FieldName: "FNumber", Compare: "67", Value: options.FNumber, Right: "", Logic: 0 })
        }
        if (options.FNumber_in) {
            data.FilterString.push({ Left: "", FieldName: "FNumber", Compare: "338", Value: options.FNumber_in.join(','), Right: "", Logic: 0 })
        }
        if (options.FForbidStatus) {
            data.FilterString.push({ Left: "", FieldName: "FForbidStatus", Compare: "105", Value: options.FForbidStatus, Right: "", Logic: 0 })
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
}

export default StockLoc
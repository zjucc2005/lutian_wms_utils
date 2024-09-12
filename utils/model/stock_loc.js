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
    save() {
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
    static batch_save(stock_locs=[]) {
        const data = {
            model: stock_locs,
            ValidateRepeatJson: true
        }
        return K3CloudApi.batch_save('PAEZ_C_STOCK_LOC', data)
    }
    
    /** 
     * 删除仓位(批量)
     * @param ids:Array 
     * @return {Hash} Promise
     */
    static delete(ids=[]) {
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
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */    
    static query(options={}, meta={}) {
        const data = {
            FormId: "PAEZ_C_STOCK_LOC",
            FilterString: []
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
        if (meta.per_page) {
            data.Limit = meta.per_page
            if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
        }
        if (meta.order) data.OrderString = meta.order
        return K3CloudApi.bill_query(data)
    }
    
    /** 
     * 获取库位号存在性
     * @param loc_nos:Array 库位号
     * @return {Hash} Promise { status: -1/0/1/, msg: '网络异常/不存在/已存在', data: [] }
     */
    static exist_loc_nos(loc_nos) {
        return this.query({ FNumber_in: loc_nos }).then(res => {
            return Promise.resolve(response_with_existence(res, '库位号'))
        })
    }
}

export default StockLoc
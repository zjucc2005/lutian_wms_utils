# -*- encoding:utf-8 -*-
# 该脚本放在BOS平台-库存变更日志-表单插件
import clr

clr.AddReference('System')
clr.AddReference('Kingdee.BOS.Core')

from System import *
from Kingdee.BOS import *
from Kingdee.BOS.Core import *

# 事件绑定
def AfterSave(e):
    inv_log = this.Model.DataObject   # DynamicObject对象
    inv_qty = get_inv_qty(inv_log)    # 计算该日志对应的库存流水
    inv_log['InvQty'] = inv_qty
    query = query_inv(inv_log)        # 查询库存分表
    if query.Count:
        update_inv(query[0], inv_log) # 如果存在对应库存分表行，则更新
    else:
        create_inv(inv_log)           # 否则，新增库存分表行

def get_inv_qty(inv_log):
    sql = """
    SELECT SUM(FINVINCRE) FROM PAEZ_t_C_INV_LOG
    WHERE FSTOCKID = {f_stock_id}
    AND FSTOCKLOCID = {f_stock_loc_id}
    AND FMATERIALID = {f_material_id}
    AND FBATCHNO = {f_batch_no};
    """.format(
    f_stock_id=inv_log['StockId_Id'],
    f_stock_loc_id=inv_log['StockLocId_Id'],
    f_material_id=inv_log['MaterialId_Id'],
    f_batch_no=inv_log['BatchNo'])
    inv_qty = App.Data.DBUtils.ExecuteScalar(this.Context, sql, None)
    return inv_qty

# 回写库存流水和关联C_INV
def update_inv_log(inv_log, inv_id):
    update_sql = """
    UPDATE PAEZ_t_C_INV_LOG
    SET FINVQTY = {f_inv_qty}, FCINVID = {inv_id}
    WHERE FID = {fid};
    """.format(
    f_inv_qty=inv_log['InvQty'],
    inv_id=inv_id,
    fid=inv_log['Id'])
    App.Data.DBUtils.Execute(this.Context, update_sql)   

# 查询库存分表
def query_inv(inv_log):
    sql = """
    SELECT * FROM PAEZ_t_C_INV
    WHERE FSTOCKID = {f_stock_id}
    AND FSTOCKLOCID = {f_stock_loc_id}
    AND FMATERIALID = {f_material_id}
    AND FBATCHNO = {f_batch_no};
    """.format(
    f_stock_id=inv_log['StockId_Id'],
    f_stock_loc_id=inv_log['StockLocId_Id'],
    f_material_id=inv_log['MaterialId_Id'],
    f_batch_no=inv_log['BatchNo'])
    query = App.Data.DBUtils.ExecuteDynamicObject(this.Context, sql)
    return query
 
def create_inv(inv_log):
    inv_fid = ServiceHelper.DBServiceHelper.GetSequenceInt64(this.Context, 'PAEZ_t_C_INV', 1)[0]
    sql = """
    INSERT INTO PAEZ_t_C_INV
    (FID, FFormId, FSTOCKID, FSTOCKLOCID, FMATERIALID, FQTY, FSTOCKUNITID, FBATCHNO, FLASTINBOUNDDATE, FCREATETIME)
    VALUES 
    ({fid}, '{f_form_id}', {f_stock_id}, {f_stock_loc_id}, {f_material_id}, {f_qty}, {f_stock_unit_id}, '{f_batch_no}', '{f_last_inbound_date}', '{f_create_time}');
    """.format(
    fid=inv_fid, # 获取主键
    f_form_id='PAEZ_C_INV', # 必须指明FormId
    f_stock_id=inv_log['StockId_Id'],
    f_stock_loc_id=inv_log['StockLocId_Id'],
    f_material_id=inv_log['MaterialId_Id'],
    f_qty=inv_log['InvQTY'],
    f_stock_unit_id=inv_log['StockUnitId_Id'],
    f_batch_no=inv_log['BatchNo'],
    f_last_inbound_date=inv_log['CreateTime'],
    f_create_time=inv_log['CreateTime'])
    App.Data.DBUtils.Execute(this.Context, sql)
    update_inv_log(inv_log, inv_fid)
    
def update_inv(inv, inv_log):
    sql = """
    UPDATE PAEZ_t_C_INV
    SET FQTY = {f_qty}, FLASTINBOUNDDATE = {f_last_inbound_date}
    WHERE FID = {fid};
    """.format(
    f_qty=inv_log['InvQty'],
    f_last_inbound_date=inv_log['CreateTime'],
    fid=inv['FID'])
    App.Data.DBUtils.Execute(this.Context, sql)
    update_inv_log(inv_log, inv['FID'])

# -*- encoding:utf-8 -*-
# 该脚本放在BOS平台-生产订单-列表插件
import clr

clr.AddReference('System')
clr.AddReference('System.Data')
clr.AddReference('Kingdee.BOS')
clr.AddReference('Kingdee.BOS.App')
clr.AddReference('Kingdee.BOS.DataEntity')
clr.AddReference('Kingdee.BOS.Core')
clr.AddReference("Kingdee.BOS.ServiceFacade.Common")
clr.AddReference("Newtonsoft.Json")

import System
import Kingdee.BOS
from System import *
from System.Data import *
from System.Net import *
from System.Text import *
from System.IO import *
from System.Collections.Generic import List
from Kingdee.BOS import *
from Kingdee.BOS.App.Data import *    # App.Data.DBUtils
from Kingdee.BOS.Core import *
from Kingdee.BOS.Core.DependencyRules import *
from Kingdee.BOS.Core.Bill import *
from Kingdee.BOS.Core.DynamicForm.PlugIn import *
from Kingdee.BOS.Core.DynamicForm.PlugIn.ControlModel import *
from Kingdee.BOS.Core.DynamicForm import *
from Kingdee.BOS.Core.Metadata.EntityElement import *
from Kingdee.BOS.Core.Metadata.FieldElement import *
from Kingdee.BOS.Orm.DataEntity import *
from Kingdee.BOS.ServiceFacade import *
from Kingdee.BOS.JSON import *
from Newtonsoft.Json.Linq import *


# 事件绑定
def BarItemClick(e):
    if e.BarItemKey == 'tbBtnToStart':
        for row in this.ListView.SelectedRowsInfo:
            exec_script(row.EntryPrimaryKeyValue)


# 3厂产线先统一更新
# 如果PPBOM中物料基础资料的发料仓库为"内燃机虚拟在线库"，则更新PPBOM分录的仓库为MO产线对应的在线库
def exec_script(mo_entry_id):
    if is_prd_line_3(mo_entry_id):
        update_ppbomentry_stock_3(mo_entry_id)
    new_stock_id = get_new_stock_id(mo_entry_id)
    if new_stock_id:
        entry_ids = []
        for row in get_ppbomentry(mo_entry_id):
            entry_ids.append(str(row['FENTRYID']))
        update_ppbomentry_stock(entry_ids, new_stock_id)


# 返回产线对应的在线库
def get_new_stock_id(mo_entry_id):
    sql = """
    SELECT F_PAEZ_CK FROM LT_t_Cust_CX 
    WHERE FID = (
        SELECT F_LT_CX FROM T_PRD_MOENTRY 
        WHERE FENTRYID = {mo_entry_id}
    );
    """.format(mo_entry_id=mo_entry_id)
    return DBUtils.ExecuteScalar(this.Context, sql, None)


# 返回PPBOM中物料基础资料的发料仓库为"内燃机虚拟在线库"的行
def get_ppbomentry(mo_entry_id):
    sql = """
    SELECT p.FENTRYID FROM T_PRD_PPBOMENTRY p, T_BD_MATERIALPRODUCE mp, T_BD_STOCK_L s
    WHERE p.FMOENTRYID = {mo_entry_id}
    AND p.FMATERIALID = mp.FMATERIALID
    AND mp.FPICKSTOCKID = s.FSTOCKID
    AND s.FNAME = '{stock_name}';
    """.format(mo_entry_id=mo_entry_id, stock_name='内燃机虚拟在线库')
    return DBUtils.ExecuteDynamicObject(this.Context, sql)


# 更新PPBOM的仓库
def update_ppbomentry_stock(entry_ids, new_stock_id):
    if not entry_ids:
        return None
    sql = """
    UPDATE T_PRD_PPBOMENTRY_C
    SET FSTOCKID = {new_stock_id}, FISSUETYPE = '1'
    WHERE FENTRYID in ({entry_ids});
    """.format(entry_ids=','.join(entry_ids), new_stock_id=new_stock_id)
    DBUtils.Execute(this.Context, sql)

# ===============================================
# 判断是否3厂产线
def is_prd_line_3(mo_entry_id):
    sql = """
    SELECT FNAME FROM LT_t_Cust_CX_L
    WHERE FID = (
      SELECT F_LT_CX FROM T_PRD_MOENTRY
      WHERE FENTRYID = {mo_entry_id}
    );
    """.format(mo_entry_id=mo_entry_id)
    name = DBUtils.ExecuteScalar(this.Context, sql, '')
    return name.startswith('3-')
 
    
# 统一更新PPBOM的仓库为 3-材料库
def update_ppbomentry_stock_3(mo_entry_id):
    sql = """
    UPDATE T_PRD_PPBOMENTRY_C
    SET FSTOCKID = (SELECT FSTOCKID FROM T_BD_STOCK_L WHERE FNAME = '{stock_name}'), FISSUETYPE = '1'
    WHERE FID = (
        SELECT FID FROM T_PRD_PPBOM
        WHERE FMOENTRYID = {mo_entry_id}
    );
    """.format(mo_entry_id=mo_entry_id, stock_name='3-材料库')
    DBUtils.Execute(this.Context, sql)


def to_json(dyobject):
    jsonSerializerProxy = JsonSerializerProxy(Encoding.UTF8, False)
    jsonData = jsonSerializerProxy.Serialize(dyobject)
    return jsonData


def inspect(obj):
    return str(obj) + '\n' + str(type(obj)) + '\n' + str(dir(obj))


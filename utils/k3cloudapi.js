import store from '@/store'
import model from '@/utils/model'
import logger from '@/utils/logger'

const config = {
    endpoint: 'http://61.175.224.118:9090/',
    acctid: '668349890be80b',
    username: '陈伟斌',
    password: 'OA2024.',
    lcid: '2052'
}

const isConn = () => {
    return (store.state.user_info && store.state.conn_expired_at && store.state.conn_expired_at > Date.now())
}

const fullURL = (path) => {
    return `${config.endpoint}k3cloud/${path}`
}

const fieldKeys = (model_name) => {
    return Object.getOwnPropertyNames(model[model_name].fields).join(',')
}

const conn = async () => {
    return new Promise((resolve, reject) => {
        if (isConn()) {
            // logger.dev("load store.state.conn_info:", store.state.conn_info)
            return resolve(store.state.conn_info)
        }
        uni.request({
            url: fullURL('Kingdee.BOS.WebApi.ServicesStub.AuthService.ValidateUser.common.kdsvc'),
            method: 'POST',
            data: { acctid: config.acctid, username: config.username, password: config.password, lcid: config.lcid },
            success: (res) => {
                logger.dev("K3CloudApi.conn res:", res)
                store.commit('api_conn', res.data)
                resolve(res.data)
            },
            fail: (err) => {
                console.log("K3CloudApi.conn fail:", err)
                reject(err)
            }
        })
    })
}

const view = async (form_id, data) => {
    const _data_  = {
        CreateOrgId: 0,
        Number: "",
        Id: "",
        IsSortBySeq: false,
        ...data
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.dev("K3CloudApi.view req:", _data_)
            uni.request({
                url: fullURL('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.View.common.kdsvc'),
                method: 'POST',
                data: { formid: form_id, data: _data_ },
                success: (res) => {
                    logger.dev("K3CloudApi.view res:", res)
                    store.commit('reset_api_conn')
                    resolve(res.data)
                },
                fail: (err) => {
                    console.log("K3CloudApi.view fail:", err)
                    reject(err)
                }
            })
        })   
    })
}

const execute_bill_query = async (data) => {
    const _data_ = {
        FormId: "",
        FieldKeys: fieldKeys(data['FormId']),
        FilterString: [],
        OrderString: "",
        TopRowCount: 0,
        StartRow: 0,
        Limit: 10,
        SubSystemId: '',
        ...data,
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.dev("K3CloudApi.execute_bill_query req:", _data_)
            uni.request({
                url: fullURL('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExecuteBillQuery.common.kdsvc'),
                method: 'POST',
                data: { data: _data_ },
                success: (res) => {
                    logger.dev("K3CloudApi.execute_bill_query res:", res)
                    store.commit('reset_api_conn')
                    resolve(res.data)
                },
                fail: (err) => {
                    console.log("K3CloudApi.execute_bill_query fail:", err)
                    reject(err)
                }
            })
        })    
    })
}

const bill_query = async (data) => {
    const _data_ = {
        FormId: "",
        FieldKeys: fieldKeys(data['FormId']),
        FilterString: [],
        OrderString: "",
        TopRowCount: 0,
        StartRow: 0,
        Limit: 10,
        SubSystemId: '',
        ...data,
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.dev("K3CloudApi.bill_query req:", _data_)
            uni.request({
                url: fullURL('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.BillQuery.common.kdsvc'),
                method: 'POST',
                data: { data: _data_ },
                success: (res) => {
                    logger.dev("K3CloudApi.bill_query res:", res)
                    store.commit('reset_api_conn')
                    resolve(res.data)
                },
                fail: (err) => {
                    console.log("K3CloudApi.bill_query fail:", err)
                    reject(err)
                }
            })
        })    
    })
}

// @return {} / undefined
const validate_staff = async (staff_name, staff_no) => {
    const data = {
        FormId: "BD_WAREHOUSEWORKERS",
        // FieldKeys: "FName,FNumber,FForbidStatus",
        FieldKeys: fieldKeys("BD_WAREHOUSEWORKERS"),
        FilterString: [
            {"Left":"","FieldName":"FName","Compare":"67","Value":staff_name,"Right":"","Logic":0},
            {"Left":"","FieldName":"FNumber","Compare":"67","Value":staff_no,"Right":"","Logic":0},
        ]
    }
    return bill_query(data).then(res => {  
        return Promise.resolve(res[0])
    })
}

const K3CloudApi = {
    // login: login,
    conn: conn,
    view: view,
    execute_bill_query: execute_bill_query,
    bill_query: bill_query,
    
    
    validate_staff: validate_staff
}

export default K3CloudApi
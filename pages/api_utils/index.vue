<template>
    <view>		
        <uni-section title="API调试" sub-title="Kingdee系统API数据查询展示，仅用来测试API对接。" type="line">
            <uni-list>
                <uni-list-item 
                    :show-extra-icon="true"
                    :extra-icon="{ color: '#dd524d', size: '24', type: 'link' }"
                    title="API调用(代码测试)"
                    clickable @click="call_test_api()">
                </uni-list-item>
                
                <uni-list-item
                    :show-extra-icon="true"
                    :extra-icon="{ color: '#dd524d', size: '24', type: 'link' }"
                    title="删除接口调用(代码测试)"
                    clickable @click="call_delete_api()">
                </uni-list-item>
                
                <uni-list-item
                    :show-extra-icon="true"
                    :extra-icon="{ color: '#dd524d', size: '24', type: 'link' }"
                    title="物料分组-参考物料"
                    clickable @click="export_refer_mno()">
                </uni-list-item>
            </uni-list>
            
            <uni-collapse accordion>
                <uni-collapse-item v-for="cate in categories" :key="cate.value" :title="cate.name" >
                    <uni-list>
                        <uni-list-item 
                            v-for="sub_cate in cate.children" :key="sub_cate.value"
                            :title="sub_cate.name" clickable showArrow 
                            @click="goDetailPage(cate.value, sub_cate.value)"
                        ></uni-list-item>
                    </uni-list>
                </uni-collapse-item>
            </uni-collapse>
        </uni-section>
        
        <uni-section title="全局状态" sub-title="全局参数展示，仅用于调试。" type="line">
            <uni-list>
                <uni-list-item title="store.state" clickable showArrow @click="goDetailPage('store', 'store')"></uni-list-item>
                <uni-list-item title="getSystemInfo" clickable showArrow @click="goDetailPage('store', 'get_system_info')"></uni-list-item>
                <uni-list-item title="Chart" clickable @click="goDetailPage('store', 'chart')"></uni-list-item>
                <uni-list-item title="scanCode(安卓原生插件)" clickable @click="scanCode"></uni-list-item>
                <uni-list-item title="share(微信开放平台APPID)" clickable @click="share"></uni-list-item>
                <uni-list-item title="播放声音" clickable @click="playAudio"></uni-list-item>
                <uni-list-item title="振动(不能用)" click @click="vibrate"></uni-list-item>
                <uni-list-item title="getLocation(需要商业授权)" click @click="getLocation"></uni-list-item>
            </uni-list>
        </uni-section>
    </view>
</template>

<script>
    import store from '@/store'
    import XLSX from 'xlsx'
    import K3CloudApi from '@/utils/k3cloudapi'
    import { get_bd_material } from '@/utils/api'
    import { Inv, InvPlan, InvLog, BdMaterial, StockLoc } from '@/utils/model'
    import { string_to_arraybuffer } from '@/utils'
    export default {
        data() {
            return {
                categories: [
                    {
                        value: 'login',
                        name: '登录认证',
                        children: [
                            { value: 'validateUser', name: 'ValidateUser / 用户名/密码' }
                        ]
                    },
                    {
                        value: 'gongyinglian',
                        name: '供应链',
                        children: [
                            { value: 'bd_stock', name: 'BD_STOCK / 仓库' },
                            { value: 'stk_inventory', name: 'STK_INVENTORY / 即时库存'},
                            { value: 'stk_transferdirect', name: 'STK_TransferDirect / 直接调拨单 '}
                        ]
                    },
                    {
                        value: 'jichuguanli',
                        name: '基础管理',
                        children: [
                            { value: 'bd_customer', name: 'BD_CUSTOMER / 客户' },
                            { value: 'bd_empinfo', name: 'BD_Empinfo / 员工'},
                            { value: 'bd_material', name: 'BD_MATERIAL / 物料'},
                            { value: 'bd_unit', name: 'BD_UNIT / 计量单位'},
                            { value: 'bd_warehouseworkers', name: 'BD_WAREHOUSEWORKERS / 仓管员'}
                        ]
                    }
                ]
            }
        },
        methods: {
            goDetailPage(path1, path2) {
                const url = `/pages/api_utils/${path1}/${path2}`
                uni.navigateTo({ url: url })
            },
            scanCode() {
                // #ifdef APP-PLUS
                const myScanCode = uni.requireNativePlugin('My-ScanCode')
                myScanCode.scanCode({
                    // prompt: '扫码提示语'
                }, (res) => {
                    this.$logger.info('myScanCode res:', res)
                    uni.showModal({
                        title: res.scanType,
                        content: res.result,
                        showCancel: false,
                        confirmText: "确定"
                    })
                })
                // #endif
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: function (res) {
                        this.$logger.info("uni.scanCode res:", res)
                        uni.showModal({
                            title: res.scanType,
                            content: res.result,
                            showCancel: false,
                            confirmText: "确定"
                        })
                    }
                });
                // #endif
            },
            share() {
                // 在安卓上能用
                uni.share({
                	provider: "weixin",
                	scene: "WXSceneSession",
                	type: 1,
                	summary: "我正在使用HBuilderX开发uni-app，赶紧跟我一起来体验！",
                	success: function (res) {
                		this.$logger.info("success:", res)                        
                	},
                	fail: function (err) {
                		this.$logger.info("fail:", err)
                        uni.showToast({ icon: 'none', title: err.errMsg })
                	}
                });
            },
            playAudio() {
                uni.showToast({ icon: 'none', title: '播放声音'})
                const audio = uni.createInnerAudioContext();
                audio.src = '/static/audio/success.mp3';
                audio.play();
            },
            vibrate() {
                uni.showToast({ icon: 'none', title: '振动'})
                uni.vibrate({
                    success: (res) => {
                        this.$logger.info('uni.vibrate res:', res)
                    },
                    fail: (err) => {
                        this.$logger.info('uni.vibrate err:', err)
                    }
                })
            },
            getLocation() {
                uni.getLocation({
                    type: 'wgs84', // wgs84/gcj02
                    success: (res) => {
                        this.$logger.info('uni.getLocation res:', res)
                    },
                    fail: (err) => {
                        this.$logger.info('uni.getLocation err:', err)
                    }
                })
            },
            async call_test_api() {
                
                // this.retry_inv_plan_sn('181318856583740204')
                // this.retry_inv_plan('FHTZD091834')
                // BdMaterial.query({ FNumber: '0.0.0.0003' })
                // const data = {
                //     model: {
                //         FNumber: '0.0.0.0003',
                //         FName: 'PLM测试0430',
                //         FSpecification: 'AfterSave回调测试 - 复制参考物料指定字段 - 2'
                //     }
                // }
                // const data = {
                //     model: {
                //         FMaterialId: 3127533
                //     }
                // }
                // K3CloudApi.save('BD_MATERIAL', data)
                // K3CloudApi.audit('BD_MATERIAL', { Ids: "3127600"})
                // for (let i = 0; i < nos.length; i++) {
                //     let res = await BdMaterial.query({ FUseOrgId: store.state.cur_stock.FUseOrgId, FNumber: nos[i].trim() }, {})
                //     if (res.data && res.data[0]) {
                //         let d = res.data[0]
                //         await BdMaterial.update(res.data[0].FMaterialId, { F_RGEN_xsjc_83g: scs[i].trim() })
                //     }
                // }
            },
            call_delete_api() {
                // Inv.query({ FMaterialId: '' }).then(res => {
                //     Inv.delete(res.data.map(e => e.FID))
                // })
                // InvLog.query({ FCInvId: '' }).then(res => {
                //     InvLog.delete(res.data.map(e => e.FID))
                // })
                // InvPlan.query({ FMaterialId: '' }).then(res => {
                //     InvPlan.delete(res.data.map(e => e.FID))
                // })
            },
            async export_refer_mno() {
                let page = 1
                let per_page = 5000 // 每次获取数据量
                let options = {
                    FDocumentStatus: 'C', 
                    FForbidStatus: 'A', 
                    FUseOrgId: 1,
                    'FMaterialGroup.FNumber_ge': '3.07.02.35'
                }
                let meta = {
                    per_page: per_page, order: 'FMaterialGroup.FNumber ASC'
                }
                let mapping = {}
                let cnt = 0
                while (1) {
                    let res = await BdMaterial.query(options, { page: page, per_page: per_page, order: 'FMaterialGroup.FNumber ASC' })
                    for (let obj of res.data) {
                        // if (!obj.FNumber) continue
                        if (mapping[obj['FMaterialGroup.FNumber']]) {
                            if (obj.FNumber < mapping[obj['FMaterialGroup.FNumber']][0]) mapping[obj['FMaterialGroup.FNumber']][0] = obj.FNumber
                            if (obj.FNumber > mapping[obj['FMaterialGroup.FNumber']][1]) mapping[obj['FMaterialGroup.FNumber']][1] = obj.FNumber
                        } else {
                            mapping[obj['FMaterialGroup.FNumber']] = [obj.FNumber, obj.FNumber]
                        }
                        console.log('.')
                    }
                    page++;
                    cnt++;
                    console.log(`>>> CNT: ${cnt}, t: ${new Date}`)
                    if (res.data.length < per_page) break;
                }
                let sheet_data = [
                    ['物料分组', '参考物料编码(最小)', '参考物料编码(最大)']
                ]
                for (let k in mapping) {
                    sheet_data.push([k, mapping[k][0], mapping[k][1]])
                }
                let sheet = XLSX.utils.aoa_to_sheet(sheet_data)
                let book = XLSX.utils.book_new()
                XLSX.utils.book_append_sheet(book, sheet, 'Sheet1')
                var book_output = XLSX.write(book, { bookType: 'xlsx', bookSST: true, type: 'binary'})
                const blob = new Blob([string_to_arraybuffer(book_output)], { type: "application/octet-stream" })
                // 下载
                let link = document.createElement('a')
                link.href = URL.createObjectURL(blob)
                link.download = `参考物料模板_${Date.now()}.xlsx`
                link.click()
                URL.revokeObjectURL(link.href)
            },
            async retry_inv_plan(bill_no) {
                InvLog.query({ FBillNo: bill_no }).then(res => {
                    InvLog.delete(res.data.map(e => e.FID))
                })
                InvPlan.query({ FBillNo: bill_no }).then(res => {
                    for (let inv_plan of res.data) {
                        let options = {
                            FOpType: inv_plan.FOpType,
                            FStockId: inv_plan.FStockId,
                            FStockLocNo: inv_plan['FStockLocId.FNumber'],
                            FMaterialId: inv_plan.FMaterialId,
                            FOpQTY: inv_plan.FOpQTY,
                            FBatchNo: inv_plan.FBatchNo,
                            FBillNo: inv_plan.FBillNo,
                            FOpStaffNo: inv_plan.FOpStaffNo,
                            FRemark: inv_plan.FRemark,
                            FReceiver: inv_plan.FReceiver
                        }
                        let inv_log = new InvLog(options)
                        inv_log.save()
                    }
                })
            },
            // 库存调整用
            async retry_inv_plan_sn(sn) {
                let res = await InvPlan.query({ FOpSN: sn })
                for (let inv_plan of res.data) {
                    await InvPlan.execute(inv_plan)
                }
            }
        }
    }
</script>

<style>

</style>

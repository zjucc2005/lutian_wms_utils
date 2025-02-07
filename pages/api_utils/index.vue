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
    import K3CloudApi from '@/utils/k3cloudapi'
    import { get_bd_material } from '@/utils/api'
    import { Inv, InvPlan, InvLog, BdMaterial, StockLoc } from '@/utils/model'
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
                let shelf = 'B20'
                let grids = [101,201,301]
                // let grids = []
                // for (let i = 1; i < 24; i ++) { grids.push(300+i) }
                let numbers = grids.map(e => {
                    return `NX3-${shelf}-${e}`
                })
                StockLoc.query({FNumber_in: numbers}).then(res => {
                    console.log('res', res)
                    res.data.forEach(e => {
                        let data = {
                            model: {
                                FID: e.FID,
                                FPalletSpace: 1
                            }
                        }
                        K3CloudApi.save('PAEZ_C_STOCK_LOC', data)
                    })
                    
                    // let form_id = 'PAEZ_C_STOCK_LOC'
                    // let data = {
                    //     Numbers: res.data.map(e => e.FNumber)
                    // }
                    // K3CloudApi.delete(form_id, data)
                })
                
                
                // let sta = {}
                // let fields = ['FID', 'FBillNo', 'F_PAEZ_Text']
                // for (let i = 1; i <= 1; i ++) {
                //     const data = {
                //         FormId: 'SAL_DELIVERYNOTICE',
                //         FieldKeys: fields.join(','),
                //         FilterString: `FStockID = '2048838' AND FCreateDate BETWEEN '2024-01-01' AND '2024-12-31'`,
                //         Limit: 10000,
                //         //FilterString: "FMaterialId.FNumber = '3.01.01.01.07.0072'"
                //     }
                    
                //     let res = await K3CloudApi.bill_query(data)
                //     let uniq_arr = []
                //     if (res.data) {
                        
                //     }
                //     for (let item of res.data) {
                //         let receiver = item['F.PAEZ.Text'].trim().replace(/[*|发]快递/g, '')
                //         receiver = receiver.replace(/（售后）/g, '')
                //         if (!uniq_arr.includes(receiver)) {
                //             uniq_arr.push(receiver)
                //         }
                //     }
                //     sta[i] = uniq_arr.toSorted()
                // }
                // console.log("收货人列表", sta)
            },
            call_delete_api() {
                // StockLoc.query({ FDocumentStatus: 'D' }).then(res => {
                //     let form_id = 'PAEZ_C_STOCK_LOC'
                //     let data = {
                //         Numbers: res.data.map(e => e.FNumber)
                //     }
                //     K3CloudApi.delete(form_id, data)
                // })
                // Inv.query({ FMaterialId: '' }).then(res => {
                //     Inv.delete(res.data.map(e => e.FID))
                // })
                
            }
        }
    }
</script>

<style>

</style>

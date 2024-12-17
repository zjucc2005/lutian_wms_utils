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
    import { Inv, BdMaterial } from '@/utils/model'
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
            call_test_api() {
                // BdMaterial.categories()
                // K3CloudApi.view('ENG_BOM', { Number: '2.02.08.04.0065_V1.000' }).then(res => {
                //     this.$logger.info('获取物料清单', res.data)
                // })
                let fields = ['FID', "FName", "FNumber", "FForbidStatus", "FDocumentStatus", 'FUseOrgId', 'FUseOrgId.FName',
                              'FBomCategory', "FMaterialId", 'FMaterialId.FNumber', 'FItemName', 'FItemModel', 'FOperId', 'FITEMPPROPERTY']
                const data = {
                    FormId: 'ENG_BOM',
                    FieldKeys: fields.join(','),
                    FilterString: "FItemModel like '%6500n-6%' OR FItemName like '%6500n-6%'",
                    //FilterString: "FMaterialId.FNumber = '3.01.01.01.07.0072'"
                }
                K3CloudApi.bill_query(data)
            },
            call_delete_api() {
                // let form_id = 'PAEZ_C_INV'
                // let data = {
                //     Ids: '100023'
                // }
                // K3CloudApi.delete(form_id, data)
                
                let form_id = 'PAEZ_C_INV_PLAN'
                let data = {
                    Ids: '100098,100099,100100'
                }
                K3CloudApi.delete(form_id, data)
            }
        }
    }
</script>

<style>

</style>

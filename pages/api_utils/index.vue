<template>
    <view>		
        <uni-section title="API调试" sub-title="Kingdee系统API数据查询展示，仅用来测试API对接。" type="line">
            <uni-list>
                <uni-list-item 
                    :show-extra-icon="true"
                    :extra-icon="{ color: '#dd524d', size: '24', type: 'link' }"
                    title="API调用(代码测试)"
                    clickable @click="api_call_test()">
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
    import { get_bd_material } from '../../utils/api'
    import { Inv } from '@/utils/model'
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
                    console.log('myScanCode res:', res)
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
                        console.log("uni.scanCode res:", res)
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
                		console.log("success:", res)                        
                	},
                	fail: function (err) {
                		console.log("fail:", err)
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
                        console.log('uni.vibrate res:', res)
                    },
                    fail: (err) => {
                        console.log('uni.vibrate err:', err)
                    }
                })
            },
            getLocation() {
                uni.getLocation({
                    type: 'wgs84', // wgs84/gcj02
                    success: (res) => {
                        console.log('uni.getLocation res:', res)
                    },
                    fail: (err) => {
                        console.log('uni.getLocation err:', err)
                    }
                })
            },
            api_call_test() {
                console.log('API调用 - 目前无测试代码')
                // const data = {
                //     // Number: 'FHTZD074960',
                //     Number: 'FHTZD078950'
                // }
                // K3CloudApi.view('SAL_DELIVERYNOTICE', { Number: 'FHTZD074960' }).then(res => {
                //     console.log('res.data.Result.Result.SAL_DELIVERYNOTICEENTRY', res.data.Result.Result.SAL_DELIVERYNOTICEENTRY)
                // })
                K3CloudApi.view('STK_TransferDirect', { Number: 'ZJDB198948' }).then(res => {
                    console.log('res.data', res.data)
                })
                // K3CloudApi.save('PAEZ_C_INV_LOG', { model: { FID: '100232', FRemark: '用save更新成功' }})
                
                // const form_id = 'PAEZ_C_INV_LOG'
                // const data = {
                //     Ids: '100013'
                // }
                // K3CloudApi.delete(form_id, data).then(res => {
                // })
                // get_bd_material('1.06.08.03.0006', 100007)
                let inv_log = new InvLog({
                    FOpType: 'in',
                    FStockId: store.state.cur_stock.FStockId,
                    FStockLocNo: 'T-B01-101',
                    FMaterialId: bd_material.FMaterialId,
                    FOpQTY: this.mount_form.op_qty * 1,
                    FBatchNo: this.cur_inbound_task.batch_no,
                    FBillNo: this.cur_inbound_task.bill_no,
                    FOpStaffNo: this.cur_staff.FNumber,
                    FRemark: this.mount_form.remark
                })
                inv_log.save().then(save_res => {
                    play_audio_prompt('success')
                    this.after_save(save_res)
                    this.reset_form() // 重置表单
                })
            }
        }
    }
</script>

<style>

</style>

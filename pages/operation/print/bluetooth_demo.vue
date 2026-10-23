<template>
    <uni-section title="标签信息" type="square">
        <view class="container">
            <uni-forms ref="form" :model="form" labelWidth="70px">
                <uni-forms-item label="物料编码" name="no">
                    <uni-easyinput v-model="form.no" trim="both" />
                </uni-forms-item>
                <uni-forms-item label="物料名称" name="copies">
                    <uni-easyinput v-model="form.name" trim="both"/>
                </uni-forms-item>
                <uni-forms-item label="规格型号" name="copies">
                    <uni-easyinput v-model="form.spec" trim="both"/>
                </uni-forms-item>
                <uni-forms-item label="供应商" name="copies">
                    <uni-easyinput v-model="form.supplier" trim="both"/>
                </uni-forms-item>
                <uni-forms-item label="入库时间" name="copies">
                    <uni-easyinput v-model="form.inbound_time" trim="both"/>
                </uni-forms-item>
                
                <!-- <button @click="submit" type="primary">
                    <uni-icons type="checkmarkempt" color="#fff"></uni-icons> 生成标签
                </button> -->
            </uni-forms>   
        </view>
    </uni-section>
    
    <uni-section title="调试" type="square">
        <uni-list>
            <uni-list-item title="openBluetoothAdapter" @click="openBluetoothAdapter()" clickable show-arrow />
            <uni-list-item title="getBluetoothAdapterState" @click="getBluetoothAdapterState()" clickable show-arrow />
            <uni-list-item title="startBluetoothDevicesDiscovery" @click="startBluetoothDevicesDiscovery()" clickable show-arrow />
        </uni-list>
    </uni-section>
</template>

<script>
    // #ifdef H5
    import { gen_pdf_material_label } from '@/gen_pdf'
    // #endif
    export default {
        data() {
            return {
                form: {
                    no: '1.01.14.01.0125',
                    name: '六角法兰面螺栓-大JB',
                    spec: 'GB/T5789 M6*12',
                    inbound_time: '2025-10-15',
                    supplier: '温州标二'
                },
                bluetooth_devices: []
                // canvas_id: 'qrcode'
            }
        },
        mounted() {
            console.log('>>> this', this.platform)
        },
        methods: {
            // 1. 打开蓝牙适配器
            openBluetoothAdapter() {
                uni.openBluetoothAdapter({
                    success: res => {
                        console.log('openBluetoothAdapter succ', res)
                        // this.getBluetoothAdapterState()
                    },
                    fail: err => {
                        console.log('openBluetoothAdapter fail', err)
                        uni.showModal({
                            title: '提示',
                            content: '初始化蓝牙失败，请打开本机蓝牙'
                        })
                    }
                })
            },
            // 获取蓝牙适配器状态
            getBluetoothAdapterState() {
                uni.getBluetoothAdapterState({
                    success: res => {
                        console.log('getBluetoothAdapterState succ', res)
                    },
                    fail: err => {
                        console.log('getBluetoothAdapterState fail', err)
                    }
                })
            },
            // 搜索附近蓝牙设备
            startBluetoothDevicesDiscovery() {
                let discovering = true 
                
                this.openBluetoothAdapter()
                
                uni.startBluetoothDevicesDiscovery({
                    success: res => {
                        console.log('startBluetoothDevicesDiscovery succ', res)
                        this.onBluetoothDeviceFound()
                    },
                    fail: err => {
                        console.log('startBluetoothDevicesDiscovery fail', err)
                    }
                })
            },
            stopBluetoothDevicesDiscovery() {
                uni.stopBluetoothDevicesDiscovery({
                    success: res => {
                        console.log('stopBluetoothDevicesDiscovery succ', res)
                    },
                    fail: err => {
                        console.log('stopBluetoothDevicesDiscovery fail', err)
                    }
                })
            },
            onBluetoothDeviceFound() {
                uni.onBluetoothDeviceFound(devices => {
                    console.log('onBluetoothDeviceFound', devices)
                    this.getBluetoothDevices()
                })
            },
            getBluetoothDevices() {
                uni.getBluetoothDevices({
                    success: res => {
                        console.log('getBluetoothDevices succ', res)
                        // this.stopBluetoothDevicesDiscovery()
                        this.dogBluePaisCheck(res.devices, true)
                    },
                    fail: err => {
                        console.log('getBluetoothDevices fail', err)
                    }
                })
            },
            dogBluePaisCheck(devices, need_location) {
                this.isblueok = false
                let pblueid = this.blueid
                for (let device of devices) {
                    var advertisData = arrayBufferToHexString(device.advertisData)
                    var RSSI = device.RSSI
                    var macarr = pblueid.toUpperCase().split('')
                    var mac_split = ''
                    
                    for(var i = 0; i < macarr.length; i++) {
                        if (i != 0 && i % 2 == 0){
                            mac_split = mac_split + ':' + macarr[i]
                        } else {
                            mac_split = mac_split + macarr[i]
                        }
                    }
                    
                }
            }
        }
    }
</script>

<style>

</style>

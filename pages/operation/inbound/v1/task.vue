<template>
    <view>
        <uni-section title="进行中的入库任务" type="line">
            <uni-list>                
                <uni-list-item title="入库日期" :rightText="cur_inbound_task.inbound_date" />
                <uni-list-item title="批次号" :rightText="cur_inbound_task.batch_no" />
                <uni-list-item title="单据编号" :rightText="cur_inbound_task.bill_no" />
                <uni-list-item title="组织" :rightText="cur_stock['FUseOrgId.FName']" />
                <uni-list-item title="仓库" :rightText="[cur_stock['FGroup.FName'], cur_stock.FName].join(' - ')" />
                <uni-list-item title="员工" :rightText="cur_staff.FName" />
            </uni-list>
        </uni-section>
        
        <uni-section title="上架物料信息" type="line">
            <uni-list>
                <uni-list-item
                    v-for="(obj, index) in cur_inbound_task.inbound_list"
                    :key="index"
                    :rightText="[obj.base_unit_qty, obj.base_unit_name].join(' ')"
                    :disabled="obj.dest_stock_id != cur_stock.FStockId"
                >
                    <template v-slot:body>
                        <view class="uni-list-item__content uni-list-item__content--center">
                            <text class="uni-list-item__content-title">{{ obj.material_no }}</text>
                            <view class="uni-list-item__content-note">
                                <view>{{ obj.material_name }}</view> 
                                <view>{{ obj.material_spec }}</view>
                                <view>
                                    <uni-icons type="home" color="#999"></uni-icons>
                                    <text class="src-stock">{{ obj.src_stock_name }}</text>
                                    <uni-icons type="redo" color="#007bff" style="margin: 0 5px;"></uni-icons> 
                                    <uni-icons type="home" color="#007bff" ></uni-icons>
                                    <text class="dest-stock">{{ obj.dest_stock_name }}</text>
                                </view>
                            </view>
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
            
            <uni-list>
                <uni-list-item
                    v-for="(obj, index) in mount_infos"
                    :key="index"
                    :title="obj.material_no"
                    :note="[obj.material_name, obj.material_spec].join('\n')"
                    :rightText="[obj.mounted_qty, obj.base_unit_name].join(' ')"                     
                    showArrow
                />
                <!-- @click="handle_list_item_click(obj)" clickable -->
            </uni-list>
        </uni-section>
        
        <uni-drawer ref="mount_info_drawer">
            <view class="close">
                {{ mount_info_drawer_data }}
            </view>
        </uni-drawer>
    </view>
</template>

<script>
    import store from '@/store'
    import { InboundTask, InvLog } from '@/utils/model' 
    export default {
        data() {
            return {
                cur_stock: {},
                cur_staff: {},
                cur_inbound_task: {},
                inv_logs: [],
                mount_infos: [],
                mount_info_drawer_data: []
            }
        },
        mounted() {
            this.cur_stock = store.state.cur_stock
            this.cur_staff = store.state.cur_staff
            this.cur_inbound_task = InboundTask.current()
            this.load_inv_logs()
        },
        methods: {
            // action           
            handle_list_item_click(mount_info) {
                this.mount_info_drawer_data = this.inv_logs.filter(inv_log => inv_log['FMaterialId.FNumber'] == mount_info.material_no && inv_log.FOpType == 'in' && !inv_log.status)
                this.$refs.mount_info_drawer.open()
            },
            load_inv_logs () {
                InvLog.query(
                    { FStockId: this.cur_stock.FStockId, FBatchNo: this.cur_inbound_task.batch_no, FOpType_in: ['in', 'in_cl'] }, 
                    { order: 'FCreateTime DESC' }).then(res => {
                    res.data.reverse().forEach(log => this.unshift_inv_log(log))
                    this.set_mount_infos()
                })
            },
            unshift_inv_log(inv_log) {
                if (inv_log.FOpType == 'in_cl') {
                    let refer_inv_log = this.inv_logs.find(x => x.FID === inv_log.FReferId )
                    if (refer_inv_log) refer_inv_log.status = '已取消'
                }
                this.inv_logs.unshift(inv_log)
            },
            set_mount_infos() {
                let mount_infos = []
                this.inv_logs.forEach(inv_log => {
                    if(inv_log.FOpType == 'in' && !inv_log.status) {
                        let mount_info = mount_infos.find(info => info.material_no == inv_log['FMaterialId.FNumber'])
                        if (mount_info) {
                            mount_info.mounted_qty += inv_log.FOpQTY
                        } else {
                            mount_info = {
                                material_no: inv_log['FMaterialId.FNumber'],
                                material_name: inv_log['FMaterialId.FName'],
                                material_spec: inv_log['FMaterialId.FSpecification'],
                                mounted_qty: inv_log.FOpQTY,
                                base_unit_name: inv_log['FStockUnitId.FName']
                            }
                            mount_infos.push(mount_info)
                        }
                    }
                })
                this.mount_infos = mount_infos
            }
        }
    }
</script>

<style>

</style>

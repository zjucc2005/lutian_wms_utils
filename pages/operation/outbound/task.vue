<template>
    <view>
        <uni-section
            title="进行中的出库任务"
            :sub-title="cur_outbound_task.bill_no"
            type="line">
            <uni-list>
                <uni-list-item
                    v-for="(obj, index) in cur_outbound_task.outbound_list"
                    :key="index"
                    :title="obj.material_no"
                    :note="[obj.material_name, obj.material_spec].join('\n')"
                    :rightText="[obj.base_unit_qty, obj.base_unit_name].join(' ')" />
            </uni-list>
            
            页面建设中...
        </uni-section>
    </view>
</template>

<script>
    import store from '@/store'
    import { OutboundTask } from '@/utils/model'
    export default {
        data() {
            return {
                cur_stock: {},
                cur_staff: {},
                cur_outbound_task: {}
            }
        },
        mounted() {
            this.cur_stock = store.state.cur_stock
            this.cur_staff = store.state.cur_staff
            this.cur_outbound_task = OutboundTask.current() || {} //读取当前出库任务
        },
        methods: {
            
        }
    }
</script>

<style>

</style>

<template>
    <view class="bg">
        <progress :percent="refresh_interval_progress" stroke-width="2" />
        <uni-row :gutter="10">
            <uni-col :span="8">
                <uni-row>
                    <uni-col :span="12" v-for="stock, index in stocks" :key="index" @click="click_stock(stock)">
                        <uni-card margin="10px" spacing="10px" padding="0"
                            :class="[stock.active ? 'active' : '']">
                            <view class="stock-name" :class="[stock.active ? 'active' : '']">
                                <text class="uni-mr-5">{{ stock.code }}</text>
                                <text>{{ stock.name }}</text>
                            </view>
                            <view class="stock-info">
                                <text class="uni-mr-5">入库量</text>
                                <text>{{ stock.in }}</text>
                            </view>
                            <view class="stock-info">
                                <text class="uni-mr-5">出库量</text>
                                <text>{{ stock.out }}</text>
                            </view>
                            <view class="stock-info">
                                <text class="uni-mr-5">操作数</text>
                                <text>{{ stock.op }}</text>
                            </view>
                        </uni-card>
                    </uni-col>
                </uni-row>
            </uni-col>
            
            <uni-col :span="16">
                <uni-card margin="10px" spacing="0" padding="0" style="height: calc(100vh - 20px); overflow-y: scroll;">
                    <uni-table ref="table">
                        <uni-tr @click="$logger.info('>>>', $data)">
                            <uni-th align="center">时间</uni-th>
                            <uni-th align="center" width="110">仓库</uni-th>
                            <uni-th align="center">物料编码</uni-th>
                            <uni-th align="center">物料名称</uni-th>
                            <uni-th align="center">规格型号</uni-th>
                            <uni-th align="center" width="80">操作</uni-th>
                            <uni-th align="center" width="60">数量</uni-th>
                            <uni-th align="center" width="50">单位</uni-th>
                            <uni-th align="center">员工</uni-th>
                        </uni-tr>
                        <uni-tr v-for="(inv_log, index) in inv_logs_filtered" :key="index">
                            <uni-td :title="inv_log.FCreateTime">{{ formatDate(inv_log.FCreateTime, 'hh:mm:ss') }}</uni-td>
                            <uni-td>{{ inv_log['FStockId.FName'] }}</uni-td>
                            <uni-td>{{ inv_log['FMaterialId.FNumber'] }}</uni-td>
                            <uni-td>{{ inv_log['FMaterialId.FName'] }}</uni-td>
                            <uni-td>{{ inv_log['FMaterialId.FSpecification'] }}</uni-td>
                            <uni-td>
                                <view v-if="['in', 'add'].includes(inv_log.FOpType)" class="text-error">{{ op_type_dict[inv_log.FOpType] }}</view>
                                <view v-if="['out', 'sub'].includes(inv_log.FOpType)" class="text-primary">{{ op_type_dict[inv_log.FOpType] }}</view>
                                <view v-if="['mv_in', 'mv_out'].includes(inv_log.FOpType)">{{ op_type_dict[inv_log.FOpType] }}</view>
                            </uni-td>
                            <uni-td>{{ inv_log['FOpQTY'] }}</uni-td>
                            <uni-td>{{ inv_log['FStockUnitId.FName'] }}</uni-td>
                            <uni-td>{{ inv_log.FOpStaffNo }}</uni-td>
                        </uni-tr>
                    </uni-table>
                </uni-card>
            </uni-col>
        </uni-row>
    </view>
</template>

<script>
    import store from '@/store'
    import { InvLog } from '@/utils/model'
    import { formatDate } from '@/utils'
    
    export default {
        data() {
            return {
                inv_logs: [],
                refresh_interval: null, // 刷新计时器
                refresh_interval_progress: 0,
                last_timestamp: Number(new Date(formatDate(Date.now(), 'yyyy-MM-dd'))), // 初始化今天0点
                op_type_dict: InvLog.FOpTypeEnum,
                stocks: [
                    { id: 103409,  code: 'WL01', name: '汽油机材料库',     active: false, in: 0, out: 0, op: 0 },
                    { id: 2970623, code: 'WL02', name: '变频机材料库',     active: false, in: 0, out: 0, op: 0 },
                    { id: 103414,  code: 'WL03', name: '面板材料库',       active: false, in: 0, out: 0, op: 0 },
                    { id: 103410,  code: 'WL04', name: '柴油机材料库',     active: false, in: 0, out: 0, op: 0 },
                    { id: 103416,  code: 'WL05', name: '内燃机包材辅料库', active: false, in: 0, out: 0, op: 0 },
                    { id: 103415,  code: 'WL06', name: '内燃机原料库',     active: false, in: 0, out: 0, op: 0 },
                    { id: 103413,  code: 'WL07', name: '喷漆材料库',       active: false, in: 0, out: 0, op: 0 },
                    { id: 1478700, code: 'WL08', name: '机架成品库',       active: false, in: 0, out: 0, op: 0 }
                ],
                stock_index: {
                    103409: 0,
                    2970623: 1,
                    103414: 2,
                    103410: 3,
                    103416: 4,
                    103415: 5,
                    103413: 6,
                    1478700: 7
                }
            }
        },
        onUnload() {
            if (this.refresh_interval) {
                clearInterval(this.refresh_interval) // 回收刷新计时器
            }
        },
        mounted() {
            this.refresh_interval = setInterval(() => {
                let d = Date.now() - this.last_timestamp
                this.refresh_interval_progress = d * 100 / 60000
                if (d > 60000) this.load_inv_logs()
            }, 50) // 设定刷新计时器, 60s
        },
        computed: {
            inv_logs_filtered() {
                let active_stock = this.stocks.find(s => s.active)
                if (active_stock) {
                    return this.inv_logs.filter(log => log.FStockId === active_stock.id)
                } else {
                    return this.inv_logs
                }
            }
        },
        methods: {
            formatDate,
            click_stock(stock) {
                for (let _s of this.stocks) {
                    if (_s.id === stock.id) {
                        _s.active = !_s.active
                    } else {
                        _s.active = false
                    }
                }
            },
            async load_inv_logs() {
                let options = { FStockId_in: this.stocks.map(s => s.id) }
                options.FCreateTime_ge = formatDate(this.last_timestamp, 'yyyy-MM-dd hh:mm:ss.SSS')
                this.last_timestamp = Date.now()
                InvLog.query(options, { order: 'FID DESC' }).then(res => {
                    for (let d of res.data) {
                        this.inv_logs.push(d)
                        if (d.FOpType == 'in') this.stocks[this.stock_index[d.FStockId]].in += d.FOpQTY
                        if (d.FOpType == 'out') this.stocks[this.stock_index[d.FStockId]].out += d.FOpQTY
                        if (d.FOpType != 'mv_in') this.stocks[this.stock_index[d.FStockId]].op += 1
                    }
                })
            },
        }
    }
</script>

<style lang="scss" scoped>
    .bg::v-deep{
        width: 100%;
        height: 100vh;
        overflow: hidden;
        background-color: #1D2B56;
        background: url('@/static/image/dashboard-bg.jpg') no-repeat;
        background-size: cover;
        .uni-card {
            background: rgba(21,45,103,.4);
            border-color: rgba(103,144,255,.2);
            &.active {
                border-color: rgba(103,144,255,.8);
            }
        }
        .uni-table {
            background: none;
            .uni-table-tr:nth-child(n+2):hover {
                background-color: rgba(103,144,255,.2);
            }
            th, td {
                color: #fff;
                border-color: rgba(103,144,255,.2);
            }
        }
    }
    .stock-name {
        min-height: 30px;
        color: rgba(103,144,255,.9);
        font-size: 20px;
        border-bottom: 1px solid rgba(103,144,255,.8);
        &.active {
            color: #fff;
        }
    }
    .stock-info {
        color: #fff;
        font-size: 16px;
        line-height: 1.8;
    }
</style>

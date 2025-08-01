<template>
    <uni-section title="出入库数量统计" type="square">
        <qiun-data-charts
            :type="type"
            :opts="opts"
            :chart-data="chart_data"
            ontouch
            />
    </uni-section>

    <uni-section title="设置" type="square">
        <view class="container">
            <uni-segmented-control
                :current="0"
                :values="['日视图', '周视图', '月视图']"
                @click-item="segment_click"/>
            
            <!-- <button @click="debug" class="uni-mt-6">DEBUG</button> -->
        </view>
    </uni-section>
</template>

<script>
    import store from '@/store'
    import { InvLog } from '@/utils/model'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    export default {
        data() {
            return {
                raw_data: [],
                mode: 'day', // 视图模式 month/week/day
                stime: null,
                type: 'line',
                opts: {
                    enableScroll: true,
                    scrollPosition: 'right',
                    xAxis: {
                        scrollShow: true,
                        scrollAlign: 'right',
                        // #ifdef APP-PLUS
                        itemCount: 8,
                        // #endif
                        // #ifdef H5
                        itemCount: Math.max(Math.floor(store.state.system_info.windowWidth / 60), 8),
                        // #endif
                    },
                    extra: {
                        line: {
                            type: "curve",
                            width: 2,
                            activeType: "hollow"
                        }
                    }
                },
                chart_data: {
                    categories: [],
                    series: []
                }
            }
        },
        mounted() {
            this._get_stime()
            this.load_raw_data()
        },
        methods: {
            segment_click(e) {
                if (e.currentIndex === 0) this._set_chart_data_day()
                if (e.currentIndex === 1) this._set_chart_data_week()
                if (e.currentIndex === 2) this._set_chart_data_month()
            },
            async load_raw_data() {
                try {
                    let options = {
                        FOpType_in: ['in', 'in_cl', 'out', 'out_cl'],
                        FStockId: store.state.cur_stock.FStockId,
                        FCreateTime_ge: formatDate(this.stime, 'yyyy-MM-dd')
                    }
                    uni.showLoading({ title: 'Loading' })
                    let res = await InvLog.inventory_record(options)
                    uni.hideLoading()
                    this.raw_data = res.map(x => { x[4] = Number(new Date(x[3])); return x })
                    this._set_chart_data_day()
                } catch (err) {}
            },
            // 月视图数据
            _set_chart_data_month() {
                this.mode = 'month'
                let categories = []
                let inbound_data = []
                let outbound_data = []
                let syear = this.stime.getFullYear()
                let smonth = this.stime.getMonth()
                for (let i = 0; i < 12; i++) {
                    let cur_year = syear
                    let cur_month = smonth + i
                    if (cur_month > 11) {
                        cur_year += 1
                        cur_month -= 12
                    }
                    let cur_time = new Date(cur_year, cur_month, 1)
                    let next_year = cur_year
                    let next_month = cur_month + 1
                    if (next_month > 11) {
                        next_year += 1
                        next_month -= 12
                    }
                    let next_time = new Date(next_year, next_month, 1)
                    categories.push(formatDate(cur_time, 'yy.MM'))
                    inbound_data.push(this._sum_inbound(cur_time, next_time)) 
                    outbound_data.push(this._sum_outbound(cur_time, next_time))
                }
                this.chart_data = {
                    categories,
                    series: [
                        { name: "入库", data: inbound_data },
                        { name: "出库", data: outbound_data }
                    ]
                }
            },
            // 周视图数据, 从周一至周日为一周
            _set_chart_data_week() {
                this.mode = 'week'
                let categories = []
                let inbound_data = []
                let outbound_data = []
                let cur_time = this.stime
                let wday = cur_time.getDay()
                if (wday === 1) {
                    cur_time = Number(cur_time)
                } else {
                    cur_time = Number(cur_time) + (8 - wday) * 24 * 3600 * 1000 // 不满一周的数据舍去
                }
                while(cur_time < Date.now()) {
                    let next_time = cur_time + 604800000 // +7day
                    categories.push(formatDate(cur_time, 'MM.dd'))
                    inbound_data.push(this._sum_inbound(cur_time, next_time))
                    outbound_data.push(this._sum_outbound(cur_time, next_time))
                    cur_time = next_time
                }
                this.chart_data = {
                    categories,
                    series: [
                        { name: "入库", data: inbound_data },
                        { name: "出库", data: outbound_data }
                    ]
                }
            },
            // 日视图数据
            _set_chart_data_day() {
                this.mode = 'day'
                let categories = []
                let inbound_data = []
                let outbound_data = []
                let cur_time = Number(this.stime)
                while(cur_time < Date.now()) {
                    let next_time = cur_time + 86400000 // +1day
                    categories.push(formatDate(cur_time, 'MM.dd'))
                    inbound_data.push(this._sum_inbound(cur_time, next_time))
                    outbound_data.push(this._sum_outbound(cur_time, next_time))
                    cur_time = next_time
                }
                this.chart_data = {
                    categories,
                    series: [
                        { name: "入库", data: inbound_data },
                        { name: "出库", data: outbound_data }
                    ]
                }
            },
            // 入库计数
            _sum_inbound(stime, etime) {
                let sum = 0
                this.raw_data.forEach(x => {
                    if (['in', 'in_cl'].includes(x[0]) && x[4] >= stime && x[4] < etime) {
                        sum += x[1]
                    }
                })
                return sum
            },
            // 出库计数
            _sum_outbound(stime, etime) {
                let sum = 0
                this.raw_data.forEach(x => {
                    if (['out', 'out_cl'].includes(x[0]) && x[4] >= stime && x[4] < etime) {
                        sum -= x[1]
                    }
                })
                return sum
            },
            _get_stime() {
                let s = new Date(Date.now() - 30 * 24 * 3600 * 1000)
                let year = s.getFullYear()
                let month = s.getMonth()
                let date = s.getDate()
                this.stime = new Date(year, month, date)
                // let now = new Date()
                // let year = now.getFullYear()
                // let month = now.getMonth()
                // this.stime = new Date(year - 1, month + 1, 1) // GMT+8
                // if (this.stime < new Date('2025-02-01')) {
                //     this.stime = new Date('2025-02-01')
                // }
            },
            debug(e) {
                // this.load_data_month(0)
                this.$logger.info('debug', this.$data)
            }
        }
    }
</script>

<style>

</style>

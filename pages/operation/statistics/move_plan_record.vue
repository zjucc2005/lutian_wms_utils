<template>
    <uni-section title="库存调整(次数)统计" type="square">
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
                :values="['日视图']"
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
                },
                
            }
        },
        mounted() {
            this._get_stime()
            this.load_raw_data()
        },
        methods: {
            segment_click(e) {
                if (e.currentIndex === 0) this._set_chart_data_day()
                if (e.currentIndex === 1) this._set_chart_data_month()
                if (e.currentIndex === 2) this._set_chart_data_season()
            },
            async load_raw_data() {
                try {
                    let options = {
                        FOpType_in: ['mv_in', 'add', 'sub'],
                        FStockId: store.state.cur_stock.FStockId,
                        FCreateTime_ge: formatDate(this.stime, 'yyyy-MM-dd')
                    }
                    // console.log('options', options)
                    uni.showLoading({ title: 'Loading' })
                    let res = await InvLog.inventory_record(options)
                    // console.log('res', res)
                    uni.hideLoading()
                    this.raw_data = res.map(x => { x[3] = Number(new Date(x[2])); return x })
                    this._set_chart_data_day()
                } catch (err) {}
            },
            // 季视图数据
            _set_chart_data_season() {
                this.mode = 'season'
                let categories = []
                let sum_data = []
                let mv_data = []
                let add_data = []
                let sub_data = []
                let syear = this.stime.getFullYear()
                let smonth = this.stime.getMonth()
                // 取每季度首月，即 1,4,7,10 月
                let rem = (smonth + 1) % 3
                if (rem == 0) smonth = smonth + 1
                if (rem == 2) smonth = smonth + 2
                if (smonth > 11) {
                    syear += 1
                    smonth -= 12
                }

                for (let i = 0; i < 4; i++) {
                    let cur_year = syear
                    let cur_month = smonth + i * 3
                    if (cur_month > 11) {
                        cur_year += 1
                        cur_month -= 12
                    }
                    let cur_time = new Date(cur_year, cur_month, 1)
                    let next_year = cur_year
                    let next_month = cur_month + 3
                    if (next_month > 11) {
                        next_year += 1
                        next_month -= 12
                    }
                    let next_time = new Date(next_year, next_month, 1)
                    categories.push(formatDate(cur_time, 'yy.MM'))
                    sum_data.push(this._sum_op_type('sum', cur_time, next_time))
                    mv_data.push(this._sum_op_type('mv_in', cur_time, next_time))
                    add_data.push(this._sum_op_type('add', cur_time, next_time))
                    sub_data.push(this._sum_op_type('sub', cur_time, next_time))
                }
                this.chart_data = {
                    categories,
                    series: [
                        { name: "合计", data: sum_data },
                        { name: "移库", data: mv_data },
                        { name: "调增", data: add_data },
                        { name: "调减", data: sub_data }
                    ]
                }
            },
            // 月视图数据
            _set_chart_data_month() {
                this.mode = 'month'
                let categories = []
                let sum_data = []
                let mv_data = []
                let add_data = []
                let sub_data = []
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
                    sum_data.push(this._sum_op_type('sum', cur_time, next_time))
                    mv_data.push(this._sum_op_type('mv_in', cur_time, next_time))
                    add_data.push(this._sum_op_type('add', cur_time, next_time))
                    sub_data.push(this._sum_op_type('sub', cur_time, next_time))
                }
                this.chart_data = {
                    categories,
                    series: [
                        { name: "合计", data: sum_data },
                        { name: "移库", data: mv_data },
                        { name: "调增", data: add_data },
                        { name: "调减", data: sub_data }
                    ]
                }
            },
            // 日视图数据
            _set_chart_data_day() {
                this.mode = 'day'
                let categories = []
                let sum_data = []
                let mv_data = []
                let add_data = []
                let sub_data = []
                let cur_time = Number(this.stime)
                while(cur_time < Date.now()) {
                    let next_time = cur_time + 86400000 // +1day
                    categories.push(formatDate(cur_time, 'MM.dd'))
                    sum_data.push(this._sum_op_type('sum', cur_time, next_time))
                    mv_data.push(this._sum_op_type('mv_in', cur_time, next_time))
                    add_data.push(this._sum_op_type('add', cur_time, next_time))
                    sub_data.push(this._sum_op_type('sub', cur_time, next_time))
                    cur_time = next_time
                }
                this.chart_data = {
                    categories,
                    series: [
                        { name: "合计", data: sum_data },
                        { name: "移库", data: mv_data },
                        { name: "调增", data: add_data },
                        { name: "调减", data: sub_data }
                    ]
                }
            },
            // 计数
            _sum_op_type(op_type, stime, etime) {
                let sum = 0
                this.raw_data.forEach(x => {
                    if (op_type == 'sum') {
                        if (x[3] >= stime && x[3] < etime) sum += 1
                    } else {
                        if (x[0] == op_type && x[3] >= stime && x[3] < etime) sum += 1
                    }
                })
                return sum
            },
            _get_stime() {
                // let now = new Date()
                let s = new Date(Date.now() - 30 * 24 * 3600 * 1000)
                let year = s.getFullYear()
                let month = s.getMonth()
                let date = s.getDate()
                // this.stime = new Date(year - 1, month + 1, 1) // GMT+8
                this.stime = new Date(year, month, date)
                // if (this.stime < new Date('2025-02-01')) {
                //     this.stime = new Date('2025-02-01')
                // }
            },
            debug(e) {
                this.$logger.info('debug', this.$data)
            }
        }
    }
</script>

<style>

</style>

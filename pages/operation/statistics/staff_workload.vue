<template>
    <uni-section :title="breadcrumb_stockname()" type="square" @click="debug">
        <uni-row>
            <uni-col :md="6">
                <view class="container uni-mb-5">
                    <uni-forms ref="search_form" :model="search_form" :rules="search_form_rules" label-width="70px">
                        <uni-forms-item name="created_at_range" label="时间" >
                            <uni-datetime-picker type="daterange" v-model="search_form.created_at_range" />
                        </uni-forms-item>
                    </uni-forms>
                    <button type="primary" size="mini" @click="search">搜索</button>
                    <button size="mini" @click="reset_search_form" class="uni-ml-5">重置</button>
                </view>
            </uni-col>
            
            <uni-col :md="18">
                <uni-table ref="table" stripe border class="table-sm">
                    <uni-tr>
                        <uni-th align="center" sortable @sort-change="sort_change($event, 'name')" width="100">员工账号</uni-th>
                        <uni-th align="center" sortable @sort-change="sort_change($event, 'in')">入库</uni-th>
                        <uni-th align="center" sortable @sort-change="sort_change($event, 'out')">出库</uni-th>
                        <uni-th align="center" sortable @sort-change="sort_change($event, 'in+out')">入库+出库</uni-th>
                        <uni-th align="center" sortable @sort-change="sort_change($event, 'other')">其他</uni-th>
                    </uni-tr>
                    <uni-tr v-for="(obj, index) in table_data" :key="index">
                        <uni-td align="center">{{ obj.name }}</uni-td>
                        <uni-td align="center">{{ obj.in }}</uni-td>
                        <uni-td align="center">{{ obj.out }}</uni-td>
                        <uni-td align="center">{{ obj.in + obj.out }}</uni-td>
                        <uni-td align="center">{{ obj.other }}</uni-td>
                    </uni-tr>
                </uni-table>
            </uni-col>
        </uni-row>
    </uni-section>
</template>

<script>
    import store from '@/store'
    import { breadcrumb_stockname, formatDate } from '@/utils'
    import { InvLog, BdEmpInfo } from '@/utils/model'
    
    export default {
        data() {
            return {
                table_data: [],
                staff_info: {},
                search_form: {
                    created_at_range: [],
                },
                search_form_rules: {
                    created_at_range: {
                        rules: [
                            { required: true, errorMessage: '时间不能为空' },
                        ]
                    }
                },
            }
        },
        mounted() {
            // this.load_data()
        },
        methods: {
            breadcrumb_stockname,
            formatDate,
            debug() {
                this.$logger.info('>>>', this.$data)
            },
            sort_change(e, field) {
                let order = 0
                if (e.order == 'ascending') order = 1
                if (e.order == 'descending') order = -1
                if (order == 0) {
                    this.table_data.sort((x, y) => x.in + x.out > y.in + y.out ? -1 : 1)
                    return
                }
                this.table_data.sort((x, y) => {
                    if (field == 'in+out') {
                        return x.in + x.out > y.in + y.out ? order : -order
                    } else {
                        return x[field] > y[field] ? order : -order
                    }
                })
            },
            reset_search_form() {
                this.search_form = {}
                this.table_data = []
            },
            async search() {
                try {
                    await this.$refs.search_form.validate()                    
                    let options = {
                        FOpType_in: ['in', 'out', 'in_cl', 'out_cl', 'mv_in', 'add', 'sub'],
                        FStockId: store.state.cur_stock.FStockId,
                        FCreateTime_ge: this.search_form.created_at_range[0],
                        FCreateTime_le: this.search_form.created_at_range[1] + ' 23:59:59'
                    }
                    let staff_info = {}
                    let staff_nos = new Set()
                    let res = null
                    let page = 1
                    let per_page = 10000
                    while (!res || res.data.length === per_page) {
                        res = await InvLog.query(options, { fields: ['FOpStaffNo', 'FOpType'], page, per_page, return: 'array' })
                        for (let d of res.data) {
                            staff_nos.add(d[0])
                            staff_info[d[0]] ||= { in: 0, out: 0, other: 0 }
                            if (d[1] === 'in') { staff_info[d[0]]['in']++ } 
                            else if (d[1] === 'in_cl') { staff_info[d[0]]['in']-- }
                            else if (d[1] === 'out') { staff_info[d[0]]['out']++ }
                            else if (d[1] === 'out_cl') { staff_info[d[0]]['out']-- }
                            else { staff_info[d[0]]['other']++ }
                        }
                    }
                    if (staff_nos.size > 0) {
                        let emp_res = await BdEmpInfo.query({ FNumber_in: Array.from(staff_nos) }, { fields: ['FNumber', 'FName'], return: 'array' })
                        for (let d of emp_res.data) {
                            staff_info[d[0]]['name'] = d[1]
                        }
                    }
                    this.staff_info = staff_info
                    this.table_data = []
                    for (let k in staff_info) {
                        this.table_data.push(staff_info[k])
                    }
                    this.table_data.sort((x, y) => x.in + x.out > y.in + y.out ? -1 : 1)
                } catch (err) {
                    this.$logger.info('err', err)
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    .uni-table-tr::v-deep {
        .uni-table-th {
            color: $uni-text-color;
        }
        .uni-table-td {
            padding: 4px 5px;
        }
    }
</style>

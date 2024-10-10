<template>
    <uni-notice-bar v-if="$store.state.env != 'prod'" text="测试版" single show-icon/>
    <view class="container">
        <view class="logo-wrapper">
            <image src="/static/logo-wms.png"></image>
            <view>LOGO</view>
        </view>
        <uni-forms ref="login_form" :model="login_form"  :rules="login_form_rules" labelWidth="80px">
            <uni-forms-item label="仓库" name="stock_id">
                <uni-data-picker
                    v-model="login_form.stock_id"
                    :localdata="stock_opts"
                    @change="handle_stock_change"
                    popup-title="请选择所属仓库"
                />
            </uni-forms-item>
            <uni-forms-item label="姓名" name="staff_name">
                <uni-easyinput v-model="login_form.staff_name" trim="both" />
            </uni-forms-item>
            <uni-forms-item label="工号" name="staff_no">
                <uni-easyinput v-model="login_form.staff_no" trim="both" />
            </uni-forms-item>
            <button type="primary" @click="submit_login">登录</button>
        </uni-forms>
    </view>
</template>

<script> 
    import store from '@/store'
    import { play_audio_prompt } from '@/utils'
    import { validate_staff, get_bd_stocks } from '@/utils/api'
    import { StockLoc } from '@/utils/model'
    export default {
        data() {
            return {
                login_form: {
                    org_id: store.state.cur_stock.FUseOrgId,
                    stock_id: store.state.cur_stock.FStockId,
                    staff_name: store.state.cur_staff.FName,
                    staff_no: store.state.cur_staff.FNumber,
                },
                login_form_rules: {
                    stock_id: {
                        rules: [
                            { required: true, errorMessage: '仓库不能为空'},
                        ]
                    },
                    staff_name: {
                        rules: [
                            { required: true, errorMessage: '姓名不能为空' },
                        ]
                    },
                    staff_no: {
                        rules: [
                            { required: true, errorMessage: '工号不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    uni.showLoading({ title: 'loading' })
                                    return validate_staff(this.login_form.staff_name, this.login_form.staff_no, this.login_form.org_id).then(staff => {
                                        uni.hideLoading()
                                        if (staff) {
                                            if (staff.FForbiddenStatus != '0') return callback("账号禁用")
                                            this.staff = staff
                                        } else {
                                            return callback('姓名或工号或分属组织错误')
                                        }
                                    })
                                }
                            }
                        ]
                    }
                },
                staff: {},
                bd_stocks: [],
                stock_opts: [] // 仓库分组，data-picker为[组织,分组,仓库]3级选择
            }
        },
        mounted() {
           this.load_stocks()
        },
        methods: {
            load_stocks() {
                if (store.state.bd_stocks?.length) {
                    this.bd_stocks = store.state.bd_stocks
                    this.set_stock_opts()
                } else {
                    uni.showLoading({ title: 'Loading' })
                    get_bd_stocks().then(res => {
                        store.commit('set_bd_stocks', res.data)
                        this.bd_stocks = res.data
                        this.set_stock_opts()
                        uni.hideLoading()
                    })
                }
            },
            set_stock_opts() {
                // 组织 - 分组 - 仓库
                const stock_opts = []
                this.bd_stocks.forEach(d => {
                    let org = stock_opts.find(opt => opt.value === d.FUseOrgId)
                    if (!org) {
                        org = { text: d['FUseOrgId.FName'], value: d.FUseOrgId, children: [] }
                        stock_opts.push(org)
                    }
                    // DEBUG: data-picker 会扁平化数据，再去查找父级，父级value相同时数据会乱, group.value重新组装以保证唯一性
                    let group_value = [d.FUseOrgId, d.FGroup].join(',')
                    let group = org.children.find(x => x.value == group_value)
                    if (!group) {
                        group = { text: d['FGroup.FName'] || '未分组', value: group_value, children: [] }
                        org.children.push(group)
                    }
                    group.children.push({ text: d.FName, value: d.FStockId })
                })
                stock_opts.sort((x, y) => x.value - y.value) // 按组织编号排序
                this.stock_opts = stock_opts
            },
            handle_stock_change(e) {
                this.login_form.org_id = e.detail.value[0]?.value
            },
            submit_login() {
                this.$refs.login_form.validate().then(e => {
                    play_audio_prompt('success')
                    const store_data = {
                        stock: this.bd_stocks.find(d => d.FStockId === this.login_form.stock_id),
                        staff: this.staff
                    }
                    store.commit('staff_login', store_data)
                    this.after_login()
                    uni.showToast({ title: '登录成功' })
                    uni.reLaunch({ url: '/pages/operation/index_v2' })                  
                }).catch(err => {
                    console.log('submit_login err:', err);
                })
            },
            after_login() {
                StockLoc.query({ FStockId: store.state.cur_stock.FStockId }).then(res => {
                    store.commit('set_stock_locs', res.data)
                })
            }
        }
    }
</script>

<style lang="scss">
    .logo-wrapper {
        text-align: center;
        margin: 22px 0;
        image {
            width: 80px;
            height: 80px;
        }
        view {
            font-size: 12px;
            color: #999;
        }
    }
</style>

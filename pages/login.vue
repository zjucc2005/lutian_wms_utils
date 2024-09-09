<template>
    <view class="container">
        <uni-forms ref="login_form" :model="login_form"  :rules="login_form_rules" labelWidth="80px">
            <uni-forms-item label="仓库" name="stock_id">
                <uni-data-picker
                    v-model="login_form.stock_id"
                    :localdata="stock_opts"
                    @change="handle_stock_change"
                >
                </uni-data-picker>
            </uni-forms-item>
            <uni-forms-item label="姓名" name="staff_name">
                <uni-easyinput v-model="login_form.staff_name" />
            </uni-forms-item>
            <uni-forms-item label="工号" name="staff_no">
                <uni-easyinput v-model="login_form.staff_no" />
            </uni-forms-item>
            <button type="primary" @click="submit('login_form')">登录</button>
        </uni-forms>    
    </view>
</template>

<script>
    import { validate_staff, get_bd_stocks } from '@/utils/api'
    import store from '@/store'
    export default {
        data() {
            return {
                login_form: {
                    org_id: store.state.cur_stock.FUseOrgId,
                    stock_id: store.state.cur_stock.FStockId,
                    staff_name: store.state.cur_staff.FName,
                    staff_no: store.state.cur_staff.FNumber
                },
                login_form_rules: {
                    stock_id: {
                        rules: [{
                            required: true,
                            errorMessage: '仓库不能为空'
                        }]
                    },
                    staff_name: {
                        rules: [{
                            required: true,
                            errorMessage: '姓名不能为空'
                        }]
                    },
                    staff_no: {
                        rules: [{
                            required: true,
                            errorMessage: '工号不能为空'
                        }]
                    }
                },
                bd_stocks: [],
                stock_opts: [] // 仓库分组，data-picker为两级选择
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
                    // console.log('load state.bd_stocks:', store.state.bd_stocks)
                } else {
                    get_bd_stocks().then(res => {
                        store.commit('set_bd_stocks', res.data)
                        this.bd_stocks = res.data
                        this.set_stock_opts()
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
                    let group = org.children.find(x => x.value === d.FGroup)
                    if (!group) {
                        group = { text: d['FGroup.FName'] || '未分组', value: d.FGroup, children: [] }
                        org.children.push(group)
                    }
                    group.children.push({ text: d.FName, value: d.FStockId })
                })
                stock_opts.sort((x, y) => { return x.value - y.value }) // 按组织编号排序
                this.stock_opts = stock_opts
            },
            handle_stock_change(e) {
                this.login_form.org_id = e.detail.value[0]?.value
            },
            submit(ref) {
                this.$refs[ref].validate().then(e => {
                    console.log('success', e);
                    uni.showLoading({ title: 'loading' }); // 网络慢时，需要loading提示
                    validate_staff(e.staff_name, e.staff_no, this.login_form.org_id).then(res => {
                        if (res) {
                            if (res.FForbiddenStatus != '0') {
                                uni.showToast({
                                    icon: "error",
                                    title: '账号异常'
                                })
                                return
                            }
                            const bd_stock = this.bd_stocks.find(d => d.FStockId === e.stock_id)
                            const store_data = {
                                stock: bd_stock,
                                staff: res
                            }
                            store.commit('staff_login', store_data)
                            uni.showToast({
                                title: '登录成功'
                            })
                            uni.reLaunch({
                                url: '/pages/operation/index'
                            })
                        } else {
                            this.login_form.staff_no = ''
                            uni.showToast({
                                title: '姓名或工号或分属组织错误'
                            })
                        }
                    })                    
                }).catch(err => {
                    console.log('err', err);
                    uni.hideLoading()
                })
            }
        }
    }
</script>

<style>

</style>

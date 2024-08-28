<template>
    <view>
        <uni-section class="container">
            <uni-forms ref="login_form" :model="login_form"  :rules="login_form_rules" labelWidth="60px">
                <uni-forms-item label="仓库" name="depot_id">
                    <uni-data-picker v-model="login_form.depot_id" :localdata="depot_opts" popup-title="请选择">
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
        </uni-section>
    </view>
</template>

<script>
    import K3CloudApi from '@/utils/k3cloudapi'
    import store from '@/store'
    export default {
        data() {
            return {
                login_form: {
                    depot_id: store.state.cur_depot.FStockId,
                    staff_name: store.state.cur_staff.FName,
                    staff_no: store.state.cur_staff.FNumber
                },
                login_form_rules: {
                    depot_id: {
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
                depot_opts: []
            }
        },
        mounted() {
           this.load_depots()
        },
        methods: {
            load_depots() {
                if (store.state.bd_depot_opts?.length) {
                    this.depot_opts = store.state.bd_depot_opts
                    console.log('load state.bd_depot_opts:', store.state.bd_depot_opts)
                } else {
                    const params = {
                        FormId: 'BD_STOCK',
                        FieldKeys: "FStockId,FName",
                        Limit: 100
                    }
                    K3CloudApi.bill_query(params).then(res => {
                        const depot_opts = []
                        res.forEach(d => {
                            depot_opts.push({ text: d.FName, value: d.FStockId })
                        })
                        this.depot_opts = depot_opts
                        store.commit('set_bd_depot_opts', depot_opts)
                    })
                }
            },
            submit(ref) {
                this.$refs[ref].validate().then(e => {
                    // console.log('success', e);
                    K3CloudApi.validate_staff(e.staff_name, e.staff_no).then(res => {
                        if (res) {
                            const depot_opt = this.depot_opts.find(opt => opt.value === e.depot_id)
                            const store_data = {
                                depot: { FStockId: depot_opt.value, FName: depot_opt.text },
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
                                title: '姓名或工号错误'
                            })
                        }
                    })                    
                }).catch(err => {
                    console.log('err', err);
                })
            }
        }
    }
</script>

<style>

</style>

<template>
    <view class="container">
        <view class="logo-wrapper">
            <image src="/static/logo-wms.png"></image>
            <view>内销货位</view>
        </view>
        <view class="form-wrapper">
            <uni-forms ref="login_form" :model="login_form"  :rules="login_form_rules" labelWidth="60px" class="form">
                <uni-forms-item label="仓库" name="stock_id">
                    <uni-data-picker
                        ref="stock_id_data_picker"
                        v-model="login_form.stock_id"
                        :localdata="stock_opts"
                        @change="handle_stock_change"
                        popup-title="请选择所属仓库"
                        class="hidden-data-picker"                    
                        >
                        <template v-slot:default>
                            <view class="custom-data-picker-input">
                                <text v-if="login_form?.stock_id" class="selected">
                                    {{ selected_stock_info() }}
                                </text>
                                <template v-else>
                                    <text class="placeholder">请选择</text>
                                </template>
                                <uni-icons type="down" color="#999"></uni-icons>
                            </view>
                        </template>
                    </uni-data-picker>
                </uni-forms-item>
                <uni-forms-item label="姓名" name="staff_name">
                    <uni-easyinput v-model="login_form.staff_name" trim="both" />
                </uni-forms-item>
                <uni-forms-item label="工号" name="staff_no">
                    <uni-easyinput v-model="login_form.staff_no" trim="both" />
                </uni-forms-item>
                <button type="primary" @click="submit_login">登录</button>
                <button @click="$refs.guest_login_dialog.open()" class="uni-mt-11">访客账号登录</button>
            </uni-forms>
        </view>
        
    </view>
    
    <uni-popup ref="guest_login_dialog" type="dialog">
        <uni-popup-dialog
            type="error"
            title="访客账号登录"
            cancelText="关闭"
            @close="$refs.guest_login_dialog.close()"
            @confirm="submit_guest_login"
            :before-close="true"
            style="width: 360px;"
            >
            <view style="flex: 1;">
                <uni-notice-bar text="访客账号为公用账号，只能使用指定的功能" single/>
                
                <uni-forms ref="guest_login_form" :model="guest_login_form" :rules="guest_login_form_rules">
                    <uni-forms-item label="组织" name="use_org_id">
                        <uni-data-select
                            v-model="guest_login_form.use_org_id"
                            :localdata="stock_opts"
                            :clear="false"
                        />
                    </uni-forms-item>
                </uni-forms>
            </view>
        </uni-popup-dialog>
    </uni-popup>
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
                            { required: true, errorMessage: '请选择仓库'},
                        ]
                    },
                    staff_name: {
                        rules: [
                            { required: true, errorMessage: '请填写姓名' },
                        ]
                    },
                    staff_no: {
                        rules: [
                            { required: true, errorMessage: '请填写工号' },
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
                stock_opts: [], // 仓库分组，data-picker为[组织,分组,仓库]3级选择
                guest_login_form: {
                    org_id: store.state.cur_stock.FUseOrgId
                },
                guest_login_form_rules: {
                    use_org_id: {
                        rules: [
                            { required: true, errorMessage: '请选择组织'}
                        ]
                    }
                }
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
                        uni.hideLoading()
                        store.commit('set_bd_stocks', res.data)
                        this.bd_stocks = res.data
                        this.set_stock_opts()
                    })
                }
            },
            set_stock_opts() {
                // 组织 - 分组 - 仓库
                const stock_opts = []
                for (let d of this.bd_stocks) {
                    if (d.FDocumentStatus != 'C' || d.FForbidStatus != 'A') continue
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
                }
                stock_opts.sort((x, y) => x.value - y.value) // 按组织编号排序
                this.stock_opts = stock_opts
            },
            show_stock_opts() {
                this.$refs.stock_id_data_picker.show()
            },
            handle_stock_change(e) {
                this.login_form.org_id = e.detail.value[0]?.value
            },
            selected_stock_info() {
                if (this.login_form.stock_id) {
                    let bd_stock = store.state.bd_stocks.find(x => x.FStockId === this.login_form.stock_id)
                    if (!bd_stock) return ''
                    return [bd_stock['FUseOrgId.FName'], bd_stock['FGroup.FName'], bd_stock.FName].join('\n')
                } else {
                    return ''
                }
            },
            submit_login() {
                this.$refs.login_form.validate().then(res => {
                    play_audio_prompt('success')
                    const store_data = {
                        stock: this.bd_stocks.find(d => d.FStockId === this.login_form.stock_id),
                        staff: this.staff
                    }
                    store.commit('staff_login', store_data)
                    this.after_login()
                    this.$logger.info(`>>> 登录成功[${this.staff.FName}]`)
                    uni.showToast({ title: '登录成功' })
                    uni.reLaunch({ url: '/pages/operation/index_v2' })                  
                }).catch(err => {})
            },
            // 访客登录要设定组织
            submit_guest_login() {
                this.$refs.guest_login_form.validate().then(res => {
                    let opt = this.stock_opts.find(x => x.value == this.guest_login_form.use_org_id)
                    let params = {
                        stock: { 'FUseOrgId.FName': opt.text, FUseOrgId: opt.value }
                    }
                    play_audio_prompt('success')
                    store.commit('guest_login', params)
                    this.$logger.info('>>> 登录成功[GUEST]')
                    uni.showToast({ title: '登录成功' })
                    uni.reLaunch({ url: '/pages/operation/index_v2' })  
                }).catch(err => {})
            },
            after_login() {
                StockLoc.query({ FStockId: store.state.cur_stock.FStockId }).then(res => {
                    store.commit('set_stock_locs', res.data)
                })
            }
        }
    }
</script>

<style lang="scss" scoped>
    .logo-wrapper {
        text-align: center;
        padding: 22px 0;
        image {
            width: 80px;
            height: 80px;
        }
        view {
            font-size: $uni-font-size-sm;
            color: $uni-text-color-grey;
        }
    }
    .form-wrapper {
        display: flex;
        justify-content: center;
        .form {
            width: 100%;
            max-width: 600px;
        }
    }
    .custom-data-picker-input {
        padding: 5px 10px;
        border: 1px solid #e5e5e5;
        border-radius: 5px;
        min-height: 25px;
        display: flex;
        flex-direction: row;
        align-items: center;
        font-size: $uni-font-size-base;
        color: $uni-text-color;
        background-color: #fff;
        .selected {
            flex: 1;
        }
        .placeholder {
            flex: 1;
            color: $uni-text-color-grey;
        }
    }
</style>

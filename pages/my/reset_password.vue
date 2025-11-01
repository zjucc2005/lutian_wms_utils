<template>
    <uni-section title="重置密码" type="square">
        <view class="container">
            <uni-forms ref="form" :model="form" :rules="form_rules" label-width="80px"> 
                <uni-forms-item label="原密码" name="old_password" required>
                    <uni-easyinput v-model="form.old_password" type="password" trim="both" />
                </uni-forms-item>
                <uni-forms-item label="新密码" name="password" required>
                    <uni-easyinput v-model="form.password" type="password" trim="both" />
                </uni-forms-item>
                <uni-forms-item label="密码确认" name="password_confirmation" required>
                    <uni-easyinput v-model="form.password_confirmation" type="password" trim="both" />
                </uni-forms-item>
                <button type="primary" @click="submit">提交</button>
            </uni-forms>
        </view>
    </uni-section>
</template>

<script>
    import store from '@/store'
    import { BdEmpInfo } from '@/utils/model'
    export default {
        data() {
            return {
                empinfo: {},
                form: {
                    old_password: '',
                    password: '',
                    password_confirmation: ''
                },
                form_rules: {
                    old_password: {
                        rules: [
                            { required: true, errorMessage: '请填写原密码'},
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (this.empinfo.WMSPWD && value != this.empinfo.WMSPWD) return callback('原密码错误')
                                    if (!this.empinfo.WMSPWD && value != this.empinfo.Number) return callback('原密码错误')
                                }
                            }
                        ]
                    },
                    password: {
                        rules: [
                            { required: true, errorMessage: '请填写新密码'},
                            { minLength: 6, maxLength: 16, errorMessage: '密码长度在 {minLength} 到 {maxLength} 个字符' },
                        ]
                    },
                    password_confirmation: {
                        rules: [
                            { required: true, errorMessage: '请填写密码确认'},
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    if (value != this.form.password) return callback('密码确认和新密码不一致')
                                }
                            }
                        ]
                    }
                }
            }
        },
        mounted() {
            BdEmpInfo.view(store.state.cur_staff.FNumber).then(res => {
                this.empinfo = res.data?.Result?.Result || {}
            })
        },
        methods: {
            submit() {
                this.$refs.form.validate().then(res => {
                    BdEmpInfo.update(this.empinfo.Id, { FWMSPWD: this.form.password }).then(res => {
                        uni.showToast({ title: '修改成功' })
                        uni.navigateBack()
                    })                 
                }).catch(err => {})
            }
        }
    }
</script>

<style>

</style>

# 介绍Cmethod
项目开发中通用型方法或类总结

## 项目启动
`yarn start`


## 增加新方法步骤

### 方式1(针对简短方法函数)
1. 直接在src/common.ts中添加方法.

### 方式2(针对一些方法类)
1. 在src下创建对应方法类
2. 在 src/cmethod中 export * from './xx.ts'


## 发布步骤
1. `npm run build`，打包
2. `npm version patch`，更新版本，package.json 中的 version 会自动加 +0.0.1
3. `npm login`
4. `npm publish --access public`


### npm 参数说明

`npm version patch` 小变动，比如修复bug等，版本号变动 v1.0.0 -> v1.0.1
`npm version minor` 增加新功能，不影响现有功能,版本号变动 v1.0.0 -> v1.1.0
`npm version major` 破坏模块对向后的兼容性，版本号变动 v1.0.0 -> v2.0.0

`npm whoami` 验证你的凭据已存储在客户端，登录就会显示你的用户名
`npm unpublish 包名@版本号` 删除指定的版本

# 鸟色图谱

中国国家重点保护鸟类的照片配色图谱，支持按目、科、保护等级、生存环境与省份浏览、色彩分析及鸟种对照。直接打开 `index.html` 即可本地查看。

## 发布到 GitHub Pages

这是静态网站，不需要单独的数据库或服务器。仓库包含自动发布配置：每次向 `main` 分支推送，GitHub Actions 都会重新发布网站。

第一次需要建立一个 GitHub 仓库，并在仓库的 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。GitHub 免费账户的 Pages 需使用公开仓库；网站的地址以部署成功后的输出为准。

网站发布文件由 `scripts/prepare-pages.mjs` 生成。仅发布 `index.html`、根目录的 JavaScript/CSS 和 `assets/`；设计草稿、Excel、AGENTS.md、本地版本历史和预览截图不会进入网站。

照片的署名、许可和链接保留在每只鸟的详情来源中。图谱颜色描述所选参考照片，不代表整个物种固定的羽色比例。

## 日常更新

在已经连接远程仓库的工作副本中，保存修改、提交并推送到 `main` 即可；无须重新建立网站或更换网址。在仓库 **Actions** 中可查看本次发布进度。

本地完整设计项目另附 `更新GitHub.cmd`，用于将网站运行文件同步至独立发布目录后提交并推送。首次运行需要 GitHub 仓库地址和已登录的 Git 凭据。该脚本不会上传本地设计文档、Excel或原项目的历史记录。

## 官方说明

- [自动发布网站](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically)
- [设置 Pages 发布来源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Pages 使用限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

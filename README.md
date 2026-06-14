# Synths Lab Particle Tool

浏览器端深度粒子效果生成与在线预览工具。支持上传图片或视频，生成深度粒子预览，并导出 PNG、MP4、WebM 或 WebGL 场景包。

## 本地预览

```bash
python3 -m http.server 4173
```

打开：

```text
http://localhost:4173/?v=upload-motion-fix
```

## GitHub Pages 部署

1. 推送到 GitHub 仓库。
2. 进入仓库 `Settings` → `Pages`。
3. `Build and deployment` 选择 `Deploy from a branch`。
4. Branch 选择 `main`，目录选择 `/root`。
5. 保存后等待 GitHub 生成 Pages 地址。

如果仓库名是 `sleepless`，分享测试链接通常是：

```text
https://<你的 GitHub 用户名>.github.io/sleepless/?v=upload-motion-fix
```

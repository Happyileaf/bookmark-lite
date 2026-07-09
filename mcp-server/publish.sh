#!/bin/bash

# 自动发布脚本，支持全场景版本升级和发布

# 检查参数
if [ $# -eq 0 ]; then
  echo "用法: ./publish.sh <发布类型>"
  echo "支持的发布类型:"
  echo "  patch  - 正式补丁版本升级 (x.y.z → x.y.z+1, latest标签)"
  echo "  minor  - 正式次版本升级 (x.y.z → x.y+1.0, latest标签)"
  echo "  major  - 正式主版本升级 (x.y.z → x+1.0.0, latest标签)"
  echo "  beta   - Beta预发布版本升级 (x.y.z → x.y.z-beta.n, beta标签)"
  echo "  alpha  - Alpha内测版本升级 (x.y.z → x.y.z-alpha.n, alpha标签)"
  exit 1
fi

TYPE=$1
REGISTRY="https://registry.npmjs.org/"

echo "==================== 开始发布流程 ===================="
echo "发布类型: $TYPE"
echo "发布源: $REGISTRY"

# 前置检查
echo ""
echo "🔍 运行前置检查 (类型检查 + 构建)..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ 类型检查失败，发布终止"
  exit 1
fi

npm run build
if [ $? -ne 0 ]; then
  echo "❌ 构建失败，发布终止"
  exit 1
fi
echo "✅ 前置检查通过"

# 升级版本号
echo ""
echo "🔢 升级版本号..."
case $TYPE in
  patch|minor|major)
    TAG="latest"
    npm version $TYPE
    ;;
  beta)
    TAG="beta"
    npm version prerelease --preid=beta
    ;;
  alpha)
    TAG="alpha"
    npm version prerelease --preid=alpha
    ;;
  *)
    echo "❌ 不支持的发布类型: $TYPE"
    exit 1
    ;;
esac

if [ $? -ne 0 ]; then
  echo "❌ 版本号升级失败，发布终止"
  exit 1
fi
echo "✅ 版本号升级完成"

# 推送Git标签和代码
echo ""
echo "📤 推送Git标签和代码到远程仓库..."
git push origin --tags
git push

if [ $? -ne 0 ]; then
  echo "❌ Git推送失败，发布终止"
  exit 1
fi
echo "✅ Git推送完成"

# 发布到npm
echo ""
echo "🚀 发布到npm官方仓库..."
npm publish --registry=$REGISTRY --tag=$TAG

if [ $? -ne 0 ]; then
  echo "❌ npm发布失败"
  exit 1
fi

echo ""
echo "==================== 发布成功 ===================="
echo "✅ 本次发布版本标签: $TAG"
echo "📦 包安装命令: npm install bookmark-lite-mcp@$TAG"

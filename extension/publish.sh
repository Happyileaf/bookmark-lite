#!/bin/bash

# Extension自动发布脚本，支持版本自动升级和打包

# 检查参数，默认使用beta发布
if [ $# -eq 0 ]; then
  TYPE="beta"
  echo "ℹ️ 未指定发布类型，默认使用beta预发布版本"
else
  TYPE=$1
fi

# 显示帮助信息
if [ "$TYPE" = "--help" ] || [ "$TYPE" = "-h" ]; then
  echo "用法: ./publish.sh <发布类型>"
  echo "支持的发布类型:"
  echo "  patch  - 正式补丁版本升级 (x.y.z → x.y.z+1)"
  echo "  minor  - 正式次版本升级 (x.y.z → x.y+1.0)"
  echo "  major  - 正式主版本升级 (x.y.z → x+1.0.0)"
  echo "  beta   - Beta预发布版本升级 (x.y.z → x.y.z-beta.n，默认)"
  echo "  alpha  - Alpha内测版本升级 (x.y.z → x.y.z-alpha.n)"
  exit 0
fi

echo "==================== 开始Extension发布流程 ===================="
echo "发布类型: $TYPE"

# 升级版本号
echo ""
echo "🔢 升级版本号..."
case $TYPE in
  patch|minor|major)
    npm version $TYPE --no-git-tag-version
    ;;
  beta)
    npm version prerelease --preid=beta --no-git-tag-version
    ;;
  alpha)
    npm version prerelease --preid=alpha --no-git-tag-version
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

# 读取新版本号
VERSION=$(node -p "require('./package.json').version")
echo "✅ 版本号升级完成: v$VERSION"

# 构建Extension
echo ""
echo "🏗️  构建Extension..."
pnpm run build

if [ $? -ne 0 ]; then
  echo "❌ 构建失败，发布终止"
  exit 1
fi
echo "✅ 构建完成"

# 询问是否创建Git标签
echo ""
read -p "是否创建Git标签 v$VERSION 并推送? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📤 创建并推送Git标签..."
  git tag v$VERSION
  git push origin v$VERSION
  git add package.json ../../public/downloads/*.zip
  git commit -m "release(extension): v$VERSION"
  git push origin main
  echo "✅ Git标签和代码推送完成"
fi

echo ""
echo "==================== 发布成功 ===================="
echo "✅ 本次发布版本: v$VERSION"
echo "📦 版本归档包: public/downloads/bookmark-lite-extension-$VERSION.zip"
echo "📦 最新版包: public/downloads/bookmark-lite-extension.zip"

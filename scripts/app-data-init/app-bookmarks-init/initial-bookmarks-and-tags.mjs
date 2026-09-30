/**
 * 公共书签库初始化数据。
 *
 * 标签顺序即产品内展示顺序，书签按主标签分组存放；
 * 当一个书签同时属于其他标签时，通过条目上的 tagKeys 声明附加标签，
 * 同一个 URL 在文件中仅出现一次，以保证全局去重。
 */

export const INITIAL_APP_TAGS = [
  {
    key: "ai",
    name: "AI",
    color: "#7C3AED",
    description: "大模型、AI 助手与智能体相关资源。"
  },
  {
    key: "image",
    name: "图片",
    color: "#EC4899",
    description: "图片素材、图库与图像编辑处理工具。"
  },
  {
    key: "video",
    name: "视频",
    color: "#EF4444",
    description: "视频拍摄、剪辑与后期制作工具。"
  },
  {
    key: "developer",
    name: "开发者",
    color: "#2563EB",
    description: "编程开发、代码托管与技术框架资源。"
  },
  {
    key: "cloud-service",
    name: "云服务",
    color: "#0891B2",
    description: "云计算、服务器部署与云端基础设施。"
  },
  {
    key: "tool",
    name: "工具",
    color: "#65A30D",
    description: "解决具体问题的实用在线小工具。"
  },
  {
    key: "design",
    name: "设计",
    color: "#D946EF",
    description: "界面设计、设计软件与视觉灵感资源。"
  },
  {
    key: "efficiency",
    name: "效率",
    color: "#F59E0B",
    description: "笔记、任务与时间管理等效率工具。"
  },
  {
    key: "media",
    name: "影音",
    color: "#E11D48",
    description: "在线视频、音乐与流媒体娱乐平台。"
  },
  {
    key: "game",
    name: "游戏",
    color: "#16A34A",
    description: "游戏商店、主机平台与游戏资讯。"
  },
  {
    key: "discovery",
    name: "发现",
    color: "#8B5CF6",
    description: "发现新产品、酷站与有趣内容的入口。"
  },
  {
    key: "search",
    name: "搜索",
    color: "#0EA5E9",
    description: "综合搜索引擎与问答检索服务。"
  },
  {
    key: "news",
    name: "资讯",
    color: "#DC2626",
    description: "新闻媒体与行业动态资讯网站。"
  },
  {
    key: "community",
    name: "社区",
    color: "#EA580C",
    description: "社交网络、论坛与兴趣交流社区。"
  },
  {
    key: "research",
    name: "科研",
    color: "#0D9488",
    description: "学术论文、文献检索与科研数据平台。"
  },
  {
    key: "finance",
    name: "金融",
    color: "#CA8A04",
    description: "银行支付、理财投资与财经数据服务。"
  },
  {
    key: "download",
    name: "下载",
    color: "#475569",
    description: "正版软件与应用安装包下载渠道。"
  },
  {
    key: "learning",
    name: "学习",
    color: "#9333EA",
    description: "在线课程、技能训练与知识学习平台。"
  },
  {
    key: "work",
    name: "工作",
    color: "#4F46E5",
    description: "文档协作、会议与团队办公平台。"
  },
  {
    key: "reading",
    name: "阅读",
    color: "#059669",
    description: "书籍、长文、博客与订阅阅读平台。"
  }
];

export const INITIAL_APP_BOOKMARKS_GROUPS = [
  {
    tagKey: "ai",
    bookmarks: [
      {
        title: "ChatGPT",
        url: "https://chatgpt.com/",
        description: "OpenAI 推出的对话式人工智能，支持写作、编程与问答。",
        tagKeys: ["tool", "efficiency"]
      },
      {
        title: "Claude",
        url: "https://claude.ai/",
        description: "Anthropic 推出的长上下文对话式人工智能助手。",
        tagKeys: ["tool", "efficiency"]
      },
      {
        title: "Gemini",
        url: "https://gemini.google.com/",
        description: "谷歌推出的多模态人工智能助手。",
        tagKeys: ["tool"]
      },
      {
        title: "Microsoft Copilot",
        url: "https://copilot.microsoft.com/",
        description: "微软集成搜索与办公能力的 AI 助手。",
        tagKeys: ["tool", "efficiency"]
      },
      {
        title: "Perplexity",
        url: "https://www.perplexity.ai/",
        description: "附带信息来源引用的 AI 问答搜索引擎。",
        tagKeys: ["search"]
      },
      {
        title: "OpenAI",
        url: "https://openai.com/",
        description: "ChatGPT 与 GPT 系列模型的开发公司官网。"
      },
      {
        title: "Anthropic",
        url: "https://www.anthropic.com/",
        description: "Claude 模型背后的人工智能安全公司。"
      },
      {
        title: "Google DeepMind",
        url: "https://deepmind.google/",
        description: "谷歌旗下的前沿人工智能研究机构。"
      },
      {
        title: "Hugging Face",
        url: "https://huggingface.co/",
        description: "开源模型、数据集与 AI 应用协作社区。",
        tagKeys: ["developer", "community", "download"]
      },
      {
        title: "Google AI Studio",
        url: "https://aistudio.google.com/",
        description: "谷歌 Gemini 模型的在线开发与调试平台。",
        tagKeys: ["developer"]
      },
      {
        title: "Poe",
        url: "https://poe.com/",
        description: "聚合多款聊天机器人的一站式对话平台。"
      },
      {
        title: "Grok",
        url: "https://grok.com/",
        description: "xAI 推出的可获取实时信息的 AI 助手。"
      },
      {
        title: "Mistral AI",
        url: "https://mistral.ai/",
        description: "欧洲领先的开放与开源大模型公司。"
      },
      {
        title: "DeepSeek",
        url: "https://www.deepseek.com/",
        description: "深度求索推出的高性能开源大模型。"
      },
      {
        title: "通义千问",
        url: "https://chat.qwen.ai/",
        description: "阿里巴巴推出的大语言模型对话助手。"
      },
      {
        title: "Kimi",
        url: "https://kimi.moonshot.cn/",
        description: "月之暗面推出的擅长长文本处理的智能助手。"
      },
      {
        title: "豆包",
        url: "https://www.doubao.com/",
        description: "字节跳动推出的 AI 聊天与创作助手。"
      },
      {
        title: "智谱清言",
        url: "https://chatglm.cn/",
        description: "智谱 AI 基于 GLM 大模型推出的对话产品。"
      },
      {
        title: "文心一言",
        url: "https://yiyan.baidu.com/",
        description: "百度推出的生成式人工智能助手。"
      },
      {
        title: "Meta AI",
        url: "https://www.meta.ai/",
        description: "Meta 推出的通用人工智能助手。"
      },
      {
        title: "GitHub Copilot",
        url: "https://github.com/features/copilot",
        description: "实时代码补全与编程辅助工具。",
        tagKeys: ["developer", "tool"]
      },
      {
        title: "Cursor",
        url: "https://cursor.com/",
        description: "内置大模型能力的 AI 代码编辑器。",
        tagKeys: ["developer"]
      },
      {
        title: "Replit",
        url: "https://replit.com/",
        description: "在线 AI 编程、协作与应用部署平台。",
        tagKeys: ["developer"]
      },
      {
        title: "v0",
        url: "https://v0.dev/",
        description: "通过对话生成前端界面的 AI 工具。",
        tagKeys: ["developer", "design"]
      },
      {
        title: "Midjourney",
        url: "https://www.midjourney.com/",
        description: "以高质量艺术图像著称的 AI 绘画服务。",
        tagKeys: ["image", "design"]
      },
      {
        title: "Runway",
        url: "https://runwayml.com/",
        description: "专业级 AI 视频生成与在线编辑平台。",
        tagKeys: ["video"]
      },
      {
        title: "Suno",
        url: "https://suno.com/",
        description: "通过文本提示生成完整歌曲的 AI 音乐工具。",
        tagKeys: ["media"]
      },
      {
        title: "ElevenLabs",
        url: "https://elevenlabs.io/",
        description: "高表现力的 AI 语音合成与配音平台。"
      },
      {
        title: "Stability AI",
        url: "https://stability.ai/",
        description: "Stable Diffusion 背后的生成式 AI 公司。",
        tagKeys: ["image"]
      },
      {
        title: "Civitai",
        url: "https://civitai.com/",
        description: "AI 绘画模型分享与图片创作社区。",
        tagKeys: ["image", "community"]
      },
      {
        title: "ModelScope 魔搭",
        url: "https://modelscope.cn/",
        description: "阿里达摩院推出的开源模型与数据集社区。",
        tagKeys: ["developer", "download"]
      },
      {
        title: "Replicate",
        url: "https://replicate.com/",
        description: "在线运行与部署机器学习模型的云平台。",
        tagKeys: ["developer", "image"]
      },
      {
        title: "Together AI",
        url: "https://www.together.ai/",
        description: "提供开源模型推理与微调服务的云平台。",
        tagKeys: ["developer"]
      },
      {
        title: "Groq",
        url: "https://groq.com/",
        description: "以超快推理速度著称的 AI 芯片与云服务。",
        tagKeys: ["developer"]
      },
      {
        title: "OpenRouter",
        url: "https://openrouter.ai/",
        description: "用统一接口调用众多大模型的聚合服务。",
        tagKeys: ["developer", "tool"]
      },
      {
        title: "LangChain",
        url: "https://www.langchain.com/",
        description: "流行的大模型应用开发框架。",
        tagKeys: ["developer"]
      },
      {
        title: "LlamaIndex",
        url: "https://www.llamaindex.ai/",
        description: "面向数据接入与检索的大模型开发框架。",
        tagKeys: ["developer"]
      },
      {
        title: "Ollama",
        url: "https://ollama.com/",
        description: "在本地轻松运行开源大模型的工具。",
        tagKeys: ["developer", "tool"]
      },
      {
        title: "LM Studio",
        url: "https://lmstudio.ai/",
        description: "在本地运行和试验开源模型的桌面工具。",
        tagKeys: ["developer", "tool"]
      },
      {
        title: "Langfuse",
        url: "https://langfuse.com/",
        description: "大模型应用的可观测、追踪与评测平台。",
        tagKeys: ["developer"]
      },
      {
        title: "Character.AI",
        url: "https://character.ai/",
        description: "与自定义 AI 角色自由对话的娱乐平台。"
      },
      {
        title: "Pi",
        url: "https://pi.ai/",
        description: "擅长陪伴与日常倾听的个人 AI。"
      },
      {
        title: "Phind",
        url: "https://www.phind.com/",
        description: "面向开发者的 AI 搜索引擎与编程助手。",
        tagKeys: ["developer", "search"]
      },
      {
        title: "NotebookLM",
        url: "https://notebooklm.google.com/",
        description: "基于个人资料生成洞察的 AI 笔记与学习助手。",
        tagKeys: ["efficiency", "learning"]
      }
    ]
  }
  ,
  {
    tagKey: "image",
    bookmarks: [
      {
        title: "Unsplash",
        url: "https://unsplash.com/",
        description: "可免费使用的高清摄影图片素材平台。",
        tagKeys: ["design"]
      },
      {
        title: "Pexels",
        url: "https://www.pexels.com/",
        description: "免费可商用的图片与视频素材库。",
        tagKeys: ["design", "video"]
      },
      {
        title: "Pixabay",
        url: "https://pixabay.com/",
        description: "免费可商用的图片、插画与视频素材社区。",
        tagKeys: ["design"]
      },
      {
        title: "Getty Images",
        url: "https://www.gettyimages.com/",
        description: "全球最大的商业图片与新闻影像库之一。"
      },
      {
        title: "Shutterstock",
        url: "https://www.shutterstock.com/",
        description: "海量正版图片、视频与音乐商业素材库。"
      },
      {
        title: "Adobe Stock",
        url: "https://stock.adobe.com/",
        description: "与 Creative Cloud 深度集成的正版素材库。",
        tagKeys: ["design"]
      },
      {
        title: "iStock",
        url: "https://www.istockphoto.com/",
        description: "Getty 旗下面向中小企业的正版图库。"
      },
      {
        title: "视觉中国",
        url: "https://www.vcg.com/",
        description: "国内领先的正版图片与视觉内容平台。"
      },
      {
        title: "摄图网",
        url: "https://699pic.com/",
        description: "提供海报、模板与摄影图的中文素材站。"
      },
      {
        title: "花瓣网",
        url: "https://huaban.com/",
        description: "采集与发现设计灵感的图片兴趣社区。",
        tagKeys: ["design", "community"]
      },
      {
        title: "Pinterest",
        url: "https://www.pinterest.com/",
        description: "全球流行的图片收藏与灵感发现平台。",
        tagKeys: ["design", "discovery"]
      },
      {
        title: "Behance",
        url: "https://www.behance.net/",
        description: "Adobe 旗下设计师作品展示与灵感社区。",
        tagKeys: ["design", "community"]
      },
      {
        title: "Flickr",
        url: "https://www.flickr.com/",
        description: "历史悠久的摄影作品分享与托管社区。",
        tagKeys: ["community"]
      },
      {
        title: "500px",
        url: "https://500px.com/",
        description: "面向专业摄影师的高质量作品社区。",
        tagKeys: ["community"]
      },
      {
        title: "GIPHY",
        url: "https://giphy.com/",
        description: "动态 GIF 图片搜索与分享平台。"
      },
      {
        title: "remove.bg",
        url: "https://www.remove.bg/",
        description: "一键智能抠图去背景的在线工具。",
        tagKeys: ["tool"]
      },
      {
        title: "Canva 可画",
        url: "https://www.canva.com/",
        description: "模板化的在线平面设计与图文制作平台。",
        tagKeys: ["design", "efficiency"]
      },
      {
        title: "稿定设计",
        url: "https://www.gaoding.com/",
        description: "中文在线设计与模板编辑协作平台。",
        tagKeys: ["design"]
      },
      {
        title: "Figma",
        url: "https://www.figma.com/",
        description: "流行的在线界面设计与协作工具。",
        tagKeys: ["design"]
      },
      {
        title: "Adobe Photoshop",
        url: "https://www.adobe.com/products/photoshop.html",
        description: "行业标准级的专业图像处理软件。",
        tagKeys: ["design"]
      },
      {
        title: "Adobe Illustrator",
        url: "https://www.adobe.com/products/illustrator.html",
        description: "专业的矢量图形与插画设计软件。",
        tagKeys: ["design"]
      },
      {
        title: "Photopea",
        url: "https://www.photopea.com/",
        description: "浏览器中运行的免费专业图像编辑器。",
        tagKeys: ["design", "tool"]
      },
      {
        title: "GIMP",
        url: "https://www.gimp.org/",
        description: "免费开源的专业图像处理软件。",
        tagKeys: ["design", "download"]
      },
      {
        title: "Dribbble",
        url: "https://dribbble.com/",
        description: "知名的设计师作品展示与招聘社区。",
        tagKeys: ["design", "community"]
      },
      {
        title: "站酷",
        url: "https://www.zcool.com.cn/",
        description: "国内领先的设计师互动与作品社区。",
        tagKeys: ["design", "community"]
      },
      {
        title: "TinEye",
        url: "https://tineye.com/",
        description: "以图搜图与图片反向检索服务。",
        tagKeys: ["search", "tool"]
      },
      {
        title: "Google 图片",
        url: "https://images.google.com/",
        description: "谷歌提供的全网图片搜索服务。",
        tagKeys: ["search"]
      },
      {
        title: "Vecteezy",
        url: "https://www.vecteezy.com/",
        description: "免费矢量图、剪贴画与插画素材库。",
        tagKeys: ["design"]
      },
      {
        title: "Freepik",
        url: "https://www.freepik.com/",
        description: "矢量图、模板与图片设计资源平台。",
        tagKeys: ["design"]
      },
      {
        title: "Imgur",
        url: "https://imgur.com/",
        description: "流行的免费图片上传与分享社区。",
        tagKeys: ["community"]
      }
    ]
  }
  ,
  {
    tagKey: "video",
    bookmarks: [
      {
        title: "Adobe Premiere Pro",
        url: "https://www.adobe.com/products/premiere.html",
        description: "行业标准级的专业视频剪辑软件。",
        tagKeys: ["design"]
      },
      {
        title: "Final Cut Pro",
        url: "https://www.apple.com/final-cut-pro/",
        description: "苹果为 Mac 打造的专业视频剪辑软件。"
      },
      {
        title: "DaVinci Resolve",
        url: "https://www.blackmagicdesign.com/products/davinciresolve",
        description: "集剪辑、调色与音频后期于一体的专业软件。",
        tagKeys: ["download"]
      },
      {
        title: "剪映",
        url: "https://www.capcut.cn/",
        description: "字节跳动推出的易用视频剪辑创作工具。",
        tagKeys: ["tool"]
      },
      {
        title: "CapCut",
        url: "https://www.capcut.com/",
        description: "剪映的国际版，提供在线与移动端剪辑。",
        tagKeys: ["tool"]
      },
      {
        title: "Adobe After Effects",
        url: "https://www.adobe.com/products/aftereffects.html",
        description: "专业的影视特效与动态图形制作软件。",
        tagKeys: ["design"]
      },
      {
        title: "OBS Studio",
        url: "https://obsproject.com/",
        description: "免费开源的直播推流与录屏软件。",
        tagKeys: ["tool", "download"]
      },
      {
        title: "Camtasia",
        url: "https://www.techsmith.com/camtasia.html",
        description: "屏幕录制与教学视频编辑软件。",
        tagKeys: ["tool"]
      },
      {
        title: "ScreenFlow",
        url: "https://www.telestream.net/screenflow/",
        description: "Mac 平台的录屏与视频编辑软件。",
        tagKeys: ["tool"]
      },
      {
        title: "Bandicam",
        url: "https://www.bandicam.com/",
        description: "轻量的游戏与屏幕录制软件。",
        tagKeys: ["tool"]
      },
      {
        title: "HandBrake",
        url: "https://handbrake.fr/",
        description: "免费开源的视频转码压缩工具。",
        tagKeys: ["tool", "download"]
      },
      {
        title: "FFmpeg",
        url: "https://ffmpeg.org/",
        description: "功能强大的开源音视频处理命令行工具。",
        tagKeys: ["developer", "tool"]
      },
      {
        title: "Clipchamp",
        url: "https://clipchamp.com/",
        description: "微软旗下的浏览器在线视频编辑器。",
        tagKeys: ["tool"]
      },
      {
        title: "VEED",
        url: "https://www.veed.io/",
        description: "支持自动字幕的在线视频编辑平台。",
        tagKeys: ["tool"]
      },
      {
        title: "Descript",
        url: "https://www.descript.com/",
        description: "像编辑文档一样剪辑音视频的创作工具。",
        tagKeys: ["tool", "ai"]
      },
      {
        title: "Pika",
        url: "https://pika.art/",
        description: "文本生成与编辑视频的 AI 创作平台。",
        tagKeys: ["ai"]
      },
      {
        title: "可灵 AI",
        url: "https://klingai.com/",
        description: "快手推出的 AI 视频生成平台。",
        tagKeys: ["ai", "image"]
      },
      {
        title: "Veed Subtitle",
        url: "https://www.veed.io/tools/add-subtitles-to-video",
        description: "为视频自动生成与翻译字幕的在线工具。",
        tagKeys: ["tool"]
      },
      {
        title: "VideoProc Converter",
        url: "https://www.videoproc.com/",
        description: "集转码、下载与录屏于一体的视频工具。",
        tagKeys: ["tool", "download"]
      },
      {
        title: "Shotcut",
        url: "https://www.shotcut.org/",
        description: "免费开源的跨平台视频剪辑软件。",
        tagKeys: ["download"]
      }
    ]
  }
  ,
  {
    tagKey: "developer",
    bookmarks: [
      {
        title: "GitHub",
        url: "https://github.com/",
        description: "全球最大的代码托管与开源协作平台。",
        tagKeys: ["community", "download"]
      },
      {
        title: "GitLab",
        url: "https://gitlab.com/",
        description: "内置 DevOps 流水线的代码托管平台。",
        tagKeys: ["cloud-service"]
      },
      {
        title: "Stack Overflow",
        url: "https://stackoverflow.com/",
        description: "全球最大的编程问答社区。",
        tagKeys: ["community", "search"]
      },
      {
        title: "MDN Web Docs",
        url: "https://developer.mozilla.org/",
        description: "权威的 Web 技术与浏览器 API 文档。",
        tagKeys: ["learning"]
      },
      {
        title: "npmjs",
        url: "https://www.npmjs.com/",
        description: "JavaScript 与 Node.js 的包注册表。",
        tagKeys: ["download"]
      },
      {
        title: "PyPI",
        url: "https://pypi.org/",
        description: "Python 官方第三方软件包索引。",
        tagKeys: ["download"]
      },
      {
        title: "Docker",
        url: "https://www.docker.com/",
        description: "主流的应用容器化平台。",
        tagKeys: ["cloud-service", "tool"]
      },
      {
        title: "Kubernetes",
        url: "https://kubernetes.io/",
        description: "容器编排与集群管理的事实标准。",
        tagKeys: ["cloud-service"]
      },
      {
        title: "Vercel",
        url: "https://vercel.com/",
        description: "面向前端与 Next.js 应用的部署云平台。",
        tagKeys: ["cloud-service"]
      },
      {
        title: "Netlify",
        url: "https://www.netlify.com/",
        description: "静态站点与无服务器函数托管平台。",
        tagKeys: ["cloud-service"]
      },
      {
        title: "Node.js",
        url: "https://nodejs.org/",
        description: "基于 Chrome V8 的 JavaScript 运行时。",
        tagKeys: ["download", "learning"]
      },
      {
        title: "Python.org",
        url: "https://www.python.org/",
        description: "Python 编程语言官方网站。",
        tagKeys: ["download", "learning"]
      },
      {
        title: "Rust",
        url: "https://www.rust-lang.org/",
        description: "注重内存安全与性能的系统编程语言。",
        tagKeys: ["download", "learning"]
      },
      {
        title: "Go 语言",
        url: "https://go.dev/",
        description: "谷歌推出的简洁高效的编程语言。",
        tagKeys: ["download", "learning"]
      },
      {
        title: "TypeScript",
        url: "https://www.typescriptlang.org/",
        description: "为 JavaScript 添加静态类型的语言。",
        tagKeys: ["learning"]
      },
      {
        title: "React",
        url: "https://react.dev/",
        description: "用于构建用户界面的主流 JavaScript 库。",
        tagKeys: ["learning"]
      },
      {
        title: "Vue.js",
        url: "https://vuejs.org/",
        description: "渐进式 JavaScript 前端框架。",
        tagKeys: ["learning"]
      },
      {
        title: "Next.js",
        url: "https://nextjs.org/",
        description: "支持服务端渲染的 React 全栈框架。",
        tagKeys: ["learning"]
      },
      {
        title: "Tailwind CSS",
        url: "https://tailwindcss.com/",
        description: "原子化的实用优先 CSS 框架。",
        tagKeys: ["design", "learning"]
      },
      {
        title: "Postman",
        url: "https://www.postman.com/",
        description: "API 接口调试、测试与协作平台。",
        tagKeys: ["tool"]
      },
      {
        title: "Visual Studio Code",
        url: "https://code.visualstudio.com/",
        description: "微软推出的免费流行代码编辑器。",
        tagKeys: ["download", "tool"]
      },
      {
        title: "JetBrains",
        url: "https://www.jetbrains.com/",
        description: "IntelliJ IDEA 等专业开发工具厂商。",
        tagKeys: ["download", "tool"]
      },
      {
        title: "Redoc",
        url: "https://redocly.com/redoc",
        description: "美观的 OpenAPI 文档渲染工具。",
        tagKeys: ["tool"]
      },
      {
        title: "Swagger",
        url: "https://swagger.io/",
        description: "OpenAPI 规范与 API 设计工具生态。",
        tagKeys: ["tool"]
      },
      {
        title: "W3Schools",
        url: "https://www.w3schools.com/",
        description: "面向初学者的编程教程与在线练习站。",
        tagKeys: ["learning"]
      },
      {
        title: "freeCodeCamp",
        url: "https://www.freecodecamp.org/",
        description: "免费的编程学习与项目实践社区。",
        tagKeys: ["learning", "community"]
      },
      {
        title: "Codecademy",
        url: "https://www.codecademy.com/",
        description: "交互式编程技能学习平台。",
        tagKeys: ["learning"]
      },
      {
        title: "GeeksforGeeks",
        url: "https://www.geeksforgeeks.org/",
        description: "算法、数据结构与计算机知识学习站。",
        tagKeys: ["learning"]
      },
      {
        title: "LeetCode",
        url: "https://leetcode.com/",
        description: "算法刷题与技术面试准备平台。",
        tagKeys: ["learning"]
      },
      {
        title: "HackerRank",
        url: "https://www.hackerrank.com/",
        description: "编程技能测评与企业招聘平台。",
        tagKeys: ["learning"]
      },
      {
        title: "Kaggle",
        url: "https://www.kaggle.com/",
        description: "数据科学竞赛、数据集与学习社区。",
        tagKeys: ["ai", "community", "learning"]
      },
      {
        title: "GitHub Gist",
        url: "https://gist.github.com/",
        description: "即时分享代码片段与笔记的服务。",
        tagKeys: ["tool"]
      },
      {
        title: "CodePen",
        url: "https://codepen.io/",
        description: "在线编写与演示前端代码的社区。",
        tagKeys: ["design", "community"]
      },
      {
        title: "CodeSandbox",
        url: "https://codesandbox.io/",
        description: "浏览器中的快速前端开发与原型环境。",
        tagKeys: ["tool"]
      },
      {
        title: "StackBlitz",
        url: "https://stackblitz.com/",
        description: "浏览器内运行全栈项目的在线开发环境。",
        tagKeys: ["tool"]
      },
      {
        title: "jsDelivr",
        url: "https://www.jsdelivr.com/",
        description: "免费快速的开源项目 CDN 服务。",
        tagKeys: ["cloud-service", "tool"]
      },
      {
        title: "unpkg",
        url: "https://unpkg.com/",
        description: "直接加载 npm 包内容的快速 CDN。",
        tagKeys: ["cloud-service", "tool"]
      },
      {
        title: "Cloudflare",
        url: "https://www.cloudflare.com/",
        description: "CDN、DNS 与网站安全防护服务商。",
        tagKeys: ["cloud-service", "tool"]
      },
      {
        title: "Redis",
        url: "https://redis.io/",
        description: "流行的内存键值数据库。",
        tagKeys: ["cloud-service", "learning"]
      },
      {
        title: "PostgreSQL",
        url: "https://www.postgresql.org/",
        description: "功能强大的开源关系型数据库。",
        tagKeys: ["learning", "download"]
      },
      {
        title: "MySQL",
        url: "https://www.mysql.com/",
        description: "广泛使用的开源关系型数据库。",
        tagKeys: ["learning", "download"]
      },
      {
        title: "MongoDB",
        url: "https://www.mongodb.com/",
        description: "流行的开源文档数据库。",
        tagKeys: ["cloud-service", "learning"]
      },
      {
        title: "Prisma",
        url: "https://www.prisma.io/",
        description: "类型安全的现代 ORM 与数据库工具链。",
        tagKeys: ["tool"]
      },
      {
        title: "Supabase",
        url: "https://supabase.com/",
        description: "基于 PostgreSQL 的开源后端即服务。",
        tagKeys: ["cloud-service"]
      },
      {
        title: "PlanetScale",
        url: "https://planetscale.com/",
        description: "兼容 MySQL 的分布式无服务器数据库。",
        tagKeys: ["cloud-service"]
      },
      {
        title: "Stripe",
        url: "https://stripe.com/",
        description: "面向开发者的在线支付基础设施。",
        tagKeys: ["finance", "tool"]
      },
      {
        title: "Firebase",
        url: "https://firebase.google.com/",
        description: "谷歌提供的移动与 Web 应用开发平台。",
        tagKeys: ["cloud-service"]
      },
      {
        title: "Grafana",
        url: "https://grafana.com/",
        description: "开源的数据可视化与监控看板平台。",
        tagKeys: ["cloud-service", "tool"]
      },
      {
        title: "Sentry",
        url: "https://sentry.io/",
        description: "应用错误监控与性能追踪平台。",
        tagKeys: ["cloud-service", "tool"]
      },
      {
        title: "Vite",
        url: "https://vite.dev/",
        description: "极速的下一代前端构建工具。",
        tagKeys: ["learning"]
      },
      {
        title: "DevDocs",
        url: "https://devdocs.io/",
        description: "聚合众多开发文档并支持离线搜索。",
        tagKeys: ["search", "learning"]
      }
    ]
  }
  ,
  {
    tagKey: "cloud-service",
    bookmarks: [
      {
        title: "Amazon AWS",
        url: "https://aws.amazon.com/",
        description: "全球市场份额领先的综合云计算平台。"
      },
      {
        title: "Microsoft Azure",
        url: "https://azure.microsoft.com/",
        description: "微软的企业级云计算与服务平台。"
      },
      {
        title: "Google Cloud",
        url: "https://cloud.google.com/",
        description: "谷歌提供的云计算、数据与 AI 服务。"
      },
      {
        title: "阿里云",
        url: "https://www.aliyun.com/",
        description: "国内市场领先的综合云计算服务平台。"
      },
      {
        title: "腾讯云",
        url: "https://cloud.tencent.com/",
        description: "腾讯提供的云服务器与企业云服务。"
      },
      {
        title: "华为云",
        url: "https://www.huaweicloud.com/",
        description: "华为打造的政企与行业云服务平台。"
      },
      {
        title: "DigitalOcean",
        url: "https://www.digitalocean.com/",
        description: "面向开发者与中小企业的简洁云主机。"
      },
      {
        title: "Linode Akamai",
        url: "https://www.linode.com/",
        description: "Akamai 旗下面向开发者的云主机服务。"
      },
      {
        title: "Vultr",
        url: "https://www.vultr.com/",
        description: "按需开通的全球云服务器平台。"
      },
      {
        title: "Heroku",
        url: "https://www.heroku.com/",
        description: "简化应用部署与运维的云平台。"
      },
      {
        title: "Render",
        url: "https://render.com/",
        description: "支持 Web 服务与数据库的统一云平台。"
      },
      {
        title: "Fly.io",
        url: "https://fly.io/",
        description: "把应用部署到靠近用户边缘节点的平台。"
      },
      {
        title: "Railway",
        url: "https://railway.com/",
        description: "一键部署应用与数据库的云平台。"
      },
      {
        title: "Oracle Cloud",
        url: "https://www.oracle.com/cloud/",
        description: "甲骨文提供的企业级云计算基础设施。"
      },
      {
        title: "IBM Cloud",
        url: "https://www.ibm.com/cloud",
        description: "面向企业的混合云与 AI 服务平台。"
      },
      {
        title: "Scaleway",
        url: "https://www.scaleway.com/",
        description: "欧洲的云服务器与边缘计算服务商。"
      }
    ]
  }
  ,
  {
    tagKey: "tool",
    bookmarks: [
      {
        title: "Google 翻译",
        url: "https://translate.google.com/",
        description: "支持上百种语言的在线机器翻译服务。",
        tagKeys: ["learning"]
      },
      {
        title: "DeepL 翻译",
        url: "https://www.deepl.com/translator",
        description: "以自然流畅著称的神经网络翻译工具。",
        tagKeys: ["learning", "work"]
      },
      {
        title: "Smallpdf",
        url: "https://smallpdf.com/",
        description: "PDF 压缩、转换与编辑的在线工具集合。"
      },
      {
        title: "iLovePDF",
        url: "https://www.ilovepdf.com/",
        description: "免费的 PDF 合并、拆分与转换工具。"
      },
      {
        title: "PDF24 Tools",
        url: "https://tools.pdf24.org/",
        description: "功能全面的免费在线 PDF 工具箱。"
      },
      {
        title: "TinyPNG",
        url: "https://tinypng.com/",
        description: "智能压缩 PNG 与 JPEG 图片体积。",
        tagKeys: ["image"]
      },
      {
        title: "Squoosh",
        url: "https://squoosh.app/",
        description: "谷歌推出的浏览器图片压缩优化工具。",
        tagKeys: ["image"]
      },
      {
        title: "Convertio",
        url: "https://convertio.co/zh/",
        description: "支持数千种格式互转的在线文件转换器。"
      },
      {
        title: "CloudConvert",
        url: "https://cloudconvert.com/",
        description: "在线转换音视频、文档与压缩包格式。"
      },
      {
        title: "Speedtest",
        url: "https://www.speedtest.net/",
        description: "测量网络带宽与延迟的测速工具。"
      },
      {
        title: "10分钟邮箱",
        url: "https://10minutemail.com/",
        description: "临时一次性邮箱，用于注册验证防骚扰。"
      },
      {
        title: "Temp Mail",
        url: "https://temp-mail.org/",
        description: "免费的临时匿名电子邮箱服务。"
      },
      {
        title: "二维码生成器",
        url: "https://www.qrcode-monkey.com/",
        description: "自定义样式的免费二维码生成工具。"
      },
      {
        title: "草料二维码",
        url: "https://cli.im/",
        description: "中文二维码生成、美化与活码管理平台。"
      },
      {
        title: "Carbon",
        url: "https://carbon.now.sh/",
        description: "把代码片段生成精美分享图片的工具。",
        tagKeys: ["developer", "image"]
      },
      {
        title: "Whois Lookup",
        url: "https://who.is/",
        description: "查询域名注册信息与到期时间。"
      },
      {
        title: "WhatIsMyBrowser",
        url: "https://www.whatismybrowser.com/",
        description: "检测浏览器、系统与屏幕参数信息。"
      },
      {
        title: "Witeboard",
        url: "https://witeboard.com/",
        description: "打开即用的在线协作白板。",
        tagKeys: ["work"]
      },
      {
        title: "Random.org",
        url: "https://www.random.org/",
        description: "基于大气噪声生成真正随机数的服务。"
      },
      {
        title: "单位换算",
        url: "https://www.unitconverters.net/zh/",
        description: "长度、重量、温度等单位在线换算。"
      },
      {
        title: "JSON Crack",
        url: "https://jsoncrack.com/",
        description: "把 JSON 等数据可视化为图形的工具。",
        tagKeys: ["developer"]
      },
      {
        title: "Regex101",
        url: "https://regex101.com/",
        description: "正则表达式在线编写、测试与解释工具。",
        tagKeys: ["developer"]
      },
      {
        title: "Code Beautify",
        url: "https://codebeautify.org/",
        description: "代码格式化、校验与转换在线工具。",
        tagKeys: ["developer"]
      },
      {
        title: "URL Encode",
        url: "https://www.urlencoder.org/",
        description: "URL 编码与解码的在线工具。",
        tagKeys: ["developer"]
      },
      {
        title: "Diffchecker",
        url: "https://www.diffchecker.com/",
        description: "在线对比文本、图片与代码差异。",
        tagKeys: ["work"]
      },
      {
        title: "Online Stopwatch",
        url: "https://www.online-stopwatch.com/",
        description: "在线秒表与倒计时工具。"
      },
      {
        title: "Time and Date",
        url: "https://www.timeanddate.com/",
        description: "世界时钟、时区换算与日历查询。"
      },
      {
        title: "WolframAlpha",
        url: "https://www.wolframalpha.com/",
        description: "计算知识引擎，擅长数学与科学计算。",
        tagKeys: ["learning", "search"]
      },
      {
        title: "思维导图 ProcessOn",
        url: "https://www.processon.com/",
        description: "在线思维导图与流程图协作工具。",
        tagKeys: ["efficiency", "work"]
      },
      {
        title: "MindMeister",
        url: "https://www.mindmeister.com/",
        description: "在线思维导图与头脑风暴工具。",
        tagKeys: ["efficiency"]
      },
      {
        title: "临时粘贴 Pastebin",
        url: "https://pastebin.com/",
        description: "临时分享大段文本与代码的粘贴板。",
        tagKeys: ["developer"]
      },
      {
        title: "PrivateBin",
        url: "https://privatebin.info/",
        description: "服务端零知识的安全文本粘贴工具。"
      },
      {
        title: "Wayback Machine",
        url: "https://web.archive.org/",
        description: "网页历史存档与旧版本查询服务。",
        tagKeys: ["search"]
      },
      {
        title: "Down For Everyone",
        url: "https://downforeveryoneorjustme.com/",
        description: "检测网站是宕机还是仅自己无法访问。"
      },
      {
        title: "Have I Been Pwned",
        url: "https://haveibeenpwned.com/",
        description: "查询邮箱是否出现在数据泄露事件中。"
      },
      {
        title: "1Password",
        url: "https://1password.com/",
        description: "跨平台的密码管理与数字保险箱。",
        tagKeys: ["efficiency"]
      },
      {
        title: "Bitly",
        url: "https://bitly.com/",
        description: "长链接缩短与点击数据分析服务。",
        tagKeys: ["work"]
      },
      {
        title: "Grammarly",
        url: "https://www.grammarly.com/",
        description: "英文语法检查与写作润色助手。",
        tagKeys: ["learning", "work"]
      },
      {
        title: "E.gg Timer",
        url: "https://e.ggtimer.com/",
        description: "简洁的在线倒计时提醒工具。"
      }
    ]
  }
  ,
  {
    tagKey: "design",
    bookmarks: [
      {
        title: "Sketch",
        url: "https://www.sketch.com/",
        description: "Mac 平台经典的界面设计工具。"
      },
      {
        title: "Adobe XD",
        url: "https://www.adobe.com/products/xd.html",
        description: "用于界面与交互原型设计的工具。"
      },
      {
        title: "Framer",
        url: "https://www.framer.com/",
        description: "可直接发布成品网站的设计与建站工具。",
        tagKeys: ["tool"]
      },
      {
        title: "Principle",
        url: "https://principleformac.com/",
        description: "制作高保真交互动画原型的工具。"
      },
      {
        title: "ProtoPie",
        url: "https://www.protopie.io/",
        description: "打造高保真可交互原型的设计工具。",
        tagKeys: ["tool"]
      },
      {
        title: "Origami Studio",
        url: "https://origami.design/",
        description: "Meta 推出的免费交互原型设计工具。",
        tagKeys: ["download"]
      },
      {
        title: "InVision",
        url: "https://www.invisionapp.com/",
        description: "数字产品设计协作与原型平台。",
        tagKeys: ["work"]
      },
      {
        title: "Zeplin",
        url: "https://zeplin.io/",
        description: "设计稿交付与设计规范协作平台。",
        tagKeys: ["work"]
      },
      {
        title: "Abstract",
        url: "https://www.abstract.com/",
        description: "设计文件版本管理与协作平台。",
        tagKeys: ["work"]
      },
      {
        title: "Coolors",
        url: "https://coolors.co/",
        description: "快速生成与搭配配色方案的工具。",
        tagKeys: ["tool"]
      },
      {
        title: "ColorHunt",
        url: "https://colorhunt.co/",
        description: "精选配色灵感与调色板合集。",
        tagKeys: ["discovery"]
      },
      {
        title: "Google Fonts",
        url: "https://fonts.google.com/",
        description: "免费开源的网页字体库与托管服务。"
      },
      {
        title: "字由",
        url: "https://www.hellofont.cn/",
        description: "设计师字体管理与字体素材工具。",
        tagKeys: ["tool"]
      },
      {
        title: "求字体网",
        url: "https://www.qiuziti.com/",
        description: "通过图片识别查找字体名称。",
        tagKeys: ["tool", "search"]
      },
      {
        title: "Flaticon",
        url: "https://www.flaticon.com/",
        description: "海量免费矢量图标素材库。",
        tagKeys: ["image"]
      },
      {
        title: "Iconfont",
        url: "https://www.iconfont.cn/",
        description: "阿里巴巴矢量图标库与图标管理平台。",
        tagKeys: ["image", "tool"]
      },
      {
        title: "The Noun Project",
        url: "https://thenounproject.com/",
        description: "高质量的极简黑白图标素材库。",
        tagKeys: ["image"]
      },
      {
        title: "Awwwards",
        url: "https://www.awwwards.com/",
        description: "评选最佳网页设计作品的权威网站。",
        tagKeys: ["discovery"]
      },
      {
        title: "Land-book",
        url: "https://land-book.com/",
        description: "精选优秀落地页与网站设计灵感。",
        tagKeys: ["discovery"]
      },
      {
        title: "Mobbin",
        url: "https://mobbin.com/",
        description: "海量移动应用界面截图参考库。",
        tagKeys: ["discovery"]
      },
      {
        title: "Pttrns",
        url: "https://pttrns.com/",
        description: "移动端界面设计模式与灵感集合。",
        tagKeys: ["discovery"]
      },
      {
        title: "UI8",
        url: "https://ui8.net/",
        description: "高质量 UI 套件与设计模板市场。"
      },
      {
        title: "Material Design",
        url: "https://m3.material.io/",
        description: "谷歌的 Material 设计规范与资源。",
        tagKeys: ["developer", "learning"]
      },
      {
        title: "Ant Design",
        url: "https://ant.design/",
        description: "蚂蚁开源的企业级 UI 组件设计体系。",
        tagKeys: ["developer", "learning"]
      }
    ]
  }
  ,
  {
    tagKey: "efficiency",
    bookmarks: [
      {
        title: "Notion",
        url: "https://www.notion.com/",
        description: "集笔记、文档与数据库于一体的工作空间。",
        tagKeys: ["work", "reading"]
      },
      {
        title: "Obsidian",
        url: "https://obsidian.md/",
        description: "基于本地 Markdown 的双向链接笔记软件。",
        tagKeys: ["download", "learning"]
      },
      {
        title: "印象笔记",
        url: "https://www.yinxiang.com/",
        description: "经典的跨平台资料收集与笔记工具。"
      },
      {
        title: "有道云笔记",
        url: "https://note.youdao.com/",
        description: "支持多端同步的中文笔记与文档工具。"
      },
      {
        title: "语雀",
        url: "https://www.yuque.com/",
        description: "蚂蚁集团旗下的知识库与文档协作平台。",
        tagKeys: ["work"]
      },
      {
        title: "飞书",
        url: "https://www.feishu.cn/",
        description: "字节跳动的办公协作与文档平台。",
        tagKeys: ["work"]
      },
      {
        title: "Todoist",
        url: "https://todoist.com/",
        description: "简洁强大的跨平台待办任务管理工具。",
        tagKeys: ["work"]
      },
      {
        title: "TickTick 滴答清单",
        url: "https://ticktick.com/",
        description: "待办清单、习惯养成与日历提醒工具。",
        tagKeys: ["work"]
      },
      {
        title: "Microsoft To Do",
        url: "https://to-do.microsoft.com/",
        description: "微软免费的个人待办与任务清单工具。",
        tagKeys: ["work"]
      },
      {
        title: "Things 3",
        url: "https://culturedcode.com/things/",
        description: "苹果生态中体验优雅的任务管理工具。"
      },
      {
        title: "Trello",
        url: "https://trello.com/",
        description: "看板式的项目与任务协作工具。",
        tagKeys: ["work"]
      },
      {
        title: "Asana",
        url: "https://asana.com/",
        description: "团队项目跟踪与工作流管理平台。",
        tagKeys: ["work"]
      },
      {
        title: "ClickUp",
        url: "https://clickup.com/",
        description: "任务、文档与目标一体化工作平台。",
        tagKeys: ["work"]
      },
      {
        title: "Any.do",
        url: "https://www.any.do/",
        description: "任务管理、日历与提醒整合工具。",
        tagKeys: ["work"]
      },
      {
        title: "Google Calendar",
        url: "https://calendar.google.com/",
        description: "谷歌的在线日历与日程安排服务。",
        tagKeys: ["work"]
      },
      {
        title: "Fantastical",
        url: "https://flexibits.com/fantastical",
        description: "苹果生态中支持自然语言输入的日历。"
      },
      {
        title: "RescueTime",
        url: "https://www.rescuetime.com/",
        description: "自动记录并分析时间使用情况的工具。"
      },
      {
        title: "Toggl Track",
        url: "https://toggl.com/",
        description: "简单易用的在线工时追踪计时器。",
        tagKeys: ["work"]
      },
      {
        title: "Forest",
        url: "https://www.forestapp.cc/",
        description: "用种树方式帮助专注、远离手机的应用。",
        tagKeys: ["learning"]
      },
      {
        title: "番茄 ToDo",
        url: "https://www.tomatodo.com/",
        description: "番茄钟、白噪音与专注计时工具。",
        tagKeys: ["learning"]
      },
      {
        title: "Anki",
        url: "https://apps.ankiweb.net/",
        description: "基于间隔重复的记忆卡片学习工具。",
        tagKeys: ["learning", "download"]
      },
      {
        title: "Pocket",
        url: "https://getpocket.com/",
        description: "稍后阅读与文章收藏管理工具。",
        tagKeys: ["reading"]
      },
      {
        title: "Instapaper",
        url: "https://www.instapaper.com/",
        description: "保存网页并提供纯净阅读体验的工具。",
        tagKeys: ["reading"]
      },
      {
        title: "OmniFocus",
        url: "https://www.omnigroup.com/omnifocus/",
        description: "苹果生态中专业的 GTD 任务管理软件。"
      }
    ]
  }
  ,
  {
    tagKey: "media",
    bookmarks: [
      {
        title: "YouTube",
        url: "https://www.youtube.com/",
        description: "全球最大的在线视频分享与观看平台。",
        tagKeys: ["discovery", "learning"]
      },
      {
        title: "哔哩哔哩",
        url: "https://www.bilibili.com/",
        description: "以中长视频和弹幕文化著称的内容社区。",
        tagKeys: ["community", "learning", "game"]
      },
      {
        title: "Netflix",
        url: "https://www.netflix.com/",
        description: "全球领先的付费影视流媒体平台。"
      },
      {
        title: "Disney+",
        url: "https://www.disneyplus.com/",
        description: "迪士尼、漫威与星球大战影视流媒体。"
      },
      {
        title: "Hulu",
        url: "https://www.hulu.com/",
        description: "美国热门剧集与电视直播流媒体平台。"
      },
      {
        title: "Prime Video",
        url: "https://www.primevideo.com/",
        description: "亚马逊旗下的影视流媒体服务。"
      },
      {
        title: "Max",
        url: "https://www.max.com/",
        description: "华纳旗下高品质剧集与电影流媒体。"
      },
      {
        title: "Apple TV+",
        url: "https://tv.apple.com/",
        description: "苹果推出的原创影视流媒体服务。"
      },
      {
        title: "腾讯视频",
        url: "https://v.qq.com/",
        description: "国内主流的影视剧与综艺视频平台。"
      },
      {
        title: "爱奇艺",
        url: "https://www.iqiyi.com/",
        description: "国内领先的在线影视流媒体平台。"
      },
      {
        title: "优酷",
        url: "https://www.youku.com/",
        description: "阿里巴巴旗下的综合视频平台。"
      },
      {
        title: "芒果 TV",
        url: "https://www.mgtv.com/",
        description: "以综艺见长的国内视频平台。"
      },
      {
        title: "抖音",
        url: "https://www.douyin.com/",
        description: "字节跳动的短视频内容平台。",
        tagKeys: ["community", "discovery"]
      },
      {
        title: "快手",
        url: "https://www.kuaishou.com/",
        description: "记录与分享生活的短视频社区。",
        tagKeys: ["community"]
      },
      {
        title: "TikTok",
        url: "https://www.tiktok.com/",
        description: "风靡全球的短视频创作与观看平台。",
        tagKeys: ["community", "discovery"]
      },
      {
        title: "Spotify",
        url: "https://open.spotify.com/",
        description: "全球领先的音乐与播客流媒体平台。",
        tagKeys: ["discovery"]
      },
      {
        title: "Apple Music",
        url: "https://music.apple.com/",
        description: "苹果提供的海量无损音乐流媒体服务。"
      },
      {
        title: "网易云音乐",
        url: "https://music.163.com/",
        description: "以评论社区与歌单著称的音乐平台。",
        tagKeys: ["community"]
      },
      {
        title: "QQ 音乐",
        url: "https://y.qq.com/",
        description: "国内曲库丰富的在线音乐平台。"
      },
      {
        title: "酷狗音乐",
        url: "https://www.kugou.com/",
        description: "国内老牌的在线音乐播放平台。"
      },
      {
        title: "酷我音乐",
        url: "https://www.kuwo.cn/",
        description: "提供海量曲库的在线音乐平台。"
      },
      {
        title: "SoundCloud",
        url: "https://soundcloud.com/",
        description: "独立音乐人与音频创作者分享社区。",
        tagKeys: ["community", "discovery"]
      },
      {
        title: "Bandcamp",
        url: "https://bandcamp.com/",
        description: "支持直接购买独立音乐人作品的平台。"
      },
      {
        title: "Deezer",
        url: "https://www.deezer.com/",
        description: "源自欧洲的音乐流媒体服务。"
      },
      {
        title: "TIDAL",
        url: "https://tidal.com/",
        description: "主打高保真音质的音乐流媒体。"
      },
      {
        title: "Amazon Music",
        url: "https://music.amazon.com/",
        description: "亚马逊提供的音乐与播客流媒体。"
      },
      {
        title: "YouTube Music",
        url: "https://music.youtube.com/",
        description: "谷歌融合 YouTube 资源的音乐服务。"
      },
      {
        title: "小宇宙",
        url: "https://www.xiaoyuzhoufm.com/",
        description: "国内主流的中文播客收听平台。",
        tagKeys: ["community", "discovery"]
      },
      {
        title: "Apple Podcasts",
        url: "https://podcasts.apple.com/",
        description: "苹果官方的播客订阅与收听平台。",
        tagKeys: ["discovery"]
      }
    ]
  }
  ,
  {
    tagKey: "game",
    bookmarks: [
      {
        title: "Steam",
        url: "https://store.steampowered.com/",
        description: "全球最大的 PC 数字游戏发行平台。",
        tagKeys: ["community", "download"]
      },
      {
        title: "Epic Games Store",
        url: "https://store.epicgames.com/",
        description: "每周赠送游戏的数字游戏商店。",
        tagKeys: ["download", "community"]
      },
      {
        title: "PlayStation",
        url: "https://www.playstation.com/",
        description: "索尼 PlayStation 主机与游戏官网。"
      },
      {
        title: "Xbox",
        url: "https://www.xbox.com/",
        description: "微软 Xbox 主机与 Game Pass 官网。"
      },
      {
        title: "Nintendo",
        url: "https://www.nintendo.com/",
        description: "任天堂 Switch 主机与游戏官网。"
      },
      {
        title: "GOG",
        url: "https://www.gog.com/",
        description: "主打无 DRM 正版游戏的商店。",
        tagKeys: ["download"]
      },
      {
        title: "Origin EA",
        url: "https://www.ea.com/ea-app",
        description: "EA 旗下 PC 游戏与启动器平台。",
        tagKeys: ["download"]
      },
      {
        title: "Ubisoft Connect",
        url: "https://connect.ubisoft.com/",
        description: "育碧游戏的启动器与玩家社区。",
        tagKeys: ["community"]
      },
      {
        title: "itch.io",
        url: "https://itch.io/",
        description: "独立游戏发现、购买与创作平台。",
        tagKeys: ["discovery", "community"]
      },
      {
        title: "TapTap",
        url: "https://www.taptap.cn/",
        description: "面向手游玩家的推荐与社区平台。",
        tagKeys: ["community"]
      },
      {
        title: "IGN",
        url: "https://www.ign.com/",
        description: "全球知名的游戏评测与资讯媒体。",
        tagKeys: ["news"]
      },
      {
        title: "GameSpot",
        url: "https://www.gamespot.com/",
        description: "老牌的游戏新闻、评测与视频媒体。",
        tagKeys: ["news"]
      },
      {
        title: "游民星空",
        url: "https://www.gamersky.com/",
        description: "国内主流游戏资讯与攻略网站。",
        tagKeys: ["news"]
      },
      {
        title: "3DMGAME",
        url: "https://www.3dmgame.com/",
        description: "国内单机游戏资讯与资源社区。",
        tagKeys: ["community", "news"]
      },
      {
        title: "Nexus Mods",
        url: "https://www.nexusmods.com/",
        description: "游戏 Mod 模组下载与分享社区。",
        tagKeys: ["download", "community"]
      },
      {
        title: "Twitch",
        url: "https://www.twitch.tv/",
        description: "全球最大的游戏直播平台。",
        tagKeys: ["media", "community"]
      },
      {
        title: "斗鱼",
        url: "https://www.douyu.com/",
        description: "国内主流的游戏直播平台。",
        tagKeys: ["media", "community"]
      },
      {
        title: "虎牙直播",
        url: "https://www.huya.com/",
        description: "国内游戏与娱乐直播平台。",
        tagKeys: ["media", "community"]
      }
    ]
  }
  ,
  {
    tagKey: "discovery",
    bookmarks: [
      {
        title: "Product Hunt",
        url: "https://www.producthunt.com/",
        description: "每天发现最新科技产品与创业项目。",
        tagKeys: ["community"]
      },
      {
        title: "Hacker News",
        url: "https://news.ycombinator.com/",
        description: "面向技术与创业人群的热门链接社区。",
        tagKeys: ["community", "news"]
      },
      {
        title: "Reddit",
        url: "https://www.reddit.com/",
        description: "按兴趣版块组织的全球大型讨论社区。",
        tagKeys: ["community", "news"]
      },
      {
        title: "少数派",
        url: "https://sspai.com/",
        description: "发现优质应用、数字生活与效率方法。",
        tagKeys: ["reading", "community", "efficiency"]
      },
      {
        title: "即刻",
        url: "https://okjike.com/",
        description: "基于兴趣圈子分享生活动态的社区。",
        tagKeys: ["community"]
      },
      {
        title: "知乎",
        url: "https://www.zhihu.com/",
        description: "中文互联网问答与内容讨论社区。",
        tagKeys: ["community", "search"]
      },
      {
        title: "V2EX",
        url: "https://www.v2ex.com/",
        description: "技术从业者分享创意与想法的社区。",
        tagKeys: ["community", "developer"]
      },
      {
        title: "AlternativeTo",
        url: "https://alternativeto.net/",
        description: "查找某款软件的免费或同类替代品。",
        tagKeys: ["search", "tool"]
      },
      {
        title: "Slant",
        url: "https://www.slant.co/",
        description: "通过对比推荐帮你选择最佳产品。",
        tagKeys: ["community", "search"]
      },
      {
        title: "Awesome Lists",
        url: "https://github.com/sindresorhus/awesome",
        description: "汇集各领域优质资源的精选清单合集。",
        tagKeys: ["developer", "learning"]
      },
      {
        title: "StackShare",
        url: "https://stackshare.io/",
        description: "发现公司与开发者使用的技术栈。",
        tagKeys: ["developer", "community"]
      },
      {
        title: "The Verge",
        url: "https://www.theverge.com/",
        description: "科技产品、数字文化交叉报道媒体。",
        tagKeys: ["news"]
      },
      {
        title: "TechCrunch",
        url: "https://techcrunch.com/",
        description: "聚焦创业公司与科技产业的新闻媒体。",
        tagKeys: ["news"]
      },
      {
        title: "BetaList",
        url: "https://betalist.com/",
        description: "抢先发现尚未上线的创业产品。"
      },
      {
        title: "Uneed",
        url: "https://www.uneed.best/",
        description: "由开发者投票推荐的新产品集合。",
        tagKeys: ["community"]
      },
      {
        title: "SaaSHub",
        url: "https://www.saashub.com/",
        description: "按分类发现和对比在线软件服务。",
        tagKeys: ["search", "tool"]
      },
      {
        title: "Futurepedia",
        url: "https://www.futurepedia.io/",
        description: "收录海量 AI 工具的分类目录。",
        tagKeys: ["ai", "search"]
      },
      {
        title: "There's An AI For That",
        url: "https://theresanaiforthat.com/",
        description: "按具体任务检索合适 AI 工具的目录。",
        tagKeys: ["ai", "search"]
      }
    ]
  }
  ,
  {
    tagKey: "search",
    bookmarks: [
      {
        title: "Google",
        url: "https://www.google.com/",
        description: "全球使用最广泛的综合搜索引擎。"
      },
      {
        title: "百度",
        url: "https://www.baidu.com/",
        description: "国内市场领先的中文搜索引擎。"
      },
      {
        title: "Bing",
        url: "https://www.bing.com/",
        description: "微软推出的综合搜索引擎。"
      },
      {
        title: "DuckDuckGo",
        url: "https://duckduckgo.com/",
        description: "注重隐私、不追踪用户的搜索引擎。"
      },
      {
        title: "搜狗搜索",
        url: "https://www.sogou.com/",
        description: "支持微信内容检索的中文搜索引擎。"
      },
      {
        title: "360 搜索",
        url: "https://www.so.com/",
        description: "国内主流的中文综合搜索引擎。"
      },
      {
        title: "Yandex",
        url: "https://yandex.com/",
        description: "俄罗斯最大的搜索引擎与互联网公司。"
      },
      {
        title: "Brave Search",
        url: "https://search.brave.com/",
        description: "Brave 浏览器推出的独立隐私搜索引擎。"
      },
      {
        title: "Startpage",
        url: "https://www.startpage.com/",
        description: "获取谷歌结果且不记录隐私的搜索引擎。"
      },
      {
        title: "Quora",
        url: "https://www.quora.com/",
        description: "英文世界的知名问答知识社区。",
        tagKeys: ["community"]
      },
      {
        title: "Stack Exchange",
        url: "https://stackexchange.com/",
        description: "覆盖众多专业领域的问答网络。",
        tagKeys: ["community"]
      },
      {
        title: "Wikidata",
        url: "https://www.wikidata.org/",
        description: "免费开放的结构化知识库与数据检索。",
        tagKeys: ["research"]
      },
      {
        title: "Magi",
        url: "https://magi.com/",
        description: "由 Peak Labs 开发的结构化答案搜索引擎。"
      },
      {
        title: "秘塔 AI 搜索",
        url: "https://metaso.cn/",
        description: "支持学术与文献模式的 AI 搜索。",
        tagKeys: ["ai", "research"]
      }
    ]
  }
  ,
  {
    tagKey: "news",
    bookmarks: [
      {
        title: "BBC News",
        url: "https://www.bbc.com/news",
        description: "英国广播公司的全球新闻报道。"
      },
      {
        title: "CNN",
        url: "https://www.cnn.com/",
        description: "美国有线电视新闻网全球新闻。"
      },
      {
        title: "The New York Times",
        url: "https://www.nytimes.com/",
        description: "美国最有影响力的综合报纸之一。"
      },
      {
        title: "The Guardian",
        url: "https://www.theguardian.com/international",
        description: "英国知名的自由派综合新闻媒体。"
      },
      {
        title: "Reuters 路透社",
        url: "https://www.reuters.com/",
        description: "全球知名的国际通讯社与财经新闻。",
        tagKeys: ["finance"]
      },
      {
        title: "Associated Press",
        url: "https://apnews.com/",
        description: "美联社全球新闻与通讯社报道。"
      },
      {
        title: "The Washington Post",
        url: "https://www.washingtonpost.com/",
        description: "美国华盛顿老牌权威综合报纸。"
      },
      {
        title: "新华网",
        url: "https://www.news.cn/",
        description: "国家通讯社新华社官方新闻网站。"
      },
      {
        title: "人民网",
        url: "https://www.people.com.cn/",
        description: "《人民日报》旗下的权威新闻网站。"
      },
      {
        title: "澎湃新闻",
        url: "https://www.thepaper.cn/",
        description: "以时政与深度报道著称的新闻平台。"
      },
      {
        title: "财新网",
        url: "https://www.caixin.com/",
        description: "国内领先的财经新闻深度报道媒体。",
        tagKeys: ["finance"]
      },
      {
        title: "界面新闻",
        url: "https://www.jiemian.com/",
        description: "面向商业人群的财经与社会新闻。",
        tagKeys: ["finance"]
      },
      {
        title: "央视新闻",
        url: "https://news.cctv.com/",
        description: "中央广播电视总台官方新闻门户。"
      },
      {
        title: "环球网",
        url: "https://www.huanqiu.com/",
        description: "提供国际新闻与中外资讯的门户。"
      },
      {
        title: "中国新闻网",
        url: "https://www.chinanews.com.cn/",
        description: "中国新闻社旗下的综合新闻网站。"
      },
      {
        title: "36 氪",
        url: "https://36kr.com/",
        description: "聚焦科技、创投与商业的资讯媒体。",
        tagKeys: ["finance"]
      },
      {
        title: "虎嗅",
        url: "https://www.huxiu.com/",
        description: "商业、科技与产业深度观察媒体。"
      },
      {
        title: "钛媒体",
        url: "https://www.tmtpost.com/",
        description: "科技、财经与资本市场资讯平台。",
        tagKeys: ["finance"]
      },
      {
        title: "Ars Technica",
        url: "https://arstechnica.com/",
        description: "面向技术爱好者的深度科技新闻。",
        tagKeys: ["developer"]
      },
      {
        title: "Engadget",
        url: "https://www.engadget.com/",
        description: "消费电子产品与数码科技新闻。"
      },
      {
        title: "Wired",
        url: "https://www.wired.com/",
        description: "科技如何改变世界的深度报道杂志。",
        tagKeys: ["reading"]
      },
      {
        title: "The Economist",
        url: "https://www.economist.com/",
        description: "聚焦全球政经分析的权威周刊。",
        tagKeys: ["finance", "reading"]
      },
      {
        title: "Bloomberg",
        url: "https://www.bloomberg.com/",
        description: "全球金融市场与商业新闻数据终端。",
        tagKeys: ["finance"]
      },
      {
        title: "CNBC",
        url: "https://www.cnbc.com/",
        description: "美国知名财经新闻与市场报道媒体。",
        tagKeys: ["finance"]
      }
    ]
  }
  ,
  {
    tagKey: "community",
    bookmarks: [
      {
        title: "X (Twitter)",
        url: "https://x.com/",
        description: "全球流行的实时动态与短内容社交网络。",
        tagKeys: ["news", "discovery"]
      },
      {
        title: "Facebook",
        url: "https://www.facebook.com/",
        description: "全球用户量庞大的社交网络平台。"
      },
      {
        title: "Instagram",
        url: "https://www.instagram.com/",
        description: "以图片和短视频分享为主的社交平台。",
        tagKeys: ["image"]
      },
      {
        title: "Threads",
        url: "https://www.threads.com/",
        description: "Meta 推出的文字动态社交平台。"
      },
      {
        title: "微博",
        url: "https://weibo.com/",
        description: "国内主流的社交媒体与热点舆论平台。",
        tagKeys: ["news", "discovery"]
      },
      {
        title: "小红书",
        url: "https://www.xiaohongshu.com/",
        description: "生活方式分享与种草内容社区。",
        tagKeys: ["discovery", "image"]
      },
      {
        title: "豆瓣",
        url: "https://www.douban.com/",
        description: "书影音评分、兴趣小组与同城社区。",
        tagKeys: ["reading", "media"]
      },
      {
        title: "Discord",
        url: "https://discord.com/",
        description: "游戏与兴趣社群的语音文字聊天平台。"
      },
      {
        title: "Telegram",
        url: "https://telegram.org/",
        description: "注重速度与安全的即时通讯工具。",
        tagKeys: ["download"]
      },
      {
        title: "Mastodon",
        url: "https://joinmastodon.org/",
        description: "去中心化的开源微博社交网络。"
      },
      {
        title: "Tumblr",
        url: "https://www.tumblr.com/",
        description: "图片、短文与梗文化浓厚的轻博客社区。"
      },
      {
        title: "LinkedIn",
        url: "https://www.linkedin.com/",
        description: "全球知名的职业社交与招聘平台。",
        tagKeys: ["work"]
      },
      {
        title: "脉脉",
        url: "https://maimai.cn/",
        description: "国内的职场社交与招聘平台。",
        tagKeys: ["work"]
      },
      {
        title: "NGA 玩家社区",
        url: "https://ngabbs.com/",
        description: "国内老牌的游戏与二次元玩家论坛。",
        tagKeys: ["game"]
      },
      {
        title: "贴吧",
        url: "https://tieba.baidu.com/",
        description: "按关键词组建兴趣吧的中文论坛。",
        tagKeys: ["game"]
      },
      {
        title: "虎扑",
        url: "https://www.hupu.com/",
        description: "以体育赛事和男性生活话题见长的社区。",
        tagKeys: ["news"]
      },
      {
        title: "Ruby China",
        url: "https://ruby-china.org/",
        description: "国内活跃的 Ruby 与 Rails 开发者社区。",
        tagKeys: ["developer"]
      },
      {
        title: "NPR",
        url: "https://www.npr.org/",
        description: "美国国家公共广播电台新闻与节目。",
        tagKeys: ["news"]
      },
      {
        title: "Medium",
        url: "https://medium.com/",
        description: "任何人都可以写作与订阅的博客平台。",
        tagKeys: ["reading"]
      },
      {
        title: "DEV Community",
        url: "https://dev.to/",
        description: "面向开发者的技术博客交流社区。",
        tagKeys: ["developer", "reading"]
      },
      {
        title: "CSDN",
        url: "https://www.csdn.net/",
        description: "国内大型开发者技术博客与论坛。",
        tagKeys: ["developer", "learning", "reading"]
      },
      {
        title: "掘金",
        url: "https://juejin.cn/",
        description: "国内中文技术内容创作与交流社区。",
        tagKeys: ["developer", "learning", "reading"]
      },
      {
        title: "SegmentFault 思否",
        url: "https://segmentfault.com/",
        description: "中文开发者问答与技术专栏社区。",
        tagKeys: ["developer", "learning", "reading"]
      },
      {
        title: "开源中国",
        url: "https://www.oschina.net/",
        description: "推广开源软件的中文技术资讯社区。",
        tagKeys: ["developer", "reading"]
      }
    ]
  }
  ,
  {
    tagKey: "research",
    bookmarks: [
      {
        title: "Google Scholar",
        url: "https://scholar.google.com/",
        description: "检索学术论文、引用与相关文献的服务。",
        tagKeys: ["search", "learning"]
      },
      {
        title: "arXiv",
        url: "https://arxiv.org/",
        description: "物理、数学、计算机等领域预印本平台。",
        tagKeys: ["reading"]
      },
      {
        title: "PubMed",
        url: "https://pubmed.ncbi.nlm.nih.gov/",
        description: "生物医学与生命科学文献数据库。"
      },
      {
        title: "Semantic Scholar",
        url: "https://www.semanticscholar.org/",
        description: "AI 驱动的论文检索与摘要工具。",
        tagKeys: ["ai", "search"]
      },
      {
        title: "IEEE Xplore",
        url: "https://ieeexplore.ieee.org/",
        description: "工程、电子与计算机领域文献库。"
      },
      {
        title: "ScienceDirect",
        url: "https://www.sciencedirect.com/",
        description: "爱思唯尔旗下的全学科学术文献平台。"
      },
      {
        title: "SpringerLink",
        url: "https://link.springer.com/",
        description: "施普林格的学术图书与期刊数据库。"
      },
      {
        title: "知网 CNKI",
        url: "https://www.cnki.net/",
        description: "国内主流的中文学术期刊与论文库。",
        tagKeys: ["learning"]
      },
      {
        title: "万方数据",
        url: "https://www.wanfangdata.com.cn/",
        description: "中文学位论文、期刊与知识服务平台。",
        tagKeys: ["learning"]
      },
      {
        title: "维普网",
        url: "https://www.cqvip.com/",
        description: "中文科技期刊与文献检索服务。",
        tagKeys: ["learning"]
      },
      {
        title: "中国国家图书馆",
        url: "https://www.nlc.cn/",
        description: "国家总书库与在线文献资源服务。",
        tagKeys: ["reading"]
      },
      {
        title: "WorldCat",
        url: "https://search.worldcat.org/",
        description: "全球图书馆联合馆藏检索目录。",
        tagKeys: ["search", "reading"]
      },
      {
        title: "JSTOR",
        url: "https://www.jstor.org/",
        description: "人文社科领域的核心学术期刊库。",
        tagKeys: ["reading"]
      },
      {
        title: "Nature",
        url: "https://www.nature.com/",
        description: "国际顶级的综合科学期刊官网。",
        tagKeys: ["reading"]
      },
      {
        title: "Science",
        url: "https://www.science.org/",
        description: "美国科学促进会出版的顶级期刊。",
        tagKeys: ["reading"]
      },
      {
        title: "Connected Papers",
        url: "https://www.connectedpapers.com/",
        description: "可视化探索论文之间关联脉络的工具。",
        tagKeys: ["tool"]
      }
    ]
  }
  ,
  {
    tagKey: "finance",
    bookmarks: [
      {
        title: "PayPal",
        url: "https://www.paypal.com/",
        description: "全球广泛使用的在线支付与跨境收款平台。"
      },
      {
        title: "Wise",
        url: "https://wise.com/",
        description: "以真实汇率提供低成本国际汇款与多币种账户服务。",
        tagKeys: ["tool"]
      },
      {
        title: "XE",
        url: "https://www.xe.com/",
        description: "实时汇率查询与全球货币兑换换算工具。",
        tagKeys: ["tool"]
      },
      {
        title: "Yahoo Finance",
        url: "https://finance.yahoo.com/",
        description: "免费提供全球股票行情、财报与财经资讯。"
      },
      {
        title: "MarketWatch",
        url: "https://www.marketwatch.com/",
        description: "跟踪美股与全球市场行情的财经新闻网站。"
      },
      {
        title: "Morningstar",
        url: "https://www.morningstar.com/",
        description: "以基金评级与投资研究著称的金融数据机构。"
      },
      {
        title: "Investing.com",
        url: "https://www.investing.com/",
        description: "覆盖全球股票、外汇与大宗商品行情的金融门户。"
      },
      {
        title: "TradingView",
        url: "https://www.tradingview.com/",
        description: "功能强大的在线金融图表与技术分析社区。",
        tagKeys: ["tool", "community"]
      },
      {
        title: "CoinMarketCap",
        url: "https://coinmarketcap.com/",
        description: "最常用的加密货币市值、行情与数据查询站。",
        tagKeys: ["tool"]
      },
      {
        title: "CoinGecko",
        url: "https://www.coingecko.com/",
        description: "独立的加密货币行情、市值与基本面数据平台。",
        tagKeys: ["tool"]
      },
      {
        title: "Coinbase",
        url: "https://www.coinbase.com/",
        description: "美国合规的头部加密货币交易与托管平台。"
      },
      {
        title: "Binance",
        url: "https://www.binance.com/",
        description: "全球交易量领先的加密货币交易平台。"
      },
      {
        title: "OKX",
        url: "https://www.okx.com/",
        description: "提供现货、合约与 Web3 钱包的加密资产平台。"
      },
      {
        title: "NerdWallet",
        url: "https://www.nerdwallet.com/",
        description: "比较信用卡、贷款与保险产品的个人理财顾问平台。"
      },
      {
        title: "Fidelity",
        url: "https://www.fidelity.com/",
        description: "美国大型券商与退休账户、基金投资服务商。"
      },
      {
        title: "Charles Schwab",
        url: "https://www.schwab.com/",
        description: "提供股票、基金与财富管理服务的知名券商。"
      },
      {
        title: "Robinhood",
        url: "https://robinhood.com/",
        description: "以零佣金和移动端体验著称的美股交易平台。"
      },
      {
        title: "支付宝",
        url: "https://www.alipay.com/",
        description: "国内主流的移动支付与生活金融服务平台。"
      },
      {
        title: "东方财富网",
        url: "https://www.eastmoney.com/",
        description: "国内领先的财经门户，提供行情、资讯与基金数据。"
      },
      {
        title: "雪球",
        url: "https://xueqiu.com/",
        description: "以投资讨论与组合跟踪为特色的投资者社区。",
        tagKeys: ["community"]
      },
      {
        title: "同花顺",
        url: "https://www.10jqka.com.cn/",
        description: "老牌证券行情、交易与金融数据服务平台。"
      },
      {
        title: "巨潮资讯网",
        url: "https://www.cninfo.com.cn/",
        description: "中国证监会指定的上市公司信息披露平台。"
      }
    ]
  }
  ,
  {
    tagKey: "download",
    bookmarks: [
      {
        title: "Apple App Store",
        url: "https://www.apple.com/app-store/",
        description: "iPhone 与 iPad 应用的官方下载渠道。"
      },
      {
        title: "Mac App Store",
        url: "https://www.apple.com/mac/app-store/",
        description: "macOS 应用的官方下载与更新渠道。"
      },
      {
        title: "Microsoft Store",
        url: "https://apps.microsoft.com/",
        description: "Windows 应用、游戏与软件的官方商店。"
      },
      {
        title: "Google Play",
        url: "https://play.google.com/",
        description: "安卓应用、游戏与数字内容的官方商店。"
      },
      {
        title: "华为应用市场",
        url: "https://appgallery.huawei.com/",
        description: "华为终端官方安卓应用分发平台。"
      },
      {
        title: "小米应用商店",
        url: "https://apps.mi.com/",
        description: "小米官方安卓应用下载与管理平台。"
      },
      {
        title: "Homebrew",
        url: "https://brew.sh/",
        description: "macOS 与 Linux 上最流行的命令行包管理器。",
        tagKeys: ["developer", "tool"]
      },
      {
        title: "F-Droid",
        url: "https://f-droid.org/",
        description: "收录自由开源安卓应用的可信赖安装仓库。"
      },
      {
        title: "APKPure",
        url: "https://apkpure.com/",
        description: "提供安卓 APK 与应用历史版本下载的平台。"
      },
      {
        title: "Uptodown",
        url: "https://www.uptodown.com/",
        description: "跨平台软件与应用安装包的老牌下载站。"
      },
      {
        title: "Softpedia",
        url: "https://www.softpedia.com/",
        description: "收录海量 Windows、Mac 与移动软件的下载站。"
      },
      {
        title: "MajorGeeks",
        url: "https://www.majorgeeks.com/",
        description: "以人工审核和干净安装包著称的软件下载站。"
      },
      {
        title: "FileHorse",
        url: "https://www.filehorse.com/",
        description: "提供 Windows 与 Mac 热门软件安全下载。"
      },
      {
        title: "FileHippo",
        url: "https://filehippo.com/",
        description: "简洁老牌的免费软件下载与版本更新站。"
      },
      {
        title: "MacUpdate",
        url: "https://www.macupdate.com/",
        description: "面向 Mac 用户的软件下载与优惠资讯站。"
      },
      {
        title: "SourceForge",
        url: "https://sourceforge.net/",
        description: "开源软件的发源地之一，托管大量开源项目下载。",
        tagKeys: ["developer"]
      },
      {
        title: "PortableApps.com",
        url: "https://portableapps.com/",
        description: "提供无需安装、可随身携带的绿色软件平台。"
      },
      {
        title: "Chocolatey",
        url: "https://chocolatey.org/",
        description: "Windows 上通过命令行批量安装软件的包管理器。",
        tagKeys: ["developer", "tool"]
      }
    ]
  }
  ,
  {
    tagKey: "learning",
    bookmarks: [
      {
        title: "Coursera",
        url: "https://www.coursera.org/",
        description: "与顶尖高校和企业合作的在线课程与学位平台。"
      },
      {
        title: "edX",
        url: "https://www.edx.org/",
        description: "哈佛、MIT 等高校发起的开源式慕课平台。"
      },
      {
        title: "MIT OpenCourseWare",
        url: "https://ocw.mit.edu/",
        description: "MIT 免费公开的全校课程讲义与教学资源。",
        tagKeys: ["research"]
      },
      {
        title: "Khan Academy",
        url: "https://www.khanacademy.org/",
        description: "覆盖数理化与人文科目的免费非营利教学平台。"
      },
      {
        title: "Udemy",
        url: "https://www.udemy.com/",
        description: "讲师丰富、品类广泛的付费技能课程市场。"
      },
      {
        title: "Udacity",
        url: "https://www.udacity.com/",
        description: "以纳米学位和项目驱动著称的职业技能平台。"
      },
      {
        title: "Pluralsight",
        url: "https://www.pluralsight.com/",
        description: "面向技术从业者的系统化软件开发课程库。",
        tagKeys: ["developer"]
      },
      {
        title: "Skillshare",
        url: "https://www.skillshare.com/",
        description: "聚焦创意、设计与副业技能的短视频课程社区。",
        tagKeys: ["design"]
      },
      {
        title: "FutureLearn",
        url: "https://www.futurelearn.com/",
        description: "英国高校与文化机构合作的在线课程平台。"
      },
      {
        title: "The Open University",
        url: "https://www.open.edu/",
        description: "开放大学提供的免费课程与学习资料平台。"
      },
      {
        title: "Brilliant",
        url: "https://brilliant.org/",
        description: "通过交互式课程学习数学、科学与计算机思维。"
      },
      {
        title: "Duolingo",
        url: "https://www.duolingo.com/",
        description: "游戏化的免费外语学习应用，支持数十种语言。"
      },
      {
        title: "Busuu",
        url: "https://www.busuu.com/",
        description: "结合母语者互动纠音的在线语言学习社区。",
        tagKeys: ["community"]
      },
      {
        title: "Memrise",
        url: "https://www.memrise.com/",
        description: "基于真实场景与记忆法的语言学习应用。"
      },
      {
        title: "中国大学 MOOC",
        url: "https://www.icourse163.org/",
        description: "网易与高教社合作的国内高校慕课平台。"
      },
      {
        title: "学堂在线",
        url: "https://www.xuetangx.com/",
        description: "清华大学发起的中文慕课与证书课程平台。"
      },
      {
        title: "国家智慧教育公共服务平台",
        url: "https://www.smartedu.cn/",
        description: "教育部主办的覆盖基础教育到高等教育的资源平台。"
      },
      {
        title: "网易公开课",
        url: "https://open.163.com/",
        description: "汇集国际名校公开课与 TED 演讲的视频平台。"
      },
      {
        title: "腾讯课堂",
        url: "https://ke.qq.com/",
        description: "腾讯旗下职业技能与兴趣培训在线教育平台。"
      },
      {
        title: "哔哩哔哩课堂",
        url: "https://www.bilibili.com/cheese/",
        description: "B 站付费课程与知识科普学习板块。",
        tagKeys: ["media"]
      },
      {
        title: "慕课网",
        url: "https://www.imooc.com/",
        description: "以实战编程课见长的 IT 技能学习平台。",
        tagKeys: ["developer"]
      },
      {
        title: "极客时间",
        url: "https://time.geekbang.org/",
        description: "面向技术与产品从业者的体系化专栏课程。",
        tagKeys: ["developer", "reading"]
      },
      {
        title: "Quizlet",
        url: "https://quizlet.com/",
        description: "用闪卡与测验帮助记忆知识点的学习工具。",
        tagKeys: ["tool"]
      }
    ]
  }
  ,
  {
    tagKey: "work",
    bookmarks: [
      {
        title: "Slack",
        url: "https://slack.com/",
        description: "海外团队广泛使用的频道式即时沟通与协作平台。"
      },
      {
        title: "Microsoft Teams",
        url: "https://www.microsoft.com/en-us/microsoft-teams/",
        description: "微软集成会议、聊天与 Office 文档的协作平台。"
      },
      {
        title: "Zoom",
        url: "https://zoom.us/",
        description: "普及率极高的视频会议与网络研讨会平台。",
        tagKeys: ["tool"]
      },
      {
        title: "Google Meet",
        url: "https://meet.google.com/",
        description: "谷歌基于浏览器的高清视频会议服务。"
      },
      {
        title: "Webex",
        url: "https://www.webex.com/",
        description: "思科面向企业的视频会议与协作套件。"
      },
      {
        title: "钉钉",
        url: "https://www.dingtalk.com/",
        description: "阿里巴巴旗下企业沟通、审批与考勤一体化平台。"
      },
      {
        title: "企业微信",
        url: "https://work.weixin.qq.com/",
        description: "腾讯连接微信生态的企业办公与客户管理平台。"
      },
      {
        title: "Jira",
        url: "https://www.atlassian.com/software/jira/",
        description: "Atlassian 旗下面向研发团队的项目与缺陷跟踪工具。",
        tagKeys: ["developer"]
      },
      {
        title: "Confluence",
        url: "https://www.atlassian.com/software/confluence/",
        description: "团队知识沉淀与项目文档协作的 Wiki 平台。"
      },
      {
        title: "Miro",
        url: "https://miro.com/",
        description: "支持远程协作的在线白板与头脑风暴画布。",
        tagKeys: ["design", "tool"]
      },
      {
        title: "monday.com",
        url: "https://monday.com/",
        description: "可视化的团队工作管理与流程自动化平台。"
      },
      {
        title: "Calendly",
        url: "https://calendly.com/",
        description: "通过共享空闲时段自动安排会议的预约工具。",
        tagKeys: ["tool"]
      },
      {
        title: "Dropbox",
        url: "https://www.dropbox.com/",
        description: "老牌云存储与团队文件同步共享平台。",
        tagKeys: ["cloud-service"]
      },
      {
        title: "Box",
        url: "https://box.com/",
        description: "面向企业的安全内容管理与文件协作云平台。",
        tagKeys: ["cloud-service"]
      },
      {
        title: "金山文档",
        url: "https://www.kdocs.cn/",
        description: "支持多人实时协作的国产在线 Office 文档平台。"
      },
      {
        title: "WPS",
        url: "https://www.wps.cn/",
        description: "国产办公软件套件，提供文档、表格与演示。"
      },
      {
        title: "Basecamp",
        url: "https://basecamp.com/",
        description: "以简洁著称的远程团队项目与沟通管理工具。"
      },
      {
        title: "Smartsheet",
        url: "https://www.smartsheet.com/",
        description: "类似电子表格的企业级工作与项目管理平台。"
      },
      {
        title: "Workday",
        url: "https://www.workday.com/",
        description: "面向中大型企业的人力资源与财务管理云平台。",
        tagKeys: ["cloud-service"]
      },
      {
        title: "ServiceNow",
        url: "https://www.servicenow.com/",
        description: "企业级 IT 服务管理与数字化工作流平台。",
        tagKeys: ["cloud-service"]
      }
    ]
  }
  ,
  {
    tagKey: "reading",
    bookmarks: [
      {
        title: "Substack",
        url: "https://substack.com/",
        description: "作者直接向订阅者发送邮件通讯的写作平台。"
      },
      {
        title: "Feedly",
        url: "https://feedly.com/",
        description: "流行的 RSS 订阅与信息流聚合阅读器。",
        tagKeys: ["tool"]
      },
      {
        title: "Inoreader",
        url: "https://www.inoreader.com/",
        description: "功能强大的 RSS 订阅与信息过滤阅读工具。",
        tagKeys: ["tool"]
      },
      {
        title: "Flipboard",
        url: "https://flipboard.com/",
        description: "杂志式排版的新闻与兴趣内容聚合应用。",
        tagKeys: ["news"]
      },
      {
        title: "Goodreads",
        url: "https://www.goodreads.com/",
        description: "全球最大的读书评分、书单与书评社区。",
        tagKeys: ["community"]
      },
      {
        title: "Amazon Kindle",
        url: "https://www.amazon.com/kindle",
        description: "亚马逊电子书阅读器与电子书商店入口。"
      },
      {
        title: "微信读书",
        url: "https://weread.qq.com/",
        description: "腾讯主打社交共读与无限卡的中文阅读平台。"
      },
      {
        title: "起点中文网",
        url: "https://www.qidian.com/",
        description: "国内头部的网络文学原创与连载平台。"
      },
      {
        title: "晋江文学城",
        url: "https://www.jjwxc.net/",
        description: "以女性向原创小说著称的网络文学站点。"
      },
      {
        title: "番茄小说",
        url: "https://fanqienovel.com/",
        description: "字节跳动旗下免费网络文学阅读平台。"
      },
      {
        title: "当当网",
        url: "https://www.dangdang.com/",
        description: "以图书起家的老牌中文网上书店。"
      },
      {
        title: "豆瓣读书",
        url: "https://book.douban.com/",
        description: "查询图书评分、书评与书单的权威入口。"
      },
      {
        title: "知乎日报",
        url: "https://daily.zhihu.com/",
        description: "知乎每日精选的优质长文与热门问答合集。"
      },
      {
        title: "简书",
        url: "https://www.jianshu.com/",
        description: "门槛较低、氛围轻松的中文原创写作社区。",
        tagKeys: ["community"]
      },
      {
        title: "博客园",
        url: "https://www.cnblogs.com/",
        description: "国内老牌的开发者技术博客与文章社区。",
        tagKeys: ["developer"]
      },
      {
        title: "知乎专栏",
        url: "https://zhuanlan.zhihu.com/",
        description: "知乎旗下的长文专栏写作与阅读平台。"
      },
      {
        title: "果壳",
        url: "https://www.guokr.com/",
        description: "用通俗方式科普科学知识与泛科技话题的平台。",
        tagKeys: ["research", "news"]
      },
      {
        title: "维基百科",
        url: "https://www.wikipedia.org/",
        description: "由全球志愿者协作编写的多语言自由百科全书。",
        tagKeys: ["research", "learning"]
      },
      {
        title: "百度百科",
        url: "https://baike.baidu.com/",
        description: "中文用户量最大、词条覆盖广泛的网络百科。",
        tagKeys: ["learning"]
      },
      {
        title: "WikiHow",
        url: "https://www.wikihow.com/",
        description: "用图文步骤教你完成各种任务的指南百科。",
        tagKeys: ["learning", "tool"]
      },
      {
        title: "The New Yorker",
        url: "https://www.newyorker.com/",
        description: "以深度特稿、文化评论与小说著称的杂志。",
        tagKeys: ["news"]
      },
      {
        title: "The Atlantic",
        url: "https://www.theatlantic.com/",
        description: "聚焦政治、文化与思想长文的美国老牌杂志。",
        tagKeys: ["news"]
      },
      {
        title: "Longreads",
        url: "https://longreads.com/",
        description: "精选全网最佳长篇非虚构与特稿的阅读站。"
      },
      {
        title: "Longform",
        url: "https://longform.org/",
        description: "汇集优秀长篇报道、访谈与播客的索引站。"
      },
      {
        title: "Aeon",
        url: "https://aeon.co/",
        description: "发表哲学、科学与社会思想长文的数字杂志。",
        tagKeys: ["research"]
      },
      {
        title: "Wait But Why",
        url: "https://waitbutwhy.com/",
        description: "用火柴人插画深入解释宏大议题的知名博客。"
      }
    ]
  }
];

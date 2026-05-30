import React, { useState, useEffect, useMemo } from "react";
import { findFuzzyScore } from "../utils/pinyinMatcher";
import { 
  Search, 
  Plus, 
  Paperclip, 
  HelpCircle, 
  RotateCcw, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Globe, 
  X, 
  FileText,
  AlertTriangle,
  FileDown,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types
export interface LinkItem {
  name: string;
  url: string;
  cat: string;
}

interface FileItem {
  name: string;
}

// 10 Standard Categories
export const DEFAULT_CATEGORIES = [
  "一、大赛官方平台",
  "二、AI素养",
  "三、政府开放信息",
  "四、实用学习资源",
  "五、学术信息资源",
  "六、信息检索系统",
  "七、信息检索理论与技术",
  "八、知识管理工具",
  "九、学术写作",
  "十、科研工具"
];

// Predefined White list links
export const DEFAULT_LINKS: LinkItem[] = [
  // 一、大赛官方平台
  { name: "高校信息素养教育数据库", url: "https://suyang.zxhnzq.com", cat: "一、大赛官方平台" },
  { name: "AI素养专题学习库", url: "https://ai.xxsuyang.com", cat: "一、大赛官方平台" },
  { name: "北京市大学生“AI+信息素养”大赛报名及参赛网站", url: "https://bjcsc.nczxst.com/", cat: "一、大赛官方平台" },
  
  // 二、AI素养
  { name: "豆包", url: "https://www.doubao.com", cat: "二、AI素养" },
  { name: "Z智谱", url: "https://chat.z.ai/", cat: "二、AI素养" },
  { name: "智谱清言", url: "https://chatglm.cn/main/", cat: "二、AI素养" },
  { name: "通义千问", url: "https://www.qianwen.com/", cat: "二、AI素养" },
  { name: "通义万相", url: "https://tongyi.aliyun.com/wan/explore", cat: "二、AI素养" },
  { name: "讯飞星火", url: "https://xinghuo.xfyun.cn/desk", cat: "二、AI素养" },
  { name: "星火科研助手", url: "https://paper.iflytek.com/sci-web/research", cat: "二、AI素养" },
  { name: "讯飞绘文", url: "https://turbodesk.xfyun.cn/?channelid=sparkzhuye", cat: "二、AI素养" },
  { name: "讯飞智文", url: "https://zhiwen.xfyun.cn/home", cat: "二、AI素养" },
  { name: "文心一言", url: "https://yiyan.baidu.com", cat: "二、AI素养" },
  { name: "腾讯元宝", url: "https://yuanbao.tencent.com", cat: "二、AI素养" },
  { name: "扣子Coze", url: "https://www.coze.cn", cat: "二、AI素养" },
  { name: "腾讯元器", url: "https://yuanqi.tencent.com", cat: "二、AI素养" },
  { name: "秘塔AI", url: "https://www.metaso.cn", cat: "二、AI素养" },
  { name: "AMiner", url: "https://www.aminer.cn", cat: "二、AI素养" },
  { name: "网易天音", url: "https://tianyin.music.163.com", cat: "二、AI素养" },
  { name: "DeepSeek", url: "https://chat.deepseek.com/", cat: "二、AI素养" },
  { name: "Kimi", url: "https://kimi.moonshot.cn", cat: "二、AI素养" },
  { name: "纳米AI", url: "https://bot.n.cn", cat: "二、AI素养" },
  { name: "可灵AI", url: "https://klingai.kuaishou.com", cat: "二、AI素养" },
  { name: "蝉镜数字人", url: "https://www.chanjing.cc/home/", cat: "二、AI素养" },
  { name: "闪剪", url: "https://app.shanjian.tv/login", cat: "二、AI素养" },
  { name: "ima", url: "https://ima.qq.com", cat: "二、AI素养" },
  { name: "海螺ai", url: "https://hailuoai.com/", cat: "二、AI素养" },
  { name: "人民网人民智文智能文本编审系统", url: "https://www.lketech.cn/", cat: "二、AI素养" },
  { name: "阿里云开发者社区", url: "https://developer.aliyun.com", cat: "二、AI素养" },
  { name: "科大讯飞AI大学堂", url: "https://www.xfyun.cn", cat: "二、AI素养" },
  { name: "华为云开发者学堂", url: "https://developer.huaweicloud.com", cat: "二、AI素养" },
  { name: "动手学深度学习", url: "https://zh.d2l.ai", cat: "二、AI素养" },
  { name: "Elements of AI", url: "https://www.elementsofai.com", cat: "二、AI素养" },
  { name: "深圳大学图书馆AI专题网页", url: "https://www.lib.szu.edu.cn/learning/ai", cat: "二、AI素养" },
  { name: "北京师范大学图书馆生成式人工智能专题指南", url: "https://bnulibaiguide.mh.chaoxing.com/", cat: "二、AI素养" },
  { name: "四川大学图书馆生成式人工智能专题", url: "http://202.115.54.22/genai/home.html", cat: "二、AI素养" },
  { name: "济南大学图书馆人工智能专题", url: "https://library.ujn.edu.cn/bgfw/rgznzt.htm", cat: "二、AI素养" },
  { name: "江南大学图书馆AI专题", url: "https://lib.jiangnan.edu.cn/xxzc/AIzt1.htm", cat: "二、AI素养" },
  { name: "武汉大学图书馆人工智能资源导航", url: "https://oldwww.lib.whu.edu.cn/webfile/category/AI_navigator.html", cat: "二、AI素养" },
  { name: "中国人民大学图书馆AI知识、资源与服务专栏", url: "https://ruc-cn.libguides.com/genai", cat: "二、AI素养" },
  { name: "安徽工程大学图书馆生成式人工智能专题", url: "https://ahpuaigc.mh.chaoxing.com/", cat: "二、AI素养" },
  { name: "清华大学图书馆GenAI专题资源导航", url: "https://tsinghua.cn.libguides.com/c.php?g=968399&p=7039773", cat: "二、AI素养" },
  { name: "上海外国语大学图书馆生成式人工智能专题", url: "https://aishisulib.mh.chaoxing.com/", cat: "二、AI素养" },
  { name: "香港中文大学图书馆人工智能教育与研究", url: "https://aishisulib.mh.chaoxing.com/", cat: "二、AI素养" },
  { name: "联合国教科文AI伦理", url: "https://unesdoc.unesco.org", cat: "二、AI素养" },

  // 三、政府开放信息
  { name: "国务院政策文件库", url: "https://sousuo.www.gov.cn/zcwjk/policyDocumentLibrary", cat: "三、政府开放信息" },
  { name: "习近平系列重要讲话数据库", url: "http://jhsjk.people.cn", cat: "三、政府开放信息" },
  { name: "共产党员网", url: "https://www.12371.cn", cat: "三、政府开放信息" },
  { name: "全国高校课程思政教学资源服务平台", url: "https://xhsz.news.cn/curriculum", cat: "三、政府开放信息" },
  { name: "国家统计局数据查询系统", url: "https://data.stats.gov.cn/dg/website/page.html#/pc/national/home", cat: "三、政府开放信息" },
  { name: "中国科技资源共享网/国家科学数据中心", url: "https://www.escience.org.cn", cat: "三、政府开放信息" },
  { name: "国务院科技报告服务系统", url: "https://www.nstrs.cn", cat: "三、政府开放信息" },
  { name: "国家法律法规数据库", url: "https://flk.npc.gov.cn", cat: "三、政府开放信息" },
  { name: "国家行政法规库", url: "http://www.gov.cn/zhengce/xzfgk", cat: "三、政府开放信息" },
  { name: "国家规章库", url: "https://www.gov.cn/zhengce/xxgk/gjgzk/index.htm", cat: "三、政府开放信息" },
  { name: "人民法院案例库", url: "https://rmfyalk.court.gov.cn", cat: "三、政府开放信息" },
  { name: "最高人民法院公报检索系统", url: "http://gongbao.court.gov.cn", cat: "三、政府开放信息" },
  { name: "中国执行信息公开网", url: "http://zxgk.court.gov.cn", cat: "三、政府开放信息" },
  { name: "中国庭审公开网", url: "http://tingshen.court.gov.cn", cat: "三、政府开放信息" },
  { name: "中国裁判文书网", url: "https://wenshu.court.gov.cn", cat: "三、政府开放信息" },
  { name: "国家标准全文公开系统", url: "https://openstd.samr.gov.cn", cat: "三、政府开放信息" },
  { name: "全国标准信息公共服务平台", url: "http://std.samr.gov.cn", cat: "三、政府开放信息" },
  { name: "食品安全国家标准查询", url: "https://sppt.cfsa.net.cn:8086/db", cat: "三、政府开放信息" },
  { name: "生态环境标准查询", url: "https://www.mee.gov.cn/ywgz/fgbz/bz", cat: "三、政府开放信息" },
  { name: "工程建设标准查询", url: "https://www.mohurd.gov.cn/gongkai/fdzdgknr/bzgg", cat: "三、政府开放信息" },
  { name: "中国商标网/商标查询", url: "https://sbj.cnipa.gov.cn/sbj/sbcx", cat: "三、政府开放信息" },
  { name: "国家知识产权局专利公布公告", url: "http://epub.cnipa.gov.cn", cat: "三、政府开放信息" },
  { name: "国家知识产权局专利检索及分析", url: "https://pss-system.cponline.cnipa.gov.cn", cat: "三、政府开放信息" },
  { name: "美国专利商标局PPUBS", url: "https://www.uspto.gov/patents/search/patent-public-search", cat: "三、政府开放信息" },
  { name: "欧盟专利局Espacenet", url: "https://worldwide.espacenet.com", cat: "三、政府开放信息" },
  { name: "世界知识产权组织Patentscope", url: "https://patentscope.wipo.int", cat: "三、政府开放信息" },
  { name: "地理标志产品检索", url: "https://ggfw.cnipa.gov.cn/dlbzsq/dbQuery", cat: "三、政府开放信息" },
  { name: "国家植物标本资源库/中国数字植物标本馆", url: "https://www.cvh.ac.cn/", cat: "三、政府开放信息" },
  { name: "中国互联网联合辟谣平台", url: "http://www.piyao.org.cn", cat: "三、政府开放信息" },
  { name: "卫健委", url: "http://www.nhc.gov.cn", cat: "三、政府开放信息" },
  { name: "药监局数据查询", url: "https://www.nmpa.gov.cn/datasearch/home-index.html", cat: "三、政府开放信息" },
  { name: "中国教育考试网", url: "https://www.neea.edu.cn", cat: "三、政府开放信息" },
  { name: "中国研究生招生信息网/研招网", url: "https://yz.chsi.com.cn", cat: "三、政府开放信息" },
  { name: "国家大学生就业服务平台", url: "https://www.ncss.cn", cat: "三、政府开放信息" },
  { name: "高校毕业生到国际组织实习任职信息服务平台", url: "https://gj.ncss.cn", cat: "三、政府开放信息" },
  { name: "全国大学生创业服务网", url: "https://cy.ncss.cn", cat: "三、政府开放信息" },
  { name: "中国高等教育学生信息网/学信网", url: "https://www.chsi.com.cn", cat: "三、政府开放信息" },
  { name: "中国证券业协会从业人员查询系统", url: "https://gs.sac.net.cn/pages/registration/new-sac-publicity-org.html", cat: "三、政府开放信息" },
  { name: "中国证券投资基金业协会基金从业人员资格注册信息", url: "https://gs.amac.org.cn/amac-infodisc/res/pof/person/personOrgList.html", cat: "三、政府开放信息" },
  { name: "中国银行业协会银行业专业人员职业资格考试", url: "https://www.china-cba.net/Index/lists/catid/31.html", cat: "三、政府开放信息" },
  { name: "中国注册会计师协会会计师事业所信息查询/注册会计师信息查询", url: "https://cmis.cicpa.org.cn", cat: "三、政府开放信息" },
  { name: "全国律师执业诚信信息公示平台", url: "https://credit.acla.org.cn", cat: "三、政府开放信息" },
  { name: "中国记者网记者信息查询", url: "https://press.nppa.gov.cn/presscard/select/", cat: "三、政府开放信息" },
  { name: "世界银行开放数据", url: "https://data.worldbank.org", cat: "三、政府开放信息" },
  { name: "美国联邦政府数据开放平台", url: "https://www.data.gov", cat: "三、政府开放信息" },
  { name: "四川省统计局", url: "https://tjj.sc.gov.cn/scstjj/c112116/sj.shtml", cat: "三、政府开放信息" },
  { name: "北京市统计局", url: "https://tjj.beijing.gov.cn/tjsj_31433/", cat: "三、政府开放信息" },
  { name: "湖北省统计局", url: "https://tjj.hubei.gov.cn/tjsj/", cat: "三、政府开放信息" },
  { name: "吉林省统计局", url: "https://tjj.jl.gov.cn/tjsj/", cat: "三、政府开放信息" },
  { name: "江苏省统计局", url: "https://tj.jiangsu.gov.cn/index.html", cat: "三、政府开放信息" },
  { name: "中国文艺网/中华文艺资源数据库", url: "https://ku.artnchina.com/page/userCenter/login/login.html", cat: "三、政府开放信息" },
  { name: "中国数字人文", url: "https://www.dhcn.cn/", cat: "三、政府开放信息" },

  // 四、实用学习资源
  { name: "中国大学MOOC", url: "https://www.icourse163.org", cat: "四、实用学习资源" },
  { name: "学堂在线", url: "https://www.xuetangx.com", cat: "四、实用学习资源" },
  { name: "智慧树", url: "https://www.zhihuishu.com", cat: "四、实用学习资源" },
  { name: "学银在线", url: "https://www.xueyinonline.com", cat: "四、实用学习资源" },
  { name: "国家高等教育智慧教育平台", url: "https://higher.smartedu.cn", cat: "四、实用学习资源" },
  { name: "国家职业教育智慧教育平台", url: "https://vocational.smartedu.cn", cat: "四、实用学习资源" },
  { name: "国家终身教育智慧教育平台", url: "https://lifelong.smartedu.cn", cat: "四、实用学习资源" },
  { name: "国家中小学智慧教育平台", url: "https://basic.smartedu.cn", cat: "四、实用学习资源" },
  { name: "国家虚拟仿真实验教学课程共享平台", url: "http://www.ilab-x.com", cat: "四、实用学习资源" },
  { name: "爱课程视频公开课", url: "https://www.icourses.cn/", cat: "四、实用学习资源" },
  { name: "网易公开课", url: "https://open.163.com", cat: "四、实用学习资源" },
  { name: "知网学术大讲堂", url: "https://k.cnki.net/home", cat: "四、实用学习资源" },
  { name: "万方视频", url: "https://video.wanfangdata.com.cn", cat: "四、实用学习资源" },
  { name: "学习强国", url: "https://www.xuexi.cn", cat: "四、实用学习资源" },
  { name: "一席", url: "https://www.yixi.tv", cat: "四、实用学习资源" },
  { name: "TED", url: "https://www.ted.com", cat: "四、实用学习资源" },
  { name: "小红书", url: "https://www.xiaohongshu.com", cat: "四、实用学习资源" },
  { name: "B站", url: "https://www.bilibili.com", cat: "四、实用学习资源" },
  { name: "知乎", url: "https://www.zhihu.com", cat: "四、实用学习资源" },
  { name: "知乎直答", url: "https://zhida.zhihu.com", cat: "四、实用学习资源" },
  { name: "知乎知学堂", url: "https://www.zhihu.com/education/learning", cat: "四、实用学习资源" },
  { name: "HathiTrust", url: "https://www.hathitrust.org", cat: "四、实用学习资源" },
  { name: "剑桥数据库", url: "https://www.cambridge.org/core", cat: "四、实用学习资源" },
  { name: "牛津学术数据库", url: "https://academic.oup.com/books/search-results?", cat: "四、实用学习资源" },
  { name: "NCBI Books", url: "https://www.ncbi.nlm.nih.gov/books", cat: "四、实用学习资源" },
  { name: "国家图书馆", url: "http://www.nlc.cn", cat: "四、实用学习资源" },
  { name: "国家图书馆中华古籍资源库", url: "http://read.nlc.cn/thematDataSearch/toGujiIndex", cat: "四、实用学习资源" },
  { name: "国家图书馆民国时期文献库", url: "http://read.nlc.cn/specialResourse/minguoIndex", cat: "四、实用学习资源" },
  { name: "美国国会图书馆", url: "https://www.loc.gov", cat: "四、实用学习资源" },
  { name: "科学网", url: "https://www.sciencenet.cn/", cat: "四、实用学习资源" },

  // 五、学术信息资源
  { name: "中国知网CNKI", url: "https://www.cnki.net", cat: "五、学术信息资源" },
  { name: "万方", url: "https://www.wanfangdata.com.cn", cat: "五、学术信息资源" },
  { name: "维普", url: "https://www.cqvip.com", cat: "五、学术信息资源" },
  { name: "ScienceDirect", url: "https://www.sciencedirect.com", cat: "五、学术信息资源" },
  { name: "Wiley", url: "https://onlinelibrary.wiley.com", cat: "五、学术信息资源" },
  { name: "Taylor & Francis", url: "https://www.tandfonline.com", cat: "五、学术信息资源" },
  { name: "ACM Digital Library", url: "https://dl.acm.org", cat: "五、学术信息资源" },
  { name: "ASME", url: "https://asmedigitalcollection.asme.org/", cat: "五、学术信息资源" },
  { name: "Nature", url: "https://www.nature.com", cat: "五、学术信息资源" },
  { name: "Cell", url: "https://www.cell.com", cat: "五、学术信息资源" },
  { name: "Science", url: "https://www.science.org", cat: "五、学术信息资源" },
  { name: "PNAS官网", url: "https://www.pnas.org", cat: "五、学术信息资源" },
  { name: "IEEE", url: "https://www.ieee.org", cat: "五、学术信息资源" },
  { name: "Web of Science", url: "https://www.webofscience.com/wos/alldb/basic-search", cat: "五、学术信息资源" },
  { name: "中国知网CNKI中国学术会议网", url: "https://conf.cnki.net", cat: "五、学术信息资源" },
  { name: "国家图书馆博士论文数据库", url: "http://read.nlc.cn/allSearch/searchList?searchType=65&showType=1&pageNo=1", cat: "五、学术信息资源" },
  { name: "MIT Theses", url: "https://dspace.mit.edu/handle/1721.1/7582", cat: "五、学术信息资源" },
  { name: "SciELO", url: "https://www.scielo.org/en/", cat: "五、学术信息资源" },
  { name: "DOAJ", url: "https://doaj.org", cat: "五、学术信息资源" },
  { name: "OALIB", url: "https://www.oalib.com", cat: "五、学术信息资源" },
  { name: "arXiv", url: "https://arxiv.org", cat: "五、学术信息资源" },
  { name: "ChinaXiv", url: "https://www.chinaxiv.org", cat: "五、学术信息资源" },
  { name: "medRxiv", url: "https://www.medrxiv.org", cat: "五、学术信息资源" },
  { name: "goOA", url: "http://gooa.las.ac.cn/paperc/", cat: "五、学术信息资源" },
  { name: "北京大学开放研究数据平台", url: "https://opendata.pku.edu.cn/", cat: "五、学术信息资源" },
  { name: "抗日战争与近代中日关系文献数据平台", url: "https://www.modernhistory.org.cn", cat: "五、学术信息资源" },
  { name: "国家地球系统科学数据中心", url: "https://www.geodata.cn/data/", cat: "五、学术信息资源" },
  { name: "国家哲学社会科学文献中心", url: "https://www.ncpssd.cn", cat: "五、学术信息资源" },
  { name: "国家社科基金项目库", url: "http://fz.people.com.cn/skygb/sk/index.php/index/index/4541", cat: "五、学术信息资源" },
  { name: "国家自然科学基金", url: "https://kd.nsfc.cn/", cat: "五、学术信息资源" },
  { name: "中文古籍联合目录及循证平台", url: "https://gj.library.sh.cn/index", cat: "五、学术信息资源" },

  // 六、信息检索系统
  { name: "百度学术", url: "https://xueshu.baidu.com", cat: "六、信息检索系统" },
  { name: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov", cat: "六、信息检索系统" },
  { name: "PubScholar", url: "https://pubscholar.cn", cat: "六、信息检索系统" },
  { name: "NSTL", url: "https://www.nstl.gov.cn", cat: "六、信息检索系统" },
  { name: "百度图片", url: "https://image.baidu.com", cat: "六、信息检索系统" },
  { name: "搜狗图片搜索", url: "https://pic.sogou.com", cat: "六、信息检索系统" },
  { name: "360图片搜索", url: "https://image.so.com", cat: "六、信息检索系统" },
  { name: "必应视觉搜寻", url: "https://cn.bing.com/visualsearch", cat: "六、信息检索系统" },
  { name: "Unsplash", url: "https://unsplash.com", cat: "六、信息检索系统" },
  { name: "Pixabay", url: "https://pixabay.com", cat: "六、信息检索系统" },
  { name: "iconfont", url: "https://www.iconfont.cn", cat: "六、信息检索系统" },
  { name: "Scidraw", url: "https://scidraw.io", cat: "六、信息检索系统" },
  { name: "SMART", url: "https://smart.servier.com", cat: "六、信息检索系统" },
  { name: "优设导航", url: "https://hao.uisdc.com", cat: "六、信息检索系统" },
  { name: "HIPPTER", url: "http://www.hippter.com", cat: "六、信息检索系统" },
  { name: "中国古典文献资源导航系统", url: "https://www.wenxianxue.cn", cat: "六、信息检索系统" },
  { name: "AI工具集", url: "https://ai-bot.cn", cat: "六、信息检索系统" },
  { name: "百度指数", url: "https://index.baidu.com", cat: "六、信息检索系统" },
  { name: "巨量算数/抖音指数", url: "https://trendinsight.oceanengine.com", cat: "六、信息检索系统" },
  { name: "360趋势", url: "https://trends.so.com", cat: "六、信息检索系统" },

  // 七、信息检索理论与技术
  { name: "中国知网CNKI高级检索", url: "https://kns.cnki.net/kns8s/AdvSearch", cat: "七、信息检索理论与技术" },
  { name: "万方高级检索", url: "https://s.wanfangdata.com.cn/advanced-search/paper", cat: "七、信息检索理论与技术" },
  { name: "维普高级检索", url: "https://www.cqvip.com/advancesearch", cat: "七、信息检索理论与技术" },
  { name: "PubMed高级检索", url: "https://pubmed.ncbi.nlm.nih.gov/advanced", cat: "七、信息检索理论与技术" },
  { name: "ScienceDirect高级检索", url: "https://www.sciencedirect.com/search/entry?origin=home&zone=qSearch", cat: "七、信息检索理论与技术" },

  // 八、知识管理工具
  { name: "百度脑图", url: "https://naotu.baidu.com", cat: "八、知识管理工具" },
  { name: "有道云笔记", url: "https://note.youdao.com", cat: "八、知识管理工具" },
  { name: "问卷星", url: "https://www.wjx.cn", cat: "八、知识管理工具" },
  { name: "小恐龙公文排版", url: "https://gw.xkonglong.com", cat: "八、知识管理工具" },
  { name: "雨课堂", url: "https://www.yuketang.cn", cat: "八、知识管理工具" },
  { name: "OfficeAI助手", url: "https://www.office-ai.cn", cat: "八、知识管理工具" },
  { name: "智谱清言浏览器插件", url: "https://new-front.chatglm.cn/webagent/landing/index.html", cat: "八、知识管理工具" },
  { name: "QQ截图/录屏", url: "https://im.qq.com", cat: "八、知识管理工具" },
  { name: "LICEcap", url: "https://www.cockos.com/licecap", cat: "八、知识管理工具" },
  { name: "万彩办公大师（！！！已暂停所有服务）", url: "http://www.wofficebox.com", cat: "八、知识管理工具" },
  { name: "云展网PDF工具", url: "https://www.yunzhan365.com/tools/pdf-to-word", cat: "八、知识管理工具" },
  { name: "Microsoft Edge扩展商店", url: "https://microsoftedge.microsoft.com/addons", cat: "八、知识管理工具" },
  { name: "360浏览器扩展中心", url: "https://ext.se.360.cn", cat: "八、知识管理工具" },

  // 九、学术写作
  { name: "国家新闻出版署从业机构和产品查询（图书/期刊等）", url: "https://www.nppa.gov.cn/bsfw/cyjghcpcx/", cat: "九、学术写作" },
  { name: "中国科学院文献情报中心期刊分区表（用户名cupetro，密码cup_beijing）", url: "https://www.fenqubiao.com", cat: "九、学术写作" },
  { name: "万方诚信学堂/万方科研诚信服务平台", url: "https://cx.wanfangdata.com.cn/e-training", cat: "九、学术写作" },

  // 十、科研工具
  { name: "Zotero", url: "https://www.zotero.org", cat: "十、科研工具" },
  { name: "Mendeley", url: "https://www.mendeley.com", cat: "十、科研工具" },
  { name: "EndNote", url: "https://endnote.com/downloads/", cat: "十、科研工具" },
  { name: "NoteExpress", url: "https://www.inoteexpress.com", cat: "十、科研工具" },
  { name: "知网研学系统", url: "https://x.cnki.net", cat: "十、科研工具" },
  { name: "ECharts", url: "https://echarts.apache.org", cat: "十、科研工具" },
  { name: "微词云", url: "https://www.weiciyun.com", cat: "十、科研工具" },
  { name: "赛特新思", url: "https://www.citexs.com", cat: "十、科研工具" },
  { name: "CiteSpace", url: "http://cluster.cis.drexel.edu/~cchen/citespace", cat: "十、科研工具" },
  { name: "VOSviewer", url: "https://www.vosviewer.com", cat: "十、科研工具" }
];

const CAT_THEMES = [
  { text: "from-blue-600/20 to-cyan-600/5 hover:border-blue-500/35 border-blue-500/20", title: "bg-blue-600 text-blue-100 border-blue-400" },
  { text: "from-indigo-600/20 to-purple-600/5 hover:border-indigo-500/35 border-indigo-500/20", title: "bg-indigo-600 text-indigo-100 border-indigo-400" },
  { text: "from-emerald-600/20 to-teal-600/5 hover:border-emerald-500/35 border-emerald-500/20", title: "bg-emerald-600 text-emerald-100 border-emerald-400" },
  { text: "from-sky-600/20 to-blue-600/5 hover:border-sky-500/35 border-sky-500/20", title: "bg-sky-600 text-sky-100 border-sky-300" },
  { text: "from-amber-600/20 to-orange-600/5 hover:border-amber-500/35 border-amber-500/20", title: "bg-amber-600 text-amber-100 border-amber-400" },
  { text: "from-pink-600/20 to-rose-600/5 hover:border-pink-500/35 border-pink-500/20", title: "bg-pink-600 text-pink-100 border-pink-400" },
  { text: "from-lime-600/20 to-emerald-600/5 hover:border-lime-500/35 border-lime-500/20", title: "bg-lime-600 text-lime-950/20 border-lime-400" },
  { text: "from-violet-600/20 to-indigo-600/5 hover:border-violet-500/35 border-violet-500/20", title: "bg-violet-600 text-violet-100 border-violet-400" },
  { text: "from-red-650/20 to-rose-600/5 hover:border-red-500/35 border-red-500/20", title: "bg-rose-700 text-rose-100 border-rose-400" },
  { text: "from-cyan-600/20 to-teal-600/5 hover:border-cyan-500/35 border-cyan-500/20", title: "bg-cyan-600 text-cyan-100 border-cyan-400" },
];

export function extractKeywords(sentence: string): string[] {
  if (!sentence) return [];
  
  // 1. Convert to lowercase & clean common punctuation
  let clean = sentence.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'：；‘’“”《》【】、，。？（）]/g, " ")
    .trim();
  
  // 2. Define standard stop words to filter out noise
  const stopWords = new Set([
    "的", "地", "得", "和", "跟", "与", "同", "及", "以及", "或", "或者", "等", "等等",
    "我想", "我想找", "找一下", "找一找", "帮我搜", "搜索", "检索", "查询", "搜一下", "搜", "查", "怎么", "如何",
    "在哪里", "哪里有", "在哪", "有用", "有吗", "有哪些", "平台", "网站", "网址", "官网", "官方网站", "系统",
    "数据库", "工具", "资源", "一些", "符合", "相关", "关于", "查一些", "一句话", "推荐", "一下", "请问", "看看",
    "有没有", "合适的", "查找", "进行", "快速", "极速", "指南", "专题", "学习", "平台", "合规", "地址"
  ]);

  const initialChunks = clean.split(/\s+/);
  const keywords: string[] = [];

  for (const chunk of initialChunks) {
    if (!chunk) continue;
    
    // Pure English or numbers
    if (/^[a-zA-Z0-9\-\.]+$/.test(chunk)) {
      if (!stopWords.has(chunk) && chunk.length > 1) {
        keywords.push(chunk);
      }
      continue;
    }
    
    // Check search databases shortcuts/terms directly to prioritize accurate hits
    const keyDatabases = [
      "高校信息素养", "信息素养", "北京市大学生", "大学", "高校", "素养", 
      "豆包", "智谱", "智谱清言", "通义千问", "通义万相", "讯飞星火", "讯飞", "星火", "绘文", "智文", 
      "文心一言", "文心", "腾讯元宝", "元宝", "扣子", "coze", "元器", "秘塔", "aminer", "网易天音", "天音", 
      "deepseek", "kimi", "纳米", "可灵", "蝉镜", "闪剪", "ima", "海螺", "人民智文", "开发社区", "开发者",
      "阿里", "腾讯", "百度", "华为", "深度学习", "深圳大学", "北京师范大学", "四川大学", "济南大学", 
      "江南大学", "武汉大学", "中国人民大学", "安徽工程大学", "清华大学", "上海外国语大学", "香港中文大学", 
      "联合国", "教科文", "国务院", "政策", "讲话", "习近平", "共产党员", "课程思政", "统计局", "数据", 
      "科技资源", "科学数据", "科技报告", "法律法规", "行政法规", "规章", "民事", "刑事", "案例库", 
      "最高法院", "公报", "执行信息", "庭审", "裁判文书", "文书", "标准全文", "标准", "安全标准", 
      "环境标准", "工程建设", "商标", "商标局", "专利公布", "专利检索", "专利", "uspto", "espacenet", 
      "patentscope", "wipo", "地理标志", "植物标本", "辟谣", "卫健委", "药监局", "教育考试", "考讯", 
      "研招网", "研究生", "学信网", "毕业生", "就业", "国际组织", "创业", "证券业", "基金业", "银行业", 
      "职业资格", "注册会计师", "律师", "律师执业", "诚信", "记者网", "记者", "世界银行", "美国联邦", 
      "统计局", "统计", "文艺网", "文艺", "数字人文", "大学mooc", "mooc", "慕课", "学堂在线", "智慧树", 
      "学银", "智慧教育", "虚拟仿真", "视频公开课", "公开课", "网易公开课", "大讲堂", "万方视频", "视频", 
      "学习强国", "一席", "ted", "小红书", "b站", "bilibili", "知乎", "知乎直答", "hathitrust", "剑桥", 
      "牛津", "ncbi", "国家图书馆", "古籍", "民国时期", "文献库", "国会图书馆", "科学网", "中国知网", 
      "知网", "cnki", "万方", "维普", "sciencedirect", "wiley", "taylor", "francis", "acm", "asme", 
      "nature", "cell", "science", "pnas", "ieee", "论文", "会议网", "硕士", "博士", "theses", "mit", 
      "scielo", "doaj", "oalib", "arxiv", "chinaxiv", "medrxiv", "gooa", "开放研究", "抗日战争", 
      "地球系统", "哲学社会科学", "社科基金", "自然科学基金", "古籍联合", "pubmed", "pubscholar", 
      "nstl", "图片", "视觉搜寻", "unsplash", "pixabay", "iconfont", "scidraw", "smart", "优设", 
      "hippter", "古典文献", "ai工具", "指数", "抖音指数", "巨量算数", "脑图", "有道云笔记", "问卷星", 
      "公文排版", "雨课堂", "officeai", "截图", "录屏", "licecap", "pdf", "edge", "浏览器", "分区表", 
      "中科院", "诚信学堂", "zotero", "mendeley", "endnote", "noteexpress", "研学", "echarts", "微词云", 
      "赛特新思", "citespace", "vosviewer"
    ];

    let foundAnyDbKey = false;
    for (const key of keyDatabases) {
      if (chunk.includes(key)) {
        keywords.push(key);
        foundAnyDbKey = true;
      }
    }

    if (!foundAnyDbKey) {
      let charAcc = "";
      for (let i = 0; i < chunk.length; i++) {
        const char = chunk[i];
        if (!stopWords.has(char)) {
          charAcc += char;
        } else {
          if (charAcc.length >= 2) {
            keywords.push(charAcc);
          }
          charAcc = "";
        }
      }
      if (charAcc.length >= 2) {
        keywords.push(charAcc);
      }
    }
  }

  return Array.from(new Set(keywords)).filter(kw => kw.trim().length > 0);
}

export function scoreLink(link: LinkItem, extractedKws: string[]): number {
  if (extractedKws.length === 0) return 0;
  
  let maxScore = 0;
  for (const kw of extractedKws) {
    const s = findFuzzyScore(link, kw);
    if (s > maxScore) {
      maxScore = s;
    }
  }
  return maxScore;
}

export interface OfficialWhitelistProps {
  onSelectLink?: (link: LinkItem) => void;
  isInModal?: boolean;
  initialSearchKw?: string;
}

export default function OfficialWhitelist({
  onSelectLink,
  isInModal = false,
  initialSearchKw = "",
}: OfficialWhitelistProps = {}) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchKw, setSearchKw] = useState(initialSearchKw);

  useEffect(() => {
    setSearchKw(initialSearchKw);
  }, [initialSearchKw]);
  
  // Modals
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isEditUrlOpen, setIsEditUrlOpen] = useState(false);
  const [isEngineChoiceOpen, setIsEngineChoiceOpen] = useState(false);
  
  // Modal Fields
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkCat, setNewLinkCat] = useState(DEFAULT_CATEGORIES[0]);
  
  const [targetItem, setTargetItem] = useState<{ index: number; cat: string } | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedUrl, setEditedUrl] = useState("");
  
  // Load initially
  useEffect(() => {
    const saved = localStorage.getItem("suYangFinalV6_react");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.links) setLinks(parsed.links);
        if (parsed.files) setFiles(parsed.files);
      } catch (e) {
        setLinks(DEFAULT_LINKS);
        setFiles([]);
      }
    } else {
      setLinks(DEFAULT_LINKS);
      setFiles([]);
    }
  }, []);

  // Save to localStorage helper
  const saveState = (updatedLinks: LinkItem[], updatedFiles: FileItem[]) => {
    localStorage.setItem(
      "suYangFinalV6_react",
      JSON.stringify({ links: updatedLinks, files: updatedFiles })
    );
  };

  const handleReset = () => {
    if (window.confirm("⚠️ 您确定要重置所有数据吗？这会将您的自定义网址和文件清空，并重新恢复成官方最新的完整网址库。")) {
      setLinks(DEFAULT_LINKS);
      setFiles([]);
      saveState(DEFAULT_LINKS, []);
    }
  };

  const handleAddLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) {
      alert("请完整填写网站名称和网址格式！");
      return;
    }
    let formattedUrl = newLinkUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      alert("网址必须包含 https:// 或 http:// 协议头！");
      return;
    }
    const updatedLinks = [...links, { name: newLinkName.trim(), url: formattedUrl, cat: newLinkCat }];
    setLinks(updatedLinks);
    saveState(updatedLinks, files);
    
    // reset fields
    setNewLinkName("");
    setNewLinkUrl("");
    setIsAddOpen(false);
  };

  const handleFileUploadClick = () => {
    const fileSelector = document.createElement("input");
    fileSelector.type = "file";
    fileSelector.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (files.some(f => f.name === file.name)) {
        alert("此文件名已上传，不可重复导入！");
        return;
      }
      const updatedFiles = [...files, { name: file.name }];
      setFiles(updatedFiles);
      saveState(links, updatedFiles);
    };
    fileSelector.click();
  };

  const handleDeleteFile = (idx: number) => {
    if (window.confirm("确定删除选中的本地文件资料吗？")) {
      const updatedFiles = [...files];
      updatedFiles.splice(idx, 1);
      setFiles(updatedFiles);
      saveState(links, updatedFiles);
    }
  };

  const handleDeleteLink = (linkToDelete: LinkItem) => {
    if (window.confirm(`确定删除网站“${linkToDelete.name}”吗？`)) {
      const updatedLinks = links.filter(
        l => !(l.name === linkToDelete.name && l.url === linkToDelete.url && l.cat === linkToDelete.cat)
      );
      setLinks(updatedLinks);
      saveState(updatedLinks, files);
    }
  };

  const triggerEditName = (linkToEdit: LinkItem) => {
    // Find absolute index in full array of this link item
    const idxInLinks = links.findIndex(
      l => l.name === linkToEdit.name && l.url === linkToEdit.url && l.cat === linkToEdit.cat
    );
    if (idxInLinks !== -1) {
      setTargetItem({ index: idxInLinks, cat: linkToEdit.cat });
      setEditedName(linkToEdit.name);
      setIsEditNameOpen(true);
    }
  };

  const saveEditedName = () => {
    if (!editedName.trim()) {
      alert("请输入有效的网站名称！");
      return;
    }
    if (targetItem) {
      const updatedLinks = [...links];
      updatedLinks[targetItem.index].name = editedName.trim();
      setLinks(updatedLinks);
      saveState(updatedLinks, files);
      setIsEditNameOpen(false);
      setTargetItem(null);
    }
  };

  const triggerEditUrl = (linkToEdit: LinkItem) => {
    const idxInLinks = links.findIndex(
      l => l.name === linkToEdit.name && l.url === linkToEdit.url && l.cat === linkToEdit.cat
    );
    if (idxInLinks !== -1) {
      setTargetItem({ index: idxInLinks, cat: linkToEdit.cat });
      setEditedUrl(linkToEdit.url);
      setIsEditUrlOpen(true);
    }
  };

  const saveEditedUrl = () => {
    let formattedUrl = editedUrl.trim();
    if (!formattedUrl) {
      alert("请输入有效的网址链接！");
      return;
    }
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      alert("网址必须包含 https:// 或 http:// 协议头！");
      return;
    }
    if (targetItem) {
      const updatedLinks = [...links];
      updatedLinks[targetItem.index].url = formattedUrl;
      setLinks(updatedLinks);
      saveState(updatedLinks, files);
      setIsEditUrlOpen(false);
      setTargetItem(null);
    }
  };

  // Perform Redirect Search
  const doRedirectSearch = (engine: "baidu" | "bing", kw: string) => {
    if (!kw.trim()) return;
    const url = engine === "baidu" 
      ? `https://www.baidu.com/s?wd=${encodeURIComponent(kw.trim())}` 
      : `https://cn.bing.com/search?q=${encodeURIComponent(kw.trim())}`;
    window.open(url, "_blank");
  };

  // Key Down Listener: support Enter triggers
  const handleKwKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const activeKw = searchKw.trim();
      if (!activeKw) return;
      
      // Perform local lookup counts
      const kwLower = activeKw.toLowerCase();
      const kws = extractKeywords(kwLower);
      const hasLinks = kws.length > 0 
        ? links.some(l => scoreLink(l, kws) > 0)
        : links.some(l => l.name.toLowerCase().includes(kwLower) || l.url.toLowerCase().includes(kwLower));
      const hasFiles = kws.length > 0
        ? files.some(f => kws.some(kw => f.name.toLowerCase().includes(kw)))
        : files.some(f => f.name.toLowerCase().includes(kwLower));
      
      // Automatically prompt redirect chooser if there is no local result!
      if (!hasLinks && !hasFiles) {
        setIsEngineChoiceOpen(true);
      }
    }
  };

  // Optimized state recalculations via useMemo
  const memoizedKeywords = useMemo(() => {
    const kwLower = searchKw.trim().toLowerCase();
    if (!kwLower) return [];
    return extractKeywords(kwLower);
  }, [searchKw]);

  const processedLinks = useMemo(() => {
    const kwLower = searchKw.trim().toLowerCase();
    if (!kwLower) return links;

    const kws = memoizedKeywords;
    if (kws.length === 0) {
      return links.filter(l => l.name.toLowerCase().includes(kwLower) || l.url.toLowerCase().includes(kwLower));
    }

    return links
      .map(item => ({ item, score: scoreLink(item, kws) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);
  }, [links, searchKw, memoizedKeywords]);

  const processedFiles = useMemo(() => {
    const kwLower = searchKw.trim().toLowerCase();
    if (!kwLower) return files;

    const kws = memoizedKeywords;
    if (kws.length === 0) {
      return files.filter(f => f.name.toLowerCase().includes(kwLower));
    }

    return files
      .map(f => {
        let score = 0;
        const nameLower = f.name.toLowerCase();
        for (const kw of kws) {
          if (nameLower.includes(kw)) {
            score += 10;
          }
        }
        return { item: f, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);
  }, [files, searchKw, memoizedKeywords]);

  const filteredLinksByCat = (catName: string) => {
    return processedLinks.filter(l => l.cat === catName);
  };

  const filteredFiles = () => {
    return processedFiles;
  };

  // Check state to see if anything matches across the entire Whitelist
  const kwTrimmed = searchKw.trim();
  const totalLocalMatches = useMemo(() => {
    if (!kwTrimmed) return 0;
    return processedLinks.length + processedFiles.length;
  }, [processedLinks, processedFiles, kwTrimmed]);

  const showNoResultBox = kwTrimmed !== "" && totalLocalMatches === 0;

  // Let's decide if this query has domestic official website keywords to give an intelligent suggestion
  const isDomesticOfficialPredict = () => {
    const kwLower = searchKw.toLowerCase();
    const domesticKeywords = ["知网", "cnki", "万方", "维普", "国家", "官方", "政府", "规章", "法律", "规范", "标准", "专利", "商标", "统计局", "法院", "案例", "大学生", "高校", "教育", "网站"];
    return domesticKeywords.some(dk => kwLower.includes(dk));
  };

  // Get top matches across all categories to show in a dedicated quick recommendations panel at the top!
  const intelligentRecommendations = useMemo(() => {
    const kwLower = searchKw.trim().toLowerCase();
    if (!kwLower || memoizedKeywords.length === 0) return [];

    return links
      .map(item => ({ item, score: scoreLink(item, memoizedKeywords) }))
      .filter(x => x.score >= 10) // Must match at least one keyword cleanly in name/url
      .sort((a, b) => b.score - a.score)
      .slice(0, isInModal ? 12 : 4)
      .map(x => x.item);
  }, [links, searchKw, memoizedKeywords, isInModal]);

  if (isInModal) {
    return (
      <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
        {/* Simple refine search bar */}
        <div className="relative shrink-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchKw}
            onChange={(e) => setSearchKw(e.target.value)}
            onKeyDown={handleKwKeyDown}
            placeholder="输入您的匹配词、简写拼音或一段需求句... (如：高考/知网/北京统计局)"
            className="w-full bg-[#05070a]/80 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-xs text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
          />
          {searchKw && (
            <button 
              onClick={() => setSearchKw("")} 
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Intelligent Search Warning Redirection Panel */}
        <AnimatePresence>
          {showNoResultBox && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 shadow-lg"
            >
              <div className="flex-1 flex gap-3 text-amber-200">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold font-mono">
                    🔍 未匹配到本地官方网址 “<span className="text-white underline font-black">{kwTrimmed}</span>”
                  </p>
                  <p className="text-[10px] text-amber-200/70 font-mono">
                    {isDomesticOfficialPredict() ? (
                      <span className="text-emerald-400 font-black">建议跳转国内官方知网等百度检索</span>
                    ) : (
                      <span>建议直接通过必应或百度继续查找</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0 font-mono self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => doRedirectSearch("baidu", kwTrimmed)}
                  className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-[10px] hover:bg-amber-400 transition-all cursor-pointer"
                >
                  百度
                </button>
                <button
                  type="button"
                  onClick={() => doRedirectSearch("bing", kwTrimmed)}
                  className="px-4 py-1.5 bg-cyan-600 border border-cyan-500 text-white font-bold rounded-lg text-[10px] hover:bg-cyan-500 transition-all cursor-pointer"
                >
                  必应
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Intelligent suggestions */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 min-h-0 pr-1">
          {intelligentRecommendations.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-cyan-400 tracking-widest flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-750"></span>
                  </span>
                  💡 智能提取匹配推荐 (Smart Whitelist Matches)
                </h4>
                <span className="text-[10px] font-mono text-cyan-500/80 uppercase tracking-widest hidden sm:inline">
                  自动解析一句话输入，提取匹配到 {intelligentRecommendations.length} 门对应平台
                </span>
              </div>
              <motion.div 
                layout="position"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <AnimatePresence mode="popLayout">
                  {intelligentRecommendations.map((item, idx) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      whileHover={{ 
                        scale: 1.015, 
                        borderColor: "rgba(6, 182, 212, 0.45)", 
                        backgroundColor: "rgba(6, 182, 212, 0.05)",
                        boxShadow: "0 4px 16px rgba(6, 182, 212, 0.12)"
                      }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ duration: 0.15 }}
                      key={`modal-intel-rec-${idx}`}
                      className="p-4 bg-cyan-950/20 hover:bg-cyan-950/30 rounded-xl border border-cyan-500/15 cursor-pointer flex flex-col justify-between h-24 shadow-sm"
                      onClick={() => {
                        if (onSelectLink) {
                          onSelectLink(item);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2">
                          {item.name}
                        </span>
                        <ExternalLink size={11} className="text-cyan-400 mt-0.5 shrink-0" />
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
                        <span className="text-[9px] text-slate-500 truncate max-w-[140px] font-mono">
                          {item.url}
                        </span>
                        <span className="text-[9px] font-mono font-black bg-cyan-950/60 px-1.5 py-0.5 rounded text-cyan-400 shrink-0">
                          {item.cat.split('、')[1] || item.cat}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          ) : (
            searchKw.trim() === "" ? (
              // Warm guiding view
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 border border-dashed border-white/5 bg-black/10 rounded-2xl gap-2">
                <Globe size={32} className="opacity-30 mb-1 animate-bounce text-cyan-400" />
                <p className="text-xs font-mono font-bold text-slate-400">请输入您想查找的网站（拼音、缩写均高度秒级匹配）</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-md px-6">
                  {["知网", "万方", "最高法院公报", "PubMed", "arXiv", "百度学术"].map(pop => (
                    <button
                      key={pop}
                      type="button"
                      onClick={() => setSearchKw(pop)}
                      className="text-[10px] font-mono px-3 py-1 rounded-full bg-cyan-950/20 border border-cyan-500/10 text-cyan-400 hover:bg-cyan-950/50 hover:border-cyan-500/30 transition-all cursor-pointer"
                    >
                      +{pop}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-white/5 bg-black/10 rounded-2xl gap-2">
                <Globe size={32} className="opacity-30 mb-1 animate-pulse" />
                <p className="text-xs font-mono font-bold text-slate-400 mb-0.5">未检索到高精度的智能匹配推荐</p>
                <p className="text-[10px] text-slate-500">您可以尝试缩短中文词，或者拼音缩写（例如：【zgzw】检索【中国知网】）</p>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-0">
      
      {/* Top Search & Actions Bar */}
      <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0 shadow-lg">
        {/* Search Engine Look */}
        <div className="flex-1 w-full relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchKw}
            onChange={(e) => setSearchKw(e.target.value)}
            onKeyDown={handleKwKeyDown}
            placeholder="在官方网址与本地文献中极速检索... (若没有对应匹配，按 Enter 回车键可一键扩展搜索必应/百度)"
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
          />
          {searchKw && (
            <button 
              onClick={() => setSearchKw("")} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Curation Buttons */}
        <div className="flex gap-2 w-full sm:w-auto shrink-0 flex-wrap justify-end">
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-500/30 text-cyan-400 font-bold rounded-xl text-xs tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus size={14} /> 添加自定义网站
          </button>
          
          <button
            onClick={handleFileUploadClick}
            className="px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Paperclip size={14} /> 上传本地文件
          </button>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all uppercase tracking-wider title='使用说明'"
          >
            <HelpCircle size={16} />
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/55 rounded-xl text-red-400 transition-all uppercase tracking-wider title='恢复默认白名单'"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Intelligent Search Warning Redirection Panel */}
      <AnimatePresence>
        {showNoResultBox && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 shadow-lg"
          >
            <div className="flex-1 flex gap-3 text-amber-200">
              <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5 md:mt-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold font-mono">
                  🔍 没有找到与 “<span className="text-white underline font-black">{kwTrimmed}</span>” 相对应匹配的白名单链接或本地文件
                </p>
                <p className="text-[10px] text-amber-200/70 font-mono flex items-center gap-1">
                  <Info size={11} className="text-amber-400" />
                  {isDomesticOfficialPredict() ? (
                    <span className="text-emerald-400 font-black">建议使用「百度学术/网页搜索」：系统自动判别该关键词为国内机构/官方主页领域，百度对此具备绝佳准确性。</span>
                  ) : (
                    <span>推荐方案：国内官方网站，优先使用百度查询；针对国际学术、外文期刊或海外专利库词汇，优先使用必应检索。</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto shrink-0 font-mono">
              <button
                onClick={() => doRedirectSearch("baidu", kwTrimmed)}
                className="flex-1 md:flex-initial px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              >
                百度查询 (Baidu)
              </button>
              <button
                onClick={() => doRedirectSearch("bing", kwTrimmed)}
                className="flex-1 md:flex-initial px-5 py-2 bg-cyan-600 border border-cyan-500 text-white font-bold rounded-xl text-xs hover:bg-cyan-500 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              >
                必应查询 (Bing)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intelligent Search Recommendations Pane */}
      <AnimatePresence>
        {searchKw.trim() && intelligentRecommendations.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-[#0b0f19]/80 backdrop-blur-md border border-cyan-500/25 rounded-2xl p-4 flex flex-col gap-3 shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.08)]"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h4 className="text-xs font-black uppercase text-cyan-400 tracking-widest flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-700"></span>
                </span>
                💡 智能提取匹配推荐 (Smart Whitelist Matches)
              </h4>
              <span className="text-[10px] font-mono text-cyan-500/80 uppercase tracking-widest hidden sm:inline">
                自动解析您输入的一句话并过滤无关词，锁定以下最匹配平台：
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {intelligentRecommendations.map((item, idx) => (
                <a
                  key={`intel-rec-${idx}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (onSelectLink) {
                      e.preventDefault();
                      onSelectLink(item);
                    }
                  }}
                  className="p-3 bg-cyan-950/20 hover:bg-cyan-950/40 rounded-xl border border-cyan-500/15 hover:border-cyan-500/40 transition-all group flex flex-col justify-between h-20 shadow-sm"
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {item.name}
                    </span>
                    <ExternalLink size={10} className="text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
                    <span className="text-[9px] text-slate-500 truncate max-w-[120px] font-mono group-hover:text-slate-400">
                      {item.url}
                    </span>
                    <span className="text-[9px] font-mono font-black bg-cyan-950/60 px-1.5 py-0.5 rounded text-cyan-400 text-right shrink-0">
                      {item.cat.split('、')[1] || item.cat}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dual-Column Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
        
        {/* Left Column: Grid or Categorized Whitelist links list */}
        <div className="flex-1 overflow-y-auto p-1 custom-scrollbar min-h-0">
          <motion.div 
            layout="position"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {DEFAULT_CATEGORIES.map((cat, idx) => {
                const theme = CAT_THEMES[idx] || CAT_THEMES[0];
                const listInCat = filteredLinksByCat(cat);
                
                if (searchKw.trim() !== "" && listInCat.length === 0) {
                  return null; // Skip rendering categories that have no results inside them on active filters
                }

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -15 }}
                    transition={{ type: "spring", stiffness: 220, damping: 24 }}
                    key={cat} 
                    className={`bg-gradient-to-br ${theme.text} rounded-2xl border p-5 flex flex-col gap-4 group transition-all duration-300 shadow-md hover:shadow-cyan-950/20`}
                  >
                    {/* Category Title Header */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-lg border border-white/10 ${theme.title}`}>
                        {cat}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">{listInCat.length} links</span>
                    </div>

                    {/* Links container */}
                    <div className="flex-1 flex flex-col gap-2">
                      {listInCat.length === 0 ? (
                        <p className="text-xs text-slate-600 italic py-2">无网站数据</p>
                      ) : (
                        <AnimatePresence mode="popLayout">
                          {listInCat.map((item) => (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 8 }}
                              whileHover={{ 
                                scale: 1.015, 
                                x: 4,
                                backgroundColor: "rgba(255, 255, 255, 0.04)",
                                borderColor: "rgba(6, 182, 212, 0.3)",
                                boxShadow: "0 4px 12px rgba(6, 182, 212, 0.08)"
                              }}
                              whileTap={{ scale: 0.99 }}
                              transition={{ duration: 0.18 }}
                              key={item.name + item.url} 
                              className="flex items-center justify-between bg-black/30 border border-white/5 rounded-xl px-3 py-2.5 group/item relative overflow-hidden"
                            >
                              <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  if (onSelectLink) {
                                    e.preventDefault();
                                    onSelectLink(item);
                                  }
                                }}
                                className="text-xs text-slate-200 hover:text-cyan-400 font-bold font-mono transition-colors flex-1 pr-6 flex items-center gap-1.5 truncate"
                              >
                                <span className="truncate">{item.name}</span>
                                <ExternalLink size={10} className="text-slate-600 group-hover/item:text-cyan-400 transition-colors shrink-0" />
                              </a>

                              {/* Float hovering actions block - perfect cursor + touch screen curation accessibility */}
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-slate-900 border border-white/15 rounded-lg p-0.5 shadow-xl opacity-0 group-hover/item:opacity-100 transition-opacity z-10">
                                <button
                                  onClick={() => triggerEditName(item)}
                                  className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded transition-all"
                                  title="修改名称"
                                >
                                  <Edit3 size={11} />
                                </button>
                                <button
                                  onClick={() => triggerEditUrl(item)}
                                  className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded transition-all"
                                  title="修改网址"
                                >
                                  <Globe size={11} />
                                </button>
                                <button
                                  onClick={() => handleDeleteLink(item)}
                                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                                  title="删除网址"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Column: Files listing Panel */}
        <aside className="w-full lg:w-80 shrink-0 bg-slate-900/40 rounded-2xl border border-white/5 p-5 flex flex-col overflow-hidden shadow-2xl relative">
          <div className="pb-4 border-b border-white/5 mb-4 flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">📁 本地上传文件</h3>
              <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Local Document Vault</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 bg-cyan-950/30 border border-cyan-500/20 rounded">
              {filteredFiles().length} files
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
            {filteredFiles().length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 opacity-30 text-slate-500 border border-dashed border-white/5 rounded-xl bg-black/10">
                <FileText size={32} className="mb-2" />
                <p className="text-xs font-bold tracking-widest text-center px-4 leading-relaxed">
                  暂无配套文件<br />可点击顶部“上传本地文件”添加
                </p>
              </div>
            ) : (
              <motion.div layout="position" className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {filteredFiles().map((item, idx) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      whileHover={{ 
                        scale: 1.02, 
                        borderColor: "rgba(6, 182, 212, 0.35)", 
                        backgroundColor: "rgba(0,0,0,0.45)",
                        boxShadow: "0 4px 12px rgba(6, 182, 212, 0.05)"
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      key={item.name + idx}
                      className="p-3 bg-black/30 border border-white/5 rounded-xl transition-all group/file relative"
                    >
                      <div className="flex items-start gap-2.5">
                        <FileText size={16} className="text-cyan-500 mt-0.5 shrink-0" />
                        <div className="flex-1 overflow-hidden">
                          <p 
                            onClick={() => {
                              try {
                                window.open('./' + encodeURIComponent(item.name), '_blank');
                              } catch (err) {
                                alert('文件打开失败，请确保该文件和当前网页在同个文件夹下。');
                              }
                            }}
                            className="text-xs font-mono font-medium text-slate-200 group-hover/file:text-cyan-300 transition-colors break-words line-clamp-2 cursor-pointer pr-5"
                            title="点击直接打开 (确保同个目录下)"
                          >
                            {item.name}
                          </p>
                        </div>
                      </div>

                      {/* Curation button */}
                      <button
                        onClick={() => handleDeleteFile(idx)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-red-400 rounded hover:bg-red-500/10 transition-all opacity-0 group-hover/file:opacity-100"
                        title="移除文件记录"
                      >
                        <Trash2 size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          <div className="pt-3 border-t border-white/5 text-[9px] text-slate-500 font-mono tracking-tight leading-relaxed">
            💡 提示：本地添加的文件与本工具 HTML 文件处于同一路径文件夹下时，点击即可直接在浏览器新标签页中秒开预览。
          </div>
        </aside>

      </div>

      {/* ======================================================== */}
      {/* Modals Suite (Add link, edit name, edit url, instructs, engine select) */}
      {/* ======================================================== */}
      <AnimatePresence>
        
        {/* Modal: Add Link */}
        {isAddOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 font-sans"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 flex flex-col gap-4 relative"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="font-bold text-white text-sm tracking-widest flex items-center gap-1.5 uppercase">
                  <Plus size={16} className="text-cyan-400" />
                  添加自定义网站 Link
                </h4>
                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black block mb-1">网站名称 Location Name</label>
                  <input
                    type="text"
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    placeholder="如：国家法律规章数据库"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-cyan-100 placeholder:text-slate-600 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black block mb-1">网页网址 Endpoint URL</label>
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-cyan-100 placeholder:text-slate-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black block mb-1">所属分类 Category Pillar</label>
                  <select
                    value={newLinkCat}
                    onChange={(e) => setNewLinkCat(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-cyan-100 focus:outline-none"
                  >
                    {DEFAULT_CATEGORIES.map(c => (
                      <option key={c} value={c} className="bg-slate-950 text-slate-200">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg text-[10px] uppercase font-bold text-slate-400 hover:text-white bg-white/5 transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={handleAddLink}
                  className="px-4 py-2 rounded-lg text-[10px] uppercase font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md"
                >
                  保存添加
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal: Edit Link Name */}
        {isEditNameOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 font-sans"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 flex flex-col gap-4 relative"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="font-bold text-white text-sm tracking-widest flex items-center gap-1.5 uppercase">
                  <Edit3 size={16} className="text-cyan-400" />
                  修改网站名称 Edit Title
                </h4>
                <button onClick={() => { setIsEditNameOpen(false); setTargetItem(null); }} className="text-slate-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-black block mb-1">新网站名称 Description</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-cyan-100 placeholder:text-slate-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => { setIsEditNameOpen(false); setTargetItem(null); }}
                  className="px-4 py-2 rounded-lg text-[10px] uppercase font-bold text-slate-400 hover:text-white bg-white/5 transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={saveEditedName}
                  className="px-4 py-2 rounded-lg text-[10px] uppercase font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
                >
                  确定修改
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal: Edit Link URL */}
        {isEditUrlOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 font-sans"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 flex flex-col gap-4 relative"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="font-bold text-white text-sm tracking-widest flex items-center gap-1.5 uppercase">
                  <Globe size={16} className="text-cyan-400" />
                  修改网页网址 Edit URL
                </h4>
                <button onClick={() => { setIsEditUrlOpen(false); setTargetItem(null); }} className="text-slate-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-black block mb-1">新链接端点 Endpoint URL</label>
                <input
                  type="text"
                  value={editedUrl}
                  onChange={(e) => setEditedUrl(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-cyan-100 placeholder:text-slate-600 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => { setIsEditUrlOpen(false); setTargetItem(null); }}
                  className="px-4 py-2 rounded-lg text-[10px] uppercase font-bold text-slate-400 hover:text-white bg-white/5 transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={saveEditedUrl}
                  className="px-4 py-2 rounded-lg text-[10px] uppercase font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
                >
                  确定修改
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal: Interactive Instructions */}
        {isHelpOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 font-sans"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 flex flex-col gap-4 relative"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="font-bold text-white text-sm tracking-widest flex items-center gap-1.5 uppercase">
                  <HelpCircle size={16} className="text-cyan-400" />
                  📖 使用指南 (Whitelist Manual)
                </h4>
                <button onClick={() => setIsHelpOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                <div className="space-y-1">
                  <h5 className="font-bold text-cyan-400 font-mono">1. 免大模型查询机制</h5>
                  <p className="opacity-80">
                    本页面是一个本地高速缓冲的网址白名单库，对您的检索过滤不产生任何大模型 Token 消耗。检索完全在浏览器本地进行运算，获取绝对精度和极致的速度。
                  </p>
                </div>

                <div className="space-y-1">
                  <h5 className="font-bold text-cyan-400 font-mono">2. 一键跳转推荐搜索引擎</h5>
                  <p className="opacity-80">
                    当您查找学术资源、标准、政策，而白名单库无可匹配历史记录时，只需在搜索栏直接按<strong>回车键 (Enter)</strong>，即会弹出选择菜单，跳转外部引擎进行极速查找。国内官方推荐百度，国际文献及专利等推荐必应。
                  </p>
                </div>

                <div className="space-y-1">
                  <h5 className="font-bold text-cyan-400 font-mono">3. 本地自定维护、删除与修改</h5>
                  <p className="opacity-80">
                    将鼠标指针指向具体的网页卡片网址上，系统将浮现修改与删除悬浮条。您可以自由编辑该网站的名称、网址，或者直接从本地数据库注销该链接。点击右上角“恢复默认”能回滚至最初完整内容。
                  </p>
                </div>

                <div className="space-y-1">
                  <h5 className="font-bold text-cyan-400 font-mono">4. 本地文件加载原理</h5>
                  <p className="opacity-80">
                    上传文件仅保存在您本机的浏览器清单里。如果将本工具生成的静态网页 HTML 和您需要配套打开的本地 pdf、txt、doc 或图片等放在<strong>同一个文件夹</strong>目录下，点击该文件名即可通过本地路径直接打开无损阅读。
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-white/5">
                <button 
                  onClick={() => setIsHelpOpen(false)}
                  className="px-5 py-2 rounded-lg text-[10px] uppercase font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md"
                >
                  我已知晓 (Understood)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal: Keyboard Enter Trigger Search Choice Overlay */}
        {isEngineChoiceOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[200] flex items-center justify-center p-4 font-sans"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl p-6 flex flex-col gap-5 text-center relative"
            >
              <div className="space-y-2">
                <h4 className="font-bold text-white text-base flex justify-center items-center gap-1.5">
                  🔍 扩展搜索引擎 
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  没有在本地库中匹配到与 “<span className="text-cyan-400 font-black">{searchKw}</span>” 相关的官方路线，请选择搜索引擎进一步查找：
                </p>
                {isDomesticOfficialPredict() && (
                  <p className="text-[10px] text-emerald-400 bg-emerald-950/40 p-2 border border-emerald-500/20 rounded-lg animate-pulse">
                    💡 系统判断该关键词偏国内官方事务或政法，强烈推荐点击【百度搜索】！
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 font-mono">
                <button
                  onClick={() => { doRedirectSearch("baidu", searchKw); setIsEngineChoiceOpen(false); }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md"
                >
                  百度搜索 (Baidu.com)
                </button>
                <button
                  onClick={() => { doRedirectSearch("bing", searchKw); setIsEngineChoiceOpen(false); }}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl text-xs transition-all border border-cyan-500/40 shadow-md"
                >
                  必应搜索 (Bing.com)
                </button>
              </div>

              <button 
                onClick={() => setIsEngineChoiceOpen(false)}
                className="text-[10px] uppercase font-bold text-slate-500 hover:text-white transition-colors"
              >
                取消 (Cancel)
              </button>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}

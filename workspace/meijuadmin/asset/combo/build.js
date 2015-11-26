({
    baseUrl: "../module",
    paths: {
        text: "../combo/text", //由于分居两个目录，因此路径都需要处理一下
        css: "../combo/css",
        "css-builder": "../combo/css-builder",
        "normalize": "../combo/normalize",
        domReady: "../combo/domReady",
        jquery : "lib/jquery/jquery-1.11.3"
    },
    optimize : 'none',
    name: "business/homemanage/homelist",  //如果从哪一个文件开始合并
    out: "../module/business/homemanage/homelist-built.js" //确定要生成的文件路径及名字
})

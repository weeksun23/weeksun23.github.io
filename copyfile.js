var fs = require('fs'),
    stat = fs.stat;

/*
 * 复制目录中的所有文件包括子目录
 * @param{ String } 需要复制的目录
 * @param{ String } 复制到指定的目录
 */
function copy(src, dst) {
    // 读取目录中的所有文件/目录
    fs.readdir(src, function(err, paths) {
        if (err) {
            throw err;
        }
        paths.forEach(function(path) {
            var _src = src + '/' + path,
                _dst = dst + '/' + path,
                readable, writable;
            stat(_src, function(err, st) {
                if (err) {
                    throw err;
                }
                // 判断是否为文件
                if (st.isFile()) {
                    // 创建读取流
                    readable = fs.createReadStream(_src);
                    // 创建写入流
                    writable = fs.createWriteStream(_dst);
                    // 通过管道来传输流
                    readable.pipe(writable);
                }
                // 如果是目录则递归调用自身
                else if (st.isDirectory()) {
					exists(_src, _dst,copy);
                }
            });
        });
    });
}
// 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
function exists( src, dst, callback ){
    fs.exists( dst, function( exists ){
        // 已存在
        if( exists ){
            callback( src, dst );
        }
        // 不存在
        else{
            fs.mkdir( dst, function(){
                callback( src, dst );
            });
        }
    });
};
//删除文件夹
function deleteFolderRecursive(path) {
    if( fs.existsSync(path) ) {
        var files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}
function beforeCopy(src,dst){
	if(typeof src == 'string'){
		src = [src];
	}
	if(typeof dst == 'string'){
		dst = [dst];
	}
	src.forEach(function(src,i){
		var dstItem = dst[i];
		deleteFolderRecursive(dstItem);
		fs.mkdirSync(dstItem);
		copy(src,dstItem);
	});
}
beforeCopy(["../Configure/src","../Configure/demo"],
["./Configure/src","./Configure/demo"]);
/*
//先删除文件夹
deleteFolderRecursive("../weeksun23.github.io/Configure");
//创建目录
mkdirs("../weeksun23.github.io/Configure/demo");
mkdirs("../weeksun23.github.io/Configure/src");
//复制
copy('../Configure/src',"../weeksun23.github.io/Configure/src");
copy('../Configure/demo',"../weeksun23.github.io/Configure/demo");
*/
/*创建多级目录 ../a/b/c/d
function mkdirs(path){
	var arr = path.split("/");
	arr.forEach(function(str){
		if(str.charAt(0) !== '.'){
			var subPath = path.substring(0,path.indexOf(str) + str.length);
			if(!fs.existsSync(subPath)){
				fs.mkdirSync(subPath);
			}
		}
	});
}*/
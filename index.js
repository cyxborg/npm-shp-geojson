var fs = require('fs');
var unzip = require('unzip');
var cp = require('child_process');
var del = require('del');

var myFun = {};
myFun.exec = function(shpPath, destDir) {
  if (!shpPath) {
    return;
  }
  var param = {
    "src" : shpPath, 
    "tmp" : "tmp",
    "destDir" : "dest"
  };
  if (destDir) {
    param.destDir = destDir;
  }
  
  Promise.resolve().then(function () {
    // shpファイルが込められたzipが存在するか
    return new Promise(function (resolve, reject) {
      fs.access(param.src, fs.constants.W_OK, function (err) {
        if (err) {
          reject(new Error(param.src + "にアクセスできない"));
        }
        resolve();
      });
    });
  }).then(function() {
    // shpファイルが込められたzipをtmpディレクトリに解凍
    return new Promise(function(resolve, reject) {
      fs.createReadStream(param.src)
        .pipe(unzip.Extract({path: param.tmp}))
        .on('error', function(){
          reject(new Error(param.src + "がunzipできない"));
        })
        .on('close', function () {
          resolve();
        });
    });
  }).then(function () {
    // tmpディレクトリからshpファイルを探す
    return new Promise(function(resolve, reject) {
      fs.readdir(param.tmp, function(err, files){
        if (err) {
          reject(new Error(param.tmp + "が読めない"));
        }
        files.filter(function(file) {
          if (/.*\.shp$/.test(param.tmp + "/" + file)) {
            resolve(param.tmp + "/" + file);
          }
        });
        reject(new Error(param.tmp + "/にshpファイルがない"));
      });
    });
  }).then(function (result) {
    return new Promise(function(resolve, reject) {
      fs.mkdir(param.destDir, function (err) {
        resolve(result);
      });
    })
  }).then(function (result) {
    return new Promise(function(resolve, reject) {
      try {
        dest = result.replace("shp", "json").replace("tmp/", param.destDir + "/");
        del([dest]).then(paths => {
          resolve({shp : result, out : dest});
        });
      } catch(e) {
        reject(new Error(e));
      }
    })
  }).then(function (result) {
    // ogr2ogrコマンドでshpファイルをgeojsonに変換
    return new Promise(function(resolve, reject) {
      // ogr2ogr -lco 'ENCODING=Shift-JIS' -f geoJSON {output.json} {input.shp}
      options = ['-lco', 'ENCODING=Shift-JIS', '-f', 'geoJSON', result.out, result.shp]
      proc = cp.spawn('ogr2ogr', options);
      proc.on('error', function (err) {
        console.log("error : ", err)
      });
      proc.stdout.setEncoding('utf-8');
      proc.stdout.on('data', (data) => {
        console.log("stdout : ", data.toString());
      });
      proc.stderr.setEncoding('utf-8');
      proc.stderr.on('data', function (data) {
        console.log("stderr : ", data.toString());
      });
      proc.on('exit', function (code) {
        if (0 == code) {
          resolve(result);
        } else {
          reject(new Error("geojsonへの変換失敗"));
        }      
      });
    });
  }).then(function (result) {
    // tmpディレクトリ削除
    return new Promise(function(resolve, reject) {
      del([param.tmp]).then(paths => {
        //console.log('\nDeleted folders:\n', paths.join('\n'));
        resolve(result);
      });
    });
  }).then(function (result) {
    console.log("success\n" + param.src + " -> " + result.shp + " -> " + result.out);
  }).catch(function (error) {
    console.log(error);
  });
  
}
module.exports = myFun;
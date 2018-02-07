## h

ogr2ogrを使うので brew install gdal しておく

## install

```
yarn add npm-shp-geojson --dev
```

## use

```
var nsg = require('npm-shp-geojson');
// arg1 : shpファイルが入ってるzip 
nsg.exec("N03-170101_09_GML.zip")
// > dest配下にgeojsonファイルが生成される

// arg1 : shpファイルが入ってるzip, arg2 : geojsonファイルの生成先 
nsg.exec("N03-170101_09_GML.zip", "mydest")
// > mydest配下にgeojsonファイルが生成される
```
//模仿ysc大佬 link:https://www.wellyyss.cn/ 所写，所有功能函数写在了一起
(function (window, undefined) {
    var wutian = {
        initEarth: initEarth, //初始化地球
        coordinate: coordinate, //坐标  
        load3dTile: load3dTile, //加载3dtile
        sectionAnalysis: sectionAnalysis, //剖面分析
        viewedAnalysis: viewedAnalysis, //可视域分析
        showDynamicLayer: showDynamicLayer //动态弹窗
    };
    var viewer; //设置为全局变量
    var tileset; //资产
    var terrainProvider; //地形
    /**
     * 初始化地图
     */
    function initEarth(container, data) {
        //地图开发者密匙
        var defaultAccessToken =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNTQ0MDNjZi0xMDUwLTQxMzQtYjUyMi1mY2Q3MGYyZDc0Y2IiLCJpZCI6MTEzODQsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NTg3NzAyNjl9.vTFyYjYe2oHh2uzaGNx4iA_vcbnbNGC-yfn5uXT5098';
        if (data.defaultAccessToken && data.defaultAccessToken != '') {
            defaultAccessToken = data.defaultAccessToken;
        }
        Cesium.Ion.defaultAccessToken = defaultAccessToken;
        //参数初始化
        var args = ["geocoder", "homeButton", "sceneModePicker", "baseLayerPicker", "navigationHelpButton", "infoBox", "selectionIndicator"];
        for (var i = 0; i < args.length; ++i)
            if (!data[args[i]])
                data[args[i]] = false;

        //创建viewer
        viewer = new Cesium.Viewer(container, data);
        //取消双击事件
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        //选择光照
        if (data.globeLight && data.globeLight == true)
            viewer.scene.globe.enableLighting = true;
        //大气效果
        if (data.showGroundAtmosphere && data.showGroundAtmosphere == true)
            viewer.scene.globe.showGroundAtmosphere = true;
        //天地图影像
        if (data.globalImagery && data.globalImagery == "天地图") {
            viewer.imageryLayers.remove(viewer.imageryLayers.get(0)); //可以先清除默认的第一个影像 bing地图影像。 当然不作处理也行
            var url = "http://t0.tianditu.com/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles" + "&tk=" + data.defaultKey;
            img = viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
                url: url,
                layer: "tdtBasicLayer",
                style: "default",
                format: "image/jpeg",
                maximumLevel: 18, //天地图的最大缩放级别
                tileMatrixSetID: "GoogleMapsCompatible",
                show: false
            }));
        }
        //谷歌影像
        else if (data.globalImagery && data.globalImagery == "谷歌") {
            viewer.imageryLayers.remove(viewer.imageryLayers.get(0)); //可以先清除默认的第一个影像 bing地图影像。 当然不作处理也行
            img = viewer.imageryLayers.addImageryProvider(
                new Cesium.UrlTemplateImageryProvider({
                    url: "http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}&s=Gali",
                    baseLayerPicker: false
                })
            );
        }
        //arcGis影像
        else if (data.globalImagery && data.globalImagery == "arcGis") {
            viewer.imageryLayers.remove(viewer.imageryLayers.get(0)); //可以先清除默认的第一个影像 bing地图影像。 当然不作处理也行
            img = viewer.imageryLayers.addImageryProvider(
                new Cesium.ArcGisMapServerImageryProvider({
                    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
                    baseLayerPicker: false
                })
            );
        }
        //高德影像
        else if (data.globalImagery && data.globalImagery == "高德") {
            viewer.imageryLayers.remove(viewer.imageryLayers.get(0)); //可以先清除默认的第一个影像 bing地图影像。 当然不作处理也行
            img = viewer.imageryLayers.addImageryProvider(
                new Cesium.UrlTemplateImageryProvider({
                    maximumLevel: 18, //最大缩放级别
                    url: 'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
                    style: "default",
                    format: "image/png",
                    tileMatrixSetID: "GoogleMapsCompatible"

                })
            );
        }
        //百度影像
        else if (data.globalImagery && data.globalImagery == "百度") {
            viewer.imageryLayers.remove(viewer.imageryLayers.get(0)); //可以先清除默认的第一个影像 bing地图影像。 当然不作处理也行
            img = viewer.imageryLayers.addImageryProvider(
                new Cesium.UrlTemplateImageryProvider({
                    maximumLevel: 18, //最大缩放级别
                    url: "https://ss1.bdstatic.com/8bo_dTSlR1gBo1vgoIiO_jowehsv/tile/?qt=vtile&x={x}&y={y}&z={z}&styles=pl&udt=20180810&scaler=1&showtext=1",
                })
            );
        }

        //天地图标注
        if (data.globalLabel && data.globalLabel == "天地图") {
            var url = "http://t0.tianditu.com/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default.jpg" + "&tk=" + data.defaultKey;
            label = viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
                url: url,
                layer: "tdtAnnoLayer",
                style: "default",
                maximumLevel: 18, //天地图的最大缩放级别
                format: "image/jpeg",
                tileMatrixSetID: "GoogleMapsCompatible",
                show: false
            }));
        }
        //高德标注
        else if (data.globalLabel && data.globalLabel == "高德") {
            label = viewer.imageryLayers.addImageryProvider(
                new Cesium.UrlTemplateImageryProvider({
                    maximumLevel: 18, //最大缩放级别
                    url: 'https://wprd02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=2&style=8&ltype=11',
                    style: "default",
                    format: "image/png",
                    tileMatrixSetID: "GoogleMapsCompatible"
                })
            );
        }
        //影像亮度
        if (data.globalImageryBrightness != undefined) {
            img.brightness = data.globalImageryBrightness;
        }
        if (data.globalLabelBrightness != undefined) {
            label.brightness = data.globalLabelBrightness
        }
        //深度检测
        viewer.scene.globe.depthTestAgainstTerrain = true;
        //设置地形
        terrainProvider = Cesium.createWorldTerrain({
            requestVertexNormals: true,
            requestWaterMask: true
        })
        //设置hometown初始位置
        var extend = Cesium.Rectangle.fromDegrees(113.275, 35.410, 113.444, 35.485);
        Cesium.Camera.DEFAULT_VIEW_RECTANGLE = extend;
        Cesium.Camera.DEFAULT_VIEW_FACTOR = 0

        viewer.terrainProvider = terrainProvider;
        return viewer;
    }

    /** 
     * 显示坐标位置
     */
    function coordinate() {
        //坐标显示
        var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
        handler.setInputAction(function (movement) {
            //通过指定的椭球或者地图对应的坐标系，将鼠标的二维坐标转换为对应椭球体三维坐标
            var ellipsoid = viewer.scene.globe.ellipsoid;
            var cartesian = viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
            if (cartesian) {
                //将笛卡尔坐标转换为地理坐标
                var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                //将弧度转为度的十进制度表示
                longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(3);
                latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(3);
                //获取相机高度
                height = Math.ceil(viewer.camera.positionCartographic.height).toFixed(3);
                $('#mousePosition').text('移动：(' + longitudeString + ',  ' + latitudeString + ",  " + height + ')');
            } else {
                $('#mousePosition').text('');
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    /**
     * 加载3dtiles
     */
    function load3dTile() {
        viewer.scene.globe.depthTestAgainstTerrain = true;
        viewer.scene.globe.showGroundAtmosphere = true;
        var tileset = viewer.scene.primitives.add(
            new Cesium.Cesium3DTileset({
                // url: Cesium.IonResource.fromAssetId(52216)  //测试模型
                //url: Cesium.IonResource.fromAssetId(58614)
                url: Cesium.IonResource.fromAssetId(58629) //摄影测量模型
            })
        );
        tileset.readyPromise.then(function () {
            var boundingSphere = tileset.boundingSphere;
            viewer.camera.flyToBoundingSphere(boundingSphere);
        }).otherwise(function (error) {
            throw (error);
        });
    }

    /**
     * 剖面分析
     */
    function sectionAnalysis() {
        //全局变量
        var dom = document.getElementById('mainChart'); // 绘图对象 // 绘图对象
        var myChart = null;
        var start = null;
        var end = null;
        //画点
        function drawPoint(position) {
            viewer.entities.add({
                position: position,
                point: {
                    size: 10,
                    color: Cesium.Color.GREEN
                }
            })
        }
        //画线
        function drawLine() {
            viewer.entities.add({
                polyline: {
                    positions: new Cesium.CallbackProperty(function () {
                        return [start, end]
                    }),
                    material: Cesium.Color.RED,
                    clampToGround: true,
                    classificationType: Cesium.ClassificationType.BOTH
                }
            })
        }
        //开始绘制
        function beginDraw() {
            // 重置
            $('#mainChart').hide();
            viewer.entities.removeAll();
            start = null;
            end = null;
            viewer.screenSpaceEventHandler.setInputAction(function (clickEvent) {
                if (start == null) {
                    start = viewer.scene.pickPosition(clickEvent.position);
                    drawPoint(start);
                    viewer.screenSpaceEventHandler.setInputAction(function (moveEvent) {
                        end = viewer.scene.pickPosition(moveEvent.endPosition);
                        drawLine();
                    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                } else {
                    end = viewer.scene.pickPosition(clickEvent.position);
                    drawPoint(end);
                    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
                    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                    profileAnalyse();
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }

        //高度分析
        function profileAnalyse() {
            var positions = [Cesium.Cartographic.fromCartesian(start)];
            // 插值100个点，点越多模拟越精确，但是效率会低
            var count = 100;
            for (var i = 1; i < count; i++) {
                var cart = Cesium.Cartesian3.lerp(start, end, i / count, new Cesium.Cartesian3());
                positions.push(Cesium.Cartographic.fromCartesian(cart));
            }
            positions.push(Cesium.Cartographic.fromCartesian(end));

            // 异步使用最精确的地形采样获取地形高度
            var promise = Cesium.sampleTerrainMostDetailed(terrainProvider, positions);
            Cesium.when(promise, function (updatedPositions) {

                // 处理返回的数据
                var height = [];
                for (var i = 0; i < updatedPositions.length; i++) {
                    height.push(updatedPositions[i].height); // 取得高程值
                }

                // 绘制高程走势图
                dom.style.display = "block";

                // 使用Echart等图表工具可视化
                if (myChart == null) {
                    myChart = echarts.init(dom);
                    initChart(height, false);
                } else {
                    initChart(height, true);
                }

            });
        }
        //初始化图表
        function initChart(height, isMerge) {
            var option = {
                title: {
                    text: '海拔走势图'
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross',
                        label: {
                            backgroundColor: '#6a7985'
                        }
                    }
                },
                legend: {
                    data: ['海拔走势图']
                },
                toolbox: {
                    feature: {
                        saveAsImage: {}
                    }
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: [{
                    type: 'category',
                    boundaryGap: false
                }],
                yAxis: [{
                    type: 'value'
                }],
                series: [{
                    name: '海拔走势图',
                    type: 'line',
                    stack: '总量',
                    label: {
                        normal: {
                            show: true,
                            position: 'top'
                        }
                    },
                    areaStyle: {
                        normal: {}
                    },
                    data: height
                }]
            };
            myChart.setOption(option, isMerge);
        }
        beginDraw();
    }

    /**
     * 可视域分析
     */
    function viewedAnalysis() {
        console.log(1);
        //添加inspector面板，显示坐标轴
        viewer.extend(Cesium.viewerCesiumInspectorMixin);
    }
    /**
     * 创建一个动态实体弹窗
     */
    function showDynamicLayer(data, callback) {
        var element = data.element,
            lon = data.lon,
            lat = data.lat;
        var sStartFlog = false;
        setTimeout(function () {
            sStartFlog = true;
        }, 300);
        var s1 = 0.001,
            s2 = s1,
            s3 = s1,
            s4 = s1;
        /* 弹窗的dom操作--默认必须*/
        element.css({
            opacity: 0
        }); //使用hide()或者display是不行的 因为cesium是用pre定时重绘的div导致 left top display 会一直重绘
        $(".ysc-dynamic-layer .line").css({
            width: 0
        });
        element.find(".main").hide(0);
        /* 弹窗的dom操作--针对性操作*/
        callback();

        if (data.addEntity) {
            var rotation = Cesium.Math.toRadians(30);
            var rotation2 = Cesium.Math.toRadians(30);

            function getRotationValue() {
                rotation += 0.05;
                return rotation;
            }

            function getRotationValue2() {
                rotation2 -= 0.03;
                return rotation2;
            }
            //如果有实体存在 先清除实体;
            //如果有实体存在 先清除实体;
            viewer.entities.removeById(data.layerId + "_1");
            viewer.entities.removeById(data.layerId + "_2");
            viewer.entities.removeById(data.layerId + "_3");
            //构建entity
            var height = data.boxHeight,
                heightMax = data.boxHeightMax,
                heightDif = data.boxHeightDif;
            var goflog = true;
            //添加正方体
            viewer.entities.add({
                id: data.layerId + "_1",
                name: "立方体盒子",
                position: new Cesium.CallbackProperty(function () {
                    height = height + heightDif;
                    if (height >= heightMax) {
                        height = heightMax;
                    }
                    return Cesium.Cartesian3.fromDegrees(lon, lat, height / 2)
                }, false),
                box: {
                    dimensions: new Cesium.CallbackProperty(function () {
                        height = height + heightDif;
                        if (height >= heightMax) {
                            height = heightMax;
                            if (goflog) { //需要增加判断 不然它会一直执行; 导致对div的dom操作 会一直重复
                                addLayer(); //添加div弹窗
                                goflog = false;
                            }
                        }
                        return new Cesium.Cartesian3(data.boxSide, data.boxSide, height)
                    }, false),
                    material: data.boxMaterial
                }
            });
            //添加底座一 外环
            viewer.entities.add({
                id: data.layerId + "_2",
                name: "椭圆",
                position: Cesium.Cartesian3.fromDegrees(lon, lat),
                ellipse: {
                    // semiMinorAxis :data.circleSize, //直接这个大小 会有一个闪白的材质 因为cesium材质默认是白色 所以我们先将大小设置为0
                    // semiMajorAxis : data.circleSize,
                    semiMinorAxis: new Cesium.CallbackProperty(function () {
                        if (sStartFlog) {
                            s1 = s1 + data.circleSize / 20;
                            if (s1 >= data.circleSize) {
                                s1 = data.circleSize;
                            }
                        }
                        return s1;
                    }, false),
                    semiMajorAxis: new Cesium.CallbackProperty(function () {
                        if (sStartFlog) {
                            s2 = s2 + data.circleSize / 20;
                            if (s2 >= data.circleSize) {
                                s2 = data.circleSize;
                            }
                        }
                        return s2;
                    }, false),
                    material: "../plugins/ysc/images/circle2.png",
                    rotation: new Cesium.CallbackProperty(getRotationValue, false),
                    stRotation: new Cesium.CallbackProperty(getRotationValue, false),
                    zIndex: 2,
                }
            });
            //添加底座二 内环
            viewer.entities.add({
                id: data.layerId + "_3",
                name: "椭圆",
                position: Cesium.Cartesian3.fromDegrees(lon, lat),
                ellipse: {
                    semiMinorAxis: new Cesium.CallbackProperty(function () {
                        if (sStartFlog) {
                            s3 = s3 + data.circleSize / 20;
                            if (s3 >= data.circleSize / 2) {
                                s3 = data.circleSize / 2;
                            }
                        }
                        return s3;
                    }, false),
                    semiMajorAxis: new Cesium.CallbackProperty(function () {
                        if (sStartFlog) {
                            s4 = s4 + data.circleSize / 20;
                            if (s4 >= data.circleSize / 2) {
                                s4 = data.circleSize / 2;
                            }
                        }
                        return s4;
                    }, false),
                    material: "../plugins/ysc/images/circle1.png",
                    rotation: new Cesium.CallbackProperty(getRotationValue2, false),
                    stRotation: new Cesium.CallbackProperty(getRotationValue2, false),
                    zIndex: 3
                }
            });
        } else {
            addLayer(); //添加div弹窗
        }

        function addLayer() {
            //添加div
            var divPosition = Cesium.Cartesian3.fromDegrees(lon, lat, data.boxHeightMax); //data.boxHeightMax为undef也没事
            element.css({
                opacity: 1
            });
            element.find(".line").animate({
                width: 50 //线的宽度
            }, 500, function () {
                element.find(".main").fadeIn(500)
            });
            ysc.creatHtmlElement(viewer, element, divPosition, [10, -(parseInt(element.css("height")))], true); //当为true的时候，表示当element在地球背面会自动隐藏。默认为false，置为false，不会这样。但至少减轻判断计算压力
        }
    }

    window.wutian = wutian; //设置为系统变量
    window.viewer = viewer;
})(window);
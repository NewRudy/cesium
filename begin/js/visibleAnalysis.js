//地图场景
var scene = viewer.scene;
//地形
//设置地形
var terrainProvider = Cesium.createWorldTerrain({
    requestVertexNormals: true,
    requestWaterMask: true
})
// 开启地形深度监测
viewer.scene.globe.depthTestAgainstTerrain = true;
// entity集合
var parentEntity = viewer.entities.add(new Cesium.Entity());
// 视域点集合
var viewPoints = [];
// 目标点集合
var destPoints = [];
// 世界坐标转换为投影坐标
var webMercatorProjection = new Cesium.WebMercatorProjection(viewer.scene.globe.ellipsoid);
//handler句柄
var handler;
//通视分析
var iLength = 0; //已经读取的视域点
var jLength = 0; //已经读取的目标点

//添加视域点
function addVPoint1() {
    if (handler)
        handler.destroy();
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (e) {
        var position = scene.pickPosition(e.position);
        //将笛卡尔坐标转化为经纬度坐标
        var cartographic = Cesium.Cartographic.fromCartesian(position);
        var longitude = Cesium.Math.toDegrees(cartographic.longitude);
        var latitude = Cesium.Math.toDegrees(cartographic.latitude);
        var height = Math.ceil(viewer.camera.positionCartographic.height);
        var toPoint = new Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
        //toPoint = webMercatorProjection.unproject(toPoint);       //转为投影坐标，但是没有用
        viewPoints.push(toPoint);
        viewer.entities.add({ //添加实体
            parent: parentEntity,
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
            name: 'vpoint',
            ellipsoid: {
                radii: new Cesium.Cartesian3(50, 50, 50),
                material: Cesium.Color.GREEN
            }
        });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //单击鼠标右键结束画点
    handler.setInputAction(function (movement) {
        handler.destroy();
        alert('已结束此功能');
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}
/**
 * 通视分析
 */
//添加目标点
function addGPoint1() {
    if (handler)
        handler.destroy();
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (e) {
        var position = scene.pickPosition(e.position);
        //将笛卡尔坐标转化为经纬度坐标
        var cartographic = Cesium.Cartographic.fromCartesian(position);
        var longitude = Cesium.Math.toDegrees(cartographic.longitude);
        var latitude = Cesium.Math.toDegrees(cartographic.latitude);
        var height = Math.ceil(viewer.camera.positionCartographic.height);
        var toPoint = new Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
        //toPoint = webMercatorProjection.unproject(toPoint);
        destPoints.push(toPoint);

        viewer.entities.add({
            parent: parentEntity,
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
            name: 'vpoint',
            ellipsoid: {
                radii: new Cesium.Cartesian3(50, 50, 50),
                material: Cesium.Color.RED
            }
        });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //单击鼠标右键结束画点
    handler.setInputAction(function (movement) {
        handler.destroy();
        alert('已结束此功能');
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}
//移动点（移动在平面上）
function movePoint() {
    var MoveEntity = (
        function () {
            var leftDownFlag = false;
            var pointDraged = null;
            var viewer;

            function ConstructMoveEntity(options) {
                viewer = options.viewer;
                handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
                Init();
            }

            function Init() {
                // 选择实体
                handler.setInputAction(function (movement) {
                    pointDraged = viewer.scene.pick(movement.position); //选取当前的entity 
                    leftDownFlag = true;
                    if (pointDraged) {
                        viewer.scene.screenSpaceCameraController.enableRotate = false; //不锁定相机
                    }
                }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

                // 得到实体
                handler.setInputAction(function () {
                    leftDownFlag = false;
                    pointDraged = null;
                    viewer.scene.screenSpaceCameraController.enableInputs = true;
                }, Cesium.ScreenSpaceEventType.LEFT_UP);
                // 更新
                handler.setInputAction(function (movement) {
                    if (leftDownFlag === true && pointDraged != null) {
                        let ray = viewer.camera.getPickRay(movement.endPosition);
                        let cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                        //更新目标点队列
                        destPoints.pop();
                        destPoints.push(cartesian);
                        
                        pointDraged.id.position = new Cesium.CallbackProperty(function () {
                            return cartesian;
                        }, false); //防止闪烁，在移动的过程
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                //单击鼠标右键结束
                handler.setInputAction(function () {
                    handler.destroy();
                    alert('已结束此功能');
                }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
            }
            return ConstructMoveEntity;
        }
    )();
    var moveTool = MoveEntity({
        'viewer': viewer
    });
}
//通视分析
function visibleAnalysis() {
    pickFromRay();
    // 绘制线
    function drawLine(leftPoint, secPoint, color) {
        name: 'line';
        viewer.entities.add({
            polyline: {
                positions: [leftPoint, secPoint],
                width: 1,
                material: color,
                depthFailMaterial: color
            }
        })
    }

    function readyForDraw(i, j) {
        // 计算射线的方向，目标点left 视域点right
        var direction = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(destPoints[j],
            viewPoints[i],
            new Cesium.Cartesian3()), new Cesium.Cartesian3());
        // 建立射线
        var ray = new Cesium.Ray(viewPoints[i], direction);
        var result = viewer.scene.globe.pick(ray, viewer.scene); // 计算交互点，返回第一个
        showIntersection(result, destPoints[j], viewPoints[i]);
    }

    function pickFromRay() {
        var i = iLength;
        var j = jLength;
        if (i == viewPoints.length && j == destPoints.length) {
            return;
        } else if (i == 0 && j == 0) {
            for (; i < viewPoints.length; ++i) { //第一次画线
                for (; j < destPoints.length; ++j)
                    readyForDraw(i, j);
            }
        } else if (i == viewPoints.length && j < destPoints.length) { //重新添加目标点
            for (; j < destPoints.length; ++j)
                for (var i = 0; i < viewPoints.length; ++i)
                    readyForDraw(i, j);
        } else if (i < viewPoints.length && j == destPoints.length) { //重新添加视域点
            for (; i < viewPoints.length; ++i)
                for (var j = 0; j < destPoints.length; ++j)
                    readyForDraw(i, j);
        }
        iLength = i;
        jLength = j;
    }

    // 处理交互点
    function showIntersection(result, destPoint, viewPoint) {
        // 如果是场景模型的交互点，排除交互点是地球表面
        if ((result !== undefined) && (result !== null)) {
            drawLine(result, viewPoint, Cesium.Color.GREEN); // 可视区域
            drawLine(result, destPoint, Cesium.Color.RED); // 不可视区域
        } else {
            drawLine(viewPoint, destPoint, Cesium.Color.GREEN);
        }
    }
}
$('#add_vpoint').click(function () {
    scene.screenSpaceCameraController.enableRotate = true;
    scene.screenSpaceCameraController.enableTranslate = true;
    scene.screenSpaceCameraController.enableZoom = true;
    scene.screenSpaceCameraController.enableTilt = true;
    scene.screenSpaceCameraController.enableLook = true;
    alert('绘制视域点，右键结束!');
    addVPoint1();
})
$('#add_gpoint').click(function () {
    scene.screenSpaceCameraController.enableRotate = true;
    scene.screenSpaceCameraController.enableTranslate = true;
    scene.screenSpaceCameraController.enableZoom = true;
    scene.screenSpaceCameraController.enableTilt = true;
    scene.screenSpaceCameraController.enableLook = true;
    alert('绘制目标点，右键结束!');
    addGPoint1();
})
$('#move_entity').click(function () {
    scene.screenSpaceCameraController.enableRotate = true;
    scene.screenSpaceCameraController.enableTranslate = true;
    scene.screenSpaceCameraController.enableZoom = true;
    scene.screenSpaceCameraController.enableTilt = true;
    scene.screenSpaceCameraController.enableLook = true;
    alert('移动实体开始，右键结束!');
    movePoint();
})
$('#visible_analysis').click(function () {
    scene.screenSpaceCameraController.enableRotate = true;
    scene.screenSpaceCameraController.enableTranslate = true;
    scene.screenSpaceCameraController.enableZoom = true;
    scene.screenSpaceCameraController.enableTilt = true;
    scene.screenSpaceCameraController.enableLook = true;
    try {
        visibleAnalysis();
    } catch (error) {
        alert(error);
    }
})
$('#entity_reset').click(function () {
    scene.screenSpaceCameraController.enableRotate = true;
    scene.screenSpaceCameraController.enableTranslate = true;
    scene.screenSpaceCameraController.enableZoom = true;
    scene.screenSpaceCameraController.enableTilt = true;
    scene.screenSpaceCameraController.enableLook = true;
    viewPoints = [];
    destPoints = [];
    iLength = 0;
    jLength = 0;
    viewer.entities.removeAll();
    if (handler)
        handler.destroy();
    alert('已重置');
})
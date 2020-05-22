var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) {
        Object.defineProperty(cooked, "raw", {
            value: raw
        });
    } else {
        cooked.raw = raw;
    }
    return cooked;
};
var glsl = function (x) {
    return x.toString();
};
var ViewShed = /** @class */ (function () {
    //传参
    function ViewShed(options) {
        this.visualRange = options.visualRange;
        this.enabled = true;
        this.softShadows = false;
        this.viewer = options.viewer;
        this.viewPosition = options.viewPosition;
        this.direction = options.direction % 360;
        this.pitch = options.pitch;
        this.horizontalViewAngle = options.horizontalViewAngle || 90;
        this.verticalViewAngle = options.verticalViewAngle || 60;
        this.visibleAreaColor = options.visibleAreaColor || Cesium.Color.GREEN;
        this.invisibleAreaColor = options.invisibleAreaColor || Cesium.Color.RED;
        this.visualRange = options.visualRange || 100;
        this.updateViewShed();
    }
    ViewShed.prototype.addVisualPyramid = function () {
        var innerRange = this.visualRange * 0.001;
        var halfClock = this.horizontalViewAngle / 2;
        var halfCone = this.verticalViewAngle / 2;
        var pyramidEntity = new Cesium.Entity({
            position: this.viewPosition
        });
        this.pyramid = this.viewer.entities.add(pyramidEntity);
    };
    ViewShed.prototype.createLightCamera = function () {
        this.lightCamera = new Cesium.Camera(this.viewer.scene);
        this.lightCamera.position = this.viewPosition;
    };
    ViewShed.prototype.createShadowMap = function () {
        this.shadowMap = new Cesium.ShadowMap({
            context: this.viewer.scene.context,
            lightCamera: this.lightCamera,
            enabled: this.enabled,
            isPointLight: true, //点光源
            pointLightRadius: this.visualRange,
            cascadesEnabled: false,
            size: this.size,
            softShadows: this.softShadows,
            normalOffset: false,
            fromLightSource: false
        });
        this.viewer.scene.shadowMap = this.shadowMap;
    };
    ViewShed.prototype.updateViewShed = function () {
        this.clear();
        this.addVisualPyramid();
        this.createLightCamera();
        this.setCameraParams();
        this.createShadowMap();
        this.createPostStage(); //更改源码，得到可视域和不可使域
        this.drawViewCentrum();
    };
    ViewShed.prototype.drawViewCentrum = function () {
        var scratchRight = new Cesium.Cartesian3();
        var scratchRotation = new Cesium.Matrix3();
        var scratchOrientation = new Cesium.Quaternion();
        var position = this.lightCamera.positionWC;
        var direction = this.lightCamera.directionWC;
        var up = this.lightCamera.upWC;
        var right = this.lightCamera.rightWC;
        right = Cesium.Cartesian3.negate(right, scratchRight);
        var rotation = scratchRotation;
        Cesium.Matrix3.setColumn(rotation, 0, right, rotation);
        Cesium.Matrix3.setColumn(rotation, 1, up, rotation);
        Cesium.Matrix3.setColumn(rotation, 2, direction, rotation);
        var orientation = Cesium.Quaternion.fromRotationMatrix(rotation, scratchOrientation);
        var instanceOutline = new Cesium.GeometryInstance({
            geometry: new Cesium.FrustumOutlineGeometry({
                frustum: this.lightCamera.frustum,
                origin: this.viewPosition,
                orientation: orientation
            }),
            id: "zlyi" +
                Math.random()
                .toString(36)
                .substr(2),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(0.0, 1.0, 0.0, 1.0)),
                show: new Cesium.ShowGeometryInstanceAttribute(true)
            }
        });
        this.newPrimitive = this.viewer.scene.primitives.add(new Cesium.Primitive({
            geometryInstances: instanceOutline,
            appearance: new Cesium.PerInstanceColorAppearance()
        }));
    };
    ViewShed.prototype.setCameraParams = function () {
        this.lightCamera.frustum.near = 0.001 * this.visualRange;
        this.lightCamera.frustum.far = this.visualRange;
        var hr = Cesium.Math.toRadians(this.horizontalViewAngle);
        var vr = Cesium.Math.toRadians(this.verticalViewAngle);
        var aspectRatio = (this.visualRange * Math.tan(hr / 2) * 2) /
            (this.visualRange * Math.tan(vr / 2) * 2);
        this.lightCamera.frustum.aspectRatio = aspectRatio;
        if (hr > vr) {
            this.lightCamera.frustum.fov = hr;
        } else {
            this.lightCamera.frustum.fov = vr;
        }
        this.lightCamera.setView({
            destination: this.viewPosition,
            orientation: {
                heading: Cesium.Math.toRadians(this.direction || 0),
                pitch: Cesium.Math.toRadians(this.pitch || 0),
                roll: 0
            }
        });
    };
    ViewShed.prototype.clear = function () {
        if (this.pyramid) {
            this.viewer.entities.removeById(this.pyramid.id);
            this.pyramid = null;
        }
        if (this.cameraPrimitive) {
            this.cameraPrimitive.destroy();
            this.cameraPrimitive = null;
        }
        if (this.postStage) {
            this.viewer.scene.postProcessStages.remove(this.postStage);
            this.postStage = null;
        }
        if (this.newPrimitive) {
            this.newPrimitive.destroy();
            this.cameraPrimitive = null;
        }
    };
    ViewShed.prototype.setDirection = function (direction) {
        this.direction = direction % 360;
        this.updateViewShed();
    };
    ViewShed.prototype.setPitch = function (pitch) {
        this.pitch = pitch;
        this.updateViewShed();
    };
    ViewShed.prototype.setVisualRange = function (visualRange) {
        this.visualRange = visualRange;
        this.updateViewShed();
    };
    ViewShed.prototype.setHorizontalViewAngle = function (hva) {
        this.horizontalViewAngle = hva;
        this.updateViewShed();
    };
    ViewShed.prototype.setVerticalViewAngle = function (vva) {
        this.verticalViewAngle = vva;
        this.updateViewShed();
    };
    ViewShed.prototype.createPostStage = function () {
        var _this = this;
        var fs = glsl(__makeTemplateObject(["\n    #define USE_CUBE_MAP_SHADOW true\nuniform sampler2D colorTexture;\n// \u6DF1\u5EA6\u7EB9\u7406\nuniform sampler2D depthTexture;\n// \u7EB9\u7406\u5750\u6807\nvarying vec2 v_textureCoordinates;\n\nuniform mat4 camera_projection_matrix;\n\nuniform mat4 camera_view_matrix;\n// \u89C2\u6D4B\u8DDD\u79BB\nuniform float far;\n//\u9634\u5F71\nuniform samplerCube shadowMap_textureCube;\n\nuniform mat4 shadowMap_matrix;\nuniform vec4 shadowMap_lightPositionEC;\nuniform vec4 shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness;\nuniform vec4 shadowMap_texelSizeDepthBiasAndNormalShadingSmooth;\n\nstruct zx_shadowParameters\n{\n    vec3 texCoords;\n    float depthBias;\n    float depth;\n    float nDotL;\n    vec2 texelStepSize;\n    float normalShadingSmooth;\n    float darkness;\n};\n\nfloat czm_shadowVisibility(samplerCube shadowMap, zx_shadowParameters shadowParameters)\n{\n    float depthBias = shadowParameters.depthBias;\n    float depth = shadowParameters.depth;\n    float nDotL = shadowParameters.nDotL;\n    float normalShadingSmooth = shadowParameters.normalShadingSmooth;\n    float darkness = shadowParameters.darkness;\n    vec3 uvw = shadowParameters.texCoords;\n\n    depth -= depthBias;\n    float visibility = czm_shadowDepthCompare(shadowMap, uvw, depth);\n    return czm_private_shadowVisibility(visibility, nDotL, normalShadingSmooth, darkness);\n}\n\nvec4 getPositionEC(){\n  return czm_windowToEyeCoordinates(gl_FragCoord);\n}\n\nvec3 getNormalEC(){\n    return vec3(1.);\n  }\n\n  vec4 toEye(in vec2 uv,in float depth){\n    vec2 xy=vec2((uv.x*2.-1.),(uv.y*2.-1.));\n    vec4 posInCamera=czm_inverseProjection*vec4(xy,depth,1.);\n    posInCamera=posInCamera/posInCamera.w;\n    return posInCamera;\n  }\n\n  vec3 pointProjectOnPlane(in vec3 planeNormal,in vec3 planeOrigin,in vec3 point){\n    vec3 v01=point-planeOrigin;\n    float d=dot(planeNormal,v01);\n    return(point-planeNormal*d);\n  }\n\n  float getDepth(in vec4 depth){\n    float z_window=czm_unpackDepth(depth);\n    z_window=czm_reverseLogDepth(z_window);\n    float n_range=czm_depthRange.near;\n    float f_range=czm_depthRange.far;\n    return(2.*z_window-n_range-f_range)/(f_range-n_range);\n  }\n\n  float shadow( in vec4 positionEC ){\n    vec3 normalEC=getNormalEC();\n    zx_shadowParameters shadowParameters;\n    shadowParameters.texelStepSize=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.xy;\n    shadowParameters.depthBias=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.z;\n    shadowParameters.normalShadingSmooth=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.w;\n    shadowParameters.darkness=shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness.w;\n    vec3 directionEC=positionEC.xyz-shadowMap_lightPositionEC.xyz;\n    float distance=length(directionEC);\n    directionEC=normalize(directionEC);\n    float radius=shadowMap_lightPositionEC.w;\n    if(distance>radius)\n    {\n      return 2.0;\n    }\n    vec3 directionWC=czm_inverseViewRotation*directionEC;\n\n    shadowParameters.depth=distance/radius-0.0003;\n    shadowParameters.nDotL=clamp(dot(normalEC,-directionEC),0.,1.);\n\n    shadowParameters.texCoords=directionWC;\n    float visibility=czm_shadowVisibility(shadowMap_textureCube,shadowParameters);\n    return visibility;\n  }\n\n  bool visible(in vec4 result)\n  {\n    result.x/=result.w;\n    result.y/=result.w;\n    result.z/=result.w;\n    return result.x>=-1.&&result.x<=1.&&result.y>=-1.&&result.y<=1.&&result.z>=-1.&&result.z<=1.;\n  }\n\n  void main(){\n    // \u5F97\u5230\u91C9\u8272 = \u7ED3\u6784\u4E8C\u7EF4(\u5F69\u8272\u7EB9\u7406,\u7EB9\u7406\u5750\u6807)\n    gl_FragColor=texture2D(colorTexture,v_textureCoordinates);\n    // \u6DF1\u5EA6 = (\u91C9\u8272 = \u7ED3\u6784\u4E8C\u7EF4(\u6DF1\u5EA6\u7EB9\u7406,\u7EB9\u7406\u5750\u6807))\n    float depth=getDepth(texture2D(depthTexture,v_textureCoordinates));\n    // \u89C6\u89D2 = (\u7EB9\u7406\u5750\u6807,\u6DF1\u5EA6)\n    vec4 viewPos=toEye(v_textureCoordinates,depth);\n    //\u4E16\u754C\u5750\u6807\n    vec4 wordPos=czm_inverseView*viewPos;\n    // \u865A\u62DF\u76F8\u673A\u4E2D\u5750\u6807\n    vec4 vcPos=camera_view_matrix*wordPos;\n    float near=.001*far;\n    float dis=length(vcPos.xyz);\n    if(dis>near&&dis<far){\n      //\u900F\u89C6\u6295\u5F71\n      vec4 posInEye=camera_projection_matrix*vcPos;\n      // \u53EF\u89C6\u533A\u989C\u8272\n      vec4 v_color=vec4(0.,1.,0.,.5);\n      vec4 inv_color=vec4(1.,0.,0.,.5);\n      if(visible(posInEye)){\n        float vis=shadow(viewPos);\n        if(vis>0.3){\n          gl_FragColor=mix(gl_FragColor,v_color,.5);\n        } else{\n          gl_FragColor=mix(gl_FragColor,inv_color,.5);\n        }\n      }\n    }\n  }\n"], ["\n    #define USE_CUBE_MAP_SHADOW true\nuniform sampler2D colorTexture;\n// \u6DF1\u5EA6\u7EB9\u7406\nuniform sampler2D depthTexture;\n// \u7EB9\u7406\u5750\u6807\nvarying vec2 v_textureCoordinates;\n\nuniform mat4 camera_projection_matrix;\n\nuniform mat4 camera_view_matrix;\n// \u89C2\u6D4B\u8DDD\u79BB\nuniform float far;\n//\u9634\u5F71\nuniform samplerCube shadowMap_textureCube;\n\nuniform mat4 shadowMap_matrix;\nuniform vec4 shadowMap_lightPositionEC;\nuniform vec4 shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness;\nuniform vec4 shadowMap_texelSizeDepthBiasAndNormalShadingSmooth;\n\nstruct zx_shadowParameters\n{\n    vec3 texCoords;\n    float depthBias;\n    float depth;\n    float nDotL;\n    vec2 texelStepSize;\n    float normalShadingSmooth;\n    float darkness;\n};\n\nfloat czm_shadowVisibility(samplerCube shadowMap, zx_shadowParameters shadowParameters)\n{\n    float depthBias = shadowParameters.depthBias;\n    float depth = shadowParameters.depth;\n    float nDotL = shadowParameters.nDotL;\n    float normalShadingSmooth = shadowParameters.normalShadingSmooth;\n    float darkness = shadowParameters.darkness;\n    vec3 uvw = shadowParameters.texCoords;\n\n    depth -= depthBias;\n    float visibility = czm_shadowDepthCompare(shadowMap, uvw, depth);\n    return czm_private_shadowVisibility(visibility, nDotL, normalShadingSmooth, darkness);\n}\n\nvec4 getPositionEC(){\n  return czm_windowToEyeCoordinates(gl_FragCoord);\n}\n\nvec3 getNormalEC(){\n    return vec3(1.);\n  }\n\n  vec4 toEye(in vec2 uv,in float depth){\n    vec2 xy=vec2((uv.x*2.-1.),(uv.y*2.-1.));\n    vec4 posInCamera=czm_inverseProjection*vec4(xy,depth,1.);\n    posInCamera=posInCamera/posInCamera.w;\n    return posInCamera;\n  }\n\n  vec3 pointProjectOnPlane(in vec3 planeNormal,in vec3 planeOrigin,in vec3 point){\n    vec3 v01=point-planeOrigin;\n    float d=dot(planeNormal,v01);\n    return(point-planeNormal*d);\n  }\n\n  float getDepth(in vec4 depth){\n    float z_window=czm_unpackDepth(depth);\n    z_window=czm_reverseLogDepth(z_window);\n    float n_range=czm_depthRange.near;\n    float f_range=czm_depthRange.far;\n    return(2.*z_window-n_range-f_range)/(f_range-n_range);\n  }\n\n  float shadow( in vec4 positionEC ){\n    vec3 normalEC=getNormalEC();\n    zx_shadowParameters shadowParameters;\n    shadowParameters.texelStepSize=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.xy;\n    shadowParameters.depthBias=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.z;\n    shadowParameters.normalShadingSmooth=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.w;\n    shadowParameters.darkness=shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness.w;\n    vec3 directionEC=positionEC.xyz-shadowMap_lightPositionEC.xyz;\n    float distance=length(directionEC);\n    directionEC=normalize(directionEC);\n    float radius=shadowMap_lightPositionEC.w;\n    if(distance>radius)\n    {\n      return 2.0;\n    }\n    vec3 directionWC=czm_inverseViewRotation*directionEC;\n\n    shadowParameters.depth=distance/radius-0.0003;\n    shadowParameters.nDotL=clamp(dot(normalEC,-directionEC),0.,1.);\n\n    shadowParameters.texCoords=directionWC;\n    float visibility=czm_shadowVisibility(shadowMap_textureCube,shadowParameters);\n    return visibility;\n  }\n\n  bool visible(in vec4 result)\n  {\n    result.x/=result.w;\n    result.y/=result.w;\n    result.z/=result.w;\n    return result.x>=-1.&&result.x<=1.&&result.y>=-1.&&result.y<=1.&&result.z>=-1.&&result.z<=1.;\n  }\n\n  void main(){\n    // \u5F97\u5230\u91C9\u8272 = \u7ED3\u6784\u4E8C\u7EF4(\u5F69\u8272\u7EB9\u7406,\u7EB9\u7406\u5750\u6807)\n    gl_FragColor=texture2D(colorTexture,v_textureCoordinates);\n    // \u6DF1\u5EA6 = (\u91C9\u8272 = \u7ED3\u6784\u4E8C\u7EF4(\u6DF1\u5EA6\u7EB9\u7406,\u7EB9\u7406\u5750\u6807))\n    float depth=getDepth(texture2D(depthTexture,v_textureCoordinates));\n    // \u89C6\u89D2 = (\u7EB9\u7406\u5750\u6807,\u6DF1\u5EA6)\n    vec4 viewPos=toEye(v_textureCoordinates,depth);\n    //\u4E16\u754C\u5750\u6807\n    vec4 wordPos=czm_inverseView*viewPos;\n    // \u865A\u62DF\u76F8\u673A\u4E2D\u5750\u6807\n    vec4 vcPos=camera_view_matrix*wordPos;\n    float near=.001*far;\n    float dis=length(vcPos.xyz);\n    if(dis>near&&dis<far){\n      //\u900F\u89C6\u6295\u5F71\n      vec4 posInEye=camera_projection_matrix*vcPos;\n      // \u53EF\u89C6\u533A\u989C\u8272\n      vec4 v_color=vec4(0.,1.,0.,.5);\n      vec4 inv_color=vec4(1.,0.,0.,.5);\n      if(visible(posInEye)){\n        float vis=shadow(viewPos);\n        if(vis>0.3){\n          gl_FragColor=mix(gl_FragColor,v_color,.5);\n        } else{\n          gl_FragColor=mix(gl_FragColor,inv_color,.5);\n        }\n      }\n    }\n  }\n"]));
        var postStage = new Cesium.PostProcessStage({
            fragmentShader: fs,
            uniforms: {
                camera_projection_matrix: this.lightCamera.frustum.projectionMatrix,
                camera_view_matrix: this.lightCamera.viewMatrix,
                far: function () {
                    return _this.visualRange;
                },
                shadowMap_textureCube: function () {
                    _this.shadowMap.update(Reflect.get(_this.viewer.scene, "_frameState"));
                    return Reflect.get(_this.shadowMap, "_shadowMapTexture");
                },
                shadowMap_matrix: function () {
                    _this.shadowMap.update(Reflect.get(_this.viewer.scene, "_frameState"));
                    return Reflect.get(_this.shadowMap, "_shadowMapMatrix");
                },
                shadowMap_lightPositionEC: function () {
                    _this.shadowMap.update(Reflect.get(_this.viewer.scene, "_frameState"));
                    return Reflect.get(_this.shadowMap, "_lightPositionEC");
                },
                shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness: function () {
                    _this.shadowMap.update(Reflect.get(_this.viewer.scene, "_frameState"));
                    var bias = _this.shadowMap._pointBias;
                    return Cesium.Cartesian4.fromElements(bias.normalOffsetScale, _this.shadowMap._distance, _this.shadowMap.maximumDistance, 0.0, new Cesium.Cartesian4());
                },
                shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: function () {
                    _this.shadowMap.update(Reflect.get(_this.viewer.scene, "_frameState"));
                    var bias = _this.shadowMap._pointBias;
                    var scratchTexelStepSize = new Cesium.Cartesian2();
                    var texelStepSize = scratchTexelStepSize;
                    texelStepSize.x = 1.0 / _this.shadowMap._textureSize.x;
                    texelStepSize.y = 1.0 / _this.shadowMap._textureSize.y;
                    return Cesium.Cartesian4.fromElements(texelStepSize.x, texelStepSize.y, bias.depthBias, bias.normalShadingSmooth, new Cesium.Cartesian4());
                }
            }
        });
        this.postStage = this.viewer.scene.postProcessStages.add(postStage);
    };
    return ViewShed;
}());
// entity集合
var parentEntity = viewer.entities.add(new Cesium.Entity());
var Vpoint = 0; //视域点
var Gpoint = 0; //目标点
var handler;
var view; //可视域对象
var flag = 1; //添加面板
//添加视域点
function addVPoint() {
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
        Vpoint = toPoint;
        viewer.entities.add({ //添加实体
            parent: parentEntity,
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
            name: 'vpoint',
            ellipsoid: {
                radii: new Cesium.Cartesian3(5, 5, 5),
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
//添加目标点
function addGPoint() {
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
        Gpoint = toPoint;

        viewer.entities.add({
            parent: parentEntity,
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
            name: 'vpoint',
            ellipsoid: {
                radii: new Cesium.Cartesian3(5, 5, 5),
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
$('#addFirstPoint').click(function () {
    alert('绘制视域点，右键结束!');
    addVPoint();
})
$('#addSecondPoint').click(function () {
    alert('绘制目标点，右键结束!');
    addGPoint();
})
$('#viewshedAnalysis').click(function () {
    if (Vpoint && Gpoint) {
        try {
            var options = {
                viewPosition: Vpoint,
                viewer: viewer,
                direction: Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(Vpoint,
                    Gpoint,
                    new Cesium.Cartesian3()), new Cesium.Cartesian3()),
                pitch: 0,
                visualRange: Cesium.Cartesian3.distance(Vpoint, Gpoint)
            }
            view = new ViewShed(options)
        } catch (error) {
            alert(error);
        }
    } else
        alert('视点和目标点未选择');

})
$('#viewshedEnd').click(function () {
    view.clear();
})
$('#addPanel').click(function () {
    if (flag) {
        //添加inspector面板
        viewer.extend(Cesium.viewerCesiumInspectorMixin);
        flag = 0;
    }

    if ($('#toolbar').css('display') == 'none')
        $('#toolbar').show();
    else
        $('#toolbar').hide();
})
$('#viewshedRetset').click(function () {
    viewer.entities.removeAll();
    Vpoint = 0;
    Gpoint = 0;
    viewshed.clearDraw();
})
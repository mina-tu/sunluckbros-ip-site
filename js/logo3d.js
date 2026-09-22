/* =====================================================
   Contact us：可旋轉的 3D 玻璃 logo
   - three.js 與 GLB 都等到區塊接近視窗才載入，不拖慢首屏
   - 環境貼圖只用於照明與反射，永遠不會被畫成背景（頁面維持純黑）
   - 沒有 WebGL 或載入失敗時，保留 poster 圖，不影響表單

   調色：載入後可在 console 用 window.__slb 即時試，滿意再寫回本檔預設值
     __slb.irid[0].uSat.value   彩虹飽和度 0~1（0 = 灰鉻）        目前 0.78
     __slb.irid[0].uBand.value  視角色帶密度，越大色帶越密        目前 2.10
     __slb.irid[0].uFlow.value  色帶沿形體流動的頻率              目前 0.46
     __slb.irid[0].uRim.value   掠角白色亮邊強度                  目前 0.60
     __slb.glass[0].envMapIntensity  玻璃反射強度                 目前 2.40
     __slb.gold[0].envMapIntensity   金屬反射強度                 目前 3.00
     __slb.renderer.toneMappingExposure  整體曝光                 目前 0.95
   改完要看到效果：__slb.renderer.render(__slb.scene, __slb.camera)
   （window.__slb / window.__slbStart 是調色用入口，正式上線可刪）
   ===================================================== */
(function () {
  'use strict';

  var host = document.getElementById('contactLogo3d');
  if (!host) return;

  var THREE_VERSION = '0.146.0';
  var CDN = 'https://cdn.jsdelivr.net/npm/three@' + THREE_VERSION + '/';
  var SCRIPTS = [
    CDN + 'build/three.min.js',
    CDN + 'examples/js/controls/OrbitControls.js',
    CDN + 'examples/js/loaders/GLTFLoader.js'
  ];
  var MODEL_URL = 'models/SunLuckBros_Logo.glb';

  var started = false;

  function hasWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('failed: ' + src)); };
      document.head.appendChild(s);
    });
  }

  function loadAll() {
    return SCRIPTS.reduce(function (chain, src) {
      return chain.then(function () { return loadScript(src); });
    }, Promise.resolve());
  }

  /* ---------- 只供反射的環境：暗底 + 少數強彩色光條 ----------
     全覆蓋的亮環境會把金屬反射墊成粉彩；參考圖那種深飽和來自
     「大部分是暗的、只有幾道強光」的環境。                              */
  function buildEnvironment() {
    var s = new THREE.Scene();

    // 幾乎全黑的環境球，只在上方帶一點冷光
    var geo = new THREE.IcosahedronGeometry(40, 3);
    var pos = geo.attributes.position;
    var cols = new Float32Array(pos.count * 3);
    var v = new THREE.Vector3();
    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      var up = Math.max(0, v.y);
      cols[i * 3] = 0.030 + 0.10 * up;
      cols[i * 3 + 1] = 0.032 + 0.10 * up;
      cols[i * 3 + 2] = 0.050 + 0.12 * up;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    s.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      vertexColors: true, side: THREE.BackSide
    })));

    // 白色窄光條負責鏡面亮帶，彩色寬卡負責虹彩的顏色來源
    var quad = new THREE.PlaneGeometry(1, 1);
    var LIGHTS = [
      ['#dceaff', 0.65, [-3.0, 1.0, 8.0], [5, 9]],
      ['#ffffff', 0.9, [4.0, 2.0, 7.0], [3, 8]],
      ['#ffffff', 90, [-1.8, 6.4, 3.2], [8, 0.55]],
      ['#ffffff', 62, [4.6, -1.8, 5.4], [6, 0.45]],
      ['#ff2b93', 30, [-6.0, 2.2, 4.6], [7, 1.5]],
      ['#12d6ff', 26, [6.0, 1.2, 4.2], [7, 1.4]],
      ['#ffb033', 30, [0.6, -4.8, 4.8], [8, 1.2]],
      ['#7b4dff', 16, [2.8, 4.2, -3.0], [6, 1.2]]
    ];
    LIGHTS.forEach(function (c) {
      var m = new THREE.Mesh(quad, new THREE.MeshBasicMaterial({
        color: new THREE.Color(c[0]).multiplyScalar(c[1]), side: THREE.DoubleSide
      }));
      m.position.set(c[2][0], c[2][1], c[2][2]);
      m.scale.set(c[3][0], c[3][1], 1);
      m.lookAt(0, 0, 0);
      s.add(m);
    });

    return s;
  }

  /* ---------- 虹彩鉻：金屬底 × 彩虹染色，顏色來自反射彩色環境 ----------
     用「加自發光」做不出參考圖的深飽和 —— 那會把整體墊亮成粉彩。
     改成把彩虹當成金屬的 base color：亮處吃到環境的亮部而飽和，
     暗處自然留黑，鏡面高光也保留下來。                                   */
  var iridUniforms = [];

  function addIridescence(mat) {
    mat.onBeforeCompile = function (shader) {
      shader.uniforms.uBand = { value: 2.10 };   // 視角造成的色帶密度
      shader.uniforms.uFlow = { value: 0.46 };   // 沿形體流動的頻率
      shader.uniforms.uSat = { value: 0.78 };    // 彩虹飽和度（0 = 灰鉻）
      shader.uniforms.uGain = { value: 1.05 };   // 整體亮度增益
      shader.uniforms.uRim = { value: 0.60 };    // 掠角白色亮邊
      iridUniforms.push(shader.uniforms);

      shader.vertexShader = shader.vertexShader
        .replace('#include <common>',
          '#include <common>\nvarying vec3 vSlbPos;\nvarying vec3 vSlbN;\nvarying vec3 vSlbV;')
        .replace('#include <begin_vertex>',
          '#include <begin_vertex>\nvSlbPos = transformed;')
        .replace('#include <defaultnormal_vertex>',
          '#include <defaultnormal_vertex>\nvSlbN = normalize(transformedNormal);')
        .replace('#include <project_vertex>',
          '#include <project_vertex>\nvSlbV = -mvPosition.xyz;');

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', [
          '#include <common>',
          'varying vec3 vSlbPos;',
          'varying vec3 vSlbN;',
          'varying vec3 vSlbV;',
          'uniform float uBand;',
          'uniform float uFlow;',
          'uniform float uSat;',
          'uniform float uGain;',
          'uniform float uRim;',
          'vec3 slbSpectrum(float t){',
          '  return 0.5 + 0.5 * cos(6.28318530718 * (t + vec3(0.00, 0.30, 0.62)));',
          '}'
        ].join('\n'))
        // 在 color_fragment 之後直接改寫 base color；metalness=1 時它就是反射色
        .replace('#include <color_fragment>', [
          '#include <color_fragment>',
          '{',
          '  vec3 sN = normalize(vSlbN);',
          '  vec3 sV = normalize(vSlbV);',
          '  float facing = clamp(dot(sN, sV), 0.0, 1.0);',
          '  float t = fract(facing * uBand + (vSlbPos.x * 0.72 + vSlbPos.y * 1.18) * uFlow);',
          '  vec3 irid = slbSpectrum(t);',
          '  irid = mix(vec3(0.72), irid, uSat);',
          // 掠角往白色收，做出參考圖邊緣那圈亮邊
          '  irid = mix(irid, vec3(1.0), pow(1.0 - facing, 3.0) * uRim);',
          '  diffuseColor.rgb = irid * uGain;',
          '}'
        ].join('\n'));
    };
    mat.customProgramCacheKey = function () { return 'slb-irid-v3'; };
  }

  function init() {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isPhone = window.matchMedia('(max-width: 768px)').matches;

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.setClearAlpha(0);
    host.appendChild(renderer.domElement);
    renderer.domElement.classList.add('contact__logo-canvas');

    var scene = new THREE.Scene();
    scene.background = null;               // 頁面黑底透出來

    var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
    camera.position.set(0, 0.30, 7.0);

    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false;           // 不攔截頁面捲動
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.78;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.55;

    // OrbitControls 預設會把 canvas 設成 touch-action:none，手指落在 logo 上就無法捲動頁面。
    // 改成 pan-y：垂直滑動仍然捲頁面，水平拖曳才轉模型。
    renderer.domElement.style.touchAction = 'pan-y';

    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(buildEnvironment(), 0.02).texture;

    var modelSize = null;
    function resize() {
      var w = host.clientWidth;
      var h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      if (modelSize) {
        var halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
        var distance = Math.max(modelSize.y, modelSize.x / camera.aspect) / (2 * Math.tan(halfFov));
        camera.position.set(0, modelSize.y * 0.025, distance * 1.2 + modelSize.z / 2);
        controls.target.set(0, 0, 0);
        controls.update();
      }
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    var glassMats = [], goldMats = [];
    new THREE.GLTFLoader().load(MODEL_URL, function (gltf) {
      gltf.scene.traverse(function (o) {
        if (!o.isMesh) return;
        var isGold = /gold/i.test((o.material && o.material.name) || '');
        var m;
        if (isGold) {
          m = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#f0a52a'),
            metalness: 1.0,
            roughness: 0.10,
            clearcoat: 0.3,
            clearcoatRoughness: 0.12,
            envMapIntensity: 3.0
          });
        } else {
          // 真正透光的玻璃；薄膜虹彩與彩色燈板共同形成邊緣色帶。
          m = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            transmission: 0.96,
            thickness: 0.35,
            ior: 1.47,
            roughness: 0.045,
            iridescence: 0.75,
            iridescenceIOR: 1.3,
            iridescenceThicknessRange: [100, 450],
            clearcoat: 1.0,
            clearcoatRoughness: 0.03,
            envMapIntensity: 1.8,
            side: THREE.FrontSide
          });
          glassMats.push(m);
        }
        if (isGold) goldMats.push(m);
        o.material = m;
      });
      var bounds = new THREE.Box3().setFromObject(gltf.scene);
      modelSize = bounds.getSize(new THREE.Vector3());
      gltf.scene.position.sub(bounds.getCenter(new THREE.Vector3()));
      scene.add(gltf.scene);
      host.classList.add('is-ready');
      resize();
      // 調參用入口（正式上線可移除）
      window.__slb = { irid: iridUniforms, glass: glassMats, gold: goldMats,
                       renderer: renderer, scene: scene, camera: camera, controls: controls };
    }, null, function () {
      // 載入失敗：移除 canvas，poster 圖繼續顯示
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      failed = true;
      controls.dispose();
      renderer.dispose();
    });

    // 捲出視窗時暫停渲染，避免無謂的 GPU 負擔
    var visible = true, failed = false;
  if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { rootMargin: '120px' }).observe(host);
    }

    (function loop() {
      if (failed) return;
      requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      controls.update();
      renderer.render(scene, camera);
    })();
  }

  function start() {
    if (started) return;
    started = true;
    if (!hasWebGL()) return;                // poster 圖留著
    loadAll().then(init).catch(function () { /* poster 圖留著 */ });
  }

  window.__slbStart = start;   // 調參用（正式上線可移除）

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        io.disconnect();
        start();
      }
    }, { rootMargin: '400px' });
    io.observe(host);
  } else {
    start();
  }
})();

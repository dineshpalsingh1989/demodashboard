/* Native 3D transport and waterfront. Shared geometry, one draw call per vehicle type.
   Simulation clocks and device data remain owned by the dashboard. */
window.CityDetails = function (T, scene3, color) {
  const matrix = new T.Matrix4(), pos = new T.Vector3(), scale = new T.Vector3(), quat = new T.Quaternion();
  const clock = { value: 0 }, darkness = { value: 0 }, models = {}, pickables = [];
  const box = (w, h, d, x, y, z) => new T.BoxGeometry(w, h, d).translate(x, y, z);
  const ball = (r, x, y, z, sx = 1, sy = 1, sz = 1) => new T.SphereGeometry(r, 10, 6).scale(sx, sy, sz).translate(x, y, z);
  const wheel = (x, z, r = .06, w = .045) => new T.CylinderGeometry(r, r, w, 8).rotateX(Math.PI / 2).translate(x, r, z);
  const profile = (points, width) => {
    const shape = new T.Shape(); points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y)); shape.closePath();
    return new T.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, steps: 1 }).translate(0, 0, -width / 2);
  };
  const wing = (points, y, thick = .045) => {
    const shape = new T.Shape(); points.forEach(([x, z], i) => i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)); shape.closePath();
    return new T.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, steps: 1 }).rotateX(-Math.PI / 2).translate(0, y, 0);
  };

  // Vertex finishes keep paint, glass, rubber and lamps in the same draw call.
  // Light roles: 1 headlights, 2 brakes, 3 beacon, +/-4 indicators, 5 navigation lights.
  const material = new T.MeshPhongMaterial({ vertexColors: true, shininess: 65, specular: color('#b0bec5') });
  material.onBeforeCompile = sh => {
    sh.uniforms.detailTime = clock; sh.uniforms.detailNight = darkness;
    sh.vertexShader = `attribute vec3 aFinish; attribute vec2 aDrive;
      varying vec3 vFinish; varying vec3 vBody; varying vec2 vDrive;\n` + sh.vertexShader
      .replace('#include <color_vertex>', `#ifdef USE_COLOR
        vColor = color;
        #endif
        vBody = instanceColor; vFinish = aFinish; vDrive = aDrive;`);
    sh.fragmentShader = `uniform float detailTime; uniform float detailNight;
      varying vec3 vFinish; varying vec3 vBody; varying vec2 vDrive;\n` + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= mix(vec3(1.0), vBody, vFinish.x);`)
      .replace('#include <specularmap_fragment>', `#include <specularmap_fragment>
        specularStrength = vFinish.y;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float lamp = abs(vFinish.z), power = 0.0;
        if (lamp > 0.5 && lamp < 1.5) power = 0.18 + detailNight * 1.7;
        if (lamp > 1.5 && lamp < 2.5) power = 0.08 + detailNight * 0.4 + vDrive.x * 2.5;
        if (lamp > 2.5 && lamp < 3.5) power = step(0.72, fract(detailTime * 1.6)) * 3.0;
        if (lamp > 3.5 && lamp < 4.5) power = step(0.5, fract(detailTime * 1.4)) * step(0.5, vDrive.y * sign(vFinish.z)) * 2.8;
        if (lamp > 4.5) power = 0.4 + detailNight * 2.0;
        totalEmissiveRadiance += diffuseColor.rgb * power;`);
  };
  function model(parts, max, zone) {
    const arrays = { position: [], normal: [], color: [], aFinish: [] };
    for (const [source, tint, finish = .08, light = 0] of parts) {
      const g = source.index ? source.toNonIndexed() : source, c = color(tint || '#ffffff');
      arrays.position.push(...g.attributes.position.array); arrays.normal.push(...g.attributes.normal.array);
      for (let i = 0; i < g.attributes.position.count; i++) { arrays.color.push(c.r, c.g, c.b); arrays.aFinish.push(tint ? 0 : 1, finish, light); }
      if (g !== source) g.dispose(); source.dispose();
    }
    const g = new T.BufferGeometry();
    for (const [key, data] of Object.entries(arrays)) g.setAttribute(key, new T.Float32BufferAttribute(data, 3));
    g.setAttribute('aDrive', new T.InstancedBufferAttribute(new Float32Array(max * 2), 2));
    const mesh = new T.InstancedMesh(g, material, max);
    mesh.instanceColor = new T.InstancedBufferAttribute(new Float32Array(max * 3).fill(1), 3);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.count = 0; mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
    scene3.add(mesh); if (zone) { mesh.userData.zone = zone; pickables.push(mesh); }
    return { mesh, n: 0, max };
  }
  function put(m, x, y, z, yaw = 0, paint = '#ffffff', sx = 1, brake = 0, signal = 0, pitch = 0) {
    if (m.n >= m.max) return;
    pos.set(x, z, y); scale.set(sx, 1, 1); quat.setFromEuler(new T.Euler(0, yaw, pitch, 'YXZ'));
    matrix.compose(pos, quat, scale); m.mesh.setMatrixAt(m.n, matrix); m.mesh.setColorAt(m.n, color(paint));
    const a = m.mesh.geometry.attributes.aDrive.array; a[m.n * 2] = brake; a[m.n * 2 + 1] = signal; m.n++;
  }
  function flush(m) {
    m.mesh.count = m.n; m.mesh.instanceMatrix.needsUpdate = true; m.mesh.instanceColor.needsUpdate = true; m.mesh.geometry.attributes.aDrive.needsUpdate = true;
  }
  function tyres(parts, axles, halfWidth, radius) {
    for (const x of axles) for (const s of [-1, 1]) {
      parts.push([wheel(x, halfWidth * s, radius), '#22292e', .04]);
      parts.push([new T.CircleGeometry(radius * .53, 8).rotateY(s < 0 ? Math.PI : 0).translate(x, radius, (halfWidth + .025) * s), '#99a5ac', .5]);
    }
  }
  function lamps(parts, nose, tail, y, halfWidth) {
    for (const s of [-1, 1]) {
      parts.push([box(.014, .033, .065, nose, y, s * halfWidth), '#fff3cf', .3, 1]);
      parts.push([box(.014, .036, .06, tail, y, s * halfWidth), '#c82323', .2, 2]);
      parts.push([box(.017, .025, .025, nose - .015, y, s * (halfWidth + .04)), '#ed981b', .15, s * 4]);
    }
  }
  function car(kind) {
    const suv = kind === 'suv', van = kind === 'van', top = van ? .40 : suv ? .35 : .30;
    const p = [[profile([[-.32,.08],[-.32,.16],[-.26,.19],[.22,.19],[.32,.14],[.32,.08]], .31), null, .5]];
    p.push([profile([[-.23,.19],[-.18,top],[van ? .08 : .045,top],[.20,.19]], .285), '#233d4a', .95]);
    p.push([box(van ? .26 : .20,.018,.29,van ? -.05 : -.065,top+.004,0), null, .5]);
    for (const s of [-1,1]) {
      p.push([box(.018,top-.19,.012,-.07,(top+.19)/2,s*.147), null, .4]);
      p.push([box(.045,.026,.034,.075,.225,s*.177), null, .4]);
      p.push([box(.045,.012,.008,-.12,.19,s*.159), '#b7c1c6', .5]);
      if (van) p.push([box(.18,.19,.012,-.18,.29,s*.147), null, .4]);
    }
    p.push([box(.018,.045,.23,.321,.10,0), '#263139', .12], [box(.018,.025,.10,-.323,.12,0), '#e4e9e7', .1]);
    tyres(p, [-.21,.21], .154, .06); lamps(p,.325,-.325,.145,.10);
    return model(p, 260);
  }
  function buildModels() {
    models.car = car('sedan'); models.suv = car('suv'); models.van = car('van');
    const bus = [[profile([[-.5,.08],[-.5,.34],[-.44,.39],[.43,.39],[.5,.30],[.5,.08]],.36), null,.4],
      [box(.88,.12,.365,-.015,.28,0),'#203c4d',.85], [box(.025,.17,.31,.48,.26,0),'#203c4d',.85],
      [box(.47,.045,.25,-.04,.415,0),'#d4dce0',.2]];
    for (let x=-.35;x<.4;x+=.16) bus.push([box(.014,.13,.37,x,.28,0),null,.4]);
    for (const x of [-.3,.3]) bus.push([box(.12,.26,.372,x,.21,0),'#899da5',.35]);
    tyres(bus,[-.32,.33],.18,.067); lamps(bus,.505,-.505,.14,.12); models.bus=model(bus,44);
    const cab = [[profile([[-.23,.10],[-.23,.40],[-.14,.47],[.13,.47],[.24,.34],[.24,.10]],.36),null,.5],
      [profile([[.15,.26],[.15,.43],[.23,.34],[.245,.26]],.30),'#243b49',.9],
      [box(.20,.12,.366,-.02,.345,0),'#243b49',.85], [box(.48,.06,.29,-.08,.09,0),'#303c43',.1],
      [box(.018,.09,.24,.245,.17,0),'#424e54',.2], [box(.022,.03,.25,.25,.12,0),'#b4c0c4',.6]];
    for(const s of [-1,1]) cab.push([box(.06,.07,.045,.10,.31,s*.22),'#303c43',.2]);
    tyres(cab,[-.18,.15],.18,.075); lamps(cab,.253,-.24,.18,.12); models.cab=model(cab,48);
    const trailer = [[box(1.03,.45,.40,0,.34,0),'#e7ecee',.25], [box(1.04,.06,.405,0,.46,0),null,.4],
      [box(1.04,.05,.30,0,.10,0),'#37474f',.1], [box(.012,.39,.36,-.523,.35,0),'#b6c1c6',.25]];
    for(let x=-.45;x<.5;x+=.10) trailer.push([box(.012,.36,.409,x,.34,0),'#c5cfd3',.18]);
    for(const s of [-1,1]) trailer.push([box(.014,.35,.015,-.533,.35,s*.09),'#667780',.4]);
    tyres(trailer,[-.32,-.17],.20,.073); lamps(trailer,.52,-.54,.14,.14); models.trailer=model(trailer,48);
    const train = [[profile([[-.88,.10],[-.88,.44],[-.78,.56],[.78,.56],[.88,.44],[.88,.10]],.57),'#edf2f4',.4],
      [box(1.60,.14,.58,0,.39,0),'#203e4d',.85],[box(1.76,.045,.58,0,.19,0),'#00897b',.35]];
    for(const x of [-.45,.45]) train.push([box(.14,.30,.586,x,.29,0),'#b9c8cf',.45]);
    tyres(train,[-.57,.57],.23,.08); models.train=model(train,20);
    buildAircraft(); buildFerry();
  }

  function buildAircraft() {
    const fuselage = new T.LatheGeometry([[.025,-1.5],[.10,-1.32],[.19,-.9],[.205,.85],[.16,1.25],[.07,1.52],[.006,1.65]].map(([r,x])=>new T.Vector2(r,x)),16).rotateZ(-Math.PI/2).translate(0,.43,0);
    const p = [[fuselage,'#edf2f3',.45], [ball(.17,1.21,.50,0,1,.48,1),'#203f50',.9],
      [profile([[-1.42,.44],[-1.25,1.04],[-.98,1.04],[-.91,.44]],.045),null,.4]];
    for(const s of [-1,1]) {
      p.push([wing([[.50,s*.16],[-.40,s*1.40],[-.76,s*1.40],[-.40,s*.16]],.32),'#b8c7cf',.45]);
      p.push([wing([[-1.0,s*.10],[-1.4,s*.57],[-1.61,s*.57],[-1.42,s*.1]],.47),'#c6d1d5',.4]);
      p.push([new T.CylinderGeometry(.13,.115,.43,12,1,true).rotateZ(Math.PI/2).translate(.02,.24,s*.65),'#e3e9ec',.5]);
      p.push([new T.CylinderGeometry(.10,.10,.015,12).rotateZ(Math.PI/2).translate(.24,.24,s*.65),'#1c2c36',.12]);
      p.push([box(.08,.035,.038,-.52,.38,s*1.4),s<0?'#df3027':'#29b75c',.2,5]);
      for(let x=-.90;x<1.0;x+=.13) p.push([box(.05,.055,.014,x,.50,s*.199),'#284650',.8]);
      p.push([box(1.85,.035,.014,-.02,.40,s*.205),null,.35]);
    }
    p.push([ball(.038,-.2,.65,0),'#ed3824',.15,3]);
    models.plane=model(p,4,'airport');
    const gear=[]; for(const [x,z] of [[.95,0],[-.35,-.27],[-.35,.27]]) {
      gear.push([box(.035,.17,.035,x,.13,z),'#8f9ea7',.4],[wheel(x,z,.065,.07),'#202b32',.05]);
    }
    models.gear=model(gear,4);
    const tug=[[box(.48,.14,.30,0,.16,0),'#d5bd50',.3],[box(.19,.14,.26,-.08,.29,0),'#314750',.7],
      [box(.65,.025,.025,-.48,.10,0),'#899a9e',.35],[ball(.025,-.08,.39,0),'#e9a32b',.15,3]];
    tyres(tug,[-.16,.16],.15,.065);models.tug=model(tug,4);
  }
  let wake;
  function buildFerry() {
    const p=[[wing([[-1.5,0],[-1.1,-.48],[.95,-.48],[1.5,0],[.95,.48],[-1.1,.48]],.04,.24),'#1d6590',.45],
      [box(1.9,.36,.72,0,.46,0),'#e7edef',.35], [box(1.72,.17,.735,0,.49,0),'#244654',.9],
      [box(2,.055,.82,0,.68,0),'#f0f3f3',.4], [box(.52,.23,.45,.45,.80,0),'#d9e5e9',.4],
      [box(.53,.11,.46,.45,.84,0),'#244654',.85], [box(.10,.35,.08,-.4,.85,0),'#d5e1e5',.3]];
    for(const s of [-1,1]) {
      p.push([box(2.25,.035,.025,0,.33,s*.48),'#b4c4ca',.45]);
      for(let x=-.9;x<=.9;x+=.3) p.push([box(.022,.18,.022,x,.25,s*.48),'#9bafb8',.35]);
      p.push([ball(.035,.7,.74,s*.38),s<0?'#dc3b32':'#38b86f',.2,5]);
    }
    models.ferry=model(p,1,'ferry');
    const mat=new T.MeshBasicMaterial({color:color('#e0f2ee'),transparent:true,opacity:.45,depthWrite:false,side:T.DoubleSide});
    mat.onBeforeCompile=sh=>{
      sh.uniforms.wakeTime=clock;
      sh.vertexShader='varying vec2 wakeUv;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nwakeUv=uv;');
      sh.fragmentShader='varying vec2 wakeUv; uniform float wakeTime;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float side=abs(wakeUv.x-.5)*2.0, spread=.16+wakeUv.y*.80;
        float trail=exp(-pow((side-spread)*13.0,2.0));
        float foam=.5+.5*sin(wakeUv.y*65.0-wakeTime*5.0);
        diffuseColor.a *= (trail*.7 + (1.0-side)*foam*.25) * (1.0-wakeUv.y) * smoothstep(0.0,.07,wakeUv.y);`);
    };
    wake=new T.Mesh(new T.PlaneGeometry(2.4,4.5).rotateX(-Math.PI/2),mat); wake.renderOrder=2; scene3.add(wake);
  }

  const bridge = { start: -20.6, left: -13.7, right: -8.3, end: -1.2, top: 1.8 };
  const smooth = x => { x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); };
  function roadHeight(x) {
    if(x<bridge.left) return bridge.top*smooth((x-bridge.start)/(bridge.left-bridge.start));
    if(x>bridge.right) return bridge.top*(1-smooth((x-bridge.right)/(bridge.end-bridge.right)));
    return bridge.top;
  }
  function roadPitch(x,dir) { return Math.atan2(roadHeight(x+.05)-roadHeight(x-.05),.1)*dir; }
  function patch(points) {
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(points,3)); g.computeVertexNormals(); return g;
  }
  function ribbon(x0,x1,z0,z1,lift=0) {
    const a=roadHeight(x0)+lift,b=roadHeight(x1)+lift;
    return patch([x0,a,z0,x0,a,z1,x1,b,z1, x0,a,z0,x1,b,z1,x1,b,z0]);
  }
  function environment(gb) {
    const p=[];
    for(let x=bridge.start;x<bridge.end;x+=.35) {
      const b=Math.min(x+.35,bridge.end);
      p.push([ribbon(x,b,HWY.y0,HWY.y1,.01),'#59636b',.06]);
      for(const z of [HWY.y0+.30,HWY.y1-.30]) p.push([ribbon(x,b,z-.13,z+.13,.12),'#b8c0bd',.12]);
      p.push([ribbon(x,b,30.46,30.54,.027),'#ded8b5',.1]);
      for(const z of [28.6,32.4]) p.push([ribbon(x,b,z-.025,z+.025,.025),'#e1e3d7',.1]);
      for(const z of [HWY.y0,HWY.y1]) {
        const a=roadHeight(x),h=roadHeight(b);
        p.push([patch([x,a-.19,z,b,h-.19,z,b,h,z,x,a-.19,z,b,h,z,x,a,z]),'#8d9b9e',.15]);
      }
    }
    for(let x=bridge.start;x<bridge.end-.5;x+=1.2) for(const z of [29.5,31.5]) p.push([ribbon(x,x+.60,z-.035,z+.035,.03),'#f0eee4',.12]);
    for(const x of [RIVER.x0-.3,RIVER.x1+.3]) for(const z of [HWY.y0+.3,HWY.y1-.3]) p.push([box(.28,1.65,.36,x,.80,z),'#a6b2b1',.1]);
    for(let x=bridge.start;x<bridge.end;x+=.7) for(const z of [HWY.y0+.12,HWY.y1-.12]) p.push([box(.04,.36,.04,x,roadHeight(x)+.19,z),'#a6b5b9',.45]);
    for(let x=bridge.start;x<bridge.end-.35;x+=.35) for(const z of [HWY.y0+.12,HWY.y1-.12]) p.push([ribbon(x,x+.35,z-.035,z+.035,.38),'#c3cfd0',.5]);
    const deck=model(p,1,'bridge'); put(deck,0,0,0); flush(deck);
    // A through lane in front of the docked cabs gives arriving rigs room to manoeuvre.
    const yard=model([[box(AIR.x1-62,.7,1.3,(62+AIR.x1)/2,-.35,46.6),'#7b878d',.06]],1,'warehouse');
    put(yard,0,0,0);flush(yard);
    gb.slabs.push({x0:62,x1:AIR.x1,y0:45.95,y1:47.25});
  }
  async function finishEnvironment(gb, pause) {
    await pause(); buildCoast(gb);
    await pause(); buildAirportDetails();
    await pause(); buildParkDetails(); buildStreetMarkings();
    if (life) await life.build(pause);
  }
  function buildCoast(gb) {
    const p=[], shallows=[];
    const slabs=gb.slabs.filter(s=>!(s.x0===RIVER.x0&&s.x1===RIVER.x1));
    const land=(x,z)=>slabs.some(s=>x>s.x0-.005&&x<s.x1+.005&&z>s.y0-.005&&z<s.y1+.005);
    const river=(x,z)=>x>RIVER.x0-.1&&x<RIVER.x1+.1&&z>RIVER.y0-.1&&z<RIVER.y1+.1;
    for(const slab of slabs) for(const [ax,fixed,start,end,sign] of [['x',slab.y0,slab.x0,slab.x1,-1],['x',slab.y1,slab.x0,slab.x1,1],['z',slab.x0,slab.y0,slab.y1,-1],['z',slab.x1,slab.y0,slab.y1,1]]) {
      for(let a=start;a<end;a+=1.4) {
        const len=Math.min(1.4,end-a), c=a+len/2, x=ax==='x'?c:fixed, z=ax==='x'?fixed:c;
        const ox=x+(ax==='z'?sign*.1:0),oz=z+(ax==='x'?sign*.1:0);
        if(land(ox,oz)||river(ox,oz)) continue;
        p.push([box(ax==='x'?len-.025:.13,.62,ax==='x'?.13:len-.025,x,-.34,z),'#859494',.08]);
        p.push([box(ax==='x'?len:.22,.09,ax==='x'?.22:len,x,-.02,z),'#bac5bf',.12]);
        const seed=Math.abs(Math.sin(x*32.1+z*17.7));
        const rx=x+(ax==='z'?sign*(.22+seed*.32):(seed-.5)*.8),rz=z+(ax==='x'?sign*(.22+seed*.32):(seed-.5)*.8);
        p.push([new T.IcosahedronGeometry(.22+seed*.17,0).rotateY(seed*3).scale(1+seed*.3,.65,1).translate(rx,-.57,rz),'#768b86',.04]);
        shallows.push({x,z,ax,sign,len});
      }
    }
    // River retaining walls and a narrow path; leave quay entrances unobstructed.
    for(const x of [RIVER.x0-.08,RIVER.x1+.08]) {
      p.push([box(.16,.4,RIVER.y1-RIVER.y0,x,-.17,(RIVER.y0+RIVER.y1)/2),'#8a9d97',.1]);
      for(let z=RIVER.y0;z<RIVER.y1;z+=.8) {
        if(z>HWY.y0-.5&&z<HWY.y1+.5) continue;
        p.push([box(.42,.035,.77,x+(x<RIVER.x0?-.3:.3),.02,z+.4),'#b8bca8',.08]);
      }
    }
    const coast=model(p,1);put(coast,0,0,0);flush(coast);
    const positions=[],opacity=[];
    for(const {x,z,ax,sign,len} of shallows) {
      const dx=ax==='x'?len/2:0,dz=ax==='z'?len/2:0,ox=x+(ax==='z'?sign*1.7:0),oz=z+(ax==='x'?sign*1.7:0);
      const a=[x-dx,-.705,z-dz],b=[x+dx,-.705,z+dz],c=[ox+dx,-.705,oz+dz],d=[ox-dx,-.705,oz-dz];
      positions.push(...a,...c,...b,...a,...d,...c);opacity.push(1,0,1,1,0,0);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('aCoast',new T.Float32BufferAttribute(opacity,1));g.computeVertexNormals();
    const mat=new T.MeshLambertMaterial({color:color('#7db4b1'),transparent:true,opacity:.32,depthWrite:false,side:T.DoubleSide});
    mat.onBeforeCompile=sh=>{
      sh.vertexShader='attribute float aCoast; varying float coastFade;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncoastFade=aCoast;');
      sh.fragmentShader='varying float coastFade;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= smoothstep(0.0,1.0,coastFade);');
    };
    scene3.add(new T.Mesh(g,mat));
  }
  let airLights;
  function buildAirportDetails() {
    const p=[], lamps=[];
    for(let x=66;x<=108;x+=1.4) for(const z of [4.05,6.95]) {
      p.push([box(.065,.045,.065,x,.025,z),'#59696f',.15]); lamps.push([ball(.035,x,.065,z),'#fff0c0',.1,5]);
    }
    for(let x=66;x<=108;x+=2.1) for(const z of [8.55,9.45]) lamps.push([ball(.03,x,.05,z),'#469bff',.1,5]);
    for(const x of [66.2,107.8]) for(let z=4.2;z<6.9;z+=.3) lamps.push([ball(.035,x,.05,z),x<70?'#38bb79':'#ed493c',.1,5]);
    for(let g=0;g<4;g++) {
      const x=GATES[g]+1.5;
      // Corrugated jet-bridge sleeve, wheel supports and apron equipment.
      for(let z=16.4;z<18;z+=.13) p.push([box(.43,.52,.022,x,.73,z),'#7e939e',.3]);
      p.push([box(.10,.42,.10,x,.21,16.65),'#788a91',.3]);
      for(const side of [-1,1]) p.push([wheel(x+side*.16,16.65,.08,.05),'#29343b',.04]);
      for(let k=0;k<3;k++) {
        const tx=x-1.1, tz=12.7+k*.45;
        p.push([box(.65,.08,.32,tx,.12,tz),'#899da4',.35],[box(.47,.20,.26,tx,.25,tz),'#c4b69b',.12]);
        for(const s of [-1,1]) p.push([wheel(tx+s*.20,tz,.055,.04),'#29343b',.04]);
      }
      for(const dz of [-.7,.7]) p.push([new T.ConeGeometry(.055,.16,8).translate(x+1.05,.08,14+dz),'#e38835',.1]);
    }
    // Roof seams on the broad terminal surface.
    for(let x=78.2;x<102;x+=1.6) p.push([box(.025,.025,4.1,x,1.615,20.5),'#859ba5',.2]);
    const detail=model(p,1,'airport'); put(detail,0,0,0);flush(detail);
    airLights=model(lamps,1);put(airLights,0,0,0);flush(airLights);airLights.mesh.castShadow=false;
  }
  function buildParkDetails() {
    const p=[];
    // Benches at existing ferry stops, safely on the land side of each quay.
    FERRY.stops.forEach(([,z,side])=>{
      const x=side==='E'?RIVER.x1+.65:RIVER.x0-.65;
      for(const dz of [-.8,.8]) {
        p.push([box(.25,.06,.58,x,.24,z+dz),'#9b7d59',.12],[box(.06,.28,.58,x+(side==='E'?.12:-.12),.39,z+dz),'#9b7d59',.12]);
        for(const d of [-.21,.21]) p.push([box(.16,.22,.035,x,.11,z+dz+d),'#54666a',.25]);
      }
    });
    const mesh=model(p,1);put(mesh,0,0,0);flush(mesh);
  }
  function buildStreetMarkings() {
    const p=[];
    for(const c of ROADS) for(let t=.3;t<WORLD-.3;t+=.8) {
      if(ROADS.some(r=>Math.abs(t+.2-r)<1.1))continue;
      p.push([box(.4,.004,.06,t+.2,.008,c),'#dedfd5',.02],[box(.06,.004,.4,c,.008,t+.2),'#dedfd5',.02]);
    }
    for(const a of ROADS) for(const b of ROADS) for(let k=-.7;k<=.7;k+=.3) {
      for(const s of [-1,1]) p.push([box(.22,.004,.14,a+s*.89,.009,b+k),'#e5e5db',.02],[box(.14,.004,.22,a+k,.009,b+s*.89),'#e5e5db',.02]);
    }
    const mesh=model(p,1);put(mesh,0,0,0);flush(mesh);mesh.mesh.castShadow=false;
  }

  const vehicleYaw = c => (c.ax || 'x') === 'x' ? ((c.sd || c.dir || 1)>0?0:Math.PI) : ((c.sd || c.dir || 1)>0?-Math.PI/2:Math.PI/2);
  const turnState=new WeakMap();
  function smoothYaw(o,target,dt) {
    let yaw=turnState.get(o);if(yaw===undefined)yaw=target;
    const delta=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw));yaw+=delta*Math.min(1,dt*7);turnState.set(o,yaw);return yaw;
  }
  function rig(x,y,z,yaw,trailerYaw,paint,brake=0,signal=0,pitch=0,followRoad=false) {
    put(models.cab,x,y,z,yaw,paint,1,brake,signal,pitch);
    const hx=x-Math.cos(yaw)*.27,hy=y+Math.sin(yaw)*.27;
    const tx=hx-Math.cos(trailerYaw)*.54,ty=hy+Math.sin(trailerYaw)*.54;
    put(models.trailer,tx,ty,followRoad?roadHeight(tx):z,trailerYaw,paint,1,brake,signal,followRoad?roadPitch(tx,Math.cos(trailerYaw)>0?1:-1):pitch);
  }
  function dockPose(t) {
    const u=((t%46)+46)%46,x=WH_HUB.docks[3],z=45.35,lane=46.45;
    if(u<10) return {x:104+(x-1.3-104)*smooth(u/10),y:lane,yaw:Math.PI,brake:u>8?1:0,signal:u>8?1:0};
    if(u<13) {
      const f=smooth((u-10)/3),q=1-f;
      const a=[x-1.3,lane],b=[x-.5,lane],c=[x,lane],d=[x,z];
      const px=q*q*q*a[0]+3*q*q*f*b[0]+3*q*f*f*c[0]+f*f*f*d[0],py=q*q*q*a[1]+3*q*q*f*b[1]+3*q*f*f*c[1]+f*f*f*d[1];
      const dx=3*q*q*(b[0]-a[0])+6*q*f*(c[0]-b[0])+3*f*f*(d[0]-c[0]),dy=3*q*q*(b[1]-a[1])+6*q*f*(c[1]-b[1])+3*f*f*(d[1]-c[1]);
      return {x:px,y:py,yaw:Math.atan2(dy,-dx),brake:0,signal:1};
    }
    if(u<30)return {x,y:z,yaw:-Math.PI/2,brake:1,signal:0};
    if(u<33) {
      const f=smooth((u-30)/3),q=1-f;
      // Pull forward, then turn east without snapping the cab through ninety degrees.
      const px=x+3*q*f*f*.6+f*f*f*1.3,py=z+(lane-z)*(1-q*q*q);
      const dx=6*q*f*.6+3*f*f*.7,dy=3*q*q*(lane-z);
      return {x:px,y:py,yaw:-Math.atan2(dy,dx),brake:0,signal:-1};
    }
    return {x:x+1.3+(104-x-1.3)*smooth((u-33)/13),y:lane,yaw:0,brake:0,signal:0};
  }
  let trailerHeading=Math.PI, lastDockTime=-1;
  function update(t,n,dt) {
    clock.value=t;darkness.value=n;
    for(const m of Object.values(models))m.n=0;
    cars.forEach((c,i)=>{
      if(c.pos<-.4||c.pos>WORLD+.4)return;
      const x=c.ax==='x'?c.pos:c.lane,y=c.ax==='x'?c.lane:c.pos;
      const m=c.bus?models.bus:i%7===0?models.van:i%3===0?models.suv:models.car;
      put(m,x,y,0,vehicleYaw(c),c.color,c.bus?(c.len||1.15):1,c.bk||0);
    });
    HWCARS.forEach((c,i)=>{
      const yaw=c.dir>0?0:Math.PI,h=roadHeight(c.x),pitch=roadPitch(c.x,c.dir);
      if(i%4===3)rig(c.x,c.y,h,yaw,yaw,['#315b80','#a33c35','#466a58'][i%3],0,0,pitch,true);
      else put(i%3===0?models.suv:models.car,c.x,c.y,h,yaw,c.col,1,0,0,pitch);
    });
    const visitor=c=>put(models.car,c.x,c.y,0,smoothYaw(c,vehicleYaw(c),dt),c.col,1,c.atGate?1:0);
    CP.vcars.forEach(visitor);ACP.vcars.forEach(visitor);
    for(let row=0;row<3;row++)for(let k=0;k<20;k++)put(k%5===0?models.suv:models.car,66+k*1.7+.3,35+row*1.6+.16,0,row%2?Math.PI:0,CARCOL[(k*3+row)%CARCOL.length]);
    [[80,26.3],[81.3,26.3],[82.6,26.3]].forEach(([x,y])=>put(models.car,x,y,0,0,'#e4b642'));
    put(models.bus,66+((t*1.6)%38)+.9,28.3,.08,0,'#e6ecec',1.8);
    const truck=dockPose(t), change=Math.atan2(Math.sin(truck.yaw-trailerHeading),Math.cos(truck.yaw-trailerHeading));
    if(lastDockTime<0||t<lastDockTime||t-lastDockTime>1)trailerHeading=truck.yaw;else trailerHeading+=change*Math.min(1,dt*3.2);
    lastDockTime=t;rig(truck.x,truck.y,.04,truck.yaw,trailerHeading,'#635b91',truck.brake,truck.signal);
    [0,2,4].forEach((k,i)=>rig(WH_HUB.docks[k],45.45,.03,-Math.PI/2,-Math.PI/2,['#356c91','#9b493e','#4d7758'][i]));
    RAIL.cars.forEach(c=>put(models.train,c.x,c.y,DECK_Z+.2,c.horiz?0:Math.PI/2));
    for(let k=0;k<3;k++){const x1=TRAIN.x-k*1.8,x0=x1-1.7;if(x0>=.5&&x1<=6.5)put(models.train,(x0+x1)/2,42.7,.05,0,'#fff',1.7/1.76);}
    for(const p of FL.planes) {
      if(p.hide)continue;
      const target=p.axis==='x'?(p.dir>0?0:Math.PI):(p.dir>0?-Math.PI/2:Math.PI/2),yaw=smoothYaw(p,target,dt);
      const phase=mod(FLT-30*p.g,FLC),pitch=p.z>.05?(phase<5?-.035:.07):0;
      put(models.plane,p.x,p.y,p.z,yaw,p.col,1,0,0,pitch);
      if(phase<110||p.z<.40)put(models.gear,p.x,p.y,p.z,yaw,'#fff',1,0,0,pitch);
      if(phase>=100&&phase<110)put(models.tug,p.x+Math.cos(yaw)*2.0,p.y-Math.sin(yaw)*2.0,0,yaw);
    }
    const boatYaw=FERRY.dir>0?-Math.PI/2:Math.PI/2;
    put(models.ferry,-11.2,FERRY.y,.025+Math.sin(t*1.3)*.008,boatYaw);
    wake.visible=FERRY.at<0&&WX.cur()!=='storm';
    wake.material.opacity=.45*(1-n*.65);
    wake.position.set(-11.2,.035,FERRY.y-FERRY.dir*3.35);wake.rotation.y=FERRY.dir>0?0:Math.PI;
    for(const m of Object.values(models))flush(m);
    if (life) life.update(t, n, dt);
  }
  const life = typeof CityStreetLife === 'function' ? CityStreetLife({ T, scene: scene3, color, model, put, flush, box, ball }) : null;
  return { buildModels, environment, finishEnvironment, update, roadHeight, roadPitch, pickables, dockPose,
    get stats(){return {models:Object.fromEntries(Object.entries(models).map(([k,m])=>[k,m.mesh.count])),bridgeClearance:bridge.top-.19-1.03,wakeVisible:!!wake?.visible,street:life&&life.stats};} };
};

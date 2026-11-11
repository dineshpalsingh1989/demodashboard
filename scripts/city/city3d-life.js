/* Street-scale geometry and activity, using the existing blocks, bus and ferry schedules. */
window.CityStreetLife = function ({ T, scene, color, model, put, flush, box, ball }) {
  const entrances = [], visitors = [], signs = [], stops = [], palette = ['#527e7a','#a56c46','#536d91','#8b565a'];
  const size = { person: .29, door: .38, kerb: .025, pavement: .40 };
  let people, legs, parcels, gangway, built = false, busAt = null, busSince = 0, refillSince = -100, ferryAt = -1, ferrySince = 0;
  let waiting = 0, boarding = 0, walking = 0, inside = 0;
  const clamp = x => Math.max(0,Math.min(1,x));
  const mix = (a,b,t) => a+(b-a)*t;
  function rounded(x0,z0,x1,z1,r) {
    const s=new T.Shape(),y0=-z1,y1=-z0;
    s.moveTo(x0+r,y0);s.lineTo(x1-r,y0);s.quadraticCurveTo(x1,y0,x1,y0+r);
    s.lineTo(x1,y1-r);s.quadraticCurveTo(x1,y1,x1-r,y1);s.lineTo(x0+r,y1);
    s.quadraticCurveTo(x0,y1,x0,y1-r);s.lineTo(x0,y0+r);s.quadraticCurveTo(x0,y0,x0+r,y0);
    return s;
  }
  function paving(b) {
    const s=rounded(b.x0-.10,b.y0-.10,b.x1+.10,b.y1+.10,.32);
    s.holes.push(rounded(b.x0+.30,b.y0+.30,b.x1-.30,b.y1-.30,.15));
    return new T.ExtrudeGeometry(s,{depth:size.kerb,bevelEnabled:false,steps:1,curveSegments:4}).rotateX(-Math.PI/2);
  }
  function baked(parts,zone) { const m=model(parts,1,zone);put(m,0,0,0);flush(m);return m; }
  const solids = () => objs.filter(o=>(o.t==='box'||o.t==='house')&&(o.z0||0)<.1&&o.h>.55&&o.x1-o.x0>.65&&o.y1-o.y0>.65);
  function frontage(o,b,all) {
    const x=(o.x0+o.x1)/2,z=(o.y0+o.y1)/2;
    const sides=[
      {x,z:o.y1,tx:x,tz:b.y1-.12,yaw:0,width:o.x1-o.x0},
      {x,z:o.y0,tx:x,tz:b.y0+.12,yaw:Math.PI,width:o.x1-o.x0},
      {x:o.x1,z,tx:b.x1-.12,tz:z,yaw:Math.PI/2,width:o.y1-o.y0},
      {x:o.x0,z,tx:b.x0+.12,tz:z,yaw:-Math.PI/2,width:o.y1-o.y0}
    ].map(a=>({...a,distance:Math.hypot(a.tx-a.x,a.tz-a.z)})).sort((a,b)=>a.distance-b.distance);
    return sides.find(a=>a.distance>.12&&!all.some(other=>other!==o&&
      other.x0<Math.max(a.x,a.tx)+.13&&other.x1>Math.min(a.x,a.tx)-.13&&
      other.y0<Math.max(a.z,a.tz)+.13&&other.y1>Math.min(a.z,a.tz)-.13));
  }
  function entry(parts,o,a,commercial) {
    const transform=g=>g.rotateY(a.yaw).translate(a.x,0,a.z);
    const add=(g,c,finish=.1,light=0)=>parts.push([transform(g),c,finish,light]);
    add(box(.27,size.door,.025,0,size.door/2+.026,.016),commercial?'#294653':'#665b4d',.65);
    for(const x of [-.155,.155])add(box(.027,.415,.04,x,.22,.025),'#d4d0bf');
    add(box(.335,.025,.04,0,.42,.025),'#d4d0bf');
    add(box(.012,.06,.014,.095,.20,.04),'#c4caca',.6);
    add(box(.38,.025,.17,0,.013,.10),'#aaa99b');
    const w=Math.min(a.width*.82,1.25),accent=palette[Math.abs(o.id||0)%palette.length];
    if(commercial) {
      for(const sign of [-1,1])if(w>.65)add(box((w-.42)/2,.28,.018,sign*(w+.32)/4,.20,.015),'#375766',.85);
      for(let x=-w/2;x<w/2;x+=.12)add(box(Math.min(.12,w/2-x),.035,.27,x+Math.min(.12,w/2-x)/2,.48,.13),Math.round((x+w/2)/.12)%2?accent:'#e0d8bf');
      add(box(w,.08,.035,0,.56,.025),accent);
      if(!signs.some(s=>s.zone===o.zone))signs.push({...a,width:w,zone:o.zone});
    } else add(box(.45,.035,.20,0,.45,.07),'#8d9996');
    const wPath=.27,len=a.distance;
    parts.push([box(Math.abs(a.tx-a.x)>.01?len:wPath,.012,Math.abs(a.tz-a.z)>.01?len:wPath,(a.x+a.tx)/2,.012,(a.z+a.tz)/2),'#c2bead',.06]);
    entrances.push({...a,zone:o.zone,commercial});
  }
  async function build(pause) {
    const p=[],all=solids(),commercial=new Set(['shops','shoplots','market','minimart','clinic','health','hall','mall','foodcourt','hub']);
    const inhabited=new Set(['buildings','homes','houses','villas','condo','township','townhouses','suburb','command','gov','school',...commercial]);
    const cityBlocks=blocks.filter(b=>b.x0>=0&&b.y0>=0&&b.x1<=WORLD&&b.y1<=WORLD);
    for(let i=0;i<cityBlocks.length;i++) {
      const b=cityBlocks[i];p.push([paving(b),b.kind==='plaza'?'#bcbdb5':'#b1b3a7',.08]);
      // Paving joints, drain grilles and tactile corner pads stay outside the driving lanes.
      for(const x of [b.x0+.14,b.x1-.14]) for(const z of [b.y0+.14,b.y1-.14])p.push([box(.15,.004,.15,x,.028,z),'#c9b677',.06]);
      for(const z of [b.y0-.075,b.y1+.075]) {
        const x=(b.x0+b.x1)/2;p.push([box(.22,.004,.075,x,.028,z),'#526268',.2]);
        for(let k=-.08;k<=.08;k+=.04)p.push([box(.012,.004,.06,x+k,.031,z),'#9aaba9',.3]);
      }
      for(let x=b.x0+.6;x<b.x1-.3;x+=.8) for(const z of [b.y0+.11,b.y1-.11])p.push([box(.008,.002,.32,x,.027,z),'#949e98']);
      for(let z=b.y0+.6;z<b.y1-.3;z+=.8) for(const x of [b.x0+.11,b.x1-.11])p.push([box(.32,.002,.008,x,.027,z),'#949e98']);
      if(inhabited.has(b.zone)) for(const o of all.filter(o=>o.x0>=b.x0&&o.x1<=b.x1&&o.y0>=b.y0&&o.y1<=b.y1)) {
        const a=frontage(o,b,all);if(a)entry(p,o,a,commercial.has(o.zone));
      }
      if(i%10===9){baked(p.splice(0));await pause();}   // bake in chunks: one giant merge froze the page for ~180 ms
    }
    if(p.length)baked(p);await pause();buildSigns();buildStops();buildPeople();built=true;
  }
  function buildSigns() {
    if(!signs.length)return;
    const names={shops:'LOCAL SHOPS',shoplots:'NEIGHBOURHOOD SHOPS',market:'MARKET',minimart:'GROCER',clinic:'CLINIC',health:'HOSPITAL',hall:'COMMUNITY HALL',mall:'CITY MALL',foodcourt:'FOOD COURT',hub:'TRANSIT HUB'};
    const cv=document.createElement('canvas');cv.width=512;cv.height=64*signs.length;const ctx=cv.getContext('2d'),positions=[],uvs=[];
    signs.forEach((s,i)=>{
      ctx.fillStyle='#f3eee0';ctx.font='600 28px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(names[s.zone]||'WELCOME',256,i*64+32,490);
      const g=new T.PlaneGeometry(s.width*.92,.07).rotateY(s.yaw).translate(s.x+Math.sin(s.yaw)*.046,.56,s.z+Math.cos(s.yaw)*.046).toNonIndexed();
      positions.push(...g.attributes.position.array);
      const u=g.attributes.uv.array;for(let j=0;j<u.length;j+=2)uvs.push(u[j],1-(i+1-u[j+1])/signs.length);g.dispose();
    });
    const tex=new T.CanvasTexture(cv);tex.encoding=T.sRGBEncoding;
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
    scene.add(new T.Mesh(g,new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide})));
  }
  function buildStops() {
    const p=[];
    for(const o of objs.filter(o=>o.t==='busstop')) {
      const x=o.cx,z=o.cy,back=o.flip?-.15:.15;
      p.push([box(1.32,.035,.48,x,.49,z),'#526b70',.35],[box(1.2,.31,.025,x,.30,z+back),'#7599a2',.6],
        [box(.76,.025,.14,x,.09,z+back*.4),'#927e62'],[box(.76,.09,.025,x,.14,z+back*.8),'#927e62']);
      for(const dx of [-.57,.57])p.push([box(.025,.48,.025,x+dx,.24,z+back),'#63777c',.4]);
      p.push([box(.025,.62,.025,x+.76,.31,z),'#617579',.3],[box(.15,.13,.035,x+.76,.57,z),'#386e7c',.3]);
      stops.push({x,z,flip:o.flip||0,zone:o.zone});
    }
    baked(p);
  }
  function buildPeople() {
    people=model([[box(.065,.105,.07,0,.167,0),null,.06],[ball(.036,0,.255,0),'#b48666',.06],
      [box(.023,.09,.021,0,.16,-.052),'#b48666'],[box(.023,.09,.021,0,.16,.052),'#b48666']],128);
    legs=model([[box(.026,.11,.027,0,-.055,0),'#344650',.04]],256);
    parcels=model([[box(.065,.065,.065,.065,.145,0),'#b89b70',.04]],32);
    gangway=model([[box(.55,.035,.23,0,0,0),'#afbbb7',.3]],1);
    entrances.filter(e=>e.commercial&&e.distance>.30).filter((e,i)=>i%2===0).slice(0,22).forEach((e,i)=>visitors.push({entry:e,phase:i*3.7,cycle:27+i%4*3,parcel:i%5===0}));
  }
  function person(x,z,h,yaw,shirt,moving,t,index,parcel=false) {
    const bob=moving?Math.abs(Math.sin(t*8+index))*.004:0;put(people,x,z,h+bob,yaw,shirt);
    for(const s of [-1,1]) {
      const dx=Math.sin(yaw)*s*.022,dz=Math.cos(yaw)*s*.022;
      put(legs,x+dx,z+dz,h+.122,yaw,'#fff',1,0,0,moving?Math.sin(t*8+index)*.30*s:0);
    }
    if(parcel)put(parcels,x,z,h,yaw);
  }
  function update(t,n,dt) {
    if(!built)return;
    for(const m of [people,legs,parcels,gangway])m.n=0;
    waiting=boarding=walking=inside=0;
    visitors.forEach((v,i)=>{
      if(n>.65&&i%3!==0)return;
      const e=v.entry,u=(t+v.phase)%v.cycle,travel=Math.max(2.5,e.distance/.32);
      let f,moving=true;
      if(u<2){f=0;moving=false;waiting++;}
      else if(u<2+travel){f=(u-2)/travel;walking++;}
      else if(u<v.cycle-travel-2){inside++;return;}
      else if(u<v.cycle-2){f=(v.cycle-2-u)/travel;walking++;}
      else {f=0;moving=false;waiting++;}
      const returning=u>2+travel,yaw=Math.atan2(-(returning?e.tz-e.z:e.z-e.tz),returning?e.tx-e.x:e.x-e.tx);
      person(mix(e.tx,e.x,clamp(f)),mix(e.tz,e.z,clamp(f)),.027,yaw,palette[i%4],moving,t,i,v.parcel&&!returning);
    });
    const bus=cars.find(c=>c.bus&&c.ax==='x'&&Math.abs(c.lane-BUS_LANE)<.02&&Math.abs(c.pos-BUS_STOP_X)<.6&&c.v<.12)||null;
    if(bus!==busAt){if(bus)busSince=t;else refillSince=t;busAt=bus||null;}
    stops.forEach((s,j)=>{
      const main=Math.abs(s.x-BUS_STOP_X)<.01&&Math.abs(s.z-15.65)<.01;
      for(let i=0;i<3;i++) {
        let x=s.x-.35+i*.22,z=s.z-(s.flip?-.05:.05),h=.027,moving=false;
        if(main&&bus){const f=clamp((t-busSince-i*.65)/.65);if(f>=1)continue;x=mix(x,bus.pos-.20,f);z=mix(z,BUS_LANE+.19,f);h=mix(h,.11,f);moving=f>0;if(moving)boarding++;else waiting++;}
        else {if(main){const f=clamp((t-refillSince-i*.7)/4);x=mix(s.x-1.4,x,f);moving=f<1;}if(moving)walking++;else waiting++;}
        person(x,z,h,s.flip?-Math.PI/2:Math.PI/2,palette[(i+j)%4],moving,t,40+j*3+i);
      }
    });
    const active=WX.cur()==='storm'?-1:FERRY.at;
    if(active!==ferryAt){ferryAt=active;ferrySince=t;}
    FERRY.stops.forEach(([,z,side],j)=>{
      const east=side==='E',start=east?RIVER.x1+.35:RIVER.x0-.35,end=east?-10.73:-11.67;
      if(active===j)put(gangway,east?-10.46:-11.80,z,.16);
      for(let i=0;i<3;i++){
        const f=active===j?clamp((t-ferrySince-i*.8)/1.8):0;if(f>=1)continue;
        const x=mix(start,end,f),y=mix(z-.28+i*.20,z,f);if(f>0)boarding++;else waiting++;
        person(x,y,.027+f*.14,east?Math.PI:0,palette[(j+i+1)%4],f>0,t,65+j*3+i);
      }
    });
    for(const m of [people,legs,parcels,gangway])flush(m);
  }
  return {build,update,get stats(){return {ready:built,entrances:entrances.length,visitors:visitors.length,stops:stops.length,waiting,boarding,walking,inside,dimensions:size};}};
};

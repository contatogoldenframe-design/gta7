/* ============ MOTOR DO JOGO, AVIAÇÃO INICIAL, CLIMA E LOOP ============ */
(function(){
  const G7=window.G7, THREE=window.THREE;

  /* ---------- render + câmera ---------- */
  const renderer=G7.renderer=new THREE.WebGLRenderer({
    canvas:document.getElementById('cv'), antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  G7.camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.5,40000);
  addEventListener('resize',()=>{
    G7.camera.aspect=innerWidth/innerHeight;
    G7.camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });

  /* ---------- entrada ---------- */
  const inp={f:0,b:0,l:0,r:0,space:0,shift:0,e:0};
  addEventListener('keydown',e=>{
    const k=e.key.toLowerCase();
    if(k==='w'||k==='arrowup')inp.f=1;
    if(k==='s'||k==='arrowdown')inp.b=1;
    if(k==='a'||k==='arrowleft')inp.l=1;
    if(k==='d'||k==='arrowright')inp.r=1;
    if(k===' ')inp.space=1;
    if(k==='shift')inp.shift=1;
    if(k==='e')inp.e=1;
    if(k==='m'){G7.mapaAberto?G7.closeMap():G7.openMap();G7.mapaAberto=!G7.mapaAberto;}
    if(k==='f'&&G7.player.inCar&&!G7.flyLock)G7.flyLock=true;
    e.preventDefault();
  });
  addEventListener('keyup',e=>{
    const k=e.key.toLowerCase();
    if(k==='w'||k==='arrowup')inp.f=0;
    if(k==='s'||k==='arrowdown')inp.b=0;
    if(k==='a'||k==='arrowleft')inp.l=0;
    if(k==='d'||k==='arrowright')inp.r=0;
    if(k===' ')inp.space=0;
    if(k==='shift')inp.shift=0;
    if(k==='e')inp.e=0;
    if(k==='f'){G7.flyLock=false;}
    if(k==='r'){G7.spawnPlayer(G7.player.city);G7.toast('Respawn no centro de '+G7.player.city.nome);}
  });

  /* ---------- áudio (WebAudio, sem arquivos) ---------- */
  function audio(){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return null;
    const ctx=new AC(), master=ctx.createGain();
    master.gain.value=.25; master.connect(ctx.destination);
    /* motor */
    const eng=ctx.createOscillator(), eg=ctx.createGain();
    eng.type='sawtooth'; eng.frequency.value=60;
    const filt=ctx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=300;
    eng.connect(filt).connect(eg).connect(master); eg.gain.value=0;
    eng.start();
    /* chuva */
    const nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
    const d=nb.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const noise=ctx.createBufferSource(); noise.buffer=nb; noise.loop=true;
    const ng=ctx.createGain(); ng.gain.value=0;
    const nf=ctx.createBiquadFilter(); nf.type='highpass'; nf.frequency.value=900;
    noise.connect(nf).connect(ng).connect(master); noise.start();
    return {ctx,eg,ng,setEngine:function(s){eg.gain.value=Math.min(.5,s*.006);},
      setRain:function(v){ng.gain.value=Math.min(.5,v*.5);},
      thunder:function(){
        if(ctx.state==='suspended')ctx.resume();
        const buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
        const bd=buf.getChannelData(0);
        for(let i=0;i<bd.length;i++)bd[i]=(Math.random()*2-1)*Math.pow(1-i/bd.length,2.2);
        const src=ctx.createBufferSource(); src.buffer=buf;
        const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=160;
        const g=ctx.createGain(); g.gain.value=1.2;
        src.connect(f).connect(g).connect(master); src.start();
      }};
  }
  G7.sfx=null;

  /* ---------- chuva ---------- */
  function makeRain(){
    G7.rainGeo=new THREE.BufferGeometry();
    const N=900,pos=new Float32Array(N*3),vel=new Float32Array(N);
    for(let i=0;i<N;i++){pos[i*3]=Math.random()*2-1;pos[i*3+1]=Math.random()*2-1;pos[i*3+2]=Math.random()*2-1;vel[i]=40+Math.random()*30;}
    G7.rainGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    G7.rainVel=vel;
    G7.rain=new THREE.Points(G7.rainGeo,
      new THREE.PointsMaterial({color:0x9fc4ff,size:0.35,transparent:true,opacity:0}));
    G7.scene.add(G7.rain);
  }
  function updateRain(dt){
    const w=G7.W;
    const on=w&&w.rain>0;
    G7.rain.material.opacity=on?Math.min(1,w.rain*0.45):0;
    if(on){
      const a=G7.rainGeo.attributes.position.array;
      for(let i=0;i<a.length/3;i++){
        a[i*3+1]-=G7.rainVel[i]*dt;
        a[i*3]-=6*dt; a[i*3+2]-=8*dt;
        const R=420;
        if(a[i*3+1]<G7.camera.position.y-R){
          a[i*3+1]=G7.camera.position.y+R;
          a[i*3]=G7.camera.position.x+(Math.random()-.5)*R;
          a[i*3+2]=G7.camera.position.z+(Math.random()-.5)*R;
        }
      }
      G7.rainGeo.attributes.position.needsUpdate=true;
    }
    G7.rain.position.set(G7.camera.position.x,G7.camera.position.y,G7.camera.position.z);
  }

  /* ---------- céu / dia e noite ---------- */
  G7.updateSky=function(){
    const w=G7.W,h=w?w.hour:12;
    const day=w?w.day:(h>=6&&h<18);
    let r,g,b;
    if(day){r=.53;g=.72;b=.91;}
    else{r=.02;g=.04;b=.09;}
    if(h>=17&&h<19){r=.85;g=.45;b=.22;}
    if(h>=5&&h<7){r=.9;g=.55;b=.3;}
    G7.scene.background=new THREE.Color(r,g,b);
    G7.scene.fog=new THREE.Fog(new THREE.Color(r*.6,g*.75,b*.9),600,6500);
    G7.sun.intensity=day?1.4:0.15;
  };

  /* ---------- avião da abertura ---------- */
  function startIntro(city){
    const P=G7.player;
    G7.intro={city,t:0};
    const g=G7.intro.plane=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(8,3,30),new THREE.MeshLambertMaterial({color:0xdddddd})));
    g.children[0].position.y=2;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(24,.4,6),new THREE.MeshLambertMaterial({color:0xbbbbbb})));
    g.children[1].position.y=4;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(6,3,4),new THREE.MeshLambertMaterial({color:0xcc3333})));
    g.children[2].position.set(0,5,-14);
    const ang=Math.random()*6.28;
    G7.intro.start=new THREE.Vector3(city.x+Math.sin(ang)*2600,900,city.z+Math.cos(ang)*2600);
    const target=new THREE.Vector3(city.x+city.r*.35,120,city.z);
    G7.intro.dir=target.clone().sub(G7.intro.start).normalize();
    g.position.copy(G7.intro.start);
    g.lookAt(target);
    G7.scene.add(g);
    document.getElementById('avisoA').style.display='block';
    G7.toast('EMBARQUE: vôo para '+city.nome.toUpperCase()+', '+city.uf, 4000);
  }
  function updateIntro(dt){
    const it=G7.intro;
    it.plane.position.addScaledVector(it.dir,130*dt);
    it.plane.rotation.x+=dt*.6; it.plane.rotation.z=Math.sin(it.t*2)*.4;
    it.t+=dt;
    G7.camera.position.copy(it.plane.position).add(new THREE.Vector3(0,22,32));
    G7.camera.lookAt(it.plane.position);
    if(it.t>11||it.plane.position.y<250){
      /* paraquedas */
      G7.intro.parachute=true;
      G7.camera.position.set(G7.player.pos.x,220,G7.player.pos.z);
      it.pT=0;
    }
    if(G7.intro.parachute){
      it.pT+=dt;
      const y=Math.max(1.5,220-it.pT*55);
      G7.camera.position.set(G7.player.pos.x,y,G7.player.pos.z);
      G7.camera.lookAt(G7.player.pos.x,1,G7.player.pos.z);
      G7.player.pos.y=y;
      if(y<=1.6){
        G7.intro=null;
        document.getElementById('avisoA').style.display='none';
        G7.spawnPlayer(it.city);
        G7.toast('Bem-vindo(a) a '+it.city.nome+' • '+it.city.uf+'!');
      }
    }
  }

  /* ---------- início do jogo ---------- */
  G7.startGame=function(cityId){
    const city=G7.byId[cityId];
    if(!city)return;
    document.getElementById('menu').style.display='none';
    document.getElementById('hud').style.display='block';
    document.getElementById('loading').style.display='flex';
    document.getElementById('loadTxt').textContent='CONSTRUINDO O BRASIL (clima real)...';
    G7.loadWeather().then(()=>{
      G7.buildWorld();
      makeRain();
      G7.scene.fog=new THREE.Fog(0x87b8e8,600,6500);
      G7.spawnPlayer(city);
      G7.started=true;
      G7.loadTxtC=city;
      document.getElementById('loading').style.display='none';
      if(G7.sfx)G7.sfx.ctx.resume();
      startIntro(city);
    });
  };

  /* ---------- loop ---------- */
  let last=performance.now();
  function loop(now){
    requestAnimationFrame(loop);
    let dt=Math.min(.05,(now-last)/1000); last=now;
    if(G7.started){
      if(!G7.sfx)G7.sfx=audio();
      if(G7.intro){updateIntro(dt);renderer.render(G7.scene,G7.camera);return;}
      G7.updateWeather();
      G7.updateSky();
      G7.updatePlayer(dt,inp);
      G7.updateTraffic(dt);
      if(G7.mission)G7.updateMission(dt);
      updateRain(dt);
      /* estrelas caem se parar de cometer crimes */
      const P=G7.player;
      if(P.wanted>0&&Date.now()-P.crimeT>20000){
        P.starT+=dt;
        if(P.starT>6){P.starT=0;P.wanted=Math.max(0,P.wanted-1);if(!P.wanted)G7.toast('Você perdeu a polícia');}
      }else P.starT=0;
      if(G7.sfx){
        G7.sfx.setEngine(P.inCar?Math.abs(P.speed)/60:0);
        G7.sfx.setRain(G7.W.rain||0);
        if(Math.random()<.0015&&G7.W.thunder){G7.flash();G7.sfx.thunder();}
      }
      /* câmera */
      const P3=G7.player;
      if(P3.inCar){
        const bx=Math.sin(P3.heading),bz=Math.cos(P3.heading);
        G7.camera.position.set(P3.carPos.x-bx*26,P3.flying?P3.flyY+14:10,P3.carPos.z-bz*26);
        G7.camera.lookAt(P3.carPos.x,P3.flying?P3.flyY-4:2,P3.carPos.z);
      }else{
        const bx=Math.sin(P3.heading),bz=Math.cos(P3.heading);
        G7.camera.position.set(P3.pos.x-bx*10,4,P3.pos.z-bz*10);
        G7.camera.lookAt(P3.pos.x,1.6,P3.pos.z);
      }
      G7.updateHUD();
      G7.drawMinimap();
    }
    renderer.render(G7.scene,G7.camera);
  }
  requestAnimationFrame(loop);

  /* salvar a cada 60s */
  setInterval(()=>{if(G7.started)G7.save();},60000);

  G7.initUI();
  document.getElementById('btnCloseMap').onclick=()=>{G7.closeMap();G7.mapaAberto=false;};
})();

/* ============ TRÂNSITO, PEDESTRES, POLÍCIA E CARROS VOADORES ============ */
(function(){
  const G7=window.G7, THREE=window.THREE;

  G7.traffic={cars:[],peds:[],police:[],uavs:[],t:0};

  function mkPed(){
    const g=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(.5,1.5,.3),
      new THREE.MeshLambertMaterial({color:[0xd98a5f,0x5f9ed9,0x8fd96a,0xd9c95f][(Math.random()*4)|0]})));
    g.children[0].position.y=.75;
    g.children[0].material.flatShading=true;
    return g;
  }

  /* carro de trânsito com rota em grade */
  function mkCar(city){
    const c=G7.makeCar([0xdd4444,0x4488dd,0x44dd88,0xcccc44,0xaaaaaa,0x8844dd][(Math.random()*6)|0],'car');
    c.userData={city,axis:'x',dir:1, dist:0, speed:18+Math.random()*8};
    return c;
  }
  function mkPolice(){
    const c=G7.makeCar(0x0b1030,'police');
    c.userData={speed:34}; return c;
  }
  function mkUav(){
    const g=new THREE.Group();
    const b=new THREE.Mesh(new THREE.BoxGeometry(3,.8,1.6),
      new THREE.MeshBasicMaterial({color:[0x00ffe5,0xff00d4,0xffaa00][(Math.random()*3)|0]}));
    b.position.y=.4; g.add(b);
    g.userData={a:Math.random()*6.28, h:35+Math.random()*35, r:350+Math.random()*350, sp:20+Math.random()*15};
    return g;
  }

  G7.updateTraffic=function(dt){
    const t=G7.traffic, city=G7.player.city;
    if(!city)return;
    /* garante quantidades perto do jogador */
    while(t.cars.length<16){
      const c=mkCar(city);
      c.position.set(city.x+(Math.random()*2-1)*city.r, .5, city.z+(Math.random()*2-1)*city.r);
      G7.scene.add(c); t.cars.push(c);
    }
    while(t.peds.length<12){
      const p=mkPed();
      p.position.set(city.x+(Math.random()*2-1)*city.r, 0, city.z+(Math.random()*2-1)*city.r);
      G7.scene.add(p); t.peds.push(p);
    }
    while(t.uavs.length<4){ const u=mkUav(); G7.scene.add(u); t.uavs.push(u); }

    /* movimento dos carros em grade */
    for(const c of t.cars){
      const u=c.userData, B=56;
      u.dist+=u.speed*dt;
      if(u.axis==='x'){ c.position.x+=u.dir*u.speed*dt; if(u.dist>B){u.axis='z';u.dist=0;u.dir=Math.random()<.5?-1:1;c.rotation.y=u.dir===1?Math.PI/2:3*Math.PI/2;} }
      else            { c.position.z+=u.dir*u.speed*dt; if(u.dist>B){u.axis='x';u.dist=0;u.dir=Math.random()<.5?-1:1;c.rotation.y=u.dir===1?0:Math.PI;} }
      c.position.y=.5;
    }
    /* pedestres caminhando */
    for(const p of t.peds){
      p.position.x+=Math.sin(p.userData||(p.userData={a:Math.random()*6.28,sp:1+Math.random()}).a)*p.userData.sp*dt*.6;
      p.position.z+=Math.cos(p.userData.a)*p.userData.sp*dt*.6;
      if(Math.random()<.004)p.userData.a=Math.random()*6.28;
      p.position.y=0;
      const cx=G7.player.inCar?G7.player.carPos.x:G7.player.pos.x;
      const cz=G7.player.inCar?G7.player.carPos.z:G7.player.pos.z;
      const d=(p.position.x-cx)**2+(p.position.z-cz)**2;
      if(d<9&&d>0.01){
        const ang=Math.atan2(p.position.x-cx,p.position.z-cz);
        p.position.x+=Math.sin(ang)*12*dt; p.position.z+=Math.cos(ang)*12*dt;
        if(G7.player.speed>12&&G7.player.inCar){
          G7.addWanted(1);
        }
      }
    }
    /* carros voadores */
    for(const u of t.uavs){
      u.userData.a+=dt*.4;
      u.position.set(
        city.x+Math.cos(u.userData.a)*u.userData.r,
        u.userData.h+Math.sin(u.userData.a*1.7)*10,
        city.z+Math.sin(u.userData.a)*u.userData.r);
      u.rotation.y=dt;
    }
    /* polícia persegue o jogador */
    if(G7.player.wanted>0){
      while(t.police.length<G7.player.wanted){
        const p=mkPolice();
        p.position.set(G7.player.pos.x+60,0.5,G7.player.pos.z+60);
        G7.scene.add(p); t.police.push(p);
      }
      const tx=G7.player.inCar?G7.player.carPos.x:G7.player.pos.x;
      const tz=G7.player.inCar?G7.player.carPos.z:G7.player.pos.z;
      for(const p of t.police){
        const dx=tx-p.position.x, dz=tz-p.position.z;
        const d=Math.hypot(dx,dz)||1;
        const want=Math.atan2(dx,dz);
        let dif=want-p.rotation.y;
        while(dif>Math.PI)dif-=2*Math.PI; while(dif<-Math.PI)dif+=2*Math.PI;
        p.rotation.y+=dif*Math.min(1,3*dt);
        const sp=Math.min(p.userData.speed,d*2);
        p.position.x+=Math.sin(p.rotation.y)*sp*dt;
        p.position.z+=Math.cos(p.rotation.y)*sp*dt;
        p.position.y=.5;
        if(d<40)G7.addWanted(1);
      }
    } else {
      while(t.police.length){ const p=t.police.pop(); G7.scene.remove(p); }
    }
  };

  G7.addWanted=function(n){
    const P=G7.player;
    P.wanted=Math.min(5,P.wanted+n);
    P.crimeT=Date.now();
  };
})();

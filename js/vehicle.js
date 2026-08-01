/* ============ GTA 7 — BRASIL | JOGADOR, CARRO E FÍSICA ============ */
(function(){
  const G7=window.G7, THREE=window.THREE;

  /* ---- fábrica de carros (civil, táxi, polícia) ---- */
  G7.makeCar=function(color,kind){
    const g=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(4.4,1,8.2),
      new THREE.MeshLambertMaterial({color})));
    g.children[0].position.y=1;
    const cab=new THREE.Mesh(new THREE.BoxGeometry(3.6,.9,4),
      new THREE.MeshLambertMaterial({color:0x14181f}));
    cab.position.set(0,1.9,-.6); g.add(cab);
    const wm=new THREE.MeshLambertMaterial({color:0x111111});
    [[-1.7,2.6],[1.7,2.6],[-1.7,-2.6],[1.7,-2.6]].forEach(pr=>{
      const w=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.5,10),wm);
      w.rotation.z=Math.PI/2; w.position.set(pr[0],.55,pr[1]); g.add(w);
    });
    const hl=new THREE.Mesh(new THREE.BoxGeometry(1,.25,.1),
      new THREE.MeshBasicMaterial({color:0xdffcff}));
    hl.position.set(-1.2,1.1,4.1); g.add(hl);
    const hl2=hl.clone(); hl2.position.x=1.2; g.add(hl2);
    if(kind==='police'){
      const a=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),
        new THREE.MeshBasicMaterial({color:0xff3344})); a.position.set(0,2.2,4); g.add(a);
      const b=a.clone(); b.material=new THREE.MeshBasicMaterial({color:0x3344ff}); b.position.set(0,2.2,-4); g.add(b);
    }
    if(kind==='taxi'){
      const t=new THREE.Mesh(new THREE.BoxGeometry(1.2,.25,.25),
        new THREE.MeshBasicMaterial({color:0xffd700})); t.position.set(0,2.3,1.2); g.add(t);
    }
    return g;
  };

  G7.playerMesh=function(){
    const g=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(.45,.5,1.7,8),
      new THREE.MeshLambertMaterial({color:0x2b7cff})));
    g.children[0].position.y=.85;
    g.add(new THREE.Mesh(new THREE.SphereGeometry(.42,8,8),
      new THREE.MeshLambertMaterial({color:0xf2c9a0})));
    g.children[1].position.y=1.85;
    return g;
  };

  const P=G7.player={
    pos:new THREE.Vector3(), heading:0, speed:0, yawSpeed:0,
    mode:'walk', flying:false, inCar:false, wanted:0,
    crimeT:0, starT:0, nitro:1, walkY:0
  };

  G7.spawnPlayer=function(city){
    P.city=city; P.wanted=0;
    P.pos.set(city.x+12,.5,city.z+14); P.heading=0; P.speed=0;
    P.mode='walk'; P.inCar=false; P.flying=false;
    if(P.mesh)G7.scene.remove(P.mesh);
    P.mesh=G7.playerMesh(); P.mesh.position.copy(P.pos); G7.scene.add(P.mesh);
    if(P.car)G7.scene.remove(P.car);
    P.car=G7.makeCar(city.cap?0xff3355:0x33aaff,'taxi');
    P.carPos=new THREE.Vector3(city.x+18,.5,city.z+14);
    P.carH=0; P.speed=0;
    P.car.position.copy(P.carPos); G7.scene.add(P.car);
    G7.updateWeather();
  };

  function collide(px,pz,r){
    for(const c of G7.colliders){
      if(px+r>c.x-c.hx&&px-r<c.x+c.hx&&pz+r>c.z-c.hz&&pz-r<c.z+c.hz){
        c.hit=Date.now();
        const ox=(px<c.x)?(px+r-(c.x-c.hx)):((c.x+c.hx)-(px-r));
        const oz=(pz<c.z)?(pz+r-(c.z-c.hz)):((c.z+c.hz)-(pz-r));
        if(ox<oz){ px+=px<c.x?-ox:ox; if(!P.flying)P.speed=Math.min(P.speed,4); }
        else     { pz+=pz<c.z?-oz:oz; if(!P.flying)P.speed=Math.min(P.speed,4); }
      }
    }
    return [px,pz];
  }

  G7.enterCar=function(){
    const dx=P.carPos.x-P.pos.x, dz=P.carPos.z-P.pos.z;
    if(dx*dx+dz*dz<49){
      P.mode='drive'; P.inCar=true; P.flying=false;
      P.speed=0; P.mesh.visible=false;
      P.heading=P.carH;
      G7.toast('ENTROU NO CARRO • F = MODO VOO');
    }
  };
  G7.exitCar=function(){
    P.mode='walk'; P.inCar=false;
    P.pos.set(P.carPos.x+4,.5,P.carPos.z+4);
    P.mesh.visible=true; P.mesh.position.copy(P.pos);
    G7.toast('Saiu do carro');
  };

  G7.updatePlayer=function(dt,inp){
    const k=inp, fwd=(k.f?1:0)-(k.b?1:0);
    if(P.mode==='walk'){
      if(k.l)P.heading+=2.4*dt; if(k.r)P.heading-=2.4*dt;
      P.speed+=fwd*14*dt;
      P.speed*=Math.max(0,1-6*dt);
      P.speed=Math.max(-4,Math.min(7,P.speed));
      P.pos.x+=Math.sin(P.heading)*P.speed*dt;
      P.pos.z+=Math.cos(P.heading)*P.speed*dt;
      P.pos.y=.5;
      P.mesh.position.set(P.pos.x,P.pos.y,P.pos.z);
      P.mesh.rotation.y=Math.PI-P.heading;
      const dx=P.carPos.x-P.pos.x,dz=P.carPos.z-P.pos.z;
      if(k.e&&dx*dx+dz*dz<49)G7.enterCar();
    }
    else if(P.mode==='drive'){
      if(k.l)P.heading+=2.2*dt*(1-P.speed/60);
      if(k.r)P.heading-=2.2*dt*(1-P.speed/60);
      const acc=(k.f?1:0)*30-(k.b?1:0)*38;
      P.speed+=acc*dt;
      P.speed*=Math.max(0,1-1.4*dt);
      P.speed=Math.max(-18,Math.min(46,P.speed));
      if(k.shift&&P.speed>5){
        P.nitro=Math.max(0,P.nitro-0.45*dt);
        P.speed+=32*dt;
        P.speed=Math.min(92,P.speed);
      }else P.nitro=Math.min(1,P.nitro+0.16*dt);
      if(k.space&&P.speed>2)P.speed*=Math.max(0,1-6*dt);
      let nx=P.carPos.x+Math.sin(P.heading)*P.speed*dt;
      let nz=P.carPos.z+Math.cos(P.heading)*P.speed*dt;
      [nx,nz]=collide(nx,nz,2.3);
      P.carPos.set(nx,.5,nz);
      P.car.position.copy(P.carPos);
      P.car.rotation.y=Math.PI-P.heading;
      if(k.e)G7.exitCar();
      if(k.f&&P.speed>10){P.mode='fly';P.flying=true;P.flyY=30;G7.toast('MODO VOO ATIVADO!');}
    }
    else if(P.mode==='fly'){
      if(k.l)P.heading+=1.3*dt; if(k.r)P.heading-=1.3*dt;
      P.speed+=fwd*26*dt;
      P.speed*=Math.max(0,1-.4*dt);
      P.speed=Math.max(0,Math.min(110,P.speed));
      if(k.space)P.flyY+=38*dt;
      if(k.shift)P.flyY-=30*dt;
      P.flyY=Math.max(5,Math.min(160,P.flyY));
      P.carPos.x+=Math.sin(P.heading)*P.speed*dt;
      P.carPos.z+=Math.cos(P.heading)*P.speed*dt;
      [P.carPos.x,P.carPos.z]=collide(P.carPos.x,P.carPos.z,2);
      P.car.position.set(P.carPos.x,P.flyY,P.carPos.z);
      P.car.rotation.y=Math.PI-P.heading;
      if(k.f&&P.flyY<12){
        P.mode='drive';P.flying=false;P.carPos.y=.5;
        G7.toast('POUSOU • F = VOAR');
      }
    }
    P.walkY=Math.sin(Date.now()/250)*.02;
  };
})();

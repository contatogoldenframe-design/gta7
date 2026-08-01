/* ============ MISSÕES: CORRIDA E ENTREGA ENTRE CIDADES ============ */
(function(){
  const G7=window.G7, THREE=window.THREE;

  G7.mkRing=function(color,r){
    const m=new THREE.Mesh(new THREE.TorusGeometry(r||9,1.2,8,24),
      new THREE.MeshBasicMaterial({color}));
    m.rotation.x=Math.PI/2; return m;
  };

  G7.mission=null;

  G7.startRace=function(city){
    G7.mission={type:'race',city,idx:0,reward:600,time:300,pts:[]};
    const B=city.cap?5:3, r=city.r*.6;
    for(let i=0;i<5;i++){
      const a=i/5*Math.PI*2;
      G7.mission.pts.push({x:city.x+Math.cos(a)*r*(.6+Math.random()*.4),
                           z:city.z+Math.sin(a)*r*(.6+Math.random()*.4)});
    }
    G7.mission.rings=[];
    G7.mission.pts.forEach(p=>{
      const ring=G7.mkRing(0x00ffaa,11);
      ring.position.set(p.x,3,p.z); G7.scene.add(ring); G7.mission.rings.push(ring);
    });
    G7.toast('CORRIDA INICIADA! PASSE POR TODOS OS ANÉIS VERDES');
  };

  G7.startDelivery=function(city){
    let target=null,bd=Infinity;
    G7.CITIES.forEach(c=>{
      if(c.cap&&c!==city){
        const d=(c.x-city.x)**2+(c.z-city.z)**2;
        if(d<bd){bd=d;target=c;}
      }
    });
    if(!target)return;
    G7.mission={type:'delivery',city,target,time:Math.max(120,bd**.5/40*60),reward:Math.round(300+bd**.5*.8)};
    G7.mission.ring=G7.mkRing(0xffaa00,14);
    G7.mission.ring.position.set(target.x,3,target.z);
    G7.scene.add(G7.mission.ring);
    G7.toast('ENTREGA: LEVE A CARGA ATÉ '+target.nome.toUpperCase()+'!');
  };

  G7.updateMission=function(dt){
    const m=G7.mission;
    if(!m)return;
    m.time-=dt;
    if(m.time<=0){
      G7.failMission('TEMPO ESGOTADO!');
      return;
    }
    const px=G7.player.inCar?G7.player.carPos.x:G7.player.pos.x;
    const pz=G7.player.inCar?G7.player.carPos.z:G7.player.pos.z;
    if(m.type==='race'){
      const p=m.pts[m.idx];
      const d=(px-p.x)**2+(pz-p.z)**2;
      if(d<225){
        m.rings[m.idx].visible=false;
        m.idx++;
        if(m.idx>=m.pts.length){
          G7.finishMission();
        } else G7.toast('CHECKPOINT '+(m.idx+1)+' DE 5');
      }
    } else {
      const d=(px-m.ring.position.x)**2+(pz-m.ring.position.z)**2;
      if(d<625)G7.finishMission();
    }
  };

  G7.finishMission=function(){
    const m=G7.mission;
    if(!m)return;
    G7.money+=m.reward;
    G7.save();
    G7.clearMission();
    G7.toast('MISSÃO CONCLUÍDA! +R$ '+m.reward);
    if(G7.money>=99999)G7.toast('🏆 MILIONÁRIO!');
  };
  G7.failMission=function(msg){
    G7.clearMission();
    G7.toast(msg);
  };
  G7.clearMission=function(){
    const m=G7.mission;
    if(m){
      if(m.rings)m.rings.forEach(r=>G7.scene.remove(r));
      if(m.ring)G7.scene.remove(m.ring);
      G7.mission=null;
    }
  };
})();

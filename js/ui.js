/* ============ MENU, HUD, MINIMAPA E MAPA DO BRASIL ============ */
(function(){
  const G7=window.G7;

  /* ---- preenche o menu ---- */
  G7.initUI=function(){
    const selS=document.getElementById('selState'),
          selC=document.getElementById('selCity');
    G7.STATES.forEach(s=>{
      const o=document.createElement('option');
      o.value=s.uf; o.textContent=s.nome; selS.appendChild(o);
    });
    function fillCities(){
      selC.innerHTML='';
      G7.CITIES.filter(c=>c.uf===selS.value).forEach(c=>{
        const o=document.createElement('option');
        o.value=c.id; o.textContent=c.nome+(c.cap?' ★CAPITAL':'');
        selC.appendChild(o);
      });
    }
    selS.onchange=fillCities; fillCities();
    document.getElementById('btnStart').onclick=()=>{
      if(!selC.value)return;
      G7.startGame(selC.value);
    };
  };

  G7.toast=function(msg,ms){
    const t=document.getElementById('toast');
    t.textContent=msg; t.style.opacity=1;
    clearTimeout(t._h);
    t._h=setTimeout(()=>t.style.opacity=0,ms||2600);
  };
  G7.flash=function(){
    const f=document.getElementById('flash');
    f.style.opacity=.85;
    setTimeout(()=>f.style.opacity=0,110);
  };
  G7.fadeIn=function(cb){
    const f=document.getElementById('fade');
    f.style.opacity=1;
    setTimeout(cb,850);
  };
  G7.fadeOut=function(){
    document.getElementById('fade').style.opacity=0;
  };

  /* ---- HUD ---- */
  G7.updateHUD=function(){
    const P=G7.player, c=G7.cityNow;
    document.getElementById('hCity').textContent=P.city.nome+' - '+P.city.uf;
    document.getElementById('hSpeed').textContent=Math.round(Math.abs(P.speed)*3.6);
    document.getElementById('hStars').textContent='★'.repeat(P.wanted)+'☆'.repeat(5-P.wanted);
    document.getElementById('hMoney').textContent=P.money.toLocaleString('pt-BR');
    const bars=Math.round(P.nitro*5);
    document.getElementById('hNitro').textContent='NITRO '+'▮'.repeat(bars)+'▯'.repeat(5-bars);
    document.getElementById('hMode').textContent=P.inCar?(P.flying?'VOO':'CARRO'):'ANDANDO';
    if(c&&c.weather){
      const w=c.weather;
      const hh=Math.floor(w.hour), mm=Math.floor((w.hour%1)*60);
      document.getElementById('hTime').textContent=
        String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
      document.getElementById('hTemp').textContent=w.temp+'°C';
      document.getElementById('hWind').textContent=w.wind+' km/h';
    }
    const m=G7.mission;
    document.getElementById('objMissao').style.display=m?'block':'none';
    if(m){
      document.getElementById('objText').textContent=
        m.type==='race'?('CHECKPOINT '+(m.idx+1)+' DE 5')
        :('ENTREGUE A CARGA EM '+m.target.nome.toUpperCase());
      const mm=Math.floor(m.time/60), ss=Math.floor(m.time%60);
      document.getElementById('objTimer').textContent=mm+':'+String(ss).padStart(2,'0');
    }
  };

  /* ---- minimapa ---- */
  G7.drawMinimap=function(){
    const cv=document.getElementById('radar'), ctx=cv.getContext('2d');
    const S=90, size=cv.width;
    ctx.clearRect(0,0,size,size);
    ctx.save();
    ctx.translate(size/2,size/2);
    ctx.rotate(-G7.player.heading);
    ctx.fillStyle='rgba(30,60,110,.85)';
    ctx.strokeStyle='rgba(120,170,255,.5)';
    /* ruas da cidade atual */
    const city=G7.player.city, B=56;
    const r0=((city.x-G7.player.pos.x)/B|0), r1=((city.x+S+200)/B|0);
    for(let k=Math.floor((city.x-G7.player.pos.x-S)/B);k<Math.ceil((city.x-G7.player.pos.x+S)/B);k++){
      ctx.beginPath();ctx.moveTo(k*B-G7.player.pos.x+S,'-S');
      ctx.lineTo(k*B-G7.player.pos.x+S,'S*2');
    }
    /* versão simples: desenha grade centrada no jogador */
    ctx.strokeStyle='rgba(120,180,255,.4)';
    ctx.lineWidth=1;
    for(let g=-S;g<=S;g+=56){
      ctx.beginPath();ctx.moveTo(g,-S);ctx.lineTo(g,S);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-S,g);ctx.lineTo(S,g);ctx.stroke();
    }
    /* checkpoints da missão */
    if(G7.mission){
      ctx.fillStyle='#00ffaa';
      const m=G7.mission;
      if(m.type==='race'){
        const p=m.pts[m.idx];
        const dx=(p.x-G7.player.pos.x), dz=(p.z-G7.player.pos.z);
        if(dx*dx+dz*dz<S*S){ctx.beginPath();ctx.arc(Math.min(S,Math.max(-S,dx)),Math.min(S,Math.max(-S,dz)),6,0,7);ctx.fill();}
      } else if(m.ring){
        const dx=m.ring.position.x-G7.player.pos.x, dz=m.ring.position.z-G7.player.pos.z;
        if(dx*dx+dz*dz<S*S){ctx.fillStyle='#ffaa00';ctx.beginPath();ctx.arc(Math.min(S,Math.max(-S,dx)),Math.min(S,Math.max(-S,dz)),6,0,7);ctx.fill();}
      }
    }
    ctx.restore();
    /* seta do jogador */
    ctx.save();ctx.translate(size/2,size/2);
    ctx.rotate(-G7.player.heading);
    ctx.fillStyle='#ffd700';
    ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(7,8);ctx.lineTo(0,4);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();
    ctx.restore();
    ctx.fillStyle='#8df5ff';
    ctx.font='10px sans-serif'; ctx.fillText('N',size/2-3,12);
  };

  /* ---- mapa do Brasil (M) ---- */
  const OUTLINE=[
    [4.4,-51.9],[2.0,-51.0],[0.0,-51.07],[-2.5,-44.3],[-3.7,-38.5],[-7.15,-34.79],
    [-8.05,-34.88],[-11.0,-37.3],[-13.0,-38.55],[-15.5,-39.0],[-19.5,-39.7],
    [-20.3,-40.3],[-21.8,-41.0],[-22.9,-43.2],[-23.9,-46.3],[-25.5,-48.5],
    [-27.6,-48.5],[-29.3,-49.7],[-31.8,-52.3],[-33.75,-53.4],[-30.2,-56.6],
    [-27.4,-58.0],[-25.5,-54.6],[-24.0,-54.4],[-22.2,-57.9],[-20.5,-58.2],
    [-17.8,-58.5],[-15.0,-60.0],[-10.0,-65.0],[-9.5,-70.5],[-7.5,-73.0],
    [-4.2,-73.98],[-3.0,-71.9],[0.0,-70.0],[2.8,-60.7],[3.84,-51.95]
  ];
  G7.openMap=function(){
    document.getElementById('mapa').style.display='flex';
    doMap();
  };
  G7.closeMap=function(){document.getElementById('mapa').style.display='none';};

  function doMap(){
    const cv=document.getElementById('mapCanvas'), ctx=cv.getContext('2d');
    const W=cv.width,H=cv.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#041224';ctx.fillRect(0,0,W,H);
    /* contorno do Brasil */
    ctx.beginPath();
    OUTLINE.forEach((p,i)=>{
      const w=G7.proj(p[0],p[1]);
      const X=W/2+w.x/32, Y=H/2-w.z/32;
      i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);
    });
    ctx.closePath();
    ctx.fillStyle='rgba(38,84,60,.55)';ctx.fill();
    ctx.strokeStyle='#57ffa8';ctx.lineWidth=1.5;ctx.stroke();
    /* cidades */
    G7.CITIES.forEach(c=>{
      const X=W/2+c.x/32, Y=H/2-c.z/32;
      ctx.beginPath();
      ctx.arc(X,Y,c.cap?4:2,0,7);
      ctx.fillStyle=c.cap?'#ffd700':'#8df5ff';
      ctx.fill();
    });
    ctx.fillStyle='#8df5ff';ctx.font='12px sans-serif';
    ctx.fillText('MAPA DO BRASIL (escala 1:32)',10,20);
  }
  G7.teleport=function(city){
    G7.fadeIn(()=>{
      G7.clearMission();
      G7.spawnPlayer(city);
      G7.player.city=city;
      G7.save();
      G7.fadeOut();
      G7.toast('Você chega em '+city.nome+' • '+city.uf);
    });
  };
})();

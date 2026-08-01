/* ============ GTA 7 — BRASIL | MUNDO 3D COMPLETO ============ */
/* Terreno, oceano, ruas, rodovias BR, prédios neon, árvores, postes */
(function(){
  const G7 = window.G7;
  const THREE = window.THREE;

  /* ---- geometria mesclada: 1 draw call por material ---- */
  let verts=[], norms=[], uvs=[], cols=[];
  function flushGeo(mat){
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts),3));
    g.setAttribute('normal',   new THREE.BufferAttribute(new Float32Array(norms),3));
    g.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(uvs),2));
    if(cols.length) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cols),3));
    verts=[];norms=[];uvs=[];cols=[];
    return new THREE.Mesh(g, mat);
  }
  function addBox(cx,cy,cz,sx,sy,sz,yaw,col){
    const hx=sx/2,hy=sy/2,hz=sz/2,c=Math.cos(yaw),s=Math.sin(yaw);
    const V=[[-hx,-hy,-hz],[hx,-hy,-hz],[hx,hy,-hz],[-hx,hy,-hz],
             [-hx,-hy,hz],[hx,-hy,hz],[hx,hy,hz],[-hx,hy,hz]];
    const N=[[0,0,-1],[0,0,1],[0,-1,0],[0,1,0],[-1,0,0],[1,0,0]];
    const F=[[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[4,5,1,0],[3,2,6,7]];
    for(let f=0;f<6;f++){
      const face=F[f], n=N[f];
      for(let vi=0;vi<4;vi++){
        const p=V[face[vi]];
        const wx=p[0]*c+p[2]*s+cx;
        const wz=-p[0]*s+p[2]*c+cz;
        verts.push(wx,p[1]+cy,wz);
        norms.push(n[0],n[1],n[2]);
        uvs.push(vi===1||vi===2?1:0, vi===2||vi===3?1:0);
        if(col) cols.push(col[0],col[1],col[2]);
      }
    }
  }

  function mulberry32(a){ return function(){
    a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

  function groundColor(x,z){
    const lat=z/G7.SCALE+G7.LAT0, lon=x/G7.SX+G7.LON0;
    let r=.20,g=.30,b=.16;
    if(lon<-55&&lat<3&&lat>-12){r=.10;g=.22;b=.10;}          /* Amazônia  */
    else if(lat>-7){r=.58;g=.55;b=.36;}                       /* Nordeste  */
    else if(lat>-16){r=.38;g=.46;b=.22;}                      /* Cerrado   */
    else {r=.16;g=.34;b=.14;}                                 /* Sul       */
    const w=.07*Math.sin(x*.013)+.05*Math.sin(z*.021);
    return [r+w,g+w,b+w*.6];
  }

  G7.buildWorld = function(){
    G7.colliders = [];
    const scene = G7.scene = new THREE.Scene();

    /* ---- terras do Brasil com biomas ---- */
    const gp=new THREE.PlaneGeometry(52000,52000,140,140);
    const pos=gp.attributes.position, col=[];
    for(let i=0;i<pos.count;i++){
      const c=groundColor(pos.getX(i),-pos.getY(i));
      col.push(c[0],c[1],c[2]);
    }
    gp.setAttribute('color',new THREE.BufferAttribute(new Float32Array(col),3));
    gp.rotateX(-Math.PI/2);
    scene.add(new THREE.Mesh(gp,new THREE.MeshLambertMaterial({vertexColors:true})));

    /* ---- oceano Atlântico ---- */
    const coastX=G7.proj(-34.0,0).x;
    const oc=new THREE.Mesh(new THREE.PlaneGeometry(30000,52000),
      new THREE.MeshLambertMaterial({color:0x0a2f66,transparent:true,opacity:.94}));
    oc.position.set(coastX+15000,.5,0); oc.rotation.x=-Math.PI/2;
    scene.add(oc);

    /* ---- limita o mundo ---- */
    G7.WORLD={minX:-G7.proj(2,-74).x, maxX:G7.proj(0,-34).x, ...};

    /* ============ RODOVIAS NACIONAIS (rede MST + laços) ============ */
    G7.NETWORK=[];
    const cities=G7.CITIES, edges=[];
    for(let i=0;i<cities.length;i++) for(let j=i+1;j<cities.length;j++){
      const a=cities[i],b=cities[j],dx=a.x-b.x,dz=a.z-b.z;
      edges.push({i,j,d:dx*dx+dz*dz});
    }
    edges.sort((p,q)=>p.d-q.d);
    const uf=cities.map(()=>-1);
    function find(x){while(uf[x]>=0){if(uf[uf[x]]>=0)uf[x]=uf[uf[x]];x=uf[x];}return x;}
    for(const e of edges){
      const ra=find(e.i),rb=find(e.j); if(ra===rb)continue;
      uf[ra]=rb; G7.NETWORK.push({a:cities[e.i],b:cities[e.j]});
    }
    for(const c of cities){
      let best=null,bd=Infinity;
      for(const o of cities){ if(o===c)continue; const d=(o.x-c.x)**2+(o.z-c.z)**2; if(d<bd){bd=d;best=o;} }
      if(best&&!G7.NETWORK.some(e=>(e.a===c&&e.b===best)||(e.a===best&&e.b===c)))
        G7.NETWORK.push({a:c,b:best});
    }

    /* ---- desenha estradas (faixa + linha central tracejada) ---- */
    for(const ed of G7.NETWORK){
      const dx=ed.b.x-ed.a.x, dz=ed.b.z-ed.a.z;
      const len=Math.hypot(dx,dz), yaw=Math.atan2(dx,dz);
      addBox(ed.a.x+dx/2,.06,ed.a.z+dz/2,len+2,.12,9,yaw,[.16,.16,.2]);
      const steps=Math.floor(len/34);
      for(let s=1;s<steps;s++){
        const t=s/steps;
        addBox(ed.a.x+dx*t,.13,ed.a.z+dz*t,1,.02,12,yaw,[0.82,0.66,0.1]);
      }
    }

    /* ---- ruas em grade + anel viário + prédios neon + postes ---- */
    const roadMat=[];
    const lampCol=[1,.95,.75], poleCol=[.3,.3,.34];
    G7.CITIES.forEach(c=>{
      const B=56, n=Math.round(c.r/B);
      const len=(2*n+1)*B;
      for(let k=-n;k<=n;k++){
        addBox(c.x+k*B,.06,c.z,2,.12,len,0,[.15,.15,.19]);   /* ruas verticais   */
        addBox(c.x,.06,c.z+k*B,len,.12,2,0,[.15,.15,.19]);   /* ruas horizontais */
      }
      addBox(c.x,.06,c.z,len,.12,10,0,[.2,.2,.25]);          /* avenida central  */
      /* anel viário */
      const R=c.r+90, seg=26;
      for(let i=0;i<seg;i++){
        const a=i/seg*Math.PI*2;
        addBox(c.x+Math.cos(a)*R,.06,c.z+Math.sin(a)*R,14,.12,2*Math.PI*R/seg*.95,
               Math.atan2(-Math.sin(a),Math.cos(a)),[.18,.18,.22]);
      }
      /* prédios */
      const rand=mulberry32((c.x*73856093^c.z*19349663)>>>0);
      for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){
        if(rand()<.42){
          const px=c.x+i*B+B/2+(rand()*16-8), pz=c.z+j*B+B/2+(rand()*16-8);
          const w=rand()*18+8, d=w*(rand()*1.2+.5);
          let h=rand()*60+12; if(c.cap)h*=1.5;
          const ton=rand()*.15+.12;
          const base=[ton+rand()*.05,ton+.08+rand()*.05,ton+.2+rand()*.1];
          addBox(px,h/2,pz,w,h,d,0,base);
          /* janelas neon */
          if(rand()<.5){
            const neon=[[0.0,0.9,1],[1,0.2,0.9],[0.2,1,0.7],[1,0.9,0.2]][(Math.random()*4)|0];
            addBox(px+(w/2+0.05 - (rand()<.5?w+.1:0)),h*.55,pz,0.7,h*.5,2,0,neon);
          }
          G7.colliders.push({x:px,z:pz,hx:w/2+1,hz:d/2+1,h:h});
        }
      }
      /* postes de luz */
      for(let k=-n;k<=n;k+=2)for(let m=-n;m<=n;m+=2){
        addBox(c.x+k*B+B/2,3,c.z+m*B+B/2,.7,6,.7,0,poleCol);
        addBox(c.x+k*B+B/2,6.2,c.z+m*B+B/2,2.2,.4,1.4,0,lampCol);
      }
    });

    /* ---- árvores: Amazônia cheia, resto ralo ---- */
    const rand=mulberry32(12345);
    for(let i=0;i<9000;i++){
      const x=(rand()*2-1)*14000, z=(rand()*2-1)*14000;
      const lat=z/G7.SCALE+G7.LAT0, lon=x/G7.SX+G7.LON0;
      const amazon=(lon<-56&&lat<2&&lat>-10), cerrado=(lat>-16&&lat<-8&&lon>-56);
      const p=amazon?.5:(cerrado?.18:0);
      if(rand()<p){
        addBox(x,4,z,2.2,8,2.2,0,[.35,.22,.08]);
        const g=[.05+rand()*.06,.3+rand()*.1,.08+rand()*.04];
        addBox(x,12,z,15,10,15,0,g);
        addBox(x,19,z,9,8,9,0,g);
        addBox(x,25,z,4,6,4,0,g);
      }
    }

    scene.add(flushGeo(new THREE.MeshLambertMaterial({color:0x27272f})));
    scene.add(flushGeo(new THREE.MeshLambertMaterial({color:0xffd700})));
    scene.add(flushGeo(new THREE.MeshLambertMaterial({vertexColors:true})));
    scene.add(flushGeo(new THREE.MeshBasicMaterial({vertexColors:true})));

    /* ---- luzes ---- */
    scene.add(new THREE.HemisphereLight(0xbfd8ff,0x22330f,.9));
    G7.sun=new THREE.DirectionalLight(0xfff2cc,1.4);
    G7.sun.position.set(3000,6000,2000);
    scene.add(G7.sun);
    scene.add(new THREE.AmbientLight(0x223355,.5));

    G7.groundH=()=>0.5;
  };
})();

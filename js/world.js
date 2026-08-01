/* ============ MUNDO 3D: terreno, oceano, rodovias, cidades ============ */
(function(){
  const G7 = window.G7;
  const THREE = window.THREE;

  let verts, norms, uvs;
  function resetGeo(){ verts = []; norms = []; uvs = []; }
  function flushGeo(mat){
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute('normal',   new THREE.Float32BufferAttribute(norms, 3));
    g.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
    return new THREE.Mesh(g, mat);
  }
  /* Adiciona uma caixa (talvez rotacionada no eixo Y) à geometria mesclada */
  function addBox(cx, cy, cz, sx, sy, sz, yaw){
    const hx = sx/2, hy = sy/2, hz = sz/2, c = Math.cos(yaw), s = Math.sin(yaw);
    const V = [
      [-hx,-hy,-hz],[ hx,-hy,-hz],[ hx, hy,-hz],[-hx, hy,-hz],
      [-hx,-hy, hz],[ hx,-hy, hz],[ hx, hy, hz],[-hx, hy, hz]
    ];
    const N = [[ 0, 0,-1],[ 0, 0, 1],[ 0,-1, 0],[ 0, 1, 0],[-1, 0, 0],[ 1, 0, 0]];
    const F = [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[4,5,1,0],[3,2,6,7]];
    for(let fi=0; fi<6; fi++){
      const f = F[fi], n = N[fi];
      for(let vi=0; vi<4; vi++){
        const p = V[f[vi]];
        const wx = p[0]*c + p[2]*s + cx;
        const wz = -p[0]*s + p[2]*c + cz;
        verts.push(wx, p[1]+cy, wz);
        norms.push(n[0], n[1], n[2]);
        uvs.push(vi===1||vi===2 ? 1:0, vi===2||vi===3 ? 1:0);
      }
    }
  }

  function groundColor(x, z){
    const lat = z / G7.SCALE + G7.LAT0;      // latitude aproximada
    const lon = x / G7.SX + G7.LON0;
    let r=0.20, g=0.30, b=0.16;
    if(lon < -55 && lat < 3 && lat > -12){ r=0.10; g=0.22; b=0.10; }        // Amazônia
    else if(lat > -7){ r=0.58; g=0.55; b=0.36; }                            // Nordeste seco
    else if(lat > -16){ r=0.38; g=0.46; b=0.22; }                           // Cerrado
    else { r=0.16; g=0.34; b=0.14; }                                        // Sul
    const wob = 0.08*Math.sin(x*0.013) + 0.05*Math.sin(z*0.021);            // textura
    return [r+wob, g+wob, b+wob*0.6];
  }

  G7.buildWorld = function(){
    const scene = G7.scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87b8e8, 600, 6500);

    /* --------- TERRENO DO BRASIL (com biomas por latitude) --------- */
    const gPlane = new THREE.PlaneGeometry(52000, 52000, 120, 120);
    const colors = [];
    const pos = gPlane.attributes.position;
    for(let i=0;i<pos.count;i++){
      const col = groundColor(pos.getX(i), -pos.getY(i));   // z do mundo = -y local
      colors.push(col[0], col[1], col[2]);
    }
    gPlane.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    gPlane.rotateX(-Math.PI/2);
    const ground = new THREE.Mesh(gPlane, new THREE.MeshLambertMaterial({vertexColors:true}));
    scene.add(ground);

    /* --------- OCEANO ATLÂNTICO (leste) --------- */
    const coastX = G7.proj(-34.4, 0).x;
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(30000, 52000),
      new THREE.MeshLambertMaterial({ color:0x0a2f66, transparent:true, opacity:.92 })
    );
    ocean.position.set(coastX + 15000, 0.5, 0);
    ocean.rotation.x = -Math.PI/2;
    scene.add(ocean);

    /* --------- RODOVIAS E RUAS (uma única geometria) --------- */
    resetGeo();
    const matRoad = new THREE.MeshLambertMaterial({ color:0x24242e });

    G7.CITIES.forEach(c=>{
      const B = 56;                                   // tamanho do quarteirão
      const n = Math.round(c.r / B);
      for(let k=-n;k<=n;k++){
        addBox(c.x + k*B, 0.

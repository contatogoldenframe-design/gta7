/* ============ CLIMA EM TEMPO REAL (Open-Meteo — grátis) ============ */
(function(){
  const G7 = window.G7;

  function hourFromTime(t){              // "2026-08-01T14:30" -> 14.5
    if(!t) return null;
    const m = t.match(/T(\d+):(\d+)/);
    return m ? (+m[1]) + (+m[2])/60 : null;
  }

  /* Código meteorológico da OMM -> clima do jogo */
  function classify(code){
    if(code === 0) return {cloud:0,  rain:0, fog:0, thunder:false};
    if(code === 1) return {cloud:.3, rain:0, fog:0, thunder:false};
    if(code === 2) return {cloud:.5, rain:0, fog:0, thunder:false};
    if(code === 3) return {cloud:.75,rain:0, fog:0, thunder:false};
    if(code === 45 || code === 48) return {cloud:.7, rain:0, fog:1, thunder:false};
    if(code >= 51 && code <= 57) return {cloud:.7,  rain:1, fog:0, thunder:false};
    if(code >= 61 && code <= 67) return {cloud:.8,  rain:2, fog:.2, thunder:false};
    if(code >= 71 && code <= 77) return {cloud:.85, rain:0, fog:.6, thunder:false};
    if(code >= 80 && code <= 82) return {cloud:.85, rain:2.4, fog:.2, thunder:false};
    if(code >= 95) return {cloud:.95, rain:3, fog:.3, thunder:true};
    return {cloud:.5, rain:0, fog:0, thunder:false};
  }

  /* Clima simulado (fallback se ficar sem internet) */
  function simulated(c){
    const s = Math.sin(c.lat*3 + c.lon*5) * 7 + Math.cos(c.lat*9 - c.lon*2) * 5;
    const drift = (Date.now()/3600000 + s) % 1;
    const temp = 22 + s + (drift*6-3);
    const code = drift < .45 ? 0 : drift < .6 ? 2 : drift < .75 ? 3 : (drift < .95 ? 63 : 95);
    c.weather = Object.assign({code, temp:Math.round(temp), wind:6+((s*13)%10), hour: 12, day:true, simulated:true}, classify(code));
  }

  G7.loadWeather = function(){
    return new Promise(resolve=>{
      let done = false;
      const fin = () => { if(!done){ done = true; resolve(); } };
      G7.CITIES.forEach(c=>{
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + c.lat +
                    '&longitude=' + c.lon +
                    '&current=temperature_2m,weather_code,wind_speed_10m,is_day&forecast_days=1&timezone=auto';
        fetch(url)
          .then(r => r.json())
          .then(j => {
            const cur = j && j.current;
            if(!cur) throw 0;
            const hr = hourFromTime(cur.time);
            const h = hr === null ? 12 : hr;
            c.weather = Object.assign({
              code: cur.weather_code, temp: Math.round(cur.temperature_2m),
              wind: Math.round(cur.wind_speed_10m), hour: h,
              day: cur.is_day !== undefined ? !!cur.is_day : (h >= 6 && h < 18),
              simulated: false
            }, classify(cur.weather_code));
          })
          .catch(()=> simulated(c))
          .finally(()=> fin());
      });
      setTimeout(fin, 7000);          // nunca deixa o jogo preso esperando
    });
  };

  /* Atualiza o clima global do jogador conforme a cidade mais próxima */
  G7.updateWeather = function(){
    const p = G7.playerPos;
    let best = null, bd = Infinity;
    for(const c of G7.CITIES){
      const d = (c.x-p.x)*(c.x-p.x) + (c.z-p.z)*(c.z-p.z);
      if(d < bd){ bd = d; best = c; }
    }
    G7.cityNow = best;
    if(best && best.weather) G7.W = best.weather; else { if(!G7.W) G7.W = {cloud:.5, rain:0, fog:0, thunder:false, temp:24, wind:8, hour:12, day:true, simulated:true}; }
  };

  /* Re-consulta o clima real a cada 15 minutos */
  G7.weatherTimer = 0;
  setInterval(()=>{ if(G7.started) G7.loadWeather(); }, 900000);
})();

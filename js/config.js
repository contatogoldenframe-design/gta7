/* ============ GTA 7 — BRASIL | CONFIGURAÇÃO DO MUNDO ============ */
window.G7 = window.G7 || {};
const G7 = window.G7;

G7.SCALE = 400;                       // unidades do jogo por grau de latitude
G7.LAT0  = -15;                       // centro do Brasil
G7.LON0  = -47;
G7.SX    = G7.SCALE * Math.cos(G7.LAT0 * Math.PI / 180);

/* Converte GPS (lat/lon reais) em coordenadas do mundo do jogo */
G7.proj = function(lat, lon){
  return { x: (lon - G7.LON0) * G7.SX, z: (G7.LAT0 - lat) * G7.SCALE };
};

/* -------- 27 ESTADOS + CAPITAIS (coordenadas GPS reais) -------- */
G7.STATES = [
 {uf:"AC", nome:"Acre",               capital:"Rio Branco",     lat:-9.974,  lon:-67.824},
 {uf:"AL", nome:"Alagoas",            capital:"Maceió",         lat:-9.666,  lon:-35.735},
 {uf:"AP", nome:"Amapá",              capital:"Macapá",         lat: 0.035,  lon:-51.070},
 {uf:"AM", nome:"Amazonas",           capital:"Manaus",         lat:-3.119,  lon:-60.021},
 {uf:"BA", nome:"Bahia",              capital:"Salvador",       lat:-12.977, lon:-38.501},
 {uf:"CE", nome:"Ceará",              capital:"Fortaleza",      lat:-3.719,  lon:-38.543},
 {uf:"DF", nome:"Distrito Federal",   capital:"Brasília",       lat:-15.794, lon:-47.882},
 {uf:"ES", nome:"Espírito Santo",     capital:"Vitória",        lat:-20.315, lon:-40.312},
 {uf:"GO", nome:"Goiás",              capital:"Goiânia",        lat:-16.686, lon:-49.264},
 {uf:"MA", nome:"Maranhão",           capital:"São Luís",       lat:-2.530,  lon:-44.302},
 {uf:"MT", nome:"Mato Grosso",        capital:"Cuiabá",         lat:-15.601, lon:-56.097},
 {uf:"MS", nome:"Mato Grosso do Sul", capital:"Campo Grande",   lat:-20.469, lon:-54.620},
 {uf:"MG", nome:"Minas Gerais",       capital:"Belo Horizonte", lat:-19.917, lon:-43.934},
 {uf:"PA", nome:"Pará",               capital:"Belém",          lat:-1.455,  lon:-48.504},
 {uf:"PB", nome:"Paraíba",            capital:"João Pessoa",    lat:-7.115,  lon:-34.864},
 {uf:"PR", nome:"Paraná",             capital:"Curitiba",       lat:-25.428, lon:-49.273},
 {uf:"PE", nome:"Pernambuco",         capital:"Recife",         lat:-8.047,  lon:-34.877},
 {uf:"PI", nome:"Piauí",              capital:"Teresina",       lat:-5.092,  lon:-42.803},
 {uf:"RJ", nome:"Rio de Janeiro",     capital:"Rio de Janeiro", lat:-22.907, lon:-43.173},
 {uf:"RN", nome:"Rio Grande do Norte",capital:"Natal",          lat:-5.795,  lon:-35.209},
 {uf:"RS", nome:"Rio Grande do Sul",  capital:"Porto Alegre",   lat:-30.034, lon:-51.218},
 {uf:"RO", nome:"Rondônia",           capital:"Porto Velho",    lat:-8.761,  lon:-63.903},
 {uf:"RR", nome:"Roraima",            capital:"Boa Vista",      lat: 2.820,  lon:-60.672},
 {uf:"SC", nome:"Santa Catarina",     capital:"Florianópolis",  lat:-27.595, lon:-48.548},
 {uf:"SP", nome:"São Paulo",          capital:"São Paulo",      lat:-23.551, lon:-46.633},
 {uf:"SE", nome:"Sergipe",            capital:"Aracaju",        lat:-10.947, lon:-37.073},
 {uf:"TO", nome:"Tocantins",          capital:"Palmas",         lat:-10.184, lon:-48.334}
];

/* -------- 27 CAPITAIS + 30 GRANDES CIDADES (GPS real) -------- */
function cap(r){ const s=G7.STATES.find(x=>x.uf===r); return {id:r.toLowerCase(), nome:s.capital, uf:r, lat:s.lat, lon:s.lon, cap:true}; }
const UF = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

G7.CITIES = UF.map(cap);
G7.CITIES = G7.CITIES.concat([
 {id:"cam", nome:"Campinas",             uf:"SP", lat:-22.909, lon:-47.063},
 {id:"san", nome:"Santos",               uf:"SP", lat:-23.960, lon:-46.333},
 {id:"gru", nome:"Guarulhos",            uf:"SP", lat:-23.462, lon:-46.533},
 {id:"sbc", nome:"São Bernardo do Campo",uf:"SP", lat:-23.694, lon:-46.565},
 {id:"osa", nome:"Osasco",               uf:"SP", lat:-23.532, lon:-46.792},
 {id:"nit", nome:"Niterói",              uf:"RJ", lat:-22.883, lon:-43.103},
 {id:"dcx", nome:"Duque de Caxias",      uf:"RJ", lat:-22.785, lon:-43.312},
 {id:"nvg", nome:"Nova Iguaçu",          uf:"RJ", lat:-22.759, lon:-43.451},
 {id:"uba", nome:"Uberlândia",           uf:"MG", lat:-18.919, lon:-48.277},
 {id:"rpr", nome:"Ribeirão Preto",       uf:"SP", lat:-21.177, lon:-47.810},
 {id:"ldn", nome:"Londrina",             uf:"PR", lat:-23.310, lon:-51.162},
 {id:"mga", nome:"Maringá",              uf:"PR", lat:-23.425, lon:-51.938},
 {id:"jvl", nome:"Joinville",            uf:"SC", lat:-26.305, lon:-48.846},
 {id:"blu", nome:"Blumenau",             uf:"SC", lat:-26.919, lon:-49.066},
 {id:"cds", nome:"Caxias do Sul",        uf:"RS", lat:-29.168, lon:-51.179},
 {id:"pel", nome:"Pelotas",              uf:"RS", lat:-31.770, lon:-52.343},
 {id:"foz", nome:"Foz do Iguaçu",        uf:"PR", lat:-25.516, lon:-54.585},
 {id:"fds", nome:"Feira de Santana",     uf:"BA", lat:-12.267, lon:-38.967},
 {id:"vdc", nome:"Vitória da Conquista", uf:"BA", lat:-14.866, lon:-40.839},
 {id:"car", nome:"Caruaru",              uf:"PE", lat:-8.283,  lon:-35.976},
 {id:"jdn", nome:"Juazeiro do Norte",    uf:"CE", lat:-7.213,  lon:-39.315},
 {id:"sob", nome:"Sobral",               uf:"CE", lat:-3.686,  lon:-40.350},
 {id:"mos", nome:"Mossoró",              uf:"RN", lat:-5.188,  lon:-37.344},
 {id:"par", nome:"Parnaíba",             uf:"PI", lat:-2.905,  lon:-41.777},
 {id:"imp", nome:"Imperatriz",           uf:"MA", lat:-5.526,  lon:-47.476},
 {id:"mab", nome:"Marabá",               uf:"PA", lat:-5.369,  lon:-49.117},
 {id:"stm", nome:"Santarém",             uf:"PA", lat:-2.443,  lon:-54.708},
 {id:"cgr", nome:"Campina Grande",       uf:"PB", lat:-7.230,  lon:-35.881}
]);

/* Converte todas as cidades para coordenadas 3D e define tamanhos */
G7.CITIES.forEach(c=>{
  const p = G7.proj(c.lat, c.lon);
  c.x = p.x; c.z = p.z;
  c.r  = c.cap ? 700 : 470;                    // raio da malha urbana
  c.pop = c.cap ? 22 : 10;                     // trânsito/pedestres
  c.weather = null;
});

G7.byId = {};
G7.CITIES.forEach(c=> G7.byId[c.id] = c);

G7.edgeSet = new Set();   // usadas pela rede de rodovias (world.js)
G7.NETWORK = [];

/* Progresso salvo */
G7.saveData = null;
try { G7.saveData = JSON.parse(localStorage.getItem('gta7_br') || 'null'); } catch(e){}
G7.money = (G7.saveData && G7.saveData.money) ? G7.saveData.money : 1500;
G7.savedCity = (G7.saveData && G7.saveData.city) ? G7.saveData.city : null;

G7.save = function(){
  try {
    localStorage.setItem('gta7_br', JSON.stringify({ money: G7.money, city: G7.playerCity ? G7.playerCity.id : null }));
  } catch(e){}
};
